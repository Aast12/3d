import CannonDebugger from 'cannon-es-debugger';
import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import { randInt } from 'three/src/math/MathUtils';
import { Environment, EnvironmentConfig } from './env/env';
import { Bus, BusLoader } from './objects/Bus';
import { City, CityLoader, CityMapConfig, Position } from './objects/City';
import { Interactive } from './objects/Interactive';
import { Passenger } from './objects/Passenger';
import { VehicleConfig } from './objects/Vehicle';
import { ChaseCam } from './utils/ChaseCam';
import { Keyboard } from './utils/keyboard';

export type GameConfig = {
    busConfig: VehicleConfig;
    cityMapConfig: CityMapConfig;
    envConfig?: EnvironmentConfig;
    debug: boolean;
};

export class Game {
    config: GameConfig;
    scene: THREE.Scene;
    renderer: WebGLRenderer;
    city: City | undefined;
    bus: Bus | undefined;
    env: Environment;
    chaseCam: ChaseCam | undefined;
    cannonDbg: ReturnType<typeof CannonDebugger> | undefined;
    audioListener: THREE.AudioListener;

    nextPos: Position | undefined;
    target: Interactive | undefined;
    nextPassenger: Passenger | undefined;

    constructor(
        scene: THREE.Scene,
        renderer: WebGLRenderer,
        config: GameConfig
    ) {
        this.config = config;
        this.scene = scene;
        this.renderer = renderer;
        this.env = new Environment(this.scene, config.envConfig, config.debug);
        this.scene.background = new THREE.Color().setHSL(0.6, 0, 1);
        this.audioListener = new THREE.AudioListener();
    }

    generatePassenger() {}

    async buildBus(config: VehicleConfig): Promise<Bus> {
        this.bus = await new BusLoader(config).getBusLoaded();
        return this.bus;
    }

    async buildCity(cityConfig: CityMapConfig): Promise<City> {
        this.city = await new CityLoader(cityConfig).getCityLoaded();
        return this.city;
    }

    async buildResources(config: GameConfig) {
        const city = await this.buildCity(config.cityMapConfig);

        const { x, y } = city.startPoint;
        const initialPosition = city.getCellPosition(x, y);
        initialPosition.y = 10;

        city.addToWorld(this.env.world, this.scene);

        const bus = await this.buildBus({
            ...config.busConfig,
            initialPosition,
        });

        bus.addToWorld(this.env.world, this.scene);
        bus.subscribeAudio(this.audioListener);

        this.chaseCam = new ChaseCam(
            bus.object,
            20,
            new THREE.Vector3(0, 10, 0)
        );

        this.chaseCam.get().add(this.audioListener);
    }

    async init() {
        // Init debugger
        if (this.config.debug) {
            this.cannonDbg = CannonDebugger(this.scene, this.env.world, {});
        }

        this.env.timer.start();
        await this.buildResources(this.config);
    }

    clearPassenger() {
        this.nextPassenger?.dispose(this.env.world, this.scene);
        this.nextPassenger = undefined;
    }

    update() {
        const chaseCam = this.chaseCam;
        if (!chaseCam) return;

        Keyboard.clear();
        this.env.world.fixedStep();
        this.env.update();

        if (!this.nextPassenger) {
            const distance = randInt(3, 20);
            const nextPos = this.city!.getRandomStreetPos(distance);
            const position = this.city!.getCellPosition(nextPos.x, nextPos.y);

            this.nextPassenger = new Passenger(
                position,
                this.clearPassenger.bind(this)
            );
            this.nextPassenger.addToWorld(this.env.world, this.scene);
        }

        this.bus && this.bus.update();
        this.cannonDbg && this.cannonDbg.update();

        chaseCam.update();

        this.renderer.render(this.scene, chaseCam.get());
    }
}
