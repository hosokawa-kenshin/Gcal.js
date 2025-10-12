import "../src/utils/datePrototype.js";
import { createLayout, removeCommandPopup } from "./ui/layout.js";
import { handleInput } from "./ui/inputHandler.js";
import {
  authorize,
  initializeCalendars,
  initializeEvents,
} from "./services/calendarService.js";
import { editEvent } from "./commands/edit.js";
import { addEvent } from "./commands/add.js";
import { jumpCommand } from "./commands/jump.js";
import { hasUpdates, isForkedRepository } from "./commands/update.js";
import { loadSetting } from "./services/settingService.js";
import { setupKeyBindings } from "./ui/keyConfig.js";

export async function runApp() {
  console.log("Running app ...");
  const setting = loadSetting();
  const keyBindings = setting.keyBindings;
  const isForked = await isForkedRepository();
  const updateAvailable = await hasUpdates(isForked);
  const auth = await authorize();
  const calendars = await initializeCalendars(auth);
  var allEvents = await initializeEvents(auth, calendars);
  var events = [
    ...allEvents.filter(
      (event) =>
        event.start.getFullYear() === new Date().getFullYear() ||
        event.start.getFullYear() === new Date().getFullYear() + 1 ||
        event.start.getFullYear() === new Date().getFullYear() - 1
    ),
  ];
  events.sort((a, b) => a.start - b.start);

  const { screen, inputBox, keypressListener } = createLayout(
    calendars,
    events
  );
  const leftTable = screen.children.find(
    (child) => child.options.label === "Upcoming Events"
  );
  const logTable = screen.children.find(
    (child) => child.options.label === "Gcal.js Log"
  );

  if (updateAvailable) {
    logTable.log(
      "{blue-fg}Update available! Please run update command to update the app.{/blue-fg}"
    );
  } else {
    logTable.log(
      "{blue-fg}You are using the latest version of the app.{/blue-fg}"
    );
  }

  inputBox.on("submit", (value) => {
    const inputValue = value;

    inputBox.clearValue();
    inputBox.hide();

    removeCommandPopup();

    handleInput(
      auth,
      inputValue,
      screen,
      calendars,
      events,
      allEvents,
      keypressListener
    );

    screen.render();
  });

  inputBox.key(["escape"], () => {
    removeCommandPopup();
    inputBox.hide();
    screen.render();
  });

  leftTable.on("select", (item, index) => {
    // displayItems構造を使用している場合、選択された行のeventを取得
    if (leftTable.displayItems && leftTable.displayItems[index]) {
      const selectedItem = leftTable.displayItems[index];
      // eventがnullの場合は何もしない（イベントのない日）
      if (selectedItem.event) {
        editEvent(
          auth,
          screen,
          calendars,
          selectedItem.event,
          events,
          allEvents
        );
      }
    } else {
      // 後方互換性のため、旧方式もサポート
      editEvent(auth, screen, calendars, events[index], events, allEvents);
    }
  });

  setupKeyBindings(
    screen,
    auth,
    calendars,
    events,
    allEvents,
    inputBox,
    setting
  );

  screen.render();
}
