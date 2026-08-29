 // src/utils/blinkDetection.js

// Calculate distance between two landmarks
function distance(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2)
  );
}

// Calculate Eye Aspect Ratio (EAR)
function eyeAspectRatio(eye) {
  const vertical1 = distance(eye[1], eye[5]);
  const vertical2 = distance(eye[2], eye[4]);
  const horizontal = distance(eye[0], eye[3]);

  return (vertical1 + vertical2) / (2 * horizontal);
}

// Returns the average EAR of both eyes
export function detectBlink(landmarks) {
  // Left eye landmarks
  const leftEye = [
    landmarks[33],
    landmarks[160],
    landmarks[158],
    landmarks[133],
    landmarks[153],
    landmarks[144],
  ];

  // Right eye landmarks
  const rightEye = [
    landmarks[362],
    landmarks[385],
    landmarks[387],
    landmarks[263],
    landmarks[373],
    landmarks[380],
  ];

  const leftEAR = eyeAspectRatio(leftEye);
  const rightEAR = eyeAspectRatio(rightEye);

  // Average EAR
  return (leftEAR + rightEAR) / 2;
}