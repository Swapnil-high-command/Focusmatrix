import { useEffect } from "react";
import { FaceLandmarker } from "@mediapipe/tasks-vision";

import { loadFaceLandmarker, loadHandLandmarker } from "../utils/mediapipe";
import { detectBlink } from "../utils/blinkDetection";
import { isLookingAtCamera } from "../utils/eyeContact";
import { getHeadPose } from "../utils/headPose";
import { detectEmotionFromLandmarks } from "../utils/emotionDetection";
import { getMouthAspectRatio } from "../utils/yawnDetection";
import { detectGesture } from "../utils/gestureDetection";

import {
  startSession,
  addEyeContact,
  addLookingAway,
  addFaceVisible,
  addFaceMissing,
} from "../analytics/sessionAnalytics";

const TESSELATION = FaceLandmarker.FACE_LANDMARKS_TESSELATION;

function drawMesh(ctx, landmarks, w, h) {
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 1;

  for (const { start, end } of TESSELATION) {
    const s = landmarks[start];
    const e = landmarks[end];

    ctx.beginPath();
    ctx.moveTo(s.x * w, s.y * h);
    ctx.lineTo(e.x * w, e.y * h);
    ctx.stroke();
  }
}

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function drawHand(ctx, landmarks, w, h) {
  ctx.strokeStyle = "#00cfff";
  ctx.lineWidth = 2;
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
    ctx.stroke();
  }
  ctx.fillStyle = "#ffffff";
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function FaceTracker({ videoRef, canvasRef, analytics, setAnalytics }) {
  useEffect(() => {
    let running = true;
    let animationId;

    let blinkCount = 0;
    let eyesClosed = false;
    let eyeCloseStart = null;
    let longestEyeClosure = 0;
    let drowsinessEvents = 0;

    let yawnStarted = false;
    let yawnStartTime = 0;
    let yawnCount = 0;
    let totalYawnTime = 0;
    let longestYawn = 0;
    let lastYawnTime = 0;

    startSession();

    async function startDetection() {

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      video.srcObject = stream;

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      const { faceLandmarker } = await loadFaceLandmarker(canvas);
      const handLandmarker = await loadHandLandmarker();

      let lastFrameTime = performance.now();

      let lastEmotion = "Neutral";

      // Gesture debounce — only count a new gesture after it changes
      let lastCountedGesture = null;

      function detect() {
        if (!running) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        if (video.readyState === 4) {
          const results = faceLandmarker.detectForVideo(video, currentTime);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];

            addFaceVisible(deltaTime);

            const ear = detectBlink(landmarks);
            const mar = getMouthAspectRatio(landmarks);

            lastEmotion = detectEmotionFromLandmarks(landmarks);
            const emotion = lastEmotion;
            const now = performance.now();

            // BLINK DETECTION
            if (ear < 0.2) {
              if (!eyesClosed) {
                eyesClosed = true;
                eyeCloseStart = now;
              }
            } else {
              if (eyesClosed) {
                const closedTime = (now - eyeCloseStart) / 1000;
                if (closedTime < 0.8) blinkCount++;
                if (closedTime > longestEyeClosure) longestEyeClosure = closedTime;
                if (closedTime >= 4) {
                  drowsinessEvents++;
                  console.log("😴 Sleep Event", closedTime.toFixed(2), "seconds");
                }
                eyesClosed = false;
                eyeCloseStart = null;
              }
            }

            // YAWN DETECTION
            if (mar > 0.45) {
              if (!yawnStarted) {
                yawnStarted = true;
                yawnStartTime = now;
              }
            } else {
              if (yawnStarted) {
                const yawnDuration = (now - yawnStartTime) / 1000;
                if (yawnDuration >= 1.5 && now - lastYawnTime > 1000) {
                  yawnCount++;
                  totalYawnTime += yawnDuration;
                  if (yawnDuration > longestYawn) longestYawn = yawnDuration;
                  lastYawnTime = now;
                  console.log("🥱 Yawn", yawnCount, yawnDuration.toFixed(2), "sec");
                }
                yawnStarted = false;
              }
            }

            // EYE CONTACT
            const looking = isLookingAtCamera(landmarks);
            if (looking) addEyeContact(deltaTime);
            else addLookingAway(deltaTime);

            // HEAD POSE
            const pose = getHeadPose(landmarks);

            // DRAW FACE MESH
            drawMesh(ctx, landmarks, canvas.width, canvas.height);

            // HAND DETECTION & GESTURE
            const handResults = handLandmarker.detectForVideo(video, currentTime);
            let currentGesture = "None";

            for (const handLandmarks of handResults.landmarks) {
              drawHand(ctx, handLandmarks, canvas.width, canvas.height);
              const gesture = detectGesture(handLandmarks);
              if (gesture) currentGesture = gesture;
            }

            // UPDATE DASHBOARD
            setAnalytics((prev) => {
              // Count gesture only when it changes to a new recognized one
              const counts = { ...prev.gestureCounts };
              if (
                currentGesture !== "None" &&
                currentGesture !== lastCountedGesture
              ) {
                counts[currentGesture] = (counts[currentGesture] ?? 0) + 1;
                lastCountedGesture = currentGesture;
              }
              if (currentGesture === "None") lastCountedGesture = null;

              return {
                ...prev,
                faceStatus: "Detected",
                eyeContact: looking ? "Looking at Camera" : "Looking Away",
                eyeContactTime: looking ? prev.eyeContactTime + deltaTime : prev.eyeContactTime,
                lookingAwayTime: !looking ? prev.lookingAwayTime + deltaTime : prev.lookingAwayTime,
                blinkCount,
                headPose: pose,
                emotion,
                longestEyeClosure,
                drowsinessEvents,
                yawnCount,
                totalYawnTime,
                longestYawn,
                faceVisibleTime: prev.faceVisibleTime + deltaTime,
                currentGesture,
                gestureCounts: counts,
              };
            });
          } else {
            addFaceMissing(deltaTime);

            setAnalytics((prev) => ({
              ...prev,
              faceStatus: "No Face",
              eyeContact: "Unknown",
              headPose: "Unknown",
              emotion: "No Face",
              faceMissingTime: prev.faceMissingTime + deltaTime,
            }));
          }
        }

        animationId = requestAnimationFrame(detect);
      }

      detect();
    }

    startDetection();

    return () => {
      running = false;
      cancelAnimationFrame(animationId);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [videoRef, canvasRef, setAnalytics]);

  return null;
}

export default FaceTracker;
