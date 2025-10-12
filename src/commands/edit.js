import { google } from 'googleapis';
import { updateTable, groupEventsByDate, formatGroupedEventsDescending } from '../ui/layout.js';
import { splitDateTimeIntoDateAndTime, convertToDateTime } from '../utils/dateUtils.js';
import { createAddForm } from '../ui/form.js';
import { updateEventDetailTable } from '../ui/table.js';
import { openExternalEditor } from '../utils/editor.js';
import path from 'path';
import os from 'os';

const ENTER_HANDLER_KEY = Symbol('formBoxEnterHandler');
const SAVE_HANDLER_KEY = Symbol('formBoxSaveHandler');

function buildEditorContent(values, { includeAllDay = false } = {}) {
  const {
    title = '',
    date = '',
    startTime = '',
    endTime = '',
    description = '',
    allDay = false,
  } = values;

  const lines = [
    `Event Title | ${title}`,
    `Date (YYYY-MM-DD) | ${date}`,
    `Start Time (HH:mm) | ${startTime}`,
    `End Time (HH:mm) | ${endTime}`,
  ];

  if (includeAllDay) {
    lines.push(`All Day (y/n) | ${allDay ? 'y' : 'n'}`);
  }

  lines.push(`Description | ${description}`);

  return `${lines.join('\n')}\n`;
}

function parseEditorContent(text, { includeAllDay = false } = {}) {
  const details = {};

  text.split('\n').forEach(line => {
    const parts = line.split('|').map(part => part.trim());
    if (parts.length === 2) {
      const [label, value] = parts;
      details[label] = value;
    }
  });

  const parsed = {
    title: details['Event Title'] || '',
    date: details['Date (YYYY-MM-DD)'] || '',
    startTime: details['Start Time (HH:mm)'] || '',
    endTime: details['End Time (HH:mm)'] || '',
    description: details['Description'] || '',
  };

  if (includeAllDay) {
    parsed.allDay = (details['All Day (y/n)'] || 'n').toLowerCase() === 'y';
  }

  return parsed;
}

function applyDetailsToForm(formFields, details, { includeAllDay = false } = {}) {
  formFields.title.setValue(details.title || '');
  formFields.date.setValue(details.date || '');
  formFields.startTime.setValue(details.startTime || '');
  formFields.endTime.setValue(details.endTime || '');
  formFields.description.setValue(details.description || '');

  if (includeAllDay && formFields.all_day) {
    if (details.allDay) {
      formFields.all_day.check();
    } else {
      formFields.all_day.uncheck();
    }
  }
}

function collectFormValues(formFields, { includeAllDay = false } = {}) {
  const values = {
    title: formFields.title.getValue().trim(),
    date: formFields.date.getValue().trim(),
    startTime: formFields.startTime.getValue().trim(),
    endTime: formFields.endTime.getValue().trim(),
    description: formFields.description.getValue().trim(),
  };

  if (includeAllDay) {
    values.allDay = !!formFields.all_day?.checked;
  } else {
    values.allDay = false;
  }

  return values;
}

function isAllDayEvent(event) {
  return Boolean(event?.start?.date && !event?.start?.dateTime);
}

function eventToFormValues(event) {
  const { date: startDate, time: startTime } = splitDateTimeIntoDateAndTime(event?.start ?? {});
  const { date: endDate, time: endTime } = splitDateTimeIntoDateAndTime(event?.end ?? {});

  return {
    title: event?.summary || '',
    date: startDate || endDate || '',
    startTime: startTime || '',
    endTime: endTime || '',
    description: event?.description || '',
    allDay: isAllDayEvent(event),
  };
}

function buildCalendarEventResource(values) {
  const { title, description, date, startTime, endTime, allDay } = values;

  if (allDay) {
    return {
      summary: title,
      description,
      start: { date },
      end: { date },
    };
  }

  return {
    summary: title,
    description,
    start: {
      dateTime: convertToDateTime(date, startTime).toISOString(),
    },
    end: {
      dateTime: convertToDateTime(date, endTime).toISOString(),
    },
  };
}

function validateFormValues(values) {
  return values.title && values.date && values.startTime && values.endTime;
}

function assignKeyHandler(element, keys, handler, storageKey) {
  const existingHandler = element[storageKey];

  if (existingHandler) {
    if (typeof element.unkey === 'function') {
      element.unkey(keys, existingHandler);
    } else {
      element.removeListener?.('keypress', existingHandler);
    }
  }

  if (typeof element.key === 'function') {
    element.key(keys, handler);
  }

  element[storageKey] = handler;
}

async function openEditorAndParse(screen, tempFilePath, values, options) {
  const content = buildEditorContent(values, options);
  const updatedText = await openExternalEditor(screen, tempFilePath, content);

  if (!updatedText) {
    return null;
  }

  return parseEditorContent(updatedText, options);
}

function setupEditorShortcut({ formBox, formFields, screen, tempFilePath, options }) {
  const handler = async () => {
    const currentValues = collectFormValues(formFields, options);
    const updatedValues = await openEditorAndParse(screen, tempFilePath, currentValues, options);

    if (updatedValues) {
      applyDetailsToForm(formFields, updatedValues, options);
      screen.render();
    }
  };

  assignKeyHandler(formBox, ['enter'], handler, ENTER_HANDLER_KEY);
}

function setupSaveShortcut({ formBox, formFields, handler, options }) {
  const wrappedHandler = async () => {
    const values = collectFormValues(formFields, options);

    try {
      await handler(values);
    } catch (err) {
      console.error('Unexpected error while saving event:', err);
    }
  };

  assignKeyHandler(formBox, ['C-s'], wrappedHandler, SAVE_HANDLER_KEY);
}

export function editEvent(auth, screen, calendars, selectedEvent, events, allEvents) {
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
  const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const eventTable = screen.children.find(child => child.options.label === 'Current Events');
  const editCommandList = screen.children.find(child => child.options.label === 'Edit List');
  const eventDetailTable = screen.children.find(child => child.options.label === 'Event Details');
  const { formBox, formFields } = createAddForm(screen);
  const tempFilePath = path.join(os.tmpdir(), 'blessed-editor.txt');
  const selectedCalendarId = selectedEvent.calendarId;
  const selectedEventsId = selectedEvent.id;
  const { date: startDate, time: startTime } = splitDateTimeIntoDateAndTime(
    selectedEvent.start ?? {}
  );
  const { time: endTime } = splitDateTimeIntoDateAndTime(selectedEvent.end ?? {});
  const calendarNames = Array.from(new Set(calendars.map(calendar => calendar.summary)));
  const calendarIDs = Array.from(new Set(calendars.map(calendar => calendar.id)));

  updateEventDetailTable(eventDetailTable, selectedEvent);
  eventDetailTable.show();

  const showValidationError = () => {
    logTable.log('Error: All fields must be filled in.');
    screen.render();
  };

  const finalizeSuccess = async message => {
    await updateTable(auth, leftTable, calendars, events, allEvents);
    logTable.log(message);
    if (!formBox.destroyed) {
      formBox.destroy();
    }
    screen.render();
    leftTable.focus();
    screen.render();
  };

  async function prepareForm({
    label,
    initialValues,
    includeAllDay = false,
    openEditorImmediately = false,
  }) {
    formBox.setLabel(label);
    applyDetailsToForm(formFields, initialValues, { includeAllDay });
    formBox.show();
    formBox.focus();
    screen.render();

    setupEditorShortcut({
      formBox,
      formFields,
      screen,
      tempFilePath,
      options: { includeAllDay },
    });

    if (openEditorImmediately) {
      const updatedValues = await openEditorAndParse(screen, tempFilePath, initialValues, {
        includeAllDay,
      });

      if (updatedValues) {
        applyDetailsToForm(formFields, updatedValues, { includeAllDay });
        screen.render();
      }
    }
  }

  editCommandList.show();
  screen.render();
  editCommandList.focus();
  editCommandList.once('select', async (item, index) => {
    eventDetailTable.hide();

    const promptCalendarSelection = handler => {
      editCommandList.hide();
      calendarList.show();
      calendarList.focus();
      screen.render();

      calendarList.once('select', async (calendarItem, calendarIndex) => {
        const selectedEditCalendar = calendarNames[calendarIndex];
        const selectedEditCalendarId = calendarIDs[calendarIndex];

        calendarList.hide();
        screen.render();

        if (!selectedEditCalendar || !selectedEditCalendarId) {
          logTable.log('Error: Invalid calendar selection.');
          screen.render();
          editCommandList.show();
          editCommandList.focus();
          screen.render();
          return;
        }

        await handler(selectedEditCalendar, selectedEditCalendarId);
      });
    };

    switch (index) {
      case 0:
        promptCalendarSelection(async (selectedEditCalendar, selectedEditCalendarId) => {
          const baseValues = eventToFormValues(selectedEvent);
          const initialValues = {
            ...baseValues,
            title: '',
            description: '',
            allDay: false,
          };

          await prepareForm({
            label: `Edit Event - ${selectedEditCalendar}  (Ctrl+S to save)`,
            initialValues,
            includeAllDay: true,
            openEditorImmediately: true,
          });

          setupSaveShortcut({
            formBox,
            formFields,
            options: { includeAllDay: true },
            handler: async values => {
              if (!validateFormValues(values)) {
                showValidationError();
                return;
              }

              const eventResource = buildCalendarEventResource(values);

              calendar.events.insert(
                {
                  calendarId: selectedEditCalendarId,
                  resource: eventResource,
                },
                async err => {
                  if (err) {
                    console.error('The API returned an error: ' + err);
                    logTable.log('Error: Failed to register event.');
                    screen.render();
                    return;
                  }

                  await finalizeSuccess('Event successfully registered!');
                }
              );
            },
          });
        });
        break;

      case 1:
        promptCalendarSelection(async (selectedEditCalendar, selectedEditCalendarId) => {
          const initialValues = eventToFormValues(selectedEvent);

          await prepareForm({
            label: `Edit Event - ${selectedEditCalendar}`,
            initialValues,
            openEditorImmediately: true,
          });

          setupSaveShortcut({
            formBox,
            formFields,
            options: {},
            handler: async values => {
              if (!validateFormValues(values)) {
                showValidationError();
                return;
              }

              const eventResource = buildCalendarEventResource(values);

              calendar.events.delete(
                {
                  calendarId: selectedCalendarId,
                  eventId: selectedEventsId,
                },
                err => {
                  if (err) {
                    console.error('The API returned an error: ' + err);
                    logTable.log('Error: Failed to delete original event.');
                    screen.render();
                    return;
                  }

                  calendar.events.insert(
                    {
                      calendarId: selectedEditCalendarId,
                      resource: eventResource,
                    },
                    async insertErr => {
                      if (insertErr) {
                        console.error('The API returned an error: ' + insertErr);
                        logTable.log('Error: Failed to move event.');
                        screen.render();
                        return;
                      }

                      await finalizeSuccess('Event successfully moved!');
                    }
                  );
                }
              );
            },
          });
        });
        break;

      case 2:
        promptCalendarSelection(async (selectedEditCalendar, selectedEditCalendarId) => {
          const initialValues = eventToFormValues(selectedEvent);

          await prepareForm({
            label: `Edit Event - ${selectedEditCalendar}`,
            initialValues,
            openEditorImmediately: true,
          });

          setupSaveShortcut({
            formBox,
            formFields,
            options: {},
            handler: async values => {
              if (!validateFormValues(values)) {
                showValidationError();
                return;
              }

              const eventResource = buildCalendarEventResource(values);

              calendar.events.insert(
                {
                  calendarId: selectedEditCalendarId,
                  resource: eventResource,
                },
                async err => {
                  if (err) {
                    console.error('The API returned an error: ' + err);
                    logTable.log('Error: Failed to register event.');
                    screen.render();
                    return;
                  }

                  await finalizeSuccess('Event successfully registered!');
                }
              );
            },
          });
        });
        break;

      case 3:
        editCommandList.hide();
        calendar.events.delete(
          {
            calendarId: selectedCalendarId,
            eventId: selectedEventsId,
          },
          async err => {
            if (err) {
              console.error('The API returned an error: ' + err);
              logTable.log('Error: Failed to delete event.');
              screen.render();
              return;
            }

            await finalizeSuccess('Event successfully deleted!');
          }
        );
        break;

      case 4: {
        screen.append(eventTable);
        eventTable.show();
        editCommandList.hide();

        const currentEvents = formatGroupedEventsDescending(events);
        eventTable.setItems(currentEvents);

        eventTable.focus();
        screen.render();

        const now = new Date();
        now.setHours(23, 59, 59, 99);
        const groupedEvents = groupEventsByDate(events);

        const filteredGroupedEvents = Object.entries(groupedEvents)
          .filter(([_, eventList]) => {
            return eventList.some(event => new Date(event.start) <= now);
          })
          .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));

        const descSortedEvents = filteredGroupedEvents.flatMap(([, list]) => list.flat());

        eventTable.once('select', async (tableItem, eventIndex) => {
          eventTable.hide();
          const originEvent = descSortedEvents[eventIndex];

          if (!originEvent) {
            logTable.log('Error: Selected event could not be found.');
            screen.render();
            return;
          }

          const selectedEditCalendar = originEvent.calendarName;
          const selectedEditCalendarId = originEvent.calendarId;
          const initialValues = eventToFormValues(originEvent);

          await prepareForm({
            label: `Edit Event - ${selectedEditCalendar}`,
            initialValues,
            openEditorImmediately: true,
          });

          setupSaveShortcut({
            formBox,
            formFields,
            options: {},
            handler: async values => {
              if (!validateFormValues(values)) {
                showValidationError();
                return;
              }

              const eventResource = buildCalendarEventResource(values);

              calendar.events.insert(
                {
                  calendarId: selectedEditCalendarId,
                  resource: eventResource,
                },
                async err => {
                  if (err) {
                    console.error('The API returned an error: ' + err);
                    logTable.log('Error: Failed to register event.');
                    screen.render();
                    return;
                  }

                  await finalizeSuccess('Event successfully registered!');
                }
              );
            },
          });
        });
        break;
      }

      default:
        break;
    }
  });

  editCommandList.key(['escape'], () => {
    editCommandList.hide();
    eventDetailTable.hide();
    leftTable.focus();
    screen.render();
  });
}
