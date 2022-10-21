import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Vec3 } from 'cannon-es';

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
    mass: 10,
    dimensions: { width: 2, height: 3, depth: 5 },
    centerOfMass: new Vec3(0, 0, 0),
    maxForce: 200,
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
    vehicle: CANNON.RigidVehicle;
    object: THREE.Object3D;

    /**
     * Builds the graphical 3d object for the chassis. Should match
     * the dimensions given to the vehicle config.
     */
    buildChassis3dObject(): THREE.Object3D {
        throw new Error('Not yet implemented');
    }

    buildChassis(): CANNON.Body {
        const { depth, width, height } = this.config.dimensions;
        const { centerOfMass } = this.config;
        const chassisShape = new CANNON.Box(
            new CANNON.Vec3(depth / 2, height / 2, width / 2)
        );
        const chassisBody = new CANNON.Body({ mass: this.config.mass });
        chassisBody.addShape(chassisShape, centerOfMass);
        // chassisBody.position.set(0, 5, 0);
        // chassisBody.angularVelocity.set(0, 0.5, 0);
        return chassisBody;
    }

    buildWheel(position: CANNON.Vec3, axis: CANNON.Vec3) {
        const { mass, material, shapeGen, radius } = this.config.wheelConfig;
        const { centerOfMass } = this.config;

        const body = new CANNON.Body({ mass, material });
        // body.quaternion.setFromEuler(Math.PI / 2, 0, 0);
        body.addShape(shapeGen(radius));
        this.vehicle.addWheel({
            body,
            position: position.vadd(centerOfMass),
            axis,
            direction: new CANNON.Vec3(0, -1, 0),
        });
    }

    buildWheels() {
        const { width, depth, height } = this.config.dimensions;

        const axisWidth = width + this.config.wheelConfig.radius * 2;
        const baseXPosition = depth / 2;
        const wheelConfig = [
            {
                position: new CANNON.Vec3(
                    -baseXPosition,
                    -height / 2,
                    axisWidth / 2
                ),
                axis: new CANNON.Vec3(0, 0, 1),
            },
            {
                position: new CANNON.Vec3(
                    -baseXPosition,
                    -height / 2,
                    -axisWidth / 2
                ),
                axis: new CANNON.Vec3(0, 0, -1),
            },
            {
                position: new CANNON.Vec3(
                    baseXPosition,
                    -height / 2,
                    axisWidth / 2
                ),
                axis: new CANNON.Vec3(0, 0, 1),
            },
            {
                position: new CANNON.Vec3(
                    baseXPosition,
                    -height / 2,
                    -axisWidth / 2
                ),
                axis: new CANNON.Vec3(0, 0, -1),
            },
        ];

        for (const { axis, position } of wheelConfig) {
            this.buildWheel(position, axis);
        }

        this.vehicle.wheelBodies.forEach((wheelBody) => {
            // Regulates wheel spinning
            wheelBody.angularDamping = 0.9;
        });
    }

    constructor(config: VehicleConfig) {
        this.config = config;
        this.object = this.buildChassis3dObject();

        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: this.buildChassis(),
        });
        this.buildWheels();
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
        this.object.position.set(
            chassisPosition.x,
            chassisPosition.y,
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
        this.vehicle.setWheelForce(0, 2);
        this.vehicle.setWheelForce(0, 3);
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
