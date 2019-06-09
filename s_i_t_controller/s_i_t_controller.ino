#include "Keyboard.h"
#include <Bounce2.h>

int p1_magnet = 7;
Bounce p1_state;

void setup() {
  pinMode(p1_magnet, INPUT_PULLUP);
  p1_state = Bounce(p1_magnet, 5);
}

void loop() {
 p1_state.update();
 if (p1_state.fell()) {
  Keyboard.write(48);
 }
}
