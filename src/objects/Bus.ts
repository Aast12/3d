import * as CANNON from 'cannon-es';
import { Keyboard } from '../utils/keyboard';
import * as THREE from 'three';
import { defaultVehicleConfig, Vehicle, VehicleConfig } from './Vehicle';

/**
 * Implementation of the bus vehicle used by the player. Implements a vehicle and
 * handles keyboard interaction to move.
 */
export class Bus extends Vehicle {
    constructor(config: VehicleConfig = defaultVehicleConfig) {
        super(config);
    }

    buildChassis3dObject(): THREE.Object3D {
        const { depth, width, height } = this.config.dimensions;
        const chassisMaterial = new THREE.MeshPhongMaterial({
            color: 0x003344,
        });

        return new THREE.Mesh(
            new THREE.BoxGeometry(depth, height, width),
            chassisMaterial
        );
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
