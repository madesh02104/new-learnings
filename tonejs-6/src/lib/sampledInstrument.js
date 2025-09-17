import * as Tone from "tone";
// Core Sampler-based engine used by every instrument.
// Responsibilities:
// - Build three Tone.Sampler instances (top/mid/bot row)
// - Route each through a distinct FX chain (EQ/Filter/Reverb + Comp/Limiter)
// - On each keypress, compute left→right position to modulate brightness/space/velocity
// - Trigger the appropriate Sampler with a musical duration

// Sampler + per-row FX + per-key parameter modulation
export function makeSampledInstrument(baseUrl, urls, options = {}) {
  const transpose = options.transpose ?? 0; // semitones
  // Create three independent samplers for routing to distinct FX per row
  const mk = () => new Tone.Sampler({ baseUrl, urls, release: 1.1 });
  const top = mk();
  const mid = mk();
  const bot = mk();

  // Per-row volume controls
  const topVol = new Tone.Volume(-6);
  const midVol = new Tone.Volume(-3);
  const botVol = new Tone.Volume(-6);

  // Per-row FX chains
  const topFX = [
    new Tone.Filter(1200, "lowpass"),
    new Tone.Reverb({ decay: 0.8, wet: 0.08 }),
  ];
  const midFX = [
    new Tone.Filter(800, "lowpass"),
    new Tone.Reverb({ decay: 1.2, wet: 0.1 }),
  ];
  const botFX = [
    new Tone.Filter(900, "lowpass"),
    new Tone.Reverb({ decay: 1.6, wet: 0.12 }),
  ];

  // Per-row dynamics processing
  const topComp = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.003,
    release: 0.1,
  });
  const midComp = new Tone.Compressor({
    threshold: -20,
    ratio: 2.5,
    attack: 0.003,
    release: 0.1,
  });
  const botComp = new Tone.Compressor({
    threshold: -18,
    ratio: 2,
    attack: 0.003,
    release: 0.1,
  });

  // Per-row limiters
  const topLim = new Tone.Limiter(-0.1);
  const midLim = new Tone.Limiter(-0.1);
  const botLim = new Tone.Limiter(-0.1);

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

  console.groupCollapsed("[TypeJam][engine] FX chains setup");

  return {
    ensureReady: async () => {
      await Promise.all([top.loaded, mid.loaded, bot.loaded]);
    },
    // row: 'top'|'mid'|'bot' ; i,len for gradient (0..len-1)
    play: (note, dur = "8n", time, _vel = 0.9, row = "mid", i = 0, len = 1) => {
      // Check if samplers are ready before playing
      if (!top.loaded || !mid.loaded || !bot.loaded) {
        console.warn("[TypeJam][play] Samplers not ready yet");
        return;
      }
      const pos = len > 1 ? i / (len - 1) : 0; // 0 left → 1 right
      // To "tone down" to the right, invert: const p = 1 - pos
      const p = pos;

      let velocity = lerp(0.8, 1.0, p);
      let cutoff = lerp(1000, 3200, p);
      let wet = lerp(0.05, 0.2, p);

      // If this is the drums instrument, shape per-row differently to get 26 distinct timbres
      const isDrums = baseUrl.includes("/audio/drums/");
      if (isDrums) {
        // Map row to brightness direction: top (brighter left->right), mid (neutral), bot (darker left->right)
        if (row === "top") {
          cutoff = lerp(2500, 7000, p); // hats/ride get brighter
          wet = lerp(0.02, 0.15, p);
        } else if (row === "bot") {
          cutoff = lerp(400, 1200, p); // kick/snare get darker
          wet = lerp(0.01, 0.08, p);
        }
        // mid row stays neutral
      }

      console.groupCollapsed("[TypeJam][play] input & derived params");
      console.log("note", note, "dur", dur, "time", time, "vel", _vel);
      console.log("row", row, "i", i, "len", len, "pos", pos, "p", p);
      console.log("velocity", velocity, "cutoff", cutoff, "wet", wet);
      console.groupEnd();

      // Apply transpose
      const nn = Tone.Frequency(note).transpose(transpose).toNote();

      // Select sampler and FX chain based on row
      let sampler, vol, fx, comp, lim;
      if (row === "top") {
        sampler = top;
        vol = topVol;
        fx = topFX;
        comp = topComp;
        lim = topLim;
      } else if (row === "bot") {
        sampler = bot;
        vol = botVol;
        fx = botFX;
        comp = botComp;
        lim = botLim;
      } else {
        // mid (default)
        sampler = mid;
        vol = midVol;
        fx = midFX;
        comp = midComp;
        lim = midLim;
      }

      // Apply dynamic parameters
      vol.volume.value = Tone.gainToDb(velocity);
      if (fx.length >= 1) fx[0].frequency.value = cutoff; // Filter
      if (fx.length >= 2) fx[1].wet.value = wet; // Reverb

      console.log("[TypeJam][play] triggering Sampler", { resolvedNote: nn });

      // Trigger the sampler
      sampler.triggerAttackRelease(nn, dur, time, velocity);
    },
    dispose: () => {
      [top, mid, bot].forEach((s) => s.dispose());
      [topVol, midVol, botVol].forEach((v) => v.dispose());
      [...topFX, ...midFX, ...botFX].forEach((f) => f.dispose());
      [topComp, midComp, botComp].forEach((c) => c.dispose());
      [topLim, midLim, botLim].forEach((l) => l.dispose());
    },
  };
}

// Utility: linear interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}
