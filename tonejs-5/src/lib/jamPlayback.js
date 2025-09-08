// ============================================================================
// JAM PLAYBACK ENGINE - Multi-track synchronized playback system
// ============================================================================

import * as Tone from "tone";
import { INSTRUMENTS } from "./instruments";
import { loadRecordings } from "./storage";

/**
 * JamPlaybackEngine: Manages synchronized playback of multiple tracks
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    Tone.Transport (Master Clock)               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Track 1: Piano   → Tone.Part → Piano Instrument → Output       │
 * │ Track 2: Guitar  → Tone.Part → Guitar Instrument → Output      │
 * │ Track 3: Drums   → Tone.Part → Drum Instrument → Output        │
 * │ Track 4: Bass    → Tone.Part → Bass Instrument → Output        │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * FEATURES:
 * - Synchronized multi-track playback using Tone.Transport
 * - Individual instrument instances per track
 * - Dynamic loading of recordings from localStorage
 * - Real-time playhead position tracking
 * - Volume, mute, solo controls per track
 * - Automatic cleanup of resources
 *
 * @class JamPlaybackEngine
 */
export class JamPlaybackEngine {
  constructor() {
    // Playback state
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.duration = 0;
    this.jamSession = null;

    // Audio resources
    this.instruments = new Map(); // instrument name -> instrument instance
    this.parts = new Map(); // track id -> Tone.Part instance
    this.recordings = new Map(); // recording id -> recording data

    // Event callbacks
    this.onTimeUpdate = null; // Called with current time during playback
    this.onPlaybackEnd = null; // Called when playback finishes
    this.onError = null; // Called when errors occur

    // Transport event listeners
    this.transportStartListener = null;
    this.transportStopListener = null;

    console.log("[TypeJam][JamPlayback] Playback engine initialized");
  }

  // ============================================================================
  // INITIALIZATION & CLEANUP
  // ============================================================================

  /**
   * Initialize the playback engine with a jam session
   * @param {import('./jamSession').JamSession} jamSession - Session to play
   */
  async init(jamSession) {
    console.log(
      `[TypeJam][JamPlayback] Initializing with jam session ${jamSession.id}`
    );

    try {
      // Store session reference
      this.jamSession = jamSession;
      this.duration = jamSession.duration;

      // Load all recordings from localStorage
      await this.loadAllRecordings();

      // Create instrument instances for each unique instrument type
      await this.createInstruments();

      // Create Tone.Parts for each track
      await this.createParts();

      // Setup Transport event listeners
      this.setupTransportListeners();

      console.log(
        `[TypeJam][JamPlayback] Successfully initialized with ${jamSession.tracks.length} tracks`
      );
      return true;
    } catch (error) {
      console.error("[TypeJam][JamPlayback] Failed to initialize:", error);
      if (this.onError) this.onError(error);
      return false;
    }
  }

  /**
   * Load all recordings referenced by the jam session
   */
  async loadAllRecordings() {
    console.log("[TypeJam][JamPlayback] Loading recordings from localStorage");

    const allRecordings = loadRecordings();
    this.recordings.clear();

    // Index recordings by ID for fast lookup
    allRecordings.forEach((recording) => {
      this.recordings.set(recording.id, recording);
    });

    // Verify all tracks have valid recordings
    const missingRecordings = [];
    this.jamSession.tracks.forEach((track) => {
      if (!this.recordings.has(track.recordingId)) {
        missingRecordings.push(track.recordingId);
      }
    });

    if (missingRecordings.length > 0) {
      throw new Error(`Missing recordings: ${missingRecordings.join(", ")}`);
    }

    console.log(
      `[TypeJam][JamPlayback] Loaded ${this.recordings.size} recordings`
    );
  }

