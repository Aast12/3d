import * as THREE from 'three';

import skyBoxFragment from '../shaders/skyBoxFragment.js';
import skyBoxVertex from '../shaders/skyBoxVertex.js';
import { Timer } from './timer';

const hemisphereDefaultConfig = {
    skyColor: new THREE.Color().setHSL(0.6, 1, 0.6),
    groundColor: new THREE.Color().setHSL(0.095, 1, 0.75),
    intensity: 0.6,
    initialPosition: new THREE.Vector3(0, 500, 0),
    useHelper: true,
};

const sunLightDefaultConfig = {
    color: new THREE.Color().setHSL(0.072, 0.82, 0.58),
    nightColor: new THREE.Color().setHSL(0.62, 0.71, 0.58),
    intensity: 5,
    initialPosition: new THREE.Vector3(0, 100, 0),
    distanceFromGround: 100,
};

const skyBoxDefaultConfig = {
    topColor: hemisphereDefaultConfig.skyColor,
    bottomColor: new THREE.Color(0xffffff),
    offset: 33,
    exponent: 0.6,
    radius: 1000,
    widthSegments: 32,
    heightSegments: 15,
};

type HemisphereConfig = typeof hemisphereDefaultConfig;
type SunLightConfig = typeof sunLightDefaultConfig;
type SkyBoxConfig = typeof skyBoxDefaultConfig;

/**
 * Sets up the environment conditions e.g. day/night cycle and sky.
 *
 */
export class Sky {
    private debug: boolean;
    private hemisphereLight: THREE.HemisphereLight;
    private sunLight: THREE.DirectionalLight;
    private skyMesh: THREE.Mesh;
    private timer: Timer;
    private minLight: number;
    private maxLight: number;

    constructor(timer: Timer, debug: boolean = false) {
        this.debug = debug;
        this.timer = timer;
        this.hemisphereLight = this.buildHemisphereLight(
            hemisphereDefaultConfig
        );
        this.sunLight = this.buildSunLight(sunLightDefaultConfig);

        this.skyMesh = this.buildSky(skyBoxDefaultConfig);

        this.minLight = 0.1;
        this.maxLight = 0.5;
    }

    addToScene(scene: THREE.Scene) {
        scene.add(this.hemisphereLight);
        scene.add(this.sunLight);
        scene.add(this.skyMesh);

        if (this.debug) {
            let hemisphereHelper = new THREE.HemisphereLightHelper(
                this.hemisphereLight,
                10,
                0x00ff00
            );
            scene.add(hemisphereHelper);

            let dirLightHelper = new THREE.DirectionalLightHelper(
                this.sunLight,
                30,
                0x00ff00
            );
            scene.add(dirLightHelper);
        }
    }

    private buildHemisphereLight(
        config: HemisphereConfig
    ): THREE.HemisphereLight {
        const hemiLight = new THREE.HemisphereLight(
            config.skyColor,
            config.groundColor,
            config.intensity
        );

        hemiLight.position.copy(config.initialPosition);

        return hemiLight;
    }

    private buildSunLight(config: SunLightConfig): THREE.DirectionalLight {
        const dirLight = new THREE.DirectionalLight(
            config.color,
            config.intensity
        );
        dirLight.position.copy(config.initialPosition);

        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height =
            1024 * 2;

        var d = 300;

        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;

        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = -0.0001;

        return dirLight;
    }

    private buildSky(config: SkyBoxConfig): THREE.Mesh {
        const vertexShader = skyBoxVertex;
        const fragmentShader = skyBoxFragment;

        const uniforms = {
            topColor: { value: config.topColor },
            bottomColor: { value: config.bottomColor },
            offset: { value: config.offset },
            exponent: { value: config.exponent },
        };

        // scene.fog.color.copy(uniforms['bottomColor'].value);
        // scene.fog.color.setHex(0);

        const skyGeo = new THREE.SphereGeometry(
            config.radius,
            config.widthSegments,
            config.heightSegments
        );
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide,
        });

        return new THREE.Mesh(skyGeo, skyMat);
    }

    calcNextPos = (posVector: THREE.Vector3, diffAngle: number) => {
        let x2 =
            Math.cos(diffAngle) * posVector.x -
            Math.sin(diffAngle) * posVector.y;
        let y2 =
            Math.sin(diffAngle) * posVector.x +
            Math.cos(diffAngle) * posVector.y;

        return new THREE.Vector3(x2, y2, posVector.z);
    };

    update() {
        let newSunPosition = this.calcNextPos(
            new THREE.Vector3(sunLightDefaultConfig.distanceFromGround, 0, 0),
            this.timer.mapTime(0, Math.PI * 2)
        );

        this.sunLight.position.copy(newSunPosition);

        if (this.timer.isDay()) {
            this.sunLight.visible = true;
        } else {
            this.sunLight.visible = false;
        }

        let newColor = { h: 0, s: 0, l: 0 };

        this.hemisphereLight.color.getHSL(newColor);
        this.hemisphereLight.color.setHSL(
            newColor.h,
            newColor.s,
            this.timer.mapTime(this.minLight, this.maxLight)
        );

        (this.skyMesh?.material as THREE.ShaderMaterial).uniforms[
            'topColor'
        ].value.copy(this.hemisphereLight.color);
    }
}
