import * as THREE from 'three';
import { Vector3 } from 'three';
import { Keyboard } from './utils/keyboard';
import CannonDebugger from 'cannon-es-debugger';
import { BusLoader } from './objects/Bus';
import { CityLoader, defaultCityMapConfig } from './objects/City';
import { ChaseCam } from './utils/ChaseCam';
import { Interactive } from './objects/Interactive';

import { setup } from './setup';
import { Environment } from './env/env';
import { defaultVehicleConfig } from './objects/Vehicle';
import { Game } from './Game';

Keyboard.initialize();

// Initialization
const { scene, renderer } = setup();

const game = new Game(scene, renderer, {
    dayDuration: 5,
});

game.init({
    busConfig: defaultVehicleConfig,
    cityMapConfig: defaultCityMapConfig,
    debug: true,
}).then(() => {
    animate(game);
});

function animate(game: Game) {
    requestAnimationFrame(() => animate(game));
    game.update();
}
