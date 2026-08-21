// Output parity: run every program through BOTH the native fluid-* executables
// and the WebAssembly modules, on the same input with the same arguments, and
// check they produce the same numbers.
//
// This is what makes the WebAssembly build trustworthy as *the same tools*
// rather than a lookalike: the CMake build compiles identical sources, and this
// confirms the identical sources still behave identically after Emscripten,
// libc++ and wasm-opt have had their turn.
//
// Requires native binaries. From the repository root:
//   cmake -S . -B build-native -DCMAKE_BUILD_TYPE=Release \
//         -DFLUCOMA_CLI_RUNTIME_OUTPUT_DIRECTORY="$PWD/build-native/bin"
//   cmake --build build-native --parallel
//   FLUID_NATIVE_BIN=build-native/bin node test/parity.mjs
//
// Programs seeded from a random source (the NMF family) can't be compared value
// for value — so rather than carry a hand-maintained exemption list that can go
// stale, each program is *measured*: run natively twice, and if its own output
// doesn't reproduce, only the shape of the result is compared.

import { Fluid, CATALOG, decodeWav, encodeWav } from '../src/index.js';
import { ok, eq, section, done, SR } from './helpers.mjs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const NATIVE = resolve(process.env.FLUID_NATIVE_BIN || 'build-native/bin');
const dir = mkdtempSync(join(tmpdir(), 'fluid-parity-'));
const fluid = new Fluid();

// Sample values are the same float32 arithmetic on both sides, but not
// necessarily in the same order: the native build is free to vectorise or
// contract to FMA where wasm's SIMD-less codegen is not. Differences that
// survive that are the ones worth failing over.
const TOL = 1e-5;

/** Audio with something for every kind of program to find: bursts over a tone. */
function testAudio(hz = 330) {
  const n = SR; // one second
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t);
    x[i] = 0.4 * env * Math.sin(2 * Math.PI * hz * t);
    // transient every 250 ms, so onset/transient/slice programs have events
    if (i % 11025 < 60) x[i] += 0.5 * (1 - (i % 11025) / 60);
  }
  return encodeWav({ sampleRate: SR, channelData: [x] });
}

/** A non-negative ramp: fluid-stats rejects a weights buffer that goes below zero. */
function weightAudio() {
  const x = new Float32Array(SR);
  for (let i = 0; i < SR; i++) x[i] = 0.25 + 0.5 * (i / SR);
  return encodeWav({ sampleRate: SR, channelData: [x] });
}

const SOURCES = {
  source: testAudio(330),
  sourceA: testAudio(330),
  sourceB: testAudio(247),
  target: testAudio(247),
  weights: weightAudio(),
};

/**
 * The argv both sides run, plus the files it names. Outputs are always written
 * as WAV so one comparison covers every program: the CLI writes CSV only when
 * asked for a .csv filename.
 */
function plan(entry, tag) {
  const argv = [];
  const inputs = {};   // real path -> bytes
  const outputs = {};  // output name -> real path

  for (const name of entry.inputs) {
    const bytes = SOURCES[name] ?? SOURCES.source;
    const path = join(dir, `${entry.program}-${tag}-${name}.wav`);
    writeFileSync(path, bytes);
    inputs[path] = bytes;
    argv.push(`-${name.toLowerCase()}`, path);
  }
  for (const name of entry.outputs) {
    const path = join(dir, `${entry.program}-${tag}-${name}.wav`);
    outputs[name] = path;
    argv.push(`-${name.toLowerCase()}`, path);
  }
  // The NMF family seeds from the clock unless told otherwise. Pinning the seed
  // buys a value-for-value comparison instead of a shape-only one.
  if (entry.params.some((p) => p.name.toLowerCase() === 'seed')) argv.push('-seed', '1');
  return { argv, inputs, outputs };
}

// Which outputs a program writes depends on its parameters — fluid-stft writes
// no resynthesis unless asked to invert, fluid-nmf no resynthesis unless asked
// to resynthesise. So parity is "the same files, with the same contents", not
// "every declared output exists".
function readOutputs(outputs) {
  const out = {};
  for (const [name, path] of Object.entries(outputs)) {
    if (existsSync(path)) out[name] = decodeWav(readFileSync(path));
  }
  return out;
}

