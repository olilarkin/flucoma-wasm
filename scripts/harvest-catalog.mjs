#!/usr/bin/env node
// Build src/catalog.json — the typed description of every bundled FluCoMa
// program: its client name, its ordered command-line options, and each option's
// type, default and constraints.
//
// Two sources, each used for what it is authoritative about:
//
//   1. The built WebAssembly programs themselves. Running `<program> -help`
//      iterates the *actual* composed parameter descriptor set and prints each
//      option name and display name in the order the program accepts them.
//      That is the ground truth for "what does this program take", and it can
//      never drift from the shipped binary.
//
//   2. The flucoma-core C++ headers. `-help` prints no types, defaults or
//      ranges, so those are parsed out of the `defineParameters(...)` blocks
//      that declare them and matched back onto the options from (1) by name.
//
// Only the client's own header is searched for its parameters, because the same
// parameter name means different things in different clients ('threshold' is
// 0.5 in noveltyslice and 0.01 in ampslice) — a global name -> spec map would
// silently mix them up. Wrapper-injected parameters (startFrame, numChans, ...)
// come from FluidNRTClientWrapper.hpp, which declares them once for everyone.
//
// An option that (1) reports but (2) cannot type is emitted with
// `"type": "unknown"` rather than guessed at, and counted in the summary.
//
// Usage: node scripts/harvest-catalog.mjs [--core <path-to-flucoma-core>]

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WASM = process.env.FLUCOMA_WASM_OUT || join(PKG, 'wasm');

const coreArg = process.argv.indexOf('--core');
const CORE = resolve(
  coreArg > -1 ? process.argv[coreArg + 1]
    : process.env.FLUID_PATH || findCoreInBuild() || join(PKG, '..', 'flucoma-core')
);

if (!existsSync(join(CORE, 'include'))) {
  console.error(`error: no flucoma-core checkout at ${CORE}\n` +
    `       pass --core <path> or set FLUID_PATH.`);
  process.exit(1);
}

// The CMake build fetches flucoma-core into build-wasm/_deps when FLUID_PATH
// isn't set, so a plain `npm run build:wasm && npm run catalog` works unaided.
function findCoreInBuild() {
  const p = join(PKG, 'build-wasm', '_deps', 'flucoma-core-src');
  return existsSync(p) ? p : null;
}

// ---- (2) parse parameter declarations out of the C++ ------------------------

// The declaration forms used across flucoma-core. Names are matched with an
// optional template argument list, e.g. LongParamRuntimeMax<Primary>("...").
const PARAM_CTORS = [
  'InputBufferParam', 'BufferParam',
  'LongParamRuntimeMax', 'FloatParamRuntimeMax',
  'LongParam', 'FloatParam', 'EnumParam', 'StringParam', 'ChoicesParam',
  'FFTParam', 'LongArrayParam', 'FloatArrayParam', 'BufferArrayParam',
  'InputLongArrayParam', 'InputFloatArrayParam', 'FloatPairsArrayParam',
  'LongArrayParamRuntimeMax', 'FloatArrayParamRuntimeMax',
];

const TYPE_OF = {
  InputBufferParam: 'inputBuffer',
  BufferParam: 'buffer',
  BufferArrayParam: 'bufferArray',
  LongParam: 'long',
  LongParamRuntimeMax: 'long',
  FloatParam: 'float',
  FloatParamRuntimeMax: 'float',
  EnumParam: 'enum',
  StringParam: 'string',
  ChoicesParam: 'choices',
  FFTParam: 'fft',
  LongArrayParam: 'longArray',
  LongArrayParamRuntimeMax: 'longArray',
  FloatArrayParam: 'floatArray',
  FloatArrayParamRuntimeMax: 'floatArray',
  InputLongArrayParam: 'longArray',
  InputFloatArrayParam: 'floatArray',
  FloatPairsArrayParam: 'floatPairsArray',
};

/** Split an argument list on top-level commas, respecting nesting and strings. */
function splitArgs(src) {
  const out = [];
  let depth = 0, cur = '', inStr = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      cur += c;
      if (c === '\\') { cur += src[++i] ?? ''; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; cur += c; continue; }
    if (c === '(' || c === '<' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === '>' || c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Read the balanced (...) starting at `open`; returns [body, indexAfterClose]. */
function readParens(src, open) {
  let depth = 0, inStr = false;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return [src.slice(open + 1, i), i + 1]; }
  }
  return [null, src.length];
}

const unquote = (s) => {
  const m = /^"((?:[^"\\]|\\.)*)"$/.exec(s.trim());
  return m ? m[1].replace(/\\(.)/g, '$1') : null;
};

