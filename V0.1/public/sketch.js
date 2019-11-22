// Array to store all songs
const songsPath = ['./audio/fringe.mp3', './audio/final.mp3', './audio/black.mp3'];
let songs = [];
let songPlaying = 0;
let songDetails = [
  {
    title: 'Fringe Society',
    artist: 'Sami Matar - Topic'
  },
  {
    title: 'The Final Countdown',
    artist: 'Europe'
  },
  {
    title: 'Back In Black',
    artist: 'AC DC'
  }
];

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
const horizon = 1060;

// variable to store the amplitude of sound file loaded
let amplitude;

// Array to store the number of vertical lines to show whem music is playing
let prevLevels = new Array(30);

// An object to store the meters(path elements) in the music progress bar svg
let meters = [];

// Variable to store the number of meters in the svg
const numMeters = 14;

// variables for music controls
let playBtn;
let playIcon;
let pauseIcon;

//Stars
let stars = [];

// Socket for the server
let socket = io.connect(window.location.hostname + ':' + 3000);

// Array for saving the lights
let lights = [0, 0, 0, 0, 0, 0, 0, 0, 0];

// beat parameters
let isBeating = true;

// :: Beat Detect Variables
// how many draw loop frames before the beatCutoff starts to decay
// so that another beat can be triggered.
// frameRate() is usually around 60 frames per second,
// so 20 fps = 3 beats per second, meaning if the song is over 180 BPM,
// we wont respond to every beat.
let beatHoldFrames = 30;

// what amplitude level can trigger a beat?
let beatThreshold = 0.11; 

// When we have a beat, beatCutoff will be reset to 1.1*beatThreshold, and then decay
// Level must be greater than beatThreshold and beatCutoff before the next beat can trigger.
let beatCutoff = 0;
let beatDecayRate = 0.98; // how fast does beat cutoff decay?
let framesSinceLastBeat = 0; // once this equals beatHoldFrames, beatCutoff starts to decay.

let fft, peakDetect;

let isBlinking = false;

// Setup
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  colours[0] = color(164, 0, 182); // Pink
  colours[1] = color(0, 29, 40); // Night blue
  colours[2] = color(0, 255, 248); // Neon blue
  colours[3] = color(203, 0, 216); // Neon pink
  colours[4] = color(255, 0, 116); // Orange
  colours[5] = color(250, 255, 0); // Yellow
  colours[6] = color(198, 2, 99);

//setup Stars
  for(let i=0; i<100; i++) {
    stars[i] = new Star(random(0,width), random(0,horizon), random(1,2), width, height, i);
  }

  // Draw background gradient
  canvasBg = drawBackground();
  canvasSun = drawSun();
  // Draw vertical lines
  canvasYlines = drawYlines();

  amplitude = new p5.Amplitude();
  amplitude.smooth(0.6);

  // Getting all the meters from the svg using their id's
  let svgEle = document.getElementById("svgDiv");
  let svgPaths = svgEle.getElementsByTagName("path");

  // meters is an object
  for(let i = 0; i < 14; i++) {
    meters.push(svgPaths[i]);
  }

  // Playback controls
  pauseIcon = svgPaths[16];
  playBtn = svgPaths[17];
  playIcon = svgPaths[18];

  // Playback event listeners
  playBtn.addEventListener("click", playSwitch);
  pauseIcon.addEventListener("click", playSwitch);
  playIcon.addEventListener("click", playSwitch);

  // playing the song here
  pauseIcon.style.display = "none";
  resetMeters();

  svgPaths[14].addEventListener("click", playNext);
  svgPaths[15].addEventListener("click", playNext);

  svgPaths[19].addEventListener("click", playPrev);
  svgPaths[20].addEventListener("click", playPrev);

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

  fft = new p5.FFT();
  peakDetect = new p5.PeakDetect(4000, 12000, 0.2);

}

