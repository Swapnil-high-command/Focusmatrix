// src/utils/headPose.js

export function getHeadPose(landmarks) {
  if (!landmarks) return "No Face";

  // Nose tip
  const nose = landmarks[1];

  // Left & right face edges
  const leftFace = landmarks[234];
  const rightFace = landmarks[454];

  // Forehead and chin
  const forehead = landmarks[10];
  const chin = landmarks[152];

  // Face center
  const centerX = (leftFace.x + rightFace.x) / 2;
  const centerY = (forehead.y + chin.y) / 2;

  const dx = nose.x - centerX;
  const dy = nose.y - centerY;

  // Horizontal movement
  if (dx < -0.03) return "Looking Left";
  if (dx > 0.03) return "Looking Right";

  // Vertical movement
  if (dy < -0.05) return "Looking Up";
  if (dy > 0.05) return "Looking Down";

  return "Looking Straight";
}