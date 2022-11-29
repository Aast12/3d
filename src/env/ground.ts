import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const groundDefaultConfig = {
    widht: 1000,
    heigth: 1000,
    color: new THREE.Color().setHSL(0.608, 0.21, 0.31),
};

type GroundMeshConfig = typeof groundDefaultConfig;

export class Ground {
    private groundMesh: THREE.Mesh;
    private groundBody: CANNON.Body;
    private wheelContactMaterial: CANNON.ContactMaterial;
    private debug: boolean;

    constructor(debug: boolean = false) {
        this.debug = debug;
        this.groundMesh = this.buildGroundMesh(groundDefaultConfig);
        this.groundBody = this.buildGrounBody();
        this.wheelContactMaterial = this.buildWheelContactMaterial();
    }

    addToWorld(world: CANNON.World, scene: THREE.Scene) {
        scene.add(this.groundMesh);
        world.addContactMaterial(this.wheelContactMaterial);
        world.addBody(this.groundBody);
    }

    private buildGroundMesh(config: GroundMeshConfig): THREE.Mesh {
        const groundGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(
            config.widht,
            config.heigth
        );
        const groundMat = new THREE.MeshLambertMaterial({
            color: config.color,
        });

        const groundMesh: THREE.Mesh = new THREE.Mesh(
            groundGeometry,
            groundMat
        );

        groundMesh.rotateX(-Math.PI / 2);
        groundMesh.receiveShadow = true;

        return groundMesh;
    }

    private buildGrounBody(): CANNON.Body {
        const groundMaterial = new CANNON.Material('groundMaterial');
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            material: groundMaterial,
            shape: groundShape,
        });

        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

        groundBody.position.set(0, 0, 0);

        return groundBody;
    }

    private buildWheelContactMaterial(): CANNON.ContactMaterial {
        if (!this.groundBody.material)
            throw new Error('Ground body has no material');

        return new CANNON.ContactMaterial(
            new CANNON.Material('wheel'),
            this.groundBody.material,
            {
                friction: 0.1,
                restitution: 0.1,
                contactEquationStiffness: 1000,
            }
        );
    }
}
