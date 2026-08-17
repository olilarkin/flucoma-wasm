// The segment-level helpers, and the data contract that lets audio pass
// between this package and cdp-wasm without conversion.

import { Fluid, decodeWav, encodeWav, decodeAudio } from '../src/index.js';
import { cut, concat, mapSlices, describeSlices, summarise } from '../src/interop.js';
import {
  ok, eq, near, section, done, throws,
  tone, bursts, burstsStereo, BURST_HZ, SR,
} from './helpers.mjs';

const fluid = new Fluid();

section('cut');

{
  const wav = bursts();
  const total = decodeWav(wav).length;
  const { segments, bounds, sampleRate } = cut(wav, [0, 22050, 44100]);

  eq(segments.length, 3, 'three slice points yield three segments');
  eq(sampleRate, SR, 'the sample rate is carried through');
  eq(bounds[0].start, 0, 'the first segment starts at 0');
  eq(bounds[bounds.length - 1].end, total, 'the last segment runs to the end');
  eq(segments.reduce((n, s) => n + decodeWav(s).length, 0), total,
    'the segments together account for every sample');
}

{
  // Unsorted, duplicated and out-of-range points are all survivable inputs.
  const wav = bursts();
  const total = decodeWav(wav).length;
  const { segments, bounds } = cut(wav, [44100, 22050, 22050, -100, total + 9999]);
  ok(segments.every((s) => decodeWav(s).length > 0), 'no empty segments are produced');
  ok(bounds.every((b, i) => i === 0 || b.start >= bounds[i - 1].end),
    'bounds come back in order and do not overlap');
  eq(bounds[bounds.length - 1].end, total, 'an out-of-range point is clamped to the end');
}

{
  const { segments } = cut(bursts(), [22050], { trailing: false });
  eq(segments.length, 1, 'trailing:false drops the audio after the last point');
}

section('concat');

{
  // Butt-joined, a cut file must reassemble to exactly what it was.
  const wav = bursts();
  const src = decodeWav(wav);
  const { segments } = cut(wav, [0, 11025, 33075, 60000]);
  const joined = decodeWav(concat(segments));

  eq(joined.length, src.length, 'a cut-then-joined file has its original length');
  eq(joined.sampleRate, src.sampleRate, 'the sample rate is preserved');
  let exact = true;
  for (let i = 0; i < src.length; i++) {
    if (joined.channelData[0][i] !== src.channelData[0][i]) { exact = false; break; }
  }
  ok(exact, 'a cut-then-joined file is sample-identical to the source');
}

{
  const { segments } = cut(bursts(), [0, 22050, 44100]);
  const plain = decodeWav(concat(segments)).length;
  const faded = decodeWav(concat(segments, { crossfade: 10 })).length;
  ok(faded < plain, 'crossfading overlaps the joins, so the result is shorter');
  ok(faded > plain - 3 * 0.01 * SR - 1, 'the overlap is no more than the fade length per join');
  ok(decodeWav(concat(segments, { crossfade: 10 })).channelData[0].every(Number.isFinite),
    'crossfaded output is finite');
}

{
  // A fade longer than a segment must not run the write head backwards.
  const tiny = cut(bursts(), [0, 100, 200, 300]).segments;
  const out = decodeWav(concat(tiny, { crossfade: 1000 }));
  ok(out.length > 0, 'an over-long crossfade still produces audio');
  ok(out.channelData[0].every(Number.isFinite), 'an over-long crossfade stays finite');
}

{
  // Mixed widths: the result takes the widest, and nothing goes silent.
  const mono = cut(bursts(), [0, 22050]).segments[0];
  const stereo = cut(burstsStereo(), [0, 22050]).segments[0];
  const out = decodeWav(concat([mono, stereo]));
  eq(out.numChannels, 2, 'joining mono and stereo yields a stereo file');
  const energy = out.channelData.map((c) => c.reduce((a, v) => a + v * v, 0));
  ok(energy.every((e) => e > 0), 'no channel is left silent');
}

await throws(() => concat([]), /nothing to join/, 'joining nothing is rejected');

section('mapSlices');

{
  const wav = bursts();
  let seen = 0;
  const out = await mapSlices(fluid, wav, (seg, i, bounds) => {
    seen++;
    ok(seg instanceof Uint8Array, `segment ${i} arrives as bytes`);
    ok(bounds.end > bounds.start, `segment ${i} comes with its bounds`);
    // Reverse it — standing in for whatever transformation you'd reach for,
    // a cdp-wasm call included.
    const d = decodeWav(seg);
    return encodeWav({ sampleRate: d.sampleRate, channelData: d.channelData.map((c) => c.slice().reverse()) });
  }, { params: { threshold: 0.5 } });

  eq(seen, BURST_HZ.length, 'the callback sees one segment per burst');
  const d = decodeWav(out);
  eq(d.length, decodeWav(wav).length, 'butt-joined output keeps the original length');
  ok(d.channelData[0].every(Number.isFinite), 'the reassembled audio is finite');
}

