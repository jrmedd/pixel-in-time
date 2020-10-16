#include <TinyUSB_Mouse_and_Keyboard.h>
#include <Bounce2.h>

int passJudge = 7;
int failJudge = 6;

int newGame = 5;

int p1Magnet = 0;

Bounce passJudgeState;
Bounce failJudgeState;

Bounce newGameState;

int p1MagnetReading;
int p1MagnetPrevReading = 0;

int p1TriggerState = 0;
int p1TriggerPrevState = 0;

int p1TriggerThreshold = 520;

int passCode = 80;
int failCode = 70;
int newGameCode = 78;
int p1Code = 48;

void setup() {
    pinMode(passJudge, INPUT_PULLUP);
    pinMode(failJudge, INPUT_PULLUP);
    pinMode(newGame, INPUT_PULLUP);

    passJudgeState = Bounce(passJudge, 5);
    failJudgeState = Bounce(failJudge, 5);
    newGameState = Bounce(newGame, 5);
}
void loop() {
    delay(5);
    p1MagnetReading = analogRead(p1Magnet);
    //Serial.println(p1MagnetReading);
    
    if (p1MagnetReading != p1MagnetPrevReading) {
        if (p1MagnetReading > p1TriggerThreshold) {
            p1TriggerState = 1;
        }
        else {
            p1TriggerState = 0;
        }
    }
    if (p1TriggerState != p1TriggerPrevState) {
        if (p1TriggerState == 1) {
        Keyboard.write(p1Code);
        }
    }
    p1MagnetPrevReading = p1MagnetReading;
    p1TriggerPrevState = p1TriggerState;

    passJudgeState.update();
    failJudgeState.update();
    newGameState.update();

    if (passJudgeState.fell()) {
        //Keyboard.write(passCode);
    }
    if (failJudgeState.fell()) {
        //Keyboard.write(failCode);
    }
    if (newGameState.fell()) {
        //.Keyboard.write(newGameCode);
    }
}
