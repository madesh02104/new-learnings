"use client";

// ============================================================================
// JAM TRACK BLOCK - Individual recording block on the timeline
// ============================================================================

import { useState, useRef, useEffect } from "react";

/**
 * JamTrackBlock: A single recording block displayed on the timeline
 *
 * VISUAL APPEARANCE:
 * ┌─────────────────────────────────┐
 * │ 🎹 Piano Recording              │
 * │ ████████████████████████████    │ ← Waveform representation
 * │ 0:05                            │
 * └─────────────────────────────────┘
 *
 * FEATURES:
 * - Color-coded by instrument type
 * - Shows recording name and duration
 * - Click to select
 * - Drag to reposition
 * - Resize handles (future feature)
 * - Context menu on right-click
 *
 * @param {Object} props
 * @param {import('../lib/jamSession').JamTrack} props.track - The track data
 * @param {number} props.pixelsPerSecond - Current zoom level
 * @param {boolean} props.isSelected - Whether this track is currently selected
 * @param {Function} props.onSelect - Called when track is clicked
 * @param {Function} props.onUpdate - Called when track properties change
 * @param {Function} props.onRemove - Called when track should be deleted
 */
export default function JamTrackBlock({
  track,
  pixelsPerSecond,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const blockRef = useRef(null);

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const blockWidth = track.duration * pixelsPerSecond;
  const blockLeft = track.startTime * pixelsPerSecond;
  const TRACK_HEIGHT = 60;
  const BLOCK_HEIGHT = TRACK_HEIGHT - 8; // Leave some margin

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Format duration in seconds to readable string
   */
  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

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
   * Snap time to grid for easier positioning
   */
  const snapToTimeGrid = (timeInSeconds) => {
    const snappedTime = Math.round(timeInSeconds / GRID_SIZE) * GRID_SIZE;
    return Math.max(0, snappedTime);
  };

  /**
   * Get the best track index based on mouse position with hysteresis
   */
  const getSnapTrackIndex = (mouseY, currentTrackIndex) => {
    const rawTrackIndex = Math.floor(mouseY / TRACK_HEIGHT);
    const trackCenter = (rawTrackIndex + 0.5) * TRACK_HEIGHT;
    const distanceFromCenter = Math.abs(mouseY - trackCenter);

    // If we're close to the center of a track, snap to it
    if (distanceFromCenter < TRACK_SNAP_THRESHOLD) {
      return Math.max(0, rawTrackIndex);
    }

    // If we're dragging within the same track and not too far, stay put
    if (
      rawTrackIndex === currentTrackIndex &&
      distanceFromCenter < TRACK_HEIGHT * 0.3
    ) {
      return currentTrackIndex;
    }

    return Math.max(0, rawTrackIndex);
  };

  /**
   * Calculate smooth drag preview position
   */
  const calculateDragPreview = (mouseX, mouseY) => {
    // Try multiple ways to find the timeline container
    let timelineContainer = null;

    if (blockRef.current) {
      // Try to find container with data attribute first
      timelineContainer = blockRef.current.closest("[data-timeline-area]");

      // Fallback: navigate up the DOM tree to find the timeline
      if (!timelineContainer) {
        let element = blockRef.current;
        while (element && element.parentElement) {
          element = element.parentElement;
          // Look for timeline-like containers
          if (
            element.style &&
            element.style.position === "relative" &&
            element.style.overflow === "auto"
          ) {
            timelineContainer = element;
            break;
          }
        }
      }

      // Final fallback: use a parent container
      if (!timelineContainer) {
        timelineContainer = blockRef.current.parentElement?.parentElement;
      }
    }

    if (!timelineContainer) {
      console.warn(
        "[TypeJam][JamTrackBlock] Could not find timeline container"
      );
      return null;
    }

    const rect = timelineContainer.getBoundingClientRect();
    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;

    // Calculate snapped positions
    const rawTime = Math.max(0, relativeX / pixelsPerSecond);
    const snappedTime = snapToTimeGrid(rawTime);
    const snappedTrackIndex = getSnapTrackIndex(relativeY, track.trackIndex);

    console.log(
      `[TypeJam][JamTrackBlock] Drag preview: ${snappedTime}s, track ${snappedTrackIndex}`
    );

    return {
      time: snappedTime,
      trackIndex: snappedTrackIndex,
      x: snappedTime * pixelsPerSecond,
      y: snappedTrackIndex * TRACK_HEIGHT + 4, // +4 for margin
    };
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle mouse down - prepare for potential drag
   */
  const handleMouseDown = (event) => {
    if (event.button !== 0) return; // Only left mouse button

    console.log(`[TypeJam][JamTrackBlock] Mouse down on track ${track.id}`);

    event.preventDefault();
    event.stopPropagation();

    // Mark the event as handled to prevent parent handlers
    event.isHandledByTrackBlock = true;

    // Store initial mouse position and element offset
    setDragStart({ x: event.clientX, y: event.clientY });

    const rect = blockRef.current.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    setIsMouseDown(true);
    onSelect(); // Select this track

    // Add global mouse event listeners
    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp, { passive: false });
  };

  /**
   * Handle mouse move - check threshold and update drag position
   */
  const handleMouseMove = (event) => {
    if (!isMouseDown || !blockRef.current) return;

    // Prevent event propagation during drag
    event.preventDefault();
    event.stopPropagation();

    // Check if we've moved far enough to start dragging
    if (!isDragging) {
      const deltaX = Math.abs(event.clientX - dragStart.x);
      const deltaY = Math.abs(event.clientY - dragStart.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Only start dragging if we've moved beyond the threshold
      if (distance < DRAG_THRESHOLD) {
        return; // Not far enough, don't start dragging yet
      }

      // Start dragging now
      setIsDragging(true);
      console.log(
        `[TypeJam][JamTrackBlock] Started dragging track ${
          track.id
        } after ${distance.toFixed(1)}px movement`
      );
    }

    // Now we're definitely dragging - calculate drag preview position
    const preview = calculateDragPreview(event.clientX, event.clientY);
    if (!preview) return;

    // Update visual preview
    setDragPreview({
      x: preview.x,
      y: preview.y,
      visible: true,
    });

    // Update snap target indicator
    setSnapTarget({
      time: preview.time,
      trackIndex: preview.trackIndex,
      visible: true,
    });

    // Throttle actual updates to avoid performance issues
    const now = Date.now();
    if (!handleMouseMove.lastUpdate || now - handleMouseMove.lastUpdate > 16) {
      // ~60fps
      console.log(
        `[TypeJam][JamTrackBlock] Updating track position: ${preview.time}s, track ${preview.trackIndex}`
      );
      onUpdate({
        startTime: preview.time,
        trackIndex: preview.trackIndex,
      });
      handleMouseMove.lastUpdate = now;
    }
  };

  /**
   * Handle mouse up - stop dragging or handle click
   */
  const handleMouseUp = (event) => {
    console.log(
      `[TypeJam][JamTrackBlock] Mouse up on track ${track.id}, was dragging: ${isDragging}`
    );

    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (isDragging) {
      console.log(
        `[TypeJam][JamTrackBlock] Stopped dragging track ${track.id}`
      );
      setIsDragging(false);
    }

    // Reset all drag states
    setIsMouseDown(false);
    setDragPreview({ x: 0, y: 0, visible: false });
    setSnapTarget({ time: 0, trackIndex: 0, visible: false });

    // Always remove event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  /**
   * Handle right-click - show context menu
   */
  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenuPos({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
    onSelect(); // Select this track

    console.log(
      `[TypeJam][JamTrackBlock] Context menu opened for track ${track.id}`
    );
  };

  /**
   * Handle click - select track (only if we didn't drag)
   */
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Only handle click if we weren't dragging
    if (!isDragging) {
      onSelect();
    }
  };

  /**
   * Handle delete from context menu
   */
  const handleDelete = () => {
    console.log(`[TypeJam][JamTrackBlock] Deleting track ${track.id}`);
    onRemove();
    setShowContextMenu(false);
  };

  /**
   * Handle duplicate from context menu
   */
  const handleDuplicate = () => {
    console.log(`[TypeJam][JamTrackBlock] Duplicating track ${track.id}`);
    // TODO: Implement duplication
    setShowContextMenu(false);
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      // Clean up any remaining event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Reset states on unmount
      setIsMouseDown(false);
      setIsDragging(false);
    };
  }, []);

  // Close context menu when clicking elsewhere
  if (showContextMenu) {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener("click", handleClickOutside);
    setTimeout(
      () => document.removeEventListener("click", handleClickOutside),
      100
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>

      {/* Snap target indicator */}
      {snapTarget.visible && isDragging && (
        <div
          style={{
            position: "absolute",
            left: `${snapTarget.time * pixelsPerSecond}px`,
            top: `${snapTarget.trackIndex * TRACK_HEIGHT + 2}px`,
            width: `${Math.max(blockWidth, 60)}px`,
            height: `${BLOCK_HEIGHT + 4}px`,
            border: "2px dashed #4CAF50",
            borderRadius: "6px",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            pointerEvents: "none",
            zIndex: 5,
            animation: "pulse 1s infinite",
          }}
        />
      )}

      {/* Main track block */}
      <div
        ref={blockRef}
        style={{
          position: "absolute",
          left:
            isDragging && dragPreview.visible
              ? `${dragPreview.x}px`
              : `${blockLeft}px`,
          top: isDragging && dragPreview.visible ? `${dragPreview.y}px` : "4px",
          width: `${Math.max(blockWidth, 60)}px`, // Minimum width for visibility
          height: `${BLOCK_HEIGHT}px`,
          backgroundColor: track.color,
          border: isSelected ? "2px solid #fff" : "1px solid rgba(0,0,0,0.3)",
          borderRadius: "4px",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          overflow: "hidden",
          boxShadow: isSelected
            ? "0 0 8px rgba(255,255,255,0.5)"
            : isDragging
            ? "0 8px 16px rgba(0,0,0,0.4)"
            : "0 2px 4px rgba(0,0,0,0.3)",
          opacity: isDragging ? 0.9 : 1,
          zIndex: isDragging ? 1000 : isSelected ? 100 : 10,
          transition: isDragging ? "none" : "all 0.2s ease",
          transform: isDragging ? "scale(1.02)" : "scale(1)",
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        {/* Header with instrument icon and name */}
        <div
          style={{
            padding: "4px 8px",
            backgroundColor: "rgba(0,0,0,0.2)",
            fontSize: "11px",
            fontWeight: "500",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          <span>{getInstrumentIcon(track.recordingId)}</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Recording {track.recordingId.slice(-4)}
          </span>
        </div>

        {/* Waveform representation (simplified) */}
        <div
          style={{
            padding: "4px 8px",
            height: "20px",
            display: "flex",
            alignItems: "end",
            gap: "1px",
          }}
        >
          {/* Generate fake waveform bars */}
          {Array.from(
            { length: Math.min(20, Math.floor(blockWidth / 4)) },
            (_, i) => (
              <div
                key={i}
                style={{
                  width: "2px",
                  height: `${Math.random() * 16 + 2}px`,
                  backgroundColor: "rgba(255,255,255,0.6)",
                  borderRadius: "1px",
                }}
              />
            )
          )}
        </div>

        {/* Duration display */}
        <div
          style={{
            position: "absolute",
            bottom: "4px",
            left: "8px",
            fontSize: "10px",
            color: "rgba(255,255,255,0.8)",
            fontFamily: "monospace",
            textShadow: "0 1px 2px rgba(0,0,0,0.7)",
          }}
        >
          {formatDuration(track.duration)}
        </div>

        {/* Volume indicator (if not full volume) */}
        {track.volume !== 1.0 && (
          <div
            style={{
              position: "absolute",
              bottom: "4px",
              right: "8px",
              fontSize: "10px",
              color: "rgba(255,255,255,0.8)",
              fontFamily: "monospace",
            }}
          >
            {Math.round(track.volume * 100)}%
          </div>
        )}

        {/* Muted indicator */}
        {track.muted && (
          <div
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              fontSize: "12px",
              color: "#ff4444",
            }}
          >
            🔇
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          style={{
            position: "fixed",
            left: `${contextMenuPos.x}px`,
            top: `${contextMenuPos.y}px`,
            backgroundColor: "#333",
            border: "1px solid #555",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            zIndex: 1000,
            minWidth: "120px",
          }}
        >
          <button
            style={{
              display: "block",
              width: "100%",
              padding: "8px 12px",
              background: "none",
              border: "none",
              color: "#fff",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "12px",
            }}
            onClick={handleDuplicate}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#444")}
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            Duplicate
          </button>
          <button
            style={{
              display: "block",
              width: "100%",
              padding: "8px 12px",
              background: "none",
              border: "none",
              color: "#ff4444",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "12px",
            }}
            onClick={handleDelete}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#444")}
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            Delete
          </button>
        </div>
      )}
    </>
  );
}
