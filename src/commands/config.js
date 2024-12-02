import blessed from 'blessed';
import { configCalendarListInDatabase, fetchCalendarsFromDatabase } from '../services/databaseService.js';
import { fetchCalendars } from '../services/calendarService.js';
import { updateTable } from '../ui/layout.js';

export async function configCommand(auth, screen, calendars, events) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const form = blessed.form({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '70%',
    height: '60%',
    keys: true,
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    hidden: true,
    style: {
      border: { fg: 'cyan' },
      scrollbar: { bg: 'white' }
    },
    vi: true
  });

  const checkboxes = [];
  await fetchCalendars(auth).then((allCalendars) => {
    allCalendars.forEach((calendar, index) => {
      const checkbox = blessed.checkbox({
        parent: form,
        top: index + 1,
        left: 2,
        content: calendar.summary,
        checked: false,
        mouse: true,
        keys: true,
        style: {
          fg: 'white',
          focus: { bg: 'blue' }
        }
      });
      checkboxes.push({ checkbox, id: calendar.id });
    });

    const submitButton = blessed.button({
      parent: form,
      top: allCalendars.length + 2,
      left: 2,
      content: 'Save',
      shrink: true,
      padding: { left: 1, right: 1 },
      style: {
        fg: 'white',
        bg: 'blue',
        focus: { bg: 'green' }
      },
      mouse: true
    });
    submitButton.on('press', async () => {
      form.hide();
      screen.render();
      const selectedCalendars = checkboxes
        .filter(({ checkbox }) => checkbox.checked)
        .map(({ id }) => id);
      await configCalendarListInDatabase(selectedCalendars);
      const fetchedcalendars = await fetchCalendarsFromDatabase();
      await updateTable(auth, leftTable, fetchedcalendars, events);
      calendars.length = 0;
      calendars.push(...fetchedcalendars);
      calendarList.setItems(calendars.map(calendar => calendar.summary));
      logTable.log('Config successfully registered!');
      leftTable.focus();
      screen.render();
    });

    form.show();
    form.focus();
    screen.render();
  });
}