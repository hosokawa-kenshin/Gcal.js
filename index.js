const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const calendarIds = require('./calendarIds');
const Enquirer = require('enquirer');
const { prompt } = require('enquirer');
const {type} = require('os');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

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

function parseDateString(dateStr, year) {
  const [month, day] = dateStr.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function convertToDateTime(dateString, timeString) {
  const [year, month, day] = dateString.split('/').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  now.setFullYear(year, month - 1, day);
  now.setHours(hours, minutes, 0, 0);
  return now;
}

function toLocalISOString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月は0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // タイムゾーンオフセット
  const offsetMinutes = date.getTimezoneOffset(); // 分単位のオフセット
  const offsetSign = offsetMinutes <= 0 ? "+" : "-";
  const offsetHours = String(Math.abs(offsetMinutes) / 60 | 0).padStart(2, "0");
  const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
  const timezoneOffset = `${offsetSign}${offsetHours}:${offsetMins}`;

  // ISO 8601 形式の文字列を返す
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneOffset}`;
}

function getOneMonthLater(startDate) {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

  /**
   * Lists events on specified calendars within a given date range.
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   * @param {string} timeMin The start date in ISO format.
   * @param {string} timeMax The end date in ISO format.
   */
async function listEvents(auth, timeMin, timeMax) {
    const calendar = google.calendar({version: 'v3', auth});
    let listEvents = [];

    for (const calendarId of calendarIds) {
      const res = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = res.data.items;
      if (events && events.length > 0) {
        listEvents = listEvents.concat(events.map(event => ({
          id: event.id,
          start: new Date(event.start.dateTime || event.start.date),
          summary: event.summary,
          calendarId: calendarId
        })));
      }
    }

    listEvents.sort((a, b) => a.start - b.start);

    console.log('Sorted events:');
  return listEvents;
}

 /**
  * listEvents() retrieves events from the calendar written in calendarIds.js, whereas the allEvents() retrieves events fromall calendars associated with the auth 
  * @param {*} auth 
  * @param {*} timeMin 
  * @param {*} timeMAX 
  */
async function allEvents(auth, timeMin, timeMax) {
  const calendar = google.calendar({ version: 'v3', auth });

  let allEventsList = []; 

  const calendars = await listCalendars(auth);
  const calendarIDs = calendars.map(calendar => calendar.id);

  for (const calendarId of calendarIDs) {
    try {
      const res =  await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = res.data.items || [];
      if (events.length > 0) {
        // イベント情報を統一フォーマットで追加
        allEventsList = allEventsList.concat(
          events.map(event => ({
            id: event.id,
            start: new Date(event.start.dateTime || event.start.date),
            summary: event.summary,
            calendarId: calendarId,
          }))
        );
      }
    } catch (error) {
      console.error(`Error fetching events for calendar ${calendarId}:`, error.message);
    }
  }

  // 開始時間でソート
  allEventsList.sort((a, b) => a.start - b.start);

  return allEventsList;
}

async function displayEvents(events){
  events.forEach(event => {
    const startDate = event.start;
    const month = startDate.getMonth() + 1;
    const day = startDate.getDate();
    const formattedEvent = `+ (${month}/${day}) ${event.summary}`;
    console.log(formattedEvent);
  });
}

async function displaySortedEvents(auth, timeMin, timeMax) {
  const events = await listEvents(auth, timeMin, timeMax); // イベントの取得を待つ
  const keywordEvents = await searchKeywordEvents(events, args[1]); // キーワード検索を待つ

  displayEvents(keywordEvents); // 検索結果を表示
}

async function listCalendars(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.calendarList.list();
  const calendars = res.data.items;
  if (!calendars || calendars.length === 0) {
    console.log('No calendars found.');
    return;
  }
  return calendars;
}

async function searchKeywordEvents(events, keyword) {
  let keywordEvents = [];

  events.forEach(event => {
    const eventStartDate = new Date(event.start);
    const formattedStartDate = `${eventStartDate.getMonth() + 1}/${eventStartDate.getDate()}`;

    // キーワードが一致するかチェック
    if (formattedStartDate.includes(keyword) || event.summary.includes(keyword)) {
      keywordEvents.push(event);
    }
  });

  return keywordEvents;
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
  const calendars = await listCalendars(auth);
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
  const calendars = await listCalendars(auth);
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

  const events = await allEvents(auth, start, end);
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

const args = process.argv.slice(2);
const today = new Date();
const today_start = new Date(today);
const end_event_time = new Date(today);
const during = 1;
end_event_time.setHours(end_event_time.getHours() + during);
const today_end = new Date(today);
today_start.setHours(0, 0, 0, 0);
today_end.setHours(24, 0, 0, 0);
let startDate;
let endDate;

switch (args[0]){
  case 'list':
    authorize().then((auth) => {
      console.log('Calendars:');
      listCalendars(auth).then((calendars) => {
        calendars.map((cal) => {
          console.log(`${cal.summary} (ID: ${cal.id})`);
        });
      });
    }).catch(console.error);
    break;
  case 'nm':
    authorize().then((auth) => {
      startDate = toLocalISOString(today_start);
      endDate = getOneMonthLater(startDate);
      if (!args[1]) {
        listEvents(auth, startDate, endDate).then((events) => {
          displayEvents(events);
        });
      } else {
      displaySortedEvents(auth, startDate, endDate);
      }
    }).catch(console.error);
    break;
  case 'add':
    authorize().then((auth) => {
      addEvent(auth);
    }).catch(console.error);
    break;

  case 'rm':
    authorize().then((auth) => {
        deleteEvent(auth);
    }).catch(console.error);
    break;

  default:
    const currentYear = new Date().getFullYear();
    if (args.length === 2) {
      startDate = parseDateString(args[0], currentYear);
      endDate = parseDateString(args[1], currentYear);
      if (endDate < startDate) {
        endDate = parseDateString(args[1], currentYear + 1);
      }
    }

    authorize().then((auth) => {

      if (args.length === 0) {
        startDate = toLocalISOString();
        endDate = toLocalISOString(today_end);
      }

      listEvents(auth, startDate, endDate).then((events) => {
        displayEvents(events);
      });

    }).catch(console.error);
    break;
}
