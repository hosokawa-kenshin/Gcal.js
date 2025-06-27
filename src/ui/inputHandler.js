import { addEvent } from '../commands/add.js';
import { addEventNL } from '../commands/addNL.js';
import { markdownCommand } from '../commands/markdown.js';
import { helpEvent } from '../commands/help.js';
import { configCommand } from '../commands/config.js';
import { syncCommand } from '../commands/sync.js';
import { findCommand } from '../commands/find.js';
import { jumpCommand } from '../commands/jump.js';
import { updateCommand } from '../commands/update.js';

export function handleInput(auth, inputBox, screen, calendars, events, allEvents, keypressListener) {

  const [command, ...args] = inputBox.trim().split(/\s+/);

  switch (command) {
    case 'add':
      addEvent(auth, screen, calendars, events, allEvents);
      break;
    case 'llm':
      addEventNL(auth, screen, calendars, events, allEvents);
      break;
    case 'md':
    case 'markdown':
      markdownCommand(auth, screen, calendars, args);
      break;
    case 'config':
      configCommand(auth, screen, calendars, events, allEvents);
      break;
    case 'sync':
    case 's':
      syncCommand(auth, screen, calendars, events, allEvents, keypressListener);
      break;
    case 'find':
    case 'f':
      findCommand(screen, events, allEvents, args, keypressListener);
      break;
    case 'jump':
    case 'j':
      jumpCommand(screen, events, allEvents, args);
      break;
    case 'help':
      helpEvent(screen);
      break;
    case 'update':
      updateCommand(screen);
      break;
    case 'exit', 'e':
      process.exit(0);
    default:
      break;
  }
}
