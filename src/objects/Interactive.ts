import { Body, Box, Vec3, World } from 'cannon-es';

export type Dimensions = {
    depth: number;
    width: number;
    height: number;
};

/**
 * Class to trigger actions on the intersection of an object
 * with a 3d area.
 *
 */
export class Interactive {
    dimensions: Dimensions;
    body: Body;
    onTrigger: (ev: any) => void;

    constructor(dimensions: Dimensions, onTrigger: (ev: any) => void) {
        this.onTrigger = onTrigger;
        this.dimensions = dimensions;
        const { depth, width, height } = dimensions;
        const boxShape = new Box(new Vec3(depth, height, width));

        this.body = new Body({ isTrigger: true });
        this.body.addShape(boxShape);

        this.body.addEventListener('collide', onTrigger);
    }

    get position() {
        return this.body.position;
    }

    addToWorld(world: World) {
        world.addBody(this.body);
    }

    dispose(world: World) {
        this.body.removeEventListener('collide', this.onTrigger);
        world.removeBody(this.body);
    }
}
