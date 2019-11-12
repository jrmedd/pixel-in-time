//game modes

let gameActive = false;
let judgingMode = false;
let countingDown = false;
let judgingPlayer;
let gameStarted;
let winner;

// game parameters

const targetRotations = 5;
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
    fadeText("gameStatus", "<p>Game over. Press button to start...</p>");
    players.map((player)=> player.reset()); //reset the internal rotation and time values of each player
    voices.map((voice)=>{ voice.carrier.frequency.value = voice.carrierFreq }); //set the voices back to their intitial carrier frequencies
    gameActive = false; //game is no longer active, don't 'listen' for rotations
    judgingMode = false; //leave juding mode
    winner = null;
}

document.onkeypress = (e) => {
    if (e.code == 'KeyN' && !gameActive && !countingDown) { //game not active, N key pressed
        countingDown = true;
        introPip.simpleEnv(audioCtx.currentTime, 360, 10, 75);
        changeText("gameStatus", countdown.count);
        counter = setInterval(()=>{
            done = countdown.tick();
            if (!done) {
                changeText("gameStatus", countdown.count);
                introPip.simpleEnv(audioCtx.currentTime, 360, 10, 75);
            }
            else {
                clearInterval(counter);
                countingDown = false;
                countdown.reset();
                introPip.simpleEnv(audioCtx.currentTime, 720, 10, 200);
                newGame(); //start everything!
            }
    
        }, 1000);
    }
    if (gameActive && !judgingMode) {
        let playerPressed = playerKeycodes.indexOf(e.code); //check if the key pressed is a plyer key
        if (playerPressed > -1) {
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
            judgingMode = true; //start juding
            console.log("Going to judging mode");
            fadeText("gameStatus", "<p>Judging...</p>");
        }
    }
    if (gameActive && judgingMode) {
        if (!players.every((player) => player.judged)) {
            judgingPlayer = players.find((player) => !player.judged);
            if (e.code == 'KeyP') {
                judgingPlayer.opinion = true;
            }
            if (e.code == 'KeyF') {
                judgingPlayer.opinion = false;
            }
            if (e.code == 'KeyP' || e.code == 'KeyF') {
                appendText('gameStatus', '<p>X</p>');
                judgingPlayer.judged = true;
            }
        }
        else {
            fadeText("gameStatus", "<p>The results are in...</p>");
            let contenders = players.filter(player => player.opinion);
            if (contenders.length > 0) {
                winner = contenders.hasMin('timeTaken');
            }
        }
        if (e.code == 'KeyN' && winner) { //finish judging
            let scoreTable = '<h3>Scores</h3>';
            if (winner) {
                scoreTable += `<h4>Winner: ${winner.playerLabel}</h4><ol>`;
            }
            let times = players.concat().sort((a, b)=> a.timeTaken - b.timeTaken);
            times.forEach((player, index) => {
                let username = prompt("Who got this score?")
                postScore(username, player.timeTaken.toFixed(2), player.opinion)
                scoreTable += `<li>${player.playerLabel} – ${player.timeTaken.toFixed(2)} seconds – ${player.opinion ? "Pass" : "Fail" }</li>`;
            });
            scoreTable += '</ol>'
            fadeText("gameStatus", scoreTable);
            judgingMode = false;
            setTimeout(()=>gameOver(), 10000);
            //gameOver(); //reset everything 
        }
    }
}

function postScore(username, score_entry, judgement) {
    let url = "http://127.0.0.1:5000/entry"
    //let url = "https://pocketracerscores.xyz/entry";
    fetch(url, {
        method: "POST",
        mode: 'cors',
        cache: "no-cache",
        credentials: "omit",
        headers: {
            "Content-Type": "application/json",
            "X-Api-Key": "DigiLab"
        },
        redirect: "follow",
        referrer: "no-referrer",
        body: JSON.stringify({
            "username": username,
            "score": score_entry,
            "judgement": judgement
        })
    });
}