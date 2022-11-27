import { Camera, Object3D, PerspectiveCamera, Vector3 } from 'three';

export type CameraConfig = {
    fov?: number | undefined;
    aspect?: number | undefined;
    near?: number | undefined;
    far?: number | undefined;
};

const defaultCameraConfig = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
};

/**
 * ChaseCam
 * 
 * Implements a perspective camera that follows the position of a
 * Three Object. 
 * 
 * On every update a position relative to the object is computed 
 * and setted to the camera. Some interpolation in the position change 
 * is done for a smooth movement.
 */
export class ChaseCam {
    camera: Camera;
    target: Object3D;
    camDistance: number;
    objRelativePosition: Vector3;
    goal = new Object3D();
    vecA = new Vector3();
    vecB = new Vector3();
    dir = new Vector3();

    constructor(
        target: Object3D,
        camDistance: number,
        objRelativePosition: Vector3,
        cameraConfig?: CameraConfig
    ) {
        this.camDistance = camDistance;
        this.objRelativePosition = objRelativePosition;
        this.target = target;
        const config = cameraConfig || defaultCameraConfig;
        this.camera = new PerspectiveCamera(
            config.fov,
            config.aspect,
            config.near,
            config.far
        );
        this.goal.add(this.camera);

        this.goal.position.z = -camDistance;
    }

    get() {
        return this.camera;
    }

    update() {
        const {
            vecA,
            vecB,
            goal,
            target,
            camera,
            objRelativePosition,
            camDistance,
        } = this;

        vecA.lerp(this.target.position.clone().add(objRelativePosition), 0.9);
        vecB.copy(goal.position);

        const dis = vecA.distanceTo(vecB) - camDistance;
        goal.position.addScaledVector(vecA.clone().sub(vecB).normalize(), dis);

        camera.lookAt(target.position);
    }
}
