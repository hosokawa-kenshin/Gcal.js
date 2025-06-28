import { jumpCommand } from '../commands/jump.js';
import { addEvent } from '../commands/add.js';
import { addEventNL } from '../commands/addNL.js';
import { editEvent } from '../commands/edit.js';
import { toggleFullscreen } from './layout.js';

export function setupVimKeysForNavigation(widget, screen, focusbackwith) {
    screen.key(['j', 'k', 'h', 'l'], (ch, key) => {
        if (screen.focused === widget) {
            if (ch === 'j') {
                if (widget.rows) {
                    widget.rows.down();
                } else if (widget.down) {
                    widget.down();
                }
            } else if (ch === 'k') {
                if (widget.rows) {
                    widget.rows.up();
                } else if (widget.up) {
                    widget.up();
                }
            } else if (ch === 'h' || ch === 'l') {
                if (focusbackwith && focusbackwith.visible) {
                    focusbackwith.focus();
                }
            }

            screen.render();
        }
    });
}

export function setupKeyBindings(screen, auth, calendars, events, allEvents, inputBox, setting) {
    const keyBindings = setting?.keyBindings || getDefaultKeyBindings();

    screen.key(keyBindings.quit || ['q', 'C-c'], () => process.exit(0));

    screen.key(keyBindings.addEvent || ['a'], () =>
        addEvent(auth, screen, calendars, events, allEvents));

    screen.key(keyBindings.addEventNL || ['l'], () =>
        addEventNL(auth, screen, calendars, events, allEvents));

    screen.key(keyBindings.nextWeek || ['n'], () =>
        jumpCommand(screen, events, allEvents, ['nw']));

    screen.key(keyBindings.prevWeek || ['p'], () =>
        jumpCommand(screen, events, allEvents, ['lw']));

    screen.key(keyBindings.nextMonth || ['C-n'], () =>
        jumpCommand(screen, events, allEvents, ['nm']));

    screen.key(keyBindings.prevMonth || ['C-p'], () =>
        jumpCommand(screen, events, allEvents, ['lm']));

    screen.key(keyBindings.today || ['t'], () =>
        jumpCommand(screen, events, allEvents, []));

    screen.key(keyBindings.toggleCommandLine || ['space'], () => {
        inputBox.show();
        inputBox.focus();
        screen.render();
    });

    screen.key(keyBindings.fullscreenTable1 || ['1'], () => toggleFullscreen(1));
    screen.key(keyBindings.fullscreenTable2 || ['2'], () => toggleFullscreen(2));
    screen.key(keyBindings.fullscreenTable3 || ['3'], () => toggleFullscreen(3));
    screen.key(keyBindings.exitFullscreen || ['escape'], () => toggleFullscreen(0));
}

export function getDefaultKeyBindings() {
    return {
        quit: ['q', 'C-c'],
        addEvent: ['a'],
        addEventNL: ['l'],
        nextWeek: ['n'],
        prevWeek: ['p'],
        nextMonth: ['C-n'],
        prevMonth: ['C-p'],
        today: ['t'],
        toggleCommandLine: ['space'],
        fullscreenTable1: ['1'],
        fullscreenTable2: ['2'],
        fullscreenTable3: ['3'],
        exitFullscreen: ['escape'],
    };
}