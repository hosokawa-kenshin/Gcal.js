import contrib from 'blessed-contrib';
import blessed from 'blessed';

import { setupVimKeysForNavigation } from './keyConfig.js';
import { splitDateTimeIntoDateAndTime } from '../utils/dateUtils.js';

export function createLogTable(screen) {
  var logTable = blessed.log({
    top: '80%',
    left: '50%',
    width: '50%',
    height: '22%',
    tags: true,
    border: { type: 'line', fg: 'cyan' },
    scrollable: true,
    style: {
      fg: 'green',
    },
    label: 'Gcal.js Log',
  });
  screen.append(logTable);
  return (logTable);;
}

export function createRightTable(screen) {
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
      header: { bold: true },
    }
  });
  screen.append(rightTable);
  setupVimKeysForNavigation(rightTable.rows, screen, null);
  return rightTable;
}

export function createLeftTable(screen) {
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
      header: { bold: true },
    },
  });
  screen.append(leftTable);
  //setupVimKeysForNavigation(leftTable, screen, null);
  return leftTable;
}

export function createEventTable(screen) {
  const eventTable = blessed.list({
    hidden: true,
    keys: true,
    fg: 'white',
    tags: true,
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: true,
    label: 'Current Events',
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 2,
    style: {
      header: { bold: true },
    },
  });
  screen.append(eventTable);
  return eventTable;
}

export function createEventDetailTable(screen) {
  const eventDetailTable = blessed.list({
    hidden: true,
    keys: true,
    fg: 'white',
    tags: true,
    selectedFg: 'white',
    interactive: true,
    label: 'Event Details',
    top: '10%',
    left: 'center',
    width: '50%',
    height: '40%',
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 2,
    style: {
      header: { bold: true },
    },
  });
  screen.append(eventDetailTable);
  return eventDetailTable;
}

export function updateEventDetailTable(eventDetailTable, event) {
  if (!event) {
    eventDetailTable.setItems(['No event selected']);
    return;
  }

  const { date: startDate, time: startTime } = splitDateTimeIntoDateAndTime(event.start);
  const { date: endDate, time: endTime } = splitDateTimeIntoDateAndTime(event.end);

  const details = [
    `Title: ${event.summary || ''}`,
    `Date: ${startDate}`,
    `Start Time: ${startTime}`,
    `End Time: ${endTime}`,
    `Calendar: ${event.calendarName || ''}`,
    '',
    'Description:',
    `${event.description || ''}`
  ];

  eventDetailTable.setItems(details);
}


