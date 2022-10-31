import { Body, Box, Vec3, World } from 'cannon-es';
import { Scene } from 'three';

export type Dimensions = {
    depth: number;
    width: number;
    height: number;
};

export class Interactive {
    dimensions: Dimensions;
    body: Body;

    constructor(dimensions: Dimensions, onTrigger: (ev: any) => void) {
        this.dimensions = dimensions;
        const { depth, width, height } = dimensions;
        const boxShape = new Box(new Vec3(depth, height, width));

        this.body = new Body({ isTrigger: true });
        this.body.addShape(boxShape);

        this.body.addEventListener('collide', (event: any) => {
            console.log('The trigger was activated', event);
            onTrigger(event);
        });
    }

    get position() {
        return this.body.position;
    }

    addToWorld(world: World, scene: Scene) {
        world.addBody(this.body);
    }
}
