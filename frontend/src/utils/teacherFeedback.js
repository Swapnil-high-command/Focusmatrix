export function getTeacherFeedback(analytics) {

  const feedback = [];

  if (analytics.drowsinessEvents > 0) {
    feedback.push("😴 Student appeared sleepy.");
  }

  if (analytics.yawnCount >= 2) {
    feedback.push("🥱 Frequent yawning detected.");
  }

  const away =
    analytics.lookingAwayTime /
    Math.max(analytics.faceVisibleTime, 1);

  if (away > 0.30) {
    feedback.push("👀 Student looked away frequently.");
  }

  if (analytics.emotion === "Happy") {
    feedback.push("😊 Positive engagement observed.");
  }

  if (
    feedback.length === 0
  ) {
    feedback.push("✅ Student remained attentive.");
  }

  return feedback;
}