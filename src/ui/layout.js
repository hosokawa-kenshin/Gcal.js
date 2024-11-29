import blessed from 'blessed';
import contrib from 'blessed-contrib';
import {fetchEvents} from '../services/calendarService.js';

import {setupVimKeysForNavigation} from './keyConfig.js';

function groupEventsByDate(events) {
  return events.reduce((grouped, event) => {
    const dateKey = event.start.toISOString().split('T')[0];
    if (!grouped[dateKey]) {
        grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
      return grouped;
    }, {});
}

function formatGroupedEvents(events) {
  const groupedEvents = groupEventsByDate(events);
  const formattedData = [];
  Object.keys(groupedEvents)
        .sort()
        .forEach((dateKey) => {
    formattedData.push([`[${dateKey}]`, '', '']);
    groupedEvents[dateKey].forEach((event) => {
      const startTime = event.start
          .toTimeString()
          .slice(0, 5);
      const endTime = event.end
          ? event.end.toTimeString().slice(0, 5)
          : '';
      const time = endTime ? `${startTime}-${endTime}` : startTime;
      const summary = event.summary;
      const calendarName = `[${event.calendarName}]`;
      formattedData.push(['', time, `${summary} ${calendarName}`]);
    });
  });
  return formattedData;
}

export async function updateTable(auth, table, calendars) {
  const timeMin = new Date();
  const timeMax = new Date(timeMin).nextMonth();
  const events = await fetchEvents(auth, timeMin, timeMax);
  const formattedEvents = formatGroupedEvents(events);

  table.setData({
      headers: ['Date', 'Time', 'Event'],
      data: formattedEvents,
  });
  table.screen.render();
}

export function createLayout(calendars, events) {
  const calendarNames = Array.from(
    new Set(calendars.map(calendar=> calendar.summary))
  );

  const screen = blessed.screen({
    smartCSR: true,
    title: 'Google Calendar Events',
    fullUnicode: true,
  });

  const leftTable = contrib.table({
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
    columnWidth: [15, 15, 50],
    style: {
        header: {bold: true},
    }
  });

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

  const list = blessed.list({
    //parent: modalBox,
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    items: calendarNames,
    label: 'Calendar List',
    border: { type: 'line', fg: 'yellow' },
    style: {
        fg: 'white',
        bg: 'black',
        selected: { fg: 'black', bg: 'green' }
    },
    hidden: true,
    mouse: true,
    keys: true,
  });

  const checkedState = new Array(calendarNames.length).fill(false);
  const configCalendarList = blessed.list({
    //parent: modalBox,
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    items: calendarNames,
    label: 'Calendar List',
    border: { type: 'line', fg: 'yellow' },
    style: {
        fg: 'white',
        bg: 'black',
        selected: { fg: 'black', bg: 'green' }
    },
    hidden: true,
    mouse: true,
    keys: true,
  });
  function formatItem(name, isChecked) {
    return `${isChecked ? '[x]' : '[ ]'} ${name}`;
  }
  configCalendarList.on('select', (item, index) => {
    checkedState[index] = !checkedState[index];
    configCalendarList.setItem(index, formatItem(calendarNames[index], checkedState[index]));
    screen.render();
  });

  const formBox = blessed.box({
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    label: 'Add Event',
    border: { type: 'line', fg: 'cyan' },
    hidden: true,
  });

  const formFields = {
    title: blessed.textbox({
      top: 2,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'Event Title',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),
    date: blessed.textbox({
      top: 6,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'Date (YYYY-MM-DD)',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),
    startTime: blessed.textbox({
      top: 10,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'Start Time (HH:mm)',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),
    endTime: blessed.textbox({
      top: 14,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'End Time (HH:mm)',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),
  };

  const formattedEvents = formatGroupedEvents(events);
  leftTable.setData({
    headers: ['Date', 'Time', 'Event'],
    data: formattedEvents,
  });

  Object.values(formFields).forEach((field) => formBox.append(field));

  screen.append(leftTable);
  screen.append(rightTable);
  screen.append(inputBox);
  screen.append(list);
  screen.append(formBox);
  setupVimKeysForNavigation(leftTable.rows, screen, null);
  setupVimKeysForNavigation(rightTable.rows, screen, leftTable);
  setupVimKeysForNavigation(list, screen, null);

  leftTable.focus();
  console.log('Create Layout');
  return { screen, inputBox };
}
