# Instructions for the Command-Line Interface version of the Fluid.buf* algorithms

## Note: if you never used the Terminal, this is not for you yet, as these instructions are very terse.

## How to start:

1) copy the content of /bin wherever you fancy

2) if you have not copied it in one of your /bin folders, add the path of where it is to your shell $PATH by typing:
```
export PATH="XXX:$PATH"
```
where XXX is the complete path to the folder that contains your FluCoMa-CLI apps.

3) Use the CLI by entering the function and a full list of arguments, preceded with the hyphen (-). Default values are in place, but you need at least a source and destination paths. These need to be full paths.

For instance:
```
fluid-hpss -source FULLPATHTOASOUND -harmonic ~/Desktop/harm.wav -percussive ~/Desktop/perc.wav
```

will put on the Desktop 2 files from the default HPSS settings, and:

```
fluid-nmf -source FULLPATHTOASOUND -components 5 -resynth ~/Desktop/components.wav
```

will put on the desktop a single 5-channel audio file with the resynthesised 5 components requested.

4) an overview of the provided functions is available in the Fluid_Decomposition_Overview.md file, and full reference documentation for every tool is online at https://learn.flucoma.org/reference/ - each tool links to its own page when called with -h

#### Enjoy!


## Known limitations:
- only outputs WAV 32bit float files for now.
- can't currently read some .wav files (with a WAVE EXTENSIBLE header)
- does not support relative paths.
- no man page yet: -h gives a one-liner description of each parameter plus a link to the tool's reference page on https://learn.flucoma.org

> This project has received funding from the European Research Council (ERC) under the European Union’s Horizon 2020 research and innovation programme (grant agreement No 725899).
