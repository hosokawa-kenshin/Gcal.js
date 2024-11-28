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
      // rask用markdown表示
      // displayEventsMarkdownはCLIとしての呼び出しを想定している
      // そのため，console.logを使った表示になっているため，screenを使った表示に対応する必要あり
      displayEventsMarkdown();
      break;
    case 'config':
      // default calendars の設定
      // 今は購読しているすべてのカレンダーの中身が見えたり，イベントを追加できたりする
      // このコマンドでデフォルトで使用するカレンダー群を設定できるようにする
      // 選択したカレンダーを設定ファイルを使って保存しておく
      // 起動時設定ファイルがなければ自動的に設定画面を表示する
      break;
    case 'jump':
      // Upcoming Events のカーソルの位置を指定した日にジャンプする
      // このコマンドの引数として日付を指定するか，画面遷移した先のフォームで日付を指定するか
      // どちらが使いやすいか要検討
      break;
    case 'help':
      break;
    case 'exit', 'e':
      process.exit(0);
    default:
      break;
    }
}
