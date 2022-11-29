import * as THREE from 'three';

export const setup = () => {
    const renderer = new THREE.WebGLRenderer();
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    return {
        renderer,
        scene: new THREE.Scene(),
    };
};
