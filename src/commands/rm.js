import {google} from 'googleapis';
import {updateTable} from '../ui/layout.js';
import {convertToDateTime} from '../utils/dateUtils.js';

export function rmEvent(auth, screen, calendars){
  const calendar = google.calendar({version: 'v3', auth});
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const inputBox = screen.children.find(child => child.options.label === 'Commandline');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const editCommandList = screen.children.find(child => child.options.label === 'Edit List');


  leftTable.rows.on('select', (item, index) =>{


    const selectedEvents = leftTable.rows.getItem(index).eventData;

    editCommandList.show();
    screen.rendar();





  });

}
