const synth = new Tone.Synth({
  oscillator: {
    type: "sawtooth",
  },
}).toDestination();

const keyboard = new AudioKeys({
  rows: 1,
});

keyboard.down((key) => {
  console.log(key);
  synth.triggerAttackRelease(key.frequency, "8n");
});
