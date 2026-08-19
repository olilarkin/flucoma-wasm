#!/usr/bin/env node
// fluid — run the FluCoMa command-line programs against audio files on disk.
//
// A faithful wrapper over the WebAssembly build: you invoke it exactly like the
// native tools, with the program name as the first argument.
//
//   fluid noveltyslice -source in.wav -indices out.wav -threshold 0.4
//   fluid mfcc -source in.wav -features mfcc.csv -numcoeffs 13
//   fluid hpss -source in.wav -harmonic h.wav -percussive p.wav
//
// The `fluid-` prefix is optional, so `fluid mfcc` and `fluid fluid-mfcc` are
// the same command. File arguments are staged into the in-memory filesystem and
// written back to disk afterwards; everything else is passed through untouched.
//
// Meta commands:
//   fluid list [kind]        list the bundled programs
//   fluid help <program>     describe a program's parameters
//   fluid version
//
// See `fluid --help`.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, basename, extname, resolve } from 'node:path';
import { Fluid, CATALOG, PROGRAMS, kindOf, describe, checkValue } from '../src/index.js';

const KINDS = ['slicer', 'analyser', 'decomposer', 'stats'];
const META = new Set(['list', 'help', 'version', 'doctor']);

function fail(msg) {
  console.error(`fluid: ${msg}`);
  process.exit(1);
}

/** Accept both `mfcc` and `fluid-mfcc`. */
function resolveProgram(name) {
  const full = name.startsWith('fluid-') ? name : `fluid-${name}`;
  if (CATALOG[full]) return full;
  const near = PROGRAMS.filter((p) => p.includes(name.replace(/^fluid-/, '')));
  fail(`unknown program "${name}"` +
    (near.length ? `; did you mean ${near.map((p) => p.replace('fluid-', '')).join(', ')}?`
      : `. Run 'fluid list' to see them all.`));
}

const argv = process.argv.slice(2);
if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
  printHelp();
  process.exit(0);
}
if (argv[0] === '-v' || argv[0] === '--version') {
  await printVersion();
  process.exit(0);
}

if (META.has(argv[0])) {
  const rest = argv.slice(1);
  if (argv[0] === 'list') cmdList(rest[0]);
  else if (argv[0] === 'help') cmdHelp(rest[0]);
  else if (argv[0] === 'version') await printVersion();
  else if (argv[0] === 'doctor') await cmdDoctor();
  process.exit(0);
}

await runProgram(resolveProgram(argv[0]), argv.slice(1));

// ---- running a program ------------------------------------------------------

async function runProgram(program, args) {
  const entry = CATALOG[program];
  // Which options name a file: the buffer parameters. Everything else is a
  // plain value and is forwarded verbatim, so numbers and negative numbers can
  // never be mistaken for paths.
  const inputOpts = new Map(entry.params.filter((p) => p.type === 'inputBuffer').map((p) => [p.option, p]));
  const outputOpts = new Map(entry.params.filter((p) => p.type === 'buffer' || p.type === 'bufferArray').map((p) => [p.option, p]));
  const valueOpts = new Map(entry.params
    .filter((p) => !inputOpts.has(p.option) && !outputOpts.has(p.option))
    .map((p) => [p.option, p]));

  const staged = {};        // virtual path -> bytes
  const writeBack = [];     // { virtual, real }
  const out = [];           // the argv handed to the program

  for (let i = 0; i < args.length; i++) {
    const tok = args[i];
    const opt = tok.toLowerCase();

    if (inputOpts.has(opt)) {
      const real = args[++i];
      if (real === undefined) fail(`${tok} needs a file path`);
      if (!existsSync(real)) fail(`no such file: ${real}`);
      const virt = `/in_${inputOpts.get(opt).name}${extname(real) || '.wav'}`;
      staged[virt] = new Uint8Array(readFileSync(real));
      out.push(tok, virt);
      continue;
    }

    if (outputOpts.has(opt)) {
      const real = args[++i];
      if (real === undefined) fail(`${tok} needs a file path`);
      // Keep the extension: the CLI writes CSV when the name ends in .csv.
      const virt = `/out_${outputOpts.get(opt).name}${extname(real) || '.wav'}`;
      writeBack.push({ virtual: virt, real });
      out.push(tok, virt);
      continue;
    }

    // Out-of-range values are not caught by the programs; they reach the
    // algorithms and trap the WebAssembly module, which surfaces as a raw
    // wasm stack trace. Check them here, against the constraints the parameter
    // was declared with, so the user gets a sentence instead.
    if (valueOpts.has(opt)) {
      const n = Number(args[i + 1]);
      if (args[i + 1] !== undefined && Number.isFinite(n)) {
        try {
          checkValue(valueOpts.get(opt), n, program);
        } catch (e) {
          fail(e.message);
        }
      }
    }

    out.push(tok);
  }

  const fluid = new Fluid();
  let res;
  try {
    res = await fluid.run(program, out, {
      inputs: staged,
      outputs: writeBack.map((w) => w.virtual),
    });
  } catch (e) {
    // A trap inside the module leaves it unusable, and its stack is all
    // wasm frames — report it as the crash it is rather than dumping that.
    fail(`${program} crashed: ${e.message}\n` +
      `       this usually means a parameter value the program cannot handle; ` +
      `run 'fluid help ${program.replace('fluid-', '')}' to see the valid ranges.`);
  }

  if (res.stdout.trim()) process.stdout.write(res.stdout);
  if (res.stderr.trim()) process.stderr.write(res.stderr);

  let wrote = 0;
  for (const { virtual, real } of writeBack) {
    const bytes = res.outputs[virtual];
    if (!bytes) continue;
    mkdirSync(dirname(resolve(real)), { recursive: true });
    writeFileSync(real, bytes);
    wrote++;
  }

  if (res.exitCode !== 0) {
    process.exit(res.exitCode < 0 ? 1 : res.exitCode);
  }
  // A zero exit with no file written means the program declined to produce
  // output — reporting success there would be a lie.
  if (writeBack.length && wrote === 0) {
    fail(`${program} produced no output`);
  }
}

