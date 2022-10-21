import { Key } from 'ts-key-enum';

export enum KeyState {
    UNPRESSED,
    PRESSED,
    RELEASED,
}

/**
 * Clase para detectar la entrada del teclado
 */
export class Keyboard {
    private static state: Map<string, KeyState> = new Map<string, KeyState>();

    static initialize() {
        document.addEventListener('keydown', Keyboard.keyDown);
        document.addEventListener('keyup', Keyboard.keyUp);
    }

    static isPressed(key: Key | string) {
        return this.state.get(key) == KeyState.PRESSED;
    }
    static isReleased(key: Key | string) {
        return this.state.get(key) == KeyState.RELEASED;
    }

    static keyDown(e: KeyboardEvent): void {
        Keyboard.state.set(e.key, KeyState.PRESSED);
    }

    static keyUp(e: KeyboardEvent): void {
        Keyboard.state.set(e.key, KeyState.RELEASED);
    }

    static clear() {
        this.state.forEach((value, key) => {
            if (value == KeyState.RELEASED)
                this.state.set(key, KeyState.UNPRESSED);
        });
    }
}
