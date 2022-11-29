import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Dimensions, Interactive } from './Interactive';
export class Passenger {
    mesh: THREE.Mesh;
    interactive: Interactive;
    callback: (ev: any) => void;

    constructor(
        position: THREE.Vector3,
        cb: (ev: any) => void,
        dims: Dimensions = {
            depth: 10,
            width: 10,
            height: 10,
        }
    ) {
        this.callback = cb;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshPhongMaterial({
                color: 0x37d9fa,
                opacity: 0.5,
                transparent: true,
            })
        );

        this.interactive = new Interactive(dims, this.callback);
        position.y = position.y + dims.height / 2;
        this.mesh.position.copy(position);
        this.interactive.body.position.set(position.x, position.y, position.z);
    }

    addToWorld(world: CANNON.World, scene: THREE.Scene) {
        this.interactive.addToWorld(world);
        scene.add(this.mesh);
    }

    dispose(world: CANNON.World, scene: THREE.Scene) {
        this.interactive.dispose(world);
        scene.remove(this.mesh);
    }
}
