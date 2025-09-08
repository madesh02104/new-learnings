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
import { createEmptyRecording } from "../lib/recording";
import {
  saveRecordings,
  loadRecordings,
  clearRecordings,
} from "../lib/storage"; // localStorage persistence
import RecordingsList from "../components/RecordingsList";
import JamBoard from "../components/JamBoard";

export default function Page() {
  // Which instrument is currently selected in the UI
  const [selected, setSelected] = useState("piano");
  // The current instrument instance (Sampler engine + FX)
  const instRef = useRef(null);
  // True when the instrument has loaded all samples and is ready to play
  const [ready, setReady] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  // Use useRef for currentRecording to avoid state updates during recording
  const currentRecordingRef = useRef(createEmptyRecording());
  const [recordings, setRecordings] = useState([]);

  // UI navigation state
  const [currentView, setCurrentView] = useState("recording"); // "recording" or "jamboard"

  // ============================================================================
  // LOAD RECORDINGS FROM LOCALSTORAGE ON PAGE LOAD
  // ============================================================================

  useEffect(() => {
    // Load saved recordings when component mounts
    const savedRecordings = loadRecordings();
    setRecordings(savedRecordings);
    console.log(
      `[TypeJam][page] Loaded ${savedRecordings.length} recordings from storage`
    );
  }, []); // Empty dependency array = run once on mount

  // ============================================================================
  // SAVE RECORDINGS TO LOCALSTORAGE WHENEVER RECORDINGS CHANGE
  // ============================================================================

  useEffect(() => {
    // Save recordings to localStorage whenever the recordings array changes
    // This ensures data persists across page reloads
    if (recordings.length > 0) {
      saveRecordings(recordings);
    }
  }, [recordings]); // Runs whenever recordings array changes

  // Start/stop recording
  const toggleRecording = () => {
    if (!isRecording) {
      // Start new recording
      currentRecordingRef.current = createEmptyRecording();
      setRecordingStartTime(Date.now());
      setIsRecording(true);
    } else {
      // Stop and finalize
      setIsRecording(false);
      const final = {
        ...currentRecordingRef.current,
        duration: Date.now() - recordingStartTime,
      };
      // Add to recordings list if it has notes
      if (final.notes.length > 0) {
        setRecordings((list) => {
          // Ensure no duplicate IDs in the list
          const existingIds = new Set(list.map((r) => r.id));
          while (existingIds.has(final.id)) {
            final.id = crypto.randomUUID();
          }
          return [...list, final];
        });
      }
      currentRecordingRef.current = createEmptyRecording();
      setRecordingStartTime(null);
    }
  };

  // Delete a recording
  const handleDeleteRecording = (recordingId) => {
    console.log("[TypeJam][page] Deleting recording:", recordingId);
    setRecordings((list) => {
      const updatedList = list.filter((r) => r.id !== recordingId);
      // The useEffect will automatically save the updated list to localStorage
      return updatedList;
    });
  };

  // Clear all recordings
  const handleClearAllRecordings = () => {
    if (recordings.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${recordings.length} recordings? This cannot be undone.`
    );

    if (confirmed) {
      console.log("[TypeJam][page] Clearing all recordings");
      setRecordings([]);
      clearRecordings(); // Clear from localStorage immediately
    }
  };

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

      // Common data for both drums and pitched
      let noteData = null;

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

          // Capture drum note if recording
          if (isRecording) {
            noteData = {
              instrument: selected,
              note,
              row: info.row,
              i: info.i,
              len: info.len,
              timestamp: Date.now() - recordingStartTime,
              duration: "8n",
              velocity: 0.95,
            };
          }
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

          // Capture pitched note if recording
          if (isRecording) {
            noteData = {
              instrument: selected,
              note: m.note,
              row: m.row,
              i: info?.i ?? 0,
              len: info?.len ?? 1,
              timestamp: Date.now() - recordingStartTime,
              duration: "8n",
              velocity: 0.9,
            };
          }
        }
      }

      // Add note to recording if captured
      if (isRecording && noteData) {
        console.log("[TypeJam][recording] captured note", noteData);
        currentRecordingRef.current = {
          ...currentRecordingRef.current,
          instrument: selected,
          notes: [...currentRecordingRef.current.notes, noteData],
        };
      }

      console.groupEnd();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, ready, isRecording, recordingStartTime]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (currentView === "jamboard") {
    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Navigation Header */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#2a2a2a",
            borderBottom: "1px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1 style={{ margin: 0, color: "#fff", fontSize: "24px" }}>
              🎵 TypeJam - Jam Board
            </h1>
            <button
              onClick={() => setCurrentView("recording")}
              style={{
                background: "#444",
                border: "1px solid #666",
                borderRadius: "4px",
                color: "#fff",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              ← Back to Recording
            </button>
          </div>
          <div style={{ color: "#888", fontSize: "14px" }}>
            {recordings.length} recordings available
          </div>
        </div>

        {/* Jam Board */}
        <div style={{ flex: 1 }}>
          <JamBoard recordings={recordings} />
        </div>
      </div>
    );
  }

  // Recording Studio View
  return (
    <main style={{ padding: 24 }}>
      {/* Navigation Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1>🎹 TypeJam - Recording Studio</h1>
        <button
          onClick={() => setCurrentView("jamboard")}
          style={{
            background: recordings.length > 0 ? "#0066cc" : "#666",
            border: "none",
            borderRadius: "6px",
            color: "white",
            padding: "12px 20px",
            cursor: recordings.length > 0 ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          disabled={recordings.length === 0}
          title={
            recordings.length === 0
              ? "Create some recordings first!"
              : "Open Jam Board"
          }
        >
          🎵 Open Jam Board
          {recordings.length > 0 && (
            <span style={{ fontSize: "12px", opacity: 0.8 }}>
              ({recordings.length})
            </span>
          )}
        </button>
      </div>

      {/* Recording Interface */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
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

        <button
          onClick={toggleRecording}
          disabled={!ready}
          style={{
            background: isRecording ? "red" : "white",
            borderRadius: "50%",
            width: 24,
            height: 24,
            border: "1px solid #ccc",
            cursor: ready ? "pointer" : "not-allowed",
          }}
          title={isRecording ? "Stop Recording" : "Start Recording"}
        />
      </div>

      <p>{ready ? "Ready" : "Loading..."}</p>
      <p>Letter keys only: Q–P, A–L, Z–M. Drums: Z–M, J/K.</p>

      {/* Recording list */}
      <RecordingsList
        recordings={recordings}
        onDelete={handleDeleteRecording}
        onClearAll={handleClearAllRecordings}
        currentInstrument={selected}
      />
    </main>
  );
}
