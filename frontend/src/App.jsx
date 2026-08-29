import "./App.css";
import { useRef, useState } from "react";

import FaceTracker from "./components/FaceTracker";
import Dashboard from "./components/Dashboard";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [analytics, setAnalytics] = useState({
    faceStatus: "No Face",
    eyeContact: "Unknown",
    blinkCount: 0,
    headPose: "Unknown",
    emotion: "Neutral",

    faceVisibleTime: 0,
    faceMissingTime: 0,

    eyeContactTime: 0,
    lookingAwayTime: 0,

    longestEyeClosure: 0,
    drowsinessEvents: 0,

    yawnCount: 0,
    totalYawnTime: 0,
    longestYawn: 0,

    currentGesture: "None",
    gestureCounts: {},
  });

  return (
    <div className="container">

      <h1 className="main-title">
        🎓 AI Classroom Monitor
      </h1>

      <div className="main-content">

        {/* CAMERA */}
        <div className="camera-section">

          <h2>🎥 Live Camera</h2>

          <div className="video-box">

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
            />

            <canvas ref={canvasRef} />

          </div>

        </div>

        {/* DASHBOARD */}
        <Dashboard analytics={analytics} />

      </div>

      <FaceTracker
        videoRef={videoRef}
        canvasRef={canvasRef}
        analytics={analytics}
        setAnalytics={setAnalytics}
      />

    </div>
  );
}

export default App;