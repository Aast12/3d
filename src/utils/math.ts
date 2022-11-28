import * as THREE from 'three';

export function rangeMap(
    value: number,
    istart: number,
    istop: number,
    ostart: number,
    ostop: number
) {
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}

export function getObjectSize(obj: THREE.Object3D): THREE.Vector3 {
    let boundingBox = new THREE.Box3().setFromObject(obj);
    let dims = new THREE.Vector3();
    boundingBox.getSize(dims);

    return dims;
}
