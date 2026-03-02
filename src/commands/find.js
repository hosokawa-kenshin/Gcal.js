import {
  createDisplayItemsForEvents,
  formatDisplayItems,
  searchDisplayItemIndex,
  setLastYearSortOrder,
  applyLastYearSort,
  isRecentDescViewActive,
} from '../ui/layout.js';
import { isSameDate } from '../utils/dateUtils.js';

/**
 * 去年の予定パネル / Recent Events パネル専用の検索処理
 * "find <word>" または "f <word>" でイベントをキーワードフィルタする
 * "sort [asc|desc]" または "s [asc|desc]" でソート順を切り替える
 */
export function findInLastYear(input, allEvents, lastYearTable, logTable, screen) {
  const [command, ...args] = input.trim().split(/\s+/);
  const isRecent = isRecentDescViewActive();

  // sort コマンドの処理
  if (command === 'sort' || command === 's') {
    const order = args[0]; // 'asc' | 'desc' | undefined
    if (order && order !== 'asc' && order !== 'desc') {
      logTable.log('並び替え: "sort asc" または "sort desc" を指定してください');
      screen.render();
      return;
    }
    setLastYearSortOrder(order);
    applyLastYearSort(lastYearTable, screen);
    const label = order ? `${order === 'asc' ? '昇順' : '降順'}` : 'トグル';
    logTable.log(label === 'トグル' ? '並び順を切り替えました' : `${label}に並び替えました`);
    screen.render();
    return;
  }

  if (command !== 'find' && command !== 'f') {
    logTable.log('"find <keyword>" で検索，"sort [asc|desc]" で並び替えができます');
    screen.render();
    return;
  }

  // recentDesc モードでは全イベント、lastYear モードでは前年のみ対象
  let filteredEvents = isRecent
    ? [...allEvents]
    : allEvents.filter(e => e.start.getFullYear() === new Date().getFullYear() - 1);

  if (args.length > 0) {
    filteredEvents = filteredEvents.filter(event =>
      args.every(kw => event.summary && event.summary.includes(kw))
    );
  }

  if (filteredEvents.length === 0) {
    logTable.log(`"${args.join(' ')}" に一致するイベントが見つかりませんでした`);
    screen.render();
    return;
  }

  const displayItems = createDisplayItemsForEvents(filteredEvents);
  lastYearTable.displayItems = displayItems;
  lastYearTable.select(0);
  lastYearTable.scrollTo(0);
  logTable.log(`"${args.join(' ')}" で ${filteredEvents.length} 件に絞り込みました`);
  applyLastYearSort(lastYearTable, screen, `(${filteredEvents.length} results)`);
}

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
