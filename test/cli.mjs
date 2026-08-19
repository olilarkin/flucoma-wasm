// The `fluid` command-line wrapper: file staging, write-back, and the meta
// subcommands.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeWav } from '../src/wav.js';
import { ok, eq, near, section, done, bursts, BURST_STARTS, SR } from './helpers.mjs';

const run = promisify(execFile);
const CLI = new URL('../bin/fluid.js', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'flucoma-cli-test-'));

/** Run the CLI; never rejects, so failures can be asserted on. */
async function fluid(...args) {
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args]);
    return { code: 0, stdout, stderr };
  } catch (e) {
    return { code: e.code ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

try {
  const input = join(dir, 'in.wav');
  writeFileSync(input, bursts());

  section('meta commands');

  {
    const { code, stdout } = await fluid('list');
    eq(code, 0, 'list exits cleanly');
    for (const kind of ['slicer', 'analyser', 'decomposer']) {
      ok(stdout.includes(kind), `list shows the ${kind} group`);
    }
    ok(stdout.includes('noveltyslice'), 'list names a program');
  }

  {
    const { stdout } = await fluid('list', 'slicer');
    ok(stdout.includes('noveltyslice'), 'list slicer shows slicers');
    ok(!stdout.includes('mfcc'), 'list slicer leaves out other kinds');
  }

  {
    const { code, stdout } = await fluid('help', 'mfcc');
    eq(code, 0, 'help exits cleanly');
    ok(stdout.includes('-numcoeffs'), 'help lists the options');
    ok(stdout.includes('default'), 'help shows defaults');
    ok(stdout.includes('BufMFCC'), 'help names the FluCoMa client');
    ok(stdout.includes('https://learn.flucoma.org/reference/mfcc/'),
      'help links to the process\'s reference page');
  }

  {
    const { code, stdout } = await fluid('doctor');
    eq(code, 0, 'doctor exits cleanly');
    ok(stdout.includes('all good'), 'doctor reports a healthy install');
  }

  {
    const { code, stdout } = await fluid('version');
    eq(code, 0, 'version exits cleanly');
    ok(stdout.includes('flucoma-wasm'), 'version names the package');
  }

  {
    const { code, stdout } = await fluid('--help');
    eq(code, 0, '--help exits cleanly');
    ok(stdout.includes('usage:'), '--help prints usage');
  }

  section('running programs');

  {
    // The `fluid-` prefix is optional.
    const out = join(dir, 'slices.csv');
    const { code } = await fluid('noveltyslice', '-source', input, '-indices', out, '-threshold', '0.5');
    eq(code, 0, 'a slicing run exits cleanly');
    ok(existsSync(out), 'the output file is written to disk');

    const values = readFileSync(out, 'utf8').trim().split(/[,\s]+/).map(Number);
    eq(values.length, BURST_STARTS.length, 'the csv holds one index per burst');
    values.forEach((v, i) => near(v / SR, BURST_STARTS[i], 0.03, `csv index ${i} lands on its burst`));
  }

  {
    const out = join(dir, 'slices2.csv');
    const { code } = await fluid('fluid-noveltyslice', '-source', input, '-indices', out);
    eq(code, 0, 'the fully-qualified program name also works');
  }

  {
    // A WAV output must come back as real audio.
    const out = join(dir, 'harmonic.wav');
    const perc = join(dir, 'percussive.wav');
    const { code } = await fluid('hpss', '-source', input, '-harmonic', out, '-percussive', perc);
    eq(code, 0, 'a decomposition run exits cleanly');
    ok(existsSync(out) && existsSync(perc), 'both outputs are written');
    const d = decodeWav(readFileSync(out));
    eq(d.length, decodeWav(readFileSync(input)).length, 'the output is as long as the input');
    eq(d.bitDepth, 32, 'the output is 32-bit float');
  }

  {
    // Output into a directory that does not exist yet.
    const out = join(dir, 'nested', 'deep', 'features.csv');
    const { code } = await fluid('mfcc', '-source', input, '-features', out, '-numcoeffs', '13', '-1');
    eq(code, 0, 'a run writing into a new directory exits cleanly');
    ok(existsSync(out), 'missing output directories are created');
  }

  section('errors');

  {
    const { code, stderr } = await fluid('nosuchprogram', '-source', input);
    ok(code !== 0, 'an unknown program fails');
    ok(/unknown program/.test(stderr), 'an unknown program is explained');
  }

  {
    const { code, stderr } = await fluid('mfcc', '-source', join(dir, 'missing.wav'));
    ok(code !== 0, 'a missing input file fails');
    ok(/no such file/.test(stderr), 'a missing input file is explained');
  }

  {
    const { code, stderr } = await fluid('mfcc', '-source');
    ok(code !== 0, 'an option with no value fails');
    ok(/needs a file path/.test(stderr), 'an option with no value is explained');
  }

  {
    // kernelSize is declared Min(3), Odd(); the program does not check that
    // itself and traps the module, so the CLI has to catch it first and say
    // something useful rather than printing a wasm stack trace.
    const out = join(dir, 'never.csv');
    for (const [value, expected] of [['4', /must be odd/], ['2', /must be at least 3/]]) {
      const { code, stderr } = await fluid('noveltyslice', '-source', input,
        '-indices', out, '-kernelsize', value, '-1');
      ok(code !== 0, `kernelSize ${value} exits non-zero`);
      ok(expected.test(stderr), `kernelSize ${value} is explained in one line`);
      ok(!/wasm-function|RuntimeError/.test(stderr), `kernelSize ${value} prints no wasm stack trace`);
      ok(!existsSync(out), `kernelSize ${value} writes no output file`);
    }

    // ...and a legal value on the same option still runs.
    const good = join(dir, 'k5.csv');
    const { code } = await fluid('noveltyslice', '-source', input,
      '-indices', good, '-kernelsize', '5', '-1');
    eq(code, 0, 'a valid kernelSize still runs');
    ok(existsSync(good), 'a valid kernelSize writes its output');
  }

  done('cli');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
