import { google } from 'googleapis';
import { updateTable } from '../ui/layout.js';
import { splitDateTimeIntoDateAndTime, convertToDateTime } from '../utils/dateUtils.js';
import { createAddForm } from '../ui/form.js';

export function editEvent(auth, screen, calendars, index, events, allEvents) {
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const editCommandList = screen.children.find(child => child.options.label === 'Edit List');
  const { formBox, formFields } = createAddForm(screen);

  const selectedEvent = events[index];
  const selectedCalendarId = selectedEvent.calendarId;
  const selectedEventsId = selectedEvent.id;
  const { date: startDate, time: startTime } = splitDateTimeIntoDateAndTime(selectedEvent.start);
  const { date: endDate, time: endTime } = splitDateTimeIntoDateAndTime(selectedEvent.end);
  const calendarNames = Array.from(
    new Set(calendars.map(calendar => calendar.summary))
  );
  const calendarIDs = Array.from(
    new Set(calendars.map(calendar => calendar.id))
  );

  editCommandList.show();
  screen.render();
  editCommandList.focus();
  editCommandList.once('select', (item, index) => {
    switch (index) {
      case 0:
        editCommandList.hide();
        calendarList.show();
        calendarList.focus();
        screen.render();
        calendarList.once('select', (item, index) => {
          const selectedEditCalendar = calendarNames[index];
          const selectedEditCalendarId = calendarIDs[index];
          calendarList.hide();
          formBox.setLabel(`Edit Event - ${selectedEditCalendar}`);
          formBox.show();
          formFields.title.focus();
          formFields.title.setValue(selectedEvent.summary);
          formFields.date.setValue(startDate);
          formFields.startTime.setValue(startTime);
          formFields.endTime.setValue(endTime);
          screen.render();

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

            calendar.events.delete(
              {
                calendarId: selectedCalendarId,
                eventId: selectedEventsId,
              }
            );

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
              calendarId: selectedEditCalendarId,
              resource: event,
            }, async (err, res) => {
              if (err) return console.error('The API returned an error: ' + err);
              await updateTable(auth, leftTable, calendars, events, allEvents);
              logTable.log('Event successfully moved!');
              formBox.destroy();
              screen.render();
              leftTable.focus();
              screen.render();
            });
          });
        });
        break;
      case 1:
        editCommandList.hide();
        calendarList.show();
        calendarList.focus();
        screen.render();
        calendarList.once('select', (item, index) => {
          const selectedEditCalendar = calendarNames[index];
          const selectedEditCalendarId = calendarIDs[index];
          calendarList.hide();
          formBox.setLabel(`Edit Event - ${selectedEditCalendar}`);
          formBox.show();
          formFields.title.focus();
          formFields.title.setValue(selectedEvent.summary);
          formFields.date.setValue(startDate);
          formFields.startTime.setValue(startTime);
          formFields.endTime.setValue(endTime);
          screen.render();

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
              calendarId: selectedEditCalendarId,
              resource: event,
            }, async (err, res) => {
              if (err) return console.error('The API returned an error: ' + err);
              await updateTable(auth, leftTable, calendars, events, allEvents);
              logTable.log('Event successfully registered!');
              formBox.destroy();
              screen.render();
              leftTable.focus();
              screen.render();
            });
          });
        });
        break;
      case 2:
        calendar.events.delete(
          {
            calendarId: selectedCalendarId,
            eventId: selectedEventsId,
          },
          async (err, res) => {
            if (err) {
              console.error('The API returned an error: ' + err);
              return;
            }
            await updateTable(auth, leftTable, calendars, events, allEvents);
            logTable.log('Event successfully deleted!');
            editCommandList.hide();
            screen.render();
          }
        );
      default:
        break;
    }
  });

  editCommandList.key(['escape'], () => {
    editCommandList.hide();
    leftTable.focus();
    screen.render();
  });
}
