 function distance(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2)
  );
}

export function getMouthAspectRatio(landmarks) {
  const left = landmarks[61];
  const right = landmarks[291];

  const upper = landmarks[13];
  const lower = landmarks[14];

  const mouthWidth = distance(left, right);
  const mouthHeight = distance(upper, lower);

  return mouthHeight / mouthWidth;
}