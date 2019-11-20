
// Arrays to save all the colors
const colours = [];

// Variables to store all the graphics(which is like a new canvas in p5)
let canvasBg;
let canvasYlines;
let canvasSun;
let canvasMountain;

// variable to store movement of the terrain
let movement = 0;

// variable to store the y coordinate for horizon 
const horizon = 540;

// variable to store the amplitude of sound file loaded
let amplitude;

// Array to store the number of vertical lines to show whem music is playing
let prevLevels = new Array(45);

// An object to store the meters(path elements) in the music progress bar svg
let meters;

// Variable to store the number of meters in the svg
const numMeters = 14;

// Setup
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

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

  // playing the song here
  song.play();
  amplitude.setInput(song);

  // Getting all the meters from the svg using their id's
  let metersSvg = document.getElementById("svgDiv");
  // meters is an object
  meters = metersSvg.getElementsByTagName("path");

  // Adding click listener on each of the meters
  for(let i = 0; i < meters.length; i++) {

    meters[i].addEventListener("click", function(e) {
      console.log(song.isPlaying());
      if (typeof song != "undefined" && song.isPlaying()) {
        const currDuration = song.duration() / numMeters;
        // Using regex to get the number from id of each meter element
        let matches = this.id.match(/(\d+)/);
        if (matches) {
          song.jump(matches[0] * currDuration);
        }

      }
    });

  }

}

function draw() {
  image(canvasBg, 0, 0);
  image(canvasSun, width / 2 - canvasSun.width / 2, 60);

  noStroke();
  fill(colours[1]);
  rect(0, horizon, width, height);
  image(canvasYlines, 0, 0);

  for (let i = 0; i < 20; i++) {
    stroke(colours[0]);
    const yOffset = easeInExpo(i + movement, 0, horizon, 20) + horizon;
    line(0, yOffset, width, yOffset);
  }

  // Speed around 98bpm, Speed of terrain
  movement += 0.0875;
  if (movement >= 1) {
    movement = 0;
  }

  /* Code to draw the amplitude lines STARTS HERE */

  let level = amplitude.getLevel();

  // rectangle variables
  let spacing = 5;
  let w = width / (prevLevels.length * spacing);

  // height range of the amplitude rectanges
  let minHeight = 2;
  let maxHeight = 300;

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

  /* Code to draw the amplitude lines ENDS HERE */

  /* Code to show the music progress in meters STARTS HERE */

  if (typeof song != "undefined" && song.isPlaying()) {

    let c = song.duration() / numMeters;
    let currDuration = Math.round(song.currentTime()/c);

    for(let i = 0; i < meters.length; i++) {
      let meter = meters[numMeters - i - 1];
      if (i <= currDuration) {
        meter.classList.remove("off");
      } else {
        meter.classList.add("off");
      }
    }
  }

  /* Code to show the music progress in meters ENDS HERE */
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

  let cx = width / 2;
  let cy = height / 2;

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
