import { Ground } from './ground';
import { Sky } from './sky';
import { Timer } from './timer';
import * as CANNON from 'cannon-es';

const environmentDefaultConfig = {
    dayDuration: 5,
};

export type EnvironmentConfig = typeof environmentDefaultConfig;

export class Environment {
    config: EnvironmentConfig;
    timer: Timer;
    sky: Sky;
    ground: Ground;
    world: CANNON.World;

    constructor(
        scene: THREE.Scene,
        config: EnvironmentConfig = environmentDefaultConfig
    ) {
        this.config = config;
        
        this.timer = new Timer(config.dayDuration);
        this.sky = new Sky(this.timer, true);
        this.ground = new Ground();

        // Physics world setup
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0),
        });

        // Sweep and prune broadphase
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);

        this.sky.addToScene(scene);
        this.ground.addToWorld(this.world, scene);
    }

    update() {
        this.timer.update();
        this.sky.update();
    }
}
