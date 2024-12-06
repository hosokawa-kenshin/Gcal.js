import { searchIndex } from "../ui/layout.js";
import { convertToDateTime } from "../utils/dateUtils.js";

export function jumpCommand(screen, events, args){
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  if (args.length === 0) {
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
  leftTable.select(searchIndex(date, events));
  leftTable.scrollTo(leftTable.selected + leftTable.height - 3);
  logTable.log(`Jumped to ${date}`);
  screen.render();
  return;
}