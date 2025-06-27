import { google } from 'googleapis';
import { updateTable } from '../ui/layout.js';
import { convertToDateTime } from '../utils/dateUtils.js';
import { createAddForm } from '../ui/form.js';
import { GeminiNLPService } from '../services/geminiService.js';
import blessed from 'blessed';

export async function addEventNL(auth, screen, calendars, events, allEvents) {
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarList = screen.children.find(child => child.options.label === 'Calendar List');
    const inputBox = screen.children.find(child => child.options.label === 'Commandline');
    const leftTable = screen.children.find(child => child.options.label === 'Upcoming Events');
    const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');

    const geminiService = new GeminiNLPService();

    let selectedCalendarId = null;
    let selectedCalendarName = null;

    const calendarNames = Array.from(
        new Set(calendars.map(calendar => calendar.summary))
    );
    const calendarIDs = Array.from(
        new Set(calendars.map(calendar => calendar.id))
    );

    calendarList.show();
    screen.render();
    calendarList.focus();

    calendarList.once('select', async (item, index) => {
        calendarList.hide();
        selectedCalendarName = calendarNames[index];
        selectedCalendarId = calendarIDs[index];

        const nlInputBox = createNaturalLanguageInputBox(screen, selectedCalendarName);
        nlInputBox.show();
        nlInputBox.focus();
        screen.render();

        nlInputBox.key(['enter'], async () => {
            const userInput = nlInputBox.getValue().trim();

            if (!userInput) {
                logTable.log('自然言語での予定内容を入力してください。');
                screen.render();
                return;
            }

            nlInputBox.hide();
            screen.render();

            const loadingBox = createLoadingBox(screen);
            loadingBox.show();
            screen.render();

            try {
                const currentDate = new Date();
                const parsedEvent = await geminiService.parseNaturalLanguageEvent(userInput, currentDate);

                loadingBox.hide();
                screen.render();

                const { formBox, formFields } = createAddForm(screen);
                formBox.setLabel(`Add Event - ${selectedCalendarName}  (Ctrl+S to save) - 信頼度: ${Math.round(parsedEvent.confidence * 100)}%`);

                formFields.title.setValue(parsedEvent.title);
                formFields.date.setValue(parsedEvent.date);
                formFields.startTime.setValue(parsedEvent.startTime);
                formFields.endTime.setValue(parsedEvent.endTime);
                formFields.description.setValue(parsedEvent.description);

                if (parsedEvent.allDay) {
                    formFields.all_day.check();
                } else {
                    formFields.all_day.uncheck();
                }

                logTable.log(`解析結果: ${parsedEvent.interpretation}`);

                formBox.show();
                formBox.focus();
                screen.render();

                formBox.key(['C-s'], () => {
                    const title = formFields.title.getValue().trim();
                    const date = formFields.date.getValue().trim();
                    const startTime = formFields.startTime.getValue().trim();
                    const endTime = formFields.endTime.getValue().trim();
                    const description = formFields.description.getValue().trim();
                    const allDay = formFields.all_day.checked;

                    if (!title || !date || !startTime || !endTime) {
                        logTable.log('Error: All fields must be filled in.');
                        screen.render();
                        return;
                    }

                    formBox.hide();

                    let event;
                    if (allDay) {
                        event = {
                            summary: title,
                            description: description,
                            start: {
                                date: date,
                            },
                            end: {
                                date: date,
                            }
                        };
                    } else {
                        event = {
                            summary: title,
                            description: description,
                            start: {
                                dateTime: convertToDateTime(date, startTime).toISOString(),
                            },
                            end: {
                                dateTime: convertToDateTime(date, endTime).toISOString(),
                            },
                        };
                    }

                    calendar.events.insert({
                        calendarId: selectedCalendarId,
                        resource: event,
                    }, async (err, res) => {
                        if (err) {
                            logTable.log('The API returned an error: ' + err);
                            screen.render();
                            return;
                        }
                        await updateTable(auth, leftTable, calendars, events, allEvents);
                        logTable.log('Event successfully registered!');
                        formBox.destroy();
                        screen.render();
                        leftTable.focus();
                        screen.render();
                    });
                });

            } catch (error) {
                loadingBox.hide();
                logTable.log(`自然言語解析エラー: ${error.message}`);
                logTable.log('手動でイベントを追加するか、入力内容を見直してください。');
                leftTable.focus();
                screen.render();
            }

            nlInputBox.destroy();
            screen.render();
        });

        nlInputBox.key(['escape'], () => {
            nlInputBox.hide();
            nlInputBox.destroy();
            leftTable.focus();
            screen.render();
        });
    });
}

function createNaturalLanguageInputBox(screen, calendarName) {
    const inputBox = blessed.textbox({
        top: 'center',
        left: 'center',
        width: '80%',
        height: 3,
        label: `自然言語で予定を入力 - ${calendarName} (Enter to analyze, Esc to cancel)`,
        border: { type: 'line', fg: 'green' },
        inputOnFocus: true,
        mouse: true,
        keys: true,
    });

    screen.append(inputBox);
    return inputBox;
}

function createLoadingBox(screen) {
    const loadingBox = blessed.box({
        top: 'center',
        left: 'center',
        width: '50%',
        height: 5,
        label: 'Processing',
        border: { type: 'line', fg: 'yellow' },
        content: '🤖 Gemini APIで解析中...',
        tags: true,
    });

    screen.append(loadingBox);
    return loadingBox;
}
