import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Vec3 } from 'cannon-es';
import { getObjectSize } from '../utils/math';

export type WheelConfig = {
    mass: number;
    material: CANNON.Material;
    shapeGen: (radius: number) => CANNON.Shape;
    radius: number;
};

export type VehicleConfig = {
    mass: number;
    dimensions: { width: number; height: number; depth: number };
    centerOfMass: Vec3;
    maxForce: number;
    maxSteering: number;
    wheelConfig: WheelConfig;
};

export const defaultVehicleConfig: VehicleConfig = {
    mass: 7,
    dimensions: { width: 2, height: 3, depth: 5 },
    centerOfMass: new Vec3(0, 0, 0),
    maxForce: 150,
    maxSteering: Math.PI / 12,
    wheelConfig: {
        mass: 3,
        material: new CANNON.Material('wheel'),
        radius: 1.2,
        shapeGen: (radius) => new CANNON.Sphere(radius),
    },
};

/**
 * Abstraction for vehicle objects. Creates the physics object for a vehicle with the
 * configuration set by VehicleConfig and manages the basic synchronization of the object
 * with a Three.js 3d object.
 *
 */
export abstract class Vehicle {
    config: VehicleConfig;
    // @ts-ignore
    vehicle: CANNON.RigidVehicle;
    // @ts-ignore
    object: THREE.Object3D;

    constructor(config: VehicleConfig) {
        this.config = config;
    }

    build() {
        this.object = this.buildChassis3dObject();

        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: this.buildChassis(),
        });
        this.buildWheels();
    }

    /**
     * Builds the graphical 3d object for the chassis. Should match
     * the dimensions given to the vehicle config.
     */
    buildChassis3dObject(): THREE.Object3D {
        throw new Error('Not yet implemented');
    }

    buildChassis(): CANNON.Body {
        // const { depth, width, height } = this.config.dimensions;
        let objSize = getObjectSize(this.object);
        const { centerOfMass } = this.config;
        const chassisShape = new CANNON.Box(
            new CANNON.Vec3(objSize.x / 2, objSize.y / 2, objSize.z / 2)

            // new CANNON.Vec3(depth / 2, height / 2, width / 2)
        );
        const chassisBody = new CANNON.Body({ mass: this.config.mass });
        chassisBody.position.set(-50, 10, 50);
        chassisBody.addShape(chassisShape, centerOfMass);
        // chassisBody.position.set(0, 5, 0);
        // chassisBody.angularVelocity.set(0, 0.5, 0);
        return chassisBody;
    }

    buildWheel(position: CANNON.Vec3, axis: CANNON.Vec3) {
        const { mass, material } = this.config.wheelConfig;

        const body = new CANNON.Body({ mass, material });
        // body.quaternion.setFromEuler(Math.PI / 2, 0, 0);

        let wheels = this.object.children.filter((obj) =>
            obj.name.includes('Wheel')
        );
        let objSize = getObjectSize(wheels[0]);
        const wheelShape = new CANNON.Sphere(objSize.z * 2);

        const quaternion = new CANNON.Quaternion().setFromEuler(
            0,
            0,
            -Math.PI / 2
        );

        body.addShape(wheelShape, new CANNON.Vec3(), quaternion);
        this.vehicle.addWheel({
            body,
            position: position,
            axis,
            direction: new CANNON.Vec3(0, -1, 0),
        });
    }

    setupWheelPosition(
        wheel: THREE.Object3D,
        axis: CANNON.Vec3,
        yMod: number
    ): { position: CANNON.Vec3; axis: CANNON.Vec3 } {
        const pos = new THREE.Vector3();
        wheel.getWorldPosition(pos);
        return {
            position: new CANNON.Vec3(pos.x, pos.y + yMod, pos.z),
            axis,
        };
    }

    buildWheels() {
        const { x: depth, y: _height, z: width } = getObjectSize(this.object);
        let wheels = this.object.children.filter((obj) =>
            obj.name.includes('Wheel')
        );

        let flWheel = this.object.getObjectByName('Wheel_TL')!;
        let frWheel = this.object.getObjectByName('Wheel_TR')!;
        let blWheel = this.object.getObjectByName('Wheel_BL')!;
        let brWheel = this.object.getObjectByName('Wheel_BR')!;

        const wheelConfig: { position: CANNON.Vec3; axis: CANNON.Vec3 }[] = [];

        const yOffset = -_height / 2;

        wheelConfig.push(
            this.setupWheelPosition(flWheel, new CANNON.Vec3(0, 0, -1), yOffset)
        );
        wheelConfig.push(
            this.setupWheelPosition(frWheel, new CANNON.Vec3(0, 0, 1), yOffset)
        );
        wheelConfig.push(
            this.setupWheelPosition(blWheel, new CANNON.Vec3(0, 0, 1), yOffset)
        );
        wheelConfig.push(
            this.setupWheelPosition(brWheel, new CANNON.Vec3(0, 0, -1), yOffset)
        );

        for (const { axis, position } of wheelConfig) {
            this.buildWheel(position, axis);
        }

        this.vehicle.wheelBodies.forEach((wheelBody) => {
            wheelBody.angularDamping = 0.9;
        });
    }

    addToWorld(world: CANNON.World, scene: THREE.Scene) {
        scene.add(this.object);
        this.vehicle.addToWorld(world);
    }

    update() {
        const { position: chassisPosition, quaternion: chassisQuaternion } =
            this.vehicle.chassisBody;

        this.object.quaternion.set(
            chassisQuaternion.x,
            chassisQuaternion.y,
            chassisQuaternion.z,
            chassisQuaternion.w
        );
        this.object.rotateY(Math.PI / 2);

        let objSize = getObjectSize(this.object);

        this.object.position.set(
            chassisPosition.x,
            chassisPosition.y - objSize.y / 2,
            chassisPosition.z
        );
    }

    moveForward() {
        const { maxForce } = this.config;
        this.vehicle.setWheelForce(maxForce, 2);
        this.vehicle.setWheelForce(-maxForce, 3);
    }

    moveBackwards() {
        const { maxForce } = this.config;
        this.vehicle.setWheelForce(-maxForce / 2, 2);
        this.vehicle.setWheelForce(maxForce / 2, 3);
    }

    resetWheelForce() {
        // this.vehicle.setWheelForce(0, 2);
        // this.vehicle.setWheelForce(0, 3);
    }

    steer(direction: 'left' | 'right') {
        const { maxSteering } = this.config;
        const dir = direction == 'right' ? -1 : 1;

        this.vehicle.setSteeringValue(maxSteering * dir, 0);
        this.vehicle.setSteeringValue(maxSteering * dir, 1);
    }

    resetSteeringValue() {
        this.vehicle.setSteeringValue(0, 0);
        this.vehicle.setSteeringValue(0, 1);
    }
}
