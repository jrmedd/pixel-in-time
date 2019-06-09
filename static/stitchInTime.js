
const startingFrequency = 220; //starting frequency of audio
const synthFrequency = startingFrequency; //synth frequency
const frequencyIncrease = 7; //frequency increase on success

const voice1 = new simpleSynth(synthFrequency, 2, 2); //main voice
const introPip = new simpleSynth(360, 1, 0); // intro pip voice

const targetRotations = 10;
const numberOfPlayers = 2;

const players = new Array(numberOfPlayers);
const playerKeycodes = new Array(numberOfPlayers);

let gameActive = false;
let judgingMode = false;
let gameStarted;

const newGame = () => {
    gameStarted = new Date();
    gameActive = true;
    players.map((player) => player.startedAt = gameStarted);
    judgingMode = false;
}

const gameOver = () => {
    players.map((player)=> player.reset());
}

for (let i = 0; i < numberOfPlayers; i ++) {
    players[i] = new Rotator(targetRotations);
    players[i].startedAt = gameStarted;
    playerKeycodes[i] = `Digit${i}`;
}

document.onkeypress = (e) => {
    if (e.code == 'KeyN' && !gameActive){
        newGame();
    }
    if (gameActive && !judgingMode) {
        let playerPressed = playerKeycodes.indexOf(e.code);
        if (playerPressed > -1) {
            players[playerPressed].rotate();
            if (players[playerPressed].finished() && !players[playerPressed].finishedAt) {
                players[playerPressed].finishedAt = new Date();
            }
        }
        if (players.every((player) => player.finished())) {
            judgingMode = true;
            console.log("Going to judging mode");
        }
    }
    if (gameActive && judgingMode) {
        if (e.code == 'KeyJ') {
            players.forEach((player, index) => {
                console.log(player.timeTaken(), index);
            });
            gameOver();
        }
    }
}