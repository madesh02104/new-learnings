import * as Tone from "tone";
import Soundfont from "soundfont-player";

const cache = new Map();

export async function loadSFInstrument(gmName) {
  if (cache.has(gmName)) return cache.get(gmName);
  const ac = Tone.getContext().rawContext;
  const inst = await Soundfont.instrument(ac, gmName, {
    soundfont: "MusyngKite", // free CDN set
    // format: 'mp3' | 'ogg'  // optional
  });
  cache.set(gmName, inst);
  return inst;
}

export function makeSFWrapper(gmName) {
  let inst = null;
  return {
    ensureReady: async () => {
      inst = await loadSFInstrument(gmName);
    },
    play: (note, dur = "8n", _time, velocity = 0.9) => {
      const ac = Tone.getContext().rawContext;
      const duration = Tone.Time(dur).toSeconds();
      inst.play(note, ac.currentTime, { duration, gain: velocity });
    },
    dispose: () => {},
  };
}
