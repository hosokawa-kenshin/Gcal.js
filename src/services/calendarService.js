import Event from '../models/event.js';
import fs from 'fs/promises';
import fs2 from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { insertCalendarListToDatabase, fetchCalendarsFromDatabase, setSyncTokenInDatabase, ensureSyncTokenColumn, deleteEventsFromDatabase, insertEventsToDatabase, fetchEventsFromDatabase } from './databaseService.js';
import { convertToDateTime } from '../utils/dateUtils.js';
import readlineSync from 'readline-sync';

import { randomBytes, createHash } from 'crypto';

function generatePKCE() {
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export async function getAuthorizationCode() {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const params = {
    response_type: 'code',
    client_id: '205893349487-380afqp4sq85lknqalqcq5bmkqd5odk0.apps.googleusercontent.com',
    redirect_uri: 'http://localhost',
    scope: 'https://www.googleapis.com/auth/calendar',
    state: 'state',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };
  authorizationUrl.search = new URLSearchParams(params).toString();

  console.log('以下のURLにアクセスして認証してください:');
  console.log(authorizationUrl.toString());

  const code = readlineSync.question('認証コードを入力してください: ');

  return { code, codeVerifier };
}

export async function getToken(code, codeVerifier) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    code,
    client_id: '205893349487-380afqp4sq85lknqalqcq5bmkqd5odk0.apps.googleusercontent.com', // クライアントID
    redirect_uri: 'http://localhost',
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
  });

  try {
    const response = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    console.log('トークン取得成功:', response);
    // console.log('アクセストークン:', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error('トークン取得に失敗:', error.response);
  }
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
    ensureSyncTokenColumn();
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