import { rangeMap } from '../utils/math';

/**
 * Reflects the day cycle and tracks the game elapsed time.
 */
export class Timer {
    dayDuration: number; // day duration in minutes
    secDayDuration: number; // day duration in minutes

    currTime: number = 0; // current time in seconds
    startTime: number = 0;
    lastTime: number = 0;
    dt: number = 0;

    constructor(dayDuration: number) {
        this.dayDuration = dayDuration;
        this.secDayDuration = dayDuration * 60;
    }

    start(offset: number = 0) {
        this.startTime = Date.now() + offset;
        this.currTime = 0;

        this.lastTime = Date.now();
        this.dt = 0;
    }

    mapTime(start: number, end: number): number {
        return rangeMap(this.currTime, 0, this.secDayDuration, start, end);
    }

    getDayProgress(): number {
        return this.currTime / (this.dayDuration * 60);
    }

    isDay(): boolean {
        return this.currTime < (this.dayDuration * 60) / 2;
    }

    update() {
        this.dt = (Date.now() - this.lastTime) / 1000;
        this.currTime = (Date.now() - this.startTime) / 1000;

        this.lastTime = Date.now();

        this.currTime = this.currTime % (60 * this.dayDuration);
    }
}
