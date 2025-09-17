"use client";

export default function TransportControls({
  isPlaying,
  onPlayPause,
  onStop,
  pxPerSec,
  onChangePxPerSec,
  snapSec,
  onChangeSnapSec,
}) {
  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-md">
      <button
        className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
        onClick={onPlayPause}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button className="px-3 py-1 rounded border text-sm" onClick={onStop}>
        Stop
      </button>

      <div className="ml-4 flex items-center gap-2 text-sm">
        <span>Zoom</span>
        <select
          className="border rounded px-2 py-1"
          value={pxPerSec}
          onChange={(e) => onChangePxPerSec(parseInt(e.target.value, 10))}
        >
          {[60, 80, 100, 120, 160, 200].map((v) => (
            <option key={v} value={v}>
              {v} px/s
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span>Snap</span>
        <select
          className="border rounded px-2 py-1"
          value={snapSec ?? 0}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChangeSnapSec(v === 0 ? null : v);
          }}
        >
          <option value={0}>Off</option>
          {[0.25, 0.5, 1, 2].map((v) => (
            <option key={v} value={v}>
              {v}s
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
