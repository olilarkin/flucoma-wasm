// The WAV/AIFF codec, including the decoded shape that is the interop contract
// with cdp-wasm.

import { decodeWav, encodeWav, decodeAudio, decodeAiff, wavFrameCount } from '../src/wav.js';
import { ok, eq, near, section, done, throws, tone, SR } from './helpers.mjs';

section('wav round-trip');

{
  const left = Float32Array.from({ length: 512 }, (_, i) => Math.sin(i / 10));
  const right = Float32Array.from({ length: 512 }, (_, i) => Math.cos(i / 10));
  const bytes = encodeWav({ sampleRate: SR, channelData: [left, right] });
  const back = decodeWav(bytes);

  eq(back.sampleRate, SR, 'sample rate survives');
  eq(back.numChannels, 2, 'channel count survives');
  eq(back.length, 512, 'frame count survives');
  eq(back.bitDepth, 32, '32-bit float is written');

  // 32-bit float in, 32-bit float out: samples should be bit-exact.
  let exact = true;
  for (let i = 0; i < 512; i++) {
    if (back.channelData[0][i] !== left[i] || back.channelData[1][i] !== right[i]) exact = false;
  }
  ok(exact, 'float samples round-trip exactly');
  eq(wavFrameCount(bytes), 512, 'wavFrameCount reads the header');
}

section('interop shape');

{
  // The properties cdp-wasm's decodeWav also returns — this is what lets audio
  // pass between the two packages untouched.
  const d = decodeAudio(tone(440, 0.1));
  for (const key of ['sampleRate', 'numChannels', 'length', 'channelData', 'bitDepth']) {
    ok(key in d, `decoded audio exposes "${key}"`);
  }
  ok(Array.isArray(d.channelData), 'channelData is an array');
  ok(d.channelData[0] instanceof Float32Array, 'channels are Float32Arrays (planar)');
  eq(d.channelData[0].length, d.length, 'each channel holds `length` samples');
}

section('pcm decoding');

/** Build a 16-bit PCM WAV by hand, to check the integer paths. */
function pcm16(samples, sampleRate = SR) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const dv = new DataView(buf);
  const s = (o, t) => { for (let i = 0; i < t.length; i++) dv.setUint8(o + i, t.charCodeAt(i)); };
  s(0, 'RIFF'); dv.setUint32(4, 36 + samples.length * 2, true); s(8, 'WAVE');
  s(12, 'fmt '); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  s(36, 'data'); dv.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => dv.setInt16(44 + i * 2, v, true));
  return new Uint8Array(buf);
}

{
  const d = decodeWav(pcm16([0, 16384, -16384, 32767]));
  eq(d.bitDepth, 16, '16-bit depth is reported');
  near(d.channelData[0][0], 0, 1e-6, '0 decodes to 0');
  near(d.channelData[0][1], 0.5, 1e-4, 'half scale decodes to 0.5');
  near(d.channelData[0][2], -0.5, 1e-4, 'negative half scale decodes to -0.5');
  near(d.channelData[0][3], 1, 1e-4, 'full scale decodes to ~1');
}

section('robustness');

{
  // A file whose data chunk claims more bytes than are present must not read
  // past the end of the buffer.
  const good = tone(440, 0.05);
  const truncated = good.slice(0, good.length - 200);
  const d = decodeWav(truncated);
  ok(d.length > 0, 'a truncated file still decodes what is there');
  ok(d.length < 0.05 * SR, 'a truncated file reports fewer frames');
  ok(d.channelData[0].every(Number.isFinite), 'no garbage samples are produced');
}

await throws(() => decodeWav(new Uint8Array(64)), /not a WAV/, 'non-WAV input is rejected');
await throws(() => decodeAudio(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])),
  /unsupported audio container/, 'an unknown container is rejected');
await throws(() => decodeAiff(new Uint8Array(64)), /not an AIFF/, 'non-AIFF input is rejected');
await throws(() => encodeWav({ sampleRate: SR, channelData: [] }), /no channels/,
  'encoding no channels is rejected');

eq(wavFrameCount(new Uint8Array(8)), 0, 'wavFrameCount returns 0 for non-WAV input');

done('wav');
