import * as Tone from "tone";

function makeRowSynthInstrument({ top, mid, bot }) {
  // Build three distinct voices
  const topVoice = top.toDestination();
  const midVoice = mid.toDestination();
  const botVoice = bot.toDestination();

  return {
    ensureReady: async () => {},
    // row can be 'top' | 'mid' | 'bot'; defaults to 'mid' if omitted
    play: (note, dur = "8n", time, velocity = 0.9, row = "mid") => {
      const t = time ?? undefined;
      const v = row === "top" ? topVoice : row === "bot" ? botVoice : midVoice;
      v.triggerAttackRelease(note, dur, t, velocity);
    },
    dispose: () => {
      topVoice.dispose();
      midVoice.dispose();
      botVoice.dispose();
    },
  };
}

export function makePianoLike() {
  return makeRowSynthInstrument({
    top: new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.25, sustain: 0.15, release: 0.9 },
    }),
    mid: new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.03, decay: 0.35, sustain: 0.25, release: 1.2 },
    }),
    bot: new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.04, decay: 0.45, sustain: 0.35, release: 1.4 },
    }),
  });
}

export function makeGuitarLike() {
  // Use plucked timbre on top/mid; fuller on bottom
  return makeRowSynthInstrument({
    top: new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 4500,
      resonance: 0.9,
    }),
    mid: new Tone.PluckSynth({
      attackNoise: 0.9,
      dampening: 3800,
      resonance: 0.95,
    }),
    bot: new Tone.MonoSynth({
      oscillator: { type: "triangle" },
      filter: { type: "lowpass", frequency: 1200, Q: 2 },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.8 },
    }),
  });
}

export function makeBassLike() {
  // Mono bass variants across rows
  return makeRowSynthInstrument({
    top: new Tone.MonoSynth({
      oscillator: { type: "square" },
      filter: { type: "lowpass", frequency: 800, Q: 2 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.6 },
    }),
    mid: new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      filter: { type: "lowpass", frequency: 600, Q: 2 },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.5, release: 0.7 },
    }),
    bot: new Tone.MonoSynth({
      oscillator: { type: "sine" },
      filter: { type: "lowpass", frequency: 500, Q: 1 },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.7 },
    }),
  });
}

export function makeViolinLike() {
  // Longer attack/release for bowed feel
  return makeRowSynthInstrument({
    top: new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.08, decay: 0.2, sustain: 0.7, release: 1.8 },
    }),
    mid: new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.75, release: 2.0 },
    }),
    bot: new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.06, decay: 0.25, sustain: 0.65, release: 1.6 },
    }),
  });
}
