// Segment-level helpers for pairing FluCoMa with other audio-processing
// packages — cdp-wasm in particular.
//
// The two libraries already share a data format: both decode audio to
// `{ sampleRate, numChannels, length, channelData }` with planar Float32Array
// channels, and both pass audio around as 32-bit float WAV bytes. So the plain
// case needs no glue at all —
//
//     const { bytes } = await cdp.process('modify', ['speed', '2', '$IN', '$OUT'], wav);
//     const points    = await fluid.slice('fluid-noveltyslice', bytes);
//
// — the output of one is directly the input of the other.
//
// What this module adds is the *structural* pairing, which is where the two
// suites actually complement each other: FluCoMa finds where the interesting
// moments are and describes them, CDP transforms audio. Slicing a file, sending
// each segment through a different transformation, and reassembling the result
// is the pipeline that needs real code, so it lives here.
//
// Nothing here imports cdp-wasm. Every function that transforms audio takes a
// callback, so it works with cdp-wasm, with another Fluid call, with Web Audio,
// or with anything else that maps WAV bytes to WAV bytes. That keeps the two
// packages independent — install either, both, or neither.

import { decodeAudio, encodeWav } from './wav.js';

/**
 * Cut audio into segments at the given sample positions.
 *
 * @param {Uint8Array|object} audio  WAV/AIFF bytes or a decoded object
 * @param {number[]} points  slice positions in samples (as returned by `Fluid#slice`)
 * @param {object} [options]
 * @param {boolean} [options.trailing=true] keep the audio after the last slice point
 * @returns {{sampleRate:number, segments:Uint8Array[], bounds:{start:number,end:number}[]}}
 */
export function cut(audio, points, { trailing = true } = {}) {
  const dec = audio instanceof Uint8Array ? decodeAudio(audio) : audio;
  const { sampleRate, length, channelData } = dec;

  // Sort, clamp into range and de-duplicate: slicers can report a point at 0,
  // and a repeated or out-of-range point would otherwise yield empty segments.
  const pts = [...new Set(points.map((p) => Math.max(0, Math.min(length, Math.round(p)))))]
    .sort((a, b) => a - b);
  if (pts[0] !== 0) pts.unshift(0);
  const edges = trailing ? [...pts, length] : pts;

  const segments = [];
  const bounds = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const start = edges[i];
    const end = edges[i + 1];
    if (end <= start) continue;
    segments.push(encodeWav({
      sampleRate,
      channelData: channelData.map((ch) => ch.subarray(start, end)),
    }));
    bounds.push({ start, end });
  }
  return { sampleRate, segments, bounds };
}

/**
 * Join segments back into one buffer, optionally crossfading the joins.
 *
 * Segments may differ in length and channel count — the result takes the widest
 * channel count, and narrower segments are spread across it by repeating their
 * last channel, so a mono segment among stereo ones doesn't collapse the file.
 *
 * @param {(Uint8Array|object)[]} segments
 * @param {object} [options]
 * @param {number} [options.crossfade=0] crossfade length in milliseconds
 * @param {number} [options.sampleRate] output rate; defaults to the first segment's
 * @returns {Uint8Array} a 32-bit float WAV
 */
export function concat(segments, { crossfade = 0, sampleRate } = {}) {
  const decoded = segments
    .map((s) => (s instanceof Uint8Array ? decodeAudio(s) : s))
    .filter((d) => d && d.length > 0);
  if (!decoded.length) throw new Error('concat: nothing to join');

  const rate = sampleRate || decoded[0].sampleRate;
  const numChannels = Math.max(...decoded.map((d) => d.numChannels));
  const fade = Math.max(0, Math.floor((crossfade / 1000) * rate));

  // Each join overlaps by `fade`, but never by more than half of either
  // neighbour — otherwise a fade longer than a short segment would consume it
  // entirely and run the write head backwards.
  const overlaps = [];
  for (let i = 1; i < decoded.length; i++) {
    overlaps.push(Math.min(fade, decoded[i - 1].length >> 1, decoded[i].length >> 1));
  }
  const total = decoded.reduce((n, d) => n + d.length, 0) - overlaps.reduce((a, b) => a + b, 0);

  const out = Array.from({ length: numChannels }, () => new Float32Array(total));
  let pos = 0;
  for (let i = 0; i < decoded.length; i++) {
    const seg = decoded[i];
    const over = i === 0 ? 0 : overlaps[i - 1];
    for (let c = 0; c < numChannels; c++) {
      // Spread a narrower segment over the full width rather than leaving
      // channels silent.
      const src = seg.channelData[Math.min(c, seg.numChannels - 1)];
      const dst = out[c];
      for (let j = 0; j < seg.length; j++) {
        const v = src[j];
        if (j < over) {
          // Equal-power crossfade, so a join through correlated material keeps
          // a steady level instead of dipping.
          const t = (j + 1) / (over + 1);
          dst[pos + j] = dst[pos + j] * Math.cos(t * Math.PI / 2) + v * Math.sin(t * Math.PI / 2);
        } else {
          dst[pos + j] = v;
        }
      }
    }
    pos += seg.length - over;
  }
  return encodeWav({ sampleRate: rate, channelData: out });
}

/**
 * Slice audio with a FluCoMa slicer, transform every segment, and reassemble.
 *
 * This is the FluCoMa/CDP pipeline in one call: FluCoMa decides where the
 * segments are, the callback decides what happens to each one.
 *
 *     import { CDP } from 'cdp-wasm';
 *     const cdp = new CDP();
 *
 *     const out = await mapSlices(fluid, wav, async (seg, i) => {
 *       const { bytes } = await cdp.process(
 *         'modify', ['speed', String(1 + i * 0.1), '$IN', '$OUT'], seg);
 *       return bytes;
 *     }, { program: 'fluid-transientslice', crossfade: 5 });
 *
 * A callback may return `null` to drop a segment, which is how you filter by
 * descriptor (see {@link describeSlices}).
 *
 * @param {import('./index.js').Fluid} fluid
 * @param {Uint8Array|object} audio
 * @param {(segment:Uint8Array, index:number, bounds:{start:number,end:number}) => Promise<Uint8Array|null>|Uint8Array|null} fn
 * @param {object} [options]
 * @param {string} [options.program='fluid-noveltyslice'] the slicing program
 * @param {Record<string,any>} [options.params] parameters for the slicer
 * @param {number} [options.crossfade=0] crossfade at the joins, in milliseconds
 * @param {number} [options.concurrency=1] how many segments to transform at once
 * @returns {Promise<Uint8Array>}
 */
export async function mapSlices(fluid, audio, fn, options = {}) {
  const {
    program = 'fluid-noveltyslice',
    params = {},
    crossfade = 0,
    concurrency = 1,
  } = options;

  const bytes = audio instanceof Uint8Array ? audio : encodeWav(audio);
  const points = await fluid.slice(program, bytes, params);
  const { sampleRate, segments, bounds } = cut(bytes, points);

  const results = await mapWithConcurrency(
    segments,
    (seg, i) => fn(seg, i, bounds[i]),
    concurrency
  );

  const kept = results.filter((r) => r != null && r.length > 0);
  if (!kept.length) throw new Error(`mapSlices: every segment was dropped (${segments.length} in)`);
  return concat(kept, { crossfade, sampleRate });
}

/**
 * Slice audio and describe each segment with a FluCoMa analyser, giving one
 * summary number per descriptor per segment.
 *
 * Use it to sort, filter or match segments — the corpus-style workflows
 * FluCoMa is built around — before handing them to a transformation.
 *
 *     const slices = await describeSlices(fluid, wav, { analyser: 'fluid-pitch' });
 *     slices.sort((a, b) => a.descriptors[0] - b.descriptors[0]); // low to high
 *     const out = concat(slices.map((s) => s.segment));
 *
 * @param {import('./index.js').Fluid} fluid
 * @param {Uint8Array|object} audio
 * @param {object} [options]
 * @param {string} [options.program='fluid-noveltyslice'] the slicing program
 * @param {Record<string,any>} [options.params] parameters for the slicer
 * @param {string} [options.analyser='fluid-spectralshape'] the analysis program
 * @param {Record<string,any>} [options.analysisParams] parameters for the analyser
 * @param {'mean'|'median'|'max'} [options.summary='mean'] how to reduce each
 *   descriptor over the segment. Note that the reduction covers the whole
 *   segment, silence included — and a slice usually ends with some. For
 *   descriptors that read 0 in silence (pitch especially) a mean is pulled
 *   towards zero in proportion to how much of the slice is quiet, which makes
 *   segments hard to compare; `'median'` ignores that tail and recovers the
 *   value of the sounding part. The default stays `'mean'` to match what
 *   BufStats does, but prefer `'median'` when you are sorting or matching.
 * @returns {Promise<{segment:Uint8Array, bounds:{start:number,end:number}, descriptors:number[]}[]>}
 */
export async function describeSlices(fluid, audio, options = {}) {
  const {
    program = 'fluid-noveltyslice',
    params = {},
    analyser = 'fluid-spectralshape',
    analysisParams = {},
    summary = 'mean',
  } = options;

  const bytes = audio instanceof Uint8Array ? audio : encodeWav(audio);
  const points = await fluid.slice(program, bytes, params);
  const { segments, bounds } = cut(bytes, points);

  const out = [];
  for (let i = 0; i < segments.length; i++) {
    let descriptors = [];
    try {
      const features = await fluid.analyse(analyser, segments[i], analysisParams);
      descriptors = features.channelData.map((ch) => reduce(ch, summary));
    } catch {
      // A segment can be shorter than the analyser's window, which is a normal
      // outcome of slicing rather than a failure. Describe it as empty and let
      // the caller decide — dropping it here would silently lose audio.
      descriptors = [];
    }
    out.push({ segment: segments[i], bounds: bounds[i], descriptors });
  }
  return out;
}

/**
 * Reduce an analysis result to one number per descriptor — the same summary
 * `describeSlices` applies, exposed for analyses you have already run.
 *
 * @param {{channelData:Float32Array[]}} analysis
 * @param {'mean'|'median'|'max'} [how='mean']
 * @returns {number[]}
 */
export function summarise(analysis, how = 'mean') {
  return analysis.channelData.map((ch) => reduce(ch, how));
}

/** US spelling alias for {@link summarise}. */
export const summarize = summarise;

// ---- internals --------------------------------------------------------------

function reduce(values, how) {
  if (!values.length) return 0;
  if (how === 'max') {
    let m = -Infinity;
    for (const v of values) if (v > m) m = v;
    return m;
  }
  if (how === 'median') {
    const s = Float32Array.from(values).sort();
    const mid = s.length >> 1;
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/**
 * Map with a bounded number of in-flight calls, preserving input order.
 * Each WebAssembly instance holds its own heap, so running every segment at
 * once on a long file is a good way to exhaust memory; the default of 1 keeps
 * the footprint flat and callers can opt into more.
 */
async function mapWithConcurrency(items, fn, limit) {
  const n = Math.max(1, Math.min(limit | 0 || 1, items.length));
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }));
  return results;
}
