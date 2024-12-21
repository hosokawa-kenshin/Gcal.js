import { searchIndex } from "../ui/layout.js";
import { convertToDateTime } from "../utils/dateUtils.js";
import { fillEmptyEvents, formatGroupedEvents } from "../ui/layout.js";

export function jumpCommand(screen, events, allEvents, args) {
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  if (args.length === 0) {
    events.length = 0;
    events.push(...allEvents.filter(event => event.start.getFullYear() === new Date().getFullYear() || event.start.getFullYear() === new Date().getFullYear() + 1 || event.start.getFullYear() === new Date().getFullYear() - 1));
    events.sort((a, b) => a.start - b.start);
    fillEmptyEvents(events);
    const formattedEvents = formatGroupedEvents(events);
    leftTable.setItems(formattedEvents);
    leftTable.select(searchIndex(new Date, events));
    leftTable.scrollTo(leftTable.selected + leftTable.height - 3);
    logTable.log(`Jumped to today`);;
    screen.render();
    return;
  }
  const date = convertToDateTime(args[0]);
  if (isNaN(date.getTime())) {
    logTable.log(`Invalid date: ${args[0]}`);
    screen.render();
    return;
  }
  events.length = 0;
  events.push(...allEvents.filter(event => event.start.getFullYear() === date.getFullYear() || event.start.getFullYear() === date.getFullYear() + 1 || event.start.getFullYear() === date.getFullYear() - 1));
  events.sort((a, b) => a.start - b.start);
  fillEmptyEvents(events);
  const formattedEvents = formatGroupedEvents(events);
  leftTable.setItems(formattedEvents);
  leftTable.select(searchIndex(date, events));
  leftTable.scrollTo(leftTable.selected + leftTable.height - 3);
  logTable.log(`Jumped to ${date}`);
  screen.render();
  return;
}