const numeric = (s) => {
  if (s == null) return undefined;
  // Strip C++ numeric suffixes and casts: 0.5, 1e3, -1, 100u, 2.f, index(4)
  const t = s.trim().replace(/^\((?:[A-Za-z_:<>\s]+)\)\s*/, '');
  const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(t);
  if (!m) return undefined;
  const v = Number(m[0]);
  return Number.isFinite(v) ? v : undefined;
};

/**
 * Strip comments so a `//` or `/* *\/` mention of a parameter constructor can't
 * be parsed as a real declaration. String literals are preserved.
 */
function stripComments(src) {
  let out = '', inStr = false, inChr = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i], d = src[i + 1];
    if (inStr || inChr) {
      out += c;
      if (c === '\\') { out += src[++i] ?? ''; continue; }
      if (inStr && c === '"') inStr = false;
      if (inChr && c === "'") inChr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === "'") { inChr = true; out += c; continue; }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; out += ' '; continue; }
    out += c;
  }
  return out;
}

/** Every parameter declaration in one source file, keyed by lowercased name. */
function parseParams(file) {
  const src = stripComments(readFileSync(file, 'utf8'));
  const found = new Map();
  const ctorRe = new RegExp(`\\b(${PARAM_CTORS.join('|')})\\s*(?:<[^;()]*?>)?\\s*\\(`, 'g');
  let m;
  while ((m = ctorRe.exec(src))) {
    const ctor = m[1];
    const [body] = readParens(src, ctorRe.lastIndex - 1);
    if (body == null) continue;
    const args = splitArgs(body);
    const name = unquote(args[0]);
    const display = unquote(args[1]);
    // A real declaration always starts with two string literals (name, display).
    if (!name || display == null) continue;

    const spec = { type: TYPE_OF[ctor] || 'unknown', display };
    const rest = args.slice(2);

    if (ctor === 'EnumParam') {
      spec.default = numeric(rest[0]) ?? 0;
      spec.choices = rest.slice(1).map(unquote).filter((s) => s != null);
    } else if (ctor === 'ChoicesParam') {
      spec.choices = rest.map(unquote).filter((s) => s != null);
    } else if (ctor === 'FFTParam') {
      const d = rest.map(numeric).filter((v) => v !== undefined);
      if (d.length) spec.default = d.slice(0, 3);
    } else if (spec.type === 'long' || spec.type === 'float') {
      const d = numeric(rest[0]);
      if (d !== undefined) spec.default = d;
    } else if (ctor === 'StringParam') {
      const d = unquote(rest[0]);
      if (d != null) spec.default = d;
    }

    // Numeric bounds, where declared as Min(x) / Max(x).
    for (const c of rest) {
      const mn = /\bMin\s*\(\s*([^)]*)\)/.exec(c);
      const mx = /\bMax\s*\(\s*([^)]*)\)/.exec(c);
      if (mn && numeric(mn[1]) !== undefined) spec.min = numeric(mn[1]);
      if (mx && numeric(mx[1]) !== undefined) spec.max = numeric(mx[1]);
      if (/\bOdd\s*\(/.test(c)) spec.odd = true;
      if (/\bPowerOfTwo\s*\(/.test(c)) spec.powerOfTwo = true;
    }

    // First declaration wins: a header's own block precedes any it includes.
    if (!found.has(name.toLowerCase())) found.set(name.toLowerCase(), { name, ...spec });
  }
  return found;
}

// ---- client -> header, from the build system --------------------------------

/** Parse add_client(BufX <header> CLASS <class>) out of FlucomaClients.cmake. */
function readClients() {
  const src = readFileSync(join(CORE, 'FlucomaClients.cmake'), 'utf8');
  const out = new Map();
  const re = /add_client\(\s*([A-Za-z0-9_]+)\s+([^\s)]+)(?:\s+CLASS\s+([A-Za-z0-9_]+))?/g;
  let m;
  while ((m = re.exec(src))) {
    const [, client, header, cls] = m;
    // Mirrors make_external_name() in scripts/MakeCLIStub.cmake.
    const program = client.replace('Buf', 'fluid-').toLowerCase();
    out.set(program, { client, header, class: cls || null });
  }
  return out;
}

// ---- (1) ask each built program for its own option list ---------------------

const factories = new Map();
async function factoryFor(program) {
  if (!factories.has(program)) {
    factories.set(program, (await import(pathToFileURL(join(WASM, `${program}.js`)).href)).default);
  }
  return factories.get(program);
}

/** Run one argv through a fresh instance of the program; return everything it printed. */
async function runArgs(program, args) {
  const factory = await factoryFor(program);
  let out = '';
  const Module = await factory({
    noInitialRun: true,
    print: (s) => { out += s + '\n'; },
    printErr: (s) => { out += s + '\n'; },
  });
  try { Module.callMain([...args]); } catch { /* exit status is not interesting here */ }
  return out;
}

/** Options in declaration order: `-name<spaces>Display Name` per line. */
function parseHelp(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const m = /^(-[a-z0-9_]+)\s{2,}(.+?)\s*$/.exec(line);
    if (m) out.push({ option: m[1], display: m[2] });
  }
  return out;
}

