export function setupVimKeysForNavigation(widget, screen, focusbackto) {
    screen.key(['j', 'k', 'h'], (ch, key) => {
        if (screen.focused === widget) {
            if (ch === 'j') {
                if (widget.rows) {
                    widget.rows.down(); // table の場合
                } else if (widget.down) {
                    widget.down(); // list の場合
                }
            } else if (ch === 'k') {
                if (widget.rows) {
                    widget.rows.up(); // table の場合
                } else if (widget.up) {
                    widget.up(); // list の場合
                }
            } else if (ch === 'h') {
                if (focusbackto) {
                    if (widget.rows) {
                        widget.rows.select(0); // table の場合
                    } else if (widget.select) {
                        widget.select(0); // list の場合
                    }
                    focusbackto.focus();
                }
            }
            screen.render();
        }
    });
}