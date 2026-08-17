/*
Part of the Fluid Corpus Manipulation Project (http://www.flucoma.org/)
Licensed under the BSD-3 License.

Force-included (via -include) into every translation unit of the WebAssembly
build. See scripts/build-wasm.sh.

HISSTools' simd_support.hpp picks its aligned allocator by platform:

    #if defined(__APPLE__)   -> malloc / free
    #elif defined(__linux__) -> posix_memalign / free
    #else                    -> _aligned_malloc / _aligned_free   (MSVC)

Emscripten defines neither __APPLE__ nor __linux__, so it lands in the MSVC
branch and fails to link against the Windows CRT names. Rather than patch a
pinned third-party dependency, supply those two names in terms of the POSIX
allocator Emscripten does provide. Only compiled for Emscripten targets, so
native builds never see any of this.
*/

#pragma once

#ifdef __EMSCRIPTEN__

#include <stdlib.h>

#ifdef __cplusplus
extern "C" {
#endif

/* posix_memalign requires an alignment that is both a power of two and a
   multiple of sizeof(void*). HISSTools asks for alignof(T) on the scalar path
   (4 or 8), which is already valid on wasm32, but clamp anyway so a future
   SIMD/alignment change can't silently start returning EINVAL -> nullptr. */
static inline void* _aligned_malloc(size_t size, size_t alignment)
{
  void* mem = NULL;

  if (alignment < sizeof(void*)) alignment = sizeof(void*);

  if (posix_memalign(&mem, alignment, size) != 0) return NULL;

  return mem;
}

static inline void _aligned_free(void* ptr) { free(ptr); }

#ifdef __cplusplus
} // extern "C"
#endif

#endif // __EMSCRIPTEN__
