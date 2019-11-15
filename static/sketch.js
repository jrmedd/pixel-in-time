// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
Image Classification using Feature Extraction with MobileNet. Built with p5.js
This example uses a callback pattern to create the classifier
=== */

let featureExtractor;
let classifier;
let video;
let loss;
let dogImages = 0;
let catImages = 0;
let badgerImages = 0;

function setup() {
  let canvas = createCanvas(320, 240);
  canvas.parent('video-container');
  video = createCapture(VIDEO);
  video.hide();
  // Extract the already learned features from MobileNet
  featureExtractor = ml5.featureExtractor('MobileNet', modelReady);
  // Create a new classifier using those features and give the video we want to use
  const options = { numLabels: 2 };
  classifier = featureExtractor.classification(video, options);
  // Set up the UI buttons
  setupButtons();
}

function draw() {
  image(video, 0, 0, 320, 240);
  noStroke();
}

// A function to be called when the model has been loaded
let modelReady = () => {
  console.log("Model ready")
  classifier.load(pocketModel, ()=> {
     console.log("Pocket model ready");
  });
}

// Classify the current frame.
let classify = () => {
  classifier.classify(gotResults);
}

// A util function to create UI buttons
let setupButtons = () => {
  goodPocketButton = document.getElementById('good-pocket');
  goodPocketButton.addEventListener("click", ()=>{
    classifier.addImage('good');
  });

  badPocketButton = document.getElementById('bad-pocket');
  badPocketButton.addEventListener("click", () => {
    classifier.addImage('bad');
  });

   trainModelButton = document.getElementById('train-model');
   trainModelButton.addEventListener("click", () => {
     classifier.train((lossValue) => {
       if (lossValue) {
         loss = lossValue;
         console.log(`Loss: ${loss}`);
       } else {
         console.log(`Training complete, total loss: ${loss}`);
         classify();
       }
     });
   });

  saveButton = document.getElementById('save-model');
  saveButton.addEventListener("click", () => {
    classifier.save();
  });
  document.addEventListener('keypress', (e)=>{
    if (e.keyCode == 99) {
      classify();
    }
  })
/*
  loadButton = document.getElementById('load-model');
  loadFile = document.getElementById('load-file');
  loadButton.addEventListener("click", () => {
    loadFile.click();
  });
  
  loadFile.addEventListener("change", (e)=>{
    let selectedFile = e.target.files[0];
    classifier.load(selectedFile, () => {
     console.log('Custom Model Loaded!');
    });
  });
  */
}

// Show the results
let gotResults = (err, results) => {
  if (err) {
    console.error(err);
  }
  if (results && results[0]) {
    let judgeResult = document.getElementById("judge-result");
    let judgeConfidence = results[0].confidence.toFixed(2);
    let topAnswer = results[0].label;
    if ((topAnswer == "good" || topAnswer == "bad") && judgeConfidence > .85) {
      judgeResult.textContent = `This looks like a ${results[0].label} pocket.\nI'm ${judgeConfidence*100}% sure.`
    }
    else {
      judgeResult.textContent = "This doesn't look like a pocket."
    }
    classify();
  }
}
