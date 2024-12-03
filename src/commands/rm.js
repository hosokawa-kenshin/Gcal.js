import {google} from 'googleapis';
import {updateTable} from '../ui/layout.js';
import {convertToDateTime} from '../utils/dateUtils.js';

export function rmEvent(auth, screen, calendars, index, events){
  const calendar = google.calendar({version: 'v3', auth});
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const editCommandList = screen.children.find(child => child.options.label === 'Edit List');

  const selectedEvents = events[index];
  const selectedCalendarId = selectedEvents.calendarId;
  const selectedEventsId = selectedEvents.id;


  editCommandList.show();
  screen.render();
  editCommandList.focus();
  editCommandList.once('select', (item, index) => {
    if (index === 0){
      calendar.events.delete({
        calendarId: selectedCalendarId,
        eventId: selectedEventsId,
      }, async(err, res) => {
        if (err) return console.error('The API returned an error: ' + err);
        await updateTable(auth, leftTable, calendars, events);
        logTable.log('Event successfully deleted!');
        editCommandList.hide();
        screen.render();
      });
    }
  });
}
