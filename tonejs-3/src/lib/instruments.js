// Instruments registry: each function returns a ready-to-play instrument.
// All instruments use the same Sampler-based engine with per-row FX and per-key modulation.
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
  // Pitched instruments: Sampler + per-row FX + per-key modulation
  piano: () => makeSampledInstrument(BASES.piano, PIANO_URLS),
  guitar: () => makeSampledInstrument(BASES.guitar, GUITAR_URLS),
  // Boost bass top row, and transpose up one octave to avoid sub‑audible notes
  bass: () =>
    makeSampledInstrument(BASES.bass, BASS_URLS, {
      transpose: 12,
      rowGainDb: { top: 20, mid: 20, bot: 12 },
    }),
  violin: () => makeSampledInstrument(BASES.violin, VIOLIN_URLS),
  // Drums: Sampler one-shots; columns map to kit pieces; row/col modulates tone
  drums: () => {
    const urls = { ...DRUM_NOTE_TO_FILE };
    console.groupCollapsed("[TypeJam][instruments] create drums instrument");
    console.log({ baseUrl: BASES.drums, urls });
    console.groupEnd();
    return makeSampledInstrument(BASES.drums, urls, {
      rowGainDb: { top: 16, mid: 16, bot: 16 },
    });
  },
};
