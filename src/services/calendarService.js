import Event from '../models/event.js';
import fs from 'fs/promises';
import fs2 from 'fs';
import path from 'path';
import {authenticate} from '@google-cloud/local-auth';
import {google} from 'googleapis';
import {insertCalendarListToDatabase, fetchCalendarsFromDatabase} from './databaseService.js';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
export async function loadSavedCredentialsIfExist() {
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
export async function saveCredentials(client) {
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
export async function authorize() {
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
  * Fetch all calendar which the user can access to.
  *
  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
  */
export async function fetchCalendars(auth) {
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
  export async function fetchEventFromCalendar(client, startTime, endTime, calendar) {
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
  export async function fetchEvents(auth, calendars, startTime, endTime) {
    const client = google.calendar({version: 'v3', auth});
    let tasks = [];
    for (const calendar of calendars) {
      const task = fetchEventFromCalendar(client, startTime, endTime, calendar);
      tasks.push(task);
    }

    const events = await Promise.all(tasks);
    return events.flat();
  }

  export async function initializeCalendars(auth) {
    const dbPath = "./db/Gcal.db";
    var calendars = [];
    if (!fs2.existsSync(dbPath)) {
      console.log("Database file does not exist. Creating a new database...");
      calendars = await fetchCalendars(auth).then(calendars => {
        insertCalendarListToDatabase(calendars);
        return calendars;
      });
    }else{
      calendars = await fetchCalendarsFromDatabase();
    }
    return calendars;
  }
