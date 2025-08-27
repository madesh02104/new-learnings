import { makeChromaticDrums } from "./drumsChromatic";
import { makeSampledInstrument } from "./sampledInstrument";
import {
  BASES,
  PIANO_URLS,
  GUITAR_URLS,
  BASS_URLS,
  VIOLIN_URLS,
} from "./samples";

export const INSTRUMENTS = {
  // Pitched instruments now use Sampler + per-row FX + per-key modulation
  piano: () => makeSampledInstrument(BASES.piano, PIANO_URLS),
  guitar: () => makeSampledInstrument(BASES.guitar, GUITAR_URLS),
  // Boost bass top row, and transpose up one octave to avoid sub‑audible notes
  bass: () =>
    makeSampledInstrument(BASES.bass, BASS_URLS, {
      transpose: 12,
      rowGainDb: { top: 16, mid: 12, bot: 12 },
    }),
  violin: () => makeSampledInstrument(BASES.violin, VIOLIN_URLS),
  // Drums: keep 26-key chromatic synth engine (no assets needed)
  drums: () => makeChromaticDrums(),
};
