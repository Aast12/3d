import * as THREE from 'three';
import { CineonToneMapping, Vector3 } from 'three';
import { Keyboard } from './utils/keyboard';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Bus } from './objects/Bus';
import { defaultVehicleConfig } from './objects/Vehicle';
import { City } from './objects/City';
import { ChaseCam } from './utils/ChaseCam';
import { Interactive } from './objects/Interactive';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import skyBoxFragment from './shaders/skyBoxFragment.js';
import skyBoxVertex from './shaders/skyBoxVertex.js';
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

const timer = new Timer(1);
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

// Illumination setup
// const sun = new THREE.DirectionalLight(0xffffff, 0.4);
// sun.position.set(0, 50, 0);
// scene.add(sun);
// scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));
// const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
// hemiLight.color.setHSL(0.6, 1, 0.6);
// // 230°, 64%, 34%
// // hemiLight.color.setHSL(0.62, 0.14, 0.34);
// hemiLight.groundColor.setHSL(0.095, 1, 0.75);
// hemiLight.position.set(0, 0, 0);
// scene.add(hemiLight);

// const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
// scene.add(hemiLightHelper);

// const newDir = (scene: THREE.Scene) => {
//     const dirLight = new THREE.DirectionalLight(0xffffff, 2);
//     dirLight.color.setHSL(0.072, 0.82, 0.58);
//     dirLight.position.set(0, 1000, 50);
//     // dirLight.position.multiplyScalar(30);

//     const d = 50;

//     dirLight.shadow.camera.left = -d;
//     dirLight.shadow.camera.right = d;
//     dirLight.shadow.camera.top = d;
//     dirLight.shadow.camera.bottom = -d;

//     dirLight.shadow.camera.far = 3500;
//     dirLight.shadow.bias = -0.0001;

//     let dirLightHelp = new THREE.DirectionalLightHelper(dirLight, 30, 0x00ff00);
//     scene.add(dirLightHelp);
//     scene.add(dirLight);

//     dirLight.castShadow = true;

//     dirLight.shadow.mapSize.width = 2048;
//     dirLight.shadow.mapSize.height = 2048;

//     return dirLight;
// };

// const sunLight = newDir(scene);
// const moonLight = newDir(scene);

// Create ground
// const groundGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(1000, 1000);
// const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
// // groundMat.color.setHSL(0.095, 1, 0.75);
// groundMat.color.setHSL(0.608, 0.21, 0.31);
// const groundMesh: THREE.Mesh = new THREE.Mesh(groundGeometry, groundMat);
// groundMesh.rotateX(-Math.PI / 2);
// groundMesh.receiveShadow = true;
// scene.add(groundMesh);

// const groundMaterial = new CANNON.Material('groundMaterial');
// const groundShape = new CANNON.Plane();
// const groundBody = new CANNON.Body({
//     mass: 0,
//     material: groundMaterial,
//     shape: groundShape,
// });
// groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

// groundBody.position.set(0, -5, 0);
// groundMesh.position.set(0, -5, 0);

// const vertexShader = skyBoxVertex;
// const fragmentShader = skyBoxFragment;
// const uniforms = {
//     topColor: { value: new THREE.Color(0x0077ff) },
//     bottomColor: { value: new THREE.Color(0xffffff) },
//     offset: { value: 33 },
//     exponent: { value: 0.6 },
// };
// uniforms['topColor'].value.copy(hemiLight.color);

// scene.fog.color.copy(uniforms['bottomColor'].value);
// scene.fog.color.setHex(0);

// const skyGeo = new THREE.SphereGeometry(1000, 32, 15);
// const skyMat = new THREE.ShaderMaterial({
//     uniforms: uniforms,
//     vertexShader: vertexShader,
//     fragmentShader: fragmentShader,
//     side: THREE.BackSide,
// });

// const sky = new THREE.Mesh(skyGeo, skyMat);
// scene.add(sky);

// const wheelToGround = new CANNON.ContactMaterial(
//     new CANNON.Material('wheel'),
//     groundMaterial,
//     {
//         friction: 0.1,
//         restitution: 0.1,
//         contactEquationStiffness: 1000,
//     }
// );
// world.addContactMaterial(wheelToGround);
// world.addBody(groundBody);

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

// let toCenterHelper = new THREE.ArrowHelper(
//     sky.position.clone().sub(sunLight.position),
//     sunLight.position,
//     sky.position.clone().sub(sunLight.position).length(),
//     0x0000ff
// );

// scene.add(toCenterHelper);

let startTime = Date.now();
let currTime = 60 * 2.5;
const lightDiff = 0.4 / (6 * 1);
let currLight = 0.1;
let dt;
let lastTime = Date.now();

function animate() {
    requestAnimationFrame(animate);
    dt = (Date.now() - lastTime) / 1000;
    lastTime = Date.now();
    currTime = (Date.now() - startTime) / 1000;

    currTime = currTime % (6 * 1);
    // chaseCam.update();

    Keyboard.clear();

    world.fixedStep();
    cannonDbg.update();
    // renderer.render(scene, chaseCam.get());
    renderer.render(scene, camera);
    // sunLight.position.y -= 0.5;
    orbitControls.update();
    // console.log(currTime * ((Math.PI * 2) / (60 * 1)));
    // let newPos = calcNextPos(sunLight.position, (Math.PI * 2) / (60 * 10));
    
    // let newPos = calcNextPos(
    //     new THREE.Vector3(1000, 0, 0),
    //     currTime * ((Math.PI * 2) / (6 * 1))
    // );
    // sunLight.position.set(newPos.x, newPos.y, newPos.z);

    // toCenterHelper.position.copy(new Vector3(0, 0, 0));
    // toCenterHelper.setDirection(new Vector3(0, 0, 0).sub(sunLight.position));
    timer.update();
    sky.update();
    // console.log(currTime * lightDiff);
    // currLight = lightDiff * currTime;
    // if (currTime > 3) {
    //     // sunLight.visible = false;
    //     // currLight -= lightDiff * dt;
    //     // hemiLight.color.setHSL(0.6, 1, 0.1);
    //     console.log('set ', 0.1 + currLight);
    //     hemiLight.color.setHSL(0.6, 1, 0.1 + currLight);

    //     // sky.material.
    //     sky.material.uniforms['topColor'].value.copy(hemiLight.color);
    //     // sky.material.uniforms['bottomColor'].value.copy(
    //     //     new THREE.Color().setHSL(0.6, 0.2, 0.27)
    //     // );

    //     // scene.fog?.color.copy(uniforms['bottomColor'].value);
    // } else {
    //     // sunLight.visible = true;
    //     // currLight += lightDiff * dt;
    //     // hemiLight.color.setHSL(0.6, 1, 0.6);
    //     // hemiLight.color.setHSL(0.57, 1, 0.5);
    //     console.log('set ', 0.1 + currLight);
    //     hemiLight.color.setHSL(0.57, 1, 0.1 + currLight);
    //     // hemiLight.intensity = 0;
    //     // sky.material.uniforms['topColor'].value.copy(hemiLight.color);

    //     // scene.fog?.color.copy(uniforms['bottomColor'].value);
    // }
    // bus.update();
}

animate();
