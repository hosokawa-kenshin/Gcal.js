import { updateTable } from '../ui/layout.js';
export function syncCommand(auth, screen, calendars, events) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  updateTable(auth, leftTable, calendars, events);
  logTable.log('Synced with Google Calendar!');
}