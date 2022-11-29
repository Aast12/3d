import { Keyboard } from './utils/keyboard';
import { defaultCityMapConfig } from './objects/City';
import { setup } from './setup';
import { defaultVehicleConfig } from './objects/Vehicle';
import { Game } from './Game';

Keyboard.initialize();

// Initialization
const { scene, renderer } = setup();

const game = new Game(scene, renderer, {
    busConfig: defaultVehicleConfig,
    cityMapConfig: defaultCityMapConfig,
    envConfig: {
        dayDuration: 10,
    },
    debug: false,
});

game.init().then(() => {
    animate(game);
});

function animate(game: Game) {
    requestAnimationFrame(() => animate(game));
    game.update();
}
