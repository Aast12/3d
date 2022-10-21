import * as CANNON from 'cannon-es';
import { Keyboard } from '../utils/keyboard';
import * as THREE from 'three';

export class Bus {
    dims = {
        widht: 4,
        height: 4,
        depth: 7,
    };

    vehicle: CANNON.RigidVehicle;
    mesh: THREE.Object3D;

    chassisBody: CANNON.Body;
    wheelBodies: CANNON.Body[] = [];
    centerOfMassAdjust = new CANNON.Vec3(0, 0, 0);
    axisWidth = 4 + 2.4;

    maxSteerVal = Math.PI / 12;
    maxSpeed = 50;
    maxForce = 200;
    brakeForce = 1000000;

    build3dObject() {
        const { depth, widht, height } = this.dims;
        const chassisMaterial = new THREE.MeshPhongMaterial({
            color: 0x003344,
        });

        return new THREE.Mesh(
            new THREE.BoxGeometry(depth, height, widht),
            chassisMaterial
        );
    }

    buildChassis(): CANNON.Body {
        const { depth, widht, height } = this.dims;
        const chassisShape = new CANNON.Box(
            new CANNON.Vec3(depth / 2, height / 2, widht / 2)
        );
        const chassisBody = new CANNON.Body({ mass: 10 });
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
        // body.quaternion.setFromEuler(Math.PI / 2, 0, 0);
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

        const wheelMass = 3;
        const wheelMaterial = new CANNON.Material('wheel');
        const wheelShape = new CANNON.Sphere(1.2);
        const xpos = depth / 2;
        const wheelConfig = [
            {
                position: new CANNON.Vec3(
                    -xpos,
                    -height / 2,
                    this.axisWidth / 2
                ),
                // axis: new CANNON.Vec3(0, 1, 0),
                axis: new CANNON.Vec3(0, 0, 1),
            },
            {
                position: new CANNON.Vec3(
                    -xpos,
                    -height / 2,
                    -this.axisWidth / 2
                ),
                // axis: new CANNON.Vec3(0, -1, 0),
                axis: new CANNON.Vec3(0, 0, -1),
            },
            {
                position: new CANNON.Vec3(
                    xpos,
                    -height / 2,
                    this.axisWidth / 2
                ),
                // axis: new CANNON.Vec3(0, 1, 0),
                axis: new CANNON.Vec3(0, 0, 1),
            },
            {
                position: new CANNON.Vec3(
                    xpos,
                    -height / 2,
                    -this.axisWidth / 2
                ),
                // axis: new CANNON.Vec3(0, -1, 0),
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
            wheelBody.angularDamping = 0.9;
        });
    }

    constructor() {
        this.mesh = this.build3dObject();
        this.chassisBody = this.buildChassis();
        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: this.chassisBody,
        });
        this.buildWheels();
    }

    addToWorld(world: CANNON.World, scene: THREE.Scene) {
        scene.add(this.mesh);
        this.vehicle.addToWorld(world);
        this.wheelBodies.forEach((wheel) => {
            world.addBody(wheel);
        });
    }

    update() {
        this.handleInput();
        const { position: chassisPosition, quaternion: chassisQuaternion } =
            this.vehicle.chassisBody;

        this.mesh.quaternion.set(
            chassisQuaternion.x,
            chassisQuaternion.y,
            chassisQuaternion.z,
            chassisQuaternion.w
        );
        this.mesh.position.set(
            chassisPosition.x,
            chassisPosition.y,
            chassisPosition.z
        );
    }

    handleInput() {
        const { maxForce, maxSteerVal, brakeForce } = this;
        if (Keyboard.isPressed('w')) {
            this.vehicle.setWheelForce(maxForce, 2);
            this.vehicle.setWheelForce(-maxForce, 3);
        } else if (Keyboard.isReleased('w')) {
            this.vehicle.setWheelForce(0, 2);
            this.vehicle.setWheelForce(0, 3);
        }
        if (Keyboard.isPressed('s')) {
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
