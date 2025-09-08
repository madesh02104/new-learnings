"use client";

// ============================================================================
// JAM BOARD - Multi-track timeline editor for arranging recordings
// ============================================================================

import { useState, useRef, useEffect } from "react";
import {
  createEmptyJamSession,
  updateJamSession,
  createJamTrack,
  addTrackToSession,
  removeTrackFromSession,
} from "../lib/jamSession";
import { createJamPlaybackEngine } from "../lib/jamPlayback";
import TimelineRuler from "./TimelineRuler";
import TrackArea from "./TrackArea";
import TransportControls from "./TransportControls";
import RecordingsLibrary from "./RecordingsLibrary";

/**
 * JamBoard: The main multi-track composition interface
 *
 * LAYOUT STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Transport Controls: Play/Stop/Record]                      │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [Timeline Ruler: 0s  5s  10s  15s  20s  25s  30s]          │
 * ├─────────────────────────────────────────────────────────────┤
 * │ Track 1: [Recording Block]    [Recording Block]             │
 * │ Track 2:      [Recording Block]         [Recording Block]   │
 * │ Track 3: [Recording Block]                                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [Recordings Library - Sidebar with available recordings]    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @param {Object} props
 * @param {import('../lib/recording').Recording[]} props.recordings - Available recordings library
 */
export default function JamBoard({ recordings }) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Current jam session being edited
  const [jamSession, setJamSession] = useState(() => createEmptyJamSession());

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Playhead position in seconds

  // UI state
  const [selectedTrackId, setSelectedTrackId] = useState(null); // Which track is selected
  const [timelineWidth, setTimelineWidth] = useState(800); // Timeline width in pixels
  const [pixelsPerSecond, setPixelsPerSecond] = useState(40); // Zoom level

  // Refs for DOM manipulation and playback
  const timelineRef = useRef(null);
  const playheadRef = useRef(null);
  const playbackEngineRef = useRef(null);

  // ============================================================================
  // TIMELINE CALCULATIONS
  // ============================================================================

  /**
   * Convert time (seconds) to pixel position on timeline
   * @param {number} timeInSeconds - Time to convert
   * @returns {number} Pixel position from left edge
   */
  const timeToPixels = (timeInSeconds) => {
    return timeInSeconds * pixelsPerSecond;
  };

  /**
   * Convert pixel position to time (seconds)
   * @param {number} pixelPosition - Pixel position from left edge
   * @returns {number} Time in seconds
   */
  const pixelsToTime = (pixelPosition) => {
    return pixelPosition / pixelsPerSecond;
  };

  /**
   * Get the total timeline width needed to display the entire jam session
   * @returns {number} Required width in pixels
   */
  const getRequiredTimelineWidth = () => {
    const minWidth = 800; // Minimum timeline width
    const sessionWidth = timeToPixels(jamSession.duration) + 100; // Add padding
    return Math.max(minWidth, sessionWidth);
  };

  // ============================================================================
  // JAM SESSION MANAGEMENT
  // ============================================================================

  /**
   * Add a recording to the jam session at specified time and track
   * Called when user drags a recording onto the timeline
   */
  const handleAddRecording = (recording, startTime, trackIndex) => {
    console.log(
      `[TypeJam][JamBoard] Adding recording ${recording.id} at ${startTime}s on track ${trackIndex}`
    );

    // Create a new jam track from the recording
    const jamTrack = createJamTrack(recording, startTime, trackIndex);

    // Add to current session
    const updatedSession = addTrackToSession(jamSession, jamTrack);
    setJamSession(updatedSession);

    // Update timeline width if needed
    const requiredWidth = getRequiredTimelineWidth();
    if (requiredWidth > timelineWidth) {
      setTimelineWidth(requiredWidth);
    }
  };

  /**
   * Remove a track from the jam session
   */
  const handleRemoveTrack = (trackId) => {
    console.log(`[TypeJam][JamBoard] Removing track ${trackId}`);

    const updatedSession = removeTrackFromSession(jamSession, trackId);
    setJamSession(updatedSession);

    // Clear selection if removed track was selected
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
  };

  /**
   * Update a track's properties (position, volume, etc.)
   */
  const handleUpdateTrack = (trackId, updates) => {
    console.log(`[TypeJam][JamBoard] Updating track ${trackId}`, updates);

    const updatedTracks = jamSession.tracks.map((track) =>
      track.id === trackId ? { ...track, ...updates } : track
    );

    const updatedSession = updateJamSession({
      ...jamSession,
      tracks: updatedTracks,
    });

    setJamSession(updatedSession);

    // Update playback engine if it exists
    if (playbackEngineRef.current) {
      playbackEngineRef.current.updateTrack(trackId, updates);
    }
  };

  // ============================================================================
  // PLAYBACK ENGINE MANAGEMENT
  // ============================================================================

  /**
   * Initialize or reinitialize the playback engine
   */
  const initializePlaybackEngine = async () => {
    console.log(`[TypeJam][JamBoard] Initializing playback engine`);

    // Dispose existing engine
    if (playbackEngineRef.current) {
      playbackEngineRef.current.dispose();
    }

    // Create new engine
    const engine = createJamPlaybackEngine();

    // Set up event callbacks
    engine.onTimeUpdate = (time) => {
      setCurrentTime(time);
    };

    engine.onPlaybackEnd = () => {
      console.log(`[TypeJam][JamBoard] Playback ended`);
      setIsPlaying(false);
      setCurrentTime(0);
    };

    engine.onError = (error) => {
      console.error(`[TypeJam][JamBoard] Playback error:`, error);
      setIsPlaying(false);
      // Could show user-facing error message here
    };

    // Initialize with current jam session
    try {
      const success = await engine.init(jamSession);
      if (success) {
        playbackEngineRef.current = engine;
        console.log(`[TypeJam][JamBoard] Playback engine ready`);
      } else {
        console.error(
          `[TypeJam][JamBoard] Failed to initialize playback engine`
        );
      }
    } catch (error) {
      console.error(
        `[TypeJam][JamBoard] Error initializing playback engine:`,
        error
      );
    }
  };

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  /**
   * Start playing the jam session
   */
  const handlePlay = async () => {
    console.log(
      `[TypeJam][JamBoard] Starting playback of jam session ${jamSession.id}`
    );

    if (!playbackEngineRef.current) {
      await initializePlaybackEngine();
    }

    if (playbackEngineRef.current) {
      try {
        await playbackEngineRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error(`[TypeJam][JamBoard] Failed to start playback:`, error);
      }
    }
  };

  /**
   * Stop playing the jam session
   */
  const handleStop = () => {
    console.log(`[TypeJam][JamBoard] Stopping playback`);

    if (playbackEngineRef.current) {
      playbackEngineRef.current.stop();
    }

    setIsPlaying(false);
    setCurrentTime(0); // Reset playhead to beginning
  };

  /**
   * Pause playing the jam session
   */
  const handlePause = () => {
    console.log(`[TypeJam][JamBoard] Pausing playback`);

    if (playbackEngineRef.current) {
      playbackEngineRef.current.pause();
    }

    setIsPlaying(false);
    // Keep currentTime where it is (don't reset to 0)
  };

  // ============================================================================
  // UI EVENT HANDLERS
  // ============================================================================

  /**
   * Handle clicking on the timeline to move playhead
   */
  const handleTimelineClick = (event) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickTime = pixelsToTime(clickX);
    const clampedTime = Math.max(0, Math.min(clickTime, jamSession.duration));

    console.log(`[TypeJam][JamBoard] Timeline clicked at ${clampedTime}s`);

    // Seek playback engine if it exists
    if (playbackEngineRef.current) {
      playbackEngineRef.current.seek(clampedTime);
    } else {
      setCurrentTime(clampedTime);
    }
  };

  /**
   * Handle zoom in/out
   */
  const handleZoom = (direction) => {
    const zoomFactor = 1.2;
    const newPixelsPerSecond =
      direction === "in"
        ? pixelsPerSecond * zoomFactor
        : pixelsPerSecond / zoomFactor;

    // Limit zoom range
    const minZoom = 10; // 10 pixels per second (zoomed out)
    const maxZoom = 200; // 200 pixels per second (zoomed in)

    setPixelsPerSecond(
      Math.max(minZoom, Math.min(maxZoom, newPixelsPerSecond))
    );
    console.log(
      `[TypeJam][JamBoard] Zoom ${direction}: ${newPixelsPerSecond} pixels/second`
    );
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Update timeline width when jam session changes
  useEffect(() => {
    const requiredWidth = getRequiredTimelineWidth();
    setTimelineWidth(requiredWidth);
  }, [jamSession.duration, pixelsPerSecond]);

  // Reinitialize playback engine when jam session changes significantly
  useEffect(() => {
    if (jamSession.tracks.length > 0) {
      // Reinitialize playback engine when tracks are added/removed
      initializePlaybackEngine();
    }
  }, [jamSession.tracks.length]);

  // Cleanup playback engine on unmount
  useEffect(() => {
    return () => {
      if (playbackEngineRef.current) {
        console.log(
          "[TypeJam][JamBoard] Cleaning up playback engine on unmount"
        );
        playbackEngineRef.current.dispose();
      }
    };
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
      }}
    >
      {/* ===== HEADER: Transport Controls ===== */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #333",
          backgroundColor: "#2a2a2a",
        }}
      >
        <TransportControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={jamSession.duration}
          onPlay={handlePlay}
          onStop={handleStop}
          onPause={handlePause}
          onZoomIn={() => handleZoom("in")}
          onZoomOut={() => handleZoom("out")}
        />
      </div>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* ===== LEFT SIDEBAR: Recordings Library ===== */}
        <div
          style={{
            width: "300px",
            backgroundColor: "#2a2a2a",
            borderRight: "1px solid #333",
            overflow: "auto",
          }}
        >
          <RecordingsLibrary
            recordings={recordings}
            onDragStart={(recording) => {
              console.log(
                `[TypeJam][JamBoard] Started dragging recording ${recording.id}`
              );
              // TODO: Implement drag start logic
            }}
          />
        </div>

        {/* ===== RIGHT AREA: Timeline ===== */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          {/* Timeline Ruler */}
          <div
            style={{
              height: "40px",
              backgroundColor: "#333",
              borderBottom: "1px solid #444",
            }}
          >
            <TimelineRuler
              duration={Math.max(jamSession.duration, 30)} // Show at least 30 seconds
              pixelsPerSecond={pixelsPerSecond}
              currentTime={currentTime}
            />
          </div>

          {/* Track Area */}
          <div
            ref={timelineRef}
            style={{
              flex: 1,
              position: "relative",
              cursor: "pointer",
              overflow: "auto",
            }}
            onClick={handleTimelineClick}
          >
            <TrackArea
              jamSession={jamSession}
              pixelsPerSecond={pixelsPerSecond}
              selectedTrackId={selectedTrackId}
              onSelectTrack={setSelectedTrackId}
              onUpdateTrack={handleUpdateTrack}
              onRemoveTrack={handleRemoveTrack}
              onAddRecording={handleAddRecording}
            />

            {/* Playhead */}
            <div
              ref={playheadRef}
              style={{
                position: "absolute",
                left: `${timeToPixels(currentTime)}px`,
                top: 0,
                bottom: 0,
                width: "2px",
                backgroundColor: "#ff4444",
                pointerEvents: "none",
                zIndex: 1000,
                boxShadow: "0 0 4px rgba(255, 68, 68, 0.5)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== DEBUG INFO (temporary) ===== */}
      <div
        style={{
          padding: "8px",
          fontSize: "12px",
          backgroundColor: "#333",
          borderTop: "1px solid #444",
          color: "#888",
        }}
      >
        Session: {jamSession.name} | Tracks: {jamSession.tracks.length} |
        Duration: {jamSession.duration.toFixed(1)}s | Zoom:{" "}
        {pixelsPerSecond.toFixed(0)}px/s | Playhead: {currentTime.toFixed(1)}s
      </div>
    </div>
  );
}
