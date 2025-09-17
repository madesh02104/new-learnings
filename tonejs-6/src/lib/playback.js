// ============================================================================
// PLAYBACK ENGINE - Recreates recorded performances
// ============================================================================

import * as Tone from "tone";
import { INSTRUMENTS } from "./instruments";

/**
 * Creates a playback engine for a specific recording
 *
 * HOW THIS WORKS:
 * 1. Takes a Recording object (contains notes + timing)
 * 2. Creates the same instrument that was used during recording
 * 3. Schedules all the notes to play at their exact original times
 * 4. Provides play/stop controls
 *
 * WHY WE NEED A "FACTORY FUNCTION":
 * - Each recording needs its own separate playback engine
 * - Each engine manages its own instrument instance and timing
 * - Multiple recordings can have engines, but only one plays at a time
 *
 * @param {import('./recording').Recording} recording - The recording to play back
 * @returns {Object} Playback controls (play, stop, dispose functions)
 */
export function createPlaybackEngine(recording) {
  // ============================================================================
  // PRIVATE STATE VARIABLES
  // ============================================================================

  // These variables are "private" - only this playback engine can access them
  // Each recording gets its own separate copies of these variables

  let instrument = null; // The audio instrument (piano, drums, etc.)
  let isReady = false; // Has the instrument finished loading?
  let isPlaying = false; // Is playback currently happening?
  let currentPart = null; // Tone.js Part object that schedules the notes

  // ============================================================================
  // INITIALIZATION FUNCTION
  // ============================================================================

  /**
   * Initialize the playback engine
   *
   * WHAT "INIT" MEANS:
   * - Create the instrument that was used in the recording
   * - Wait for it to load all its audio samples
   * - Mark the engine as "ready" when done
   *
   * WHY ASYNC/AWAIT:
   * - Loading audio samples takes time (downloading from internet)
   * - We can't play until samples are loaded
   * - async/await lets us wait without freezing the UI
   */
  const init = async () => {
    // If already initialized, don't do it again
    if (isReady) return;

    console.log(
      `[TypeJam][playback] Initializing ${recording.instrument} for playback`
    );

    // Create the same instrument that was used during recording
    // INSTRUMENTS[recording.instrument] gets the factory function
    // Calling it with () creates a new instrument instance
    instrument = INSTRUMENTS[recording.instrument]();

    // Wait for the instrument to load all its samples
    // This might take a few seconds for large sample libraries
    await instrument.ensureReady();

    // Mark as ready - now we can play
    isReady = true;
    console.log(
      `[TypeJam][playback] ${recording.instrument} ready for playback`
    );
  };

  // ============================================================================
  // PLAY FUNCTION
  // ============================================================================

  /**
   * Start playing the recording
   *
   * THE PLAYBACK PROCESS:
   * 1. Make sure instrument is loaded
   * 2. Start the Web Audio API if needed
   * 3. Create a schedule of when each note should play
   * 4. Start the Tone.js transport (global clock)
   * 5. Schedule automatic stop when recording ends
   */
  const play = async () => {
    // Don't start if already playing
    if (isPlaying) return;

    // Make sure instrument is ready
    if (!isReady) await init();

    console.log(
      `[TypeJam][playback] Starting playback of recording ${recording.id}`
    );

    // Start Web Audio API (required after user interaction)
    if (Tone.context.state !== "running") {
      await Tone.start();
      console.log("[TypeJam][playback] Web Audio context started");
    }

    // Reset the global Tone.js clock to start fresh
    Tone.Transport.stop(); // Stop any previous playback
    Tone.Transport.position = 0; // Reset to beginning

    // ============================================================================
    // CREATE THE NOTE SCHEDULE
    // ============================================================================

    // Convert our recorded notes into a format Tone.js can understand
    // Each note becomes an "event" with a specific time
    const events = recording.notes.map((note) => {
      console.log(
        `[TypeJam][playback] Scheduling note: ${note.note} at ${note.timestamp}ms`
      );
      return {
        time: note.timestamp / 1000, // Convert milliseconds to seconds (Tone.js uses seconds)
        note: note.note, // What note to play ("C4", "D1", etc.)
        duration: note.duration, // How long ("8n", "4n", etc.)
        velocity: note.velocity, // How loud (0.0 to 1.0)
        row: note.row, // Which keyboard row ("top", "mid", "bot")
        i: note.i, // Position in row (for audio effects)
        len: note.len, // Row length (for audio effects)
      };
    });

    console.log(
      `[TypeJam][playback] Created ${events.length} scheduled events`
    );

    // ============================================================================
    // CREATE TONE.JS PART
    // ============================================================================

    // Tone.Part is like a "player piano roll" - it knows when to play each note
    // The callback function gets called for each scheduled event
    currentPart = new Tone.Part((time, event) => {
      console.log(`[TypeJam][playback] Playing ${event.note} at time ${time}`);

      // Call the instrument's play method with all the original parameters
      // This recreates the exact same sound as when it was recorded
      instrument.play(
        event.note, // What note
        event.duration, // How long
        time, // When (Tone.js handles precise timing)
        event.velocity, // How loud
        event.row, // Which row (affects audio processing)
        event.i, // Position in row (affects audio processing)
        event.len // Row length (affects audio processing)
      );
    }, events); // Pass our events array to the Part

    // Configure the Part
    currentPart.loop = false; // Play once, don't repeat
    currentPart.start(0); // Start from the beginning of the transport

    // ============================================================================
    // START PLAYBACK
    // ============================================================================

    // Start the global Tone.js clock - this makes everything play
    Tone.Transport.start();
    isPlaying = true;
    console.log("[TypeJam][playback] Transport started, playback in progress");

    // ============================================================================
    // SCHEDULE AUTOMATIC STOP
    // ============================================================================

    // Calculate when the recording should end
    const duration = recording.duration / 1000 + 0.1; // Convert to seconds, add small buffer
    console.log(`[TypeJam][playback] Will auto-stop after ${duration} seconds`);

    // Schedule the stop function to run after the recording ends
    Tone.Transport.scheduleOnce(() => {
      console.log("[TypeJam][playback] Auto-stopping playback");
      stop();
    }, `+${duration}`); // The + means "from now"
  };

  // ============================================================================
  // STOP FUNCTION
  // ============================================================================

  /**
   * Stop playback and clean up
   *
   * CLEANUP IS IMPORTANT:
   * - Prevents audio from continuing to play
   * - Frees up memory and resources
   * - Resets everything for the next playback
   */
  const stop = () => {
    if (!isPlaying) return;

    console.log(
      `[TypeJam][playback] Stopping playback of recording ${recording.id}`
    );

    // Clean up the Part
    if (currentPart) {
      currentPart.stop(); // Stop scheduling new events
      currentPart.dispose(); // Free memory
      currentPart = null; // Clear reference
    }

    // Reset the global transport
    Tone.Transport.stop(); // Stop the clock
    Tone.Transport.position = 0; // Reset to beginning
    Tone.Transport.cancel(); // Clear any scheduled events

    isPlaying = false;
    console.log("[TypeJam][playback] Playback stopped and cleaned up");
  };

  // ============================================================================
  // DISPOSE FUNCTION
  // ============================================================================

  /**
   * Completely destroy this playback engine
   *
   * WHEN TO CALL:
   * - When a recording is deleted
   * - When the component unmounts
   * - To free memory
   */
  const dispose = () => {
    console.log(
      `[TypeJam][playback] Disposing playback engine for recording ${recording.id}`
    );

    stop(); // Make sure playback is stopped

    // Dispose the instrument
    if (instrument) {
      instrument.dispose(); // Free all audio resources
      instrument = null;
    }

    isReady = false;
    console.log("[TypeJam][playback] Engine disposed");
  };

  // ============================================================================
  // RETURN PUBLIC INTERFACE
  // ============================================================================

  // Return an object with the functions that external code can use
  // This is the "public API" of our playback engine
  return {
    play, // Function to start playback
    stop, // Function to stop playback
    dispose, // Function to clean up everything

    // Getter functions - these look like properties but are actually functions
    // They provide read-only access to our private state
    get isPlaying() {
      return isPlaying; // Returns true if currently playing
    },
    get isReady() {
      return isReady; // Returns true if instrument is loaded and ready
    },
  };
}
