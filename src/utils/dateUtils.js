/**
  * Parse date string and return Date object.
  *
  * @param {String || int} year (e.g., 2024, "2024")
  * @param {String} dateStr (e.g., "1/1", "01/01")
  * @return {Date}
  */
  export function parseDateWithYear(year, dateStr) {
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
  export function convertToDateTime(dateStr, timeStr) {
    if (dateStr.includes('-')) {
      dateStr = dateStr.replace(/-/g, '/');
    }
    const d = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      d.setHours(hours, minutes, 0, 0);
      return d;
    }else{
      d.setHours(0, 0, 0, 0);
      return d;
    }

  }

/**
 * Split an ISO 8601 dateTime string into date and time components.
 *
 * @param {string} dateTime - The ISO 8601 dateTime string (e.g., "2024-12-06T14:30:00Z").
 * @returns {object} - An object containing the date and time components: { date: "YYYY-MM-DD", time: "HH:MM" }.
 */
  export function splitDateTimeIntoDateAndTime(dateTime) {
    const dateObj = new Date(dateTime);
    const localISOString = dateObj.toLocalISOString();
    const date = localISOString.split("T")[0];
    const time = localISOString.split("T")[1].slice(0, 5);
    return { date, time };
  }

/**
 * Return the day of the week.
 *  * @param {int} year
 *  * @param {int} month
 *   * @param {int} day
 *   * @return {String} (e.g., "Sunday", "Monday")
 *
 */
  export function getDayOfWeek(year, month, day) {
    const date = new Date(year, month - 1, day);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOfWeek[date.getDay()];
  }

/**
 * Check if two Date objects represent the same date (ignoring time).
 *
 * @param {Date} date1 - The first date.
 * @param {Date} date2 - The second date.
 * @returns {boolean} - True if the dates are the same, false otherwise.
 */
export function isSameDate(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
