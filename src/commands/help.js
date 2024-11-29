import {fetchCommandList} from '../services/commandService.js';

export function helpEvent(screen) {
  const commandList = screen.children.find(child => child.options.label === 'Command List');
  const commandDetailsBox = screen.children.find(child => child.options.label === 'Command Details');
  const commands = fetchCommandList();

  commandList.show();
  commandList.focus();
  commandList.on('select', (item, index) => {
    commandList.hide();
    commandDetailsBox.setLabel(`Command Details - ${commands[index]}`);
    commandDetailsBox.show();
    screen.render();
    commandDetailsBox.focus();
  })

  screen.key(['escape'], () => {
    commandDetailsBox.hide();
    commandList.show();
    commandList.focus();
    screen.render();
  });
}
