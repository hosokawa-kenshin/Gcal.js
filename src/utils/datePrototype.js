/**
  * Parse date string and return Date object.
  * Date().toISOString() returns date string with local TZ.
  *
  * @return {String} ISO 8601 format date string (e.g., "2024-01-01T00:00:00+09:00")
  */
  Date.prototype.toLocalISOString = function() {
    const year = this.getFullYear();
    const month = String(this.getMonth() + 1).padStart(2, "0");
    const day = String(this.getDate()).padStart(2, "0");
    const hours = String(this.getHours()).padStart(2, "0");
    const minutes = String(this.getMinutes()).padStart(2, "0");
    const seconds = String(this.getSeconds()).padStart(2, "0");

    // Timezone offset
    const offsetMinutes = this.getTimezoneOffset();
    const offsetSign = offsetMinutes <= 0 ? "+" : "-";
    const offsetHours = String(Math.abs(offsetMinutes) / 60 | 0).padStart(2, "0");
    const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
    const timezoneOffset = `${offsetSign}${offsetHours}:${offsetMins}`;

    // return datetime with ISO 8601 format
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneOffset}`;
  }

/**
  * Calc one month laster (e.g. 2024/01/01 -> 2024/02/01)
  *
  * @return {Date}
  */
  Date.prototype.nextMonth = function() {
    const d = new Date(this);
    d.setMonth(this.getMonth() + 1);
    return d;
  }

/**
  * Calc one year laster (e.g. 2024/01/01 -> 2025/01/01)
  *
  * @return {Date}
  */
  Date.prototype.nextYear = function() {
    const d = new Date(this);
    d.setFullYear(this.getFullYear() + 1);
    return d;
  }