export class Calendar {
  /**
   * Create Calendar instance.
   *
   * @param {String} id
   * @param {String} summary
   * @return {Calendar}
   */
  constructor(id, summary, syncToken) {
    this.id = id;
    this.summary = summary;
    this.syncToken = syncToken;
  }
}