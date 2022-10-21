import * as THREE from 'three';
import { Vector2, Vector3 } from 'three';
import { Key } from 'ts-key-enum';
import { Keyboard } from './utils/keyboard';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Bus } from './Bus';

Keyboard.initialize();

type KeyT = Key | string;

const keyPress = (key: KeyT | Array<KeyT>) => {
    if (key instanceof Array)
        return () => key.some((keyOption) => Keyboard.isPressed(keyOption));
    return () => Keyboard.isPressed(key);
};

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

camera.position.z = 30;
camera.position.y = 30;

const bus = new Bus(new THREE.Vector3(0, 10, -3));
bus.object && scene.add(bus.object);

camera.lookAt(new Vector3(0, 0, 0));

const light = new THREE.AmbientLight(0x404040);
scene.add(light);
scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

const cannonDbg = CannonDebugger(scene, world, {});

const groundMaterial = new CANNON.Material('groundMaterial');
groundMaterial.friction = 0.25;
// groundMaterial.restitution = 0.25;

const groundGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(100, 100);
const groundMesh: THREE.Mesh = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshPhongMaterial()
);
groundMesh.rotateX(-Math.PI / 2);
groundMesh.receiveShadow = true;
scene.add(groundMesh);
const groundShape = new CANNON.Box(new CANNON.Vec3(50, 1, 50));
const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
groundBody.addShape(groundShape);
groundBody.position.set(0, -1, 0);
// groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

world.addBody(groundBody);

// const busShape = new CANNON.Box(
//     new CANNON.Vec3(bus.dims.width, bus.dims.width, bus.dims.depth)
// );
// const busBody = new CANNON.Body({
//     mass: 100,
//     shape: busShape,
// });

world.addBody(bus.body);

function animate() {
    requestAnimationFrame(animate);

    // scene.rotation.z += Math.PI / 300;
    // scene.rotation.y += Math.PI / 300;
    // camera.position.z -= 0.01;
    bus.update();


    // const newPos = bus.cameraPos();
    // console.log(camera.position, newPos);
    // camera.position.set(newPos.x, newPos.y, newPos.z);

    // bus.object.getWorldPosition(bus.object.position);

    // camera.position.copy(bus.object.position).add(new THREE.Vector3(0, 3, -5));

    // camera.lookAt(bus.object.position);

    world.fixedStep();
    cannonDbg.update();
    renderer.render(scene, camera);
}

animate();