{
  // Returning null drops a segment, which is how descriptor filtering works.
  const wav = bursts();
  const full = decodeWav(await mapSlices(fluid, wav, (s) => s, { params: { threshold: 0.5 } }));
  const half = decodeWav(await mapSlices(fluid, wav, (s, i) => (i % 2 ? null : s),
    { params: { threshold: 0.5 } }));
  ok(half.length < full.length, 'dropped segments are left out of the result');
}

{
  // Concurrency must not disturb the ordering.
  const wav = bursts();
  const opts = { params: { threshold: 0.5 } };
  const serial = decodeWav(await mapSlices(fluid, wav, (s) => s, opts));
  const parallel = decodeWav(await mapSlices(fluid, wav, (s) => s, { ...opts, concurrency: 4 }));
  eq(parallel.length, serial.length, 'concurrency does not change the output length');
  let same = true;
  for (let i = 0; i < serial.length; i++) {
    if (serial.channelData[0][i] !== parallel.channelData[0][i]) { same = false; break; }
  }
  ok(same, 'segments are reassembled in order regardless of concurrency');
}

await throws(() => mapSlices(fluid, bursts(), () => null, { params: { threshold: 0.5 } }),
  /every segment was dropped/, 'dropping everything is reported, not returned as silence');

section('describeSlices');

{
  // Each burst has a known pitch, so the descriptors must come back in that
  // order. A median ignores the silent tail of each slice (see the note on
  // describeSlices); a mean would be dragged towards zero.
  const slices = await describeSlices(fluid, bursts(), {
    params: { threshold: 0.5 },
    analyser: 'fluid-pitch',
    summary: 'median',
  });

  eq(slices.length, BURST_HZ.length, 'one description per segment');
  slices.forEach((s, i) => {
    ok(s.segment instanceof Uint8Array, `segment ${i} is returned alongside its descriptors`);
    near(s.descriptors[0], BURST_HZ[i], 12, `segment ${i} is described as ~${BURST_HZ[i]} Hz`);
  });

  // The point of the exercise: reorder by descriptor and reassemble.
  const sorted = [...slices].sort((a, b) => a.descriptors[0] - b.descriptors[0]);
  eq(sorted.map((s) => Math.round(s.descriptors[0] / 10) * 10).join(' '),
    [...BURST_HZ].sort((a, b) => a - b).map((h) => Math.round(h / 10) * 10).join(' '),
    'sorting by descriptor orders the segments by pitch');
  ok(decodeWav(concat(sorted.map((s) => s.segment))).length > 0,
    'the reordered segments reassemble into audio');
}

section('summarise');

{
  const analysis = { channelData: [Float32Array.from([1, 2, 3, 4]), Float32Array.from([10, 0, 0, 0])] };
  eq(summarise(analysis, 'mean').join(','), '2.5,2.5', 'mean is per channel');
  eq(summarise(analysis, 'median').join(','), '2.5,0', 'median is per channel');
  eq(summarise(analysis, 'max').join(','), '4,10', 'max is per channel');
  eq(summarise({ channelData: [new Float32Array(0)] })[0], 0, 'an empty channel summarises to 0');
}

section('cdp-wasm contract');

{
  // The shape both packages agree on. cdp-wasm's decodeWav returns these same
  // fields, and its encodeWav writes the same 32-bit float WAV, so buffers pass
  // between the two untouched — this asserts our half of that bargain.
  const bytes = tone(440, 0.1);
  const decoded = decodeAudio(bytes);

  eq(decoded.bitDepth, 32, 'audio is handed over as 32-bit float');
  ok(decoded.channelData[0] instanceof Float32Array, 'channels are planar Float32Arrays');

  // Round-tripping through the shared representation must not alter the audio,
  // which is what makes handing a buffer to another package free.
  const back = decodeWav(encodeWav({ sampleRate: decoded.sampleRate, channelData: decoded.channelData }));
  eq(back.length, decoded.length, 'a round trip through the shared shape keeps the length');
  let exact = true;
  for (let i = 0; i < back.length; i++) {
    if (back.channelData[0][i] !== decoded.channelData[0][i]) { exact = false; break; }
  }
  ok(exact, 'a round trip through the shared shape is lossless');

  // And the programs accept that representation directly, not just raw bytes.
  const points = await fluid.slice('fluid-ampslice', decoded);
  ok(Array.isArray(points), 'a decoded buffer can be passed straight to a program');
}

done('interop');
