import {google} from 'googleapis';
import {updateTable} from '../ui/layout.js';
import {convertToDateTime} from '../utils/dateUtils.js';
import { createAddForm } from '../ui/form.js';

export function addEvent(auth, screen, calendars) {
  const calendar = google.calendar({version: 'v3', auth});
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const {formBox, formFields} = createAddForm(screen);
  var selectedCalendarId = null;

  const calendarNames = Array.from(
    new Set(calendars.map(calendar=> calendar.summary))
  );
  const calendarIDs = Array.from(
    new Set(calendars.map(calendar=> calendar.id))
  );

  calendarList.show();
  calendarList.focus();
  calendarList.on('select', (item, index) => {
    calendarList.hide();
    const selectedCalendar = calendarNames[index];
    selectedCalendarId = calendarIDs[index];
    formBox.setLabel(`Add Event - ${selectedCalendar}`);
    formBox.show();
    screen.render();
    formFields.title.focus();
  })

  screen.key(['C-s'], () => {
    formBox.hide();
    screen.render();
    const title = formFields.title.getValue().trim();
    const date = formFields.date.getValue().trim();
    const startTime = formFields.startTime.getValue().trim();
    const endTime = formFields.endTime.getValue().trim();
    Object.values(formFields).forEach(field => field.clearValue());

    if (!title || !date || !startTime || !endTime) {
      inputBox.setContent('Error: All fields must be filled in.');
      inputBox.show();
      inputBox.focus();
      screen.render();
      return;
    }

    const event = {
      summary: title,
      start: {
        dateTime: convertToDateTime(date, startTime).toISOString(),
      },
      end: {
        dateTime: convertToDateTime(date, endTime).toISOString(),
      },
    };

    calendar.events.insert({
      calendarId: selectedCalendarId,
      resource: event,
    }, async(err, res) => {
      if (err) return console.error('The API returned an error: ' + err);

      await updateTable(auth, leftTable, calendars);
      inputBox.setContent('Event successfully registered!');
      inputBox.show();
      inputBox.focus();
      screen.render();
      setTimeout(() => {
        inputBox.setContent('');
        inputBox.hide();
        leftTable.focus();
        screen.render();
      }, 2000);
    });
  });
}