function runNative(program, argv) {
  execFileSync(join(NATIVE, program), argv, { stdio: 'pipe' });
}

async function runWasm(program, { argv, inputs, outputs }) {
  // MEMFS paths mirror the real ones so the two command lines are identical
  // apart from the directory the files live in.
  const virt = (p) => '/' + p.split('/').pop();
  const memArgv = argv.map((a) => (a.startsWith('/') || a.includes(dir) ? virt(a) : a));
  const memInputs = Object.fromEntries(
    Object.entries(inputs).map(([p, bytes]) => [virt(p), bytes])
  );
  const memOutputs = Object.values(outputs).map(virt);

  const res = await fluid.run(program, memArgv, { inputs: memInputs, outputs: memOutputs });
  if (res.exitCode !== 0) throw new Error(`exit ${res.exitCode}: ${res.stderr || res.stdout}`);

  const decoded = {};
  for (const [name, path] of Object.entries(outputs)) {
    const bytes = res.outputs[virt(path)];
    if (bytes?.length) decoded[name] = decodeWav(bytes);
  }
  return decoded;
}

/** Largest absolute difference between two decoded buffers, or a description of why they can't be compared. */
function compare(a, b) {
  if (a.channelData.length !== b.channelData.length) {
    return { problem: `channel count ${a.channelData.length} vs ${b.channelData.length}` };
  }
  if (a.sampleRate !== b.sampleRate) {
    return { problem: `sample rate ${a.sampleRate} vs ${b.sampleRate}` };
  }
  let worst = 0;
  for (let c = 0; c < a.channelData.length; c++) {
    const x = a.channelData[c];
    const y = b.channelData[c];
    if (x.length !== y.length) return { problem: `channel ${c} length ${x.length} vs ${y.length}` };
    for (let i = 0; i < x.length; i++) {
      const d = Math.abs(x[i] - y[i]);
      if (d > worst) worst = d;
    }
  }
  return { worst };
}

/** Same shape, values ignored — for programs whose own output doesn't reproduce. */
function sameShape(a, b) {
  if (a.channelData.length !== b.channelData.length) {
    return `channel count ${a.channelData.length} vs ${b.channelData.length}`;
  }
  for (let c = 0; c < a.channelData.length; c++) {
    if (a.channelData[c].length !== b.channelData[c].length) {
      return `channel ${c} length ${a.channelData[c].length} vs ${b.channelData[c].length}`;
    }
  }
  return null;
}

section(`native binaries: ${NATIVE}`);

const programs = Object.keys(CATALOG).filter((p) => existsSync(join(NATIVE, p)));
const absent = Object.keys(CATALOG).filter((p) => !existsSync(join(NATIVE, p)));
ok(programs.length > 0,
  `found native executables (${programs.length} of ${Object.keys(CATALOG).length})`);
if (absent.length) console.log(`  not built natively, skipped: ${absent.join(', ')}`);

section('wasm output matches native');

let nondeterministic = 0;

for (const program of programs) {
  const entry = CATALOG[program];

  const first = plan(entry, 'nat1');
  const second = plan(entry, 'nat2');
  const wasmPlan = plan(entry, 'wasm');

  let nativeA, nativeB, wasm;
  try {
    runNative(program, first.argv);
    runNative(program, second.argv);
    nativeA = readOutputs(first.outputs);
    nativeB = readOutputs(second.outputs);
  } catch (e) {
    ok(false, `${program}: native run failed — ${e.message.split('\n')[0]}`);
    continue;
  }
  const produced = Object.keys(nativeA);
  if (!produced.length) {
    ok(false, `${program}: native run wrote no output at all — nothing to compare`);
    continue;
  }

  try {
    wasm = await runWasm(program, wasmPlan);
  } catch (e) {
    ok(false, `${program}: wasm run failed — ${e.message.split('\n')[0]}`);
    continue;
  }
  const wasmProduced = Object.keys(wasm);
  eq(wasmProduced.sort().join(','), produced.slice().sort().join(','),
    `${program} writes the same outputs as native`);

  // Does the native build even reproduce itself? Anything seeded from a random
  // source will not, and is compared by shape alone.
  const reproduces = produced.every((name) => {
    if (!nativeB[name]) return false;
    const { worst, problem } = compare(nativeA[name], nativeB[name]);
    return !problem && worst <= TOL;
  });
  if (!reproduces) nondeterministic++;

  for (const name of produced) {
    if (!wasm[name]) continue; // already reported by the set comparison above
    const label = `${program} -${name}`;
    if (reproduces) {
      const { worst, problem } = compare(nativeA[name], wasm[name]);
      if (problem) ok(false, `${label}: ${problem}`);
      else ok(worst <= TOL, `${label} matches native (max diff ${worst.toExponential(2)})`);
    } else {
      const problem = sameShape(nativeA[name], wasm[name]);
      ok(!problem, `${label} has the same shape as native (values vary per run${problem ? `: ${problem}` : ''})`);
    }
  }
}

