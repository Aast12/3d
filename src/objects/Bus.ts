import * as CANNON from 'cannon-es';
import { WheelInfoOptions } from 'cannon-es';
import { Key } from 'ts-key-enum';
import { Keyboard } from '../utils/keyboard';

export class Bus {
    static defaultWheelOptions: WheelInfoOptions = {
        radius: 0.5,
        directionLocal: new CANNON.Vec3(0, -1, 0),
        suspensionStiffness: 30,
        suspensionRestLength: 0.3,
        frictionSlip: 1.4,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        maxSuspensionForce: 100000,
        rollInfluence: 0.01,
        axleLocal: new CANNON.Vec3(0, 0, 1),
        chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
        maxSuspensionTravel: 0.3,
        customSlidingRotationalSpeed: -30,
        useCustomSlidingRotationalSpeed: true,
    };

    dims = {
        widht: 4,
        height: 4,
        depth: 4,
    };

    vehicle: CANNON.RaycastVehicle;

    chassisBody: CANNON.Body;
    wheelBodies: CANNON.Body[] = [];

    maxForce = 1000;
    maxSteerVal = 100;
    brakeForce = 1000000;

    buildChassis() {
        const chassisShape = new CANNON.Box(new CANNON.Vec3(2, 0.5, 1));
        const chassisBody = new CANNON.Body({ mass: 150 });
        chassisBody.addShape(chassisShape);
        chassisBody.position.set(0, 4, 0);
        chassisBody.angularVelocity.set(0, 0.5, 0);
        return chassisBody;
    }

    buildWheels() {
        const wheelOptions = { ...Bus.defaultWheelOptions };
        wheelOptions.chassisConnectionPointLocal?.set(-1, 0, 1);
        this.vehicle.addWheel(wheelOptions);

        wheelOptions.chassisConnectionPointLocal?.set(-1, 0, -1);
        this.vehicle.addWheel(wheelOptions);

        wheelOptions.chassisConnectionPointLocal?.set(1, 0, 1);
        this.vehicle.addWheel(wheelOptions);

        wheelOptions.chassisConnectionPointLocal?.set(1, 0, -1);
        this.vehicle.addWheel(wheelOptions);

        const wheelMaterial = new CANNON.Material('wheel');
        this.vehicle.wheelInfos.forEach((wheel) => {
            const cylinderShape = new CANNON.Cylinder(
                wheel.radius,
                wheel.radius,
                wheel.radius / 2,
                20
            );
            const wheelBody = new CANNON.Body({
                mass: 0,
                material: wheelMaterial,
            });
            wheelBody.type = CANNON.Body.KINEMATIC;
            wheelBody.collisionFilterGroup = 0; // turn off collisions
            const quaternion = new CANNON.Quaternion().setFromEuler(
                -Math.PI / 2,
                0,
                0
            );
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
            this.wheelBodies.push(wheelBody);
        });
    }

    constructor() {
        this.chassisBody = this.buildChassis();
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
        });
        this.buildWheels();
    }

    addToWorld(world: CANNON.World) {
        this.vehicle.addToWorld(world);
        this.wheelBodies.forEach((wheel) => {
            world.addBody(wheel);
        });

        world.addEventListener('postStep', () => {
            for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
                this.vehicle.updateWheelTransform(i);
                const transform = this.vehicle.wheelInfos[i].worldTransform;
                const wheelBody = this.wheelBodies[i];
                wheelBody.position.copy(transform.position);
                wheelBody.quaternion.copy(transform.quaternion);
            }
        });
    }

    handleInput() {
        const { maxForce, maxSteerVal, brakeForce } = this;
        if (Keyboard.isPressed('w')) {
            console.log('what');
            this.vehicle.applyEngineForce(-maxForce, 2);
            this.vehicle.applyEngineForce(-maxForce, 3);
        } else if (Keyboard.isReleased('w')) {
            this.vehicle.applyEngineForce(0, 2);
            this.vehicle.applyEngineForce(0, 3);
        }
        if (Keyboard.isPressed('s')) {
            console.log('what');
            this.vehicle.applyEngineForce(maxForce, 2);
            this.vehicle.applyEngineForce(maxForce, 3);
        } else if (Keyboard.isReleased('s')) {
            this.vehicle.applyEngineForce(0, 2);
            this.vehicle.applyEngineForce(0, 3);
        }
        if (Keyboard.isPressed('d')) {
            this.vehicle.setSteeringValue(maxSteerVal, 0);
            this.vehicle.setSteeringValue(maxSteerVal, 1);
        } else if (Keyboard.isReleased('a')) {
            this.vehicle.setSteeringValue(0, 0);
            this.vehicle.setSteeringValue(0, 1);
        }
        if (Keyboard.isPressed('a')) {
            this.vehicle.setSteeringValue(-maxSteerVal, 0);
            this.vehicle.setSteeringValue(-maxSteerVal, 1);
        } else if (Keyboard.isReleased('d')) {
            this.vehicle.setSteeringValue(0, 0);
            this.vehicle.setSteeringValue(0, 1);
        }
        if (Keyboard.isPressed(Key.Enter)) {
            this.vehicle.setBrake(brakeForce, 0);
            this.vehicle.setBrake(brakeForce, 1);
            this.vehicle.setBrake(brakeForce, 2);
            this.vehicle.setBrake(brakeForce, 3);
        } else if (Keyboard.isReleased(Key.Enter)) {
            this.vehicle.setBrake(0, 0);
            this.vehicle.setBrake(0, 1);
            this.vehicle.setBrake(0, 2);
            this.vehicle.setBrake(0, 3);
        }
    }
}
