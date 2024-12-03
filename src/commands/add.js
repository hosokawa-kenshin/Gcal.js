import {google} from 'googleapis';
import {updateTable} from '../ui/layout.js';
import {convertToDateTime} from '../utils/dateUtils.js';
import { createAddForm } from '../ui/form.js';

export function addEvent(auth, screen, calendars, events) {
  const calendar = google.calendar({version: 'v3', auth});
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const {formBox, formFields} = createAddForm(screen);
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  var selectedCalendarId = null;

  const calendarNames = Array.from(
    new Set(calendars.map(calendar=> calendar.summary))
  );
  const calendarIDs = Array.from(
    new Set(calendars.map(calendar=> calendar.id))
  );

  calendarList.show();
  calendarList.focus();
  calendarList.once('select', (item, index) => {
    calendarList.hide();
    const selectedCalendar = calendarNames[index];
    selectedCalendarId = calendarIDs[index];
    formBox.setLabel(`Add Event - ${selectedCalendar}`);
    formBox.show();
    screen.render();
    formFields.title.focus();
  });


  formBox.key(['C-s'], () => {
    const title = formFields.title.getValue().trim();
    const date = formFields.date.getValue().trim();
    const startTime = formFields.startTime.getValue().trim();
    const endTime = formFields.endTime.getValue().trim();

    formBox.hide();

    Object.values(formFields).forEach(field => field.clearValue());

    if (!title || !date || !startTime || !endTime) {
      logTable.log('Error: All fields must be filled in.');
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
      await updateTable(auth, leftTable, calendars, events);
      logTable.log('Event successfully registered!');
      formBox.destroy();
      screen.render();
      leftTable.focus();
      screen.render();
    });
  });
}
