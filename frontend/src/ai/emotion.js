// src/ai/emotion.js

import * as faceapi from "face-api.js";

let modelsLoaded = false;

export async function loadEmotionModel() {
  if (modelsLoaded) return;
  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function getEmotionFromVideo(video) {
  if (!modelsLoaded) return null;

  const result = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (!result) return null;

  const e = result.expressions;

  // Use the strongest negative signal, not a sum
  const dissatisfied = Math.max(e.sad, e.angry, e.disgusted, e.fearful);

  const scores = {
    "Happy 😊😄":        e.happy > 0.3 ? e.happy : 0,
    "Dissatisfied 😞": dissatisfied,
    "Focused 🧐":      e.neutral,
  };

  return Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}
