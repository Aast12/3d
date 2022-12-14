import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Vec3 } from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getObjectSize } from '../utils/math';

export const defaultCityMapConfig = [
    ['.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', 'W', '.', 'W', 'W', 'W', 'W', 'W', '.'],
    ['W', 'W', 'W', 'W', 'W', 'W', '.', 'W', 'W'],
    ['W', '.', 'W', 'W', 'W', '.', '.', '.', 'W'],
    ['W', 'W', 'W', 'W', 'W', 'W', '.', 'W', 'W'],
    ['W', 'W', '.', 'W', 'W', 'W', 'W', 'S', '.'],
    ['.', '.', '.', '.', '.', '.', '.', 'W', '.'],
];

export type CityMapConfig = typeof defaultCityMapConfig;

export type Position = { x: number; y: number };

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

export enum CellType {
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
    Hidden,
}

/**
 * Loads a City object from a buildings model file.
 */
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
 * Manager for the city building. Receives a city config object that represents
 * the city map and generates the buildings accordingly.
 *
 */
export class City {
    buildings: { body: CANNON.Body; object: THREE.Object3D }[] = [];
    buildingMaterial: CANNON.Material = new CANNON.Material('building');
    mapConfig: string[][];
    mapDimensions: { rows: number; cols: number };
    map: CellType[][];
    // @ts-ignore
    startPoint: { x: number; y: number };
    buildingConfig: BuildingConfig = defaultBuildingConfig;
    modelData: Map<BuildingType, THREE.Object3D>;

