import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

const EXERCISE_TYPES = [
  {
    id: 'pushup',
    name: 'Push-ups',
    description: 'Upper body strength exercise',
    instructions: 'Keep your back straight and lower your body until your chest nearly touches the ground',
    targetAngles: {
      elbow: { min: 70, max: 110 },
      back: { min: 160, max: 200 }
    }
  },
  {
    id: 'squat',
    name: 'Squats',
    description: 'Lower body strength exercise',
    instructions: 'Keep your back straight and lower your body until thighs are parallel to ground',
    targetAngles: {
      knee: { min: 80, max: 100 },
      hip: { min: 70, max: 100 }
    }
  }
];

function ExerciseDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isExerciseStarted, setIsExerciseStarted] = useState(false);
  const [exerciseStats, setExerciseStats] = useState({
    count: 0,
    accuracy: 0,
    feedback: '',
    score: 0
  });
  const [lastPoseState, setLastPoseState] = useState(null);
  const [stateConfidence, setStateConfidence] = useState(0);
  const detectionRef = useRef(null);
  const confidenceThreshold = 2; // Reduced from 3 to 2 for more responsive counting
  const lastValidPoseTime = useRef(Date.now());
  const MIN_POSE_INTERVAL = 300; // Minimum time (ms) between pose state changes

  // Initialize detector
  useEffect(() => {
    async function initializeDetector() {
      try {
        await tf.ready();
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
        };
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        setDetector(detector);
      } catch (error) {
        console.error('Error initializing detector:', error);
      }
    }
    initializeDetector();

    return () => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
    };
  }, []);

  // Set up webcam
  useEffect(() => {
    async function setupCamera() {
      if (!isExerciseStarted) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isExerciseStarted]);

  // Calculate angle between three points
  const calculateAngle = (pointA, pointB, pointC) => {
    if (!pointA?.score || !pointB?.score || !pointC?.score) return null;
    if (pointA.score < 0.3 || pointB.score < 0.3 || pointC.score < 0.3) return null;

    const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                   Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  // Check exercise state and form with confidence tracking
  const checkExerciseForm = (pose) => {
    if (!selectedExercise || !pose.keypoints) return null;

    const keypoints = pose.keypoints;
    let state = null;
    let feedback = '';
    let accuracy = 100;
    let isValidPose = true;

    if (selectedExercise.id === 'pushup') {
      const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
      const leftElbow = keypoints.find(kp => kp.name === 'left_elbow');
      const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
      const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
      const rightElbow = keypoints.find(kp => kp.name === 'right_elbow');
      const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');

      // More lenient keypoint validation
      const requiredKeypoints = [leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist];
      isValidPose = requiredKeypoints.filter(kp => kp?.score > 0.2).length >= 4; // Only need 4 out of 6 points

      if (isValidPose) {
        const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
        const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

        // Use either angle if available
        const effectiveAngle = leftElbowAngle || rightElbowAngle;
        
        if (effectiveAngle) {
          if (effectiveAngle < 100) { // Adjusted threshold
            state = 'down';
          } else {
            state = 'up';
          }

          // More lenient form checking
          if (effectiveAngle < selectedExercise.targetAngles.elbow.min - 10) {
            feedback = 'Bend your elbows less!';
            accuracy -= 15;
          } else if (effectiveAngle > selectedExercise.targetAngles.elbow.max + 10) {
            feedback = 'Bend your elbows more!';
            accuracy -= 15;
          }
        }
      }
    } else if (selectedExercise.id === 'squat') {
      const leftHip = keypoints.find(kp => kp.name === 'left_hip');
      const leftKnee = keypoints.find(kp => kp.name === 'left_knee');
      const leftAnkle = keypoints.find(kp => kp.name === 'left_ankle');
      
      // More lenient keypoint validation
      const requiredKeypoints = [leftHip, leftKnee, leftAnkle];
      isValidPose = requiredKeypoints.filter(kp => kp?.score > 0.2).length >= 2;

      if (isValidPose) {
        const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        
        if (kneeAngle) {
          if (kneeAngle < 110) { // Adjusted threshold
            state = 'down';
          } else {
            state = 'up';
          }

          // More lenient form checking
          if (kneeAngle < selectedExercise.targetAngles.knee.min - 10) {
            feedback = 'Don\'t go too low!';
            accuracy -= 15;
          } else if (kneeAngle > selectedExercise.targetAngles.knee.max + 10) {
            feedback = 'Go lower!';
            accuracy -= 15;
          }
        }
      }
    }

    return { state, feedback, accuracy: Math.max(accuracy, 0), isValidPose };
  };

  // Modified pose detection loop with more lenient state management
  useEffect(() => {
    async function detectPose() {
      if (!detector || !videoRef.current || !canvasRef.current || !isExerciseStarted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === 4) {
        try {
          const poses = await detector.estimatePoses(video);
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (poses.length > 0) {
            drawPose(poses[0], ctx);

            const formCheck = checkExerciseForm(poses[0]);
            
            if (formCheck) {
              setExerciseStats(prev => ({
                ...prev,
                accuracy: formCheck.accuracy,
                feedback: formCheck.feedback
              }));

              const currentTime = Date.now();
              
              // State management with more lenient timing
              if (formCheck.state && formCheck.isValidPose) {
                if (formCheck.state === lastPoseState) {
                  setStateConfidence(prev => Math.min(prev + 1, confidenceThreshold));
                } else {
                  // Only reset confidence if enough time has passed
                  if (currentTime - lastValidPoseTime.current > MIN_POSE_INTERVAL) {
                    setStateConfidence(0);
                  }
                }

                // Count rep with more lenient conditions
                if (
                  (stateConfidence >= confidenceThreshold - 1 || 
                   currentTime - lastValidPoseTime.current > MIN_POSE_INTERVAL) &&
                  formCheck.state !== lastPoseState
                ) {
                  if (formCheck.state === 'up' && lastPoseState === 'down') {
                    setExerciseStats(prev => ({
                      ...prev,
                      count: prev.count + 1,
                      score: (prev.count + 1) * formCheck.accuracy
                    }));
                    lastValidPoseTime.current = currentTime;
                  }
                  setLastPoseState(formCheck.state);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in pose detection:', error);
        }
      }

      detectionRef.current = requestAnimationFrame(detectPose);
    }

    if (isExerciseStarted) {
      detectPose();
    }

    return () => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
    };
  }, [detector, isExerciseStarted, lastPoseState, selectedExercise, stateConfidence]);


  
  // Rest of the component (drawPose and return statement) remains the same...
  const drawPose = (pose, ctx) => {
    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
      }
    });

    // Draw skeleton
    const connections = [
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
      const firstPoint = pose.keypoints.find(kp => kp.name === first);
      const secondPoint = pose.keypoints.find(kp => kp.name === second);

      if (firstPoint?.score > 0.3 && secondPoint?.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(firstPoint.x, firstPoint.y);
        ctx.lineTo(secondPoint.x, secondPoint.y);
        ctx.stroke();
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      {!isExerciseStarted ? (
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Select Exercise</h2>
          <div className="space-y-4">
            {EXERCISE_TYPES.map((exercise) => (
              <div
                key={exercise.id}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedExercise?.id === exercise.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedExercise(exercise)}
              >
                <h3 className="font-semibold">{exercise.name}</h3>
                <p className="text-gray-600">{exercise.description}</p>
                <p className="text-sm text-gray-500 mt-2">{exercise.instructions}</p>
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            onClick={() => setIsExerciseStarted(true)}
            disabled={!selectedExercise}
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <div className="relative max-w-2xl mx-auto">
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
          <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg">
            <h3 className="font-bold text-xl">{selectedExercise.name}</h3>
            <p className="text-3xl font-bold text-blue-600">Reps: {exerciseStats.count}</p>
            <p className="text-lg">Accuracy: {exerciseStats.accuracy}%</p>
            <p className="text-lg">Score: {exerciseStats.score}</p>
            {exerciseStats.feedback && (
              <p className="text-orange-500 font-medium mt-2">{exerciseStats.feedback}</p>
            )}
            <button
              className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              onClick={() => {
                // Stop all tracks from the video stream
                if (videoRef.current?.srcObject) {
                  const tracks = videoRef.current.srcObject.getTracks();
                  tracks.forEach(track => track.stop());
                  videoRef.current.srcObject = null;
                }
                
                // Clear the canvas
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
                
                // Cancel any ongoing animation frame
                if (detectionRef.current) {
                  cancelAnimationFrame(detectionRef.current);
                  detectionRef.current = null;
                }
                
                // Reset all states
                setIsExerciseStarted(false);
                setSelectedExercise(null);
                setExerciseStats({
                  count: 0,
                  accuracy: 0,
                  feedback: '',
                  score: 0
                });
                setLastPoseState(null);
                setStateConfidence(0);
              }}
            >
              End Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseDetection;