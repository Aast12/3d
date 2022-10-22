import * as THREE from 'three';
import { Vector3 } from 'three';
import { Keyboard } from './utils/keyboard';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Bus } from './objects/Bus';
import { defaultVehicleConfig } from './objects/Vehicle';
import { City } from './objects/City';

Keyboard.initialize();

// Initialization

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd);
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Illumination setup
const sun = new THREE.DirectionalLight(0xffffff, 0.4);
sun.position.set(0, 50, 0);
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));

// Physics world setup
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Sweep and prune broadphase
world.broadphase = new CANNON.SAPBroadphase(world);

// Create ground
const groundGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(100, 100);
const groundMesh: THREE.Mesh = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshPhongMaterial()
);
groundMesh.rotateX(-Math.PI / 2);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundMaterial = new CANNON.Material('groundMaterial');
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
    mass: 0,
    material: groundMaterial,
    shape: groundShape,
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

groundBody.position.set(0, -5, 0);
groundMesh.position.set(0, -5, 0);

const wheelToGround = new CANNON.ContactMaterial(
    new CANNON.Material('wheel'),
    groundMaterial,
    {
        friction: 0.1,
        restitution: 0.1,
        contactEquationStiffness: 1000,
    }
);
world.addContactMaterial(wheelToGround);
world.addBody(groundBody);

// Player bus construction

const bus = new Bus({
    ...defaultVehicleConfig,
    mass: 5,
    maxForce: 500,
    wheelConfig: {
        ...defaultVehicleConfig.wheelConfig,
        radius: 1.7,
    },
    dimensions: {
        depth: 12,
        width: 5,
        height: 6,
    },
});
bus.addToWorld(world, scene);
// bus.vehicle.chassisBody.position.set(-50, 50, -50);
bus.object.receiveShadow = true;
bus.object.castShadow = true;

// Distance of camera from player
const cameraOffset = new Vector3(0.0, 5.0, 30.0);

// Init debugger
const cannonDbg = CannonDebugger(scene, world, {});

const city = new City({
    buildingConfig: { depth: 10, width: 10, height: 15 },
    columns: 4,
    rows: 4,
    squareCols: 5,
    squareRows: 5,
    streetWidth: 12,
});

city.addToWorld(world, scene);

function animate() {
    requestAnimationFrame(animate);

    // camera.lookAt(bus.mesh.position);
    const objectPosition = new Vector3();
    bus.object.getWorldPosition(objectPosition);
    camera.position.copy(objectPosition).add(cameraOffset);

    Keyboard.clear();

    world.fixedStep();
    cannonDbg.update();
    renderer.render(scene, camera);

    bus.update();
}

animate();
