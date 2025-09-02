"use client";
// Page component: connects the UI (dropdown + typing) to the instrument engine.
// Flow summary:
// 1) User picks an instrument from the <select>
// 2) We construct that instrument via INSTRUMENTS[...]()
// 3) We wait for Tone.Sampler buffers to load (ensureReady)
// 4) On each keydown, we map the key to a note + row position
// 5) We call instrument.play(note, dur, time, velocity, row, i, len)
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { INSTRUMENTS } from "../lib/instruments"; // registry of instrument factories
import { noteMap, indexMap, drumKeyToNote } from "../lib/keys"; // keyboard -> notes/rows

export default function Page() {
  // Which instrument is currently selected in the UI
  const [selected, setSelected] = useState("piano");
  // The current instrument instance (Sampler engine + FX)
  const instRef = useRef(null);
  // True when the instrument has loaded all samples and is ready to play
  const [ready, setReady] = useState(false);

  // (Re)create instrument when selection changes
  useEffect(() => {
    // Load instrument whenever selection changes
    let cancelled = false;
    const load = async () => {
      // Dispose previous instrument to free audio resources
      if (instRef.current) instRef.current.dispose();
      const factory = INSTRUMENTS[selected];
      console.groupCollapsed("[TypeJam][page] create instrument");
      console.log({ selected, factory: typeof factory });
      console.groupEnd();
      // Create and store the new instrument
      const inst = factory();
      instRef.current = inst;
      // Wait for all Sampler buffers to finish loading
      await inst.ensureReady();
      console.log("[TypeJam][page] instrument ready");
      if (!cancelled) setReady(true);
    };
    // UI shows Loading... until ready flips to true
    setReady(false);
    load();
    return () => {
      // Prevent state update if component unmounts during async load
      cancelled = true;
    };
  }, [selected]);

  // Global key handler: map pressed key -> note + row/index, then play
  useEffect(() => {
    const onKeyDown = async (e) => {
      if (!ready) return;
      // Some browsers require a user gesture to start the audio context
      if (Tone.context.state !== "running") await Tone.start();
      const k = e.key.toLowerCase();
      console.groupCollapsed("[TypeJam][page] keydown");
      console.log({ key: k, selected });
      if (selected === "drums") {
        // For drums: key -> pseudo-note (e.g., C1) selecting the one-shot sample
        const note = drumKeyToNote.get(k);
        const info = indexMap.get(k);
        console.log({ drumNote: note, drumInfo: info });
        if (note && info) {
          instRef.current.play(
            note,
            "8n",
            undefined,
            0.95,
            info.row,
            info.i,
            info.len
          );
        }
      } else {
        // For pitched instruments: key -> musical note (e.g., C4)
        const m = noteMap.get(k);
        console.log({ pitchedMap: m, pitchedInfo: indexMap.get(k) });
        if (m) {
          const info = indexMap.get(k);
          instRef.current.play(
            m.note,
            "8n",
            undefined,
            0.9,
            m.row,
            info?.i ?? 0,
            info?.len ?? 1
          );
        }
      }
      console.groupEnd();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, ready]);

  // Render: instrument selector + readiness + brief usage hint
  return (
    <main style={{ padding: 24 }}>
      <h1>Type to play (Soundfont)</h1>
      <label>
        Instrument:
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="piano">Piano</option>
          <option value="guitar">Guitar</option>
          <option value="bass">Bass</option>
          <option value="violin">Violin</option>
          <option value="drums">Drums</option>
        </select>
      </label>
      <p>{ready ? "Ready" : "Loading..."}</p>
      <p>Letter keys only: Q–P, A–L, Z–M. Drums: Z–M, J/K.</p>
    </main>
  );
}
