// Context of the canvas for drawing
// Keeps track of the last point where the user's finger was detected
let ctx;
let previousPoint = null;

// Initializes the canvas for drawing
const initCanvas = () => {
  // Select the canvas element
  const $canvas = document.querySelector(".canvas");
  // Get its 2D drawing context
  ctx = $canvas.getContext("2d");
};

// Initializes and returns the video feed from the user's webcam
const initVideoFeed = async () => {
  // Select the video element to display the webcam feed
  const $video = document.querySelector(".video");
  // Fetch webcam feed
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  // Assign the webcam feed to the video element and play it
  $video.srcObject = stream;
  $video.play();
  return $video;
};

// Initializes the HandPose model for hand detection and gesture recognition
const initHandPoseModel = async ($video) => {
  // Initialize the HandPose model with the video feed
  const handpose = await ml5.handpose($video, modelReady);
  // Register a callback function to execute whenever a hand gesture prediction is made
  handpose.on("predict", resultHandler);
};

// Handles the predictions made by the HandPose model
const resultHandler = (results) => {
  // Get the selected color from the color picker
  const selectedColor = document.getElementById("colorPicker").value;
  // Get the selected stroke width from the input range
  const selectedStrokeWidth = document.getElementById("strokeWidth").value;
  document.getElementById("strokeWidthDisplay").innerText = selectedStrokeWidth; // Display the selected stroke width

  // Set drawing line width and color
  ctx.lineWidth = selectedStrokeWidth;
  ctx.strokeStyle = selectedColor;

  // If no hand is detected, reset previousPoint and exit
  if (!results.length) {
    previousPoint = null;
    return;
  }

  // Get the coordinates for the tip of the index finger from the prediction
  const indexFingerTip = results[0].landmarks[8];

  // If there was a previous point detected, draw a line from it to the current fingertip position
  if (previousPoint) {
    ctx.beginPath();
    ctx.moveTo(previousPoint[0], previousPoint[1]);
    ctx.lineTo(indexFingerTip[0], indexFingerTip[1]);
    ctx.stroke();
  }

  // Update the previous point with the current fingertip position for the next prediction
  previousPoint = indexFingerTip;
};

// Callback function executed when the HandPose model is loaded and ready
const modelReady = () => {
  console.log("HandPose model loaded");
};

// Clears the canvas drawing and resets the previous point
const clearCanvas = () => {
  ctx.clearRect(0, 0, 640, 480);
  previousPoint = null;
};

// Initializes voice recognition to detect and act on specific spoken commands
const initVoiceRecognition = () => {
  // Check for browser support for the Web Speech API
  if (!("webkitSpeechRecognition" in window)) {
    console.warn(
      "Web Speech API is not supported by this browser. Upgrade to Chrome version 25 or later."
    );
    return;
  }

  // Create a new voice recognition instance
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true; // Continuous recognition, doesn't stop after first result
  recognition.interimResults = true; // Capture interim (not final) results

  // Handle the recognition results
  recognition.onresult = function (event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const spokenWord = event.results[i][0].transcript.trim().toLowerCase();
        // If the word "clear" is spoken, clear the canvas
        if (spokenWord === "clear") {
          clearCanvas();
        }
      }
    }
  };

  // Log any errors
  recognition.onerror = function (event) {
    console.error("Voice recognition error:", event);
  };

  // Restart recognition when it ends, making it continuous
  recognition.onend = function () {
    recognition.start();
  };

  // Start voice recognition
  recognition.start();
};

// Main initialization function to set up canvas, video feed, handpose model, and voice recognition
const init = async () => {
  console.log("ml5 version:", ml5.version); // Log the version of ml5 library
  initCanvas(); // Setup canvas
  const $video = await initVideoFeed(); // Setup webcam feed
  await initHandPoseModel($video); // Setup HandPose model
  initVoiceRecognition(); // Initialize voice recognition
};

// Start the application by calling the main initialization function
init();

// code sources: https://ml5js.org/, https://www.w3schools.com/
