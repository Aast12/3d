import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Keyboard } from '../utils/keyboard';
import * as THREE from 'three';
import { defaultVehicleConfig, Vehicle, VehicleConfig } from './Vehicle';

export class BusLoader {
    config: VehicleConfig;

    constructor(config: VehicleConfig = defaultVehicleConfig) {
        this.config = config;
    }

    async getBusLoaded(): Promise<Bus> {
        const data = await this.loadResources();

        return new Bus(data, this.config);
    }

    async loadResources(): Promise<THREE.Group> {
        const gltfLoader = new GLTFLoader();
        const url = 'src/models/bus.gltf';
        return new Promise((resolve, reject) => {
            gltfLoader.load(
                url,
                (gltf) => {
                    resolve(gltf.scene);
                },
                (progress) => {
                    console.info('bus load progress', progress.total);
                },
                reject
            );
        });
    }
}

/**
 * Implementation of the bus vehicle used by the player. Implements a vehicle and
 * handles keyboard interaction to move.
 */
export class Bus extends Vehicle {
    modelData: THREE.Group;

    constructor(
        modelData: THREE.Group,
        config: VehicleConfig = defaultVehicleConfig
    ) {
        super(config);
        this.modelData = modelData;
        this.build();
    }

    buildChassis3dObject(): THREE.Object3D {
        this.modelData.castShadow = true;
        this.modelData.receiveShadow = true;

        this.modelData.traverse(node => {
            // @ts-ignore
            if (node?.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        })
        this.modelData.children.forEach((mesh) => {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        });
        this.modelData.scale.set(2, 2, 2);
        this.modelData.rotateY(Math.PI / 2);

        return this.modelData;
    }

    update() {
        this.handleInput();
        super.update();
    }

    handleInput() {
        if (Keyboard.isPressed('q')) {
            console.log(this.vehicle.chassisBody.quaternion);
        }
        if (Keyboard.isPressed('w')) {
            this.moveForward();
        }
        if (Keyboard.isPressed('s')) {
            this.moveBackwards();
        }
        if (Keyboard.isPressed('d')) {
            this.steer('right');
        }
        if (Keyboard.isPressed('a')) {
            this.steer('left');
        }

        if (!Keyboard.isPressed('s') && !Keyboard.isPressed('w')) {
            this.resetWheelForce();
        }
        if (!Keyboard.isPressed('d') && !Keyboard.isPressed('a')) {
            this.resetSteeringValue();
        }
    }
}
