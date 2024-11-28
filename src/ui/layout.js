import blessed from 'blessed';
import contrib from 'blessed-contrib';
import {setupVimKeysForNavigation} from './keyConfig.js';

export function createLayout() {
  const screen = blessed.screen({
      smartCSR: true,
      title: 'Google Calendar Events',
      fullUnicode: true,
  });

  const table1 = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: true,
    label: 'Upcoming Events',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 1,
    columnWidth: [15, 15, 50], // 各カラムの幅
    style: {
        header: {bold: true},
    }
  });

  const table2 = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: true,
    label: 'Events summary',
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 1,
    columnWidth: [20, 20, 50],
    style: {
        header: {bold: true},
    }
  });

  const inputBox = blessed.textbox({
    top: 'center',
    left: 'center',
    width: '60%',
    height: 3,
    border: { type: 'line', fg: 'white' },
    label: 'Commandline',
    style: {
        bg: 'black',
        fg: 'white',
    },
    inputOnFocus: true,
    hidden: true
  });

  screen.append(table1);
  screen.append(table2);
  screen.append(inputBox);
  setupVimKeysForNavigation(table1.rows, screen, null);
  setupVimKeysForNavigation(table2.rows, screen, table1);
  // setupVimKeysForNavigation(list, screen, null);
  table1.focus();

  return { screen, inputBox };
}
