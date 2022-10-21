import * as CANNON from 'cannon-es';
import { WheelInfoOptions } from 'cannon-es';
import { Key } from 'ts-key-enum';
import { Keyboard } from '../utils/keyboard';

export class Bus {
    static defaultWheelOptions: WheelInfoOptions = {
        radius: 0.7,
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
        widht: 2,
        height: 0.5,
        depth: 5,
    };

    vehicle: CANNON.RigidVehicle;

    chassisBody: CANNON.Body;
    wheelBodies: CANNON.Body[] = [];
    centerOfMassAdjust = new CANNON.Vec3(0, -1, 0);
    axisWidth = 7;
    
    maxSteerVal = Math.PI / 8;
    maxSpeed = 10;
    maxForce = 100;
    brakeForce = 1000000;

    buildChassis() {
        const { depth, widht, height } = this.dims;
        const chassisShape = new CANNON.Box(
            new CANNON.Vec3(depth, height, widht)
        );
        const chassisBody = new CANNON.Body({ mass: 1 });
        chassisBody.addShape(chassisShape, this.centerOfMassAdjust);
        // chassisBody.position.set(0, 5, 0);
        // chassisBody.angularVelocity.set(0, 0.5, 0);
        return chassisBody;
    }

    buildWheel(
        mass: number,
        material: CANNON.Material,
        shape: CANNON.Shape,
        position: CANNON.Vec3,
        axis: CANNON.Vec3
    ) {
        const body = new CANNON.Body({ mass, material });
        body.addShape(shape);
        this.vehicle.addWheel({
            body,
            position: position.vadd(this.centerOfMassAdjust),
            axis,
            direction: new CANNON.Vec3(0, -1, 0),
        });
    }

    buildWheels() {
        const { depth, widht, height } = this.dims;
        // const wheelOptions = { ...Bus.defaultWheelOptions };
        // wheelOptions.directionLocal?.set(0, -height * 3, 0);
        // wheelOptions.chassisConnectionPointLocal?.set(-(depth / 2), 0, widht);
        // this.vehicle.addWheel(wheelOptions);

        // wheelOptions.chassisConnectionPointLocal?.set(-(depth / 2), 0, -widht);
        // this.vehicle.addWheel(wheelOptions);

        // wheelOptions.chassisConnectionPointLocal?.set(depth / 2, 0, widht);
        // this.vehicle.addWheel(wheelOptions);

        // wheelOptions.chassisConnectionPointLocal?.set(depth / 2, 0, -widht);
        // this.vehicle.addWheel(wheelOptions);

        const wheelMass = 1;
        const wheelMaterial = new CANNON.Material('wheel');
        const wheelShape = new CANNON.Sphere(1.5);
        // this.axisWidth = this.dims.widht * 2;
        const wheelConfig = [
            {
                position: new CANNON.Vec3(-depth, 0, this.axisWidth / 2),
                axis: new CANNON.Vec3(0, 0, 1),
            },
            {
                position: new CANNON.Vec3(-depth, 0, -this.axisWidth / 2),
                axis: new CANNON.Vec3(0, 0, -1),
            },
            {
                position: new CANNON.Vec3(depth, 0, this.axisWidth / 2),
                axis: new CANNON.Vec3(0, 0, 1),
            },
            {
                position: new CANNON.Vec3(depth, 0, -this.axisWidth / 2),
                axis: new CANNON.Vec3(0, 0, -1),
            },
        ];

        for (const { axis, position } of wheelConfig) {
            this.buildWheel(
                wheelMass,
                wheelMaterial,
                wheelShape,
                position,
                axis
            );
        }

        this.vehicle.wheelBodies.forEach((wheelBody) => {
            // Some damping to not spin wheels too fast
            wheelBody.angularDamping = 0.4;
        });

        // this.vehicle.addWheel({
        //     body: wheelBody4,
        //     position: new CANNON.Vec3(5, 0, -axisWidth / 2).vadd(centerOfMassAdjust),
        //     axis: new CANNON.Vec3(0, 0, -1),
        //     direction: down,
        //   })

        // const wheelMaterial = new CANNON.Material('wheel');
        // this.vehicle.wheelInfos.forEach((wheel) => {
        //     const cylinderShape = new CANNON.Cylinder(
        //         wheel.radius,
        //         wheel.radius,
        //         wheel.radius / 2,
        //         20
        //     );
        //     const wheelBody = new CANNON.Body({
        //         mass: 0,
        //         material: wheelMaterial,
        //     });
        //     wheelBody.type = CANNON.Body.KINEMATIC;
        //     wheelBody.collisionFilterGroup = 0; // turn off collisions
        //     const quaternion = new CANNON.Quaternion().setFromEuler(
        //         -Math.PI / 2,
        //         0,
        //         0
        //     );
        //     wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
        //     this.wheelBodies.push(wheelBody);
        // });
    }

