import sqlite3 from "sqlite3";
import { Calendar } from "../models/calendar.js";

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

export async function insertCalendarListToDatabase(calendars){
  const db = new sqlite3.Database("./db/Gcal.db");
  await runQuery(db, "CREATE TABLE IF NOT EXISTS Calendars (id TEXT, summary TEXT, subscription BOOLEAN DEFAULT 1)");
  for (const calendar of calendars) {
    await runQuery(db, "INSERT INTO Calendars (id, summary, subscription) VALUES (?, ?, ?)", [calendar.id, calendar.summary, true]);
  }

  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database connection closed.");
    }
  });
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
            calendars.push(new Calendar(row.id, row.summary));
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