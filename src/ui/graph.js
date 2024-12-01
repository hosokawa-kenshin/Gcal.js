import blessed from 'blessed';
import contrib from 'blessed-contrib';

export function createGraph(screen) {
  const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

  const table = grid.set(0, 6, 12, 6, contrib.table, {
    label: 'Filled Time Graph',
    columnWidth: [21, 21],
    border: { type: 'line', fg: 'cyan' },
    align: ['center', 'center'],
    padding: { left: 0, right: 0 },
    selectedFg: 'green',
    selectedBg: 'black',
  });

  return table;
}

export function insertDataToGraph(screen, table, eventsDataTimes) {
  var filledTime=[24];
  for (let i = 0; i < 24; i++) {
    const hour = i < 10 ? `0${i}` : `${i}`;
    const hourAgo = i+1 < 10 ? `0${i+1}` : `${i+1}`;
    filledTime[i] = [`${hour}:00-${hourAgo}:00`, '-'];
  }

  eventsDataTimes.forEach(time => {
    const eventTime = time;
    const startTime = eventTime.split('-')[0];
    const startHour = parseInt(startTime.split(':')[0]);
    const endTime = eventTime.split('-')[1];
    const endHour = parseInt(endTime.split(':')[0]);
    for (let i = startHour; i < endHour; i++) {
      const hour = i < 10 ? `0${i}` : `${i}`;
      const hourAgo = i+1 < 10 ? `0${i+1}` : `${i+1}`;
      filledTime[i] = [`${hour}:00-${hourAgo}:00`, '■'];
    }
  });

  table.setData({
    headers: ['Time', 'Filled'],
    data: filledTime,
  });

  screen.render();
}