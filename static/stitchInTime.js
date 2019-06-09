//game modes

let gameActive = false;
let judgingMode = false;
let gameStarted;


// game parameters

const targetRotations = 10;
const numberOfPlayers = 1;


// initialise player arrays (for players and keypresses)

const players = new Array(numberOfPlayers);
const playerKeycodes = new Array(numberOfPlayers);

//configure game audio
const introPip = new simpleSynth(360, 1, 0); // intro pip voice
const voices = new Array(numberOfPlayers);

const lowestFrequency = 220; //starting frequency of lowest audio voice
const frequencyIncrease = 7; //frequency increase on success

//configure players and audio voices

for (let i = 0; i < numberOfPlayers; i++) {
    players[i] = new Rotator(targetRotations); //object for player
    playerKeycodes[i] = `Digit${i}`; //key code for player
    voices[i] = new simpleSynth(lowestFrequency * (1 + (i * .3)), 2, 2 + (i * .25)); //synth voice for player (off-set by small amounts)
}

const newGame = () => {
    console.log('Starting new game...')
    gameStarted = new Date(); //get the start of the time
    players.map((player) => player.startedAt = gameStarted); //set the start times for every player
    gameActive = true; //start 'listening' to any rotations
    judgingMode = false; //ensure judging mode is off
}

const gameOver = () => {
    console.log('Game over. Press "N" to start a new game...');
    players.map((player)=> player.reset()); //reset the internal rotation and time values of each player
    voices.map((voice)=>{ voice.carrier.frequency.value = voice.carrierFreq }); //set the voices back to their intitial carrier frequencies
    gameActive = false; //game is no longer active, don't 'listen' for rotations
    judgingMode = false; //leave juding mode
}

document.onkeypress = (e) => {
    if (e.code == 'KeyN' && !gameActive) { //game not active, N key pressed
        newGame(); //start everything!
    }
    if (gameActive && !judgingMode) {
        let playerPressed = playerKeycodes.indexOf(e.code); //check if the key pressed is a plyer key
        if (playerPressed > -1) {
            let rotated = players[playerPressed].rotate(); //rotate if not at max
            if (rotated) { //play a sound if a rotation happened
                voices[playerPressed].simpleEnv(audioCtx.currentTime, voices[playerPressed].carrier.frequency.value+=frequencyIncrease, 10, 50);
            }
            if (players[playerPressed].finished() && !players[playerPressed].finishedAt) { //the player has finished and doesn't have a finishing time  
                players[playerPressed].finishedAt = new Date(); //set the finish time
            }
        }
        if (players.every((player) => player.finished())) { // if every player has finished
            judgingMode = true; //start juding
            console.log("Going to judging mode");
        }
    }
    if (gameActive && judgingMode) {
        if (e.code == 'KeyJ') { //finish judging
            players.forEach((player, index) => {
                console.log(player.timeTaken(), index); //log race times
            });
            gameOver(); //reset everything 
        }
    }
}