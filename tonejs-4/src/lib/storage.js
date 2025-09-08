// ============================================================================
// PERSISTENT STORAGE - Save recordings to localStorage
// ============================================================================

/**
 * Storage utilities for persisting recordings across browser sessions
 *
 * HOW LOCALSTORAGE WORKS:
 * - Browser gives each website ~5-10MB of storage space
 * - Data persists until user clears browser data
 * - Only stores strings, so we convert objects to JSON
 * - Synchronous API (no async/await needed)
 */

const STORAGE_KEY = "typejam-recordings";

// ============================================================================
// SAVE RECORDINGS
// ============================================================================

/**
 * Save recordings array to localStorage
 *
 * WHAT HAPPENS:
 * 1. Convert recordings array to JSON string
 * 2. Store in localStorage with our key
 * 3. Handle any errors (storage full, etc.)
 *
 * @param {import('./recording').Recording[]} recordings - Array of recordings to save
 */
export function saveRecordings(recordings) {
  try {
    // Convert JavaScript objects to JSON string
    const jsonString = JSON.stringify(recordings);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, jsonString);

    console.log(
      `[TypeJam][storage] Saved ${recordings.length} recordings to localStorage`
    );
    console.log(
      `[TypeJam][storage] Storage size: ${jsonString.length} characters`
    );
  } catch (error) {
    // Handle errors (storage full, private browsing mode, etc.)
    console.error("[TypeJam][storage] Failed to save recordings:", error);

    // Could show user notification here
    if (error.name === "QuotaExceededError") {
      console.warn(
        "[TypeJam][storage] Storage quota exceeded - too many recordings!"
      );
    }
  }
}

// ============================================================================
// LOAD RECORDINGS
// ============================================================================

/**
 * Load recordings array from localStorage
 *
 * WHAT HAPPENS:
 * 1. Get JSON string from localStorage
 * 2. Parse back to JavaScript objects
 * 3. Validate the data structure
 * 4. Return empty array if anything goes wrong
 *
 * @returns {import('./recording').Recording[]} Array of saved recordings (or empty array)
 */
export function loadRecordings() {
  try {
    // Get the JSON string from localStorage
    const jsonString = localStorage.getItem(STORAGE_KEY);

    // If no data saved yet, return empty array
    if (!jsonString) {
      console.log("[TypeJam][storage] No saved recordings found");
      return [];
    }

    // Parse JSON string back to JavaScript objects
    const recordings = JSON.parse(jsonString);

    // Validate that it's actually an array
    if (!Array.isArray(recordings)) {
      console.warn(
        "[TypeJam][storage] Invalid recordings data, returning empty array"
      );
      return [];
    }

    console.log(
      `[TypeJam][storage] Loaded ${recordings.length} recordings from localStorage`
    );
    return recordings;
  } catch (error) {
    // Handle JSON parsing errors, localStorage errors, etc.
    console.error("[TypeJam][storage] Failed to load recordings:", error);
    return []; // Return empty array as fallback
  }
}

// ============================================================================
// CLEAR STORAGE (for debugging/user control)
// ============================================================================

/**
 * Clear all saved recordings from localStorage
 * Useful for debugging or if user wants to start fresh
 */
export function clearRecordings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[TypeJam][storage] Cleared all recordings from localStorage");
  } catch (error) {
    console.error("[TypeJam][storage] Failed to clear recordings:", error);
  }
}

// ============================================================================
// STORAGE INFO (for debugging)
// ============================================================================

/**
 * Get information about current storage usage
 * @returns {Object} Storage statistics
 */
export function getStorageInfo() {
  try {
    const jsonString = localStorage.getItem(STORAGE_KEY);
    const sizeInBytes = jsonString ? new Blob([jsonString]).size : 0;
    const sizeInKB = Math.round((sizeInBytes / 1024) * 100) / 100;

    return {
      recordingsCount: jsonString ? JSON.parse(jsonString).length : 0,
      sizeInBytes,
      sizeInKB,
      sizeInMB: Math.round((sizeInKB / 1024) * 100) / 100,
    };
  } catch (error) {
    console.error("[TypeJam][storage] Failed to get storage info:", error);
    return { recordingsCount: 0, sizeInBytes: 0, sizeInKB: 0, sizeInMB: 0 };
  }
}
