"use client";

// ============================================================================
// RECORDINGS LIBRARY - Sidebar showing available recordings for drag & drop
// ============================================================================

/**
 * RecordingsLibrary: Sidebar component showing all available recordings
 *
 * LAYOUT:
 * ┌─────────────────────────┐
 * │ 🎵 Recordings Library   │
 * ├─────────────────────────┤
 * │ 🎹 Piano Recording      │ ← Draggable
 * │    3 notes • 2.5s       │
 * ├─────────────────────────┤
 * │ 🎸 Guitar Recording     │
 * │    8 notes • 4.2s       │
 * ├─────────────────────────┤
 * │ 🥁 Drum Recording       │
 * │    12 notes • 3.8s      │
 * └─────────────────────────┘
 *
 * FEATURES:
 * - Shows all available recordings from the main app
 * - Each recording is draggable to the timeline
 * - Shows recording metadata (instrument, duration, note count)
 * - Color-coded by instrument type
 * - Search/filter functionality (future feature)
 *
 * @param {Object} props
 * @param {import('../lib/recording').Recording[]} props.recordings - Available recordings
 * @param {Function} props.onDragStart - Called when drag starts (optional)
 */
export default function RecordingsLibrary({ recordings, onDragStart }) {
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get instrument emoji/icon
   */
  const getInstrumentIcon = (instrument) => {
    const icons = {
      piano: "🎹",
      guitar: "🎸",
      bass: "🎸",
      violin: "🎻",
      drums: "🥁",
    };
    return icons[instrument] || "🎵";
  };

  /**
   * Get instrument color (same as JamTrack colors)
   */
  const getInstrumentColor = (instrument) => {
    const colors = {
      piano: "#4A90E2", // Blue
      guitar: "#F5A623", // Orange
      bass: "#7ED321", // Green
      violin: "#9013FE", // Purple
      drums: "#D0021B", // Red
    };
    return colors[instrument] || "#50E3C2"; // Default teal
  };

  /**
   * Format duration in milliseconds to readable string
   */
  const formatDuration = (durationMs) => {
    const seconds = durationMs / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle drag start for a recording
   */
  const handleDragStart = (event, recording) => {
    console.log(
      `[TypeJam][RecordingsLibrary] Starting drag for recording ${recording.id}`
    );

    // Store recording data in drag event
    event.dataTransfer.setData("application/json", JSON.stringify(recording));
    event.dataTransfer.effectAllowed = "copy";

    // Optional callback
    if (onDragStart) {
      onDragStart(recording);
    }
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = (event, recording) => {
    console.log(
      `[TypeJam][RecordingsLibrary] Drag ended for recording ${recording.id}`
    );
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render a single recording item
   */
  const renderRecordingItem = (recording) => {
    const color = getInstrumentColor(recording.instrument);
    const icon = getInstrumentIcon(recording.instrument);

    return (
      <div
        key={recording.id}
        draggable
        onDragStart={(e) => handleDragStart(e, recording)}
        onDragEnd={(e) => handleDragEnd(e, recording)}
        style={{
          padding: "12px",
          margin: "8px",
          backgroundColor: "#333",
          border: `2px solid ${color}`,
          borderRadius: "8px",
          cursor: "grab",
          userSelect: "none",
          transition: "all 0.2s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#3a3a3a";
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = `0 4px 8px rgba(0,0,0,0.3)`;
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#333";
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "none";
        }}
        onMouseDown={(e) => {
          e.target.style.cursor = "grabbing";
        }}
        onMouseUp={(e) => {
          e.target.style.cursor = "grab";
        }}
      >
        {/* Header with instrument icon and name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "18px" }}>{icon}</span>
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              {recording.instrument} Recording
            </div>
          </div>
        </div>

        {/* Recording metadata */}
        <div
          style={{
            fontSize: "12px",
            color: "#aaa",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{recording.notes.length} notes</span>
          <span>{formatDuration(recording.duration)}</span>
        </div>

        {/* Color stripe indicator */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "4px",
            backgroundColor: color,
            borderRadius: "2px 0 0 2px",
          }}
        />

        {/* Drag hint */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            fontSize: "12px",
            color: "#666",
            fontFamily: "monospace",
          }}
        >
          ⋮⋮
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      style={{
        height: "100%",
        backgroundColor: "#2a2a2a",
        borderRight: "1px solid #333",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #333",
          backgroundColor: "#333",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🎵</span>
          Recordings Library
        </h3>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "12px",
            color: "#888",
          }}
        >
          Drag recordings to the timeline
        </p>
      </div>

      {/* Recordings list */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 0",
        }}
      >
        {recordings.length === 0 ? (
          /* Empty state */
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "#666",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎵</div>
            <div style={{ fontSize: "14px", marginBottom: "8px" }}>
              No recordings yet
            </div>
            <div style={{ fontSize: "12px" }}>
              Go back to the main page to create some recordings first!
            </div>
          </div>
        ) : (
          /* Recordings list */
          <div>{recordings.map(renderRecordingItem)}</div>
        )}
      </div>

      {/* Footer with stats */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #333",
          backgroundColor: "#333",
          fontSize: "12px",
          color: "#888",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{recordings.length} recordings</span>
          <span>
            {recordings.reduce((total, rec) => total + rec.notes.length, 0)}{" "}
            total notes
          </span>
        </div>
      </div>
    </div>
  );
}
