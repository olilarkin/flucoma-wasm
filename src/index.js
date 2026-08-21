// Typed JS wrapper around the FluCoMa command-line programs, compiled to
// WebAssembly.
//
// Each program (fluid-mfcc, fluid-noveltyslice, ...) is a standalone Emscripten
// module. This wrapper loads them on demand, stages input audio into the
// in-memory filesystem (MEMFS), invokes the program's main() with the same
// command-line options the native tools take, and reads the outputs back — so
// callers work with byte arrays and Float32Arrays instead of touching the
// virtual filesystem. Works in Node, the browser and Web Workers.

import {
  decodeWav, decodeAiff, decodeAudio, encodeWav,
  wavFrameCount, wavToAudioBuffer, audioBufferToWav,
} from './wav.js';
import { CATALOG } from './catalog.js';

export {
  decodeWav, decodeAiff, decodeAudio, encodeWav,
  wavFrameCount, wavToAudioBuffer, audioBufferToWav,
};
export { CATALOG };

/** Every program described by the typed catalog, sorted. */
export const PROGRAMS = Object.keys(CATALOG).sort();

/**
 * What a program produces, derived from the names of its output buffers:
 *
 *   'slicer'     — writes `indices`: slice points, in samples
 *   'analyser'   — writes `features`: one channel per descriptor, one frame per hop
 *   'decomposer' — writes audio buffers (harmonic/percussive, sines/residual, ...)
 *   'stats'      — writes a statistics buffer
 *
 * @param {string} program
 * @returns {'slicer'|'analyser'|'decomposer'|'stats'|'unknown'}
 */
export function kindOf(program) {
  const entry = CATALOG[program];
  if (!entry) return 'unknown';
  if (entry.outputs.includes('indices')) return 'slicer';
  if (entry.outputs.includes('features')) return 'analyser';
  if (entry.outputs.includes('stats')) return 'stats';
  return entry.outputs.length ? 'decomposer' : 'unknown';
}

/** Programs of a given kind. @param {string} kind */
export function programsOfKind(kind) {
  return PROGRAMS.filter((p) => kindOf(p) === kind);
}

/** The catalog entry for `program`, or throw with the near-miss suggestions. */
export function describe(program) {
  const entry = CATALOG[program];
  if (entry) return entry;
  const guess = PROGRAMS.filter((p) => p.includes(program) || program.includes(p));
  throw new Error(
    `unknown program "${program}"` +
    (guess.length ? `; did you mean ${guess.join(', ')}?` : `. Known: ${PROGRAMS.join(', ')}`)
  );
}

export class Fluid {
  /**
   * @param {object} [options]
   * @param {string|URL} [options.baseUrl] Directory holding the program
   *   .js/.wasm files. Defaults to the package's bundled `wasm/` folder.
   */
  constructor(options = {}) {
    this._baseUrl = options.baseUrl
      ? new URL(String(options.baseUrl).replace(/\/?$/, '/'), selfUrl())
      : new URL('../wasm/', selfUrl());
    this._factories = new Map();
    this._manifestP = null;
  }

  /** Fetch + cache the build's manifest.json. */
  async _manifest() {
    if (!this._manifestP) {
      this._manifestP = (async () => {
        const url = new URL('manifest.json', this._baseUrl);
        let text;
        if (url.protocol === 'file:') {
          // Node: fetch() can't read file:// — use fs.
          const { readFile } = await import(/* @vite-ignore */ 'node:fs/promises');
          text = await readFile(url, 'utf8');
        } else {
          const res = await fetch(url.href);
          if (!res.ok) throw new Error(`manifest.json not found at ${url.href} (HTTP ${res.status})`);
          text = await res.text();
        }
        const m = JSON.parse(text);
        if (Array.isArray(m)) return { programs: m, runtime: null };
        return { programs: m.programs || [], runtime: m.runtime || null };
      })();
    }
    return this._manifestP;
  }

  /**
   * Every program bundled alongside the .wasm files, from the build's
   * `manifest.json`. (`PROGRAMS` is the same list as described by the typed
   * catalog; this one reflects what is actually on disk.)
   * @returns {Promise<string[]>}
   */
  async programs() {
    return (await this._manifest()).programs;
  }

  /** Pre-load program modules (otherwise loaded lazily on first run). */
  async load(...programs) {
    await Promise.all(programs.map((p) => this._factory(p)));
  }

