// ============================================================================
// JAM SESSION DATA STRUCTURES - Multi-track composition system
// ============================================================================

/**
 * JamTrack: Represents a single recording placed on the jam board timeline
 *
 * WHAT THIS REPRESENTS:
 * - A recording from your library, placed at a specific time on a specific track
 * - Like a "clip" in video editing software
 * - Contains positioning, timing, and audio properties
 *
 * @typedef {Object} JamTrack
 * @property {string} id - Unique identifier for this track instance
 * @property {string} recordingId - ID of the original recording from recordings library
 * @property {number} startTime - When to start playing (seconds from jam session start)
 * @property {number} trackIndex - Which vertical track lane (0 = top, 1 = second, etc.)
 * @property {number} volume - Track volume multiplier (0.0 = silent, 1.0 = original volume)
 * @property {boolean} muted - Is this track muted? (overrides volume)
 * @property {boolean} solo - Is this track soloed? (mutes all other tracks)
 * @property {string} color - Visual color for this track block (based on instrument)
 * @property {number} duration - How long this track plays (copied from original recording)
 */

/**
 * JamSession: Represents a complete multi-track composition
 *
 * WHAT THIS REPRESENTS:
 * - The entire "song" made up of multiple recordings arranged on a timeline
 * - Like a "project file" in music production software
 * - Contains all tracks, timing info, and session metadata
 *
 * @typedef {Object} JamSession
 * @property {string} id - Unique identifier for this jam session
 * @property {string} name - User-friendly name for this composition
 * @property {JamTrack[]} tracks - Array of all tracks in this session
 * @property {number} duration - Total length of the composition (auto-calculated)
 * @property {number} bpm - Beats per minute (for future grid snapping)
 * @property {number} created - Timestamp when session was created
 * @property {number} modified - Timestamp when session was last modified
 */

// ============================================================================
// JAM TRACK FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a new JamTrack from a recording
 *
 * WHEN TO USE:
 * - When user drags a recording onto the timeline
 * - When duplicating an existing track
 * - When loading a saved jam session
 *
 * @param {import('./recording').Recording} recording - The original recording
 * @param {number} startTime - When this track should start (seconds)
 * @param {number} trackIndex - Which track lane to place it on
 * @returns {JamTrack} A new jam track ready to be added to the timeline
 */
export function createJamTrack(recording, startTime = 0, trackIndex = 0) {
  // Generate unique ID for this track instance
  const trackId = crypto.randomUUID();

  // Determine color based on instrument type
  const instrumentColors = {
    piano: "#4A90E2", // Blue
    guitar: "#F5A623", // Orange
    bass: "#7ED321", // Green
    violin: "#9013FE", // Purple
    drums: "#D0021B", // Red
  };

  const color = instrumentColors[recording.instrument] || "#50E3C2"; // Default teal

  console.log(
    `[TypeJam][jamSession] Creating jam track for recording ${recording.id} at ${startTime}s on track ${trackIndex}`
  );

  return {
    id: trackId,
    recordingId: recording.id,
    startTime: startTime,
    trackIndex: trackIndex,
    volume: 1.0, // Full volume by default
    muted: false, // Not muted
    solo: false, // Not soloed
    color: color, // Visual color
    duration: recording.duration / 1000, // Convert ms to seconds for timeline
  };
}

/**
 * Creates a new empty jam session
 *
 * WHEN TO USE:
 * - When user starts a new composition
 * - When initializing the jam board for the first time
 *
 * @param {string} name - Optional name for the session
 * @returns {JamSession} A fresh, empty jam session
 */
export function createEmptyJamSession(name = "") {
  const sessionId = crypto.randomUUID();
  const now = Date.now();

  console.log(
    `[TypeJam][jamSession] Creating new jam session: ${name || "Untitled"}`
  );

  return {
    id: sessionId,
    name: name || `Jam Session ${new Date().toLocaleDateString()}`,
    tracks: [], // No tracks yet
    duration: 0, // No duration yet
    bpm: 120, // Standard tempo
    created: now,
    modified: now,
  };
}

// ============================================================================
// JAM SESSION UTILITIES
// ============================================================================

/**
 * Calculate the total duration of a jam session
 *
 * HOW IT WORKS:
 * - Looks at each track's startTime + duration
 * - Finds the track that ends latest
 * - That becomes the total session duration
 *
 * @param {JamSession} jamSession - The session to analyze
 * @returns {number} Total duration in seconds
 */
