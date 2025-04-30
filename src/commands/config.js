import blessed from 'blessed';
import { configCalendarListInDatabase, fetchCalendarsFromDatabase, insertCalendarListToDatabase } from '../services/databaseService.js';
import { fetchCalendars } from '../services/calendarService.js';
import { updateTable } from '../ui/layout.js';

export async function configCommand(auth, screen, calendars, events, allEvents) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const form = blessed.form({
    parent: screen,
    label: 'Select Calendars to Display (Ctrl+S to save)',
    top: 'center',
    left: 'center',
    width: '70%',
    height: '50%',
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
  const selectedCalendarIds = new Set(calendars.map(cal => cal.id));

  const dummyCalendars = Array.from({ length: 100 }, (_, i) => ({
    id: `calendar-${i}`,
    summary: `Calendar ${i}`
  }));

  await fetchCalendars(auth).then((allCalendars) => {
    const newCalendars = allCalendars.filter(
      calendar => !calendars.some(existingCalendar => existingCalendar.id === calendar.id)
    );
    insertCalendarListToDatabase(newCalendars);
    allCalendars.forEach((calendar, index) => {
      const checkbox = blessed.checkbox({
        parent: form,
        top: index,
        left: 2,
        height: 1,
        content: calendar.summary,
        checked: selectedCalendarIds.has(calendar.id),
        mouse: true,
        keys: true,
        style: {
          fg: 'white',
          focus: {
            bg: 'blue',
            bold: true
          }
        }
      });


      checkbox.on('focus', () => {
        const scrollOffset = form.childBase + form.height - 1;
        if (index < form.childBase) {
          form.scrollTo(index);
        } else if (index >= scrollOffset) {
          form.scrollTo(index - form.height + 2);
        }
        screen.render();
      });
      checkboxes.push({ checkbox, id: calendar.id });
    });

    checkboxes.forEach(({ checkbox }) => {
      checkbox.key(['C-s'], async () => {
        form.hide();
        screen.render();
        const selectedCalendars = checkboxes
          .filter(({ checkbox }) => checkbox.checked)
          .map(({ id }) => id);
        await configCalendarListInDatabase(selectedCalendars);
        const fetchedcalendars = await fetchCalendarsFromDatabase();
        await updateTable(auth, leftTable, fetchedcalendars, events, allEvents);
        calendars.length = 0;
        calendars.push(...fetchedcalendars);
        calendarList.setItems(calendars.map(calendar => calendar.summary));
        logTable.log('Config successfully registered!');
        leftTable.focus();
        screen.render();
      });
    });

    form.key(['escape'], () => {
      form.hide();
      leftTable.focus();
      screen.render();
    });

    form.show();
    if (checkboxes.length > 0) {
      checkboxes[0].checkbox.focus();
    }
    screen.render();
  });
}