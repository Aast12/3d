import * as THREE from 'three';
import { Vector3 } from 'three';
import { Keyboard } from './utils/keyboard';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { BusLoader } from './objects/Bus';
import { City } from './objects/City';
import { ChaseCam } from './utils/ChaseCam';
import { Interactive } from './objects/Interactive';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Sky } from './env/sky';
import { Timer } from './env/timer';
import { Ground } from './env/ground';

Keyboard.initialize();

// Initialization

const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xdddddd);
scene.background = new THREE.Color().setHSL(0.6, 0, 1);
// scene.fog = new THREE.Fog(scene.background, 1, 5000);

const renderer = new THREE.WebGLRenderer();
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const timer = new Timer(5);
const sky = new Sky(timer, true);
const ground = new Ground();

// Physics world setup
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Sweep and prune broadphase
world.broadphase = new CANNON.SAPBroadphase(world);

sky.addToScene(scene);
ground.addToWorld(world, scene);

// Player bus construction

const bus = await new BusLoader().getBusLoaded();

bus.addToWorld(world, scene);
bus.object.receiveShadow = true;
bus.object.castShadow = true;

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

let camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.minDistance = 0.2;
// orbitControls.maxDistance = 1.5;
orbitControls.enableDamping = true;

timer.start();

function animate() {
    requestAnimationFrame(animate);

    Keyboard.clear();
    timer.update();

    chaseCam.update();
    bus.update();
    sky.update();
    world.fixedStep();
    cannonDbg.update();
    renderer.render(scene, chaseCam.get());
    // orbitControls.update();

    // renderer.render(scene, camera);
}

animate();
