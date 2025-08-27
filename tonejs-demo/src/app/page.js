"use client";

import { useEffect, useRef } from "react";
import * as Tone from "tone";

function usePianoVoices() {
  const voiceRef = useRef(null);

  if (!voiceRef.current) {
    voiceRef.current = {
      top: new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.02, decay: 0.25, sustain: 0.15, release: 0.8 },
      }).toDestination(),
      middle: new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.03, decay: 0.35, sustain: 0.25, release: 1.1 },
      }).toDestination(),
      bottom: new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.04, decay: 0.35, sustain: 0.35, release: 1.4 },
      }).toDestination(),
    };
  }

  return voiceRef.current;
}

function genNotes(startNote, count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    const freq = Tone.Frequency(startNote);
    const transposed = freq.transpose(i);
    const noteName = transposed.toNote();
    result.push(noteName);
  }
  return result;
}

const topRowKeys = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const midRowKeys = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const botRowKeys = ["z", "x", "c", "v", "b", "n", "m"];

const topRowNotes = genNotes("C6", topRowKeys.length);
console.log("Top row Notes: ", topRowNotes);
const midRowNotes = genNotes("C5", midRowKeys.length);
const botRowNotes = genNotes("C4", botRowKeys.length);

const keyToNote = new Map([
  ...topRowKeys.map((k, i) => [k, { note: topRowNotes[i], voice: "top" }]),
  ...midRowKeys.map((k, i) => [k, { note: midRowNotes[i], voice: "middle" }]),
  ...botRowKeys.map((k, i) => [k, { note: botRowNotes[i], voice: "bottom" }]),
]);

console.log("Key to Note: ", keyToNote);

export default function Home() {
  const voices = usePianoVoices();

  useEffect(() => {
    const onKeyDown = async (e) => {
      const key = e.key.toLowerCase();
      if (!keyToNote.has(key)) return;
      if (Tone.context.state !== "running") await Tone.start();
      const { note, voice } = keyToNote.get(key);
      const synth =
        voice === "top"
          ? voices.top
          : voice === "middle"
          ? voices.middle
          : voices.bottom;
      synth.triggerAttackRelease(note, "8n");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [voices]);

  return (
    <main style={{ padding: 24, lineHeight: 1.6 }}>
      <h1>Type to play piano notes</h1>
      <p>Use letter keys only:</p>
      <p>
        <strong>Top row:</strong> Q W E R T Y U I O P (bright)
      </p>
      <p>
        <strong>Middle row:</strong> A S D F G H J K L (classic)
      </p>
      <p>
        <strong>Bottom row:</strong> Z X C V B N M (deep)
      </p>
      <p>Left → right increases pitch in each row.</p>
    </main>
  );
}
