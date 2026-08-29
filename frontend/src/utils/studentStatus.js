export function getStudentStatus(analytics) {

  const eyeContact =
    analytics.eyeContactTime /
    Math.max(
      analytics.faceVisibleTime,
      1
    );

  // Sleeping
  if (
    analytics.longestEyeClosure >= 4 ||
    analytics.drowsinessEvents >= 1
  ) {
    return {
      status: "Sleeping",
      color: "red",
      emoji: "😴",
    };
  }

  // Drowsy
  if (
    analytics.yawnCount >= 2 ||
    analytics.longestEyeClosure >= 2
  ) {
    return {
      status: "Drowsy",
      color: "orange",
      emoji: "🥱",
    };
  }

  // Distracted
  if (
    eyeContact < 0.60
  ) {
    return {
      status: "Distracted",
      color: "gold",
      emoji: "😕",
    };
  }

  // Thinking
  if (
    analytics.emotion === "Neutral" &&
    analytics.headPose !== "Straight"
  ) {
    return {
      status: "Thinking",
      color: "dodgerblue",
      emoji: "🤔",
    };
  }

  return {
    status: "Attentive",
    color: "green",
    emoji: "🟢",
  };
}