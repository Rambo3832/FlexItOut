import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { X } from 'lucide-react';

const EXERCISE_TYPES = [
  {
    id: 'pushup',
    name: 'Push-ups',
    description: 'Upper body strength exercise',
    instructions: 'Keep your back straight and lower your chest until your elbows form 90 degrees',
    targetAngles: {
      elbow: { min: 70, max: 110 },
      back: { min: 160, max: 200 }
    },
    keypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist']
  },
  {
    id: 'squat',
    name: 'Squats',
    description: 'Lower body strength exercise',
    instructions: 'Keep your back straight and lower your body until thighs are parallel to ground',
    targetAngles: {
      knee: { min: 80, max: 100 },
      hip: { min: 70, max: 100 }
    },
    keypoints: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle']
  },
  {
    id: 'lunges',
    name: 'Lunges',
    description: 'Lower body and balance exercise',
    instructions: 'Step forward and lower your back knee towards the ground',
    targetAngles: {
      frontKnee: { min: 85, max: 105 },
      backKnee: { min: 85, max: 105 },
      torso: { min: 160, max: 200 }
    },
    keypoints: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle']
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'Core strength and stability exercise',
    instructions: 'Maintain a straight line from head to heels',
    targetAngles: {
      elbow: { min: 85, max: 95 },
      back: { min: 170, max: 190 }
    },
    keypoints: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist', 'left_hip', 'right_hip', 'left_ankle', 'right_ankle']
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

  // Improved angle calculation with confidence threshold
  const calculateAngle = (pointA, pointB, pointC, confidenceThreshold = 0.3) => {
    if (!pointA?.score || !pointB?.score || !pointC?.score) return null;
    if (pointA.score < confidenceThreshold || pointB.score < confidenceThreshold || pointC.score < confidenceThreshold) return null;

    const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                   Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  // Add a function to validate required keypoints
  const validateKeypoints = (pose, requiredKeypoints, confidenceThreshold = 0.3) => {
    if (!pose?.keypoints) return false;
    
    const validKeypoints = requiredKeypoints.filter(keypointName => {
      const keypoint = pose.keypoints.find(kp => kp.name === keypointName);
      return keypoint && keypoint.score >= confidenceThreshold;
    });

    return validKeypoints.length === requiredKeypoints.length;
  };

  // Add a function to calculate exercise-specific angles
  const calculateExerciseAngles = (pose, exercise) => {
    const angles = {};
    
    switch (exercise.id) {
      case 'pushup':
        const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
        const leftElbow = pose.keypoints.find(kp => kp.name === 'left_elbow');
        const leftWrist = pose.keypoints.find(kp => kp.name === 'left_wrist');
        const rightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');
        const rightElbow = pose.keypoints.find(kp => kp.name === 'right_elbow');
        const rightWrist = pose.keypoints.find(kp => kp.name === 'right_wrist');
  
        angles.leftElbow = calculateAngle(leftShoulder, leftElbow, leftWrist);
        angles.rightElbow = calculateAngle(rightShoulder, rightElbow, rightWrist);
        break;
  
      case 'squat':
        const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
        const leftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
        const leftAnkle = pose.keypoints.find(kp => kp.name === 'left_ankle');
        const rightHip = pose.keypoints.find(kp => kp.name === 'right_hip');
        const rightKnee = pose.keypoints.find(kp => kp.name === 'right_knee');
        const rightAnkle = pose.keypoints.find(kp => kp.name === 'right_ankle');
  
        angles.leftKnee = calculateAngle(leftHip, leftKnee, leftAnkle);
        angles.rightKnee = calculateAngle(rightHip, rightKnee, rightAnkle);
        break;
  
      case 'lunges':
        const lungLeftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
        const lungLeftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
        const lungLeftAnkle = pose.keypoints.find(kp => kp.name === 'left_ankle');
        const lungRightHip = pose.keypoints.find(kp => kp.name === 'right_hip');
        const lungRightKnee = pose.keypoints.find(kp => kp.name === 'right_knee');
        const lungRightAnkle = pose.keypoints.find(kp => kp.name === 'right_ankle');
  
        angles.frontKnee = calculateAngle(lungLeftHip, lungLeftKnee, lungLeftAnkle);
        angles.backKnee = calculateAngle(lungRightHip, lungRightKnee, lungRightAnkle);
        break;
  
      case 'plank':
        const plankLeftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
        const plankLeftElbow = pose.keypoints.find(kp => kp.name === 'left_elbow');
        const plankLeftWrist = pose.keypoints.find(kp => kp.name === 'left_wrist');
        const plankRightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');
        const plankRightElbow = pose.keypoints.find(kp => kp.name === 'right_elbow');
        const plankRightWrist = pose.keypoints.find(kp => kp.name === 'right_wrist');
  
        angles.leftElbow = calculateAngle(plankLeftShoulder, plankLeftElbow, plankLeftWrist);
        angles.rightElbow = calculateAngle(plankRightShoulder, plankRightElbow, plankRightWrist);
        break;
    }
  
    return angles;
  };
  
  const determineExerciseState = (angles, exercise) => {
    let state = null;
    let feedback = '';
    let accuracy = 100;
  
    switch (exercise.id) {
      case 'pushup':
        const elbowAngle = angles.leftElbow || angles.rightElbow;
        if (elbowAngle) {
          if (elbowAngle < exercise.targetAngles.elbow.min) {
            state = 'down';
            feedback = 'Good depth! Push back up';
          } else if (elbowAngle > exercise.targetAngles.elbow.max) {
            state = 'up';
            feedback = 'Lower your body more';
            accuracy -= 15;
          } else {
            state = 'transition';
            feedback = 'Good form! Keep going';
          }
        }
        break;
  
      case 'squat':
        const kneeAngle = angles.leftKnee || angles.rightKnee;
        if (kneeAngle) {
          if (kneeAngle < exercise.targetAngles.knee.min) {
            state = 'down';
            feedback = 'Great depth! Stand back up';
          } else if (kneeAngle > exercise.targetAngles.knee.max) {
            state = 'up';
            feedback = 'Squat deeper';
            accuracy -= 15;
          } else {
            state = 'transition';
            feedback = 'Good form! Keep going';
          }
        }
        break;
  
      case 'lunges':
        const frontKneeAngle = angles.frontKnee;
        const backKneeAngle = angles.backKnee;
        if (frontKneeAngle && backKneeAngle) {
          if (frontKneeAngle < exercise.targetAngles.frontKnee.min || 
              backKneeAngle < exercise.targetAngles.backKnee.min) {
            state = 'down';
            feedback = 'Good depth! Push back up';
          } else if (frontKneeAngle > exercise.targetAngles.frontKnee.max || 
                     backKneeAngle > exercise.targetAngles.backKnee.max) {
            state = 'up';
            feedback = 'Lunge deeper';
            accuracy -= 15;
          } else {
            state = 'transition';
            feedback = 'Good form! Keep going';
          }
        }
        break;
  
      case 'plank':
        const plankElbowAngle = angles.leftElbow || angles.rightElbow;
        if (plankElbowAngle) {
          if (plankElbowAngle < exercise.targetAngles.elbow.min) {
            state = 'incorrect';
            feedback = 'Raise your body slightly';
            accuracy -= 15;
          } else if (plankElbowAngle > exercise.targetAngles.elbow.max) {
            state = 'incorrect';
            feedback = 'Lower your body slightly';
            accuracy -= 15;
          } else {
            state = 'correct';
            feedback = 'Great plank form! Keep holding';
          }
        }
        break;
    }
  
    return { state, feedback, accuracy };
  };

  // Check exercise state and form with confidence tracking
  const checkExerciseForm = (pose) => {
    if (!selectedExercise || !pose.keypoints) return null;

    // Validate required keypoints are visible
    const isValidPose = validateKeypoints(pose, selectedExercise.keypoints);
    if (!isValidPose) {
      return {
        state: null,
        feedback: 'Please ensure your full body is visible',
        accuracy: 0,
        isValidPose: false
      };
    }

    // Calculate angles for the current exercise
    const angles = calculateExerciseAngles(pose, selectedExercise);
    
    // Determine exercise state and feedback
    const { state, feedback, accuracy } = determineExerciseState(angles, selectedExercise);

    return {
      state,
      feedback,
      accuracy,
      isValidPose: true
    };
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
          
          // Clear and draw video frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (poses.length > 0) {
            const pose = poses[0];
            
            // Draw skeleton
            drawPose(pose, ctx);
            
            // Calculate and check form
            const formCheck = checkExerciseForm(pose);
            
            if (formCheck) {
              // Draw form guidelines
              drawFormGuidelines(ctx, pose, selectedExercise);
              
              // Draw angle measurements
              const angles = calculateExerciseAngles(pose, selectedExercise);
              drawAngleMeasurements(ctx, pose, angles);
              
              // Update stats
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

  // Add this function after your other helper functions
  const drawFormGuidelines = (ctx, pose, exercise) => {
    if (!pose || !exercise) return;

    // Set drawing styles for guidelines
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;

    // Draw exercise-specific guidelines
    switch (exercise.id) {
      case 'pushup':
        // Draw back alignment line
        const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
        const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
        if (leftShoulder?.score > 0.3 && leftHip?.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(leftShoulder.x, leftShoulder.y);
          ctx.lineTo(leftHip.x, leftHip.y);
          ctx.stroke();
        }
        break;

      case 'squat':
        // Draw depth line
        const leftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
        if (leftKnee?.score > 0.3) {
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, leftKnee.y);
          ctx.lineTo(ctx.canvas.width, leftKnee.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
    }
  };

  // Add this function to draw angle measurements
  const drawAngleMeasurements = (ctx, pose, angles) => {
    if (!pose || !angles) return;

    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;

    Object.entries(angles).forEach(([angleName, angle]) => {
      if (angle) {
        // Find appropriate keypoint to place text
        const keypoint = pose.keypoints.find(kp => kp.name.includes(angleName.toLowerCase()));
        if (keypoint?.score > 0.3) {
          const text = `${Math.round(angle)}°`;
          ctx.strokeText(text, keypoint.x + 10, keypoint.y + 10);
          ctx.fillText(text, keypoint.x + 10, keypoint.y + 10);
        }
      }
    });
  };

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

  // Add this component for the exercise info overlay
  const ExerciseInfoOverlay = ({ exercise, stats, onEnd }) => {
    return (
      <div className="absolute top-4 left-4 bg-white/90 p-4 rounded-lg shadow-lg max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xl">{exercise.name}</h3>
          <button
            onClick={() => {
              // Cancel animation frame before ending
              if (detectionRef.current) {
                cancelAnimationFrame(detectionRef.current);
                detectionRef.current = null;
              }
              onEnd();
            }}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold text-blue-600">
            Reps: {stats.count}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-lg">Accuracy:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 rounded-full h-4 transition-all duration-300"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <span className="text-lg">{stats.accuracy}%</span>
          </div>
          <p className="text-lg">Score: {stats.score}</p>
          {stats.feedback && (
            <div className={`p-2 rounded ${
              stats.feedback.includes('Good') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {stats.feedback}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add this component for exercise instructions
  const ExerciseInstructions = ({ exercise }) => {
    return (
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg">
        <h4 className="font-semibold mb-2">Instructions:</h4>
        <p>{exercise.instructions}</p>
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Tips: </span>
          {exercise.id === 'pushup' && "Keep your core tight and body straight"}
          {exercise.id === 'squat' && "Keep your chest up and knees aligned with toes"}
          {exercise.id === 'plank' && "Maintain a straight line from head to heels"}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isExerciseStarted ? (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Choose Your Exercise
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EXERCISE_TYPES.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`relative overflow-hidden rounded-xl shadow-md transition-all duration-300 cursor-pointer ${
                    selectedExercise?.id === exercise.id 
                      ? 'ring-2 ring-blue-500 transform scale-105' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedExercise(exercise)}
                >
                  <div className="p-6 bg-white">
                    <h3 className="text-xl font-semibold mb-2">{exercise.name}</h3>
                    <p className="text-gray-600 mb-4">{exercise.description}</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Instructions:</h4>
                      <p className="text-sm text-gray-600">{exercise.instructions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button
                className={`px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 ${
                  selectedExercise
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => setIsExerciseStarted(true)}
                disabled={!selectedExercise}
              >
                Start Exercise
              </button>
            </div>
          </div>
        ) : (
          <div className="relative max-w-4xl mx-auto">
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
              className="w-full rounded-2xl shadow-xl"
              width="640"
              height="480"
            />
            
            {/* Exercise Info Overlay */}
            <div className="absolute top-4 left-4 bg-white/95 p-6 rounded-xl shadow-lg max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedExercise.name}</h2>
                <button
                  onClick={() => {
                    if (videoRef.current?.srcObject) {
                      const tracks = videoRef.current.srcObject.getTracks();
                      tracks.forEach(track => track.stop());
                    }
                    setIsExerciseStarted(false);
                    setSelectedExercise(null);
                  }}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Reps</span>
                    <span className="text-3xl font-bold text-blue-600">{exerciseStats.count}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Score</span>
                    <span className="text-2xl font-semibold">{exerciseStats.score}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Accuracy</span>
                    <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${exerciseStats.accuracy}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {exerciseStats.feedback && (
                  <div className={`p-3 rounded-lg ${
                    exerciseStats.feedback.includes('Good')
                      ? 'bg-green-50 text-green-700'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {exerciseStats.feedback}
                  </div>
                )}
              </div>
            </div>
            
            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 p-4 rounded-xl shadow-lg">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <p className="text-gray-600">{selectedExercise.instructions}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExerciseDetection;