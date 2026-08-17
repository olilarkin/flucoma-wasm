// The programs themselves: every bundled module loads and runs, and the ones
// with a checkable answer give the right one.

import { Fluid, PROGRAMS, kindOf, decodeWav } from '../src/index.js';
import {
  ok, eq, near, section, done, throws,
  tone, bursts, burstsStereo, BURST_HZ, BURST_STARTS, SR,
} from './helpers.mjs';

const fluid = new Fluid();

section('every module loads');

const onDisk = await fluid.programs();
for (const p of onDisk) {
  const res = await fluid.run(p, ['-version']);
  ok(/Fluid Corpus Manipulation Toolkit/.test(res.stdout), `${p} loads and runs`);
}

section('slicing');

{
  const wav = bursts();
  const points = await fluid.slice('fluid-noveltyslice', wav, { threshold: 0.5 });

  eq(points.length, BURST_STARTS.length, 'noveltyslice finds one slice per burst');
  points.forEach((p, i) => {
    // Onset detectors report a little early or late depending on window
    // alignment; a 30 ms tolerance is well inside the 500 ms burst spacing.
    near(p / SR, BURST_STARTS[i], 0.03, `slice ${i} lands on the burst at ${BURST_STARTS[i]}s`);
  });
  ok(points.every((p, i) => i === 0 || p > points[i - 1]), 'slice points increase');
}

{
  // A tighter threshold must not find more events than a looser one.
  const wav = bursts();
  const loose = await fluid.slice('fluid-noveltyslice', wav, { threshold: 0.1 });
  const tight = await fluid.slice('fluid-noveltyslice', wav, { threshold: 0.9 });
  ok(tight.length <= loose.length, 'a higher threshold yields no more slices');
}

{
  // Silence has nothing to slice at; anything beyond the leading 0 would be a
  // detector firing on noise.
  const silence = await fluid.slice('fluid-ampslice', tone(440, 0.5, SR, 0));
  ok(silence.length <= 1, 'silence produces no slices');
}

section('analysis');

for (const [hz, tol] of [[220, 8], [440, 8], [880, 12]]) {
  const p = await fluid.analyse('fluid-pitch', tone(hz, 1));
  const sorted = Array.from(p.channelData[0]).slice(20, -20).sort((a, b) => a - b);
  const median = sorted[sorted.length >> 1];
  near(median, hz, tol, `pitch tracks a ${hz} Hz tone`);
  ok(p.channelData[1][50] > 0.5, `pitch is confident about a ${hz} Hz tone`);
}

{
  const s = await fluid.analyse('fluid-spectralshape', tone(440, 1));
  near(s.channelData[0][20], 440, 15, 'spectral centroid of a 440 Hz tone is ~440 Hz');
}

{
  const m = await fluid.analyse('fluid-mfcc', bursts(), { numCoeffs: 13 });
  eq(m.numChannels, 13, 'mfcc returns the requested number of coefficients');
  ok(m.length > 100, 'mfcc returns one frame per hop');
  ok(m.channelData.every((c) => c.every(Number.isFinite)), 'mfcc output is finite');
}

{
  // A louder source must analyse as louder.
  const quiet = await fluid.analyse('fluid-loudness', tone(440, 0.5, SR, 0.1));
  const loud = await fluid.analyse('fluid-loudness', tone(440, 0.5, SR, 0.8));
  ok(loud.channelData[0][10] > quiet.channelData[0][10] + 10,
    'a louder tone reports a higher loudness');
}

{
  const m = await fluid.analyse('fluid-melbands', tone(440, 0.5), { numBands: 20 });
  eq(m.numChannels, 20, 'melbands returns the requested number of bands');
}

section('decomposition');

{
  const wav = bursts();
  const out = await fluid.decompose('fluid-hpss', wav);
  for (const name of ['harmonic', 'percussive', 'residual']) {
    ok(out[name] instanceof Uint8Array, `hpss writes ${name}`);
    const d = decodeWav(out[name]);
    eq(d.length, decodeWav(wav).length, `hpss ${name} is the same length as the source`);
    ok(d.channelData[0].every(Number.isFinite), `hpss ${name} is finite`);
  }
}

