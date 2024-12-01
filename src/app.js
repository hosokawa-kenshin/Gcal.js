import '../src/utils/datePrototype.js';
import { createLayout } from './ui/layout.js';
import { handleInput } from './ui/inputHandler.js';
import { authorize, fetchEvents, fetchCalendars, initializeCalendars} from './services/calendarService.js';
import { insertCalendarListToDatabase, fetchCalendarsFromDatabase} from './services/databaseService.js';
import fs from "fs";

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
  const calendars= await initializeCalendars(auth);
  const events = await fetchEvents(auth, calendars, startDate, endDate);
  events.sort((a, b) => a.start - b.start);

  const { screen, inputBox } = createLayout(calendars, events);

  screen.key(['space'], () => {
    inputBox.show();
    inputBox.focus();
    screen.render();
  });

  inputBox.on('submit', (value) => {
    handleInput(auth, value, screen, calendars, events);
    inputBox.clearValue();
    inputBox.hide();
    screen.render();
  });

  screen.key(['q', 'C-c'], () => process.exit(0));
  screen.render();
}