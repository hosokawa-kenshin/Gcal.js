import blessed from 'blessed';
import { fetchEvents } from '../services/calendarService.js';
import { insertEventsToDatabase, fetchEventsFromDatabase } from '../services/databaseService.js';
import { fetchCommandList } from '../services/commandService.js';
import { setupVimKeysForNavigation } from './keyConfig.js';
import { convertToDateTime, getDayOfWeek } from '../utils/dateUtils.js';
import { createEventTable, createLeftTable, createLogTable } from './table.js';
import { createGraph, insertDataToGraph } from './graph.js';
import Event from '../models/event.js';
import pkg from 'japanese-holidays';
const { isHoliday } = pkg;

export function fillEmptyEvents(events, date) {
  const filledEvents = [];
  if (date) {
    const lastEventDate = new Date(`${date.getFullYear() + 1}-12-31T23:59:00`);
    const filledDate = new Date(`${date.getFullYear() - 1}-01-01T00:00:00`);
    filledDate.setHours(0, 0, 0, 0);
    if (events.length === 0) {
      while (filledDate < lastEventDate) {
        filledDate.setDate(filledDate.getDate() + 1);
        filledEvents.push(
          new Event(
            '',
            new Date(filledDate),
            new Date(filledDate),
            '',
            null,
            null
          )
        );
      }
      events.length = 0;
      events.push(...filledEvents);
      return events;
    }

    const firstEventDate = new Date(events[0].start);
    firstEventDate.setHours(0, 0, 0, 0);
    while (filledDate < firstEventDate) {
      filledDate.setDate(filledDate.getDate() + 1);
      if (filledDate < firstEventDate) {
        filledEvents.push(
          new Event(
            '',
            new Date(filledDate),
            new Date(filledDate),
            '',
            null,
            null
          )
        );
      }
    }

    for (let i = 0; i < events.length; i++) {
      filledEvents.push(events[i]);
      if (i < events.length - 1) {
        const currentEventStart = new Date(events[i].start);
        currentEventStart.setHours(0, 0, 0, 0);
        const nextEventStart = new Date(events[i + 1].start);
        nextEventStart.setHours(0, 0, 0, 0);
        while (currentEventStart < nextEventStart) {
          currentEventStart.setDate(currentEventStart.getDate() + 1);
          if (currentEventStart < nextEventStart) {
            filledEvents.push(
              new Event(
                '',
                new Date(currentEventStart),
                new Date(currentEventStart),
                '',
                null,
                null
              )
            );
          }
        }
      }
    }

    const filledDate2 = new Date(events[events.length - 1].start);
    filledDate2.setHours(0, 0, 0, 0);
    while (filledDate2 < lastEventDate) {
      filledDate2.setDate(filledDate2.getDate() + 1);
      if (filledDate2 < lastEventDate) {
        filledEvents.push(
          new Event(
            '',
            new Date(filledDate2),
            new Date(filledDate2),
            '',
            null,
            null
          )
        );
      }
    }

    events.length = 0;
    events.push(...filledEvents);
    return events;
  }

  for (let i = 0; i < events.length; i++) {
    filledEvents.push(events[i]);
    if (i < events.length - 1) {
      const currentEventStart = new Date(events[i].start);
      currentEventStart.setHours(0, 0, 0, 0);
      const nextEventStart = new Date(events[i + 1].start);
      nextEventStart.setHours(0, 0, 0, 0);
      while (currentEventStart < nextEventStart) {
        currentEventStart.setDate(currentEventStart.getDate() + 1);
        if (currentEventStart < nextEventStart) {
          filledEvents.push(
            new Event(
              '',
              new Date(currentEventStart),
              new Date(currentEventStart),
              '',
              null,
              null
            )
          );
        }
      }
    }
  }

  events.length = 0;
  events.push(...filledEvents);
  return events;
}

