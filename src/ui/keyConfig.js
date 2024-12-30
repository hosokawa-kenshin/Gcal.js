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