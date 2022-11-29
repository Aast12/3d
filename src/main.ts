import * as THREE from 'three';
import { Vector3 } from 'three';
import { Keyboard } from './utils/keyboard';
import CannonDebugger from 'cannon-es-debugger';
import { BusLoader } from './objects/Bus';
import { CityLoader, defaultCityMapConfig } from './objects/City';
import { ChaseCam } from './utils/ChaseCam';
import { Interactive } from './objects/Interactive';

import { setup } from './setup';
import { Environment } from './env/env';
import { defaultVehicleConfig } from './objects/Vehicle';

Keyboard.initialize();

// Initialization

const { scene, renderer } = setup();

scene.background = new THREE.Color().setHSL(0.6, 0, 1);

const env = new Environment(scene);
const world = env.world;

// Init debugger
const cannonDbg = CannonDebugger(scene, world, {});

const city = await new CityLoader(defaultCityMapConfig).getCityLoaded();

const { x, y } = city.startPoint;
const initialPosition = city.getCellPosition(x, y);
initialPosition.y = 10;

const target = new Interactive({ depth: 10, width: 10, height: 15 }, () => {});
target.addToWorld(world);
city.addToWorld(world, scene);

const bus = await new BusLoader({
    ...defaultVehicleConfig,
    initialPosition,
}).getBusLoaded();

bus.addToWorld(world, scene);

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
