import { updateTable } from '../ui/layout.js';
export function syncCommand(auth, screen, calendars, events, keypressListener) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  leftTable.on('keypress', keypressListener);
  updateTable(auth, leftTable, calendars, events);
  logTable.log('Synced with Google Calendar!');
}