"use client";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { INSTRUMENTS } from "../lib/instruments";
import { noteMap, indexMap, drumKeyToNote } from "../lib/keys";

export default function Page() {
  const [selected, setSelected] = useState("piano");
  const instRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (instRef.current) instRef.current.dispose();
      const factory = INSTRUMENTS[selected];
      const inst = factory();
      instRef.current = inst;
      await inst.ensureReady();
      if (!cancelled) setReady(true);
    };
    setReady(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    const onKeyDown = async (e) => {
      if (!ready) return;
      if (Tone.context.state !== "running") await Tone.start();
      const k = e.key.toLowerCase();
      if (selected === "drums") {
        const note = drumKeyToNote.get(k);
        const info = indexMap.get(k);
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
        const m = noteMap.get(k);
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
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, ready]);

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
