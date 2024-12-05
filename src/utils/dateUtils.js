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
    const d = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    d.setHours(hours, minutes, 0, 0);
    return d;
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