export function searchIndexOfToday(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let index = 0;
  for (index = 0; index < events.length; index++) {
    const event = events[index];
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    if (eventDate.toLocalISOString().slice(0, 10) === today.toLocalISOString().slice(0, 10)) {
      return index;
    } else if (eventDate > today) {
      return index;
    }
  }
  return index;
}

export function searchIndex(date, events) {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  let index = 0;
  for (index = 0; index < events.length; index++) {
    const event = events[index];
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    if (eventDate.toLocalISOString().slice(0, 10) === today.toLocalISOString().slice(0, 10)) {
      return index;
    } else if (eventDate > today) {
      return index;
    }
  }
  return index;
}

export function updateGraph(screen, rightGraph, index, events) {
  const currentEventDate = new Date(events[index].start);
  const monday = new Date(currentEventDate);
  const currentDayOfWeek = monday.getDay();
  const offsetToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  monday.setDate(monday.getDate() + offsetToMonday);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const tempDate = new Date(monday);
    tempDate.setDate(monday.getDate() + i);
    weekDates.push(tempDate.toLocalISOString().split('T')[0]);
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

export function groupEventsByDate(events) {
  return events.reduce((grouped, event) => {
    var dateKey = event.start.toLocalISOString().split('T')[0];
    var year = Number(event.start.toLocalISOString().split('-')[0]);
    var month = Number(event.start.toLocalISOString().split('-')[1]);
    var day = parseInt(event.start.toLocalISOString().split('-')[2], 10);
    dateKey = dateKey + '(' + getDayOfWeek(year, month, day) + ')';
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
    return grouped;
  }, {});
}

export function formatGroupedEvents(events) {
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
        } else {
          const date = new Date(event.start);
          const day = date.getDay()
          if (day === 6) {
            coloredDate = colorDate(dateKey, 'blue');
          } else if (day === 0 || isHoliday(date)) {
            coloredDate = colorDate(dateKey, 'red');
          } else {
            coloredDate = colorDate(dateKey, 'normal');
          }
        }
        beforeDateKey = dateKey;
        if (time === '00:00-00:00') {
          formattedData.push(`${coloredDate}`);
        } else if (startTime === endTime) {
          formattedData.push(`${coloredDate}  終日         ${summary}  ${calendarName}`);
        } else {
          formattedData.push(`${coloredDate}  ${time}  ${summary}  ${calendarName}`);
        }
      });
    });
  return formattedData;
}

export function formatGroupedEventsDescending(events) {
  const now = new Date();
  now.setHours(23, 59, 59, 99);
  const groupedEvents = groupEventsByDate(events);

  const filteredGroupedEvents = Object.entries(groupedEvents)
    .filter(([_, eventList]) => {
      return eventList.some(event => new Date(event.start) < now);
    })
    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));

  const formattedData = [];
  let beforeDateKey = null;

  filteredGroupedEvents.forEach(([dateKey, events]) => {
    events.forEach(event => {
      const startTime = event.start.toTimeString().slice(0, 5);
      const endTime = event.end ? event.end.toTimeString().slice(0, 5) : '';
      const time = endTime ? `${startTime}-${endTime}` : startTime;
      const summary = event.summary;
      const calendarName = `[${event.calendarName}]`;
      let coloredDate = dateKey;

      if (dateKey === beforeDateKey) {
        coloredDate = "".padEnd(dateKey.length);
      } else {
        const date = new Date(event.start);
        const day = date.getDay();
        if (day === 6) {
          coloredDate = colorDate(dateKey, 'blue');
        } else if (day === 0 || isHoliday(date)) {
          coloredDate = colorDate(dateKey, 'red');
        } else {
          coloredDate = colorDate(dateKey, 'normal');
        }
      }

      beforeDateKey = dateKey;

      if (time === '00:00-00:00') {
        formattedData.push(`${coloredDate}`);
      } else if (startTime === endTime) {
        formattedData.push(`${coloredDate}  終日         ${summary}  ${calendarName}`);
      } else {
        formattedData.push(`${coloredDate}  ${time}  ${summary}  ${calendarName}`);
      }
    });
  });

  return formattedData;
}

