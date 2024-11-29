import {google} from 'googleapis';
import {updateTable} from '../ui/layout.js';
import {convertToDateTime} from '../utils/dateUtils.js';

export function addEvent(auth, screen, calendars) {
  const calendar = google.calendar({version: 'v3', auth});
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const formBox = screen.children.find(child => child.options.label === 'Add Event');
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const formFields = formBox.children.reduce((fields, child) => {
    if (child.options.label === 'Event Title') fields.title = child;
    else if (child.options.label === 'Date (YYYY-MM-DD)') fields.date = child;
    else if (child.options.label === 'Start Time (HH:mm)') fields.startTime = child;
    else fields.endTime = child;
    return fields;
  }, {});
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

  Object.values(formFields).forEach((field, index, fields) => {
    field.on('submit', () => {
        const nextField = fields[(index + 1) % fields.length];
        nextField.focus();
        screen.render();
    });
  });

  screen.key(['C-s'], () => {
    formBox.hide();
    const title = formFields.title.getValue().trim();
    const date = formFields.date.getValue().trim();
    const startTime = formFields.startTime.getValue().trim();
    const endTime = formFields.endTime.getValue().trim();

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
      Object.values(formFields).forEach(field => field.clearValue());
      formFields.title.focus();
      inputBox.setContent('Event successfully registered!');
      inputBox.show();
      inputBox.focus();
      screen.render();
      setTimeout(() => {
        inputBox.setContent('');
        inputBox.hide();
        screen.render();
      }, 2000);
    });
  });
}
