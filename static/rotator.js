class Rotator {
    
    constructor(maxRotations, playerLabel) {
        this.rotations = 0;
        this.maxRotations = maxRotations;
        this.playerLabel = playerLabel;
        this.startedAt;
        this.finishedAt;
        this.timeTaken;
        this.judged = false;
        this.opinion;
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

    reset() {
        this.rotations = 0;
        this.startedAt = null;
        this.finishedAt = null;
        this.timeTaken = null;
        this.judged = false;
        this.opion = null;
    }
    
}