function draw() {
  image(canvasBg, 0, 0);

  // Draw Stars
  for(let i=0; i<stars.length; i++) {
		stars[i].setup();
	}

  image(canvasSun, width / 2 - canvasSun.width / 2, 250);
  image(canvasSun, width / 2 - canvasSun.width / 2, 250);
  image(canvasSun, width / 2 - canvasSun.width / 2, 250);
  image(canvasSun, width / 2 - canvasSun.width / 2, 250);

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
  movement += 0.1575;
  if (movement >= 1) {
    movement = 0;
  }

  /* Code to draw the amplitude lines STARTS HERE */

  let level = amplitude.getLevel();
  detectBeat(level);

  // rectangle variables
  let spacing = 5;
  let w = width / (prevLevels.length * spacing);

  // height range of the amplitude rectanges
  let minHeight = 0;
  let maxHeight = 400;

  // add new level to end of array
  prevLevels.push(level);

  // remove first item in array
  prevLevels.splice(0, 1);

  // loop through all the previous levels
  for (let i = 0; i < prevLevels.length; i++) {

    let x = map(i, prevLevels.length, 0, width/2, width);
    let h = map(prevLevels[i], 0, 0.5, minHeight, maxHeight);

    fill(colours[2]);
    stroke(colours[2]);

    rect(x, horizon, w, -h);
    rect(width - x, horizon, w, -h);
  }

  /* Code to draw the amplitude lines ENDS HERE */

  /* Code to show the music progress in meters STARTS HERE */

  if (typeof song != "undefined" && song.isPlaying()) {

    if (isBeating) {
      if (!isBlinking) blinkingLights();
    } else {
      if (!isBlinking) reverseBlinkingLights();
    }

    // peakDetect accepts an fft post-analysis
    fft.analyze();
    peakDetect.update(fft);
  
    if ( peakDetect.isDetected ) {
      resetLights();
      for (let i = 0; i < lights.length; i++) {
        lights[i] = 1;
        updateLights();
      }
    } else {
      resetLights();
    }

    let c = song.duration() / numMeters;
    let currDuration = Math.round(song.currentTime()/c);

    let minutes = Math.floor(song.currentTime() / 60);
    let seconds = Math.round(song.currentTime() - minutes * 60);
    document.getElementById("curr_duration").innerText = minutes + ":" + seconds;

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

function detectBeat(level) {
  if (level  > beatCutoff && level > beatThreshold){
    onBeat();
    beatCutoff = level *1.2;
    framesSinceLastBeat = 0;
  } else{
    if (framesSinceLastBeat <= beatHoldFrames){
      framesSinceLastBeat ++;
    }
    else{
      beatCutoff *= beatDecayRate;
      beatCutoff = Math.max(beatCutoff, beatThreshold);
    }
  }
}

function onBeat() {
  isBeating = !isBeating;
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
    const inter = map(i, 0, horizon, 0, 0.85);
    const c = lerpColor(colours[1], colours[6], inter);
    sky.stroke(c);
    sky.line(0, i, width, i);
  }
  return sky;
}

function drawSun() {
  const sun = createGraphics(600, 600);
  sun.noFill();

  for (let i = 0; i <= sun.height; i++) {
    // Draw or skip?
    if (
      (i > 315 && i < 327) ||
      (i > 365 && i < 377) ||
      (i > 413 && i < 429) ||
      (i > 460 && i < 482) ||
      (i > 507 && i < 535) ||
      (i > 552 && i < 590)
    ) {
      continue;
    } else {
      // Calc colour
      const inter = map(i, 0, sun.height, 0, 0.85);
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

function playSwitch() {
  if(song.isPlaying()) {
    pauseSong();
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
  } else {
    playSong();
    pauseIcon.style.display = "block";
    playIcon.style.display = "none";
  }
}

function keyPressed() {
  if (keyCode == 32) playSwitch();
  if (keyCode == 82) reset();
  if (keyCode == 39) playNext();
  if (keyCode == 37) playPrev();
  if (keyCode == 83) blinkingLights();
}

function reset() {
  song.stop();

  playIcon.style.display = "block";
  pauseIcon.style.display = "none";

  resetMeters();
}

function resetMeters() {
  for(let i = 0; i < meters.length; i++) {
    let meter = meters[numMeters - i - 1];
    meter.classList.add("off");
  }
}

function preload() {
  song = loadSound(songsPath[songPlaying]);
  for (let i = 0; i < songsPath.length; i++) {
    songs.push(loadSound(songsPath[i]));
  }
}

function playNext() {
  if (typeof song != "undefined" && song.isPlaying()) {
    song.stop();
    song = songs[nextSong(1)];
    playSong();
  } else {
    playSong();
  }
}

function playPrev() {
  if (typeof song != "undefined" && song.isPlaying()) {
    song.stop();
    song = songs[nextSong(-1)];
    playSong();
  } else {
    playSong();
  }
}

function nextSong(flag) {
  if (flag > 0) {
    if (songPlaying == songsPath.length - 1) {
      songPlaying = 0;
    } else {
      songPlaying++;
    }
  } else {
    if (songPlaying == 0) {
      songPlaying = songsPath.length - 1;
    } else {
      songPlaying--;
    }
  }
  return songPlaying;
}

function playSong() {
  song.play();
  amplitude.setInput(song);

  document.getElementById("title").innerText = songDetails[songPlaying].title;
  document.getElementById("artist").innerText = songDetails[songPlaying].artist;

  let minutes = Math.floor(song.duration() / 60);
  let seconds = Math.round(song.duration() - minutes * 60);
  document.getElementById("duration").innerText = minutes + ":" + seconds;
}

function pauseSong() {
  song.pause();
  resetLights();
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

function Star(x,y,r,width,height,arrayPosition) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.width = width;
  this.height = height;
  this.arrayPosition = arrayPosition;
  this.setup = function() {
    this.move();
    this.show();
  }
  this.move = function() {
    this.x = this.x + random(-.25,.25);
    this.y = this.y + random(-.25,.25);
    this.r = random(1,2);
  }
  this.show = function() {
    fill(color(255));
    noStroke();
    //rectMode();
    ellipse(this.x, this.y, this.r*2, this.r*2);
}

return this;
}

/* Code For Lights STARTS HERE */

function updateLights() {
  for (let i = 0; i < lights.length; i++) {
    socket.emit('status', {
      on: lights[i] == 1,
      id: i,
    });
  }
  //TweenMax.to(lights, 2, { turnedOn: 8 , snap: { turnedOn: 1 }, onUpdate: onUpdateLights, yoyo: true, ease: Power3.easeInOut });
}

function resetLights() {
  lights = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  updateLights();
}

function blinkingLights() {
  isBlinking = true;
  (function myLoop (i) {
    setTimeout(function () {
      resetLights();
      lights[lights.length - i] = 1;
      updateLights();
      if (--i) myLoop(i);
    }, 100);
  })(lights.length);
  window.setTimeout(function() {
    isBlinking = false;
  }, 1000);
}

function reverseBlinkingLights() {
  isBlinking = true;
  (function myLoop (i) {
    setTimeout(function () {
      resetLights();
      lights[i - 1] = 1;
      updateLights();
      if (--i) myLoop(i);
    }, 100);
  })(lights.length);
  window.setTimeout(function() {
    isBlinking = false;
  }, 1000);
}

socket.on('connect', function (data) {
    socket.emit('join', 'Client is connected!');
});

/* Code For Lights ENDS HERE */