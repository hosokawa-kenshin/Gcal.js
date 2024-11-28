export function setupVimKeysForNavigation(widget, screen, focusbackto) {
    screen.key(['j', 'k', 'h'], (ch, key) => {
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
            } else if (ch === 'h') {
                if (focusbackto) {
                    if (widget.rows) {
                        widget.rows.select(0);
                    } else if (widget.select) {
                        widget.select(0);
                    }
                    focusbackto.focus();
                }
            }
            screen.render();
        }
    });
}