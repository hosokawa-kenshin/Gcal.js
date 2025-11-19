import { convertToDateTime } from '../utils/dateUtils.js';
import { updateEventsAndUI } from '../ui/layout.js';

export function jumpCommand(screen, events, allEvents, args) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const rightGraph = screen.children.find(child => child.options.label === 'Filled Time Graph');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const index = leftTable.selected || 0;

  let currentDate;
  if (leftTable.displayItems && leftTable.displayItems[index]) {
    currentDate = new Date(leftTable.displayItems[index].date);
  } else if (events[index]) {
    currentDate = new Date(events[index].start);
  } else {
    currentDate = new Date();
  }

  const selectedDate = currentDate;
  let targetDate;

  if (args.length === 0) {
    targetDate = new Date();
    updateEventsAndUI(
      screen,
      events,
      allEvents,
      leftTable,
      rightGraph,
      logTable,
      targetDate,
      index,
      'Jumped to today'
    );
    return;
  }

  const arg = args[0].toLowerCase();

  switch (arg) {
    case 'lw':
      targetDate = new Date(selectedDate);
      targetDate.setDate(selectedDate.getDate() - 7);
      updateEventsAndUI(
        screen,
        events,
        allEvents,
        leftTable,
        rightGraph,
        logTable,
        targetDate,
        index,
        'Jumped to last week'
      );
      break;
    case 'lm':
      targetDate = new Date(selectedDate);
      targetDate.setMonth(selectedDate.getMonth() - 1);
      updateEventsAndUI(
        screen,
        events,
        allEvents,
        leftTable,
        rightGraph,
        logTable,
        targetDate,
        index,
        'Jumped to last month'
      );
      break;
    case 'ly':
      targetDate = new Date(selectedDate);
      targetDate.setFullYear(selectedDate.getFullYear() - 1);
      updateEventsAndUI(
        screen,
        events,
        allEvents,
        leftTable,
        rightGraph,
        logTable,
        targetDate,
        index,
        'Jumped to last year'
      );
      break;
    case 'nw':
      targetDate = new Date(selectedDate);
      targetDate.setDate(selectedDate.getDate() + 7);
      updateEventsAndUI(
        screen,
        events,
        allEvents,
        leftTable,
        rightGraph,
        logTable,
        targetDate,
        index,
        'Jumped to next week'
      );
      break;
    case '2w':
      targetDate = new Date(selectedDate);
      targetDate.setDate(selectedDate.getDate() + 14);
      updateEventsAndUI(
        screen,
        events,
        allEvents,
        leftTable,
        rightGraph,
        logTable,
        targetDate,
        index,
        'Jumped to 2 weeks later'
      );
      break;
    case 'nm':
      targetDate = new Date(selectedDate);
      targetDate.setMonth(selectedDate.getMonth() + 1);
      updateEventsAndUI(
        screen,
        events,
        allEvents,
        leftTable,
        rightGraph,
        logTable,
        targetDate,
        index,
        'Jumped to next month'
      );
      break;
    case 'ny':
      targetDate = new Date(selectedDate);
      targetDate.setFullYear(selectedDate.getFullYear() + 1);
      updateEventsAndUI(
        screen,
        events,
        allEvents,
        leftTable,
        rightGraph,
        logTable,
        targetDate,
        index,
        'Jumped to next year'
      );
      break;
    default:
      targetDate = convertToDateTime(arg);
      if (isNaN(targetDate.getTime())) {
        logTable.log(`Invalid date: ${args[0]}`);
        screen.render();
        return;
      }
      updateEventsAndUI(
        screen,
        events,
        allEvents,
        leftTable,
        rightGraph,
        logTable,
        targetDate,
        index,
        `Jumped to ${targetDate}`
      );
      break;
  }
}
