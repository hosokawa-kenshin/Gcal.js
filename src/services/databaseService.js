import sqlite3 from "sqlite3";
import { Calendar } from "../models/calendar.js";
import { Event } from "../models/event.js";

export async function ensureSyncTokenColumn() {
  const db = new sqlite3.Database("./db/Gcal.db");
  const result = await allQuery(db, "PRAGMA table_info(Calendars)");
  const columns = result.map(row => row.name);
  if (!columns.includes('syncToken')) {
    await runQuery(db, "ALTER TABLE Calendars ADD COLUMN syncToken TEXT");
  }
}

function allQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

export async function setSyncTokenInDatabase(calendar){
  const db = new sqlite3.Database("./db/Gcal.db");
  await runQuery(db, "UPDATE Calendars SET syncToken = ? WHERE id = ?", [calendar.syncToken, calendar.id]);
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
        reject(err);
      } else {
        // console.log("Database connection closed.");
        resolve();
      }
    });
  });
}

export async function configCalendarListInDatabase(calendarIDs){
  const db = new sqlite3.Database("./db/Gcal.db");

  for (const id of calendarIDs) {
    await runQuery(db, "UPDATE Calendars SET subscription = 1 WHERE id = ?", [id]);
  }
  const placeholders = calendarIDs.map(() => '?').join(',');
  await runQuery(db, `UPDATE Calendars SET subscription = 0 WHERE id NOT IN (${placeholders})`, calendarIDs);

  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
        reject(err);
      } else {
        // console.log("Database connection closed.");
        resolve();
      }
    });
  });
}
export async function deleteEventsFromDatabase(events){
  const db = new sqlite3.Database("./db/Gcal.db");
  await runQuery(db, "CREATE TABLE IF NOT EXISTS Events (id TEXT, start TEXT, end TEXT, summary TEXT, calendarId TEXT, calendarName TEXT)");
  if (events.length > 0) {
    events.forEach(async event => {
      await runQuery(db, "DELETE FROM Events WHERE id = ?", [event.id]);
    });
  }
}

export async function insertCalendarListToDatabase(calendars){
  const db = new sqlite3.Database("./db/Gcal.db");
  await runQuery(db, "CREATE TABLE IF NOT EXISTS Calendars (id TEXT, summary TEXT, subscription BOOLEAN DEFAULT 1, syncToken TEXT)");
  for (const calendar of calendars) {
    await runQuery(db, "INSERT INTO Calendars (id, summary, subscription, syncToken) VALUES (?, ?, ?, ?)", [calendar.id, calendar.summary, true, calendar.syncToken]);
  }

  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database connection closed.");
    }
  });
}

export async function insertEventsToDatabase(events){
  const db = new sqlite3.Database("./db/Gcal.db");
  await runQuery(db, "CREATE TABLE IF NOT EXISTS Events (id TEXT, start TEXT, end TEXT, summary TEXT, calendarId TEXT, calendarName TEXT)");
  if (events.length > 0){
    events.forEach(async event => {
      await runQuery(db, "INSERT INTO Events (id, start, end, summary, calendarId, calendarName) VALUES (?, ?, ?, ?, ?, ?)", [event.id, event.start.toISOString(), event.end.toISOString(), event.summary, event.calendarId, event.calendarName]);
    });
  }
  db.close();
}

export async function fetchEventsFromDatabase(calendars){
  const db = new sqlite3.Database("./db/Gcal.db");
  const events = [];
  await runQuery(db, "CREATE TABLE IF NOT EXISTS Events (id TEXT, start TEXT, end TEXT, summary TEXT, calendarId TEXT, calendarName TEXT)");
  await new Promise((resolve, reject) => {
    for (const calendar of calendars) {
      db.each(
        "SELECT * FROM Events WHERE calendarId = ?",[calendar.id],
        (err, row) => {
          if (err) {
            console.error("Error fetching data:", err.message);
            reject(err);
          } else {
            const start = new Date(row.start);
            const end = new Date(row.end);
            events.push(new Event(row.id, start, end, row.summary, row.calendarId, row.calendarName));
          }
        },
        (err, rowCount) => {
          if (err) {
            console.error("Error completing iteration:", err.message);
            reject(err);
          } else {
            resolve();
          }
        }
      );}
    }
  );
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
        reject(err);
      } else {
        console.log("Database connection closed.");
        resolve();
      }
    });
  });
  events.sort((a, b) => a.start - b.start);
  return events;
}

export async function fetchCalendarsFromDatabase(){
  const db = new sqlite3.Database("./db/Gcal.db");

  const calendars = [];
  await new Promise((resolve, reject) => {
    db.each(
      "SELECT * FROM Calendars",
      (err, row) => {
        if (err) {
          console.error("Error fetching data:", err.message);
          reject(err);
        } else {
          if (row.subscription){
            calendars.push(new Calendar(row.id, row.summary, row.syncToken));
            // console.log("Fetched from the database:", row.summary);
          }
        }
      },
      (err, rowCount) => {
        if (err) {
          console.error("Error completing iteration:", err.message);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });

  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
        reject(err);
      } else {
        console.log("Database connection closed.");
        resolve();
      }
    });
  });

  return calendars;
}