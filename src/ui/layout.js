import blessed from 'blessed';
import { fetchEvents } from '../services/calendarService.js';
import { insertEventsToDatabase, fetchEventsFromDatabase } from '../services/databaseService.js';
import { fetchCommandList } from '../services/commandService.js';
import { setupVimKeysForNavigation } from './keyConfig.js';
import { convertToDateTime, getDayOfWeek } from '../utils/dateUtils.js';
import {
  createEventDetailTable,
  createEventTable,
  createLeftTable,
  createLogTable,
} from './table.js';
import { createGraph, insertDataToGraph } from './graph.js';
import Event from '../models/event.js';
import pkg from 'japanese-holidays';
const { isHoliday } = pkg;

// 全画面表示状態管理
let currentDisplayMode = 'split'; // 'split', 'fullscreen1', 'fullscreen2', 'fullscreen3'
let originalLayouts = {}; // 各テーブルの元の位置・サイズ情報
let tableReferences = {}; // テーブル参照を保持

/**
 * 各displayItemは { date: Date, event: Event | null, isFirstDay: boolean } の形式
 * 複数日イベントは各日に展開され，イベントのない日は event: null となる
 */
export function createDisplayItems(events, referenceDate) {
  const displayItems = [];

  const refDate = referenceDate || new Date();
  const startDate = new Date(`${refDate.getFullYear() - 1}-01-01T00:00:00`);
  const endDate = new Date(`${refDate.getFullYear() + 1}-12-31T23:59:00`);

  const dateEventMap = new Map();

  events.forEach(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(0, 0, 0, 0);

    const daysDiff = Math.round(
      (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (
      daysDiff === 0 ||
      (daysDiff === 1 &&
        event.start.toTimeString().slice(0, 5) === event.end.toTimeString().slice(0, 5))
    ) {
      const dateKey = eventStart.toLocalISOString().split('T')[0];
      if (!dateEventMap.has(dateKey)) {
        dateEventMap.set(dateKey, []);
      }
      dateEventMap.get(dateKey).push({ event, isFirstDay: true });
    } else {
      const currentDate = new Date(eventStart);
      let isFirst = true;
      while (currentDate < eventEnd) {
        const dateKey = currentDate.toLocalISOString().split('T')[0];
        if (!dateEventMap.has(dateKey)) {
          dateEventMap.set(dateKey, []);
        }
        dateEventMap.get(dateKey).push({ event, isFirstDay: isFirst });
        isFirst = false;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  });

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toLocalISOString().split('T')[0];
    const date = new Date(currentDate);

    if (dateEventMap.has(dateKey)) {
      const dayEvents = dateEventMap.get(dateKey);
      dayEvents.forEach(({ event, isFirstDay }) => {
        displayItems.push({ date: new Date(date), event, isFirstDay });
      });
    } else {
      displayItems.push({
        date: new Date(date),
        event: null,
        isFirstDay: true,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return displayItems;
}

export function searchDisplayItemIndex(date, displayItems) {
  const searchDate = new Date(date);
  searchDate.setHours(0, 0, 0, 0);
  const searchDateKey = searchDate.toLocalISOString().slice(0, 10);

  for (let i = 0; i < displayItems.length; i++) {
    const itemDate = new Date(displayItems[i].date);
    itemDate.setHours(0, 0, 0, 0);
    const itemDateKey = itemDate.toLocalISOString().slice(0, 10);

    if (itemDateKey === searchDateKey) {
      return i;
    } else if (itemDate > searchDate) {
      return i;
    }
  }

  return displayItems.length > 0 ? displayItems.length - 1 : 0;
}

export function searchDisplayItemIndexOfToday(displayItems) {
  const today = new Date();
  return searchDisplayItemIndex(today, displayItems);
}

/**
 * グラフを更新（新しいdisplayItems構造に対応）
 * displayItemsが利用可能な場合はそれを使用し、なければ後方互換性のためeventsを使用
 */
export function updateGraph(screen, rightGraph, index, events, displayItems = null) {
  let currentEventDate;

  if (displayItems && displayItems[index]) {
    // 新しいdisplayItems構造を使用
    currentEventDate = new Date(displayItems[index].date);
  } else if (events && events[index]) {
    // 後方互換性のため、旧方式もサポート
    currentEventDate = new Date(events[index].start);
  } else {
    // どちらも利用できない場合は今日の日付を使用
    currentEventDate = new Date();
  }

  const monday = new Date(currentEventDate);
  const currentDayOfWeek = monday.getDay();
  const offsetToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  monday.setDate(monday.getDate() + offsetToMonday);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const tempDate = new Date(monday);
    tempDate.setDate(monday.getDate() + i);
    weekDates.push(tempDate.toLocalISOString().split('T')[0]);
  }

  const filledTime = [];
  const groupedEvents = groupEventsByDate(events);
  weekDates.forEach(dateKey => {
    const year = Number(dateKey.split('-')[0]);
    const month = Number(dateKey.split('-')[1]);
    const day = parseInt(dateKey.split('-')[2], 10);
    const dayOfWeek = getDayOfWeek(year, month, day);
    const formattedDateKey = dateKey + '(' + dayOfWeek + ')';

    const dayEvents = groupedEvents[formattedDateKey] || [];
    const dayTimes = dayEvents.map(event => {
      const startTime = event.start.toTimeString().slice(0, 5);
      const endTime = event.end ? event.end.toTimeString().slice(0, 5) : '';
      return endTime ? `${startTime}-${endTime}` : startTime;
    });

    filledTime.push(dayTimes);
  });
  insertDataToGraph(screen, rightGraph, filledTime, monday);
}

function colorDate(dateKey, color) {
  if (color === 'blue') {
    return `{blue-fg}${dateKey}{/blue-fg}`;
  } else if (color === 'red') {
    return `{red-fg}${dateKey}{/red-fg}`;
  }
  return dateKey;
}

export function groupEventsByDate(events) {
  return events.reduce((grouped, event) => {
    var dateKey = event.start.toLocalISOString().split('T')[0];
    var year = Number(event.start.toLocalISOString().split('-')[0]);
    var month = Number(event.start.toLocalISOString().split('-')[1]);
    var day = parseInt(event.start.toLocalISOString().split('-')[2], 10);
    dateKey = dateKey + '(' + getDayOfWeek(year, month, day) + ')';
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
    return grouped;
  }, {});
}

/**
 * displayItems配列からテーブル表示用の文字列配列を生成
 */
export function formatDisplayItems(displayItems) {
  const formattedData = [];
  let beforeDateKey = null;

  displayItems.forEach(item => {
    const { date, event, isFirstDay } = item;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = getDayOfWeek(year, month, day);
    const dateKey = date.toLocalISOString().split('T')[0] + '(' + dayOfWeek + ')';

    if (!event) {
      let coloredDate = dateKey;
      const dayNum = date.getDay();
      if (dayNum === 6) {
        coloredDate = colorDate(dateKey, 'blue');
      } else if (dayNum === 0 || isHoliday(date)) {
        coloredDate = colorDate(dateKey, 'red');
      } else {
        coloredDate = colorDate(dateKey, 'normal');
      }
      formattedData.push(`${coloredDate}`);
      beforeDateKey = dateKey;
      return;
    }

    const startTime = event.start.toTimeString().slice(0, 5);
    const endTime = event.end ? event.end.toTimeString().slice(0, 5) : '';
    const time = endTime ? `${startTime}-${endTime}` : startTime;
    const summary = event.summary;
    const calendarName = `[${event.calendarName}]`;
    let coloredDate = dateKey;

    if (dateKey === beforeDateKey) {
      coloredDate = ''.padEnd(dateKey.length);
    } else {
      const dayNum = date.getDay();
      if (dayNum === 6) {
        coloredDate = colorDate(dateKey, 'blue');
      } else if (dayNum === 0 || isHoliday(date)) {
        coloredDate = colorDate(dateKey, 'red');
      } else {
        coloredDate = colorDate(dateKey, 'normal');
      }
    }

    beforeDateKey = dateKey;

    if (time === '00:00-00:00') {
      formattedData.push(`${coloredDate}`);
    } else if (startTime === endTime) {
      formattedData.push(`${coloredDate}  終日         ${summary}  ${calendarName}`);
    } else {
      formattedData.push(`${coloredDate}  ${time}  ${summary}  ${calendarName}`);
    }
  });

  return formattedData;
}

// 後方互換性のため、旧関数も残す（非推奨）
export function formatGroupedEvents(events) {
  const groupedEvents = groupEventsByDate(events);
  const formattedData = [];
  var beforeDateKey = null;
  Object.keys(groupedEvents).forEach(dateKey => {
    groupedEvents[dateKey].forEach(event => {
      const startTime = event.start.toTimeString().slice(0, 5);
      const endTime = event.end ? event.end.toTimeString().slice(0, 5) : '';
      const time = endTime ? `${startTime}-${endTime}` : startTime;
      const summary = event.summary;
      const calendarName = `[${event.calendarName}]`;
      let coloredDate = dateKey;

      if (dateKey === beforeDateKey) {
        coloredDate = ''.padEnd(dateKey.length);
      } else {
        const date = new Date(event.start);
        const day = date.getDay();
        if (day === 6) {
          coloredDate = colorDate(dateKey, 'blue');
        } else if (day === 0 || isHoliday(date)) {
          coloredDate = colorDate(dateKey, 'red');
        } else {
          coloredDate = colorDate(dateKey, 'normal');
        }
      }
      beforeDateKey = dateKey;
      if (time === '00:00-00:00') {
        formattedData.push(`${coloredDate}`);
      } else if (startTime === endTime) {
        formattedData.push(`${coloredDate}  終日         ${summary}  ${calendarName}`);
      } else {
        formattedData.push(`${coloredDate}  ${time}  ${summary}  ${calendarName}`);
      }
    });
  });
  return formattedData;
}

export function formatGroupedEventsDescending(events) {
  const now = new Date();
  now.setHours(23, 59, 59, 99);
  const groupedEvents = groupEventsByDate(events);

  const filteredGroupedEvents = Object.entries(groupedEvents)
    .filter(([_, eventList]) => {
      return eventList.some(event => new Date(event.start) < now);
    })
    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));

  const formattedData = [];
  let beforeDateKey = null;

  filteredGroupedEvents.forEach(([dateKey, events]) => {
    events.forEach(event => {
      const startTime = event.start.toTimeString().slice(0, 5);
      const endTime = event.end ? event.end.toTimeString().slice(0, 5) : '';
      const time = endTime ? `${startTime}-${endTime}` : startTime;
      const summary = event.summary;
      const calendarName = `[${event.calendarName}]`;
      let coloredDate = dateKey;

      if (dateKey === beforeDateKey) {
        coloredDate = ''.padEnd(dateKey.length);
      } else {
        const date = new Date(event.start);
        const day = date.getDay();
        if (day === 6) {
          coloredDate = colorDate(dateKey, 'blue');
        } else if (day === 0 || isHoliday(date)) {
          coloredDate = colorDate(dateKey, 'red');
        } else {
          coloredDate = colorDate(dateKey, 'normal');
        }
      }

      beforeDateKey = dateKey;

      if (time === '00:00-00:00') {
        formattedData.push(`${coloredDate}`);
      } else if (startTime === endTime) {
        formattedData.push(`${coloredDate}  終日         ${summary}  ${calendarName}`);
      } else {
        formattedData.push(`${coloredDate}  ${time}  ${summary}  ${calendarName}`);
      }
    });
  });

  return formattedData;
}

export async function updateTable(auth, table, calendars, events, allEvents) {
  const newEvents = await fetchEvents(auth, calendars);
  await insertEventsToDatabase(newEvents);
  allEvents.length = 0;
  const fetchedEvent = await fetchEventsFromDatabase(calendars);
  allEvents.push(...fetchedEvent);
  events.length = 0;
  events.push(
    ...allEvents.filter(
      event =>
        event.start.getFullYear() === new Date().getFullYear() ||
        event.start.getFullYear() === new Date().getFullYear() + 1 ||
        event.start.getFullYear() === new Date().getFullYear() - 1
    )
  );

  // 新しいdisplayItems構造を使用
  const displayItems = createDisplayItems(events, new Date());
  const formattedEvents = formatDisplayItems(displayItems);
  table.displayItems = displayItems; // テーブルにdisplayItemsを保持
  table.setItems(formattedEvents);
  table.select(searchDisplayItemIndex(new Date(), displayItems));
  table.scrollTo(table.selected + table.height - 3);
  table.screen.render();
}

export function updateEventsAndUI(
  screen,
  events,
  allEvents,
  leftTable,
  rightGraph,
  logTable,
  targetDate,
  index,
  message
) {
  events.length = 0;
  events.push(
    ...allEvents.filter(
      event =>
        event.start.getFullYear() === targetDate.getFullYear() ||
        event.start.getFullYear() === targetDate.getFullYear() + 1 ||
        event.start.getFullYear() === targetDate.getFullYear() - 1
    )
  );
  events.sort((a, b) => a.start - b.start);

  // 新しいdisplayItems構造を使用
  const displayItems = createDisplayItems(events, targetDate);
  const formattedEvents = formatDisplayItems(displayItems);
  leftTable.displayItems = displayItems; // テーブルにdisplayItemsを保持
  leftTable.setItems(formattedEvents);
  index = searchDisplayItemIndex(targetDate, displayItems);
  leftTable.select(index);
  leftTable.scrollTo(leftTable.selected + leftTable.height - 3);
  updateGraph(screen, rightGraph, index, events, displayItems);
  logTable.log(message);
  screen.render();
}

export let commandPopup = null;
export let screenInstance = null;
export let inputBoxHidden = true;

// 全画面表示機能の関数群
export function saveOriginalLayout(table, tableId) {
  originalLayouts[tableId] = {
    top: table.top,
    left: table.left,
    width: table.width,
    height: table.height,
    hidden: table.hidden,
  };
}

// デフォルトレイアウトを再計算する関数
export function recalculateDefaultLayouts() {
  const defaultLayouts = {
    leftTable: {
      top: 0,
      left: 0,
      width: '50%',
      height: '100%',
      hidden: false,
    },
    rightGraph: {
      top: 0,
      left: '50%',
      width: '50%',
      height: '80%',
      hidden: false,
    },
    logTable: {
      top: '80%',
      left: '50%',
      width: '50%',
      height: '22%',
      hidden: false,
    },
  };

  // originalLayoutsを新しいデフォルト値で更新
  Object.keys(defaultLayouts).forEach(tableId => {
    if (originalLayouts[tableId]) {
      originalLayouts[tableId] = { ...defaultLayouts[tableId] };
    }
  });
}

// ターミナルサイズ変更時のレイアウト更新
export function handleTerminalResize() {
  if (currentDisplayMode === 'split') {
    // 3分割表示の場合、デフォルトレイアウトを再計算して適用
    recalculateDefaultLayouts();
    Object.keys(tableReferences).forEach(tableId => {
      const table = tableReferences[tableId];
      const layout = originalLayouts[tableId];
      if (table && layout) {
        table.top = layout.top;
        table.left = layout.left;
        table.width = layout.width;
        table.height = layout.height;
        table.hidden = layout.hidden;
      }
    });
    if (screenInstance) {
      screenInstance.render();
    }
  }
  // 全画面表示の場合は何もしない（既に100%なので自動調整される）
}

export function resizeTable(table, fullscreen) {
  if (fullscreen) {
    table.top = 0;
    table.left = 0;
    table.width = '100%';
    table.height = '100%';
  } else {
    const original = originalLayouts[table.tableId];
    if (original) {
      table.top = original.top;
      table.left = original.left;
      table.width = original.width;
      table.height = original.height;
    }
  }
}

export function hideOtherTables(activeTableId) {
  Object.keys(tableReferences).forEach(tableId => {
    if (tableId !== activeTableId) {
      tableReferences[tableId].hidden = true;
    }
  });
}

export function showAllTables() {
  Object.keys(tableReferences).forEach(tableId => {
    tableReferences[tableId].hidden = false;
  });
}

export function toggleFullscreen(tableIndex) {
  const tableIds = ['leftTable', 'rightGraph', 'logTable'];

  // escapeキーの場合（tableIndex = 0）、3分割表示に戻る
  if (tableIndex === 0) {
    if (currentDisplayMode !== 'split') {
      showAllTables();
      Object.keys(tableReferences).forEach(tableId => {
        resizeTable(tableReferences[tableId], false);
      });
      currentDisplayMode = 'split';
      if (screenInstance) {
        screenInstance.render();
      }
    }
    return;
  }

  const targetTableId = tableIds[tableIndex - 1];

  if (!targetTableId || !tableReferences[targetTableId]) {
    return;
  }

  const targetDisplayMode = `fullscreen${tableIndex}`;

  if (currentDisplayMode === targetDisplayMode) {
    // 全画面表示から3分割表示に戻る
    showAllTables();
    Object.keys(tableReferences).forEach(tableId => {
      resizeTable(tableReferences[tableId], false);
    });
    currentDisplayMode = 'split';
  } else {
    // 3分割表示または他の全画面表示から指定されたテーブルの全画面表示に切り替え
    showAllTables(); // まず全て表示
    Object.keys(tableReferences).forEach(tableId => {
      resizeTable(tableReferences[tableId], false); // 元のサイズに戻す
    });

    // 指定されたテーブルを全画面表示
    resizeTable(tableReferences[targetTableId], true);
    hideOtherTables(targetTableId);
    tableReferences[targetTableId].hidden = false;
    currentDisplayMode = targetDisplayMode;
  }

  if (screenInstance) {
    screenInstance.render();
  }
}

export function removeCommandPopup() {
  if (commandPopup && screenInstance) {
    screenInstance.remove(commandPopup);
    commandPopup = null;
    screenInstance.render();
  }
}

export function createLayout(calendars, events) {
  const calendarNames = Array.from(new Set(calendars.map(calendar => calendar.summary)));

  const commands = fetchCommandList();

  const screen = blessed.screen({
    smartCSR: true,
    title: 'Google Calendar Events',
    fullUnicode: true,
  });

  screenInstance = screen;

  // ターミナルサイズ変更のイベントリスナーを追加
  screen.on('resize', () => {
    handleTerminalResize();
  });

  const inputBox = blessed.textbox({
    top: 'center',
    left: 'center',
    width: '60%',
    height: 3,
    border: { type: 'line', fg: 'white' },
    label: 'Commandline',
    style: {
      fg: 'white',
    },
    inputOnFocus: true,
    hidden: true,
  });

  inputBox.on('show', () => {
    inputBoxHidden = false;
  });

  inputBox.on('hide', () => {
    inputBoxHidden = true;
    removeCommandPopup();
  });

  inputBox.on('focus', () => {
    if (!inputBoxHidden) {
      setTimeout(() => {
        const currentInput = inputBox.getValue().trim();
        showFilteredCommands(currentInput);
        screen.render();
      }, 10);
    }
  });

  inputBox.on('keypress', (ch, key) => {
    if (key.name === 'escape') {
      if (commandPopup) {
        removeCommandPopup();
      }
      return;
    }

    if (key.name === 'return') {
      inputBoxHidden = true;
      return;
    }

    if (key.name !== 'tab') {
      setTimeout(() => {
        if (!inputBoxHidden) {
          const currentInput = inputBox.getValue().trim();
          showFilteredCommands(currentInput);
        }
      }, 10);
    }
  });

  inputBox.key(['return'], () => {
    removeCommandPopup();
    inputBoxHidden = true;
  });

  inputBox.key(['tab'], () => {
    const currentInput = inputBox.getValue().trim();
    const commands = fetchCommandList();

    const matchingCommands = commands.filter(
      cmd => cmd.startsWith(currentInput) && cmd !== currentInput
    );

    if (matchingCommands.length === 1) {
      inputBox.setValue(matchingCommands[0] + ' ');
      showFilteredCommands(matchingCommands[0] + ' ');
      screen.render();
    } else if (matchingCommands.length > 1) {
      let commonPrefix = currentInput;
      let position = currentInput.length;
      let allSameChar = true;

      while (allSameChar && matchingCommands.every(cmd => cmd.length > position)) {
        const char = matchingCommands[0][position];
        allSameChar = matchingCommands.every(cmd => cmd[position] === char);
        if (allSameChar) {
          commonPrefix += char;
          position++;
        }
      }

      inputBox.setValue(commonPrefix);
      showFilteredCommands(commonPrefix);
      screen.render();
    }
  });

  inputBox.key(['escape'], () => {
    removeCommandPopup();
    inputBox.hide();
    screen.render();
  });

  function showFilteredCommands(input) {
    if (inputBoxHidden) {
      return;
    }

    const commands = fetchCommandList();
    let filteredCommands = commands;

    if (input) {
      filteredCommands = commands.filter(cmd => cmd.startsWith(input));
    }

    if (filteredCommands.length === 0) {
      removeCommandPopup();
      return;
    }

    removeCommandPopup();

    if (!inputBoxHidden) {
      commandPopup = blessed.list({
        parent: screenInstance,
        top: inputBox.top + 3,
        left: inputBox.left,
        width: '40%',
        height: Math.min(filteredCommands.length + 2, 10),
        items: filteredCommands,
        label: 'Command Completion',
        border: { type: 'line', fg: 'cyan' },
        style: {
          fg: 'white',
          bg: 'black',
          selected: { fg: 'black', bg: 'green' },
        },
        keys: true,
        mouse: true,
        scrollable: true,
      });

      commandPopup.on('select', item => {
        inputBox.setValue(item + ' ');
        screen.render();
        inputBox.focus();
      });

      commandPopup.key(['escape'], () => {
        removeCommandPopup();
        screen.render();
        inputBox.focus();
      });

      if (filteredCommands.length > 0) {
        commandPopup.select(0);
      }

      screen.render();
    }
  }

  const list = blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    items: calendarNames,
    label: 'Calendar List',
    border: { type: 'line', fg: 'yellow' },
    style: {
      fg: 'white',
      bg: 'black',
      selected: { fg: 'black', bg: 'green' },
    },
    hidden: true,
    mouse: true,
    keys: true,
  });

  const editCalendarCommandList = blessed.list({
    top: '50%',
    left: 'center',
    width: '50%',
    height: '20%',
    items: [
      '選択日にイベントを追加',
      'イベントを編集',
      'イベントをコピー',
      'イベントを削除',
      '他のイベントを参照して選択日にコピー',
    ],
    label: 'Edit List',
    border: { type: 'line', fg: 'yellow' },
    style: {
      fg: 'white',
      bg: 'black',
      selected: { fg: 'black', bg: 'green' },
    },
    hidden: true,
    mouse: true,
    keys: true,
  });

  const commandList = blessed.list({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    items: commands,
    label: 'Command List',
    border: { type: 'line', fg: 'yellow' },
    style: {
      fg: 'white',
      bg: 'black',
      selected: { fg: 'black', bg: 'green' },
    },
    hidden: true,
    mouse: true,
    keys: true,
  });

  const commandDetailsBox = blessed.box({
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    label: 'Command Details',
    border: { type: 'line', fg: 'cyan' },
    hidden: true,
  });

  const keypressListener = (_, key) => {
    if (key.name === 'j' || key.name === 'k') {
      const currentIndex = leftTable.selected;
      // displayItems構造を使用する場合、eventsの代わりにdisplayItemsから情報を取得
      if (leftTable.displayItems && leftTable.displayItems[currentIndex]) {
        const item = leftTable.displayItems[currentIndex];
        if (item.date.getDay() === 0 || item.date.getDay() === 1) {
          updateGraph(screen, rightGraph, currentIndex, events, leftTable.displayItems);
        }
      }
    }
  };

  const leftTable = createLeftTable(screen);

  // 新しいdisplayItems構造を使用
  const displayItems = createDisplayItems(events, new Date());
  const formattedEvents = formatDisplayItems(displayItems);
  leftTable.displayItems = displayItems; // テーブルにdisplayItemsを保持

  const eventTable = createEventTable(screen);
  const currentEvents = formatGroupedEventsDescending(events);
  leftTable.setItems(formattedEvents);
  eventTable.setItems(currentEvents);
  const rightGraph = createGraph(screen);
  leftTable.on('keypress', keypressListener);
  const logTable = createLogTable(screen);
  logTable.log('Welcome to Gcal.js!');
  leftTable.select(searchDisplayItemIndexOfToday(displayItems));
  leftTable.scrollTo(leftTable.selected + leftTable.height - 3);
  updateGraph(screen, rightGraph, leftTable.selected, events, displayItems);
  const eventDetailTable = createEventDetailTable(screen);

  screen.append(inputBox);
  screen.append(list);
  screen.append(editCalendarCommandList);
  screen.append(commandList);
  screen.append(commandDetailsBox);
  screen.append(eventDetailTable);
  setupVimKeysForNavigation(leftTable, screen, null);
  setupVimKeysForNavigation(list, screen, null);
  setupVimKeysForNavigation(commandList, screen, null);
  setupVimKeysForNavigation(editCalendarCommandList, screen, null);
  setupVimKeysForNavigation(eventTable, screen, null);

  // テーブル参照の初期化と元のレイアウト情報の保存
  leftTable.tableId = 'leftTable';
  rightGraph.tableId = 'rightGraph';
  logTable.tableId = 'logTable';

  tableReferences.leftTable = leftTable;
  tableReferences.rightGraph = rightGraph;
  tableReferences.logTable = logTable;

  saveOriginalLayout(leftTable, 'leftTable');
  saveOriginalLayout(rightGraph, 'rightGraph');
  saveOriginalLayout(logTable, 'logTable');

  leftTable.focus();
  leftTable.key(['space'], () => {
    inputBox.show();
    inputBox.focus();
    screen.render();
  });
  console.log('Create Layout');
  return { screen, inputBox, keypressListener };
}
