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

let amplitude;

let prevLevels = new Array(60);

let meters;

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

  amplitude = new p5.Amplitude();
  amplitude.smooth(0.6);

  // fft = new p5.FFT();
  // fft.smooth(.90);

  let a = document.getElementById("svgDiv");
  meters = a.getElementsByTagName("path");
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
  movement += 0.0875;
  if (movement >= 1) {
    movement = 0;
  }

  mountainY -= 0.03;
  if (mountainY <= 333) {
    mountainY = 440;
  }

  let level = amplitude.getLevel();

  // rectangle variables
  let spacing = 10;
  let w = width / (prevLevels.length * spacing);

  let minHeight = 2;
  let maxHeight = 300;
  let roundness = 20;

  // add new level to end of array
  prevLevels.push(level);

  // remove first item in array
  prevLevels.splice(0, 1);

  // loop through all the previous levels
  for (let i = 0; i < prevLevels.length; i++) {

    let x = map(i, prevLevels.length, 0, width/2, width);
    let h = map(prevLevels[i], 0, 0.5, minHeight, maxHeight);

    fill(colours[0]);
    stroke(colours[0]);

    rect(x, horizon, w, -h);
    rect(width - x, horizon, w, -h);
  }

  if (typeof song != "undefined" && song.isPlaying()) {

    let c = song.duration()/14;
    let currDuration = Math.round(song.currentTime()/c);

    for(let i = 0; i < meters.length; i++) {
      let meter = meters[14 - i - 1];
      if (i <= currDuration) {
        meter.classList.remove("off");
      } else {
        meter.classList.add("off");
      }
    }

    if (typeof fft != "undefined") {
      // let spectrum = fft.analyze();
      // fill(colours[1]);
      // stroke('rgba(0,255,248,0.3)');
      // const numBars = 128;
      // for(var i = 0; i < numBars; i++) {
      //   var x = map(i, 0, numBars, 0, width/1.3);
      //   var h = -height + map(spectrum[i], 0, 255, height, 0);
      //   rect(x, horizon, width / numBars, h/3);
      //   rect(width-x, horizon, width / numBars, h/3);
      // }

      // beginShape();
      // stroke(colours[2]);
      // vertex(0, horizon);

      // for (let i = 0; i < spectrum.length - 1; i += 56) {
      //   vertex(map(i, 0, spectrum.length - 1, 0, width / 1.3), map(spectrum[i], 0, 255, horizon, 200));
      // }

      // for (let i = spectrum.length - 1; i >= 0; i -= 56) {
      //   vertex(map(i, spectrum.length - 1, 0, width / 4, width), map(spectrum[i], 0, 255, horizon, 200));
      // }

      // vertex(width, horizon);
      // endShape();
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
  amplitude.setInput(song);
}

function preload() {
  song = loadSound("./audio/toto.mp3");
}

function logMap(val, inMin, inMax, outMin, outMax) {
  var offset = 0;
  if (inMax === 0 || inMin === 0) {
    offset = 1;
    inMin += offset;
    inMax += offset;
  }
  var a = (outMin - outMax) / Math.log10(inMin / inMax);
  var b = outMin - a * Math.log10(inMin);
  return a * Math.log10(val + offset) + b;
}
