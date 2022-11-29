import * as THREE from 'three';
import { Vector3 } from 'three';
import { Keyboard } from './utils/keyboard';
import CannonDebugger from 'cannon-es-debugger';
import { BusLoader } from './objects/Bus';
import { City } from './objects/City';
import { ChaseCam } from './utils/ChaseCam';
import { Interactive } from './objects/Interactive';

import { setup } from './setup';
import { Environment } from './env/env';

Keyboard.initialize();

// Initialization

const { scene, renderer } = setup();

scene.background = new THREE.Color().setHSL(0.6, 0, 1);

const env = new Environment(scene);
const world = env.world;

// Player bus construction

const bus = await new BusLoader().getBusLoaded();

bus.addToWorld(world, scene);

// Init debugger
const cannonDbg = CannonDebugger(scene, world, {});

const city = new City({
    buildingConfig: { depth: 10, width: 10, height: 15 },
    columns: 4,
    rows: 4,
    squareCols: 5,
    squareRows: 5,
    streetWidth: 20,
});

const target = new Interactive({ depth: 10, width: 10, height: 15 }, () => {});
target.addToWorld(world, scene);
city.addToWorld(world, scene);

const chaseCam = new ChaseCam(bus.object, 20, new Vector3(0, 10, 0));

env.timer.start();

function animate() {
    requestAnimationFrame(animate);

    Keyboard.clear();
    env.update();

    chaseCam.update();
    bus.update();
    world.fixedStep();
    cannonDbg.update();
    renderer.render(scene, chaseCam.get());

    // renderer.render(scene, camera);
}

animate();
