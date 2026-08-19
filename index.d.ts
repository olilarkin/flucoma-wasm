// Type definitions for @olilarkin/flucoma-wasm

export interface DecodedWav {
  sampleRate: number;
  numChannels: number;
  length: number;
  /** One Float32Array of samples per channel (planar, de-interleaved). */
  channelData: Float32Array[];
  /** Source bit depth (bits per sample): 8/16/24/32. */
  bitDepth: number;
}

/** Audio accepted wherever an input buffer is expected. */
export type AudioInput =
  | Uint8Array
  | ArrayBuffer
  | { sampleRate: number; channelData: Float32Array[] }
  | { getChannelData(channel: number): Float32Array; numberOfChannels: number; sampleRate: number };

export type ParamType =
  | 'inputBuffer' | 'buffer' | 'bufferArray'
  | 'long' | 'float' | 'enum' | 'choices' | 'string' | 'fft'
  | 'longArray' | 'floatArray' | 'floatPairsArray'
  | 'unknown';

export interface ParamSpec {
  /** Parameter name as declared, e.g. `fftSettings`. */
  name: string;
  /** The command-line option, e.g. `-fftsettings`. */
  option: string;
  /** Human-readable name, as the program itself prints it. */
  display: string;
  type: ParamType;
  /**
   * How many values the option takes on the command line. Usually 1, but
   * `fftSettings` takes 4 (window, hop, FFT size, max FFT size) and the
   * "runtime max" parameters take 2 (value, maximum). Short arrays passed to
   * `invoke` are padded with -1, the same "unset" value the programs default to.
   */
  size: number;
  default?: number | number[] | string;
  min?: number;
  max?: number;
  odd?: boolean;
  powerOfTwo?: boolean;
  /** For `enum` and `choices` parameters. */
  choices?: string[];
}

export interface CatalogEntry {
  program: string;
  /** The FluCoMa client this program wraps, e.g. `BufNoveltySlice`. */
  client: string;
  /** Path of the declaring header within flucoma-core. */
  header: string;
  /**
   * The process's reference page, e.g.
   * `https://learn.flucoma.org/reference/mfcc/`. Absent for programs built
   * before the CLI started naming its own documentation page.
   */
  docs?: string;
  /** Names of the input buffer parameters. */
  inputs: string[];
  /** Names of the output buffer parameters. */
  outputs: string[];
  /** Every option, in the order the program declares them. */
  params: ParamSpec[];
}

/** Every bundled program, keyed by program name. */
export const CATALOG: Record<string, CatalogEntry>;

/** Names of the programs described by the catalog, sorted. */
export const PROGRAMS: readonly string[];

export type ProgramKind = 'slicer' | 'analyser' | 'decomposer' | 'stats' | 'unknown';

/** What a program produces, derived from the names of its output buffers. */
export function kindOf(program: string): ProgramKind;

/** The programs of a given kind. */
export function programsOfKind(kind: ProgramKind): string[];

/** The catalog entry for a program, or throw listing the near misses. */
export function describe(program: string): CatalogEntry;

export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  /** Virtual path -> bytes, for each path requested in `outputs`. */
  outputs: Record<string, Uint8Array>;
}

export interface RunIO {
  /** Virtual path -> bytes, written into MEMFS before the run. */
  inputs?: Record<string, Uint8Array>;
  /** Virtual paths read back out of MEMFS after the run. */
  outputs?: string[];
}

/** A decoded output buffer: audio, or CSV text when the output was asked for as `'csv'`. */
export type OutputBuffer =
  | (DecodedWav & { wav: Uint8Array })
  | { csv: string; bytes: Uint8Array };

export interface InvokeResult {
  /** Decoded output buffers, keyed by parameter name (`indices`, `features`, ...). */
  outputs: Record<string, OutputBuffer>;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface FluidOptions {
  /** Directory holding the program .js/.wasm files. Defaults to the bundled `wasm/` folder. */
  baseUrl?: string | URL;
}

export class Fluid {
  constructor(options?: FluidOptions);

  /** Every program bundled alongside the .wasm files, from the build's manifest. */
  programs(): Promise<string[]>;

  /** Pre-load program modules (otherwise loaded lazily on first run). */
  load(...programs: string[]): Promise<void>;

  /** Run a program with raw command-line arguments. */
  run(program: string, args: string[], io?: RunIO): Promise<RunResult>;

  /**
   * Run a program from a typed parameter object, staging its input buffers and
   * decoding its output buffers. Parameter names are matched case-insensitively;
   * enum parameters accept the choice name as well as its index.
   */
  invoke(program: string, params?: Record<string, any>): Promise<InvokeResult>;

  /** Run a slicing program and return the slice points, in samples. */
  slice(program: string, source: AudioInput, params?: Record<string, any>): Promise<number[]>;

  /**
   * Run an analysis program and return its features: one channel per
   * descriptor, one frame per analysis hop.
   */
  analyse(
    program: string, source: AudioInput, params?: Record<string, any>
  ): Promise<DecodedWav & { wav: Uint8Array }>;

  /** US spelling alias for `analyse`. */
  analyze(
    program: string, source: AudioInput, params?: Record<string, any>
  ): Promise<DecodedWav & { wav: Uint8Array }>;

  /** Run a decomposition program and return each audio output as WAV bytes. */
  decompose(
    program: string, source: AudioInput, params?: Record<string, any>
  ): Promise<Record<string, Uint8Array>>;
}

/**
 * Turn a typed parameter object into the program's argv, plus the MEMFS files
 * to stage and read back. Exported so callers can inspect or adjust the command
 * line before running it.
 */
export function buildArgs(entry: CatalogEntry, params?: Record<string, any>): {
  argv: string[];
  inputs: Record<string, Uint8Array>;
  outputPaths: Record<string, string>;
  formats: Record<string, 'wav' | 'csv'>;
};

/**
 * Throw a `RangeError` if a value breaks the constraints its parameter was
 * declared with (`min`, `max`, `odd`, `powerOfTwo`).
 *
 * `invoke` applies this to every value it is given. It matters because the
 * programs do not check these themselves: an out-of-range value reaches the
 * algorithms and traps the WebAssembly module, which is not recoverable.
 * Exported so command-line front-ends can make the same check.
 */
export function checkValue(spec: ParamSpec, value: number, program: string): void;

// ---- audio ------------------------------------------------------------------

export function decodeWav(input: Uint8Array | ArrayBuffer): DecodedWav;
/** Decode an AIFF / AIFF-C file (PCM 8/16/24/32 and 'sowt'/'fl32'/'fl64'). */
export function decodeAiff(input: Uint8Array | ArrayBuffer): DecodedWav;
/** Decode a WAV or AIFF byte array, sniffed from the header. */
export function decodeAudio(input: Uint8Array | ArrayBuffer): DecodedWav;
/** Encode planar float channel data as a 32-bit float WAV. */
export function encodeWav(audio: { sampleRate: number; channelData: Float32Array[] }): Uint8Array;
/** Frame count read from the WAV header alone; 0 if it doesn't parse. */
export function wavFrameCount(bytes: Uint8Array): number;
export function wavToAudioBuffer(bytes: Uint8Array, audioContext: BaseAudioContext): AudioBuffer;
export function audioBufferToWav(audioBuffer: AudioBuffer): Uint8Array;
