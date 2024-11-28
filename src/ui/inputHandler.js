import { addEvent } from '../commands/add.js';
import { displayEventsMarkdown } from '../commands/markdown.js';

export function handleInput(auth, inputBox, screen, calendars, events) {

  const [command, ...args] = inputBox.trim().split(/\s+/);

  switch (command) {
    case 'add':
      addEvent(auth, screen, calendars);
      break;
    case 'rm':
      break;
    case 'md':
      // コマンドラインからの呼び出しと違うからどう呼び出すか要検討
      // handleInput に event を渡す必要あるかも
      displayEventsMarkdown();
      break;
    case 'help':
      break;
    case 'exit', 'e':
      process.exit(0);
    default:
      break;
    }
}
