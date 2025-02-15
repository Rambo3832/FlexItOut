// import React, { useRef, useEffect, useState } from 'react';
// import * as tf from '@tensorflow/tfjs';
// import * as poseDetection from '@tensorflow-models/pose-detection';

// function ExerciseDetection() {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [detector, setDetector] = useState(null);
//   const [exerciseCount, setExerciseCount] = useState(0);

//   // Initialize pose detector
//   useEffect(() => {
//     async function initializeDetector() {
//       await tf.ready();
//       const model = poseDetection.SupportedModels.MoveNet;
//       const detector = await poseDetection.createDetector(model);
//       setDetector(detector);
//     }
//     initializeDetector();
//   }, []);

//   // Set up webcam
//   useEffect(() => {
//     async function setupCamera() {
//       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//         throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
//       }

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: false,
//       });

//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//       }
//     }

//     setupCamera();
//   }, []);

//   // Detect poses
//   useEffect(() => {
//     let requestId;

//     async function detectPose() {
//       if (!detector || !videoRef.current || !canvasRef.current) return;

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext('2d');

//       // Make sure video is ready
//       if (video.readyState === 4) {
//         const poses = await detector.estimatePoses(video);
        
//         // Clear canvas and draw video frame
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//         // Draw keypoints
//         if (poses.length > 0) {
//           drawKeypoints(poses[0], ctx);
//         }
//       }

//       requestId = requestAnimationFrame(detectPose);
//     }

//     detectPose();

//     return () => {
//       if (requestId) {
//         cancelAnimationFrame(requestId);
//       }
//     };
//   }, [detector]);

//   // Draw keypoints function
//   const drawKeypoints = (pose, ctx) => {
//     const keypoints = pose.keypoints;
    
//     // Draw points
//     keypoints.forEach(keypoint => {
//       if (keypoint.score > 0.3) {
//         ctx.beginPath();
//         ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
//         ctx.fillStyle = 'red';
//         ctx.fill();
//       }
//     });

//     // Draw connections
//     drawSkeleton(keypoints, ctx);
//   };

//   // Draw skeleton function
//   const drawSkeleton = (keypoints, ctx) => {
//     // Define connections between points
//     const connections = [
//       ['nose', 'left_eye'], ['left_eye', 'left_ear'],
//       ['nose', 'right_eye'], ['right_eye', 'right_ear'],
//       ['left_shoulder', 'right_shoulder'], 
//       ['left_shoulder', 'left_elbow'],
//       ['right_shoulder', 'right_elbow'],
//       ['left_elbow', 'left_wrist'],
//       ['right_elbow', 'right_wrist'],
//       ['left_shoulder', 'left_hip'],
//       ['right_shoulder', 'right_hip'],
//       ['left_hip', 'right_hip'],
//       ['left_hip', 'left_knee'],
//       ['right_hip', 'right_knee'],
//       ['left_knee', 'left_ankle'],
//       ['right_knee', 'right_ankle']
//     ];

//     ctx.strokeStyle = 'blue';
//     ctx.lineWidth = 2;

//     connections.forEach(([first, second]) => {
//       const firstPoint = keypoints.find(kp => kp.name === first);
//       const secondPoint = keypoints.find(kp => kp.name === second);

//       if (firstPoint && secondPoint && firstPoint.score > 0.3 && secondPoint.score > 0.3) {
//         ctx.beginPath();
//         ctx.moveTo(firstPoint.x, firstPoint.y);
//         ctx.lineTo(secondPoint.x, secondPoint.y);
//         ctx.stroke();
//       }
//     });
//   };

//   return (
//     <div className="relative max-w-2xl mx-auto mt-8">
//       <div className="relative">
//         <video
//           ref={videoRef}
//           className="hidden"
//           autoPlay
//           playsInline
//           width="640"
//           height="480"
//         />
//         <canvas
//           ref={canvasRef}
//           className="rounded-lg shadow-lg"
//           width="640"
//           height="480"
//         />
//       </div>
//       <div className="mt-4 p-4 bg-white rounded-lg shadow">
//         <h2 className="text-xl font-bold">Exercise Count: {exerciseCount}</h2>
//       </div>
//     </div>
//   );
// }

