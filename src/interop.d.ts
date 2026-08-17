// Type definitions for flucoma-wasm/interop

import type { Fluid, AudioInput, DecodedWav } from '../index.js';

export interface SliceBounds {
  start: number;
  end: number;
}

/** Cut audio into segments at the given sample positions. */
export function cut(
  audio: AudioInput,
  points: number[],
  options?: { trailing?: boolean }
): { sampleRate: number; segments: Uint8Array[]; bounds: SliceBounds[] };

/** Join segments back into one 32-bit float WAV, optionally crossfading the joins. */
export function concat(
  segments: (Uint8Array | DecodedWav)[],
  options?: { crossfade?: number; sampleRate?: number }
): Uint8Array;

/**
 * Slice audio with a FluCoMa slicer, transform every segment, and reassemble.
 * Return `null` from the callback to drop a segment.
 */
export function mapSlices(
  fluid: Fluid,
  audio: AudioInput,
  fn: (segment: Uint8Array, index: number, bounds: SliceBounds)
    => Promise<Uint8Array | null> | Uint8Array | null,
  options?: {
    program?: string;
    params?: Record<string, any>;
    crossfade?: number;
    concurrency?: number;
  }
): Promise<Uint8Array>;

/** Slice audio and reduce a FluCoMa analysis to one number per descriptor per segment. */
export function describeSlices(
  fluid: Fluid,
  audio: AudioInput,
  options?: {
    program?: string;
    params?: Record<string, any>;
    analyser?: string;
    analysisParams?: Record<string, any>;
    summary?: 'mean' | 'median' | 'max';
  }
): Promise<{ segment: Uint8Array; bounds: SliceBounds; descriptors: number[] }[]>;

/** Reduce an analysis result to one number per descriptor. */
export function summarise(
  analysis: { channelData: Float32Array[] },
  how?: 'mean' | 'median' | 'max'
): number[];

/** US spelling alias for `summarise`. */
export const summarize: typeof summarise;
