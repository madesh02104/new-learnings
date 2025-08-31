import { makeSampledInstrument } from "./sampledInstrument";
import {
  BASES,
  PIANO_URLS,
  GUITAR_URLS,
  BASS_URLS,
  VIOLIN_URLS,
  DRUM_NOTE_TO_FILE,
} from "./samples";

export const INSTRUMENTS = {
  // Pitched instruments now use Sampler + per-row FX + per-key modulation
  piano: () => makeSampledInstrument(BASES.piano, PIANO_URLS),
  guitar: () => makeSampledInstrument(BASES.guitar, GUITAR_URLS),
  // Boost bass top row, and transpose up one octave to avoid sub‑audible notes
  bass: () =>
    makeSampledInstrument(BASES.bass, BASS_URLS, {
      transpose: 12,
      rowGainDb: { top: 20, mid: 20, bot: 12 },
    }),
  violin: () =>
    makeSampledInstrument(BASES.violin, VIOLIN_URLS, {
      transpose: 12,
      rowGainDb: { top: 16, mid: 16, bot: 16 },
    }),
  // Drums: also use Sampler (one-shots) for unified pipeline
  drums: () => {
    const urls = { ...DRUM_NOTE_TO_FILE };
    return makeSampledInstrument(BASES.drums, urls, {
      rowGainDb: { top: 16, mid: 16, bot: 16 },
    });
  },
};