  /**
   * Run a program with raw command-line arguments — the same grammar the native
   * `fluid-*` executables take, e.g.
   *
   *   run('fluid-mfcc', ['-source', '/in.wav', '-features', '/out.wav', '-numcoeffs', '13'],
   *       { inputs: { '/in.wav': bytes }, outputs: ['/out.wav'] })
   *
   * @param {string} program
   * @param {string[]} args
   * @param {object} [io]
   * @param {Record<string,Uint8Array>} [io.inputs]  virtual path -> bytes, written before the run
   * @param {string[]} [io.outputs]  virtual paths read back after the run
   * @returns {Promise<{exitCode:number, stdout:string, stderr:string, outputs:Record<string,Uint8Array>}>}
   */
  async run(program, args, io = {}) {
    let stdout = '';
    let stderr = '';
    const factory = await this._factory(program);
    const Module = await factory({
      noInitialRun: true,
      // One runtime file serves many programs, so which .wasm to instantiate is
      // this call's decision rather than something baked into the glue.
      locateFile: (path) =>
        path.endsWith('.wasm') ? new URL(`${program}.wasm`, this._baseUrl).href : path,
      print: (s) => { stdout += s + '\n'; },
      printErr: (s) => { stderr += s + '\n'; },
    });

    for (const [path, data] of Object.entries(io.inputs || {})) {
      mkdirp(Module.FS, path);
      Module.FS.writeFile(path, data);
    }
    // Output directories have to exist before the program tries to create the
    // file in them.
    for (const path of io.outputs || []) mkdirp(Module.FS, path);

    // callMain returns the program's exit status (the FluCoMa CLI wrapper
    // returns 0 on success, negative on failure) and, in Node, can also set the
    // host process's exit code. Capture the status and restore the host's own
    // exit code, so a failed run doesn't silently poison the embedding process.
    const hostHadProcess = typeof process !== 'undefined';
    const prevHostExitCode = hostHadProcess ? process.exitCode : undefined;
    let exitCode = 0;
    try {
      // callMain unshifts argv[0] into the array it is given, so hand it a copy
      // and leave the caller's `args` untouched.
      const status = Module.callMain([...args]);
      if (typeof status === 'number') exitCode = status;
    } catch (e) {
      if (e && typeof e.status === 'number') exitCode = e.status;
      else {
        if (hostHadProcess) process.exitCode = prevHostExitCode;
        throw e;
      }
    }
    if (hostHadProcess) process.exitCode = prevHostExitCode;

    const outputs = {};
    for (const path of io.outputs || []) {
      try { outputs[path] = Module.FS.readFile(path); } catch { /* not produced */ }
    }
    return { exitCode, stdout, stderr, outputs };
  }

  /**
   * Run a program from a typed parameter object, staging its input buffers and
   * decoding its output buffers.
   *
   * `params` is keyed by parameter name as the catalog declares it (case is
   * ignored, so `fftSettings` and `fftsettings` both work):
   *
   *   - input buffers take audio: WAV/AIFF bytes, a decoded
   *     `{ sampleRate, channelData }`, or a Web Audio AudioBuffer;
   *   - output buffers are all produced by default. Pass `false` to skip one,
   *     or `'csv'` to have the program write it as CSV text instead of audio;
   *   - everything else takes a number, a string, an array of numbers (for
   *     multi-value parameters like `fftSettings`), or — for enum parameters —
   *     the choice name, e.g. `{ algorithm: 'MFCC' }`.
   *
   * @param {string} program
   * @param {Record<string, any>} params
   * @returns {Promise<InvokeResult>}
   */
  async invoke(program, params = {}) {
    const entry = describe(program);
    const { argv, inputs, outputPaths, formats } = buildArgs(entry, params);
    const res = await this.run(program, argv, { inputs, outputs: Object.values(outputPaths) });

    const outputs = {};
    for (const [name, path] of Object.entries(outputPaths)) {
      const bytes = res.outputs[path];
      if (!bytes) continue;
      outputs[name] = formats[name] === 'csv'
        ? { csv: new TextDecoder().decode(bytes), bytes }
        : { wav: bytes, ...decodeWav(bytes) };
    }

    // A program that fails prints why on stderr; surface that rather than
    // leaving the caller to infer it from an empty result.
    if (res.exitCode !== 0 && !Object.keys(outputs).length) {
      throw new Error(
        `${program} failed (exit ${res.exitCode}).\n${(res.stderr || res.stdout).trim()}`
      );
    }
    return { outputs, exitCode: res.exitCode, stdout: res.stdout, stderr: res.stderr };
  }

