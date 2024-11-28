/**
  * Display events
  *
  * @param {Array<Event>} events The list of events.
  */
  export function displayEventsMarkdown(events){
    events.forEach(event => {
      const startDate = event.start;
      const month = startDate.getMonth() + 1;
      const day = startDate.getDate();
      const formattedEvent = `+ (${month}/${day}) ${event.summary}`;
      console.log(formattedEvent);
    });
  }