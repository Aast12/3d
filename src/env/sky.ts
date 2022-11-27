import * as THREE from 'three';
import { CineonToneMapping, Vector3 } from 'three';
import { Keyboard } from '../utils/keyboard';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { Bus } from '../objects/Bus';
import { defaultVehicleConfig } from '../objects/Vehicle';
import { City } from '../objects/City';
import { ChaseCam } from '../utils/ChaseCam';
import { Interactive } from '../objects/Interactive';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import skyBoxFragment from '../shaders/skyBoxFragment.js';
import skyBoxVertex from '../shaders/skyBoxVertex.js';
import { Timer } from './timer';
import { rangeMap } from '../utils/math';

const hemisphereDefaultConfig = {
    skyColor: new THREE.Color().setHSL(0.6, 1, 0.6),
    groundColor: new THREE.Color().setHSL(0.095, 1, 0.75),
    intensity: 0.6,
    initialPosition: new THREE.Vector3(0, 0, 0),
    useHelper: true,
};

const sunLightDefaultConfig = {
    color: new THREE.Color().setHSL(0.072, 0.82, 0.58),
    intensity: 2,
    initialPosition: new THREE.Vector3(0, 1000, 50),
    distanceFromGround: 1000,
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

        const shadowOffset = 50;

        dirLight.shadow.camera.left = -shadowOffset;
        dirLight.shadow.camera.right = shadowOffset;
        dirLight.shadow.camera.top = shadowOffset;
        dirLight.shadow.camera.bottom = -shadowOffset;

        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = -0.0001;

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

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
        // chaseCam.update();

        // renderer.render(scene, chaseCam.get());
        // sunLight.position.y -= 0.5;

        // let newPos = calcNextPos(sunLight.position, (Math.PI * 2) / (60 * 10));
        let newSunPosition = this.calcNextPos(
            new THREE.Vector3(sunLightDefaultConfig.distanceFromGround, 0, 0),
            rangeMap(
                this.timer.currTime,
                0,
                this.timer.secDayDuration,
                0,
                Math.PI * 2
            )
            // this.timer.currTime * ((Math.PI * 2) / (6 * 1))
        );

        this.sunLight.position.copy(newSunPosition);

        // toCenterHelper.position.copy(new Vector3(0, 0, 0));
        // toCenterHelper.setDirection(
        //     new Vector3(0, 0, 0).sub(sunLight.position)
        // );

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

        // if (currTime > 3) {
        //     // sunLight.visible = false;
        //     // currLight -= lightDiff * dt;
        //     // hemiLight.color.setHSL(0.6, 1, 0.1);
        //     console.log('set ', 0.1 + currLight);
        //     hemiLight.color.setHSL(0.6, 1, 0.1 + currLight);

        //     // sky.material.
        //     sky.material.uniforms['topColor'].value.copy(hemiLight.color);
        //     // sky.material.uniforms['bottomColor'].value.copy(
        //     //     new THREE.Color().setHSL(0.6, 0.2, 0.27)
        //     // );

        //     // scene.fog?.color.copy(uniforms['bottomColor'].value);
        // } else {
        //     // sunLight.visible = true;
        //     // currLight += lightDiff * dt;
        //     // hemiLight.color.setHSL(0.6, 1, 0.6);
        //     // hemiLight.color.setHSL(0.57, 1, 0.5);
        //     console.log('set ', 0.1 + currLight);
        //     hemiLight.color.setHSL(0.57, 1, 0.1 + currLight);
        //     // hemiLight.intensity = 0;
        //     // sky.material.uniforms['topColor'].value.copy(hemiLight.color);

        //     // scene.fog?.color.copy(uniforms['bottomColor'].value);
        // }
        // bus.update();
    }
}
