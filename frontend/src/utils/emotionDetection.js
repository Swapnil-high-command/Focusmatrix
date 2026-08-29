// src/utils/emotionDetection.js

const HISTORY = 8;
const emotionHistory = [];

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function iod(lm) {
  return dist(lm[33], lm[263]) || 1;
}

function classifyEmotion(lm) {
  const scale = iod(lm);

  // Brow raise — inner brows above eye center (AU1/2)
  const browRaise = ((lm[65].y - lm[159].y) + (lm[295].y - lm[386].y)) / (2 * scale);

  // Brow furrow — inner brow corners close together (AU4)
  const browFurrow = dist(lm[55], lm[285]) / scale;

  // Lip corner pull — mouth width (AU12, smile)
  const lipWidth = dist(lm[61], lm[291]) / scale;

  // Cheek raise — cheek landmark above eye (AU6, Duchenne smile)
  const cheekRaise = ((lm[116].y - lm[159].y) + (lm[345].y - lm[386].y)) / (2 * scale);

  // Jaw drop — inner lip gap (AU25/26)
  const jawDrop = dist(lm[13], lm[14]) / scale;

  // Eye openness (AU43/45)
  const eyeOpen = (dist(lm[159], lm[145]) + dist(lm[386], lm[374])) / (2 * scale);

  // Lip corner depression — corners below upper lip (AU15)
  const lipDepress = ((lm[61].y - lm[13].y) + (lm[291].y - lm[13].y)) / (2 * scale);

  // Nose wrinkle — nostril width narrows (AU9)
  const noseWrinkle = dist(lm[48], lm[278]) / scale;

  // Lip stretch — wide thin mouth (AU20, fear)
  const lipStretch = dist(lm[61], lm[291]) / scale;

  const scores = {
    Happy:     0,
    Sad:       0,
    Angry:     0,
    Surprised: 0,
    Fearful:   0,
    Disgusted: 0,
    Neutral:   0,
  };

  // Happy: wide smile + cheek raise
  scores.Happy += lipWidth > 0.55 ? 3 : lipWidth > 0.48 ? 1.5 : 0;
  scores.Happy += cheekRaise < 0.08 ? 2 : cheekRaise < 0.12 ? 1 : 0;

  // Sad: inner brow raise + lip corners down + slight jaw drop
  scores.Sad += browRaise > 0.06 ? 2 : browRaise > 0.03 ? 1 : 0;
  scores.Sad += lipDepress > 0.04 ? 2 : lipDepress > 0.02 ? 1 : 0;
  scores.Sad += eyeOpen < 0.04 ? 1 : 0;

  // Angry: brows close together + narrow eyes + tight mouth
  scores.Angry += browFurrow < 0.28 ? 3 : browFurrow < 0.32 ? 1.5 : 0;
  scores.Angry += eyeOpen < 0.035 ? 1.5 : 0;
  scores.Angry += lipWidth < 0.44 ? 1 : 0;

  // Surprised: brow raise + jaw drop + wide eyes
  scores.Surprised += browRaise > 0.08 ? 3 : browRaise > 0.05 ? 1.5 : 0;
  scores.Surprised += jawDrop > 0.04 ? 3 : jawDrop > 0.025 ? 1.5 : 0;
  scores.Surprised += eyeOpen > 0.055 ? 2 : eyeOpen > 0.045 ? 1 : 0;

  // Fearful: brow raise + lip stretch + wide eyes + jaw drop
  scores.Fearful += browRaise > 0.06 ? 2 : 0;
  scores.Fearful += lipStretch > 0.52 ? 2 : lipStretch > 0.46 ? 1 : 0;
  scores.Fearful += eyeOpen > 0.05 ? 1.5 : 0;
  scores.Fearful += jawDrop > 0.025 ? 1 : 0;
  scores.Fearful += browFurrow < 0.30 ? 1 : 0;

  // Disgusted: nose wrinkle + lip corners down
  scores.Disgusted += noseWrinkle < 0.38 ? 2.5 : noseWrinkle < 0.42 ? 1 : 0;
  scores.Disgusted += lipDepress > 0.03 ? 1.5 : 0;
  scores.Disgusted += browFurrow < 0.32 ? 1 : 0;

  // Neutral: nothing extreme
  const maxOther = Math.max(
    scores.Happy, scores.Sad, scores.Angry,
    scores.Surprised, scores.Fearful, scores.Disgusted
  );
  scores.Neutral = maxOther < 1.5 ? 3 : maxOther < 2.5 ? 1 : 0;

  return Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}

export function detectEmotionFromLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 400) return "Neutral";

  const emotion = classifyEmotion(landmarks);
  emotionHistory.push(emotion);
  if (emotionHistory.length > HISTORY) emotionHistory.shift();

  // Weighted vote — recent frames count more
  const votes = {};
  emotionHistory.forEach((e, i) => {
    votes[e] = (votes[e] ?? 0) + (i + 1);
  });
  return Object.entries(votes).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}

export function smoothEmotion(raw) {
  return raw ?? "Neutral";
}
