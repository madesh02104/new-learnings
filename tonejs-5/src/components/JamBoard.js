"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TimelineRuler from "./TimelineRuler";
import TrackArea from "./TrackArea";

// JamBoard renders the time ruler and a set of vertical tracks.
// It accepts drops from the recordings list and creates clips via onCreateClip.
export default function JamBoard({
  clips,
  onCreateClip,
  onUpdateClip,
  onDeleteClip,
  pxPerSec = 100,
  numTracks = 10,
  snapSec = 0.5,
  isActive = false,
}) {
  const boardRef = useRef(null);
  const [playheadSec, setPlayheadSec] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      // Read Tone.Transport.seconds if available without importing here
      try {
        // Lazy require to avoid SSR issues
        // eslint-disable-next-line global-require
        const { Transport } = require("tone");
        if (isActive) {
          setPlayheadSec(Transport.seconds || 0);
        }
      } catch {}
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isActive]);

  const onDropFromLibrary = useCallback(
    (e) => {
      e.preventDefault();
      const recordingId = e.dataTransfer.getData("application/x-recording-id");
      const durationMsStr = e.dataTransfer.getData(
        "application/x-recording-duration-ms"
      );
      if (!recordingId) return;
      const durationSec = Math.max(
        0.001,
        (parseInt(durationMsStr || "0", 10) || 0) / 1000
      );

      const boardEl = boardRef.current;
      if (!boardEl) return;

      const rect = boardEl.getBoundingClientRect();
      const x = e.clientX - rect.left; // within board content
      const y = e.clientY - rect.top;

      // Determine track index based on y
      const trackHeight = 56; // match TrackArea row height
      let trackIndex = Math.floor((y - 24) / trackHeight); // 24px for ruler height
      if (trackIndex < 0) trackIndex = 0;
      if (trackIndex >= numTracks) trackIndex = numTracks - 1;

      // Compute time from x (minus gutter for labels)
      const timeStartX = 48; // left gutter
      const rawSec = (x - timeStartX) / pxPerSec;
      const snappedSec = snapSec
        ? Math.max(0, Math.round(rawSec / snapSec) * snapSec)
        : Math.max(0, rawSec);

      onCreateClip({
        recordingId,
        trackIndex,
        startTimeSec: snappedSec,
        durationSec,
      });
    },
    [onCreateClip, pxPerSec, numTracks, snapSec]
  );

  const onDragOver = useCallback((e) => {
    // Allow drop
    if (e.dataTransfer?.types?.includes("application/x-recording-id")) {
      e.preventDefault();
    }
  }, []);

  const clipsByTrack = useMemo(() => {
    const map = Array.from({ length: numTracks }, () => []);
    for (const c of clips) {
      if (c.trackIndex >= 0 && c.trackIndex < numTracks) {
        map[c.trackIndex].push(c);
      }
    }
    return map;
  }, [clips, numTracks]);

  // Determine total length of the board in seconds based on clips
  const totalSec = useMemo(() => {
    let maxEnd = 0;
    for (const c of clips) {
      maxEnd = Math.max(maxEnd, (c.startTimeSec || 0) + (c.durationSec || 0));
    }
    const margin = 5; // seconds of extra space beyond last clip
    const minSec = 30; // minimum visible timeline length
    return Math.max(minSec, Math.ceil(maxEnd + margin));
  }, [clips]);
  const contentWidthPx = 48 + totalSec * pxPerSec;

  return (
    <div
      ref={boardRef}
      className="flex flex-col h-full w-full select-none bg-white border border-gray-200 rounded-md overflow-hidden"
      onDrop={onDropFromLibrary}
      onDragOver={onDragOver}
    >
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ width: contentWidthPx }}>
          <div className="relative">
            <TimelineRuler
              pxPerSec={pxPerSec}
              leftGutterPx={48}
              heightPx={24}
              totalSec={totalSec}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500"
              style={{ left: 48 + playheadSec * pxPerSec }}
            />
          </div>
          <TrackArea
            pxPerSec={pxPerSec}
            numTracks={numTracks}
            clipsByTrack={clipsByTrack}
            onUpdateClip={onUpdateClip}
            onDeleteClip={onDeleteClip}
            leftGutterPx={48}
            rowHeightPx={56}
            snapSec={snapSec}
            totalSec={totalSec}
          />
        </div>
      </div>
    </div>
  );
}
