// src/analytics/sessionAnalytics.js

export const sessionAnalytics = {
  classStartTime: null,

  faceVisibleTime: 0,
  faceMissingTime: 0,

  eyeContactTime: 0,
  lookingAwayTime: 0,

  blinkCount: 0,

  longestEyeClosure: 0,

  drowsinessEvents: 0,

  headPose: {
    straight: 0,
    left: 0,
    right: 0,
    up: 0,
    down: 0,
  },

  emotions: {
    happy: 0,
    neutral: 0,
    confused: 0,
    sad: 0,
    surprised: 0,
  },

  handGestures: {
    raised: 0,
    pointing: 0,
    writing: 0,
    thumbsUp: 0,
  },

  timeline: [],
};
export function startSession() {
  sessionAnalytics.classStartTime = Date.now();
}
export function addTimelineEvent(type, details = "") {
  sessionAnalytics.timeline.push({
    time: new Date().toLocaleTimeString(),
    type,
    details,
  });
}
export function addEyeContact(ms) {
  sessionAnalytics.eyeContactTime += ms;
}

export function addLookingAway(ms) {
  sessionAnalytics.lookingAwayTime += ms;
}

export function addFaceVisible(ms) {
  sessionAnalytics.faceVisibleTime += ms;
}

export function addFaceMissing(ms) {
  sessionAnalytics.faceMissingTime += ms;
}
export function addBlink() {
  sessionAnalytics.blinkCount++;
}

export function updateLongestEyeClosure(duration) {
  if (duration > sessionAnalytics.longestEyeClosure) {
    sessionAnalytics.longestEyeClosure = duration;
  }
}

export function addDrowsinessEvent() {
  sessionAnalytics.drowsinessEvents++;
}