section('fluid-stft inverse round trip');

// The forward pass above only exercises the *write* side of the buffer adaptor's
// (channels, frames) view. Inverting reads a magnitude and a phase buffer back
// through the same view, and nothing else in the catalogue does — a program is
// only run with its declared outputs, and -resynth stays empty unless -inverse
// is set. So drive it by hand.
{
  const sourcePath = join(dir, 'stft-inv-source.wav');
  writeFileSync(sourcePath, SOURCES.source);
  const magPath = join(dir, 'stft-inv-magnitude.wav');
  const phasePath = join(dir, 'stft-inv-phase.wav');
  const nativeResynth = join(dir, 'stft-inv-resynth-native.wav');

  try {
    runNative('fluid-stft', ['-source', sourcePath, '-magnitude', magPath, '-phase', phasePath]);
    runNative('fluid-stft', ['-inverse', '1', '-magnitude', magPath, '-phase', phasePath,
                             '-resynth', nativeResynth]);
  } catch (e) {
    ok(false, `fluid-stft -inverse: native run failed — ${e.message.split('\n')[0]}`);
  }

  if (existsSync(nativeResynth)) {
    const mag = readFileSync(magPath);
    const phase = readFileSync(phasePath);
    const wasm = await runWasm('fluid-stft', {
      argv: ['-inverse', '1', '-magnitude', magPath, '-phase', phasePath,
             '-resynth', join(dir, 'stft-inv-resynth-wasm.wav')],
      inputs: { [magPath]: mag, [phasePath]: phase },
      outputs: { resynth: join(dir, 'stft-inv-resynth-wasm.wav') },
    });

    const native = decodeWav(readFileSync(nativeResynth));
    if (!wasm.resynth) {
      ok(false, 'fluid-stft -inverse: wasm wrote no resynthesis');
    } else {
      const { worst, problem } = compare(native, wasm.resynth);
      if (problem) ok(false, `fluid-stft -inverse -resynth: ${problem}`);
      else ok(worst <= TOL,
        `fluid-stft -inverse -resynth matches native (max diff ${worst.toExponential(2)})`);
    }

    // Both builds agreeing is not enough here: a view that reads the spectrogram
    // the wrong way round would be wrong identically on both. Analysis followed
    // by resynthesis has to give the input back.
    const source = decodeWav(SOURCES.source);
    const a = source.channelData[0];
    const b = native.channelData[0];
    let drift = 0;
    for (let i = 0, n = Math.min(a.length, b.length); i < n; i++) {
      drift = Math.max(drift, Math.abs(a[i] - b[i]));
    }
    ok(drift <= 1e-5,
      `fluid-stft analysis then resynthesis reconstructs the source (max diff ${drift.toExponential(2)})`);
  }
}

section('help and version text');

// The regex the CLI wrapper used for these was replaced with plain string
// matching; both builds share the source, so both must still answer the same.
for (const flag of ['-h', '--help', 'help', '-v', '--version', 'version']) {
  const program = programs[0];
  if (!program) break;
  const native = execFileSync(join(NATIVE, program), [flag], { encoding: 'utf8' });
  const wasm = (await fluid.run(program, [flag])).stdout;
  eq(wasm.trim(), native.trim(), `${program} ${flag} prints the same text as native`);
}

if (nondeterministic) {
  console.log(`\n${nondeterministic} program(s) do not reproduce their own output ` +
    `natively; those were compared by shape only.`);
}

done('parity');
