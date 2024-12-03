import blessed from 'blessed';
import contrib from 'blessed-contrib';

export function createGraph(screen) {
  const table = blessed.list({
    keys: true,
    fg: 'white',
    tags: true,
    selectedFg: 'green',
    interactive: true,
    label: 'Filled Time Graph',
    top: 0,
    left: '50%',
    width: '50%',
    height: '80%',
    padding: { left: 2, right: 5 },
    border: { type: 'line', fg: 'cyan' },
    columnSpacing: 2,
  });
  screen.append(table);

  return table;
}

export function insertDataToGraph(screen, table, eventsDataTimes, monday) {
  const filledTime = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourStart = hour < 10 ? `0${hour}:00` : `${hour}:00`;
    const hourEnd = hour + 1 < 10 ? `0${hour + 1}:00` : `${hour + 1}:00`;
    const timeSlot = `${hourStart}-${hourEnd}`;
    const weekData = [timeSlot];

    for (let day = 0; day < 7; day++) {
      const dayTimes = eventsDataTimes[day] || [];
      const isFilled = dayTimes.some((eventTime) => {
        const [start, end] = eventTime.split('-');
        const startHour = parseInt(start.split(':')[0], 10);
        const endHour = parseInt(end.split(':')[0], 10);
        const endMinute = parseInt(end.split(':')[1], 10);
        return hour >= startHour && (hour < endHour || (hour === endHour && endMinute > 0));
      });
      weekData.push(isFilled ? '■' : '-');
    }
    filledTime.push(weekData.join('     '));
  }

  const firstday = monday.toLocalISOString().split('T')[0].split('-').slice(1).join('/');;
  const secondDay = monday.addDays(1).toLocalISOString().split('T')[0].split('-').slice(1).join('/');;
  const thirdDay = monday.addDays(2).toLocalISOString().split('T')[0].split('-').slice(1).join('/');;
  const fourthDay = monday.addDays(3).toLocalISOString().split('T')[0].split('-').slice(1).join('/');;
  const fifthDay = monday.addDays(4).toLocalISOString().split('T')[0].split('-').slice(1).join('/');;
  const sixthDay = monday.addDays(5).toLocalISOString().split('T')[0].split('-').slice(1).join('/');;
  const lastday = monday.addDays(6).toLocalISOString().split('T')[0].split('-').slice(1).join('/');;
  const dayText = `              ${firstday} ${secondDay} ${thirdDay} ${fourthDay} ${fifthDay} ${sixthDay} ${lastday}`;
  const headers = "   Time        Mon   Tue   Wed   Thu   Fri   {blue-fg}Sat{/blue-fg}   {red-fg}Sun{/red-fg}";
  table.setItems([dayText, headers, ...filledTime]);

  screen.render();
}