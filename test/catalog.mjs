// The catalog must agree with what was actually built, and describe it well
// enough for buildArgs to produce a command line the programs accept.

import { readFileSync } from 'node:fs';
import { CATALOG, PROGRAMS, kindOf, describe, buildArgs } from '../src/index.js';
import { ok, eq, section, done, throws, tone } from './helpers.mjs';

section('catalog');

const manifest = JSON.parse(readFileSync(new URL('../wasm/manifest.json', import.meta.url), 'utf8'));

ok(manifest.programs.length > 0, 'the build produced at least one program');
eq(PROGRAMS.length, manifest.programs.length, 'catalog and manifest agree on how many programs there are');
for (const p of manifest.programs) {
  ok(CATALOG[p], `${p} (built) is described by the catalog`);
}
for (const p of PROGRAMS) {
  ok(manifest.programs.includes(p), `${p} (catalogued) was actually built`);
}

const VALID_TYPES = new Set([
  'inputBuffer', 'buffer', 'bufferArray', 'long', 'float', 'enum', 'choices',
  'string', 'fft', 'longArray', 'floatArray', 'floatPairsArray',
]);

for (const [name, entry] of Object.entries(CATALOG)) {
  ok(entry.params.length > 0, `${name} has parameters`);
  ok(entry.inputs.length > 0, `${name} reads at least one input buffer`);
  ok(entry.outputs.length > 0, `${name} writes at least one output buffer`);
  ok(entry.client.startsWith('Buf'), `${name} names its FluCoMa client`);
  // The URL comes from the program's own -help banner, so this checks the
  // build stamped a plausible page in rather than that the page exists.
  ok(/^https:\/\/learn\.flucoma\.org\/reference\/[a-z0-9]+\/$/.test(entry.docs || ''),
    `${name} points at its reference page (got "${entry.docs}")`);

  for (const p of entry.params) {
    ok(VALID_TYPES.has(p.type), `${name}/${p.name} has a known type (got "${p.type}")`);
    ok(Number.isInteger(p.size) && p.size >= 1, `${name}/${p.name} declares how many values it takes`);
    eq(p.option, '-' + p.name.toLowerCase(), `${name}/${p.name} option matches its name`);
    if (p.type === 'enum' || p.type === 'choices') {
      ok(Array.isArray(p.choices) && p.choices.length > 0, `${name}/${p.name} lists its choices`);
    }
  }

  const names = entry.params.map((p) => p.name);
  eq(new Set(names).size, names.length, `${name} has no duplicate parameter names`);
}

// Every program is classified, and the three main families are all present.
for (const p of PROGRAMS) ok(kindOf(p) !== 'unknown', `${p} is classified`);
for (const kind of ['slicer', 'analyser', 'decomposer']) {
  ok(PROGRAMS.some((p) => kindOf(p) === kind), `at least one ${kind} is bundled`);
}

// The arities that are easy to get wrong, checked against the C++ declarations.
eq(CATALOG['fluid-mfcc'].params.find((p) => p.name === 'fftSettings').size, 4,
  'fftSettings takes four values (window, hop, FFT size, max FFT size)');
eq(CATALOG['fluid-mfcc'].params.find((p) => p.name === 'numCoeffs').size, 2,
  'a runtime-max parameter takes two values');
eq(CATALOG['fluid-mfcc'].params.find((p) => p.name === 'startCoeff').size, 1,
  'a plain long takes one value');

section('buildArgs');

const wav = tone(440, 0.2);
const mfcc = CATALOG['fluid-mfcc'];

{
  const { argv, inputs, outputPaths } = buildArgs(mfcc, { source: wav, numCoeffs: 13 });
  ok(argv.includes('-source'), 'the source option is emitted');
  ok(Object.keys(inputs).length === 1, 'the source audio is staged');
  eq(outputPaths.features, '/out_features.wav', 'the features output is requested by default');
  // 13 with the runtime max padded to -1.
  const i = argv.indexOf('-numcoeffs');
  eq(argv[i + 1], '13', 'the given value is passed through');
  eq(argv[i + 2], '-1', 'the unset runtime max is padded with -1');
}

{
  const { argv } = buildArgs(mfcc, { source: wav, fftSettings: [2048, 512, 2048] });
  const i = argv.indexOf('-fftsettings');
  eq(argv.slice(i + 1, i + 5).join(' '), '2048 512 2048 -1', 'a short fftSettings is padded to four values');
}

{
  const { formats, outputPaths } = buildArgs(mfcc, { source: wav, features: 'csv' });
  eq(formats.features, 'csv', "features: 'csv' selects CSV output");
  ok(outputPaths.features.endsWith('.csv'), 'the CSV output path has a .csv extension');
}

{
  const { outputPaths } = buildArgs(CATALOG['fluid-hpss'], { source: wav, residual: false });
  ok(!('residual' in outputPaths), 'an output set to false is not requested');
  ok('harmonic' in outputPaths, 'the other outputs are still requested');
}

{
  const { argv } = buildArgs(CATALOG['fluid-noveltyslice'], { source: wav, algorithm: 'MFCC' });
  const i = argv.indexOf('-algorithm');
  eq(argv[i + 1], '1', 'an enum choice name is converted to its index');
}

{
  const { argv } = buildArgs(CATALOG['fluid-stats'], { source: wav, select: ['mean', 'std'] });
  const i = argv.indexOf('-select');
  eq(argv[i + 1], 'mean std', 'a choices parameter becomes one space-separated argument');
}

await throws(() => buildArgs(mfcc, { source: wav, nosuchparam: 1 }),
  /unknown parameter/, 'an unknown parameter is rejected');
await throws(() => buildArgs(mfcc, {}),
  /required input buffer/, 'a missing source is rejected');
await throws(() => buildArgs(mfcc, { source: wav, fftSettings: [1, 2, 3, 4, 5] }),
  /takes at most 4/, 'too many values are rejected');
await throws(() => buildArgs(CATALOG['fluid-noveltyslice'], { source: wav, algorithm: 'nope' }),
  /not a valid algorithm/, 'an invalid enum choice is rejected');
await throws(() => buildArgs(CATALOG['fluid-stats'], { source: wav, select: ['nope'] }),
  /not a valid select/, 'an invalid choices value is rejected');
await throws(() => buildArgs(mfcc, { source: 42 }),
  /must be WAV\/AIFF bytes/, 'a non-audio source is rejected');
await throws(() => describe('fluid-nope'), /unknown program/, 'an unknown program is rejected');

done('catalog');
