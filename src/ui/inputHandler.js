import { addEvent } from '../commands/add.js';
import { displayEventsMarkdown } from '../commands/markdown.js';

export function handleInput(input, screen) {
//   面白そうな書き方発見
//   const logBox = screen.children.find(child => child.options.label === 'Calendar Log');

  const [command, ...args] = input.trim().split(/\s+/);

  switch (command) {
    case 'add':
      addEvent(args.join(' '));
      break;
    case 'md':
      // コマンドラインからの呼び出しと違うからどう呼び出すか要検討
      // handleInput に event を渡す必要あるかも
      displayEventsMarkdown();
      break;
    case 'help':
      break;
    default:
      break;
    }
}
