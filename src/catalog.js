// GENERATED FILE — do not edit.
// Produced by scripts/harvest-catalog.mjs from the built WebAssembly
// programs and the flucoma-core headers. Run `npm run catalog` to refresh.

/** Every bundled program, keyed by program name. */
export const CATALOG = {
  "fluid-ampfeature": {
    "program": "fluid-ampfeature",
    "client": "BufAmpFeature",
    "header": "flucoma/clients/rt/AmpFeatureClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Feature Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "fastRampUp",
        "option": "-fastrampup",
        "display": "Fast Envelope Ramp Up Length",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "fastRampDown",
        "option": "-fastrampdown",
        "display": "Fast Envelope Ramp Down Length",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "slowRampUp",
        "option": "-slowrampup",
        "display": "Slow Envelope Ramp Up Length",
        "size": 1,
        "type": "long",
        "default": 100,
        "min": 1
      },
      {
        "name": "slowRampDown",
        "option": "-slowrampdown",
        "display": "Slow Envelope Ramp Down Length",
        "size": 1,
        "type": "long",
        "default": 100,
        "min": 1
      },
      {
        "name": "floor",
        "option": "-floor",
        "display": "Floor value (dB)",
        "size": 1,
        "type": "float",
        "default": -144,
        "min": -144,
        "max": 144
      },
      {
        "name": "highPassFreq",
        "option": "-highpassfreq",
        "display": "High-Pass Filter Cutoff",
        "size": 1,
        "type": "float",
        "default": 85,
        "min": 0
      }
    ]
  },
  "fluid-ampgate": {
    "program": "fluid-ampgate",
    "client": "BufAmpGate",
    "header": "flucoma/clients/rt/AmpGateClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "indices"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "indices",
        "option": "-indices",
        "display": "Indices Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "rampUp",
        "option": "-rampup",
        "display": "Ramp Up Length",
        "size": 1,
        "type": "long",
        "default": 10,
        "min": 1
      },
      {
        "name": "rampDown",
        "option": "-rampdown",
        "display": "Ramp Down Length",
        "size": 1,
        "type": "long",
        "default": 10,
        "min": 1
      },
      {
        "name": "onThreshold",
        "option": "-onthreshold",
        "display": "On Threshold",
        "size": 1,
        "type": "float",
        "default": -90,
        "min": -144,
        "max": 144
      },
      {
        "name": "offThreshold",
        "option": "-offthreshold",
        "display": "Off Threshold",
        "size": 1,
        "type": "float",
        "default": -90,
        "min": -144,
        "max": 144
      },
      {
        "name": "minSliceLength",
        "option": "-minslicelength",
        "display": "Minimum Length of Slice",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "minSilenceLength",
        "option": "-minsilencelength",
        "display": "Minimum Length of Silence",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "minLengthAbove",
        "option": "-minlengthabove",
        "display": "Required Minimum Length Above Threshold",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "minLengthBelow",
        "option": "-minlengthbelow",
        "display": "Required Minimum Length Below Threshold",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "lookBack",
        "option": "-lookback",
        "display": "Backward Lookup Length",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "lookAhead",
        "option": "-lookahead",
        "display": "Forward Lookup Length",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "highPassFreq",
        "option": "-highpassfreq",
        "display": "High-Pass Filter Cutoff",
        "size": 1,
        "type": "float",
        "default": 85,
        "min": 0
      },
      {
        "name": "maxSize",
        "option": "-maxsize",
        "display": "Maximum Total Latency",
        "size": 1,
        "type": "long",
        "default": 88200,
        "min": 1
      }
    ]
  },
  "fluid-ampslice": {
    "program": "fluid-ampslice",
    "client": "BufAmpSlice",
    "header": "flucoma/clients/rt/AmpSliceClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "indices"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "indices",
        "option": "-indices",
        "display": "Indices Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "fastRampUp",
        "option": "-fastrampup",
        "display": "Fast Envelope Ramp Up Length",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "fastRampDown",
        "option": "-fastrampdown",
        "display": "Fast Envelope Ramp Down Length",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "slowRampUp",
        "option": "-slowrampup",
        "display": "Slow Envelope Ramp Up Length",
        "size": 1,
        "type": "long",
        "default": 100,
        "min": 1
      },
      {
        "name": "slowRampDown",
        "option": "-slowrampdown",
        "display": "Slow Envelope Ramp Down Length",
        "size": 1,
        "type": "long",
        "default": 100,
        "min": 1
      },
      {
        "name": "onThreshold",
        "option": "-onthreshold",
        "display": "On Threshold (dB)",
        "size": 1,
        "type": "float",
        "default": 144,
        "min": -144,
        "max": 144
      },
      {
        "name": "offThreshold",
        "option": "-offthreshold",
        "display": "Off Threshold (dB)",
        "size": 1,
        "type": "float",
        "default": -144,
        "min": -144,
        "max": 144
      },
      {
        "name": "floor",
        "option": "-floor",
        "display": "Floor value (dB)",
        "size": 1,
        "type": "float",
        "default": -144,
        "min": -144,
        "max": 144
      },
      {
        "name": "minSliceLength",
        "option": "-minslicelength",
        "display": "Minimum Length of Slice",
        "size": 1,
        "type": "long",
        "default": 2,
        "min": 0
      },
      {
        "name": "highPassFreq",
        "option": "-highpassfreq",
        "display": "High-Pass Filter Cutoff",
        "size": 1,
        "type": "float",
        "default": 85,
        "min": 0
      }
    ]
  },
  "fluid-audiotransport": {
    "program": "fluid-audiotransport",
    "client": "BufAudioTransport",
    "header": "flucoma/clients/rt/AudioTransportClient.hpp",
    "inputs": [
      "sourceA",
      "sourceB"
    ],
    "outputs": [
      "destination"
    ],
    "params": [
      {
        "name": "sourceA",
        "option": "-sourcea",
        "display": "Source Buffer A",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrameA",
        "option": "-startframea",
        "display": "Source A Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFramesA",
        "option": "-numframesa",
        "display": "Source A Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChanA",
        "option": "-startchana",
        "display": "Source A Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChansA",
        "option": "-numchansa",
        "display": "Source A Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "sourceB",
        "option": "-sourceb",
        "display": "Source Buffer B",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrameB",
        "option": "-startframeb",
        "display": "Source B Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFramesB",
        "option": "-numframesb",
        "display": "Source B Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChanB",
        "option": "-startchanb",
        "display": "Source B Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChansB",
        "option": "-numchansb",
        "display": "Source B Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "destination",
        "option": "-destination",
        "display": "Destination Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "interpolation",
        "option": "-interpolation",
        "display": "Interpolation",
        "size": 1,
        "type": "float",
        "default": 0,
        "min": 0,
        "max": 1
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-chroma": {
    "program": "fluid-chroma",
    "client": "BufChroma",
    "header": "flucoma/clients/rt/ChromaClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Output Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "numChroma",
        "option": "-numchroma",
        "display": "Number of Chroma Bins per Octave",
        "size": 2,
        "type": "long",
        "default": 12,
        "min": 2
      },
      {
        "name": "ref",
        "option": "-ref",
        "display": "Reference frequency",
        "size": 1,
        "type": "float",
        "default": 440,
        "min": 0,
        "max": 22000
      },
      {
        "name": "normalize",
        "option": "-normalize",
        "display": "Normalize Frame",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "None",
          "Sum",
          "Max"
        ]
      },
      {
        "name": "minFreq",
        "option": "-minfreq",
        "display": "Low Frequency Bound",
        "size": 1,
        "type": "float",
        "default": 0,
        "min": 0
      },
      {
        "name": "maxFreq",
        "option": "-maxfreq",
        "display": "High Frequency Bound",
        "size": 1,
        "type": "float",
        "default": -1,
        "min": -1
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-hpss": {
    "program": "fluid-hpss",
    "client": "BufHPSS",
    "header": "flucoma/clients/rt/HPSSClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "harmonic",
      "percussive",
      "residual"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "harmonic",
        "option": "-harmonic",
        "display": "Harmonic Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "percussive",
        "option": "-percussive",
        "display": "Percussive Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "residual",
        "option": "-residual",
        "display": "Residual Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "harmFilterSize",
        "option": "-harmfiltersize",
        "display": "Harmonic Filter Size",
        "size": 2,
        "type": "long",
        "default": 17,
        "min": 3
      },
      {
        "name": "percFilterSize",
        "option": "-percfiltersize",
        "display": "Percussive Filter Size",
        "size": 2,
        "type": "long",
        "default": 31,
        "min": 3
      },
      {
        "name": "maskingMode",
        "option": "-maskingmode",
        "display": "Masking Mode",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Classic",
          "Coupled",
          "Advanced"
        ]
      },
      {
        "name": "harmThresh",
        "option": "-harmthresh",
        "display": "Harmonic Filter Thresholds",
        "size": 4,
        "type": "floatPairsArray"
      },
      {
        "name": "percThresh",
        "option": "-percthresh",
        "display": "Percussive Filter Thresholds",
        "size": 4,
        "type": "floatPairsArray"
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-loudness": {
    "program": "fluid-loudness",
    "client": "BufLoudness",
    "header": "flucoma/clients/rt/LoudnessClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Features Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "select",
        "option": "-select",
        "display": "Selection of Outputs",
        "size": 1,
        "type": "choices",
        "choices": [
          "loudness",
          "peak"
        ]
      },
      {
        "name": "kWeighting",
        "option": "-kweighting",
        "display": "Apply K-Weighting",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "Off",
          "On"
        ]
      },
      {
        "name": "truePeak",
        "option": "-truepeak",
        "display": "Compute True Peak",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "Off",
          "On"
        ]
      },
      {
        "name": "windowSize",
        "option": "-windowsize",
        "display": "Window Size",
        "size": 1,
        "type": "long",
        "default": 1024,
        "min": 1
      },
      {
        "name": "hopSize",
        "option": "-hopsize",
        "display": "Hop Size",
        "size": 1,
        "type": "long",
        "default": 512,
        "min": 1
      },
      {
        "name": "maxWindowSize",
        "option": "-maxwindowsize",
        "display": "Max Window Size",
        "size": 1,
        "type": "long",
        "default": 16384,
        "min": 4,
        "max": 32768
      }
    ]
  },
  "fluid-melbands": {
    "program": "fluid-melbands",
    "client": "BufMelBands",
    "header": "flucoma/clients/rt/MelBandsClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Output Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "numBands",
        "option": "-numbands",
        "display": "Number of Bands",
        "size": 2,
        "type": "long",
        "default": 40,
        "min": 2
      },
      {
        "name": "minFreq",
        "option": "-minfreq",
        "display": "Low Frequency Bound",
        "size": 1,
        "type": "float",
        "default": 20,
        "min": 0
      },
      {
        "name": "maxFreq",
        "option": "-maxfreq",
        "display": "High Frequency Bound",
        "size": 1,
        "type": "float",
        "default": 20000,
        "min": 0
      },
      {
        "name": "normalize",
        "option": "-normalize",
        "display": "Normalize",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "No",
          "Yes"
        ]
      },
      {
        "name": "scale",
        "option": "-scale",
        "display": "Amplitude Scale",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Linear",
          "dB"
        ]
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-mfcc": {
    "program": "fluid-mfcc",
    "client": "BufMFCC",
    "header": "flucoma/clients/rt/MFCCClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Output Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "numCoeffs",
        "option": "-numcoeffs",
        "display": "Number of Cepstral Coefficients",
        "size": 2,
        "type": "long",
        "default": 13,
        "min": 2
      },
      {
        "name": "numBands",
        "option": "-numbands",
        "display": "Number of Bands",
        "size": 2,
        "type": "long",
        "default": 40,
        "min": 2
      },
      {
        "name": "startCoeff",
        "option": "-startcoeff",
        "display": "Output Coefficient Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0,
        "max": 1
      },
      {
        "name": "minFreq",
        "option": "-minfreq",
        "display": "Low Frequency Bound",
        "size": 1,
        "type": "float",
        "default": 20,
        "min": 0
      },
      {
        "name": "maxFreq",
        "option": "-maxfreq",
        "display": "High Frequency Bound",
        "size": 1,
        "type": "float",
        "default": 20000,
        "min": 0
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-nmf": {
    "program": "fluid-nmf",
    "client": "BufNMF",
    "header": "flucoma/clients/nrt/NMFClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "resynth",
      "bases",
      "activations"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "resynth",
        "option": "-resynth",
        "display": "Resynthesis Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "resynthMode",
        "option": "-resynthmode",
        "display": "Resynthesise components",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0,
        "max": 1
      },
      {
        "name": "bases",
        "option": "-bases",
        "display": "Bases Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "basesMode",
        "option": "-basesmode",
        "display": "Bases Buffer Update Mode",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "None",
          "Seed",
          "Fixed"
        ]
      },
      {
        "name": "activations",
        "option": "-activations",
        "display": "Activations Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "actMode",
        "option": "-actmode",
        "display": "Activations Buffer Update Mode",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "None",
          "Seed",
          "Fixed"
        ]
      },
      {
        "name": "components",
        "option": "-components",
        "display": "Number of Components",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "iterations",
        "option": "-iterations",
        "display": "Number of Iterations",
        "size": 1,
        "type": "long",
        "default": 100,
        "min": 1
      },
      {
        "name": "seed",
        "option": "-seed",
        "display": "Random Seed",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-nmfcross": {
    "program": "fluid-nmfcross",
    "client": "BufNMFCross",
    "header": "flucoma/clients/nrt/NMFCrossClient.hpp",
    "inputs": [
      "source",
      "target"
    ],
    "outputs": [
      "output"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "target",
        "option": "-target",
        "display": "Target Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "output",
        "option": "-output",
        "display": "Output Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "timeSparsity",
        "option": "-timesparsity",
        "display": "Time Sparsity",
        "size": 1,
        "type": "long",
        "default": 7,
        "min": 1,
        "odd": true
      },
      {
        "name": "polyphony",
        "option": "-polyphony",
        "display": "Polyphony",
        "size": 1,
        "type": "long",
        "default": 11,
        "min": 1,
        "odd": true
      },
      {
        "name": "continuity",
        "option": "-continuity",
        "display": "Continuity",
        "size": 1,
        "type": "long",
        "default": 7,
        "min": 1,
        "odd": true
      },
      {
        "name": "iterations",
        "option": "-iterations",
        "display": "Number of Iterations",
        "size": 1,
        "type": "long",
        "default": 50,
        "min": 1
      },
      {
        "name": "seed",
        "option": "-seed",
        "display": "Random Seed",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-nmfseed": {
    "program": "fluid-nmfseed",
    "client": "BufNMFSeed",
    "header": "flucoma/clients/nrt/NMFSeedClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "bases",
      "activations"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "bases",
        "option": "-bases",
        "display": "Bases Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "activations",
        "option": "-activations",
        "display": "Activations Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "minComponents",
        "option": "-mincomponents",
        "display": "Minimum Number of Components",
        "size": 1,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "maxComponents",
        "option": "-maxcomponents",
        "display": "Maximum Number of Components",
        "size": 1,
        "type": "long",
        "default": 200,
        "min": 1
      },
      {
        "name": "coverage",
        "option": "-coverage",
        "display": "Coverage",
        "size": 1,
        "type": "float",
        "default": 0.5,
        "min": 0,
        "max": 1
      },
      {
        "name": "method",
        "option": "-method",
        "display": "Initialization Method",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "NMF-SVD",
          "NNDSVDar",
          "NNDSVDa",
          "NNDSVD"
        ]
      },
      {
        "name": "seed",
        "option": "-seed",
        "display": "Random Seed",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-noveltyfeature": {
    "program": "fluid-noveltyfeature",
    "client": "BufNoveltyFeature",
    "header": "flucoma/clients/rt/NoveltyFeatureClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Feature Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "algorithm",
        "option": "-algorithm",
        "display": "Algorithm for Feature Extraction",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Spectrum",
          "MFCC",
          "Chroma",
          "Pitch",
          "Loudness"
        ]
      },
      {
        "name": "kernelSize",
        "option": "-kernelsize",
        "display": "KernelSize",
        "size": 2,
        "type": "long",
        "default": 3,
        "min": 3,
        "odd": true
      },
      {
        "name": "filterSize",
        "option": "-filtersize",
        "display": "Smoothing Filter Size",
        "size": 2,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-noveltyslice": {
    "program": "fluid-noveltyslice",
    "client": "BufNoveltySlice",
    "header": "flucoma/clients/rt/NoveltySliceClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "indices"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "indices",
        "option": "-indices",
        "display": "Indices Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "algorithm",
        "option": "-algorithm",
        "display": "Algorithm for Feature Extraction",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Spectrum",
          "MFCC",
          "Chroma",
          "Pitch",
          "Loudness"
        ]
      },
      {
        "name": "kernelSize",
        "option": "-kernelsize",
        "display": "KernelSize",
        "size": 2,
        "type": "long",
        "default": 3,
        "min": 3,
        "odd": true
      },
      {
        "name": "threshold",
        "option": "-threshold",
        "display": "Threshold",
        "size": 1,
        "type": "float",
        "default": 0.5,
        "min": 0
      },
      {
        "name": "filterSize",
        "option": "-filtersize",
        "display": "Smoothing Filter Size",
        "size": 2,
        "type": "long",
        "default": 1,
        "min": 1
      },
      {
        "name": "minSliceLength",
        "option": "-minslicelength",
        "display": "Minimum Length of Slice",
        "size": 1,
        "type": "long",
        "default": 2,
        "min": 0
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-onsetfeature": {
    "program": "fluid-onsetfeature",
    "client": "BufOnsetFeature",
    "header": "flucoma/clients/rt/OnsetFeatureClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Feature Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "metric",
        "option": "-metric",
        "display": "Spectral Change Metric",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Energy",
          "High Frequency Content",
          "Spectral Flux",
          "Modified Kullback-Leibler",
          "Itakura-Saito",
          "Cosine",
          "Phase Deviation",
          "Weighted Phase Deviation",
          "Complex Domain",
          "Rectified Complex Domain"
        ]
      },
      {
        "name": "filterSize",
        "option": "-filtersize",
        "display": "Filter Size",
        "size": 1,
        "type": "long",
        "default": 5,
        "min": 1,
        "odd": true,
        "max": 101
      },
      {
        "name": "frameDelta",
        "option": "-framedelta",
        "display": "Frame Delta",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0,
        "max": 8192
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-onsetslice": {
    "program": "fluid-onsetslice",
    "client": "BufOnsetSlice",
    "header": "flucoma/clients/rt/OnsetSliceClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "indices"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "indices",
        "option": "-indices",
        "display": "Indices Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "metric",
        "option": "-metric",
        "display": "Spectral Change Metric",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Energy",
          "High Frequency Content",
          "Spectral Flux",
          "Modified Kullback-Leibler",
          "Itakura-Saito",
          "Cosine",
          "Phase Deviation",
          "Weighted Phase Deviation",
          "Complex Domain",
          "Rectified Complex Domain"
        ]
      },
      {
        "name": "threshold",
        "option": "-threshold",
        "display": "Threshold",
        "size": 1,
        "type": "float",
        "default": 0.5,
        "min": 0
      },
      {
        "name": "minSliceLength",
        "option": "-minslicelength",
        "display": "Minimum Length of Slice",
        "size": 1,
        "type": "long",
        "default": 2,
        "min": 0
      },
      {
        "name": "filterSize",
        "option": "-filtersize",
        "display": "Filter Size",
        "size": 1,
        "type": "long",
        "default": 5,
        "min": 1,
        "odd": true,
        "max": 101
      },
      {
        "name": "frameDelta",
        "option": "-framedelta",
        "display": "Frame Delta",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0,
        "max": 8192
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-pitch": {
    "program": "fluid-pitch",
    "client": "BufPitch",
    "header": "flucoma/clients/rt/PitchClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Features Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "select",
        "option": "-select",
        "display": "Selection of Outputs",
        "size": 1,
        "type": "choices",
        "choices": [
          "pitch",
          "confidence"
        ]
      },
      {
        "name": "algorithm",
        "option": "-algorithm",
        "display": "Algorithm",
        "size": 1,
        "type": "enum",
        "default": 2,
        "choices": [
          "Cepstrum",
          "Harmonic Product Spectrum",
          "YinFFT"
        ]
      },
      {
        "name": "minFreq",
        "option": "-minfreq",
        "display": "Low Frequency Bound",
        "size": 1,
        "type": "float",
        "default": 20,
        "min": 0,
        "max": 10000
      },
      {
        "name": "maxFreq",
        "option": "-maxfreq",
        "display": "High Frequency Bound",
        "size": 1,
        "type": "float",
        "default": 10000,
        "min": 1,
        "max": 20000
      },
      {
        "name": "unit",
        "option": "-unit",
        "display": "Frequency Unit",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Hz",
          "MIDI"
        ]
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-sinefeature": {
    "program": "fluid-sinefeature",
    "client": "BufSineFeature",
    "header": "flucoma/clients/rt/SineFeatureClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "frequency",
      "magnitude"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "frequency",
        "option": "-frequency",
        "display": "Peak Frequencies Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "magnitude",
        "option": "-magnitude",
        "display": "Peak Magnitudes Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "numPeaks",
        "option": "-numpeaks",
        "display": "Number of Sinusoidal Peaks",
        "size": 2,
        "type": "long",
        "default": 10,
        "min": 1
      },
      {
        "name": "detectionThreshold",
        "option": "-detectionthreshold",
        "display": "Peak Detection Threshold",
        "size": 1,
        "type": "float",
        "default": -96,
        "min": -144,
        "max": 0
      },
      {
        "name": "order",
        "option": "-order",
        "display": "Sort Peaks Output",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Frequencies",
          "Amplitudes"
        ]
      },
      {
        "name": "freqUnit",
        "option": "-frequnit",
        "display": "Units for Frequencies",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Hz",
          "MIDI"
        ]
      },
      {
        "name": "magUnit",
        "option": "-magunit",
        "display": "Units for Magnitudes",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Amp",
          "dB"
        ]
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-sines": {
    "program": "fluid-sines",
    "client": "BufSines",
    "header": "flucoma/clients/rt/SinesClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "sines",
      "residual"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "sines",
        "option": "-sines",
        "display": "Sines Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "residual",
        "option": "-residual",
        "display": "Residual Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "bandwidth",
        "option": "-bandwidth",
        "display": "Bandwidth",
        "size": 1,
        "type": "long",
        "default": 76,
        "min": 1
      },
      {
        "name": "detectionThreshold",
        "option": "-detectionthreshold",
        "display": "Peak Detection Threshold",
        "size": 1,
        "type": "float",
        "default": -96,
        "min": -144,
        "max": 0
      },
      {
        "name": "birthLowThreshold",
        "option": "-birthlowthreshold",
        "display": "Track Birth Low Frequency Threshold",
        "size": 1,
        "type": "float",
        "default": -24,
        "min": -144,
        "max": 0
      },
      {
        "name": "birthHighThreshold",
        "option": "-birthhighthreshold",
        "display": "Track Birth High Frequency Threshold",
        "size": 1,
        "type": "float",
        "default": -60,
        "min": -144,
        "max": 0
      },
      {
        "name": "minTrackLen",
        "option": "-mintracklen",
        "display": "Minimum Track Length",
        "size": 1,
        "type": "long",
        "default": 15,
        "min": 1
      },
      {
        "name": "trackMethod",
        "option": "-trackmethod",
        "display": "Tracking Method",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Greedy",
          "Hungarian"
        ]
      },
      {
        "name": "trackMagRange",
        "option": "-trackmagrange",
        "display": "Tracking Magnitude Range (dB)",
        "size": 1,
        "type": "float",
        "default": 15,
        "min": 1,
        "max": 200
      },
      {
        "name": "trackFreqRange",
        "option": "-trackfreqrange",
        "display": "Tracking Frequency Range (Hz)",
        "size": 1,
        "type": "float",
        "default": 50,
        "min": 1,
        "max": 10000
      },
      {
        "name": "trackProb",
        "option": "-trackprob",
        "display": "Tracking Matching Probability",
        "size": 1,
        "type": "float",
        "default": 0.5,
        "min": 0,
        "max": 1
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-spectralshape": {
    "program": "fluid-spectralshape",
    "client": "BufSpectralShape",
    "header": "flucoma/clients/rt/SpectralShapeClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "features"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "features",
        "option": "-features",
        "display": "Features Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "select",
        "option": "-select",
        "display": "Selection of Features",
        "size": 1,
        "type": "choices",
        "choices": [
          "centroid",
          "spread",
          "skew",
          "kurtosis",
          "rolloff",
          "flatness",
          "crest"
        ]
      },
      {
        "name": "minFreq",
        "option": "-minfreq",
        "display": "Low Frequency Bound",
        "size": 1,
        "type": "float",
        "default": 0,
        "min": 0
      },
      {
        "name": "maxFreq",
        "option": "-maxfreq",
        "display": "High Frequency Bound",
        "size": 1,
        "type": "float",
        "default": -1,
        "min": -1
      },
      {
        "name": "rolloffPercent",
        "option": "-rolloffpercent",
        "display": "Rolloff Percent",
        "size": 1,
        "type": "float",
        "default": 95,
        "min": 0,
        "max": 100
      },
      {
        "name": "unit",
        "option": "-unit",
        "display": "Frequency Unit",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "Hz",
          "Midi Cents"
        ]
      },
      {
        "name": "power",
        "option": "-power",
        "display": "Use Power",
        "size": 1,
        "type": "enum",
        "default": 0,
        "choices": [
          "No",
          "Yes"
        ]
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-stats": {
    "program": "fluid-stats",
    "client": "BufStats",
    "header": "flucoma/clients/nrt/BufStatsClient.hpp",
    "inputs": [
      "source",
      "weights"
    ],
    "outputs": [
      "stats"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "stats",
        "option": "-stats",
        "display": "Stats Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "select",
        "option": "-select",
        "display": "Selection of Statistics",
        "size": 1,
        "type": "choices",
        "choices": [
          "mean",
          "std",
          "skew",
          "kurtosis",
          "low",
          "mid",
          "high"
        ]
      },
      {
        "name": "numDerivs",
        "option": "-numderivs",
        "display": "Number of Derivatives",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0,
        "max": 2
      },
      {
        "name": "low",
        "option": "-low",
        "display": "Low Percentile",
        "size": 1,
        "type": "float",
        "default": 0,
        "min": 0,
        "max": 100
      },
      {
        "name": "middle",
        "option": "-middle",
        "display": "Middle Percentile",
        "size": 1,
        "type": "float",
        "default": 50,
        "min": 0,
        "max": 100
      },
      {
        "name": "high",
        "option": "-high",
        "display": "High Percentile",
        "size": 1,
        "type": "float",
        "default": 100,
        "min": 0,
        "max": 100
      },
      {
        "name": "outliersCutoff",
        "option": "-outlierscutoff",
        "display": "Outliers Cutoff",
        "size": 1,
        "type": "float",
        "default": -1,
        "min": -1
      },
      {
        "name": "weights",
        "option": "-weights",
        "display": "Weights Buffer",
        "size": 1,
        "type": "inputBuffer"
      }
    ]
  },
  "fluid-stft": {
    "program": "fluid-stft",
    "client": "BufSTFT",
    "header": "flucoma/clients/nrt/BufSTFTClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "magnitude",
      "phase",
      "resynth"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "magnitude",
        "option": "-magnitude",
        "display": "Magnitude Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "phase",
        "option": "-phase",
        "display": "Phase Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "resynth",
        "option": "-resynth",
        "display": "Resynthesis Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "inverse",
        "option": "-inverse",
        "display": "Inverse Transform",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0,
        "max": 1
      },
      {
        "name": "padding",
        "option": "-padding",
        "display": "Added Padding",
        "size": 1,
        "type": "enum",
        "default": 1,
        "choices": [
          "None",
          "Default",
          "Full"
        ]
      },
      {
        "name": "fftSettings",
        "option": "-fftsettings",
        "display": "FFT Settings",
        "size": 4,
        "type": "fft",
        "default": [
          1024,
          -1,
          -1
        ]
      }
    ]
  },
  "fluid-transients": {
    "program": "fluid-transients",
    "client": "BufTransients",
    "header": "flucoma/clients/rt/TransientClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "transients",
      "residual"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "transients",
        "option": "-transients",
        "display": "Transients Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "residual",
        "option": "-residual",
        "display": "Residual Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "order",
        "option": "-order",
        "display": "Order",
        "size": 1,
        "type": "long",
        "default": 20,
        "min": 10
      },
      {
        "name": "blockSize",
        "option": "-blocksize",
        "display": "Block Size",
        "size": 1,
        "type": "long",
        "default": 256,
        "min": 100
      },
      {
        "name": "padSize",
        "option": "-padsize",
        "display": "Padding",
        "size": 1,
        "type": "long",
        "default": 128,
        "min": 0
      },
      {
        "name": "skew",
        "option": "-skew",
        "display": "Skew",
        "size": 1,
        "type": "float",
        "default": 0,
        "min": -10,
        "max": 10
      },
      {
        "name": "threshFwd",
        "option": "-threshfwd",
        "display": "Forward Threshold",
        "size": 1,
        "type": "float",
        "default": 2,
        "min": 0
      },
      {
        "name": "threshBack",
        "option": "-threshback",
        "display": "Backward Threshold",
        "size": 1,
        "type": "float",
        "default": 1.1,
        "min": 0
      },
      {
        "name": "windowSize",
        "option": "-windowsize",
        "display": "Window Size",
        "size": 1,
        "type": "long",
        "default": 14,
        "min": 0
      },
      {
        "name": "clumpLength",
        "option": "-clumplength",
        "display": "Clumping Window Length",
        "size": 1,
        "type": "long",
        "default": 25,
        "min": 0
      }
    ]
  },
  "fluid-transientslice": {
    "program": "fluid-transientslice",
    "client": "BufTransientSlice",
    "header": "flucoma/clients/rt/TransientSliceClient.hpp",
    "inputs": [
      "source"
    ],
    "outputs": [
      "indices"
    ],
    "params": [
      {
        "name": "source",
        "option": "-source",
        "display": "Source Buffer",
        "size": 1,
        "type": "inputBuffer"
      },
      {
        "name": "startFrame",
        "option": "-startframe",
        "display": "Source Offset",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numFrames",
        "option": "-numframes",
        "display": "Number of Frames",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "startChan",
        "option": "-startchan",
        "display": "Start Channel",
        "size": 1,
        "type": "long",
        "default": 0,
        "min": 0
      },
      {
        "name": "numChans",
        "option": "-numchans",
        "display": "Number of Channels",
        "size": 1,
        "type": "long",
        "default": -1
      },
      {
        "name": "indices",
        "option": "-indices",
        "display": "Indices Buffer",
        "size": 1,
        "type": "buffer"
      },
      {
        "name": "order",
        "option": "-order",
        "display": "Order",
        "size": 1,
        "type": "long",
        "default": 20,
        "min": 10
      },
      {
        "name": "blockSize",
        "option": "-blocksize",
        "display": "Block Size",
        "size": 1,
        "type": "long",
        "default": 256,
        "min": 100
      },
      {
        "name": "padSize",
        "option": "-padsize",
        "display": "Padding",
        "size": 1,
        "type": "long",
        "default": 128,
        "min": 0
      },
      {
        "name": "skew",
        "option": "-skew",
        "display": "Skew",
        "size": 1,
        "type": "float",
        "default": 0,
        "min": -10,
        "max": 10
      },
      {
        "name": "threshFwd",
        "option": "-threshfwd",
        "display": "Forward Threshold",
        "size": 1,
        "type": "float",
        "default": 2,
        "min": 0
      },
      {
        "name": "threshBack",
        "option": "-threshback",
        "display": "Backward Threshold",
        "size": 1,
        "type": "float",
        "default": 1.1,
        "min": 0
      },
      {
        "name": "windowSize",
        "option": "-windowsize",
        "display": "Window Size",
        "size": 1,
        "type": "long",
        "default": 14,
        "min": 0
      },
      {
        "name": "clumpLength",
        "option": "-clumplength",
        "display": "Clumping Window Length",
        "size": 1,
        "type": "long",
        "default": 25,
        "min": 0
      },
      {
        "name": "minSliceLength",
        "option": "-minslicelength",
        "display": "Minimum Length of Slice",
        "size": 1,
        "type": "long",
        "default": 1000
      }
    ]
  }
};