    constructor() {
        this.chassisBody = this.buildChassis();
        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: this.chassisBody,
        });
        this.buildWheels();
    }

    addToWorld(world: CANNON.World) {
        this.vehicle.addToWorld(world);
        this.wheelBodies.forEach((wheel) => {
            world.addBody(wheel);
        });

        // world.addEventListener('postStep', () => {
        //     for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
        //         this.vehicle.updateWheelTransform(i);
        //         const transform = this.vehicle.wheelInfos[i].worldTransform;
        //         const wheelBody = this.wheelBodies[i];
        //         wheelBody.position.copy(transform.position);
        //         wheelBody.quaternion.copy(transform.quaternion);
        //     }
        // });
    }

    handleInput() {
        const { maxForce, maxSteerVal, brakeForce } = this;
        if (Keyboard.isPressed('w')) {
            console.log('what');
            this.vehicle.setWheelForce(maxForce, 2);
            this.vehicle.setWheelForce(-maxForce, 3);
        } else if (Keyboard.isReleased('w')) {
            this.vehicle.setWheelForce(0, 2);
            this.vehicle.setWheelForce(0, 3);
        }
        if (Keyboard.isPressed('s')) {
            console.log('whast');
            this.vehicle.setWheelForce(-maxForce / 2, 2);
            this.vehicle.setWheelForce(maxForce / 2, 3);
        } else if (Keyboard.isReleased('s')) {
            this.vehicle.setWheelForce(0, 2);
            this.vehicle.setWheelForce(0, 3);
        }
        if (Keyboard.isPressed('d')) {
            this.vehicle.setSteeringValue(-maxSteerVal, 0);
            this.vehicle.setSteeringValue(-maxSteerVal, 1);
        } else if (Keyboard.isReleased('a')) {
            this.vehicle.setSteeringValue(0, 0);
            this.vehicle.setSteeringValue(0, 1);
        }
        if (Keyboard.isPressed('a')) {
            this.vehicle.setSteeringValue(maxSteerVal, 0);
            this.vehicle.setSteeringValue(maxSteerVal, 1);
        } else if (Keyboard.isReleased('d')) {
            this.vehicle.setSteeringValue(0, 0);
            this.vehicle.setSteeringValue(0, 1);
        }
        // if (Keyboard.isPressed(Key.Enter)) {
        //     this.vehicle.setBrake(brakeForce, 0);
        //     this.vehicle.setBrake(brakeForce, 1);
        //     this.vehicle.setBrake(brakeForce, 2);
        //     this.vehicle.setBrake(brakeForce, 3);
        // } else if (Keyboard.isReleased(Key.Enter)) {
        //     this.vehicle.setBrake(0, 0);
        //     this.vehicle.setBrake(0, 1);
        //     this.vehicle.setBrake(0, 2);
        //     this.vehicle.setBrake(0, 3);
        // }
    }
}
