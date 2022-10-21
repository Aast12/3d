import * as THREE from 'three';
import { Vector2, Vector3 } from 'three';
import { Key } from 'ts-key-enum';
import { Keyboard } from './utils/keyboard';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

Keyboard.initialize();

type KeyT = Key | string;

const keyPress = (key: KeyT | Array<KeyT>) => {
    if (key instanceof Array)
        return () => key.some((keyOption) => Keyboard.isPressed(keyOption));
    return () => Keyboard.isPressed(key);
};

export class Bus {
    initialPos: THREE.Vector3;
    private scene: THREE.Scene = new THREE.Scene();
    // @ts-ignore
    object: THREE.Object3D;
    dims = {
        width: 1,
        height: 2,
        depth: 5,
    };
    rotation: number = 0;
    force: THREE.Vector2 = new THREE.Vector2(0, 0);
    velocity: THREE.Vector2;
    direction: THREE.Vector2;
    speed: number;
    lastShoot?: number;
    body: CANNON.Body;
    shape: CANNON.Shape;

    constructor(initialPos: THREE.Vector3) {
        this.velocity = new THREE.Vector2(0, 0);
        this.direction = new THREE.Vector2(1, 1);
        this.speed = 0;
        this.initialPos = initialPos;

        this.build();

        this.shape = new CANNON.Box(
            new CANNON.Vec3(
                this.dims.width / 2,
                this.dims.width / 2,
                this.dims.depth / 2
            )
        );

        this.body = new CANNON.Body({
            mass: 100,
            shape: this.shape,
        });

        this.body.position.set(
            this.position.x,
            this.position.y,
            this.position.z
        );
    }

    build() {
        const boxGeometry = new THREE.BoxGeometry(
            this.dims.width,
            this.dims.height,
            this.dims.depth
        );
        const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.object = new THREE.Mesh(boxGeometry, boxMaterial);
    }

    get position() {
        return this.object.position;
    }

    cameraPos() {
        const objPos = this.object?.position;

        return new THREE.Vector3(
            objPos.x,
            objPos.y + this.dims.height / 2,
            objPos.z
            // objPos.z
        ).multiplyScalar(2);
    }

    Input = {
        MOVE_FORWARD: keyPress([Key.ArrowUp, 'w']),
        MOVE_BACKWARDS: keyPress([Key.ArrowDown, 's']),
        ROTATE_LEFT: keyPress([Key.ArrowLeft, 'a']),
        ROTATE_RIGHT: keyPress([Key.ArrowRight, 'd']),
        SHOOT: keyPress(Key.Enter),
    };

    // handleInput(deltaTime: number) {
    //     const { Input } = this;
    //     let degs = 0;
    //     if (Input.ROTATE_LEFT()) degs -= this.config.degDelta;
    //     if (Input.ROTATE_RIGHT()) degs += this.config.degDelta;

    //     this.direction.rotate(degs);
    //     this.velocity.rotate(degs);

    //     if (Input.MOVE_BACKWARDS()) {
    //         this.velocity.addVector(
    //             this.unitaryDirection.multiplyScalar(
    //                 -this.config.speed * deltaTime
    //             )
    //         );
    //     }
    //     if (Input.MOVE_FORWARD()) {
    //         this.velocity.addVector(
    //             this.unitaryDirection.multiplyScalar(
    //                 +this.config.speed * deltaTime
    //             )
    //         );
    //     }
    //     if (Input.SHOOT()) {
    //         if (
    //             !this.lastShoot ||
    //             Date.now() - this.lastShoot > this.config.shootDelay
    //         ) {
    //             const newBullet = new Bullet(
    //                 this.position
    //                     .clone()
    //                     .addVector(
    //                         this.direction
    //                             .clone()
    //                             .multiplyScalar(
    //                                 Math.max(
    //                                     this.config.width,
    //                                     this.config.height
    //                                 )
    //                             )
    //                     ),
    //                 this.direction.clone(),
    //                 Math.max(this.velocity.length, this.config.speed)
    //             );

    //             this.bullets.push(newBullet);
    //             this.lastShoot = Date.now();
    //         }
    //     }
    // }

    update() {
        if (Keyboard.isPressed('w')) {
            this.force.setX(this.force.x + 0.1);
            // this.force.setX(this.force.x + 0.1);
        }
        if (Keyboard.isPressed('s')) {
            this.force.setX(this.force.x - 0.1);
            // this.force.setX(this.force.x + 0.1);
        }
        if (Keyboard.isPressed('d')) {
            this.rotation += Math.PI / 300;
        }
        if (Keyboard.isPressed('a')) {
            this.rotation -= Math.PI / 300;
        }
        // console.log(this.force);
        const movement = new THREE.Vector2(
            Math.cos(this.rotation) - Math.sin(this.rotation),
            Math.sin(this.rotation) + Math.cos(this.rotation)
        )
            .normalize()
            .multiplyScalar(this.force.x);

        // this.object.position.z += this.force.x;
        this.object.position.z += movement.x;
        this.object.position.x += movement.y;

        this.object.rotation.set(0, this.rotation, 0);

        if (this.force.x > 0) {
            this.force.setX(this.force.x - 0.02);
        } else if (this.force.x < 0) {
            this.force.setX(this.force.x + 0.02);
        }

        this.position.set(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
    }

    getScene() {
        return this.object;
    }
}
