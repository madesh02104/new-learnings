import * as Tone from "tone";

// 26-key drum engine: distinct character per row, increases in intensity left->right within each row
export function makeChromaticDrums() {
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.03,
    octaves: 6,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.01 },
  }).toDestination();

  const snareNoise = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
  });
  const snareBP = new Tone.Filter(1800, "bandpass");
  snareNoise.chain(snareBP, Tone.Destination);

  const hat = new Tone.MetalSynth({
    frequency: 300,
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
    envelope: { attack: 0.001, decay: 0.15, release: 0.01 },
  }).toDestination();

  // Transient click layer to add presence for bottom row
  const click = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.0005, decay: 0.02, sustain: 0 },
  });
  const clickHP = new Tone.Filter(5000, "highpass");
  const clickVol = new Tone.Volume(-6);

  // Drum bus to increase perceived loudness
  const drumEQ = new Tone.EQ3({ low: 2, mid: 0, high: 1 });
  const drumComp = new Tone.Compressor(-12, 3);
  const drumLim = new Tone.Limiter(-1);
  drumEQ.chain(drumComp, drumLim, Tone.Destination);
  // route sources to drum bus
  const botBoost = new Tone.Volume(6);
  kick.disconnect();
  kick.chain(botBoost, drumEQ);
  snareNoise.disconnect();
  snareNoise.chain(snareBP, drumEQ);
  hat.disconnect();
  hat.connect(drumEQ);
  click.chain(clickHP, clickVol, drumEQ);

  const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;

  return {
    ensureReady: async () => {},
    // row: 'top' | 'mid' | 'bot', i: index within row, len: total keys in row
    playByRow: (row, i, len) => {
      const t = Tone.now();
      const pos = len > 1 ? i / (len - 1) : 0; // 0..1 left->right

      if (row === "bot") {
        // Low percussion family: kicks/toms, frequency and decay increase to the right
        const freq = lerp(60, 160, pos); // higher floor for audibility
        kick.frequency.rampTo(freq, 0.001);
        kick.envelope.decay = lerp(0.14, 0.36, pos);
        kick.triggerAttackRelease("8n", t);
        click.triggerAttackRelease("64n", t);
      } else if (row === "mid") {
        // Mid percussion: snare variants (body/brightness/decay increase)
        snareBP.frequency.rampTo(lerp(1200, 5200, pos), 0.001);
        snareNoise.envelope.decay = lerp(0.1, 0.3, pos);
        snareNoise.triggerAttackRelease("16n", t);
      } else {
        // Top percussion: hats/cymbals become more open/bright
        hat.frequency.rampTo(lerp(220, 900, pos), 0.001);
        hat.envelope.decay = lerp(0.04, 0.34, pos);
        const dur = pos < 0.5 ? "64n" : pos < 0.8 ? "16n" : "8n";
        hat.triggerAttackRelease(dur, t);
      }
    },
    dispose: () => {
      kick.dispose();
      snareNoise.dispose();
      snareBP.dispose();
      hat.dispose();
      click.dispose();
      clickHP.dispose();
      clickVol.dispose();
      drumEQ.dispose();
      drumComp.dispose();
      drumLim.dispose();
      botBoost.dispose();
    },
  };
}
