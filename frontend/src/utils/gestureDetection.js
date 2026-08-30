// src/utils/gestureDetection.js

function extended(tip, pip) {
  return tip.y < pip.y - 0.02;
}

function curled(tip, mcp) {
  return tip.y > mcp.y - 0.02;
}

function thumbOut(lm) {
  return Math.hypot(lm[4].x - lm[2].x, lm[4].y - lm[2].y) > 0.08;
}

export function detectGesture(lm) {
  if (!lm || lm.length < 21) return null;

  const th = thumbOut(lm);
  const i  = extended(lm[8],  lm[6]);
  const m  = extended(lm[12], lm[10]);
  const r  = extended(lm[16], lm[14]);
  const p  = extended(lm[20], lm[18]);

  const iC = curled(lm[8],  lm[5]);
  const mC = curled(lm[12], lm[9]);
  const rC = curled(lm[16], lm[13]);
  const pC = curled(lm[20], lm[17]);

  const allCurled = iC && mC && rC && pC;

  const tipDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);

  // Raised Hand
  if (th && i && m && r && p)               return "Raised Hand ✋";

  // Four Fingers
  if (!th && i && m && r && p)              return "Four Fingers 🖐";

  // Thumbs Up
  if (th && allCurled && lm[4].y < lm[9].y) return "Thumbs Up 👍";

  // Thumbs Down
  if (th && allCurled && lm[4].y > lm[9].y) return "Thumbs Down 👎";

  // OK
  if (tipDist < 0.05 && m && r && p)        return "OK 👌";

  // Vulgar
  if (!i && m && !r && !p)                  return "Vulgar 🖕";

  // Yo
  if (i && !m && !r && p)                   return "Yo 🤙";

  // Three Fingers
  if (i && m && r && !p)                    return "Three Fingers 🤟";

  // Two / Peace
  if (i && m && !r && !p)                   return "Two ✌";

  // One
  if (i && !m && !r && !p)                  return "One ☝";

  // Fist
  if (allCurled && !th)                     return "Fist ✊";

  return null;
}
