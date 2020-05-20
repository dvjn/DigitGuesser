let model;
let msgBox;
let blockScroll = false;
let modelLoaded = false;

const msgs = {
  LOADING: "Loading 🤷",
  INITIAL: "Draw Here 👆",
  PREDICTING: "Guessing 🤔",
  PREDICTED: {
    HIGH_PROB: ["Definitely a {} 😎", "It is a {} 😎"],
    MID_PROB: ["Looks like a {} 😏", "It should be a {} 😏"],
    LOW_PROB: ["Is it a {} 🤔", "May be a {} 🤔", "I guess a {} 🤔"],
  },
};

// Prediction functions

function getImage() {
  const snapshot = get();
  snapshot.resize(28, 28);
  snapshot.loadPixels();
  let image = [];
  for (let i = 0; i < 784; i++) {
    image[i] = snapshot.pixels[i * 4] / 255.0;
  }
  return tf.tensor(image).reshape([1, 28, 28, 1]);
}

function isEmptyImage(image) {
  return image.sum().dataSync()[0] == 0;
}

function predict(model, image) {
  const prediction = model.predict(image);
  return Array.from(prediction.flatten().dataSync());
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showResult(prediction, prob) {
  const guessMsgs =
    prob > 0.999
      ? msgs.PREDICTED.HIGH_PROB
      : prob > 0.9
      ? msgs.PREDICTED.MID_PROB
      : msgs.PREDICTED.LOW_PROB;
  msgBox.innerHTML = choose(guessMsgs).replace(
    "{}",
    "<b>" + prediction + "</b>"
  );
}

function makePrediction(model) {
  msgBox.innerHTML = msgs.PREDICTING;
  const image = getImage();
  if (isEmptyImage(image)) {
    msgBox.innerHTML = msgs.INITIAL;
  } else {
    const probabilities = predict(model, image);
    const maxProbability = max(probabilities);
    const prediction = probabilities.indexOf(maxProbability);
    showResult(prediction, maxProbability);
  }
}

// p5 Functions

function setup() {
  // Initialize container
  const canvasContainer = select("#canvas-container");
  const newWidth = canvasContainer.width;
  canvasContainer.style("height", newWidth + "px");

  // Initialize canvas
  const canvas = createCanvas(newWidth, newWidth);
  canvas.parent("canvas-container");
  canvas.touchStarted(() => {
    blockScroll = true;
  });
  canvas.touchEnded(() => {
    blockScroll = false;
  });
  background(0);

  // Initilize DOM events
  msgBox = select("#msg-box").elt;

  select("#clear-btn").mousePressed(() => {
    background(0);
    msgBox.innerHTML = msgs.INITIAL;
  });

  select("#guess-btn").mousePressed(() => {
    model && makePrediction(model);
  });

  // Initialize model
  tf.loadLayersModel("model/model.json").then((data) => {
    model = data;
    model.predict(tf.zeros([1, 28, 28, 1]));
    msgBox.innerHTML = msgs.INITIAL;
    modelLoaded = true;
  });
}

function draw() {
  // Draw stroke
  if (modelLoaded && mouseIsPressed) {
    strokeWeight(width / 10);
    stroke(255);
    line(pmouseX, pmouseY, mouseX, mouseY);
  }
}

function windowResized() {
  // Resize canvas on resize
  let canvasContainer = select("#canvas-container");
  let newWidth = canvasContainer.width;
  if (newWidth != width) {
    canvasContainer.style("height", newWidth + "px");
    resizeCanvas(newWidth, newWidth);
    background(0);
  }
}

function mouseDragged(e) {
  // Prevent scroll when drawing
  if (blockScroll) {
    e.preventDefault();
  }
}
