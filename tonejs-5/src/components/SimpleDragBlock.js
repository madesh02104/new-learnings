"use client";

import { useState, useRef, useEffect } from "react";

/**
 * SimpleDragBlock: A draggable track block with minimal complexity
 */
export default function SimpleDragBlock({
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
  const blockRef = useRef(null);

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const TRACK_HEIGHT = 60;
  const BLOCK_HEIGHT = TRACK_HEIGHT - 8;
  const blockWidth = track.duration * pixelsPerSecond;
  const blockLeft = track.startTime * pixelsPerSecond;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleMouseDown = (event) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    console.log(`[SimpleDrag] Mouse down on track ${track.id}`);

    // Calculate offset from mouse to top-left of block
    const rect = blockRef.current.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    setIsDragging(true);
    onSelect();

    // Add global listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;

    // Find timeline container
    const timeline = blockRef.current?.closest("[data-timeline-area]");
    if (!timeline) return;

    const timelineRect = timeline.getBoundingClientRect();

    // Calculate new position
    const newX = event.clientX - timelineRect.left - dragOffset.x;
    const newY = event.clientY - timelineRect.top - dragOffset.y;

    // Convert to timeline units
    const newStartTime = Math.max(0, newX / pixelsPerSecond);
    const newTrackIndex = Math.max(0, Math.floor(newY / TRACK_HEIGHT));

    console.log(
      `[SimpleDrag] Moving to: ${newStartTime.toFixed(
        1
      )}s, track ${newTrackIndex}`
    );

    // Update immediately
    onUpdate({
      startTime: newStartTime,
      trackIndex: newTrackIndex,
    });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    console.log(`[SimpleDrag] Mouse up - stopping drag`);

    setIsDragging(false);

    // Remove listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // ============================================================================
  // UTILITY
  // ============================================================================

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

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={blockRef}
      style={{
        position: "absolute",
        left: `${blockLeft}px`,
        top: "4px",
        width: `${Math.max(blockWidth, 60)}px`,
        height: `${BLOCK_HEIGHT}px`,
        backgroundColor: track.color,
        border: isSelected ? "2px solid #fff" : "1px solid rgba(0,0,0,0.3)",
        borderRadius: "4px",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        overflow: "hidden",
        boxShadow: isSelected
          ? "0 0 8px rgba(255,255,255,0.5)"
          : "0 2px 4px rgba(0,0,0,0.3)",
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : isSelected ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) onSelect();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // TODO: Context menu
      }}
    >
      {/* Header */}
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

      {/* Waveform */}
      <div
        style={{
          padding: "4px 8px",
          height: "20px",
          display: "flex",
          alignItems: "end",
          gap: "1px",
        }}
      >
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

      {/* Duration */}
      <div
        style={{
          position: "absolute",
          bottom: "4px",
          left: "8px",
          fontSize: "10px",
          color: "rgba(255,255,255,0.8)",
          fontFamily: "monospace",
        }}
      >
        {formatDuration(track.duration)}
      </div>
    </div>
  );
}
