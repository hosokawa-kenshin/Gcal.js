import Event from '../models/event.js';
import fs from 'fs/promises';
import fs2 from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { insertCalendarListToDatabase, fetchCalendarsFromDatabase, setSyncTokenInDatabase, ensureSyncTokenColumn, ensureDescriptionColumn, deleteEventsFromDatabase, insertEventsToDatabase, fetchEventsFromDatabase } from './databaseService.js';
import { convertToDateTime } from '../utils/dateUtils.js';

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
  const calendar = google.calendar({ version: 'v3', auth });
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
export async function fetchEventFromCalendar(client, calendar) {
  const params = {
    calendarId: calendar.id,
    singleEvents: true,
    maxResults: 2500,
  };
  if (calendar.syncToken !== null) {
    params.syncToken = calendar.syncToken;
  }
  try {
    const res = await client.events.list(params);
    const events = res.data.items;
    if (res.data.nextSyncToken) {
      calendar.syncToken = res.data.nextSyncToken;
      await setSyncTokenInDatabase(calendar);
      const deletedEvents = res.data.items.filter(event => event.status === 'cancelled');
      await deleteEventsFromDatabase(deletedEvents);
      const validEvents = events.filter(event => event.status === 'confirmed');
      return validEvents.map(event => Event.fromGAPIEvent(event, calendar.id, calendar.summary));
    }
    await setSyncTokenInDatabase(calendar);
    return events.map(event => Event.fromGAPIEvent(event, calendar.id, calendar.summary));
  } catch (err) {
    if (err.code === 410) {
      const allRequestParams = {
        calendarId: calendar.id,
        singleEvents: true,
        maxResults: 2500,
      };
      const allRes = await client.events.list(allRequestParams);
      await setSyncTokenInDatabase(calendar);
      const allEvents = allRes.data.items;
      return allEvents.map(event => Event.fromGAPIEvent(event, calendar.id, calendar.summary));
    }
  }
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
export async function fetchEvents(auth, calendars) {
  const client = google.calendar({ version: 'v3', auth });
  let tasks = [];
  for (const calendar of calendars) {
    const task = fetchEventFromCalendar(client, calendar);
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
    calendars = await fetchCalendars(auth);
    await insertCalendarListToDatabase(calendars);
    calendars = await fetchCalendarsFromDatabase();
  } else {
    ensureDescriptionColumn();
    calendars = await fetchCalendarsFromDatabase();
  }
  return calendars;
}

export async function initializeEvents(auth, calendars) {
  console.log("Fetching events...");
  const rawEvents = await fetchEvents(auth, calendars);
  await insertEventsToDatabase(rawEvents);
  const events = await fetchEventsFromDatabase(calendars);
  return events;
}

export async function fetchSelectedEventsFromDatabase(calendars, startDate, endDate) {
  const events = await fetchEventsFromDatabase(calendars);
  const selectedEvents = events.filter(event => event.start >= convertToDateTime(startDate) && event.end <= convertToDateTime(endDate));
  return selectedEvents;
}