{
  const wav = tone(440, 0.5);
  const out = await fluid.decompose('fluid-sines', wav);
  const sines = decodeWav(out.sines);
  const residual = decodeWav(out.residual);
  const energy = (d) => d.channelData[0].reduce((a, v) => a + v * v, 0);
  // A pure sine is entirely tonal, so the sinusoidal part must dominate.
  ok(energy(sines) > energy(residual), 'a pure tone lands in the sinusoidal part, not the residual');
}

section('multichannel');

{
  const stereo = burstsStereo();
  const out = await fluid.decompose('fluid-hpss', stereo);
  eq(decodeWav(out.harmonic).numChannels, 2, 'a stereo source stays stereo');
}

{
  // startChan/numChans select a single channel of a stereo file, and the two
  // channels carry different pitches, so the selection is observable.
  const stereo = burstsStereo();
  const left = await fluid.analyse('fluid-pitch', stereo, { startChan: 0, numChans: 1 });
  const right = await fluid.analyse('fluid-pitch', stereo, { startChan: 1, numChans: 1 });
  const med = (a) => {
    const s = Array.from(a).filter((v) => v > 20).sort((x, y) => x - y);
    return s.length ? s[s.length >> 1] : 0;
  };
  const l = med(left.channelData[0]);
  const r = med(right.channelData[0]);
  ok(r > l * 1.5, `numChans selects one channel (left ~${l.toFixed(0)} Hz, right ~${r.toFixed(0)} Hz)`);
}

section('output formats');

{
  const res = await fluid.invoke('fluid-noveltyslice', { source: bursts(), indices: 'csv' });
  const csv = res.outputs.indices.csv;
  ok(typeof csv === 'string', 'a csv output comes back as text');
  const values = csv.trim().split(/[,\s]+/).map(Number);
  ok(values.length > 0 && values.every(Number.isFinite), 'the csv holds numbers');
}

{
  const res = await fluid.invoke('fluid-hpss', { source: tone(440, 0.3), residual: false });
  ok(!('residual' in res.outputs), 'an output turned off is not produced');
  ok('harmonic' in res.outputs, 'the remaining outputs are still produced');
}

section('errors');

await throws(() => fluid.slice('fluid-mfcc', tone(440, 0.2)),
  /not a slicing program/, 'slice() rejects a non-slicer');
await throws(() => fluid.analyse('fluid-noveltyslice', tone(440, 0.2)),
  /not an analysis program/, 'analyse() rejects a non-analyser');
await throws(() => fluid.invoke('fluid-nope', {}), /unknown program/,
  'invoke() rejects an unknown program');

{
  // Out-of-range values reach the algorithms and trap the WebAssembly module
  // (kernelSize is declared Min(3), Odd(); 2 and 4 read off the end of the
  // heap). They have to be caught before the program is ever called.
  const wav = tone(440, 0.2);
  await throws(() => fluid.invoke('fluid-noveltyslice', { source: wav, kernelSize: 2 }),
    /must be at least 3/, 'a below-minimum value is rejected before running');
  await throws(() => fluid.invoke('fluid-noveltyslice', { source: wav, kernelSize: 4 }),
    /must be odd/, 'an even value for an odd-only parameter is rejected');
  await throws(() => fluid.invoke('fluid-noveltyslice', { source: wav, kernelSize: -5 }),
    /must be at least 3/, 'a negative value is rejected');

  // ...and the values either side of the constraint still work.
  for (const k of [3, 5, 11]) {
    const r = await fluid.invoke('fluid-noveltyslice', { source: wav, kernelSize: k });
    eq(r.exitCode, 0, `kernelSize ${k} is accepted`);
  }
}

{
  // A failed run must not leave the host process marked as failing.
  const before = process.exitCode;
  await fluid.run('fluid-mfcc', ['-source', '/nope.wav']).catch(() => {});
  eq(process.exitCode, before, 'a failed run leaves the host exit code alone');
}

section('kinds');

for (const p of PROGRAMS) {
  const kind = kindOf(p);
  ok(['slicer', 'analyser', 'decomposer', 'stats'].includes(kind), `${p} has a usable kind`);
}

done('run');
