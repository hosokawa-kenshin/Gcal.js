import { google } from 'googleapis';
import { updateTable } from '../ui/layout.js';
import { splitDateTimeIntoDateAndTime, convertToDateTime } from '../utils/dateUtils.js';
import { createAddForm } from '../ui/form.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

export function editEvent(auth, screen, calendars, index, events, allEvents) {
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const editCommandList = screen.children.find(child => child.options.label === 'Edit List');
  const { formBox, formFields } = createAddForm(screen);
  const tempFilePath = path.join(os.tmpdir(), 'blessed-editor.txt');
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
          formBox.focus();
          const eventContent = `Event Title | ${selectedEvent.summary}
Date (YYYY-MM-DD) | ${startDate}
Start Time (HH:mm) | ${startTime}
End Time (HH:mm) |  ${endTime}
`;
          fs.writeFileSync(tempFilePath, eventContent, 'utf8');
          const editor = process.env.EDITOR || 'vim';
          screen.exec(editor, [tempFilePath], {}, (err, code, signal) => {
            if (err) {
              console.error('Error opening editor:', err);
              return;
            }
            if (code !== true) {
              console.log(`Editor exited with code: ${code}`);
              return;
            }
            const updatedText = fs.readFileSync(tempFilePath, 'utf8');
            const extractDetails = (text) => {
              const lines = text.split('\n');
              const details = {};
              lines.forEach(line => {
                const parts = line.split('|').map(part => part.trim());
                if (parts.length === 2) {
                  const [label, value] = parts;
                  details[label] = value;
                }
              });
              return details;
            };

            const extractedDetails = extractDetails(updatedText);

            formFields.title.setValue(extractedDetails['Event Title']);
            formFields.date.setValue(extractedDetails['Date (YYYY-MM-DD)']);
            formFields.startTime.setValue(extractedDetails['Start Time (HH:mm)']);
            formFields.endTime.setValue(extractedDetails['End Time (HH:mm)']);

            screen.render();
            fs.unlinkSync(tempFilePath);
            screen.render();
            formBox.key(['enter'], () => {
              var title = formFields.title.getValue().trim();
              var date = formFields.date.getValue().trim();
              var startTime = formFields.startTime.getValue().trim();
              var endTime = formFields.endTime.getValue().trim();
              const eventContent = `Event Title | ${title}
Date (YYYY-MM-DD) | ${date}
Start Time (HH:mm) | ${startTime}
End Time (HH:mm) |  ${endTime}
`;
              fs.writeFileSync(tempFilePath, eventContent, 'utf8');
              const editor = process.env.EDITOR || 'vim';
              screen.exec(editor, [tempFilePath], {}, (err, code, signal) => {
                if (err) {
                  console.error('Error opening editor:', err);
                  return;
                }
                if (code !== true) {
                  console.log(`Editor exited with code: ${code}`);
                  return;
                }
                const updatedText = fs.readFileSync(tempFilePath, 'utf8');
                const extractDetails = (text) => {
                  const lines = text.split('\n');
                  const details = {};
                  lines.forEach(line => {
                    const parts = line.split('|').map(part => part.trim());
                    if (parts.length === 2) {
                      const [label, value] = parts;
                      details[label] = value;
                    }
                  });
                  return details;
                };

                const extractedDetails = extractDetails(updatedText);
                title = extractedDetails['Event Title'];
                date = extractedDetails['Date (YYYY-MM-DD)'];
                startTime = extractedDetails['Start Time (HH:mm)'];
                endTime = extractedDetails['End Time (HH:mm)'];

                formFields.title.setValue(title);
                formFields.date.setValue(date);
                formFields.startTime.setValue(startTime);
                formFields.endTime.setValue(endTime);

                screen.render();
                fs.unlinkSync(tempFilePath);
              });
            });
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

        }
        );
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
          formBox.focus();
          screen.render();
          const eventContent = `Event Title | ${selectedEvent.summary}
Date (YYYY-MM-DD) | ${startDate}
Start Time (HH:mm) | ${startTime}
End Time (HH:mm) |  ${endTime}
`;
          fs.writeFileSync(tempFilePath, eventContent, 'utf8');
          const editor = process.env.EDITOR || 'vim';
          screen.exec(editor, [tempFilePath], {}, (err, code, signal) => {
            if (err) {
              console.error('Error opening editor:', err);
              return;
            }
            if (code !== true) {
              console.log(`Editor exited with code: ${code}`);
              return;
            }
            const updatedText = fs.readFileSync(tempFilePath, 'utf8');
            const extractDetails = (text) => {
              const lines = text.split('\n');
              const details = {};
              lines.forEach(line => {
                const parts = line.split('|').map(part => part.trim());
                if (parts.length === 2) {
                  const [label, value] = parts;
                  details[label] = value;
                }
              });
              return details;
            };

            const extractedDetails = extractDetails(updatedText);

            formFields.title.setValue(extractedDetails['Event Title']);
            formFields.date.setValue(extractedDetails['Date (YYYY-MM-DD)']);
            formFields.startTime.setValue(extractedDetails['Start Time (HH:mm)']);
            formFields.endTime.setValue(extractedDetails['End Time (HH:mm)']);

            screen.render();
            fs.unlinkSync(tempFilePath);
          });
          formBox.key(['enter'], () => {
            var title = formFields.title.getValue().trim();
            var date = formFields.date.getValue().trim();
            var startTime = formFields.startTime.getValue().trim();
            var endTime = formFields.endTime.getValue().trim();
            const eventContent = `Event Title | ${title}
Date (YYYY-MM-DD) | ${date}
Start Time (HH:mm) | ${startTime}
End Time (HH:mm) |  ${endTime}
`;
            fs.writeFileSync(tempFilePath, eventContent, 'utf8');
            const editor = process.env.EDITOR || 'vim';
            screen.exec(editor, [tempFilePath], {}, (err, code, signal) => {
              if (err) {
                console.error('Error opening editor:', err);
                return;
              }
              if (code !== true) {
                console.log(`Editor exited with code: ${code}`);
                return;
              }
              const updatedText = fs.readFileSync(tempFilePath, 'utf8');
              const extractDetails = (text) => {
                const lines = text.split('\n');
                const details = {};
                lines.forEach(line => {
                  const parts = line.split('|').map(part => part.trim());
                  if (parts.length === 2) {
                    const [label, value] = parts;
                    details[label] = value;
                  }
                });
                return details;
              };

              const extractedDetails = extractDetails(updatedText);
              title = extractedDetails['Event Title'];
              date = extractedDetails['Date (YYYY-MM-DD)'];
              startTime = extractedDetails['Start Time (HH:mm)'];
              endTime = extractedDetails['End Time (HH:mm)'];

              formFields.title.setValue(title);
              formFields.date.setValue(date);
              formFields.startTime.setValue(startTime);
              formFields.endTime.setValue(endTime);

              screen.render();
              fs.unlinkSync(tempFilePath);
            });
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
