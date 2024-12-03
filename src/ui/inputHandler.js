import { addEvent } from '../commands/add.js';
import { rmEvent } from '../commands/rm.js';
import { markdownCommand } from '../commands/markdown.js';
import { helpEvent } from '../commands/help.js';
import { configCommand } from '../commands/config.js';
import { syncCommand } from '../commands/sync.js';

export function handleInput(auth, inputBox, screen, calendars, events) {

  const [command, ...args] = inputBox.trim().split(/\s+/);

  switch (command) {
    case 'add':
      addEvent(auth, screen, calendars, events);
      break;
    case 'rm':
      rmEvent(auth, screen, calendars);
      break;
    case 'md':
      markdownCommand(auth, screen, calendars, args);
      break;
    case 'config':
      configCommand(auth, screen, calendars, events);
      break;
    case 'sync':
      syncCommand(auth, screen, calendars, events);
      break;
    case 'jump':
      // Upcoming Events のカーソルの位置を指定した日にジャンプする
      // このコマンドの引数として日付を指定するか，画面遷移した先のフォームで日付を指定するか
      // どちらが使いやすいか要検討
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
