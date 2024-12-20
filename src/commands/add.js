import { google } from 'googleapis';
import { updateTable } from '../ui/layout.js';
import { convertToDateTime } from '../utils/dateUtils.js';
import { createAddForm } from '../ui/form.js';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

export function addEvent(auth, screen, calendars, events) {
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const { formBox, formFields } = createAddForm(screen);
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
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
  calendarList.focus();
  calendarList.once('select', (item, index) => {
    calendarList.hide();
    const selectedCalendar = calendarNames[index];
    selectedCalendarId = calendarIDs[index];
    formBox.setLabel(`Add Event - ${selectedCalendar}`);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const templateFilePath = path.join(__dirname, '../../template.txt');
    const tempFilePath = path.join(os.tmpdir(), 'blessed-editor.txt');

    fs.readFile(templateFilePath, 'utf8', (err, templateContent) => {
      if (err) {
        console.error('Error reading template file:', err);
        return;
      }

      fs.writeFileSync(tempFilePath, templateContent, 'utf8');

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
        console.log(updatedText);
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

        console.log(extractedDetails);

        fs.unlinkSync(tempFilePath);
      });
    });
    formBox.show();
    screen.render();
    formFields.title.focus();
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
      await updateTable(auth, leftTable, calendars, events);
      logTable.log('Event successfully registered!');
      formBox.destroy();
      screen.render();
      leftTable.focus();
      screen.render();
    });
  });
}
