import sqlite3 from "sqlite3";
import { Calendar } from "../models/calendar.js";
import { Event } from "../models/event.js";
import { calendar } from "googleapis/build/src/apis/calendar/index.js";

export async function mergeDuplicateEvents() {
  const db = new sqlite3.Database("./db/Gcal.db");

  try {
    const duplicates = await allQuery(db, `
      SELECT id, COUNT(*) as count
      FROM Events
      GROUP BY id
      HAVING count > 1
    `);

    for (const duplicate of duplicates) {
      const { id } = duplicate;

      const events = await allQuery(db, `
        SELECT *
        FROM Events
        WHERE id = ?
      `, [id]);

      const mergedEvent = events.reduce((latest, current) => {
        const latestDate = latest.start ? new Date(latest.start) : new Date(0);
        const currentDate = current.start ? new Date(current.start) : new Date(0);

        return currentDate >= latestDate ? current : latest;
      }, {});

      await runQuery(db, `DELETE FROM Events WHERE id = ?`, [id]);

      await runQuery(db, `
        INSERT INTO Events (id, start, end, summary, calendarId, calendarName)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id,
        mergedEvent.start,
        mergedEvent.end,
        mergedEvent.summary,
        mergedEvent.calendarId,
        mergedEvent.calendarName
      ]);
    }
  } catch (err) {
    console.error("Error merging duplicate events:", err);
    throw err;
  } finally {
    db.close();
  }
}

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

export async function setSyncTokenInDatabase(calendar) {
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

export async function configCalendarListInDatabase(calendarIDs) {
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
export async function deleteEventsFromDatabase(events) {
  const db = new sqlite3.Database("./db/Gcal.db");
  await runQuery(db, "CREATE TABLE IF NOT EXISTS Events (id TEXT PRIMARY KEY, start TEXT, end TEXT, summary TEXT, calendarId TEXT, calendarName TEXT)");
  if (events.length > 0) {
    const deletePromises = events.map(event =>

      runQuery(db, "DELETE FROM Events WHERE id = ?", [event.id]
      )
    );
    await Promise.all(deletePromises);
  }
}

export async function insertCalendarListToDatabase(calendars) {
  const db = new sqlite3.Database("./db/Gcal.db");
  await runQuery(db, "CREATE TABLE IF NOT EXISTS Calendars (id TEXT PRIMARY KEY, summary TEXT, subscription BOOLEAN DEFAULT 1, syncToken TEXT DEFAULT NULL)");
  for (const calendar of calendars) {
    await runQuery(db, "INSERT OR IGNORE INTO Calendars (id, summary, subscription, syncToken) VALUES (?, ?, ?, ?)", [calendar.id, calendar.summary, true, calendar.syncToken]);
  }
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function insertEventsToDatabase(events) {
  const db = new sqlite3.Database("./db/Gcal.db");

  try {
    await runQuery(db, "CREATE TABLE IF NOT EXISTS Events (id TEXT PRIMARY KEY, start TEXT, end TEXT, summary TEXT, calendarId TEXT, calendarName TEXT)");

    if (events.length > 0) {
      for (const event of events) {
        const existing = await allQuery(db, "SELECT id FROM Events WHERE id = ?", [event.id]);

        if (existing.length === 0) {
          await runQuery(
            db,
            "INSERT INTO Events (id, start, end, summary, calendarId, calendarName) VALUES (?, ?, ?, ?, ?, ?)",
            [event.id, event.start.toISOString(), event.end.toISOString(), event.summary, event.calendarId, event.calendarName]
          );
        } else {
          await runQuery(
            db,
            "UPDATE Events SET start = ?, end = ?, summary = ?, calendarId = ?, calendarName = ? WHERE id = ?",
            [event.start.toISOString(), event.end.toISOString(), event.summary, event.calendarId, event.calendarName, event.id]
          );
        }
      }
    }
  } catch (err) {
    console.error("Error inserting events:", err);
    throw err;
  } finally {
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export async function fetchEventsFromDatabase(calendars) {
  const db = new sqlite3.Database("./db/Gcal.db");
  const events = [];
  await runQuery(db, "CREATE TABLE IF NOT EXISTS Events (id TEXT PRIMARY KEY, start TEXT, end TEXT, summary TEXT, calendarId TEXT, calendarName TEXT)");
  await new Promise((resolve, reject) => {
    for (const calendar of calendars) {
      db.each(
        "SELECT * FROM Events WHERE calendarId = ?", [calendar.id],
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
      );
    }
  }
  );
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
  events.sort((a, b) => a.start - b.start);
  return events;
}

export async function fetchCalendarsFromDatabase() {
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
          if (row.subscription) {
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
        resolve();
      }
    });
  });

  return calendars;
}