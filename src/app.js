import '../src/utils/datePrototype.js';
import { createLayout } from './ui/layout.js';
import { handleInput } from './ui/inputHandler.js';
import { authorize, initializeCalendars, initializeEvents } from './services/calendarService.js';
import { editEvent } from './commands/edit.js';
import { addEvent } from './commands/add.js';
import { jumpCommand } from './commands/jump.js';

export async function runApp() {
  console.log('Running app ...');
  const auth = await authorize();
  const calendars = await initializeCalendars(auth);
  var allEvents = await initializeEvents(auth, calendars);
  var events = [...allEvents.filter(event => event.start.getFullYear() === new Date().getFullYear() || event.start.getFullYear() === new Date().getFullYear() + 1 || event.start.getFullYear() === new Date().getFullYear() - 1)];
  events.sort((a, b) => a.start - b.start);
  const { screen, inputBox, keypressListener } = createLayout(calendars, events);
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');

  inputBox.on('submit', (value) => {
    handleInput(auth, value, screen, calendars, events, allEvents, keypressListener);
    inputBox.clearValue();
    inputBox.hide();
    screen.render();
  });

  inputBox.key(['escape'], () => {
    inputBox.hide();
    screen.render();
  });

  leftTable.on('select', (item, index) => {
    editEvent(auth, screen, calendars, index, events, allEvents);
  });


  screen.key(['q', 'C-c'], () => process.exit(0));
  screen.key(['a'], () => addEvent(auth, screen, calendars, events, allEvents));
  screen.key(['n'], () => { jumpCommand(screen, events, allEvents, ['nw']); });
  screen.key(['p'], () => { jumpCommand(screen, events, allEvents, ['lw']); });
  screen.key(['C-n'], () => { jumpCommand(screen, events, allEvents, ['nm']); });
  screen.key(['C-p'], () => { jumpCommand(screen, events, allEvents, ['lm']); });
  screen.key(['t'], () => { jumpCommand(screen, events, allEvents, []); });
  screen.render();
}
