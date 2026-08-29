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

  // Map all 7 face-api emotions into 3 buckets
  const happy   = e.happy;
  const sad     = e.sad + e.fearful + e.disgusted;
  const angry   = e.angry + e.disgusted * 0.5;

  const scores = { Happy: happy, Sad: sad, Angry: angry };
  const top = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));

  return top[0];
}
