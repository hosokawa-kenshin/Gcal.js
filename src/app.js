import '../src/utils/datePrototype.js';
import { createLayout } from './ui/layout.js';
import { handleInput } from './ui/inputHandler.js';
import { authorize, fetchEvents, fetchCalendars, initializeCalendars } from './services/calendarService.js';
import { insertCalendarListToDatabase, fetchCalendarsFromDatabase } from './services/databaseService.js';
import fs from "fs";
import { createLeftTable } from './ui/table.js';
import { rmEvent } from './commands/rm.js';

export async function runApp() {
  console.log('Running app ...');
  let startDate;
  let endDate;
  let today = new Date();
  startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  endDate = new Date(today).nextMonth().nextMonth();
  endDate.setHours(24, 0, 0, 0);
  const auth = await authorize();
  const calendars = await initializeCalendars(auth);
  var events = await fetchEvents(auth, calendars, startDate, endDate);
  events.sort((a, b) => a.start - b.start);

  const { screen, inputBox } = createLayout(calendars, events);
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const editCommandList = screen.children.find(child => child.options.label === 'Edit List');

  inputBox.on('submit', (value) => {
    handleInput(auth, value, screen, calendars, events);
    inputBox.clearValue();
    inputBox.hide();
    screen.render();
  });

  leftTable.on('select', (item, index) => {
    rmEvent(auth, screen, calendars, index, events);
  });


  screen.key(['q', 'C-c'], () => process.exit(0));
  screen.render();
}
