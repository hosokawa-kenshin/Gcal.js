import contrib from 'blessed-contrib';
import blessed from 'blessed';

import { setupVimKeysForNavigation } from './keyConfig.js';

export function createLogTable(screen){
  var logTable = blessed.log({
    top: '80%',
    left: '50%',
    width: '50%',
    height: '20%',
    tags: true,
    border: { type: 'line', fg: 'cyan' },
    scrollable: true,
    style: {
      fg: 'green',
    },
    label: 'Gcal.js Log',
  });
  screen.append(logTable);
  return(logTable);;
}

export function createRightTable(screen){
  const rightTable = contrib.table({
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
  screen.append(rightTable);
  setupVimKeysForNavigation(rightTable.rows, screen, null);
  return rightTable;
}

export function createLeftTable(screen){
  const leftTable = blessed.list({
    keys: true,
    fg: 'white',
    tags: true,
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: true,
    label: 'Upcoming Events',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 2,
    style: {
      header: {bold: true},
    },
  });
  screen.append(leftTable);
  setupVimKeysForNavigation(leftTable, screen, null);
  return leftTable;
}