// export default ExerciseDetection;



import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

const EXERCISE_TYPES = [
  { 
    id: 'pushup', 
    name: 'Push-ups',
    description: 'Upper body strength exercise',
    keypoints: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist']
  },
  { 
    id: 'squat', 
    name: 'Squats',
    description: 'Lower body strength exercise',
    keypoints: ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle']
  }
];

function ExerciseDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isExerciseStarted, setIsExerciseStarted] = useState(false);
  const [lastPoseState, setLastPoseState] = useState(null);
  
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

    if (isExerciseStarted) {
      setupCamera();
    }
  }, [isExerciseStarted]);

  // Function to check pushup state
  const checkPushupState = (keypoints) => {
    const leftElbow = keypoints.find(kp => kp.name === 'left_elbow');
    const rightElbow = keypoints.find(kp => kp.name === 'right_elbow');
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
    
    if (!leftElbow || !rightElbow || !leftShoulder || !rightShoulder) return null;
    
    // Calculate average elbow height relative to shoulders
    const elbowHeight = (leftElbow.y + rightElbow.y) / 2;
    const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
    
    // If elbows are significantly below shoulders, consider it "down" position
    return (elbowHeight - shoulderHeight) > 30 ? 'down' : 'up';
  };

  // Function to check squat state
  const checkSquatState = (keypoints) => {
    const leftKnee = keypoints.find(kp => kp.name === 'left_knee');
    const rightKnee = keypoints.find(kp => kp.name === 'right_knee');
    const leftHip = keypoints.find(kp => kp.name === 'left_hip');
    const rightHip = keypoints.find(kp => kp.name === 'right_hip');
    
    if (!leftKnee || !rightKnee || !leftHip || !rightHip) return null;
    
    // Calculate knee angle
    const kneeHeight = (leftKnee.y + rightKnee.y) / 2;
    const hipHeight = (leftHip.y + rightHip.y) / 2;
    
    // If knees are significantly bent, consider it "down" position
    return (kneeHeight - hipHeight) > 50 ? 'down' : 'up';
  };

  // Detect poses and count reps
  useEffect(() => {
    let requestId;

    async function detectPose() {
      if (!detector || !videoRef.current || !canvasRef.current || !selectedExercise) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState === 4) {
        const poses = await detector.estimatePoses(video);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (poses.length > 0) {
          drawKeypoints(poses[0], ctx);
          
          // Check exercise state and count reps
          let currentState = null;
          if (selectedExercise.id === 'pushup') {
            currentState = checkPushupState(poses[0].keypoints);
          } else if (selectedExercise.id === 'squat') {
            currentState = checkSquatState(poses[0].keypoints);
          }

          if (currentState && lastPoseState && currentState !== lastPoseState) {
            if (currentState === 'up' && lastPoseState === 'down') {
              setExerciseCount(prev => prev + 1);
            }
          }
          setLastPoseState(currentState);
        }
      }

      requestId = requestAnimationFrame(detectPose);
    }

    if (isExerciseStarted) {
      detectPose();
    }

    return () => {
      if (requestId) {
        cancelAnimationFrame(requestId);
      }
    };
  }, [detector, selectedExercise, isExerciseStarted, lastPoseState]);



  // Your existing drawKeypoints and drawSkeleton functions remain the same
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






  const handleStartExercise = () => {
    if (!selectedExercise) {
      alert('Please select an exercise first');
      return;
    }
    setIsExerciseStarted(true);
    setExerciseCount(0);
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
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            onClick={handleStartExercise}
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
          <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold">{selectedExercise.name}</h3>
            <p className="text-2xl font-bold">Reps: {exerciseCount}</p>
            <button
              className="mt-2 bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
              onClick={() => {
                setIsExerciseStarted(false);
                setSelectedExercise(null);
                setExerciseCount(0);
              }}
            >
              Stop Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseDetection;