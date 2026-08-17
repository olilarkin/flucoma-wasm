// Shared test helpers: a tiny assertion vocabulary and some synthetic audio.

import { encodeWav } from '../src/wav.js';

let failures = 0;
let checks = 0;

export function ok(cond, msg) {
  checks++;
  if (cond) return;
  failures++;
  console.error(`  FAIL ${msg}`);
}

export function eq(actual, expected, msg) {
  ok(Object.is(actual, expected), `${msg} — expected ${expected}, got ${actual}`);
}

export function near(actual, expected, tol, msg) {
  ok(Math.abs(actual - expected) <= tol,
    `${msg} — expected ${expected} ±${tol}, got ${actual}`);
}

export async function throws(fn, match, msg) {
  checks++;
  try {
    await fn();
  } catch (e) {
    if (!match || match.test(e.message)) return;
    failures++;
    console.error(`  FAIL ${msg} — message was "${e.message}"`);
    return;
  }
  failures++;
  console.error(`  FAIL ${msg} — nothing was thrown`);
}

export function section(name) {
  console.log(name);
}

export function done(name) {
  if (failures) {
    console.error(`\n${name}: ${failures} failure(s) of ${checks} checks`);
    process.exit(1);
  }
  console.log(`${name}: ${checks} checks passed`);
}

export const SR = 44100;

/** A steady sine, `seconds` long. */
export function tone(hz, seconds = 1, sampleRate = SR, amp = 0.5) {
  const n = Math.floor(seconds * sampleRate);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = amp * Math.sin(2 * Math.PI * hz * i / sampleRate);
  return encodeWav({ sampleRate, channelData: [x] });
}

/**
 * Four decaying tone bursts at 0.0/0.5/1.0/1.5 s, each a quarter-second long —
 * so slicers have four unambiguous events to find and each segment has a
 * different, known pitch.
 */
export const BURST_HZ = [220, 660, 330, 880];
export const BURST_STARTS = [0, 0.5, 1.0, 1.5];

export function bursts(sampleRate = SR) {
  const n = Math.floor(2 * sampleRate);
  const x = new Float32Array(n);
  for (let e = 0; e < BURST_HZ.length; e++) {
    const start = Math.floor(BURST_STARTS[e] * sampleRate);
    const len = Math.floor(0.25 * sampleRate);
    for (let i = 0; i < len; i++) {
      x[start + i] = 0.6 * Math.exp(-5 * i / len) * Math.sin(2 * Math.PI * BURST_HZ[e] * i / sampleRate);
    }
  }
  return encodeWav({ sampleRate, channelData: [x] });
}

/** Two-channel version of `bursts`: left as-is, right an octave up. */
export function burstsStereo(sampleRate = SR) {
  const n = Math.floor(2 * sampleRate);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (let e = 0; e < BURST_HZ.length; e++) {
    const start = Math.floor(BURST_STARTS[e] * sampleRate);
    const len = Math.floor(0.25 * sampleRate);
    for (let i = 0; i < len; i++) {
      const env = 0.6 * Math.exp(-5 * i / len);
      l[start + i] = env * Math.sin(2 * Math.PI * BURST_HZ[e] * i / sampleRate);
      r[start + i] = env * Math.sin(2 * Math.PI * BURST_HZ[e] * 2 * i / sampleRate);
    }
  }
  return encodeWav({ sampleRate, channelData: [l, r] });
}