  /**
   * Create instrument instances for each unique instrument type
   */
  async createInstruments() {
    console.log("[TypeJam][JamPlayback] Creating instrument instances");

    const instrumentTypes = new Set();

    // Collect all unique instrument types from tracks
    this.jamSession.tracks.forEach((track) => {
      const recording = this.recordings.get(track.recordingId);
      if (recording) {
        instrumentTypes.add(recording.instrument);
      }
    });

    // Create instrument instances
    const instrumentPromises = Array.from(instrumentTypes).map(
      async (instrumentType) => {
        console.log(
          `[TypeJam][JamPlayback] Creating ${instrumentType} instrument`
        );

        if (!INSTRUMENTS[instrumentType]) {
          throw new Error(`Unknown instrument type: ${instrumentType}`);
        }

        const instrument = INSTRUMENTS[instrumentType]();
        await instrument.ensureReady();
        this.instruments.set(instrumentType, instrument);

        console.log(
          `[TypeJam][JamPlayback] ${instrumentType} instrument ready`
        );
      }
    );

    await Promise.all(instrumentPromises);
    console.log(
      `[TypeJam][JamPlayback] Created ${this.instruments.size} instruments`
    );
  }

  /**
   * Create Tone.Parts for each track in the jam session
   */
  async createParts() {
    console.log("[TypeJam][JamPlayback] Creating Tone.Parts for each track");

    this.parts.clear();

    this.jamSession.tracks.forEach((track) => {
      const recording = this.recordings.get(track.recordingId);
      if (!recording) {
        console.warn(
          `[TypeJam][JamPlayback] Skipping track ${track.id}: recording not found`
        );
        return;
      }

      const instrument = this.instruments.get(recording.instrument);
      if (!instrument) {
        console.warn(
          `[TypeJam][JamPlayback] Skipping track ${track.id}: instrument not found`
        );
        return;
      }

      // Convert recording notes to Tone.Part events with safe time values
      const events = recording.notes.map((note) => {
        const absoluteTime = Math.max(
          0,
          (track.startTime || 0) + (note.timestamp || 0) / 1000
        );
        return {
          time: absoluteTime, // Ensure positive time values
          note: note.note,
          duration: note.duration,
          velocity: Math.max(
            0,
            Math.min(1, (note.velocity || 0.5) * (track.volume || 1))
          ), // Clamp velocity
          row: note.row,
          i: note.i,
          len: note.len,
        };
      });

      // Create Tone.Part for this track
      const part = new Tone.Part((time, event) => {
        // Skip if track is muted
        if (track.muted) return;

        // Skip if other tracks are soloed and this isn't one of them
        const soloTracks = this.jamSession.tracks.filter((t) => t.solo);
        if (soloTracks.length > 0 && !track.solo) return;

        // Play the note
        instrument.play(
          event.note,
          event.duration,
          time,
          event.velocity,
          event.row,
          event.i,
          event.len
        );
      }, events);

      part.loop = false; // Don't loop individual tracks
      this.parts.set(track.id, part);

      console.log(
        `[TypeJam][JamPlayback] Created part for track ${track.id} with ${events.length} events`
      );
    });

    console.log(`[TypeJam][JamPlayback] Created ${this.parts.size} Tone.Parts`);
  }

  /**
   * Setup Transport event listeners for playback state management
   */
  setupTransportListeners() {
    // Clean up existing listeners
    this.cleanupTransportListeners();

    // Transport start listener
    this.transportStartListener = () => {
      console.log("[TypeJam][JamPlayback] Transport started");
      this.isPlaying = true;
      this.isPaused = false;
      this.startTimeTracking();
    };

    // Transport stop listener
    this.transportStopListener = () => {
      console.log("[TypeJam][JamPlayback] Transport stopped");
      this.isPlaying = false;
      this.isPaused = false;
      this.stopTimeTracking();
    };

    // Attach listeners
    Tone.Transport.on("start", this.transportStartListener);
    Tone.Transport.on("stop", this.transportStopListener);
  }

  /**
   * Clean up Transport event listeners
   */
  cleanupTransportListeners() {
    if (this.transportStartListener) {
      Tone.Transport.off("start", this.transportStartListener);
      this.transportStartListener = null;
    }
    if (this.transportStopListener) {
      Tone.Transport.off("stop", this.transportStopListener);
      this.transportStopListener = null;
    }
  }

