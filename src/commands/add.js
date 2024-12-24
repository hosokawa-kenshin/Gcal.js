import { google } from 'googleapis';
import { updateTable } from '../ui/layout.js';
import { convertToDateTime } from '../utils/dateUtils.js';
import { createAddForm } from '../ui/form.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

export function addEvent(auth, screen, calendars, events, allEvents) {
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const { formBox, formFields } = createAddForm(screen);
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const tempFilePath = path.join(os.tmpdir(), 'blessed-editor.txt');

  var selectedCalendarId = null;
  var title = null;
  var date = null;
  var startTime = null;
  var endTime = null;

  const calendarNames = Array.from(
    new Set(calendars.map(calendar => calendar.summary))
  );
  const calendarIDs = Array.from(
    new Set(calendars.map(calendar => calendar.id))
  );

  calendarList.show();
  screen.render();
  calendarList.focus();
  calendarList.once('select', (item, index) => {
    calendarList.hide();
    const selectedCalendar = calendarNames[index];
    selectedCalendarId = calendarIDs[index];
    formBox.setLabel(`Add Event - ${selectedCalendar}`);
    const today = new Date();
    today.setHours(today.getHours(), 0, 0, 0);
    const eventContent = `Event Title | 
Date (YYYY-MM-DD) | ${today.toLocalISOString().slice(0, 10)}
Start Time (HH:mm) | ${today.toLocalISOString().slice(11, 16)}
End Time (HH:mm) | ${today.toLocalISOString().slice(11, 16)}
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
    formBox.show();
    formBox.focus();
    screen.render();
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
}