// ---- meta commands ----------------------------------------------------------

function cmdList(kind) {
  if (kind && !KINDS.includes(kind)) {
    fail(`unknown kind "${kind}". Choose from: ${KINDS.join(', ')}`);
  }
  for (const k of kind ? [kind] : KINDS) {
    const names = PROGRAMS.filter((p) => kindOf(p) === k);
    if (!names.length) continue;
    console.log(`\n${k}:`);
    for (const p of names) {
      const e = CATALOG[p];
      console.log(`  ${p.replace('fluid-', '').padEnd(16)} ${e.inputs.join(', ')} -> ${e.outputs.join(', ')}`);
    }
  }
  console.log('');
}

function cmdHelp(name) {
  if (!name) fail(`usage: fluid help <program>`);
  const program = resolveProgram(name);
  const entry = describe(program);
  console.log(`\n${program}  (${entry.client}, ${kindOf(program)})`);
  console.log(`  reads:  ${entry.inputs.join(', ') || '(nothing)'}`);
  console.log(`  writes: ${entry.outputs.join(', ') || '(nothing)'}`);
  console.log(`  docs:   ${entry.docs || 'https://learn.flucoma.org/reference/'}\n`);
  for (const p of entry.params) {
    const bits = [];
    if (p.type === 'inputBuffer') bits.push('input file');
    else if (p.type === 'buffer' || p.type === 'bufferArray') bits.push('output file');
    else bits.push(p.type);
    if (p.size > 1) bits.push(`${p.size} values`);
    if (p.default !== undefined) bits.push(`default ${Array.isArray(p.default) ? p.default.join(' ') : p.default}`);
    if (p.min !== undefined) bits.push(`min ${p.min}`);
    if (p.max !== undefined) bits.push(`max ${p.max}`);
    if (p.odd) bits.push('odd');
    if (p.choices) bits.push(`choices: ${p.choices.join(' | ')}`);
    console.log(`  ${p.option.padEnd(18)} ${p.display}`);
    console.log(`  ${''.padEnd(18)} (${bits.join('; ')})`);
  }
  console.log('');
}

async function cmdDoctor() {
  const fluid = new Fluid();
  let onDisk = [];
  try {
    onDisk = await fluid.programs();
  } catch (e) {
    fail(`could not read the WebAssembly manifest: ${e.message}\n` +
      `       the package may need building — see scripts/build-wasm.sh`);
  }
  console.log(`wasm modules on disk: ${onDisk.length}`);
  console.log(`programs in catalog:  ${PROGRAMS.length}`);

  const missing = PROGRAMS.filter((p) => !onDisk.includes(p));
  const extra = onDisk.filter((p) => !PROGRAMS.includes(p));
  if (missing.length) console.log(`!! catalogued but not built: ${missing.join(', ')}`);
  if (extra.length) console.log(`!! built but not catalogued: ${extra.join(', ')}`);

  // Loading and running one program end to end proves the modules actually work
  // in this environment, which a file listing does not.
  try {
    const probe = onDisk[0];
    const res = await fluid.run(probe, ['-version']);
    console.log(`ran ${probe}: ${res.stdout.trim().split('\n')[0] || 'no output'}`);
  } catch (e) {
    fail(`a module failed to run: ${e.message}`);
  }
  console.log(missing.length || extra.length ? 'doctor: problems found' : 'doctor: all good');
}

async function printVersion() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  console.log(`${pkg.name} ${pkg.version}`);
  try {
    const res = await new Fluid().run(PROGRAMS[0], ['-version']);
    const line = res.stdout.trim().split('\n')[0];
    if (line) console.log(line);
  } catch { /* the toolkit version is a nicety, not worth failing over */ }
}

function printHelp() {
  console.log(`
fluid — the FluCoMa command-line programs, compiled to WebAssembly

usage:
  fluid <program> [options]     run a program (the 'fluid-' prefix is optional)
  fluid list [kind]             list bundled programs (${KINDS.join(', ')})
  fluid help <program>          describe a program's parameters
  fluid doctor                  check the bundled modules load and run
  fluid version

examples:
  fluid noveltyslice -source in.wav -indices slices.wav -threshold 0.4
  fluid mfcc -source in.wav -features mfcc.csv -numcoeffs 13
  fluid hpss -source in.wav -harmonic h.wav -percussive p.wav

Options are passed straight through to the program, so anything the native
tools accept works here. Output files ending in .csv are written as text.
`);
}
