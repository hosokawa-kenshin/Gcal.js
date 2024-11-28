import { createLayout } from './ui/layout.js';
import { handleInput } from './ui/inputHandler.js';
import { authorize, fetchEvents, fetchCalendars} from './services/calendarService.js';

export async function runApp() {
  console.log('running app');
  let startDate;
  let endDate;
  let today = new Date();
  startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  endDate = new Date(today);
  endDate.setHours(24, 0, 0, 0);
  endDate.setDate(endDate.getDate() + 28);

  const auth = await authorize();
  const events = await fetchEvents(auth, null, startDate, endDate)
  const calendars = await fetchCalendars(auth);

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