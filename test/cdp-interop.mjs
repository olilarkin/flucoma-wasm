// Verifies the interop contract against the real cdp-wasm, rather than just
// asserting it: audio written by either package must be read back by the other
// with no conversion and no loss.
//
// cdp-wasm is not a dependency — the two packages are deliberately independent
// — so this test skips when it isn't installed. Point CDP_WASM_PATH at a
// checkout to run it against one that isn't on the module path.

import { ok, eq, section, done } from './helpers.mjs';
import * as F from '../src/wav.js';
import { Fluid } from '../src/index.js';

let C;
const candidates = [
  process.env.CDP_WASM_PATH ? new URL('src/wav.js', `file://${process.env.CDP_WASM_PATH.replace(/\/?$/, '/')}`).href : null,
  'cdp-wasm/wav',
  '../../cdp-wasm-dev/src/wav.js',
  '../../cdp-wasm/src/wav.js',
].filter(Boolean);

for (const spec of candidates) {
  try {
    C = await import(spec.startsWith('.') ? new URL(spec, import.meta.url).href : spec);
    console.log(`cdp-interop: checking against ${spec}`);
    break;
  } catch { /* try the next candidate */ }
}

if (!C) {
  console.log('cdp-interop: cdp-wasm not found, skipping (set CDP_WASM_PATH to run)');
  process.exit(0);
}

const SR = 44100;
const N = 2048;
const left = Float32Array.from({ length: N }, (_, i) => Math.sin(i / 7) * 0.9);
const right = Float32Array.from({ length: N }, (_, i) => Math.cos(i / 11) * 0.3);
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

section('audio written here, read there');

{
  const bytes = F.encodeWav({ sampleRate: SR, channelData: [left, right] });
  const d = C.decodeWav(bytes);
  eq(d.sampleRate, SR, 'cdp-wasm reads our sample rate');
  eq(d.numChannels, 2, 'cdp-wasm reads our channel count');
  eq(d.length, N, 'cdp-wasm reads our frame count');
  eq(d.bitDepth, 32, 'cdp-wasm sees 32-bit float');
  ok(same(d.channelData[0], left) && same(d.channelData[1], right),
    'cdp-wasm reads our samples bit-exactly');
}

section('audio written there, read here');

{
  const bytes = C.encodeWav({ sampleRate: SR, channelData: [left, right] });
  const d = F.decodeWav(bytes);
  eq(d.sampleRate, SR, 'we read cdp-wasm\'s sample rate');
  eq(d.numChannels, 2, 'we read cdp-wasm\'s channel count');
  eq(d.length, N, 'we read cdp-wasm\'s frame count');
  ok(same(d.channelData[0], left) && same(d.channelData[1], right),
    'we read cdp-wasm\'s samples bit-exactly');
}

section('shared representation');

{
  const ours = F.encodeWav({ sampleRate: SR, channelData: [left, right] });
  const theirs = C.encodeWav({ sampleRate: SR, channelData: [left, right] });
  ok(same(ours, theirs), 'both packages encode to byte-identical files');

  const a = Object.keys(F.decodeWav(ours)).sort().join(',');
  const b = Object.keys(C.decodeWav(theirs)).sort().join(',');
  eq(a, b, 'both packages decode to the same object shape');
}

section('a cdp-wasm buffer drives a program');

{
  // The end of the contract that matters in practice: something cdp-wasm
  // produced goes straight into a FluCoMa program with no adapter.
  const fromCdp = C.encodeWav({ sampleRate: SR, channelData: [left] });
  const fluid = new Fluid();

  const points = await fluid.slice('fluid-ampslice', fromCdp);
  ok(Array.isArray(points), 'a cdp-wasm buffer can be sliced directly');

  const features = await fluid.analyse('fluid-spectralshape', fromCdp);
  ok(features.length > 0, 'a cdp-wasm buffer can be analysed directly');

  // ...and back the other way: our output decodes in cdp-wasm.
  const { harmonic } = await fluid.decompose('fluid-hpss', fromCdp);
  const back = C.decodeWav(harmonic);
  eq(back.length, N, 'cdp-wasm reads a FluCoMa program\'s output');
  ok(back.channelData[0].every(Number.isFinite), 'that output decodes to finite samples');
}

done('cdp-interop');
