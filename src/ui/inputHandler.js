import { addEvent } from '../commands/add.js';
import { markdownCommand } from '../commands/markdown.js';
import { helpEvent } from '../commands/help.js';
import { configCommand } from '../commands/config.js';
import { syncCommand } from '../commands/sync.js';
import { findCommand } from '../commands/find.js';
import { jumpCommand } from '../commands/jump.js';

export function handleInput(auth, inputBox, screen, calendars, events, keypressListener) {

  const [command, ...args] = inputBox.trim().split(/\s+/);

  switch (command) {
    case 'add':
      addEvent(auth, screen, calendars, events);
      break;
    case 'rm':
      break;
    case 'md':
      markdownCommand(auth, screen, calendars, args);
      break;
    case 'config':
      configCommand(auth, screen, calendars, events);
      break;
    case 'sync':
    case 's':
      syncCommand(auth, screen, calendars, events, keypressListener);
      break;
    case 'find':
    case 'f':
      findCommand(screen, events, args, keypressListener);
      break;
    case 'jump':
    case 'j':
      jumpCommand(screen, events, args);
      break;
    case 'help':
      helpEvent(screen);
      break;
    case 'exit', 'e':
      process.exit(0);
    default:
      break;
    }
}
