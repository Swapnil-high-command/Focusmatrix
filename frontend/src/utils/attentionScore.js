export function calculateAttentionScore(
  analytics
) {

  let score = 100;

  // Looking Away

  const awayPercent =
    analytics.lookingAwayTime /
    Math.max(
      analytics.faceVisibleTime,
      1
    );

  score -= awayPercent * 40;

  // Yawns

  score -= analytics.yawnCount * 5;

  // Sleep

  score -=
    analytics.drowsinessEvents * 25;

  // Eye Closure

  score -=
    analytics.longestEyeClosure * 3;

  // Emotion

  if (analytics.emotion === "Sad")
    score -= 5;

  if (analytics.emotion === "Angry")
    score -= 5;

  if (analytics.emotion === "Happy")
    score += 3;

  if (analytics.emotion === "Neutral")
    score += 2;

  // Clamp

  score = Math.max(
    0,
    Math.min(100, score)
  );

  return Math.round(score);
}