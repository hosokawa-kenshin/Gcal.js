import blessed from 'blessed';
import clipboardy from 'clipboardy';
import { fetchCalendars, fetchEvents } from '../services/calendarService.js';
import { convertToDateTime } from '../utils/dateUtils.js';
import { fetchSelectedEventsFromDatabase } from '../services/calendarService.js';
import { fetchEventsFromDatabase } from '../services/databaseService.js';
/**
  * Display events
  *
  * @param {Array<Event>} events The list of events.
  */
export async function markdownCommand(auth, screen, calendars, args) {
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const eventBox = blessed.box({
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    label: 'Events',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      focus: { border: { fg: 'yellow' } },
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      track: { bg: 'cyan' },
      style: { bg: 'white' },
    },
  });

  let events = [];
  if (args.length === 0) {
    events = await fetchEventsFromDatabase(calendars);
  } else {
    events = await fetchSelectedEventsFromDatabase(calendars, args[0], args[1]);
  }
  events.sort((a, b) => a.start - b.start);
  const eventText = events
    .map(event => {
      const startDate = event.start;
      const month = startDate.getMonth() + 1;
      const day = startDate.getDate();
      return `+ (${month}/${day}) ${event.summary}`;
    })
    .join('\n');

  eventBox.setContent(eventText);

  const closeButton = blessed.button({
    bottom: 1,
    right: 1,
    shrink: true,
    padding: { left: 1, right: 1 },
    name: 'copy',
    content: 'Copy',
    style: {
      fg: 'white',
      bg: 'black',
      focus: { bg: 'blue' },
    },
  });

  closeButton.on('press', () => {
    clipboardy.writeSync(eventText);
    eventBox.destroy();
    logTable.log('Events copied to clipboard!');
    leftTable.focus();
    screen.render();
  });

  eventBox.append(closeButton);
  screen.append(eventBox);
  screen.render();
  closeButton.focus();
}