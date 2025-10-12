import {
  createDisplayItemsForEvents,
  formatDisplayItems,
  searchDisplayItemIndex,
} from '../ui/layout.js';
import { isSameDate } from '../utils/dateUtils.js';

export function findCommand(screen, events, allEvents, args, keypressListener) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');

  let keywords = [];
  let searchDate = null;
  let searchMonth = null;

  const dateRegex = /^(\d{4}-\d{2}-\d{2}|\d{2}-\d{2})$/;
  const monthRegex = /^(\d{1,2})$/;

  args.forEach(arg => {
    if (dateRegex.test(arg)) {
      searchDate = new Date(arg);
      if (arg.length === 5) {
        searchDate.setFullYear(new Date().getFullYear());
      }
    } else if (monthRegex.test(arg)) {
      const month = parseInt(arg, 10);
      if (month >= 1 && month <= 12) {
        searchMonth = month;
      }
    } else {
      keywords.push(arg);
    }
  });

  let filteredEvents = allEvents;

  if (keywords.length > 0) {
    filteredEvents = filteredEvents.filter(event =>
      keywords.every(keyword => event.summary && event.summary.includes(keyword))
    );
  }

  if (searchDate) {
    filteredEvents = filteredEvents.filter(event => {
      const eventStartDate = new Date(event.start);
      return isSameDate(eventStartDate, searchDate);
    });
  }

  if (searchMonth) {
    filteredEvents = filteredEvents.filter(event => {
      const eventStartDate = new Date(event.start);
      return eventStartDate.getMonth() + 1 === searchMonth;
    });
  }

  if (filteredEvents.length === 0) {
    logTable.log('No events found');
    screen.render();
    return;
  } else {
    events.length = 0;
    events.push(...filteredEvents);

    const displayItems = createDisplayItemsForEvents(filteredEvents);
    const formattedEvents = formatDisplayItems(displayItems);
    leftTable.displayItems = displayItems;
    leftTable.setItems(formattedEvents);

    const closestIndex = searchDisplayItemIndex(new Date(), displayItems);

    leftTable.select(closestIndex);
    leftTable.scrollTo(Math.max(0, closestIndex - Math.floor(leftTable.height / 2)));
    leftTable.off('keypress', keypressListener);
    logTable.log(`Filtered events by: ${args.join(' ')}`);
    screen.render();
    return;
  }
}
