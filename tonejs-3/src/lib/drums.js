import * as Tone from "tone";

export function makeDrumKit() {
  const kick = new Tone.MembraneSynth().toDestination();
  const snare = new Tone.NoiseSynth({
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
  }).toDestination();
  const hat = new Tone.MetalSynth({
    frequency: 200,
    envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
  }).toDestination();
  const tomL = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 3,
    oscillator: { type: "sine" },
  }).toDestination();
  const tomM = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 4,
    oscillator: { type: "sine" },
  }).toDestination();
  const tomH = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 5,
    oscillator: { type: "sine" },
  }).toDestination();
  const ride = new Tone.MetalSynth({
    frequency: 320,
    envelope: { attack: 0.001, decay: 0.5, release: 0.2 },
  }).toDestination();
  const crash = new Tone.MetalSynth({
    frequency: 260,
    envelope: { attack: 0.001, decay: 0.9, release: 0.4 },
  }).toDestination();

  return {
    ensureReady: async () => {},
    play: (id) => {
      const t = Tone.now();
      if (id === "kick") kick.triggerAttackRelease("C2", "8n", t);
      else if (id === "snare") snare.triggerAttackRelease("16n", t);
      else if (id === "hihat-closed") hat.triggerAttackRelease("64n", t);
      else if (id === "hihat-open") hat.triggerAttackRelease("8n", t);
      else if (id === "tom-low") tomL.triggerAttackRelease("A2", "8n", t);
      else if (id === "tom-mid") tomM.triggerAttackRelease("C3", "8n", t);
      else if (id === "tom-high") tomH.triggerAttackRelease("E3", "8n", t);
      else if (id === "ride") ride.triggerAttackRelease("8n", t);
      else if (id === "crash") crash.triggerAttackRelease("4n", t);
    },
    dispose: () => {
      [kick, snare, hat, tomL, tomM, tomH, ride, crash].forEach((n) =>
        n.dispose()
      );
    },
  };
}
