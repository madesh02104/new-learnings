import * as Tone from "tone";

export const rows = {
  top: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  mid: ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  bot: ["z", "x", "c", "v", "b", "n", "m"],
};

const notes = (start, n) =>
  Array.from({ length: n }, (_, i) =>
    Tone.Frequency(start).transpose(i).toNote()
  );

export const noteMap = new Map([
  ...rows.top.map((k, i) => [
    k,
    { note: notes("C5", rows.top.length)[i], row: "top" },
  ]),
  ...rows.mid.map((k, i) => [
    k,
    { note: notes("C4", rows.mid.length)[i], row: "mid" },
  ]),
  ...rows.bot.map((k, i) => [
    k,
    { note: notes("C3", rows.bot.length)[i], row: "bot" },
  ]),
]);

// For 26-key drums: map every key to its row and index within the row
export const indexMap = new Map([
  ...rows.top.map((k, i) => [k, { row: "top", i, len: rows.top.length }]),
  ...rows.mid.map((k, i) => [k, { row: "mid", i, len: rows.mid.length }]),
  ...rows.bot.map((k, i) => [k, { row: "bot", i, len: rows.bot.length }]),
]);
// For sampled drums, if you later use Sampler for drums too, you can build a
// per-key mapping similarly to noteMap but to IDs or note names.
