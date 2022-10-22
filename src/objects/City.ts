import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Vec3 } from 'cannon-es';

export type BuildingConfig = {
    width: number;
    height: number;
    depth: number;
};

export type CityConfig = {
    rows: number;
    columns: number;
    squareRows: number;
    squareCols: number;
    streetWidth: number;
    buildingConfig: BuildingConfig;
};

export class City {
    buildings: { body: CANNON.Body; object: THREE.Object3D }[] = [];
    buildingMaterial: CANNON.Material = new CANNON.Material('building');
    config: CityConfig;

    constructor(config: CityConfig) {
        this.config = config;
        this.buildCity();
    }

    genBuilding(
        depth: number,
        width: number,
        startPosition: Vec3,
        sqCol: number,
        sqRow: number
    ) {
        let x = startPosition.x + depth * sqCol;
        let y = startPosition.y + width * sqRow;
        const buildPosition = new Vec3(
            0,
            this.config.buildingConfig.height / 4,
            0
        );
        buildPosition.x = x + depth / 2;
        buildPosition.z = y + width / 2;

        this.buildBuilding(buildPosition);

        return buildPosition
    }   

    buildCity() {
        const { rows, columns, squareRows, squareCols, streetWidth } =
            this.config;
        const { depth, width } = this.config.buildingConfig;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                let startX = (squareRows * depth + streetWidth * 2) * col;
                let startY = (squareCols * width + streetWidth * 2) * row;
                const startPosition = new Vec3(startX, 0, startY);
                console.log('startPOS', startPosition);

                for (let sqRow = 0; sqRow < squareRows; sqRow++) {
                    if (sqRow == 0 || sqRow == squareRows - 1) {
                        for (let sqCol = 0; sqCol < squareCols; sqCol++) {
                            
                            const po = this.genBuilding(
                                depth,
                                width,
                                startPosition,
                                sqCol,
                                sqRow
                            );
                            console.log('a', po);
                        }
                    } else {
                        for (let sqCol of [0, squareCols - 1]) {
                            console.log('b');
                            const po = this.genBuilding(
                                depth,
                                width,
                                startPosition,
                                sqCol,
                                sqRow
                            );
                            console.log('b', po);
                        }
                    }
                }
            }
        }
    }

    buildBuilding(position: Vec3) {
        // Physics body
        const { depth, height, width } = this.config.buildingConfig;
        const body = new CANNON.Body({
            type: CANNON.BODY_TYPES.STATIC,
            material: this.buildingMaterial,
            shape: new CANNON.Box(new Vec3(depth / 2, height / 2, width / 2)),
        });

        const object = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshPhongMaterial({
                color: 0xaa0000,
            })
        );

        object.position.set(position.x, position.y, position.z);
        body.position.set(position.x, position.y, position.z);

        this.buildings.push({
            body,
            object,
        });
    }

    addToWorld(world: CANNON.World, scene: THREE.Scene) {
        this.buildings.forEach(({ body, object }) => {
            world.addBody(body);
            scene.add(object);
            object.receiveShadow = true;
        });
    }
}
