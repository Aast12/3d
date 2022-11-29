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

    document.getElementById('start')?.addEventListener('click', (_) => {
        document.getElementById('tutorial')!.hidden = true;
        document.getElementById('info-container')!.hidden = false;
        game.startGame();
    });
});

function animate(game: Game) {
    requestAnimationFrame(() => animate(game));
    game.update();
}
