import { Dimensions, Interactive } from './Interactive';

export class Passenger extends Interactive {
    constructor(dimensions: Dimensions, onTrigger: (ev: any) => void) {
        super(dimensions, onTrigger);
    }
}
