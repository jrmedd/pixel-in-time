class Countdown {
    constructor(count) {
        this.start = count
        this.count = count;
    }

    tick() {
        this.count --;
        if (this.count > 0 ){
            return false;
        }
        else {
            return true;
        }
    }
    reset() {
        this.count = this.start;
    }
}