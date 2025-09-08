"use client";

// ============================================================================
// TIMELINE RULER - Shows time markers and grid lines
// ============================================================================

/**
 * TimelineRuler: Displays time markings along the top of the timeline
 *
 * VISUAL LAYOUT:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 0s    5s    10s   15s   20s   25s   30s   35s   40s   45s   │
 * │ |     |     |     |     |     |     |     |     |     |     │
 * │ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────│
 * └─────────────────────────────────────────────────────────────┘
 *
 * FEATURES:
 * - Major ticks every 5 seconds with time labels
 * - Minor ticks every 1 second
 * - Responsive to zoom level (more/fewer ticks as needed)
 * - Grid lines extend down into track area
 *
 * @param {Object} props
 * @param {number} props.duration - Total duration to display (seconds)
 * @param {number} props.pixelsPerSecond - Current zoom level
 * @param {number} props.currentTime - Current playhead position (for highlighting)
 */
export default function TimelineRuler({
  duration,
  pixelsPerSecond,
  currentTime,
}) {
  // ============================================================================
  // TICK CALCULATION
  // ============================================================================

  /**
   * Calculate appropriate tick intervals based on zoom level
   *
   * LOGIC:
   * - When zoomed out (few pixels per second): show fewer, larger intervals
   * - When zoomed in (many pixels per second): show more, smaller intervals
   * - Always ensure ticks don't get too crowded or too sparse
   */
  const getTickIntervals = () => {
    // Base intervals to choose from (in seconds)
    const intervals = [
      { major: 60, minor: 10 }, // 1 minute major, 10 second minor
      { major: 30, minor: 5 }, // 30 second major, 5 second minor
      { major: 10, minor: 2 }, // 10 second major, 2 second minor
      { major: 5, minor: 1 }, // 5 second major, 1 second minor
      { major: 2, minor: 0.5 }, // 2 second major, 0.5 second minor
      { major: 1, minor: 0.2 }, // 1 second major, 0.2 second minor
    ];

    // Choose interval based on how much space we have
    const pixelsPerMajorTick = pixelsPerSecond * 5; // Target 5 seconds between major ticks

    if (pixelsPerMajorTick < 30) return intervals[0]; // Very zoomed out
    if (pixelsPerMajorTick < 60) return intervals[1]; // Zoomed out
    if (pixelsPerMajorTick < 100) return intervals[2]; // Normal
    if (pixelsPerMajorTick < 150) return intervals[3]; // Zoomed in
    if (pixelsPerMajorTick < 200) return intervals[4]; // Very zoomed in
    return intervals[5]; // Extremely zoomed in
  };

  const { major, minor } = getTickIntervals();

  // ============================================================================
  // TICK GENERATION
  // ============================================================================

  /**
   * Generate array of tick positions and labels
   */
  const generateTicks = () => {
    const ticks = [];
    const totalWidth = duration * pixelsPerSecond;

    // Generate major ticks (with labels)
    for (let time = 0; time <= duration; time += major) {
      const x = time * pixelsPerSecond;
      if (x <= totalWidth) {
        ticks.push({
          type: "major",
          time: time,
          x: x,
          label: formatTime(time),
        });
      }
    }

    // Generate minor ticks (no labels)
    for (let time = 0; time <= duration; time += minor) {
      const x = time * pixelsPerSecond;
      if (x <= totalWidth) {
        // Don't add minor tick if there's already a major tick here
        const hasMajorTick = ticks.some(
          (tick) => tick.type === "major" && Math.abs(tick.x - x) < 1
        );

        if (!hasMajorTick) {
          ticks.push({
            type: "minor",
            time: time,
            x: x,
            label: null,
          });
        }
      }
    }

    return ticks.sort((a, b) => a.x - b.x);
  };

  /**
   * Format time in seconds to human-readable string
   * Examples: 0s, 5s, 1:30, 2:05
   */
  const formatTime = (timeInSeconds) => {
    if (timeInSeconds < 60) {
      return `${Math.round(timeInSeconds)}s`;
    } else {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.round(timeInSeconds % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  };

  const ticks = generateTicks();
  const totalWidth = Math.max(duration * pixelsPerSecond, 800); // Minimum width

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      style={{
        position: "relative",
        width: `${totalWidth}px`,
        height: "40px",
        backgroundColor: "#333",
        borderBottom: "1px solid #444",
        overflow: "hidden",
      }}
    >
      {/* Background grid pattern */}
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
          transparent ${pixelsPerSecond * minor - 1}px,
          rgba(255, 255, 255, 0.1) ${pixelsPerSecond * minor - 1}px,
          rgba(255, 255, 255, 0.1) ${pixelsPerSecond * minor}px
        )`,
          pointerEvents: "none",
        }}
      />

      {/* Tick marks and labels */}
      {ticks.map((tick, index) => (
        <div key={index}>
          {/* Tick mark */}
          <div
            style={{
              position: "absolute",
              left: `${tick.x}px`,
              top: tick.type === "major" ? "20px" : "25px",
              width: "1px",
              height: tick.type === "major" ? "20px" : "15px",
              backgroundColor: tick.type === "major" ? "#fff" : "#666",
              pointerEvents: "none",
            }}
          />

          {/* Time label (only for major ticks) */}
          {tick.label && (
            <div
              style={{
                position: "absolute",
                left: `${tick.x - 20}px`, // Center the label
                top: "2px",
                width: "40px",
                textAlign: "center",
                fontSize: "11px",
                color: "#ccc",
                pointerEvents: "none",
                fontFamily: "monospace",
              }}
            >
              {tick.label}
            </div>
          )}
        </div>
      ))}

      {/* Current time indicator */}
      {currentTime >= 0 && currentTime <= duration && (
        <div
          style={{
            position: "absolute",
            left: `${currentTime * pixelsPerSecond}px`,
            top: 0,
            bottom: 0,
            width: "2px",
            backgroundColor: "#ff4444",
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 0 4px rgba(255, 68, 68, 0.5)",
          }}
        />
      )}

      {/* Debug info (temporary) */}
      <div
        style={{
          position: "absolute",
          top: "2px",
          right: "8px",
          fontSize: "10px",
          color: "#666",
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        {pixelsPerSecond.toFixed(0)}px/s | {major}s/{minor}s
      </div>
    </div>
  );
}
