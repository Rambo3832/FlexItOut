import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

function ExerciseDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [exerciseCount, setExerciseCount] = useState(0);

  // Initialize pose detector
  useEffect(() => {
    async function initializeDetector() {
      await tf.ready();
      const model = poseDetection.SupportedModels.MoveNet;
      const detector = await poseDetection.createDetector(model);
      setDetector(detector);
    }
    initializeDetector();
  }, []);

  // Set up webcam
  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }

    setupCamera();
  }, []);

  // Detect poses
  useEffect(() => {
    let requestId;

    async function detectPose() {
      if (!detector || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Make sure video is ready
      if (video.readyState === 4) {
        const poses = await detector.estimatePoses(video);
        
        // Clear canvas and draw video frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw keypoints
        if (poses.length > 0) {
          drawKeypoints(poses[0], ctx);
        }
      }

      requestId = requestAnimationFrame(detectPose);
    }

    detectPose();

    return () => {
      if (requestId) {
        cancelAnimationFrame(requestId);
      }
    };
  }, [detector]);

  // Draw keypoints function
  const drawKeypoints = (pose, ctx) => {
    const keypoints = pose.keypoints;
    
    // Draw points
    keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });

    // Draw connections
    drawSkeleton(keypoints, ctx);
  };

  // Draw skeleton function
  const drawSkeleton = (keypoints, ctx) => {
    // Define connections between points
    const connections = [
      ['nose', 'left_eye'], ['left_eye', 'left_ear'],
      ['nose', 'right_eye'], ['right_eye', 'right_ear'],
      ['left_shoulder', 'right_shoulder'], 
      ['left_shoulder', 'left_elbow'],
      ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'],
      ['right_knee', 'right_ankle']
    ];

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    connections.forEach(([first, second]) => {
      const firstPoint = keypoints.find(kp => kp.name === first);
      const secondPoint = keypoints.find(kp => kp.name === second);

      if (firstPoint && secondPoint && firstPoint.score > 0.3 && secondPoint.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(firstPoint.x, firstPoint.y);
        ctx.lineTo(secondPoint.x, secondPoint.y);
        ctx.stroke();
      }
    });
  };

  return (
    <div className="relative max-w-2xl mx-auto mt-8">
      <div className="relative">
        <video
          ref={videoRef}
          className="hidden"
          autoPlay
          playsInline
          width="640"
          height="480"
        />
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-lg"
          width="640"
          height="480"
        />
      </div>
      <div className="mt-4 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold">Exercise Count: {exerciseCount}</h2>
      </div>
    </div>
  );
}

export default ExerciseDetection;