// ============================================================================
// RECORDING DATA STRUCTURES & UTILITIES
// ============================================================================

// These @typedef comments are JSDoc - they help IDEs understand data types
// Think of them as blueprints that describe what our data looks like

/**
 * RecordedNote: Represents a single note that was played during recording
 * This captures EVERYTHING about one keypress:
 *
 * @typedef {Object} RecordedNote
 * @property {string} instrument - Which instrument was selected ("piano", "drums", etc.)
 * @property {string} note - The actual musical note ("C4" for middle C, "D1" for kick drum)
 * @property {string} row - Which keyboard row was used ("top", "mid", "bot" for Q-P, A-L, Z-M)
 * @property {number} i - Position within that row (0 = leftmost key, increases rightward)
 * @property {number} len - Total number of keys in that row (used for audio effects)
 * @property {number} timestamp - WHEN this note was played (milliseconds since recording started)
 * @property {string} duration - How long the note should ring ("8n" = eighth note, "4n" = quarter note)
 * @property {number} velocity - How "hard" the note was hit (0.0 = silent, 1.0 = maximum volume)
 */

/**
 * Recording: Represents a complete musical performance
 * This is like a "song" that contains multiple notes with timing
 *
 * @typedef {Object} Recording
 * @property {string} id - Unique identifier (like a barcode for this recording)
 * @property {string} name - Human-readable name (currently unused, could be "My Piano Song")
 * @property {string} instrument - What instrument was used for this recording
 * @property {RecordedNote[]} notes - Array of all notes played (the actual musical data)
 * @property {number} duration - How long the entire recording lasts (milliseconds)
 */

// ============================================================================
// RECORDING FACTORY FUNCTION
// ============================================================================

/*
 * Creates a brand new, empty recording ready to capture notes
 *
 * WHY WE NEED THIS:
 * - Every recording needs a unique ID so we can tell them apart
 * - We start with empty data that gets filled as user types
 * - crypto.randomUUID() creates a unique string like "a1b2c3d4-e5f6-..."
 *
 * WHEN THIS IS CALLED:
 * - When user clicks the record button
 * - After a recording is finished (to prepare for the next one)
 *
 * @returns {Recording} A fresh, empty recording object
 */
export function createEmptyRecording() {
  // Generate a unique ID for this recording
  const newId = crypto.randomUUID();
  console.log("[TypeJam][recording] Creating empty recording with ID:", newId);

  // Return a new recording object with default/empty values
  return {
    id: newId, // Unique identifier - never changes
    name: "", // No name yet (could be added by user later)
    instrument: null, // Will be set to whatever instrument is selected when recording starts
    notes: [], // Empty array - notes will be added as user types
    duration: 0, // No duration yet - calculated when recording stops
  };
}
