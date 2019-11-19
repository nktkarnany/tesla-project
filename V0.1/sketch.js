// Variables to save audio data
let audioContext;
let analyser;
let distortion;
let gainNode;
let buffer;
let dataArray;
let loaded = false;

const canvas = 1080;
const colours = [];

let canvasBg;
let canvasYlines;
let canvasSun;
let canvasMountain;
let cx;
let cy;
let movement = 0;
const horizon = 540;
let mountainY = 440;

// Setup
function setup() {
  createCanvas(windowWidth, windowHeight);
  //createCanvas(canvas, canvas);
  pixelDensity(1);

  cx = width / 2;
  cy = height / 2;
  colours[0] = color(164, 0, 182); // Pink
  colours[1] = color(0, 46, 68); // Night blue
  colours[2] = color(0, 255, 248); // Neon blue
  colours[3] = color(203, 0, 216); // Neon pink
  colours[4] = color(243, 255, 81); // Yellow
  colours[5] = color(249, 72, 106); // Orange

  // Draw background gradient
  canvasBg = drawBackground();
  canvasSun = drawSun();
  // Draw vertical lines
  canvasYlines = drawYlines();

  fft = new p5.FFT();
  fft.smooth(.90);
}

function draw() {
  image(canvasBg, 0, 0);
  image(canvasSun, width / 2 - canvasSun.width / 2, 60);
  // image(canvasMountain, cx - (canvasMountain.width / 2), mountainY);

  noStroke();
  fill(colours[1]);
  rect(0, horizon, width, height);
  image(canvasYlines, 0, 0);

  for (let i = 0; i < 20; i++) {
    stroke(colours[0]);
    const yOffset = easeInExpo(i + movement, 0, horizon, 20) + horizon;
    line(0, yOffset, width, yOffset);
  }

  // Speed around 98bpm
  movement += 0.1275;
  if (movement >= 1) {
    movement = 0;
  }

  mountainY -= 0.03;
  if (mountainY <= 333) {
    mountainY = 440;
  }

  if (typeof song != "undefined" && song.isPlaying()) {
    if (typeof fft != "undefined") {
      let spectrum = fft.analyze();
      console.log(spectrum);
      fill(colours[1]);
      // for(var i = 0; i < numBars; i++) {
      //     var x = map(i, 0, numBars, 0, width/1.3);
      //     var h = -height + map(spectrum[i], 0, 255, height, 0);
      //     rect(x, horizon, width / numBars, h/3);
      //     rect(width-x, horizon, width / numBars, h/3);
      // }

      beginShape();
      stroke(colours[2]);
      vertex(0, horizon);
      for (let i = 1; i < width/2; i += 32) {
        vertex(i, map(spectrum[i], 0, 255, horizon, 200));
      }

      for (let i=width/2; i<width; i +=32) {
        vertex(i, map(spectrum[i], 0, 255, horizon, 200));
      }

      vertex(width, horizon);
      endShape();
    }
  }
}

function easeInExpo(t, b, c, d) {
  return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
}

function drawBackground() {
  const sky = createGraphics(width, height);
  sky.background(colours[1]);

  // Draw gradient sky
  sky.noFill();
  for (let i = 0; i <= horizon; i++) {
    const inter = map(i, 0, horizon, 0, 1);
    const c = lerpColor(colours[0], colours[1], inter);
    sky.stroke(c);
    sky.line(0, i, width, i);
  }
  return sky;
}

function drawSun() {
  const sun = createGraphics(400, 400);
  sun.noFill();

  for (let i = 0; i <= sun.height; i++) {
    // Draw or skip?
    if (
      (i > 250 && i < 255) ||
      (i > 292 && i < 300) ||
      (i > 332 && i < 342) ||
      (i > 373 && i < 387) ||
      (i > 412 && i < 430) ||
      (i > 452 && i < 475)
    ) {
      continue;
    } else {
      // Calc colour
      const inter = map(i, 0, sun.height, 0, 1);
      const c = lerpColor(colours[4], colours[5], inter);
      sun.stroke(c);

      // Calc circle
      const s = i * 2;
      const r = sun.width;
      const lineWidth = Math.sqrt(2 * s * r - Math.pow(s, 2));
      const offset = sun.width / 2 - lineWidth / 2;
      sun.line(offset, i, lineWidth + offset, i);
    }
  }
  return sun;
}

// Draw vertical lines
function drawYlines() {
  // Horizon
  const yLines = createGraphics(width, height);
  // Vertical lines
  yLines.stroke(colours[0]);
  yLines.line(0, horizon, width, horizon);
  yLines.line(cx, horizon, cx, height);
  for (let i = 1; i < 18; i++) {
    const xOffset = i * 30;
    yLines.line(cx + xOffset, horizon, cx + xOffset * 10, height);
    yLines.line(cx - xOffset, horizon, cx - xOffset * 10, height);
  }
  return yLines;
}

// Event listener added to listen onclick and load a song
window.addEventListener("click", onClick);

function onClick() {
  song.play();
}

function preload() {
  song = loadSound("./audio/toto.mp3");
}
