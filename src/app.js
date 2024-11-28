import { createLayout } from './ui/layout.js';
import { handleInput } from './ui/inputHandler.js';

export function runApp() {
  const { screen, inputBox } = createLayout();

  screen.key(['space'], () => {
    inputBox.show();
    inputBox.focus();
    screen.render();
  });

  inputBox.on('submit', (value) => {
    handleInput(value, screen);
    inputBox.clearValue();
    screen.render();
  });

  screen.key(['q', 'C-c'], () => process.exit(0));
  screen.render();
}