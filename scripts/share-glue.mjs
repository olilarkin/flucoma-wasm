// Collapse Emscripten's per-program JS glue into one shared file per distinct
// runtime, and write the manifest that maps programs to it.
//
// Emscripten emits <program>.js next to every <program>.wasm, and that glue is
// the same ~61 KB of runtime for every program — 1.4 MB of the package was 23
// duplicates. It is *not* universally identical, though: a program that uses
// randomness (the NMF and transient family) imports one extra function, so its
// glue carries an extra entry. Rather than assume one glue fits all, this
// groups the files by content and keeps one per distinct group — two, as
// things stand. A program is only ever paired with glue byte-identical to the
// glue it was linked against.
//
// Usage: node scripts/share-glue.mjs <out-dir> <program>...
// Writes: <out-dir>/fluid-runtime-<hash>.js  (one per group)
//         <out-dir>/manifest.json            (programs + program -> runtime)
// Removes: <out-dir>/<program>.js

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const [outDir, ...programs] = process.argv.slice(2);
if (!outDir || !programs.length) {
  console.error('usage: node scripts/share-glue.mjs <out-dir> <program>...');
  process.exit(2);
}

// The only per-program text in the glue is the name of the .wasm it loads, in
// findWasmBinary(). Swapping it for a placeholder is what makes two files
// comparable — and the placeholder is what ships, so glue used without a
// locateFile fails by naming the mistake rather than by silently loading some
// other program's module.
const PLACEHOLDER = '__FLUID_PROGRAM_SET_locateFile__';

const groups = new Map(); // normalised glue -> { file, programs[] }

for (const program of programs) {
  const path = join(outDir, `${program}.js`);
  let glue;
  try {
    glue = readFileSync(path, 'utf8');
  } catch {
    console.error(`share-glue: ${program}.js is missing — did the link step fail?`);
    process.exit(1);
  }

  const normalised = glue.split(program).join(PLACEHOLDER);
  if (normalised === glue) {
    console.error(`share-glue: ${program}.js never names its own .wasm file — ` +
      `the glue format has changed and this script no longer understands it.`);
    process.exit(1);
  }

  let group = groups.get(normalised);
  if (!group) {
    const hash = createHash('sha256').update(normalised).digest('hex').slice(0, 8);
    group = { file: `fluid-runtime-${hash}.js`, programs: [] };
    groups.set(normalised, group);
  }
  group.programs.push(program);
}

const runtime = {};
for (const [normalised, group] of groups) {
  writeFileSync(join(outDir, group.file), normalised);
  for (const program of group.programs) {
    runtime[program] = group.file;
    rmSync(join(outDir, `${program}.js`), { force: true });
  }
}

writeFileSync(
  join(outDir, 'manifest.json'),
  JSON.stringify({ programs, runtime }, null, 2) + '\n'
);

const shared = [...groups.values()];
console.log(`>> ${programs.length} program(s) share ${shared.length} runtime file(s):`);
for (const g of shared) console.log(`   ${g.file}  <- ${g.programs.length} program(s)`);