  /**
   * Dispose of all resources and clean up
   */
  dispose() {
    console.log("[TypeJam][JamPlayback] Disposing playback engine");

    // Stop playback
    this.stop();

    // Clean up Transport listeners
    this.cleanupTransportListeners();

    // Dispose all Tone.Parts
    this.parts.forEach((part, trackId) => {
      part.dispose();
      console.log(`[TypeJam][JamPlayback] Disposed part for track ${trackId}`);
    });
    this.parts.clear();

    // Dispose all instruments
    this.instruments.forEach((instrument, type) => {
      instrument.dispose();
      console.log(`[TypeJam][JamPlayback] Disposed ${type} instrument`);
    });
    this.instruments.clear();

    // Clear references
    this.recordings.clear();
    this.jamSession = null;
    this.currentTime = 0;
    this.duration = 0;

    console.log("[TypeJam][JamPlayback] Playback engine disposed");
  }

  // ============================================================================
  // PLAYBACK CONTROLS
  // ============================================================================

  /**
   * Start or resume playback
   */
  async play() {
    if (!this.jamSession) {
      throw new Error("No jam session loaded");
    }

    console.log("[TypeJam][JamPlayback] Starting playback");

    try {
      // Ensure audio context is started
      if (Tone.context.state !== "running") {
        await Tone.start();
        console.log("[TypeJam][JamPlayback] Audio context started");
      }

      // If resuming from pause, just start Transport
      if (this.isPaused) {
        Tone.Transport.start();
        return;
      }

      // Fresh start: reset position and start all parts
      Tone.Transport.position = 0;
      this.currentTime = 0;

      // Start all parts
      this.parts.forEach((part) => {
        part.start(0);
      });

      // Schedule automatic stop at end of session
      if (this.duration > 0) {
        Tone.Transport.scheduleOnce(() => {
          this.stop();
          if (this.onPlaybackEnd) {
            this.onPlaybackEnd();
          }
        }, `+${this.duration}`);
      }

      // Start the Transport
      Tone.Transport.start();

      console.log(
        `[TypeJam][JamPlayback] Playback started, duration: ${this.duration}s`
      );
    } catch (error) {
      console.error("[TypeJam][JamPlayback] Failed to start playback:", error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  /**
   * Pause playback (can be resumed)
   */
  pause() {
    if (!this.isPlaying) return;

    console.log("[TypeJam][JamPlayback] Pausing playback");
    Tone.Transport.pause();
    this.isPaused = true;
    this.isPlaying = false;
    this.stopTimeTracking();
  }

  /**
   * Stop playback and reset to beginning
   */
  stop() {
    console.log("[TypeJam][JamPlayback] Stopping playback");

    // Stop and reset Transport
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Cancel all scheduled events
    Tone.Transport.position = 0;

    // Stop all parts with safe time handling
    this.parts.forEach((part) => {
      try {
        // Use current transport time or 0, whichever is greater
        const stopTime = Math.max(0, Tone.Transport.seconds);
        part.stop(stopTime);
      } catch (error) {
        console.warn("[TypeJam][JamPlayback] Error stopping part:", error);
        // Try stopping without time parameter as fallback
        try {
          part.stop();
        } catch (fallbackError) {
          console.warn(
            "[TypeJam][JamPlayback] Fallback stop also failed:",
            fallbackError
          );
        }
      }
    });

    // Reset state
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.stopTimeTracking();
  }

  /**
   * Seek to specific time position
   * @param {number} timeInSeconds - Position to seek to
   */
  seek(timeInSeconds) {
    // Ensure we have a valid number and clamp it to valid range
    const validTime = isNaN(timeInSeconds) ? 0 : timeInSeconds;
    const clampedTime = Math.max(0, Math.min(validTime, this.duration || 0));

    console.log(`[TypeJam][JamPlayback] Seeking to ${clampedTime}s`);

    const wasPlaying = this.isPlaying;

    // Stop current playback
    this.stop();

    // Set new position with safe values
    this.currentTime = clampedTime;

    // Ensure Transport position is never negative
    try {
      Tone.Transport.position = Math.max(0, clampedTime);
    } catch (error) {
      console.warn(
        "[TypeJam][JamPlayback] Error setting Transport position:",
        error
      );
      Tone.Transport.position = 0;
    }

    // Restart if was playing
    if (wasPlaying) {
      this.play();
    }
  }

  // ============================================================================
  // TIME TRACKING
  // ============================================================================

  /**
   * Start real-time tracking of playback position
   */
  startTimeTracking() {
    this.stopTimeTracking(); // Ensure no duplicate intervals

    this.timeTrackingInterval = setInterval(() => {
      // Get current transport position in seconds with safety checks
      const transportSeconds = Math.max(0, Tone.Transport.seconds || 0);
      this.currentTime = Math.max(
        0,
        Math.min(transportSeconds, this.duration || 0)
      );

      // Notify listeners
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.currentTime);
      }

      // Auto-stop at end (backup mechanism)
      if (this.currentTime >= this.duration && this.duration > 0) {
        this.stop();
        if (this.onPlaybackEnd) {
          this.onPlaybackEnd();
        }
      }
    }, 50); // Update every 50ms for smooth playhead movement
  }

  /**
   * Stop time tracking
   */
  stopTimeTracking() {
    if (this.timeTrackingInterval) {
      clearInterval(this.timeTrackingInterval);
      this.timeTrackingInterval = null;
    }
  }

  // ============================================================================
  // TRACK CONTROL
  // ============================================================================

  /**
   * Update track properties and recreate affected parts
   * @param {string} trackId - ID of track to update
   * @param {Object} updates - Properties to update
   */
  async updateTrack(trackId, updates) {
    if (!this.jamSession) return;

    console.log(`[TypeJam][JamPlayback] Updating track ${trackId}`, updates);

    // Find and update the track in jam session
    const trackIndex = this.jamSession.tracks.findIndex(
      (t) => t.id === trackId
    );
    if (trackIndex === -1) {
      console.warn(`[TypeJam][JamPlayback] Track ${trackId} not found`);
      return;
    }

    // Update track properties
    Object.assign(this.jamSession.tracks[trackIndex], updates);

    // If the track timing changed, recreate its part
    if (updates.startTime !== undefined) {
      await this.recreateTrackPart(trackId);
    }
  }

  /**
   * Recreate a specific track's Tone.Part
   * @param {string} trackId - ID of track to recreate
   */
  async recreateTrackPart(trackId) {
    const track = this.jamSession.tracks.find((t) => t.id === trackId);
    if (!track) return;

    // Dispose old part
    const oldPart = this.parts.get(trackId);
    if (oldPart) {
      oldPart.dispose();
    }

    // Create new part (reuse createParts logic for single track)
    const recording = this.recordings.get(track.recordingId);
    const instrument = this.instruments.get(recording.instrument);

    if (recording && instrument) {
      const events = recording.notes.map((note) => {
        const absoluteTime = Math.max(
          0,
          (track.startTime || 0) + (note.timestamp || 0) / 1000
        );
        return {
          time: absoluteTime, // Ensure positive time values
          note: note.note,
          duration: note.duration,
          velocity: Math.max(
            0,
            Math.min(1, (note.velocity || 0.5) * (track.volume || 1))
          ), // Clamp velocity
          row: note.row,
          i: note.i,
          len: note.len,
        };
      });

      const part = new Tone.Part((time, event) => {
        if (track.muted) return;
        const soloTracks = this.jamSession.tracks.filter((t) => t.solo);
        if (soloTracks.length > 0 && !track.solo) return;

        instrument.play(
          event.note,
          event.duration,
          time,
          event.velocity,
          event.row,
          event.i,
          event.len
        );
      }, events);

      part.loop = false;
      this.parts.set(trackId, part);

      // If currently playing, start the new part
      if (this.isPlaying) {
        part.start(0);
      }
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Get current playback state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentTime: this.currentTime,
      duration: this.duration,
      hasSession: !!this.jamSession,
      trackCount: this.jamSession ? this.jamSession.tracks.length : 0,
      instrumentCount: this.instruments.size,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new JamPlaybackEngine instance
 * @returns {JamPlaybackEngine} New playback engine
 */
export function createJamPlaybackEngine() {
  return new JamPlaybackEngine();
}
