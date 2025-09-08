"use client";

// ============================================================================
// TRANSPORT CONTROLS - Play/Stop/Pause controls for the jam board
// ============================================================================

/**
 * TransportControls: Main playback controls for the jam board
 *
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ [⏮] [⏸/▶] [⏹] [⏭] | 🎵 My Jam Session | 0:45 / 2:30 | [🔍-] [🔍+] │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * FEATURES:
 * - Play/Pause toggle button
 * - Stop button (resets to beginning)
 * - Skip to start/end buttons
 * - Session name display
 * - Time display (current / total)
 * - Zoom in/out controls
 *
 * @param {Object} props
 * @param {boolean} props.isPlaying - Current playback state
 * @param {number} props.currentTime - Current playhead position (seconds)
 * @param {number} props.duration - Total session duration (seconds)
 * @param {Function} props.onPlay - Called when play button clicked
 * @param {Function} props.onStop - Called when stop button clicked
 * @param {Function} props.onPause - Called when pause button clicked
 * @param {Function} props.onZoomIn - Called when zoom in button clicked
 * @param {Function} props.onZoomOut - Called when zoom out button clicked
 */
export default function TransportControls({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onStop,
  onPause,
  onZoomIn,
  onZoomOut,
}) {
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Format time in seconds to MM:SS format
   * @param {number} timeInSeconds - Time to format
   * @returns {string} Formatted time string
   */
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle play/pause button click
   */
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  /**
   * Handle skip to start
   */
  const handleSkipToStart = () => {
    onStop(); // Stop will reset currentTime to 0
  };

  /**
   * Handle skip to end
   */
  const handleSkipToEnd = () => {
    // TODO: Implement skip to end functionality
    console.log("[TypeJam][TransportControls] Skip to end clicked");
  };

  // ============================================================================
  // BUTTON STYLES
  // ============================================================================

  const buttonStyle = {
    background: "#444",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#666",
    borderRadius: "4px",
    color: "#fff",
    padding: "8px 12px",
    margin: "0 2px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "40px",
    height: "36px",
    transition: "background-color 0.2s",
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: "#0066cc",
    borderColor: "#0088ff",
  };

  const smallButtonStyle = {
    ...buttonStyle,
    padding: "6px 8px",
    fontSize: "12px",
    minWidth: "32px",
    height: "28px",
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "8px 16px",
        backgroundColor: "#2a2a2a",
        borderBottom: "1px solid #333",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ===== TRANSPORT BUTTONS ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {/* Skip to Start */}
        <button
          style={buttonStyle}
          onClick={handleSkipToStart}
          title="Skip to start"
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#555")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#444")}
        >
          ⏮
        </button>

        {/* Play/Pause Toggle */}
        <button
          style={isPlaying ? activeButtonStyle : buttonStyle}
          onClick={handlePlayPause}
          title={isPlaying ? "Pause" : "Play"}
          onMouseEnter={(e) => {
            if (!isPlaying) e.target.style.backgroundColor = "#555";
          }}
          onMouseLeave={(e) => {
            if (!isPlaying) e.target.style.backgroundColor = "#444";
          }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Stop */}
        <button
          style={buttonStyle}
          onClick={onStop}
          title="Stop"
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#555")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#444")}
        >
          ⏹
        </button>

        {/* Skip to End */}
        <button
          style={buttonStyle}
          onClick={handleSkipToEnd}
          title="Skip to end"
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#555")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#444")}
        >
          ⏭
        </button>
      </div>

      {/* ===== SESSION INFO ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#ccc",
        }}
      >
        <span>🎵</span>
        <span style={{ fontWeight: "500" }}>Jam Session</span>
      </div>

      {/* ===== TIME DISPLAY ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#fff",
          backgroundColor: "#1a1a1a",
          padding: "6px 12px",
          borderRadius: "4px",
          border: "1px solid #444",
        }}
      >
        <span style={{ color: "#4CAF50" }}>{formatTime(currentTime)}</span>
        <span style={{ color: "#666" }}>/</span>
        <span style={{ color: "#ccc" }}>{formatTime(duration)}</span>
      </div>

      {/* ===== SPACER ===== */}
      <div style={{ flex: 1 }} />

      {/* ===== ZOOM CONTROLS ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "#888",
            marginRight: "8px",
          }}
        >
          Zoom:
        </span>

        {/* Zoom Out */}
        <button
          style={smallButtonStyle}
          onClick={onZoomOut}
          title="Zoom out"
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#555")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#444")}
        >
          🔍-
        </button>

        {/* Zoom In */}
        <button
          style={smallButtonStyle}
          onClick={onZoomIn}
          title="Zoom in"
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#555")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#444")}
        >
          🔍+
        </button>
      </div>

      {/* ===== STATUS INDICATOR ===== */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: isPlaying ? "#4CAF50" : "#666",
          marginLeft: "8px",
          boxShadow: isPlaying ? "0 0 8px rgba(76, 175, 80, 0.5)" : "none",
          transition: "all 0.3s ease",
        }}
      />
    </div>
  );
}
