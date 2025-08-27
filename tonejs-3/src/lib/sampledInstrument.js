import * as Tone from "tone";

// Sampler + per-row FX + per-key parameter modulation
export function makeSampledInstrument(baseUrl, urls, options = {}) {
  const transpose = options.transpose ?? 0; // semitones
  // Create three independent samplers for routing to distinct FX per row
  const mk = () => new Tone.Sampler({ baseUrl, urls, release: 1.1 });
  const top = mk();
  const mid = mk();
  const bot = mk();

  // Per-row output gain (boost a bit to avoid very low perceived level)
  const rowGainDb = options.rowGainDb || { top: 12, mid: 12, bot: 12 };
  const topVol = new Tone.Volume(rowGainDb.top);
  const midVol = new Tone.Volume(rowGainDb.mid);
  const botVol = new Tone.Volume(rowGainDb.bot);

  // Per-row dynamics to increase perceived loudness
  const topComp = new Tone.Compressor(-12, 3);
  const midComp = new Tone.Compressor(-12, 3);
  const botComp = new Tone.Compressor(-12, 3);
  const topLim = new Tone.Limiter(-1);
  const midLim = new Tone.Limiter(-1);
  const botLim = new Tone.Limiter(-1);

  // Row FX chains
  const topFX = [
    new Tone.EQ3({ low: -2, mid: 0, high: 2 }),
    new Tone.Reverb({ decay: 1.4, wet: 0.15 }),
  ];
  const midFX = [new Tone.Reverb({ decay: 1.2, wet: 0.1 })];
  const botFX = [
    new Tone.Filter(900, "lowpass"),
    new Tone.Reverb({ decay: 1.6, wet: 0.12 }),
  ];

  const chain = (n, vol, fx, comp, lim) => {
    if (fx.length) {
      n.chain(vol, ...fx, comp, lim, Tone.Destination);
    } else {
      n.chain(vol, comp, lim, Tone.Destination);
    }
  };
  chain(top, topVol, topFX, topComp, topLim);
  chain(mid, midVol, midFX, midComp, midLim);
  chain(bot, botVol, botFX, botComp, botLim);

  const lerp = (a, b, t) => a + (b - a) * t;

  return {
    ensureReady: () => Tone.loaded(),
    // row: 'top'|'mid'|'bot' ; i,len for gradient (0..len-1)
    play: (
      note,
      dur = "8n",
      _time,
      _vel = 0.9,
      row = "mid",
      i = 0,
      len = 1
    ) => {
      const pos = len > 1 ? i / (len - 1) : 0; // 0 left → 1 right
      // To "tone down" to the right, invert: const p = 1 - pos
      const p = pos;

      const velocity = lerp(0.8, 1.0, p);
      const cutoff = lerp(1000, 3200, p);
      const wet = lerp(0.05, 0.2, p);

      const s = row === "top" ? top : row === "bot" ? bot : mid;
      const fx = row === "top" ? topFX : row === "bot" ? botFX : midFX;

      fx.forEach((node) => {
        if (node instanceof Tone.Filter) node.frequency.rampTo(cutoff, 0.02);
        if (node instanceof Tone.Reverb) node.wet.rampTo(wet, 0.02);
        if (node instanceof Tone.EQ3) node.high.value = lerp(0, 3, p);
      });

      // Apply transpose to keep within sample range when needed
      const nn =
        transpose === 0
          ? note
          : Tone.Frequency(note).transpose(transpose).toNote();
      s.triggerAttackRelease(nn, dur, undefined, velocity);
    },
    dispose: () => {
      top.dispose();
      mid.dispose();
      bot.dispose();
      topVol.dispose();
      midVol.dispose();
      botVol.dispose();
      topComp.dispose();
      midComp.dispose();
      botComp.dispose();
      topLim.dispose();
      midLim.dispose();
      botLim.dispose();
      topFX.forEach((f) => f.dispose());
      midFX.forEach((f) => f.dispose());
      botFX.forEach((f) => f.dispose());
    },
  };
}