export function calculateJamDuration(jamSession) {
  if (jamSession.tracks.length === 0) {
    return 0; // Empty session has no duration
  }

  // Find the latest end time among all tracks
  let latestEndTime = 0;

  jamSession.tracks.forEach((track) => {
    const trackEndTime = track.startTime + track.duration;
    if (trackEndTime > latestEndTime) {
      latestEndTime = trackEndTime;
    }
  });

  console.log(
    `[TypeJam][jamSession] Calculated jam duration: ${latestEndTime}s for ${jamSession.tracks.length} tracks`
  );
  return latestEndTime;
}

/**
 * Update a jam session's duration and modified timestamp
 *
 * WHEN TO CALL:
 * - After adding/removing/moving tracks
 * - Before saving the session
 *
 * @param {JamSession} jamSession - Session to update
 * @returns {JamSession} Updated session with new duration and timestamp
 */
export function updateJamSession(jamSession) {
  const updatedSession = {
    ...jamSession,
    duration: calculateJamDuration(jamSession),
    modified: Date.now(),
  };

  console.log(
    `[TypeJam][jamSession] Updated jam session ${jamSession.id}: duration=${updatedSession.duration}s`
  );
  return updatedSession;
}

/**
 * Find available track index for placing a new track
 *
 * LOGIC:
 * - Checks if there's space at the requested trackIndex and startTime
 * - If occupied, suggests the next available track index
 * - Prevents overlapping tracks on the same lane
 *
 * @param {JamSession} jamSession - Current session
 * @param {number} preferredTrackIndex - Desired track index
 * @param {number} startTime - When the new track will start
 * @param {number} duration - How long the new track will last
 * @returns {number} Available track index (might be different from preferred)
 */
export function findAvailableTrackIndex(
  jamSession,
  preferredTrackIndex,
  startTime,
  duration
) {
  const endTime = startTime + duration;

  // Check each track index starting from preferred
  for (let trackIndex = preferredTrackIndex; trackIndex < 10; trackIndex++) {
    // Find all tracks on this track index
    const tracksOnThisIndex = jamSession.tracks.filter(
      (track) => track.trackIndex === trackIndex
    );

    // Check if any existing track overlaps with our time range
    const hasOverlap = tracksOnThisIndex.some((track) => {
      const trackEndTime = track.startTime + track.duration;
      // Overlap if: (start1 < end2) AND (start2 < end1)
      return startTime < trackEndTime && track.startTime < endTime;
    });

    if (!hasOverlap) {
      console.log(
        `[TypeJam][jamSession] Found available track index: ${trackIndex}`
      );
      return trackIndex; // This track index is free
    }
  }

  // If we get here, return a high number (new track at bottom)
  console.log(
    `[TypeJam][jamSession] No available track found, using new track: ${jamSession.tracks.length}`
  );
  return jamSession.tracks.length;
}

// ============================================================================
// TRACK MANIPULATION UTILITIES
// ============================================================================

/**
 * Add a track to a jam session
 *
 * @param {JamSession} jamSession - Session to add to
 * @param {JamTrack} jamTrack - Track to add
 * @returns {JamSession} Updated session with new track
 */
export function addTrackToSession(jamSession, jamTrack) {
  const updatedTracks = [...jamSession.tracks, jamTrack];
  const updatedSession = {
    ...jamSession,
    tracks: updatedTracks,
  };

  console.log(
    `[TypeJam][jamSession] Added track ${jamTrack.id} to session ${jamSession.id}`
  );
  return updateJamSession(updatedSession);
}

/**
 * Remove a track from a jam session
 *
 * @param {JamSession} jamSession - Session to remove from
 * @param {string} trackId - ID of track to remove
 * @returns {JamSession} Updated session without the track
 */
export function removeTrackFromSession(jamSession, trackId) {
  const updatedTracks = jamSession.tracks.filter(
    (track) => track.id !== trackId
  );
  const updatedSession = {
    ...jamSession,
    tracks: updatedTracks,
  };

  console.log(
    `[TypeJam][jamSession] Removed track ${trackId} from session ${jamSession.id}`
  );
  return updateJamSession(updatedSession);
}
