import { jumpCommand } from '../commands/jump.js';
import { addEvent } from '../commands/add.js';
import { editEvent } from '../commands/edit.js';

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

    // Quit application 
    screen.key(keyBindings.quit || ['q', 'C-c'], () => process.exit(0));

    // Add Event 
    screen.key(keyBindings.addEvent || ['a'], () =>
        addEvent(auth, screen, calendars, events, allEvents));

    // Navigation 
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

    // Show command line 
    screen.key(keyBindings.toggleCommandLine || ['space'], () => {
        inputBox.show();
        inputBox.focus();
        screen.render();
    });
}

export function getDefaultKeyBindings() {
    return {
        quit: ['q', 'C-c'],
        addEvent: ['a'],
        nextWeek: ['n'],
        prevWeek: ['p'],
        nextMonth: ['C-n'],
        prevMonth: ['C-p'],
        today: ['t'],
        toggleCommandLine: ['space'],
    };
}