import * as THREE from 'three';
import { Vector3 } from 'three';
import { Key } from 'ts-key-enum';
import { Keyboard } from './utils/keyboard';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Bus } from './objects/Bus';

Keyboard.initialize();

type KeyT = Key | string;

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

camera.position.set(0, 5, 15);
// camera.position.z = -15;
// camera.position.y = 5;

const bus = new Bus();

// camera.lookAt(new Vector3(0, 0, 0));

const light = new THREE.AmbientLight(0x404040);
scene.add(light);
scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Sweep and prune broadphase
world.broadphase = new CANNON.SAPBroadphase(world);

// Disable friction by default
world.defaultContactMaterial.friction = 0;

const cannonDbg = CannonDebugger(scene, world, {});

const groundGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(100, 100);
const groundMesh: THREE.Mesh = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshPhongMaterial()
);
groundMesh.rotateX(-Math.PI / 2);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const groundMaterial = new CANNON.Material('groundMaterial');

const groundShape = new CANNON.Box(new CANNON.Vec3(50, 1, 50));
const groundBody = new CANNON.Body({
    mass: 0,
    material: groundMaterial,
    shape: groundShape,
});

groundBody.position.set(0, -5, 0);
groundMesh.position.set(0, -5, 0);

const wheelToGround = new CANNON.ContactMaterial(
    // @ts-ignore
    bus.vehicle.wheelBodies[0].material,
    // new CANNON.Material('wheel'),
    groundMaterial,
    {
        friction: 0.3,
        restitution: 0,
        contactEquationStiffness: 1000,
    }
);
world.addContactMaterial(wheelToGround);

world.addBody(groundBody);

const cameraOffset = new Vector3(0.0, 5.0, 30.0);

bus.addToWorld(world, scene);
// camera.position.set(-20, 0, 15);
// bus.mesh.add(camera);

function animate() {
    requestAnimationFrame(animate);

    bus.update();
    // camera.lookAt(bus.mesh.position);
    const objectPosition = new Vector3();
    bus.mesh.getWorldPosition(objectPosition);
    camera.position.copy(objectPosition).add(cameraOffset);

    Keyboard.clear();

    world.fixedStep();
    cannonDbg.update();
    renderer.render(scene, camera);
}

animate();
