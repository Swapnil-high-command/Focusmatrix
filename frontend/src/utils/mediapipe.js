 import {
  FilesetResolver,
  FaceLandmarker,
  HandLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

let faceLandmarker = null;
let handLandmarker = null;
let drawingUtils = null;
let visionInstance = null;

async function getVision() {
  if (!visionInstance) {
    visionInstance = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
  }
  return visionInstance;
}

export async function loadFaceLandmarker(canvas) {
  const vision = await getVision();

  if (!faceLandmarker) {
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
    });
  }

  drawingUtils = new DrawingUtils(canvas.getContext("2d"));
  return { faceLandmarker, drawingUtils };
}

export async function loadHandLandmarker() {
  if (handLandmarker) return handLandmarker;

  const vision = await getVision();

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  return handLandmarker;
}