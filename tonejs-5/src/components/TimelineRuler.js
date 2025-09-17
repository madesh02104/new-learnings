"use client";

import { useMemo } from "react";

export default function TimelineRuler({
  pxPerSec,
  leftGutterPx = 48,
  heightPx = 24,
  totalSec = 120,
}) {
  const { major, minor } = useMemo(() => {
    const majors = [];
    const minors = [];
    for (let s = 0; s <= totalSec; s += 1) {
      majors.push({ sec: s, x: leftGutterPx + s * pxPerSec });
      // Minor ticks every 0.1s between seconds
      for (let i = 1; i < 10; i += 1) {
        const sub = s + i / 10;
        if (sub > totalSec) break;
        minors.push({ x: leftGutterPx + sub * pxPerSec });
      }
    }
    return { major: majors, minor: minors };
  }, [pxPerSec, leftGutterPx, totalSec]);

  return (
    <div className="relative w-full" style={{ height: heightPx }}>
      <div
        className="absolute left-0 top-0 bottom-0 bg-gray-50 border-r border-gray-200"
        style={{ width: leftGutterPx }}
      />
      <div className="absolute inset-0 border-b border-gray-300 bg-white" />
      {minor.map((m, idx) => (
        <div
          key={`m-${idx}`}
          className="absolute"
          style={{ left: m.x, top: 0 }}
        >
          <div
            className="w-px bg-gray-300"
            style={{ height: heightPx * 0.5 }}
          />
        </div>
      ))}
      {major.map((t) => (
        <div key={t.sec} className="absolute" style={{ left: t.x, top: 0 }}>
          <div className="w-px bg-gray-400" style={{ height: heightPx }} />
          <div className="absolute -translate-x-1/2 top-0 text-[10px] text-gray-700 select-none">
            {t.sec}s
          </div>
        </div>
      ))}
    </div>
  );
}
