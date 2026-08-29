// src/utils/eyeContact.js

// Returns true if the face is looking roughly at the camera
export function isLookingAtCamera(faceLandmarks) {
  if (!faceLandmarks) return false;

  // Nose tip landmark
  const nose = faceLandmarks[1];

  // Left eye outer corner
  const leftEye = faceLandmarks[33];

  // Right eye outer corner
  const rightEye = faceLandmarks[263];

  // Midpoint between eyes
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;

  // Horizontal distance between nose and eye center
  const diff = Math.abs(nose.x - eyeCenterX);

  // Threshold (can be tuned later)
  return diff < 0.03;
}