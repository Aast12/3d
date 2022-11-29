import CannonDebugger from 'cannon-es-debugger';
import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import { Environment, EnvironmentConfig } from './env/env';
import { Bus, BusLoader } from './objects/Bus';
import {
    City,
    CityLoader,
    CityMapConfig,
    defaultCityMapConfig,
} from './objects/City';
import { defaultVehicleConfig, VehicleConfig } from './objects/Vehicle';
import { ChaseCam } from './utils/ChaseCam';
import { Keyboard } from './utils/keyboard';

export type GameConfig = {
    busConfig: VehicleConfig;
    cityMapConfig: CityMapConfig;
    debug: boolean;
};

export class Game {
    scene: THREE.Scene;
    renderer: WebGLRenderer;
    city: City | undefined;
    bus: Bus | undefined;
    env: Environment;
    chaseCam: ChaseCam | undefined;
    cannonDbg: ReturnType<typeof CannonDebugger> | undefined;
    audioListener: THREE.AudioListener;

    constructor(
        scene: THREE.Scene,
        renderer: WebGLRenderer,
        envConfig?: EnvironmentConfig
    ) {
        this.scene = scene;
        this.renderer = renderer;
        this.env = new Environment(this.scene, envConfig);
        this.scene.background = new THREE.Color().setHSL(0.6, 0, 1);
        this.audioListener = new THREE.AudioListener();
    }

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

    async init(config: GameConfig) {
        // Init debugger
        if (config.debug) {
            this.cannonDbg = CannonDebugger(this.scene, this.env.world, {});
        }

        this.env.timer.start();
        await this.buildResources(config);
    }

    update() {
        const chaseCam = this.chaseCam;
        if (!chaseCam) return;

        Keyboard.clear();
        this.env.update();

        this.bus && this.bus.update();
        this.env.world.fixedStep();
        this.cannonDbg && this.cannonDbg.update();

        chaseCam.update();

        this.renderer.render(this.scene, chaseCam.get());
    }
}
