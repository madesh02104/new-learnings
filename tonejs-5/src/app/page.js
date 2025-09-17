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
import TransportControls from "../components/TransportControls";
import { createJamSession } from "../lib/jamSession";

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
  // Jam board state
  const [clips, setClips] = useState([]);
  const [pxPerSec, setPxPerSec] = useState(100);
  const [snapSec, setSnapSec] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const jamSessionRef = useRef(null);

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

  // Jam board: helpers
  const recordingsById = useRef(new Map());
  useEffect(() => {
    const map = new Map();
    for (const r of recordings) map.set(r.id, r);
    recordingsById.current = map;
  }, [recordings]);

  const handleCreateClip = ({
    recordingId,
    trackIndex,
    startTimeSec,
    durationSec,
  }) => {
    const newClip = {
      id: crypto.randomUUID(),
      recordingId,
      trackIndex,
      startTimeSec,
      durationSec,
      name: recordingsById.current.get(recordingId)?.instrument || "rec",
    };
    setClips((prev) => [...prev, newClip]);
  };

  const handleUpdateClip = (clipId, patch) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, ...patch } : c))
    );
  };

  const handleDeleteClip = (clipId) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  const ensureJamSession = () => {
    if (!jamSessionRef.current) {
      jamSessionRef.current = createJamSession(recordingsById.current);
    }
    return jamSessionRef.current;
  };

  const onPlayPause = async () => {
    const session = ensureJamSession();
    if (isPlaying) {
      session.pause();
      setIsPlaying(false);
    } else {
      await session.play(clips);
      setIsPlaying(true);
    }
  };

  const onStop = () => {
    const session = ensureJamSession();
    session.stop();
    setIsPlaying(false);
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

  // Render: instrument selector + readiness + brief usage hint
  return (
    <main className="p-4 h-screen w-screen box-border">
      <h1 className="text-xl font-semibold mb-3">Type to play</h1>
      <div className="flex gap-4 items-center">
        <label>
          Instrument:
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
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
          className={`w-6 h-6 rounded-full border ${
            isRecording ? "bg-red-500" : "bg-white"
          }`}
          title={isRecording ? "Stop Recording" : "Start Recording"}
        />
      </div>

      <p className="text-sm mt-2">{ready ? "Ready" : "Loading..."}</p>
      <p className="text-sm">
        Letter keys only: Q–P, A–L, Z–M. Drums: Z–M, J/K.
      </p>

      <div className="mt-4 grid grid-cols-[340px_1fr] gap-4 h-[calc(100vh-140px)]">
        <div className="overflow-auto">
          <RecordingsList
            recordings={recordings}
            onDelete={handleDeleteRecording}
            onClearAll={handleClearAllRecordings}
            currentInstrument={selected}
          />
        </div>
        <div className="flex flex-col h-full">
          <TransportControls
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            onStop={onStop}
            pxPerSec={pxPerSec}
            onChangePxPerSec={setPxPerSec}
            snapSec={snapSec}
            onChangeSnapSec={setSnapSec}
          />
          <div className="mt-2 flex-1">
            <JamBoard
              clips={clips}
              onCreateClip={handleCreateClip}
              onUpdateClip={handleUpdateClip}
              onDeleteClip={handleDeleteClip}
              pxPerSec={pxPerSec}
              numTracks={10}
              snapSec={snapSec}
              isActive={isPlaying}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
