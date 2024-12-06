import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { searchIndexOfToday, formatGroupedEvents} from '../ui/layout.js';

export function findCommand(screen, events, args, keypressListener) {
  const [keyword] = args;
  const filteredEvents = events.filter(event => event.summary && event.summary.includes(keyword));
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  if (filteredEvents.length === 0) {
    logTable.log('No events found');
    return;
  }else{
    events.length = 0;
    events.push(...filteredEvents);
    const formattedEvents = formatGroupedEvents(events);
    leftTable.setItems(formattedEvents);
    leftTable.select(searchIndexOfToday(events));
    leftTable.scrollTo(leftTable.selected + leftTable.height - 3);
    leftTable.off('keypress', keypressListener);
    logTable.log('Filtered events by keyword: ' + keyword);
    screen.render();
    return;
  }
}