export async function updateTable(auth, table, calendars, events, allEvents) {
  const newEvents = await fetchEvents(auth, calendars);
  await insertEventsToDatabase(newEvents);
  allEvents.length = 0;
  const fetchedEvent = await fetchEventsFromDatabase(calendars);
  allEvents.push(...fetchedEvent);
  events.length = 0;
  events.push(...allEvents.filter((event) => event.start.getFullYear() === new Date().getFullYear() || event.start.getFullYear() === new Date().getFullYear() + 1 || event.start.getFullYear() === new Date().getFullYear() - 1));
  fillEmptyEvents(events, new Date());
  const formattedEvents = formatGroupedEvents(events);
  table.setItems(formattedEvents);
  table.select(searchIndex(new Date, events));
  table.scrollTo(table.selected + table.height - 3);
  table.screen.render();
}

export function updateEventsAndUI(screen, events, allEvents, leftTable, rightGraph, logTable, targetDate, index, message) {
  events.length = 0;
  events.push(...allEvents.filter(event =>
    event.start.getFullYear() === targetDate.getFullYear() ||
    event.start.getFullYear() === targetDate.getFullYear() + 1 ||
    event.start.getFullYear() === targetDate.getFullYear() - 1
  ));
  events.sort((a, b) => a.start - b.start);
  fillEmptyEvents(events, targetDate);
  const formattedEvents = formatGroupedEvents(events);
  leftTable.setItems(formattedEvents);
  index = searchIndex(targetDate, events);
  leftTable.select(index);
  leftTable.scrollTo(leftTable.selected + leftTable.height - 3);
  updateGraph(screen, rightGraph, index, events);
  logTable.log(message);
  screen.render();
}

export function createLayout(calendars, events) {
  const calendarNames = Array.from(
    new Set(calendars.map(calendar => calendar.summary))
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

  const editCalendarCommandList = blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    items: ['選択日にイベントを追加', 'イベントを編集', 'イベントをコピー', 'イベントを削除', '他のイベントを参照して選択日にコピー'],
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

  const keypressListener = (_, key) => {
    if (key.name === 'j' || key.name === 'k') {
      const currentIndex = leftTable.selected;
      if (events[currentIndex].start.getDay() === 0 || events[currentIndex].start.getDay() === 1) {
        updateGraph(screen, rightGraph, currentIndex, events);
      }
    }
  };

  const leftTable = createLeftTable(screen);
  fillEmptyEvents(events, new Date());
  const formattedEvents = formatGroupedEvents(events);
  const eventTable = createEventTable(screen);
  const currentEvents = formatGroupedEventsDescending(events);
  leftTable.setItems(formattedEvents);
  eventTable.setItems(currentEvents);
  const rightGraph = createGraph(screen);
  leftTable.on('keypress', keypressListener);
  const logTable = createLogTable(screen);
  logTable.log('Welcome to Gcal.js!');
  leftTable.select(searchIndexOfToday(events));
  leftTable.scrollTo(leftTable.selected + leftTable.height - 3);
  updateGraph(screen, rightGraph, leftTable.selected, events);

  screen.append(inputBox);
  screen.append(list);
  screen.append(editCalendarCommandList);
  screen.append(commandList);
  screen.append(commandDetailsBox);
  setupVimKeysForNavigation(leftTable, screen, null);
  setupVimKeysForNavigation(list, screen, null);
  setupVimKeysForNavigation(commandList, screen, null);
  setupVimKeysForNavigation(editCalendarCommandList, screen, null);
  setupVimKeysForNavigation(eventTable, screen, null);
  leftTable.focus();
  leftTable.key(['space'], () => {
    inputBox.show();
    inputBox.focus();
    screen.render();
  });
  console.log('Create Layout');
  return { screen, inputBox, keypressListener };
}