// How many values an option takes on the command line. This is the parameter's
// `fixedSize`, and it is emphatically not always 1: FFTParam takes four
// (win, hop, fft, maxFFT), the RuntimeMax variants take two (value, max), and
// FloatPairsArrayParam takes four. Getting it wrong produces a command line the
// program rejects, so it is measured against the shipped binary rather than
// inferred from the declaration's C++ type.
//
// The probe exploits the three distinct diagnostics the CLI's argument
// validator emits. Passing `-opt 1 1 ... 1 -zzz` for increasing counts of `1`:
//
//   too few values  -> the sentinel is read as a value  -> "Values wrong type"
//   exactly right   -> the sentinel is read as an option -> "Unknown option -zzz"
//   too many        -> a stray `1` is read as an option  -> "Expected option, but found 1"
//
// so the count that yields "Unknown option" is the arity. `1` is a valid token
// for every parameter type here (numbers, enums, choices and buffer paths all
// accept it), and the trailing sentinel guarantees the validator's
// "is there another argument after the values?" check always has one.
const SENTINEL = '-fluid-wasm-arity-probe';
const MAX_ARITY = 8;

async function probeArity(program, option) {
  for (let k = 1; k <= MAX_ARITY; k++) {
    const out = await runArgs(program, [option, ...Array(k).fill('1'), SENTINEL]);
    if (out.includes(`Unknown option ${SENTINEL}`)) return k;
  }
  return null;
}

// ---- assemble ---------------------------------------------------------------

const manifestPath = join(WASM, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`error: ${manifestPath} not found — run scripts/build-wasm.sh first.`);
  process.exit(1);
}
const programs = JSON.parse(readFileSync(manifestPath, 'utf8')).programs;
const clients = readClients();

// Wrapper-injected parameters (source offsets, channel ranges) are declared
// once, for every NRT client, in the wrapper header.
const wrapperParams = parseParams(join(CORE, 'include/flucoma/clients/common/FluidNRTClientWrapper.hpp'));

const catalog = {};
let unknownCount = 0;
const unknownNames = new Set();

for (const program of programs) {
  const info = clients.get(program);
  if (!info) {
    console.error(`!! ${program}: no add_client() entry — skipping`);
    continue;
  }
  const headerPath = join(CORE, 'include', info.header);
  if (!existsSync(headerPath)) {
    console.error(`!! ${program}: header ${info.header} not found — skipping`);
    continue;
  }

  const own = parseParams(headerPath);
  const options = parseHelp(await runArgs(program, ['-help']));
  if (!options.length) {
    console.error(`!! ${program}: -help produced no options — skipping`);
    continue;
  }

  const params = [];
  for (const { option, display } of options) {
    const key = option.slice(1); // drop the leading '-'
    const size = await probeArity(program, option);
    if (size == null) {
      console.error(`!! ${program}: could not determine how many values ${option} takes`);
      process.exitCode = 1;
      continue;
    }
    const spec = own.get(key) || wrapperParams.get(key);
    if (!spec) {
      unknownCount++;
      unknownNames.add(`${program}:${option}`);
      // Display name and arity still come from the program itself, so the entry
      // stays usable even when its declaration could not be located.
      params.push({ name: key, option, display, type: 'unknown', size });
      continue;
    }
    const { name, display: _decl, ...rest } = spec;
    params.push({ name, option, display, size, ...rest });
  }

  catalog[program] = {
    program,
    client: info.client,
    header: info.header,
    inputs: params.filter((p) => p.type === 'inputBuffer').map((p) => p.name),
    outputs: params.filter((p) => p.type === 'buffer' || p.type === 'bufferArray').map((p) => p.name),
    params,
  };
}

// Emitted as an ES module rather than JSON so it imports identically in Node,
// browsers and every bundler — JSON import attributes are still uneven.
const outPath = join(PKG, 'src', 'catalog.js');
writeFileSync(outPath,
  '// GENERATED FILE — do not edit.\n' +
  '// Produced by scripts/harvest-catalog.mjs from the built WebAssembly\n' +
  '// programs and the flucoma-core headers. Run `npm run catalog` to refresh.\n' +
  '\n/** Every bundled program, keyed by program name. */\n' +
  'export const CATALOG = ' + JSON.stringify(catalog, null, 2) + ';\n');

const n = Object.keys(catalog).length;
console.log(`wrote ${outPath} (${n} programs)`);
if (unknownCount) {
  console.log(`${unknownCount} option(s) could not be typed from source:`);
  for (const u of [...unknownNames].sort()) console.log(`  ${u}`);
}
if (n !== programs.length) {
  console.error(`error: manifest lists ${programs.length} programs but only ${n} were catalogued`);
  process.exit(1);
}