    constructor(modelData: THREE.Group, config: string[][]) {
        this.mapConfig = config;
        this.mapDimensions = {
            rows: this.mapConfig.length + 2, // Preprocessing adds 2 new rows and cols
            cols: this.mapConfig[0].length + 2,
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
        this.modelData.set(
            BuildingType.Hidden,
            modelData.getObjectByName('Building_hidden')!
        );

        let buildingSize = getObjectSize(
            this.modelData.get(BuildingType.Island)!
        );

        this.buildingConfig = {
            depth: buildingSize.x,
            height: buildingSize.y,
            width: buildingSize.z,
        };

        this.map = this.preprocessMap();

        this.buildCity();
    }

    private isCornerCell(row: number, col: number): boolean {
        const { rows, cols } = this.mapDimensions;
        const offsets = [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
        ];

        return offsets
            .map((offset) => {
                const i = row + offset[0];
                const j = col + offset[1];

                if (i < 0 || j < 0 || i >= rows || j >= cols) return false;

                if (
                    this.mapConfig[i][j] == CellType.Street ||
                    this.mapConfig[i][j] == CellType.StartPoint
                ) {
                    return true;
                }

                return false;
            })
            .some((value) => value);
    }

    /**
     * Returns a map of the surrounding streets [up right down left]
     *
     * @param row Row of the map cell to check
     * @param col Col of the map cell to check
     * @returns a list of 4 numbers, representing if there is a street in the sides
     *          [up right down left]
     */
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
                this.mapConfig[i][j] == CellType.Street ||
                this.mapConfig[i][j] == CellType.StartPoint
            ) {
                surroundingStreet[offset_idx] = 1;
            }
        });

        return surroundingStreet;
    }

    /**
     *
     * @returns a new valid map to generate the city
     */
    preprocessMap(): CellType[][] {
        const { rows, cols } = this.mapDimensions;

        const newMap: CellType[][] = new Array(rows)
            .fill(undefined)
            .map((_) => new Array(cols).fill(CellType.Empty));

        let startPoint: typeof this.startPoint;

        // Wraps the map with buildings
        this.mapConfig = [
            new Array(cols).fill('.'),
            ...this.mapConfig.map((row) => ['.', ...row, '.']),
            new Array(cols).fill('.'),
        ];

        this.mapConfig.forEach((row, row_idx) => {
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

    /**
     * Gets the physical position a cell in the map.
     *
     * @param row
     * @param col
     * @returns A 3D vector with the cell position
     */
    getCellPosition(row: number, col: number): THREE.Vector3 {
        const { depth, width } = this.buildingConfig;

        return new THREE.Vector3(row * depth, 0, col * width);
    }

    /**
     *
     * @param row
     * @param col
     * @returns A list of surrounding street positions to a map cell.
     */
    getSurroundingCellPositions(row: number, col: number): Position[] {
        const { rows, cols } = this.mapDimensions;
        const offsets = {
            up: [1, 0],
            right: [0, 1],
            down: [-1, 0],
            left: [0, -1],
        };

        const positions: Position[] = [];

        Object.keys(offsets).forEach((offset_key) => {
            // @ts-ignore
            const offset = offsets[offset_key];
            const i = row + offset[0];
            const j = col + offset[1];

            if (i < 0 || j < 0 || i >= rows || j >= cols) return;

            if (this.map[i][j] == CellType.Street) {
                positions.push({ x: i, y: j });
            }
        });

        return positions;
    }

    /**
     * Returns a *valid* street random position from the map.
     *
     * The position is calculated doing a DFS from the start point
     * of the map, moving a fixed amount of steps and choosing random
     * neighbor cells.
     *
     * @param distance Steps from the start point to the random position
     * @returns A random street position in the map
     */
    getRandomStreetPos(distance: number): Position {
        const { cols } = this.mapDimensions;

        const dfsStack: { x: number; y: number }[] = [];

        dfsStack.push(this.startPoint);
        const visited = new Set<number>();
        visited.add(this.startPoint.x * cols + this.startPoint.y);
        let step = 0;

        while (dfsStack.length > 0) {
            const top = dfsStack.pop();
            if (step >= distance) {
                return top!;
            }
            this.getSurroundingCellPositions(top!.x, top!.y)
                .sort(() => 0.5 - Math.random())
                .forEach((next) => {
                    const hashed = next.x * cols + next.y;
                    if (!visited.has(hashed)) {
                        dfsStack.push(next);
                        visited.add(hashed);
                    }
                });

            if (dfsStack.length == 0) {
                return top!;
            }

            step++;
        }

        return this.startPoint;
    }

    buildCity() {
        const { depth, width } = this.buildingConfig;

        // Finds type of building and rotates according to surrounding streets
        this.mapConfig.forEach((row, row_idx) => {
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

                        // count 0 is ignored, buildings with no surrounding streets are not
                        // rendered
                        switch (count) {
                            case 1: {
                                let rotation = Math.PI / 2;
                                const side = surroundingStreet.indexOf(1);
                                if (side == 0) rotation *= 1;
                                if (side == 1) rotation *= 0;
                                if (side == 2) rotation *= -1;
                                if (side == 3) rotation *= 2;

                                this.generateBuilding(
                                    BuildingType.OneSide,
                                    new Vec3(row_idx * depth, 0, col * width),
                                    rotation
                                );
                                break;
                            }
                            case 2: {
                                for (let i = 0; i < 4; i++) {
                                    let next = (i + 1) % 4;
                                    if (
                                        surroundingStreet[i] &&
                                        surroundingStreet[next]
                                    ) {
                                        let rotation = 0;
                                        if (i == 0) rotation = 0;
                                        if (i == 1) rotation = -Math.PI / 2;
                                        if (i == 2) rotation = Math.PI;
                                        if (i == 3) rotation = Math.PI / 2;

                                        this.generateBuilding(
                                            BuildingType.Corner,
                                            new Vec3(
                                                row_idx * depth,
                                                0,
                                                col * width
                                            ),
                                            rotation
                                        );
                                        break;
                                    }

                                    if (i == 3) {
                                        const rotation = surroundingStreet[1]
                                            ? 0
                                            : Math.PI / 2;

                                        this.generateBuilding(
                                            BuildingType.TwoSides,
                                            new Vec3(
                                                row_idx * depth,
                                                0,
                                                col * width
                                            ),
                                            rotation
                                        );
                                    }
                                }
                                break;
                            }
                            case 3: {
                                let rotation = Math.PI / 2;
                                const side = surroundingStreet.indexOf(0);
                                if (side == 0) rotation *= -1;
                                if (side == 1) rotation *= 2;
                                if (side == 2) rotation *= 1;
                                if (side == 3) rotation *= 0;

                                this.generateBuilding(
                                    BuildingType.SingleCorner,
                                    new Vec3(row_idx * depth, 0, col * width),
                                    rotation
                                );
                                break;
                            }
                            default: {
                                if (this.isCornerCell(row_idx, col)) {
                                    this.generateBuilding(
                                        BuildingType.Hidden,
                                        new Vec3(
                                            row_idx * depth,
                                            0,
                                            col * width
                                        )
                                    );
                                }
                            }
                        }

                        break;
                    }
                }
            });
        });
    }

    generateBuilding(
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

        if (rotation) {
            object.rotateY(rotation);
        }

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
    }

    dispose(world: CANNON.World, scene: THREE.Scene) {
        this.buildings.forEach(({ body, object }) => {
            world.removeBody(body);
            scene.remove(object);
        });
    }
}
