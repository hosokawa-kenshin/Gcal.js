import { updateTable } from '../ui/layout.js';
import { mergeDuplicateEvents } from '../services/databaseService.js';

export function syncCommand(auth, screen, calendars, events, allEvents, keypressListener) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  leftTable.on('keypress', keypressListener);
  updateTable(auth, leftTable, calendars, events, allEvents);
  mergeDuplicateEvents();
  logTable.log('Synced with Google Calendar!');
}