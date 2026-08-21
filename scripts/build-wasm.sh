#!/usr/bin/env bash
#
# Build the FluCoMa command-line programs as WebAssembly modules for the npm
# package.
#
# Each program is linked as an ES6 module using Emscripten's in-memory
# filesystem (MEMFS), so the same .wasm runs in Node, a browser and a Web
# Worker. The JS wrapper (src/index.js) stages buffers into MEMFS, calls the
# program's main(), and reads the results back out.
#
# The build reuses the project's own CMake — the same generate_cli_source()
# stubs the native build uses — so the WebAssembly programs are the same
# programs, with the same option grammar, rather than a parallel port that can
# drift.
#
# Requires an activated Emscripten SDK (source emsdk_env.sh).
# Output: wasm/<program>.wasm per program, one shared wasm/fluid-runtime-*.js
# per distinct JS runtime, and wasm/manifest.json mapping between them.
#
# Environment:
#   FLUID_PATH        path to a flucoma-core checkout (else CMake fetches it)
#   FLUCOMA_WASM_OUT  output directory (default: <pkg>/wasm)
#   FLUCOMA_WASM_JOBS parallel build jobs (default: number of CPUs)
#
set -euo pipefail

PKG="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${FLUCOMA_WASM_OUT:-$PKG/wasm}"
BUILD="$PKG/build-wasm"
JOBS="${FLUCOMA_WASM_JOBS:-$( (command -v nproc >/dev/null && nproc) || sysctl -n hw.ncpu 2>/dev/null || echo 4 )}"

# manifest.json is written only at the very end (by scripts/share-glue.mjs). A
# build that dies partway would otherwise leave the previous run's manifest
# advertising modules this run never produced — the wrapper trusts the manifest,
# so that mismatch surfaces much later as an unhelpful "cannot find module" at
# runtime.
trap 'rc=$?; if [ $rc -ne 0 ]; then
  echo "" >&2
  echo ">> BUILD FAILED (exit $rc) — $OUT/manifest.json was NOT regenerated and may" >&2
  echo ">> now describe programs this build did not produce. Re-run a full build" >&2
  echo ">> before publishing." >&2
fi' EXIT

if ! command -v emcc >/dev/null 2>&1; then
  echo "error: emcc not found. Run 'source /path/to/emsdk/emsdk_env.sh' first." >&2
  exit 1
fi

# HISSTools selects its aligned allocator by platform macro and has no
# Emscripten branch; this header supplies the two names its fallback branch
# expects. See scripts/wasm/emscripten-compat.h.
COMPAT="$PKG/scripts/wasm/emscripten-compat.h"

# STACK_SIZE=8MB (vs Emscripten's 64KB default): the FluCoMa algorithms declare
# sizeable local buffers and recurse through Eigen expression templates, which
# overflow the small default stack and trap. FORCE_FILESYSTEM stages files
# through MEMFS so one .wasm serves Node, the browser and Workers.
# INVOKE_RUN=0 + EXIT_RUNTIME=0 let the wrapper call main() repeatedly-ish via
# callMain() rather than at module load. --closure 1 halves the JS glue
# (61 KB -> 30 KB); the runtime methods the wrapper needs are named in
# EXPORTED_RUNTIME_METHODS, so Closure keeps them.
LINKFLAGS="-s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=createFluidModule \
  -s INVOKE_RUN=0 -s EXIT_RUNTIME=0 -s FORCE_FILESYSTEM=1 \
  -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=67108864 -s STACK_SIZE=8388608 \
  -s ENVIRONMENT=web,worker,node \
  -s EXPORTED_RUNTIME_METHODS=callMain,FS \
  --closure 1"

CMAKE_ARGS=(
  -DCMAKE_BUILD_TYPE=Release
  -DCMAKE_EXECUTABLE_SUFFIX=".js"
  -DCMAKE_CXX_FLAGS="-include $COMPAT"
  -DCMAKE_EXE_LINKER_FLAGS="$LINKFLAGS"
  -DFLUCOMA_CLI_RUNTIME_OUTPUT_DIRECTORY="$OUT"
)
[ -n "${FLUID_PATH:-}" ] && CMAKE_ARGS+=(-DFLUID_PATH="$FLUID_PATH")

mkdir -p "$OUT"
# Drop stale modules so a target that stops building can't leave an old artifact
# behind for the manifest check (and the tests) to pass against.
rm -f "$OUT"/*.js "$OUT"/*.wasm "$OUT"/manifest.json

echo ">> configuring (emcmake cmake)"
mkdir -p "$BUILD"
( cd "$BUILD" && emcmake cmake "$PKG" "${CMAKE_ARGS[@]}" )

echo ">> building with $JOBS job(s)"
cmake --build "$BUILD" --parallel "$JOBS"

# Every program CMake generated a target for. Deriving the expected list from
# the build system (rather than hardcoding it) means a client added upstream
# shows up here automatically — and a client that silently stops building is
# caught by the gap check below instead of vanishing from the package.
expected=()
while IFS= read -r t; do expected+=("$t"); done < <(
  cmake --build "$BUILD" --target help 2>/dev/null \
    | sed -nE 's/^\.\.\. (fluid-[A-Za-z0-9_-]+)$/\1/p' | sort -u
)

built=(); missing=()
for p in "${expected[@]}"; do
  if [ -f "$OUT/$p.js" ] && [ -f "$OUT/$p.wasm" ]; then built+=("$p"); else missing+=("$p"); fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo ">> !! ${#missing[@]} program(s) produced no module: ${missing[*]}" >&2
  exit 1
fi
if [ ${#built[@]} -eq 0 ]; then
  echo ">> !! no programs were built — check the CMake configure output above" >&2
  exit 1
fi

# Emscripten writes a copy of its ~30 KB JS runtime next to every module, and
# those copies are identical apart from the .wasm filename they load. This
# collapses them to one file per distinct runtime and writes the manifest —
# which is both the wrapper's source of truth for "which programs exist" and
# the map from a program to the runtime file it was linked against.
node "$PKG/scripts/share-glue.mjs" "$OUT" "${built[@]}"
echo
echo "Built ${#built[@]} program(s) into $OUT"
