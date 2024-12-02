import blessed from 'blessed';
import {fetchEvents} from '../services/calendarService.js';
import {fetchCommandList} from '../services/commandService.js';
import {setupVimKeysForNavigation} from './keyConfig.js';
import { convertToDateTime, getDayOfWeek } from '../utils/dateUtils.js';
import { createLeftTable, createLogTable } from './table.js';
import { createGraph, insertDataToGraph } from './graph.js';

function updateGraph(screen, rightGraph, index, events) {
  const currentEventDate = new Date(events[index].start);
  const monday = new Date(currentEventDate);
  const currentDayOfWeek = monday.getDay();
  const offsetToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek; // 日曜なら-6、他は月曜までの差分
  monday.setDate(monday.getDate() + offsetToMonday);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const tempDate = new Date(monday);
    tempDate.setDate(monday.getDate() + i);
    weekDates.push(tempDate.toISOString().split('T')[0]);
  }

  const filledTime = [];
  const groupedEvents = groupEventsByDate(events);
  weekDates.forEach((dateKey) => {
    const year = Number(dateKey.split('-')[0]);
    const month = Number(dateKey.split('-')[1]);
    const day = parseInt(dateKey.split('-')[2], 10);
    const dayOfWeek = getDayOfWeek(year, month, day);
    const formattedDateKey = dateKey + '(' + dayOfWeek + ')';

    const dayEvents = groupedEvents[formattedDateKey] || [];
    const dayTimes = dayEvents.map((event) => {
      const startTime = event.start.toTimeString().slice(0, 5);
      const endTime = event.end ? event.end.toTimeString().slice(0, 5) : '';
      return endTime ? `${startTime}-${endTime}` : startTime;
    });

    filledTime.push(dayTimes);
  });
  insertDataToGraph(screen, rightGraph, filledTime, monday);
}

function colorDate(dateKey, color) {
  if (color === 'blue') {
    return `{blue-fg}${dateKey}{/blue-fg}`;
  } else if (color === 'red') {
    return `{red-fg}${dateKey}{/red-fg}`;
  }
  return dateKey;
}

function groupEventsByDate(events) {
  return events.reduce((grouped, event) => {
    var dateKey = event.start.toLocalISOString().split('T')[0];
    var year = Number(event.start.toLocalISOString().split('-')[0]);
    var month = Number(event.start.toLocalISOString().split('-')[1]);
    var day = parseInt(event.start.toLocalISOString().split('-')[2],10);
    dateKey = dateKey + '(' + getDayOfWeek(year, month, day) + ')';
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
  var beforeDateKey = null;
  Object.keys(groupedEvents)
      .forEach((dateKey) => {
    groupedEvents[dateKey].forEach((event) => {
      const startTime = event.start.toTimeString().slice(0, 5);
      const endTime = event.end ? event.end.toTimeString().slice(0, 5) : '';
      const time = endTime ? `${startTime}-${endTime}` : startTime;
      const summary = event.summary;
      const calendarName = `[${event.calendarName}]`;
      let coloredDate = dateKey;

      if (dateKey === beforeDateKey) {
        coloredDate = "".padEnd(dateKey.length);
      }else{
        const date = new Date(event.start);
        const day = date.getDay()
        if (day === 6) {
          coloredDate = colorDate(dateKey, 'blue');
        } else if (day === 0) {
          coloredDate = colorDate(dateKey, 'red');
        } else {
          coloredDate = colorDate(dateKey, 'normal');
        }
      }
      beforeDateKey = dateKey;
      formattedData.push(`${coloredDate}  ${time}  ${summary}  ${calendarName}`);
    });
  });
  return formattedData;
}

export async function updateTable(auth, table, calendars, events) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate).nextMonth().nextMonth();
  endDate.setHours(24, 0, 0, 0);
  const newEvents = await fetchEvents(auth, calendars, startDate, endDate);
  newEvents.sort((a, b) => a.start - b.start);
  events.length = 0;
  events.push(...newEvents);
  const formattedEvents = formatGroupedEvents(events);
  table.setItems(formattedEvents);
  table.screen.render();
}

export function createLayout(calendars, events) {
  const calendarNames = Array.from(
    new Set(calendars.map(calendar=> calendar.summary))
  );

  const commands = fetchCommandList();

  const screen = blessed.screen({
    smartCSR: true,
    title: 'Google Calendar Events',
    fullUnicode: true,
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
    label: 'Config Calendar List',
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

  const editCalendarCommandList = blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    items: ['rm', 'edit'],
    label: 'Edit List',
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

  const commandList = blessed.list({
    //parent: modalBox,
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    items: commands,
    label: 'Command List',
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

  const commandDetailsBox = blessed.box({
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    label: 'Command Details',
    border: { type: 'line', fg: 'cyan' },
    hidden: true,
  });

  const leftTable = createLeftTable(screen);
  const formattedEvents = formatGroupedEvents(events);
  leftTable.setItems(formattedEvents);
  const rightGraph = createGraph(screen);
  leftTable.on('select', function (item, index) {
    updateGraph(screen, rightGraph, index ,events);
  });
  leftTable.select(0);
  updateGraph(screen, rightGraph, 0, events);
  const logTable = createLogTable(screen);
  logTable.log('Welcome to Gcal.js!');

  screen.append(inputBox);
  screen.append(list);
  screen.append(editCalendarCommandList);
  screen.append(commandList);
  screen.append(commandDetailsBox);
  setupVimKeysForNavigation(list, screen, null);
  setupVimKeysForNavigation(commandList, screen, null);

  leftTable.focus();
  console.log('Create Layout');
  return { screen, inputBox };
}
