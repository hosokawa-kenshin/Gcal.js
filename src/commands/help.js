import {fetchCommandList} from '../services/commandService.js';

export function helpEvent(screen) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
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

  commandDetailsBox.key(['escape'], () => {
    commandDetailsBox.hide();
    commandList.show();
    commandList.focus();
    screen.render();
  })

  commandList.key(['escape'], () => {
    commandList.hide();
    leftTable.focus();
    screen.render();
  });
}
