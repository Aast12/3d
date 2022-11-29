import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Vec3 } from 'cannon-es';
import { Vector3 } from 'three';
import { randInt } from 'three/src/math/MathUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getObjectSize } from '../utils/math';

export const defaultCityConfig = [
    ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', 'V', 'V', 'V', 'V', 'V', 'V', 'V', '.'],
    ['.', 'V', '.', '.', 'V', '.', '.', 'V', '.'],
    ['.', 'V', '.', '.', 'V', 'V', 'V', 'V', '.'],
    ['.', 'V', 'V', '.', 'V', '.', '.', 'V', '.'],
    ['.', '.', 'V', 'V', 'V', 'V', 'V', 'S', '.'],
    ['.', '.', 'V', '.', '.', '.', '.', 'V', '.'],
];

const defaultBuildingConfig = {
    width: 20,
    height: 20,
    depth: 20,
};

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

enum CellType {
    Building,
    Street,
    StartPoint,
}

export class CityLoader {
    config: string[][];

    constructor(cityConfig: string[][]) {
        this.config = cityConfig;
    }

    async getCityLoaded(): Promise<City> {
        const data = await this.loadResources();

        return new City(data, this.config);
    }

    async loadResources(): Promise<THREE.Group> {
        const gltfLoader = new GLTFLoader();
        const url = 'src/models/building.gltf';
        return new Promise((resolve, reject) => {
            gltfLoader.load(
                url,
                (gltf) => {
                    resolve(gltf.scene);
                },
                (progress) => {
                    console.info('bus load progress', progress.total);
                },
                reject
            );
        });
    }
}

/**
 * Representation of a city. Currently only builds a matrix of buildings,
 * but this class will allow to get information about the city structure
 * and important points (intersection, streets, blocks, etc).
 *
 */
export class City {
    buildings: { body: CANNON.Body; object: THREE.Object3D }[] = [];
    buildingMaterial: CANNON.Material = new CANNON.Material('building');
    config: string[][];
    buildingConfig: BuildingConfig = defaultBuildingConfig;
    modelData: THREE.Object3D;
    boxes: any[] = [];

    constructor(modelData: THREE.Group, config: string[][]) {
        this.config = config;

        this.modelData = modelData.getObjectByName('Building')!;
        let buildingSize = getObjectSize(this.modelData);

        this.buildingConfig = {
            depth: buildingSize.x,
            height: buildingSize.y,
            width: buildingSize.z,
        };

        this.buildCity();
    }

    validateCityMap() {}

    genBuilding(
        depth: number,
        width: number,
        startPosition: Vec3,
        sqCol: number,
        sqRow: number
    ) {
        let x = startPosition.x + depth * sqCol;
        let y = startPosition.z + width * sqRow;
        const buildPosition = new Vec3();
        buildPosition.x = x + depth / 2;
        buildPosition.z = y + width / 2;

        this.buildBuilding(buildPosition);

        return buildPosition;
    }

    getStreetPos() {
        const { depth, height, width } = this.buildingConfig;

        return this.buildings[
            randInt(0, this.buildings.length - 1)
        ].object.position
            .clone()
            .add(new Vector3(depth * 1.5, height * 10, width * 1.5));
    }

    buildCity() {
        const { depth, height, width } = this.buildingConfig;

        this.config.forEach((row, row_idx) => {
            row.forEach((cell, col) => {
                if (cell == '.') {
                    this.buildBuilding(
                        new Vec3(row_idx * depth, 0, col * width)
                    );
                }
            });
        });
    }

    buildBuilding(position: Vec3) {
        const model = this.modelData;

        // Physics body
        const { depth, height, width } = this.buildingConfig;
        const body = new CANNON.Body({
            type: CANNON.BODY_TYPES.STATIC,
            material: this.buildingMaterial,
            shape: new CANNON.Box(new Vec3(depth / 2, height / 2, width / 2)),
        });

        const object = model.clone(true);

        object.traverse((node) => {
            node.receiveShadow = true;
            node.castShadow = true;
        });

        // const box = ;

        this.boxes.push(new THREE.BoxHelper(object, 0xff0000));

        object.position.set(position.x, position.y, position.z);
        body.position.set(position.x, position.y + height / 2, position.z);

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
        this.boxes.forEach((box) => scene.add(box));
    }
}