  /**
   * Run a slicing program and return the slice points, in samples.
   *
   *   const points = await fluid.slice('fluid-noveltyslice', wav, { threshold: 0.4 });
   *
   * @param {string} program  a program whose output is `indices`
   * @param {Uint8Array|object} source
   * @param {Record<string, any>} [params]
   * @returns {Promise<number[]>}
   */
  async slice(program, source, params = {}) {
    if (kindOf(program) !== 'slicer') {
      throw new Error(`${program} is not a slicing program (it writes ${describe(program).outputs.join(', ') || 'nothing'})`);
    }
    const { outputs } = await this.invoke(program, { ...params, source });
    const indices = outputs.indices;
    if (!indices) return [];
    return Array.from(indices.channelData[0] || [], (v) => Math.round(v));
  }

  /**
   * Run an analysis program and return its features: one channel per
   * descriptor, one frame per analysis hop.
   *
   *   const { channelData } = await fluid.analyse('fluid-mfcc', wav, { numCoeffs: 13 });
   *
   * @param {string} program  a program whose output is `features`
   * @param {Uint8Array|object} source
   * @param {Record<string, any>} [params]
   * @returns {Promise<{sampleRate:number, numChannels:number, length:number, channelData:Float32Array[], wav:Uint8Array}>}
   */
  async analyse(program, source, params = {}) {
    if (kindOf(program) !== 'analyser') {
      throw new Error(`${program} is not an analysis program (it writes ${describe(program).outputs.join(', ') || 'nothing'})`);
    }
    const { outputs } = await this.invoke(program, { ...params, source });
    if (!outputs.features) throw new Error(`${program} produced no features buffer`);
    return outputs.features;
  }

  /** US spelling alias for {@link Fluid#analyse}. */
  analyze(program, source, params) {
    return this.analyse(program, source, params);
  }

  /**
   * Run a decomposition program and return each audio output as WAV bytes.
   *
   *   const { harmonic, percussive } = await fluid.decompose('fluid-hpss', wav);
   *
   * @param {string} program
   * @param {Uint8Array|object} source
   * @param {Record<string, any>} [params]
   * @returns {Promise<Record<string, Uint8Array>>}
   */
  async decompose(program, source, params = {}) {
    const { outputs } = await this.invoke(program, { ...params, source });
    const out = {};
    for (const [name, o] of Object.entries(outputs)) out[name] = o.wav ?? o.bytes;
    return out;
  }

  /**
   * The Emscripten JS runtime a program was linked against. The build shares
   * one file between every program with an identical runtime (see
   * scripts/share-glue.mjs) and records the pairing in manifest.json, so the
   * factory is cached per runtime file rather than per program. Builds made
   * before that sharing existed have no `runtime` map; fall back to the
   * per-program file those produced.
   */
  async _factory(program) {
    const { runtime } = await this._manifest();
    const file = runtime?.[program] ?? `${program}.js`;
    if (!this._factories.has(file)) {
      const url = new URL(file, this._baseUrl).href;
      this._factories.set(file, import(/* @vite-ignore */ url).then((m) => m.default));
    }
    return this._factories.get(file);
  }
}

/**
 * Turn a typed parameter object into the program's argv, alongside the MEMFS
 * files to stage and read back. Exported for tests and for callers that want to
 * see (or adjust) the command line before running it.
 *
 * @param {object} entry  a CATALOG entry
 * @param {Record<string, any>} params
 */
export function buildArgs(entry, params = {}) {
  const byName = new Map(entry.params.map((p) => [p.name.toLowerCase(), p]));
  const given = new Map();
  for (const [k, v] of Object.entries(params)) {
    const key = k.toLowerCase();
    if (!byName.has(key)) {
      throw new Error(
        `${entry.program}: unknown parameter "${k}". Accepts: ` +
        entry.params.map((p) => p.name).join(', ')
      );
    }
    given.set(key, v);
  }

  const argv = [];
  const inputs = {};
  const outputPaths = {};
  const formats = {};

  for (const p of entry.params) {
    const key = p.name.toLowerCase();
    const has = given.has(key);
    const value = given.get(key);

    if (p.type === 'inputBuffer') {
      if (!has || value == null) {
        // Only the first input is mandatory in practice, but a program given no
        // source at all fails deep inside the CLI with an opaque message.
        if (p.name === entry.inputs[0]) {
          throw new Error(`${entry.program}: required input buffer "${p.name}" is missing`);
        }
        continue;
      }
      const path = `/in_${p.name}.wav`;
      inputs[path] = toAudioBytes(value, `${entry.program}: parameter "${p.name}"`);
      argv.push(p.option, path);
      continue;
    }

    if (p.type === 'buffer' || p.type === 'bufferArray') {
      if (has && (value === false || value == null)) continue; // explicitly skipped
      const csv = value === 'csv' || value === '.csv';
      const path = `/out_${p.name}.${csv ? 'csv' : 'wav'}`;
      outputPaths[p.name] = path;
      formats[p.name] = csv ? 'csv' : 'wav';
      argv.push(p.option, path);
      continue;
    }

    if (!has || value == null) continue; // leave the program on its own default

    argv.push(p.option, ...formatValue(p, value, entry.program).map(String));
  }

  return { argv, inputs, outputPaths, formats };
}

