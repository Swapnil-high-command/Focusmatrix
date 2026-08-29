// src/utils/emotionDetection.js

const BUFFER_SIZE = 10;
const buffer = [];

export function smoothEmotion(rawEmotion) {
  if (!rawEmotion) return buffer[buffer.length - 1] ?? "Focused 🧐";

  buffer.push(rawEmotion);
  if (buffer.length > BUFFER_SIZE) buffer.shift();

  const counts = {};
  for (const e of buffer) counts[e] = (counts[e] ?? 0) + 1;
  return Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}
