// Component to display and manage recordings
"use client";

import { useEffect, useRef, useState } from "react";
import { createPlaybackEngine } from "../lib/playback";

export default function RecordingsList({ recordings, onDelete }) {
  // Track playback state per recording
  const [playbackStates, setPlaybackStates] = useState({});
  // Keep playback engines in a ref to avoid recreation
  const enginesRef = useRef({});

  // Cleanup engines on unmount
  useEffect(() => {
    return () => {
      Object.values(enginesRef.current).forEach((engine) => engine.dispose());
    };
  }, []);

  const getEngine = (recordingId) => {
    if (!enginesRef.current[recordingId]) {
      const recording = recordings.find((r) => r.id === recordingId);
      if (recording) {
        enginesRef.current[recordingId] = createPlaybackEngine(recording);
      }
    }
    return enginesRef.current[recordingId];
  };

  const togglePlayback = async (recordingId) => {
    const engine = getEngine(recordingId);
    if (!engine) return;

    const isPlaying = playbackStates[recordingId];
    if (isPlaying) {
      engine.stop();
      setPlaybackStates((prev) => ({ ...prev, [recordingId]: false }));
    } else {
      // Stop any other playing recordings
      Object.entries(playbackStates).forEach(([id, playing]) => {
        if (playing) {
          const otherEngine = getEngine(id);
          otherEngine?.stop();
        }
      });

      await engine.play();
      setPlaybackStates((prev) =>
        Object.fromEntries(
          Object.keys(prev).map((id) => [id, id === recordingId])
        )
      );
    }
  };

  const handleDelete = (recordingId) => {
    const engine = enginesRef.current[recordingId];
    if (engine) {
      engine.dispose();
      delete enginesRef.current[recordingId];
    }
    onDelete(recordingId);
  };

  if (!recordings.length) {
    return (
      <p>No recordings yet. Press the record button and play some notes!</p>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Recordings</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recordings.map((recording) => (
          <div
            key={recording.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            <button
              onClick={() => togglePlayback(recording.id)}
              style={{
                background: "none",
                border: "1px solid #ccc",
                borderRadius: 4,
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              {playbackStates[recording.id] ? "⏹️" : "▶️"}
            </button>

            <div style={{ flex: 1 }}>
              <div>
                {recording.instrument} ({recording.notes.length} notes)
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {Math.round(recording.duration / 100) / 10}s
              </div>
            </div>

            <button
              onClick={() => handleDelete(recording.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                opacity: 0.6,
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
