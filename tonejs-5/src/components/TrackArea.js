"use client";

// ============================================================================
// TRACK AREA - The main timeline workspace where tracks are displayed
// ============================================================================

import SimpleDragBlock from "./SimpleDragBlock";

/**
 * TrackArea: The main workspace showing all tracks on the timeline
 *
 * VISUAL LAYOUT:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Track 0: [Piano Recording]     [Guitar Recording]          │
 * │ Track 1:      [Bass Recording]          [Drum Recording]   │
 * │ Track 2: [Violin Recording]                                │
 * │ Track 3: (empty)                                           │
 * └─────────────────────────────────────────────────────────────┘
 *
 * FEATURES:
 * - Shows all tracks in the jam session
 * - Each track is a horizontal lane
 * - Recordings appear as colored blocks positioned by time
 * - Supports drag & drop for repositioning
 * - Click to select tracks
 * - Right-click for context menu
 *
 * @param {Object} props
 * @param {import('../lib/jamSession').JamSession} props.jamSession - Current jam session
 * @param {number} props.pixelsPerSecond - Current zoom level
 * @param {string|null} props.selectedTrackId - ID of currently selected track
 * @param {Function} props.onSelectTrack - Called when track is selected
 * @param {Function} props.onUpdateTrack - Called when track properties change
 * @param {Function} props.onRemoveTrack - Called when track is deleted
 * @param {Function} props.onAddRecording - Called when recording is dropped onto timeline
 */
export default function TrackArea({
  jamSession,
  pixelsPerSecond,
  selectedTrackId,
  onSelectTrack,
  onUpdateTrack,
  onRemoveTrack,
  onAddRecording,
}) {
  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const TRACK_HEIGHT = 60; // Height of each track lane in pixels
  const MIN_TRACKS = 6; // Always show at least this many track lanes

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  /**
   * Get the maximum track index used, or minimum number of tracks
   */
  const getMaxTrackIndex = () => {
    if (jamSession.tracks.length === 0) {
      return MIN_TRACKS - 1; // Show empty tracks
    }

    const maxUsedIndex = Math.max(
      ...jamSession.tracks.map((track) => track.trackIndex)
    );
    return Math.max(maxUsedIndex, MIN_TRACKS - 1);
  };

  /**
   * Group tracks by their track index for easier rendering
   */
  const getTracksByIndex = () => {
    const tracksByIndex = {};

    // Initialize empty arrays for all track indices
    for (let i = 0; i <= getMaxTrackIndex(); i++) {
      tracksByIndex[i] = [];
    }

    // Group tracks by index
    jamSession.tracks.forEach((track) => {
      if (!tracksByIndex[track.trackIndex]) {
        tracksByIndex[track.trackIndex] = [];
      }
      tracksByIndex[track.trackIndex].push(track);
    });

    return tracksByIndex;
  };

  const tracksByIndex = getTracksByIndex();
  const maxTrackIndex = getMaxTrackIndex();
  const totalHeight = (maxTrackIndex + 1) * TRACK_HEIGHT;
  const totalWidth = Math.max(jamSession.duration * pixelsPerSecond, 800);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle dropping a recording onto the timeline
   */
  const handleDrop = (event) => {
    event.preventDefault();

    try {
      const recordingData = JSON.parse(
        event.dataTransfer.getData("application/json")
      );
      const rect = event.currentTarget.getBoundingClientRect();

      // Calculate drop position
      const dropX = event.clientX - rect.left;
      const dropY = event.clientY - rect.top;

      // Convert to timeline coordinates
      const startTime = Math.max(0, dropX / pixelsPerSecond);
      const trackIndex = Math.floor(dropY / TRACK_HEIGHT);

      console.log(
        `[TypeJam][TrackArea] Recording dropped at ${startTime}s on track ${trackIndex}`
      );

      // Add the recording to the jam session
      onAddRecording(recordingData, startTime, trackIndex);
    } catch (error) {
      console.error("[TypeJam][TrackArea] Failed to handle drop:", error);
    }
  };

  /**
   * Handle drag over (required for drop to work)
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  /**
   * Handle clicking on empty track area
   */
  const handleTrackAreaClick = (event, trackIndex) => {
    // Only handle clicks on empty areas (not on track blocks)
    if (event.target === event.currentTarget) {
      console.log(`[TypeJam][TrackArea] Clicked on empty track ${trackIndex}`);
      onSelectTrack(null); // Clear selection
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render a single track lane
   */
  const renderTrackLane = (trackIndex) => {
    const tracksOnThisIndex = tracksByIndex[trackIndex] || [];
    const isEvenTrack = trackIndex % 2 === 0;

    return (
      <div
        key={trackIndex}
        style={{
          position: "relative",
          height: `${TRACK_HEIGHT}px`,
          backgroundColor: isEvenTrack ? "#2a2a2a" : "#333",
          borderBottom: "1px solid #444",
          cursor: "pointer",
        }}
        onClick={(e) => handleTrackAreaClick(e, trackIndex)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Track label */}
        <div
          style={{
            position: "absolute",
            left: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "12px",
            color: "#666",
            fontFamily: "monospace",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          Track {trackIndex + 1}
        </div>

        {/* Track blocks (recordings) */}
        {tracksOnThisIndex.map((track) => (
          <SimpleDragBlock
            key={track.id}
            track={track}
            pixelsPerSecond={pixelsPerSecond}
            isSelected={track.id === selectedTrackId}
            onSelect={() => onSelectTrack(track.id)}
            onUpdate={(updates) => onUpdateTrack(track.id, updates)}
            onRemove={() => onRemoveTrack(track.id)}
          />
        ))}

        {/* Drop zone indicator (shown during drag) */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "0",
            right: "0",
            bottom: "4px",
            border: "2px dashed transparent",
            borderRadius: "4px",
            pointerEvents: "none",
            transition: "border-color 0.2s",
          }}
          className="drop-zone"
        />
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      data-timeline-area="true"
      style={{
        position: "relative",
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
        backgroundColor: "#1a1a1a",
        overflow: "hidden",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Background grid (vertical lines for time) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `repeating-linear-gradient(
            to right,
            transparent 0px,
            transparent ${pixelsPerSecond * 5 - 1}px,
            rgba(255, 255, 255, 0.05) ${pixelsPerSecond * 5 - 1}px,
            rgba(255, 255, 255, 0.05) ${pixelsPerSecond * 5}px
          )`,
          pointerEvents: "none",
        }}
      />

      {/* Track lanes */}
      {Array.from({ length: maxTrackIndex + 1 }, (_, index) =>
        renderTrackLane(index)
      )}

      {/* Debug overlay (temporary) */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          padding: "4px 8px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          borderRadius: "4px",
          fontSize: "10px",
          color: "#888",
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        Tracks: {jamSession.tracks.length} | Lanes: {maxTrackIndex + 1} |
        Duration: {jamSession.duration.toFixed(1)}s
      </div>
    </div>
  );
}
