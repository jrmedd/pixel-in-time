class Rotator {
    
    constructor(maxRotations) {
        this.rotations = 0;
        this.maxRotations = maxRotations;
        this.startedAt;
        this.finishedAt;
    }

    rotate() {
        if (this.rotations < this.maxRotations) {
            this.rotations +=1 ;
            return true;
        }
        return false;
    }
    finished() {
        return this.rotations >= this.maxRotations;
    }
    timeTaken() {
        if (this.startedAt && this.finishedAt) {
            return (this.finishedAt.getTime() - this.startedAt.getTime())/1000;
        }
    }

    reset() {
        this.rotations = 0;
        this.startedAt = null;
        this.finishedAt = null;
    }
    
}