/**
 * The value tokens for one non-buffer parameter (the option flag is added by
 * the caller).
 *
 * Several parameters take more than one value — `fftSettings` takes four
 * (window, hop, FFT size, maximum FFT size) and the "runtime max" numbers take
 * two (value, maximum) — and the CLI insists on being given all of them. The
 * trailing slots are the ones a caller rarely cares about, so a short list is
 * padded with -1, which is exactly the "unset, work it out yourself" value the
 * parameters are declared with in C++.
 */
function formatValue(p, value, program) {
  const size = p.size || 1;

  if (p.type === 'enum') {
    // Accept either the index or the choice name, case-insensitively.
    if (typeof value === 'string' && p.choices) {
      const i = p.choices.findIndex((c) => c.toLowerCase() === value.toLowerCase());
      if (i < 0) {
        throw new Error(`${program}: "${value}" is not a valid ${p.name}; choose one of ${p.choices.join(', ')}`);
      }
      return [i];
    }
    return [value];
  }

  if (p.type === 'choices') {
    // A bitset, which the CLI parses from a single space-separated argument.
    const list = Array.isArray(value) ? value : String(value).split(/\s+/);
    if (p.choices) {
      for (const c of list) {
        if (!p.choices.some((k) => k.toLowerCase() === String(c).toLowerCase())) {
          throw new Error(`${program}: "${c}" is not a valid ${p.name}; choose from ${p.choices.join(', ')}`);
        }
      }
    }
    return [list.join(' ')];
  }

  const values = Array.isArray(value) ? [...value] : [value];
  if (values.length > size) {
    throw new Error(
      `${program}: ${p.name} takes at most ${size} value${size === 1 ? '' : 's'}, got ${values.length}`
    );
  }
  checkValue(p, values[0], program);
  while (values.length < size) values.push(-1);
  return values;
}

/**
 * Reject a value that breaks the constraints the parameter was declared with.
 *
 * This is not defensive tidiness. The programs do not validate these
 * themselves, and out-of-range values reach the algorithms and trap: a
 * `kernelSize` of 2 or 4 (declared `Min(3)`, `Odd()`) reads outside the
 * WebAssembly heap and aborts the module, taking any error handling with it.
 * A thrown JavaScript error is both recoverable and says what was wrong.
 *
 * Only the leading value is checked — the trailing slots of the multi-value
 * parameters are "unset" markers (-1) rather than quantities. If a constraint
 * is ever too strict for what you need, `Fluid#run` takes a raw argv and skips
 * all of this.
 */
export function checkValue(p, v, program) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return;
  const bad = (why) => {
    throw new RangeError(`${program}: ${p.name} ${why} (got ${v})`);
  };
  if (p.min !== undefined && v < p.min) bad(`must be at least ${p.min}`);
  if (p.max !== undefined && v > p.max) bad(`must be at most ${p.max}`);
  if (p.odd && v % 2 === 0) bad('must be odd');
  if (p.powerOfTwo && (v < 1 || (v & (v - 1)) !== 0)) bad('must be a power of two');
}

/**
 * Coerce whatever the caller passed for an input buffer into audio file bytes.
 * Accepts WAV/AIFF bytes (passed through untouched), a decoded
 * `{ sampleRate, channelData }`, or a Web Audio AudioBuffer.
 */
function toAudioBytes(value, what) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (value && typeof value.getChannelData === 'function') return audioBufferToWav(value);
  if (value && Array.isArray(value.channelData)) {
    return encodeWav({ sampleRate: value.sampleRate || 44100, channelData: value.channelData });
  }
  throw new TypeError(
    `${what} must be WAV/AIFF bytes, a decoded { sampleRate, channelData }, or an AudioBuffer`
  );
}

function mkdirp(FS, filePath) {
  const parts = filePath.split('/').slice(1, -1);
  let cur = '';
  for (const p of parts) {
    cur += '/' + p;
    try { FS.mkdir(cur); } catch { /* exists */ }
  }
}

function selfUrl() {
  // import.meta.url in module scope; works in Node and browsers.
  return import.meta.url;
}

/**
 * @typedef {object} InvokeResult
 * @property {Record<string, any>} outputs  decoded output buffers, keyed by parameter name
 * @property {number} exitCode
 * @property {string} stdout
 * @property {string} stderr
 */
