const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const calendarIds = require('./calendarIds');
const Enquirer = require('enquirer');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');


/**
  * Parse date string and return Date object.
  * Date().toISOString() returns date string with local TZ.
  *
  * @return {String} ISO 8601 format date string (e.g., "2024-01-01T00:00:00+09:00")
  */
  Date.prototype.toLocalISOString = function() {
    const year = this.getFullYear();
    const month = String(this.getMonth() + 1).padStart(2, "0");
    const day = String(this.getDate()).padStart(2, "0");
    const hours = String(this.getHours()).padStart(2, "0");
    const minutes = String(this.getMinutes()).padStart(2, "0");
    const seconds = String(this.getSeconds()).padStart(2, "0");

    // Timezone offset
    const offsetMinutes = this.getTimezoneOffset();
    const offsetSign = offsetMinutes <= 0 ? "+" : "-";
    const offsetHours = String(Math.abs(offsetMinutes) / 60 | 0).padStart(2, "0");
    const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
    const timezoneOffset = `${offsetSign}${offsetHours}:${offsetMins}`;

    // return datetime with ISO 8601 format
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneOffset}`;
  }

/**
  * Calc one month laster (e.g. 2024/01/01 -> 2024/02/01)
  *
  * @return {Date}
  */
  Date.prototype.nextMonth = function() {
    const d = new Date(this);
    d.setMonth(this.getMonth() + 1);
    return d;
  }

/**
  * Calc one year laster (e.g. 2024/01/01 -> 2025/01/01)
  *
  * @return {Date}
  */
  Date.prototype.nextYear = function() {
    const d = new Date(this);
    d.setFullYear(this.getFullYear() + 1);
    return d;
  }


class Event {
  /**
  * Create Event instance.
  *
  * @param {String} id
  * @param {Date} start
  * @param {Date} end
  * @param {String} summary
  * @param {String} calendarId
  * @param {String} calendarName
  * @return {Date}
  */
  constructor(id, start, end, summary, calendarId, calendarName) {
    this.id = id;
    this.start = start;
    this.start = end;
    this.summary = summary;
    this.calendarId = calendarId;
    this.calendarName = calendarName;
  }

  /**
  * Create Event instanse from Google Calendar API Event object.
  *
  * @param {Object} e Google Calendar API Event object
  * @param {String} id Calendar ID
  * @param {String?} summary Calendar summary
  * @return {Event}
  */
  static fromGAPIEvent(e, id, summary) {
    return new Event (
      e.id,
      new Date(e.start.dateTime || e.start.date),
      new Date(e.end.dateTime || e.end.date),
      e.summary,
      id,
      summary || 'Unknown Calendar'
    );
  }

  /**
  * Return true if the event includes the keyword.
  *
  * @param {String} keyword A search keyword.
  * @return {bool}
  */
  includes(keyword) {
    const startStr = `${this.start.getMonth() + 1}/${this.start.getDate()}`;
    return (startStr.includes(keyword) || this.summary.includes(keyword));
  }
}


/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
  * Parse date string and return Date object.
  *
  * @param {String || int} year (e.g., 2024, "2024")
  * @param {String} dateStr (e.g., "1/1", "01/01")
  * @return {Date}
  */
  function parseDateWithYear(year, dateStr) {
    const d = new Date(dateStr);
    d.setFullYear(year);
    return d;
  }

/**
  * Concat date and time strings and return Date object.
  *
  * @param {String} dateStr (e.g., "2024/1/1", "2024/01/01")
  * @param {String} timeStr (e.g., "12:00", "00:00")
  * @return {Date}
  */
  function convertToDateTime(dateStr, timeStr) {
    const d = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

/**
  * Fetch all calendar which the user can access to.
  *
  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
  */
async function fetchCalendars(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.calendarList.list();
  const calendars = res.data.items;
  return calendars;
}

/**
  * Lists events on specified calendars within a given date range.
  *
  * @param {google.calendar_v3.Calendar} client The google API client.
  * @param {Date} startTime The start date of fetching events.
  * @param {Date} endtime The end date of fetching events.
  * @param {Object} calendar The set of calendar ID and summary.
  * @return {Promise<Array[Event]>} List of events.
  */
  async function fetchEventFromCalendar(client, startTime, endTime, calendar) {
    const res = await client.events.list({
      calendarId: calendar.id,
      timeMin: startTime.toLocalISOString(),
      timeMax: endTime.toLocalISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items;
    return events.map(event => Event.fromGAPIEvent(event, calendar.id, calendar.summary));
  }

/**
  * Lists events on specified calendars within a given date range.
  *
  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
  * @param {Array<String>?} calendarIDs IDs of calendars to fetch events. If not specified, fetch events from all calendars.
  * @param {Date} startTime The start date of fetching events.
  * @param {Date} endtime The end date of fetching events.
  * @return {Promise<Array[Event]>} List of events.
  */
  async function fetchEvents(auth, calendarIDs, startTime, endTime) {
    const client = google.calendar({version: 'v3', auth});
    let calendars = await fetchCalendars(auth);
    if (calendarIDs) {
        calendars = calendars.filter((cal) => calendarIds.includes(cal.id))
    }
    calendars = calendars.map((cal) => { return {id: cal.id, summary: cal.summary };});

    let tasks = [];
    for (const calendar of calendars) {
      const task = fetchEventFromCalendar(client, startTime, endTime, calendar);
      tasks.push(task);
    }

    const events = await Promise.all(tasks);
    return events.flat();
  }

// vim風の移動 (j, k) のキーイベントを設定する関数
function setupVimKeysForNavigation(widget, screen, focusbackto) {
    screen.key(['j', 'k', 'h'], (ch, key) => {
        if (screen.focused === widget) {
            if (ch === 'j') {
                if (widget.rows) {
                    widget.rows.down(); // table の場合
                } else if (widget.down) {
                    widget.down(); // list の場合
                }
            } else if (ch === 'k') {
                if (widget.rows) {
                    widget.rows.up(); // table の場合
                } else if (widget.up) {
                    widget.up(); // list の場合
                }
            } else if (ch === 'h') {
                if (focusbackto) {
                    if (widget.rows) {
                        widget.rows.select(0); // table の場合
                    } else if (widget.select) {
                        widget.select(0); // list の場合
                    }
                    focusbackto.focus();
                }
            }
            screen.render();
        }
    });
}

/**
  * Display events
  *
  * @param {Array<Event>} events The list of events.
  */
function displayEventsMarkdown(events){
  events.forEach(event => {
    const startDate = event.start;
    const month = startDate.getMonth() + 1;
    const day = startDate.getDate();
    const formattedEvent = `+ (${month}/${day}) ${event.summary}`;
    console.log(formattedEvent);
  });
}

async function displayEvents(auth, events) {


    const calendar = google.calendar({version: 'v3', auth});
    const calendars = await fetchCalendars(auth);

    const calendarNames = Array.from(
        new Set(calendars.map(calendar=> calendar.summary))
    );

    const calendarIDs = Array.from(
        new Set(calendars.map(calendar=> calendar.id))
    );

    const screen = blessed.screen({
        smartCSR: true,
        title: 'Google Calendar Events',
        fullUnicode: true,
    });


    const table1 = contrib.table({
        keys: true,
        fg: 'white',
        selectedFg: 'white',
        selectedBg: 'blue',
        interactive: true,
        label: 'Upcoming Events',
        top: 0,
        left: 0,
        width: '50%',
        height: '100%',
        border: { type: 'line', fg: 'cyan' },
        columnSpacing: 1,
        columnWidth: [15, 15, 50], // 各カラムの幅
        style: {
            header: {bold: true},
        }
    });

    const table2 = contrib.table({
        keys: true,
        fg: 'white',
        selectedFg: 'white',
        selectedBg: 'blue',
        interactive: true,
        label: 'Events summary',
        top: 0,
        left: '50%',
        width: '50%',
        height: '100%',
        border: { type: 'line', fg: 'cyan' },
        columnSpacing: 1,
        columnWidth: [20, 20, 50],
        style: {
            header: {bold: true},
        }
    });

    const inputBox = blessed.textbox({
        top: 'center',
        left: 'center',
        width: '60%',
        height: 3,
        border: { type: 'line', fg: 'white' },
        label: 'Commandline',
        style: {
            bg: 'black',
            fg: 'white',
        },
        inputOnFocus: true, // フォーカス時に入力を許可
        hidden: true
    });

    // カレンダを選択するlist
    const list = blessed.list({
        //parent: modalBox,
        top: 'center',
        left: 'center',
        width: '50%',
        height: '30%',
        items: calendarNames,
        border: { type: 'line', fg: 'yellow' },
        style: {
            fg: 'white',
            bg: 'black',
            selected: { fg: 'black', bg: 'green' }
        },
        hidden: true,
        mouse: true,
        keys: true,
    });

    const formBox = blessed.box({
        top: 0,
        left: '50%',
        width: '50%',
        height: '100%',
        label: 'Add Event',
        border: { type: 'line', fg: 'cyan' },
        hidden: true,
    });

    const formFields = {
        title: blessed.textbox({
            top: 2,
            left: 2,
            width: '90%-4',
            height: 3,
            label: 'Event Title',
            border: { type: 'line', fg: 'white' },
            inputOnFocus: true,
            mouse: true,
        }),
        date: blessed.textbox({
            top: 6,
            left: 2,
            width: '90%-4',
            height: 3,
            label: 'Date (YYYY-MM-DD)',
            border: { type: 'line', fg: 'white' },
            inputOnFocus: true,
            mouse: true,
        }),
        startTime: blessed.textbox({
            top: 10,
            left: 2,
            width: '90%-4',
            height: 3,
            label: 'Start Time (HH:mm)',
            border: { type: 'line', fg: 'white' },
            inputOnFocus: true,
            mouse: true,
        }),
        endTime: blessed.textbox({
            top: 14,
            left: 2,
            width: '90%-4',
            height: 3,
            label: 'End Time (HH:mm)',
            border: { type: 'line', fg: 'white' },
            inputOnFocus: true,
            mouse: true,
        }),
    };


    Object.values(formFields).forEach((field) => formBox.append(field));


    // イベントを日付ごとにグループ化
    function groupEventsByDate(events) {
        return events.reduce((grouped, event) => {
            const dateKey = event.start.toISOString().split('T')[0]; // YYYY-MM-DD形式の日付
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(event);
            return grouped;
        }, {});
    }


    // イベントデータをフォーマットしてテーブルに渡す
    function formatGroupedEvents(events) {
        const groupedEvents = groupEventsByDate(events);
        const formattedData = [];

        Object.keys(groupedEvents)
            .sort() // 日付順にソート
            .forEach((dateKey) => {
                // セクションヘッダー（例: "2024-11-25"）
                formattedData.push([`[${dateKey}]`, '', '']); // 空のカラムを埋める

                groupedEvents[dateKey].forEach((event) => {
                    const startTime = event.start
                        .toTimeString()
                        .slice(0, 5); // HH:mm形式
                    const endTime = event.end
                        ? event.end.toTimeString().slice(0, 5)
                        : '';
                    const time = endTime ? `${startTime}-${endTime}` : startTime;
                    const summary = event.summary;
                    const calendarName = `[${event.calendarName}]`;

                    formattedData.push(['', time, `${summary} ${calendarName}`]); // 1行のイベント
                });
            });

        return formattedData;
    }

    const formattedEvents = formatGroupedEvents(events);

    table1.setData({
        headers: ['Date', 'Time', 'Event'],
        data: formattedEvents,
    });


    //function updateTable2(index) {
    //
    //    const data = formattedEvents[index];
    //    const details = [
    //        [`Date: ${data[0]}`],
    //        [`Time: ${data[1]}`],
    //        [''],
    //        [`Event: ${data[2]}`],
    //    ];
    //
    //    table2.setData({
    //        headers: ['Details'],
    //        data: details,
    //    });
    //
    //    //table2.select(0);
    //
    //    screen.render();
    //}

    // テーブルをスクリーンに追加
    screen.append(table1);
    //screen.append(table2);

    //screen.append(modalBox);
    screen.append(list);
    screen.append(inputBox);
    screen.append(formBox);

    //updateTable2(0);

    //let ignoreFocusEvent = false;
    //
    //table1.rows.on('focus', () =>{
    //    if (ignoreFocusEvent) return;
    //
    //    ignoreFocusEvent = true;
    //
    //    const selectedIndex = table1.rows.selected;
    //    updateTable2(selectedIndex);
    //
    //    setTimeout(() => {
    //        ignoreFocusEvent = false;
    //    }, 50);
    //
    //});
    //
    //
    //table1.rows.on('select', () => {
    //    const selectedIndex = table1.rows.selected;
    //    updateTable2(selectedIndex);
    //
    //    table2.focus();
    //    screen.render();
    //});

    async function updateTable(auth, table) {
        const timeMin = new Date().toISOString(); // 現在時刻を取得
        const timeMax = getOneMonthLater(timeMin); // 1か月後の時刻を取得

        // イベントリストを再取得
        const events = await fetchEvents(auth, null, timeMin, timeMax);

        // イベントをテーブル形式に変換
        const formattedEvents = formatGroupedEvents(events);

        // テーブルにデータをセット
        table.setData({
            headers: ['Date', 'Time', 'Event'],
            data: formattedEvents,
        });

    // 画面を再描画
        table.screen.render();
    }

    let selectedCommand = null;

    inputBox.on('submit', (value) => {
        const command = (value || '').trim().toLowerCase();


        switch(command) {
            case 'add':
                selectedCommand = 'add';
                list.show();
                list.focus();
                inputBox.hide();
                screen.render();
                break;

            case 'rm':
                selectedCommand = 'rm';
                list.show();
                list.focus();
                inputBox.hide();
                screen.render();
                break;
            case 'exit', 'e':
                process.exit(0);
        }

        inputBox.clearValue();
        screen.render();
    });

    let selectedCalendarId = null;


    list.on('select', (item, index) => {
        list.hide();
        const selectedCalendar = calendarNames[index];
        selectedCalendarId = calendarIDs[index];

        switch(selectedCommand){
            case 'add':
                formBox.setLabel(`Add Event - ${selectedCalendar}`);
                formBox.show();
                screen.render();
                formFields.title.focus();
                break;

            case 'rm':
                // TODO: rm に対応した処理を書く
                formBox.setLabel(`Rm Event - ${selectedCalendar}`);
                formBox.show();
                screen.render();
                break;
        }
    })

    setupVimKeysForNavigation(table1.rows, screen, null);
    setupVimKeysForNavigation(table2.rows, screen, table1);
    setupVimKeysForNavigation(list, screen, null);

    table1.focus();

    screen.key(['space'], () => {
        inputBox.show();
        inputBox.focus();
        screen.render();

    });

    Object.values(formFields).forEach((field, index, fields) => {
        field.on('submit', () => {
            const nextField = fields[(index + 1) % fields.length]; // 次のフィールドを取得（最後の場合は最初に戻る）
            nextField.focus(); // 次のフィールドにフォーカス
            screen.render();   // 画面を更新
        });
    });


    screen.key(['C-s'], () => {
        formBox.hide();
    // 現在の入力内容を取得
    const title = formFields.title.getValue().trim();
    const date = formFields.date.getValue().trim();
    const startTime = formFields.startTime.getValue().trim();
    const endTime = formFields.endTime.getValue().trim();

    // 入力がすべて揃っているか確認
    if (!title || !date || !startTime || !endTime) {
        // 必要な情報が足りない場合はエラーメッセージを表示
        inputBox.setContent('Error: All fields must be filled in.');
        inputBox.show();
        inputBox.focus();
        screen.render();
        return;
    }

    const event = {
        summary: title,
        start: {
            dateTime: convertToDateTime(date, startTime).toISOString(),
        },
        end: {
            dateTime: convertToDateTime(date, endTime).toISOString(),
        },
    };


    calendar.events.insert({
        calendarId: selectedCalendarId,
        resource: event,
    }, async(err, res) => {
        if (err) return console.error('The API returned an error: ' + err);

    await updateTable(auth, table1);

    // 登録後、フォームをクリア
    Object.values(formFields).forEach(field => field.clearValue());
    formFields.title.focus(); // 最初のフィールドにフォーカス

    inputBox.setContent('Event successfully registered!');
    inputBox.show();
    inputBox.focus();
    screen.render();
    setTimeout(() => {
        inputBox.setContent('');
        inputBox.hide();
        screen.render();
    }, 2000); // 2秒後に通知を非表示にする
    });
});


    screen.key(['escape'], () => {
        // カーソルが当たっているウィジェットを取得
    const focusedElement = screen.focused;

    // フォーカスされている要素を閉じる（隠す）
    if (focusedElement && typeof focusedElement.hide === 'function') {
        focusedElement.hide();
        screen.render(); // 画面更新
    }
});

    screen.key(['C-c'], () => process.exit(0));

    screen.render();
}

async function askQuestion(questionConfig) {
    try {
        const answer = await Enquirer.prompt(questionConfig);
        return answer[questionConfig.name];
    } catch (error) {
        console.error('Error during prompt:', error);
        throw error;
    }
}

async function addEvent(auth) {
    const calendar = google.calendar({version: 'v3', auth});
    const calendars = await fetchCalendars(auth);
    const calendarId = await askQuestion({
        type: 'select',
        name: 'calendarId',
        message: 'Select a calendar',
        choices: calendars.map((calendar) => ({
            name: calendar.id,
            message: calendar.summary,
        })),
    });

    const summary = await askQuestion({
        type: 'input',
        name: 'summary',
        message: 'What is the event name?',
        initial: 'New event',
    });

    const date = await askQuestion({
        type: 'input',
        name: 'date',
        message: 'What date the event is?',
        initial: '2024/01/01',
    });

    const start_time = await askQuestion({
        type: 'input',
        name: 'start_time',
        message: 'What time the event starts?',
        initial: '12:00',
    });

    const end_time = await askQuestion({
        type: 'input',
        name: 'end_time',
        message: 'What time the event ends?',
        initial: '13:00',
    });

    const event = {
        summary: summary,
        start: {
            dateTime: convertToDateTime(date, start_time).toISOString(),
        },
        end: {
            dateTime: convertToDateTime(date, end_time).toISOString(),
        },
    };

    calendar.events.insert({
        calendarId: calendarId,
        resource: event,
    }, (err, res) => {
        if (err) return console.error('The API returned an error: ' + err);
        console.log(`Event added: ${summary}`);
    }
    );
}

async function deleteEvent(auth) {
    const calendar = google.calendar({version: 'v3', auth});
    const calendars = await fetchCalendars(auth);
    const calendarId = await askQuestion({
        type: 'select',
        name: 'calendarId',
        message: 'Select a calendar',
        choices: calendars.map((calendar) => ({
            name: calendar.id,
            message: calendar.summary,
        })),
    });

    const startDate = await askQuestion({
        type: 'input',
        name: 'startDate',
        message: 'Enter start date (e.g., 2024/01/01):',
        initial: '2024/01/01',
    });

    const endDate = await askQuestion({
        type: 'input',
        name: 'endDate',
        message: 'Enter end date (e.g., 2024/01/31):',
        initial: '2024/01/31',
    });

    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();

    const events = await fetchEvents(auth, null, start, end);
    if (events.length === 0) {
        console.log('No events found for the given date range.');
        return;
    }

    const filtered_events = events.filter((event) => event.calendarId === calendarId);

    const eventChoice = await askQuestion({
        type: 'select',
        name: 'eventId',
        message: 'Select an event to delete:',
        choices: filtered_events.map((event) => ({
            name: event.calendarId + '|' + event.summary,
            message: `${event.start.toLocaleString()} - ${event.summary}`,
        })),
    });

    const [selectedCalendarId, eventSummary] = eventChoice.split('|');

    const eventToDelete = filtered_events.find(
        (event) => event.summary === eventSummary && event.calendarId === selectedCalendarId
    );

    if (eventToDelete) {
        await calendar.events.delete({
            calendarId: selectedCalendarId,
            eventId: eventToDelete.id, // イベントID
        });
        console.log(`Event "${eventSummary}" has been deleted.`);
    } else {
        console.log('No matching event found.');
    }
}

async function main(args) {
  const today = new Date();
  const auth = await authorize();
  const calendars = calendarIds;

  switch (args[0]){
    case 'list': {
      // Get clendar information
      const calendars = await fetchCalendars(auth);

      // Display calendar information
      console.log('Calendars:');
      calendars.forEach((cal) => {
        console.log(`${cal.summary} (ID: ${cal.id})`);
      });

      break;
    }

    case 'nm': {
      // Calc start (today) and end (one month later)
      const startDate = today;
      const endDate = today.nextMonth();

      // Get events
      let events = await fetchEvents(auth, calendars, startDate, endDate);

      // If the keyword is specified, filter the events
      if (args[1]) {
        events = events.filter((event) => event.includes(args[1]));
      }

      // Sort events by start date, and display them.
      events.sort((a, b) => a.start - b.start);
      displayEventsMarkdown(events);

      break;
    }

    case 'add': {
      addEvent(auth);
      break;
    }

    case 'rm': {
      deleteEvent(auth);
      break;
    }

    case 'md': {
      let startDate;
      let endDate;

      // If date range is specified, get events in the range.
      if (args.length >= 3) {
        const currentYear = new Date().getFullYear();
        startDate = parseDateWithYear(currentYear, args[1]);
        endDate = parseDateWithYear(currentYear, args[2]);
        if (endDate < startDate) {
          endDate = endDate.nextYear();
        }
      }
      // If not, use today's date as the range.
      else {
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(24, 0, 0, 0);
      }

      // Get events
      const events = await fetchEvents(auth, calendars, startDate, endDate)

      // Sort events by start date, and display them.
      events.sort((a, b) => a.start - b.start);
      displayEventsMarkdown(events);

      break;
    }

    default:
      let startDate;
      let endDate;

      // If date range is specified, get events in the range.
      if (args.length >= 2) {
        const currentYear = new Date().getFullYear();
        startDate = parseDateWithYear(currentYear, args[1]);
        endDate = parseDateWithYear(currentYear, args[2]);
        if (endDate < startDate) {
          endDate = endDate.nextYear();
        }
      }
      // If not, use today's date as the range.
      else {
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(24, 0, 0, 0);
      }

      // Get events
      const events = await fetchEvents(auth, null, startDate, endDate)

      // Sort events by start date, and display them.
      events.sort((a, b) => a.start - b.start);
      displayEvents(events);
  }
}

main(process.argv.slice(2))
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error :', e);
    process.exit(1);
  });

