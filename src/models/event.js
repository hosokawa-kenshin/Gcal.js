export class Event {
  /**
  * Create Event instance.
  *
  * @param {String} id
  * @param {Date} start
  * @param {Date} end
  * @param {String} summary
  * @param {String} description
  * @param {String} calendarId
  * @param {String} calendarName
  * @return {Date}
  */
  constructor(id, start, end, summary, description, calendarId, calendarName) {
    this.id = id;
    this.start = start;
    this.end = end;
    this.summary = summary;
    this.description = description;
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
    return new Event(
      e.id,
      new Date(e.start.dateTime || e.start.date),
      new Date(e.end.dateTime || e.end.date),
      e.summary,
      e.description || '',
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

export default Event;