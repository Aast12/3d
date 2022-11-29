import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Vec3 } from 'cannon-es';
import { Vector3 } from 'three';
import { randInt } from 'three/src/math/MathUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getObjectSize } from '../utils/math';

export const defaultCityConfig = [
    ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', 'W', 'W', 'W', 'W', 'W', 'W', 'W', '.'],
    ['.', 'W', '.', '.', 'W', '.', '.', 'W', '.'],
    ['.', 'W', '.', '.', 'W', 'W', 'W', 'W', '.'],
    ['.', 'W', 'W', '.', 'W', '.', '.', 'W', '.'],
    ['.', '.', 'W', 'W', 'W', 'W', 'W', 'S', '.'],
    ['.', '.', 'W', '.', '.', '.', '.', 'W', '.'],
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
    Building = '.',
    RawStreet = 'V',
    Street = 'W',
    StartPoint = 'S',
    Empty = ' ',
}

enum BuildingType {
    Corner,
    SingleCorner,
    TwoSides,
    OneSide,
    Island,
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
    mapDimensions: { rows: number; cols: number };
    map: CellType[][];
    // @ts-ignore
    startPoint: { x: number; y: number };
    buildingConfig: BuildingConfig = defaultBuildingConfig;
    // modelData: THREE.Object3D;
    modelData: Map<BuildingType, THREE.Object3D>;

    constructor(modelData: THREE.Group, config: string[][]) {
        this.config = config;
        this.mapDimensions = {
            rows: this.config.length,
            cols: this.config[0].length,
        };

        this.modelData = new Map();
        this.modelData.set(
            BuildingType.Corner,
            modelData.getObjectByName('Building_corner')!
        );
        this.modelData.set(
            BuildingType.Island,
            modelData.getObjectByName('Building_island')!
        );
        this.modelData.set(
            BuildingType.OneSide,
            modelData.getObjectByName('Building_one_side')!
        );
        this.modelData.set(
            BuildingType.TwoSides,
            modelData.getObjectByName('Building_two_sides')!
        );
        this.modelData.set(
            BuildingType.SingleCorner,
            modelData.getObjectByName('Building_single_corner')!
        );

        let buildingSize = getObjectSize(
            this.modelData.get(BuildingType.Island)!
        );

        this.buildingConfig = {
            depth: buildingSize.x,
            height: buildingSize.y,
            width: buildingSize.z,
        };

        this.map = this.validateCityMap();

        this.buildCity();
    }

    private getSurroundingStreet(row: number, col: number): number[] {
        const { rows, cols } = this.mapDimensions;
        const positions = {
            up: [1, 0],
            right: [0, 1],
            down: [-1, 0],
            left: [0, -1],
        };

        const surroundingStreet: number[] = [0, 0, 0, 0]; // up right down left
        Object.keys(positions).forEach((offset_key, offset_idx) => {
            // @ts-ignore
            const offset = positions[offset_key];
            const i = row + offset[0];
            const j = col + offset[1];

            if (i < 0 || j < 0 || i >= rows || j >= cols) return;

            if (
                this.config[i][j] == CellType.Street ||
                this.config[i][j] == CellType.StartPoint
            ) {
                surroundingStreet[offset_idx] = 1;
                // surroundingStreet.push(offset_key);
            }
        });

        return surroundingStreet;
    }

    validateCityMap() {
        const { rows, cols } = this.mapDimensions;

        const newMap: CellType[][] = new Array(rows)
            .fill(undefined)
            .map((_) => new Array(cols).fill(CellType.Empty));

        let startPoint: typeof this.startPoint;

        this.config.forEach((row, row_idx) => {
            row.forEach((cell, col) => {
                switch (cell) {
                    case CellType.Building: {
                        newMap[row_idx][col] = CellType.Building;
                        break;
                    }
                    case CellType.StartPoint: {
                        if (startPoint) {
                            throw new Error(
                                'Map can only have one start point'
                            );
                        }
                        startPoint = { x: row_idx, y: col };
                        newMap[row_idx][col] = CellType.StartPoint;
                        break;
                    }
                    case CellType.Street: {
                        newMap[row_idx][col] = CellType.Street;
                        break;
                    }
                    case CellType.Empty: {
                        newMap[row_idx][col] = CellType.Empty;
                        break;
                    }
                }
            });
        });

        // @ts-ignore
        this.startPoint = startPoint;
        return newMap;
    }

    getCellPosition(row: number, col: number): THREE.Vector3 {
        const { depth, width } = this.buildingConfig;

        return new THREE.Vector3(row * depth, 0, col * width);
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
                switch (cell) {
                    case CellType.Building: {
                        const surroundingStreet = this.getSurroundingStreet(
                            row_idx,
                            col
                        );
                        const count = surroundingStreet.reduce(
                            (prev, curr) => prev + curr,
                            0
                        );
                        // this.map[row_idx][col] = CellType.Building;
                        switch (count) {
                            case 1: {
                                this.buildBuilding(
                                    BuildingType.OneSide,
                                    new Vec3(row_idx * depth, 0, col * width)
                                );
                            }
                            case 2: {
                                for (let i = 0; i < 4; i++) {
                                    let next = (i + 1) % 4;
                                    if (
                                        surroundingStreet[i] &&
                                        surroundingStreet[next]
                                    ) {
                                        this.buildBuilding(
                                            BuildingType.Corner,
                                            new Vec3(
                                                row_idx * depth,
                                                0,
                                                col * width
                                            )
                                        );
                                        break;
                                    }

                                    if (i == 3) {
                                        this.buildBuilding(
                                            BuildingType.TwoSides,
                                            new Vec3(
                                                row_idx * depth,
                                                0,
                                                col * width
                                            )
                                        );
                                    }
                                }
                                break;
                            }
                            case 3: {
                                this.buildBuilding(
                                    BuildingType.SingleCorner,
                                    new Vec3(row_idx * depth, 0, col * width)
                                );
                            }
                        }

                        break;
                    }
                }
            });
        });
    }

    buildBuilding(
        buildingType: BuildingType,
        position: Vec3,
        rotation: number = 0
    ) {
        const model = this.modelData.get(buildingType)!;

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

        object.position.set(position.x, position.y, position.z);
        body.position.set(position.x, position.y + height / 2, position.z);

        if (rotation) {
            object.rotateX(rotation);
        }

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
