const gameArea = document.getElementById("gameArea");
const gameControlArea = document.getElementById("gameControlArea");
const newGameButton = document.getElementById("new-game");
const connectButton = document.getElementById("connect-usb");
const startMeasureButton = document.getElementById("start-measure");
const stopMeasureButton = document.getElementById("stop-measure");
let deviceConnected = false;
let measureMode = false;
const storage = window.localStorage;
let username = storage.getItem("username");

const isStandalone = new URL(location).searchParams.get('mode') == "standalone";

if (isStandalone) {
    gameArea.style.visibility = "visible";
    gameControlArea.style.visibility = "visible";
}

const getUSBSerial = (id) => {
    navigator.usb
      .requestDevice({ filters: [{ vendorId: id }] })
      .then((device) => {
        username = device.serialNumber;
        storage.setItem('username', username);
        deviceConnected = true;
        newGameButton.style.display = "block";
        connectButton.style.display = "none";
      })
      .catch(() => alert("Unable to detect device. Try reconnecting your device and trying again."));
}


connectButton.addEventListener("click", ()=> {
    if (!username) {
        getUSBSerial(0x2886);
    }
    else {
        deviceConnected = true;
        newGameButton.style.display = "block";
        startMeasureButton.style.display = "block";
        connectButton.style.display = "none";
    }
});

startMeasureButton.addEventListener("click", ()=>{
    measureMode = confirm("Record a new task? This will clear the current task.")
    targetRotations = measureMode ? 0 : targetRotations;
    newGameButton.style.display = measureMode ? "none" : "block;"
    startMeasureButton.style.display = measureMode ? "none" : "block";
    stopMeasureButton.style.display = measureMode ? "block" : "none";
})

stopMeasureButton.addEventListener("click", ()=>{
    measureMode = false;
    newGameButton.style.display = "block";
    startMeasureButton.style.display = "block";
    stopMeasureButton.style.display = "none";
    targetRotations = Math.floor(targetRotations*0.95);
    players[0].maxRotations = targetRotations;
    storage.setItem('target', targetRotations)
    gameOver();
})

//game modes

let gameActive = false;
let judgingMode = false;
let countingDown = false;
let judgingPlayer;
let gameStarted;
let winner;

// game parameters

let targetRotations = parseInt(storage.getItem('target')) || 100;
const numberOfPlayers = 1;


// initialise player arrays (for players and keypresses)

const players = new Array(numberOfPlayers);
const playerKeycodes = new Array(numberOfPlayers);

const countdown = new Countdown(3);

//configure game audio
const introPip = new simpleSynth(360, 1, 0); // intro pip voice
const voices = new Array(numberOfPlayers);

const lowestFrequency = 220; //starting frequency of lowest audio voice
const frequencyIncrease = 7; //frequency increase on success

//configure players and audio voices

for (let i = 0; i < numberOfPlayers; i++) {
    players[i] = new Rotator(targetRotations, `Player ${i+1}`); //object for player
    playerKeycodes[i] = `Digit${i}`; //key code for player
    voices[i] = new simpleSynth(lowestFrequency * (1 + (i * .3)), 2, 2 + (i * .25)); //synth voice for player (off-set by small amounts)
}

const newGame = () => {
    console.log('Starting new game...')
    changeText("gameStatus", "Go!");
    gameStarted = new Date(); //get the start of the time
    players.map((player) => player.startedAt = gameStarted); //set the start times for every player
    gameActive = true; //start 'listening' to any rotations
    judgingMode = false; //ensure judging mode is off

}

const gameOver = () => {
    console.log('Game over. Press "N" to start a new game...');
    //fadeText("gameStatus", "<p>Game over. Press button to start...</p>");
    players.map((player)=> player.reset()); //reset the internal rotation and time values of each player
    voices.map((voice)=>{ voice.carrier.frequency.value = voice.carrierFreq }); //set the voices back to their intitial carrier frequencies
    gameActive = false; //game is no longer active, don't 'listen' for rotations
    judgingMode = false; //leave juding mode
    winner = null;
    startMeasureButton.style.display = "block";
}

newGameButton.addEventListener("transitionend", ()=>{
    console.log(newGameButton.style.opacity);
    if (newGameButton.style.opacity == 1) {
        newGameButton.style.display = "block";
    }
    else {
        newGameButton.style.display = "none";
    }
});

newGameButton.addEventListener("click", () => {
    newGameButton.style.opacity = 0;
    stopMeasureButton.style.display = "none";
    startMeasureButton.style.display = "none";
    if (!gameActive && !countingDown) { //game not active, N key pressed
        countingDown = true;
        introPip.simpleEnv(audioCtx.currentTime, 360, 10, 75);
        changeText("gameStatus", countdown.count);
        counter = setInterval(() => {
            done = countdown.tick();
            if (!done) {
                changeText("gameStatus", countdown.count);
                introPip.simpleEnv(audioCtx.currentTime, 360, 10, 75);
            } else {
                clearInterval(counter);
                countingDown = false;
                countdown.reset();
                introPip.simpleEnv(audioCtx.currentTime, 720, 10, 200);
                newGame(); //start everything!
            }

        }, 1000);
    }
})

let idleTimeout;

document.onkeypress = (e) => {
    if (gameActive && !judgingMode) {
        let playerPressed = playerKeycodes.indexOf(e.code); //check if the key pressed is a plyer key
        if (playerPressed > -1) {
            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(()=>gameOver(), 30000);
            let rotated = players[playerPressed].rotate(); //rotate if not at max
            if (rotated) { //play a sound if a rotation happened
                voices[playerPressed].simpleEnv(audioCtx.currentTime, voices[playerPressed].carrier.frequency.value+=frequencyIncrease, 10, 50);
            }
            if (players[playerPressed].finished() && !players[playerPressed].finishedAt) { //the player has finished and doesn't have a finishing time  
                voices[playerPressed].simpleEnv(audioCtx.currentTime, 100, 10, 75);
                voices[playerPressed].simpleEnv(audioCtx.currentTime+.125, 600, 10, 200);
                players[playerPressed].finishedAt = new Date(); //set the finish time
                players[playerPressed].timeTaken = (players[playerPressed].finishedAt.getTime() - players[playerPressed].startedAt.getTime()) / 1000;
            }
        }
        if (players.every((player) => player.finished())) { // if every player has finished
            clearTimeout(idleTimeout);
            judgingMode = true; //start juding
            console.log("Going to judging mode");
            fadeText("gameStatus", `<p>${players[0].timeTaken}s</p>`);
            if (navigator.onLine) {
                postScore(username, players[0].timeTaken);
            }
            else {
                saveItForLater(players[0].timeTaken, new Date().toISOString())
            }
            setTimeout(() => {
                        gameOver();
                        fadeText("gameStatus","<p></p>");
                        newGameButton.style.display = "block";
                        newGameButton.style.opacity = 1;
            },5000);
        }
    }
    if (measureMode) { 
        let playerPressed = playerKeycodes.indexOf(e.code);
        if (playerPressed > -1) {
            targetRotations +=1;
            voices[playerPressed].simpleEnv(audioCtx.currentTime, voices[playerPressed].carrier.frequency.value+=frequencyIncrease, 10, 50);
        }
    }
}

const saveItForLater = (score, timestamp)=> {
    let currentScores = storage.getItem('scores');
    let newScore = { score: score, timestamp: timestamp };
    if (currentScores) {
        storage.setItem('scores', JSON.stringify([...JSON.parse(currentScores), newScore]))
    }
    else {
        storage.setItem('scores', JSON.stringify([newScore]))
    }
}


function postScore(username, score_entry) {
    let url = `${location.origin}/entry`
    fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrer: "no-referrer",
      body: JSON.stringify({
        username: username,
        score: score_entry,
      }),
    }).then((response) => {
      if (response.status != 200) {
        saveItForLater(score_entry, new Date().toISOString());
      }
    });
}

const lateEntry = () => {
  let savedScores = storage.getItem("scores");
  if (savedScores && navigator.onLine) {
    savedScores = JSON.stringify({'username': username, 'scores': JSON.parse(savedScores)})
    let url = `${location.origin}/late-entry`;
    fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrer: "no-referrer",
      body: savedScores,
    }).then((response) => {
      if (response.status == 200) {
        storage.removeItem("scores");
      }
    });
  }
};

window.addEventListener('online', lateEntry)
window.addEventListener('load', lateEntry)