<h1 align="center">
<img src="./img/logo_transparent.png" alt="TUI" width="250", height="250">
</h1>

<p align="center">
<b>TUI</b> <b>Google Calendar<b> Client Application 🧑‍💻👩‍💻👨‍💻
</p>

<p align="center">
<img src="https://img.shields.io/badge/Javascript-276DC3.svg?color=45b8cd&logo=javascript&style=flat">
<img src="https://img.shields.io/badge/SQLite-blue?color=45b8cd&logo=sqlite&style=flat">
<a href="https://github.com/hosokawa-kenshin/Gcal.js/blob/main/README-ja.md">
<img height="20px" src="https://img.shields.io/badge/JA-flag.svg?color=45b8cd&style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MDAgNjAwIj4NCjxwYXRoIGZpbGw9IiNmZmYiIGQ9Im0wLDBoOTAwdjYwMGgtOTAweiIvPg0KPGNpcmNsZSBmaWxsPSIjYmUwMDI2IiBjeD0iNDUwIiBjeT0iMzAwIiByPSIxODAiLz4NCjwvc3ZnPg0K">
</a>
<img alt="GitHub License" src="https://img.shields.io/github/license/hosokawa-kenshin/Gcal.js?style=flat-square&logoColor=45b8cd&color=45b8cd">
<br>
</p>

<p>
<p align="center">
<a href="https://github.com/hosokawa-kenshin/Gcal.js" target="__blank"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/hosokawa-kenshin/Gcal.js?logoColor=black"></a>
</p>

<p align="center">
  <a href="##Requirements">Requirements</a> •
  <a href="##Setup">Setup</a> •
  <a href="##Commands">Commands</a> •
  <a href="##License">License</a>
</p>

<p align="center">
<img src="./img/TUI.png" alt="TUI" width="600">
</p>

## For Japanese
[日本語版README](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/README-ja.md)

## Requirements
- Node.js
- Google Calendar API must be enabled in the Google Cloud Console
- `credentials.json` file must be obtained from the Google Cloud Console and placed in the program directory
  - For detailed setup instructions, see [Google Calendar API Credentials Setup Guide](./docs/oauth-en.md)

## Setup
### Install dependencies

Run the following command in the project directory to install the necessary dependencies:
```bash
npm install
```

### Set up Google Calendar API credentials

1. Create a project in Google Cloud Console and enable the Google Calendar API
2. Create credentials and generate an OAuth 2.0 client ID
3. Download the credentials.json file and save it to the same directory as this program

### Create a symlink

To command Gcal (cldr), create a symlink in a location where the path is accessible.
```bash
export PATH=path/to/your/directory:$PATH
cd your/directory
ln -s path/to/Gcal.js/cldr cldr
```
The following is a configuration example
```bash
export PATH=$HOME/.local/bin:$PATH #(Permanent by adding it to .bashrc or .zshrc)
cd ~/.local/bin
ln -s ~/git/Gcal.js/cldr cldr
```

## Usage
### Display
When you start Gcal.js, three tables are displayed.  
On the left are the events registered in Google Calendar, on the upper right is a graph showing the dates and times of events, and on the lower right is a log.  
The event under the cursor is highlighted in blue.

### Basic operations
Use the arrow keys or `jk` keys (like vim) to move the cursor.  
Press the `q` key to exit the system.
To select an event, place the cursor on the event you want to select and press the `Enter` key.
Press the `Space` key to open the command line.

### Event add/edit/delete functions and available commands
Please refer to the following for operation methods, specifications, and details of each:
- [Add events](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/add.md) (Added information about how to add events using LLM on 2025/6/27)

- [Edit events](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/edit.md)

- [Delete events](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/delete.md)

- [Copy events](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/copy.md)

- [Reference copy events](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/refcopy.md)

- [Select calendars to display](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/config.md)

- [Event search display](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/find.md)

- [Cursor movement](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/jump.md)

- [Markdown output](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/md.md)

- [Sync with Google Calendar](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/sync.md)

- [Toggle table](https://github.com/hosokawa-kenshin/Gcal.js/blob/main/docs/cmd/toggle.md)

## Commands

| Command       | Description                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| `add`         | Add a new event to Google Calendar                                              |
| `config`      | Select the Google Calendar to subscribe to                                      |
| `find` or `f` | Display only events that include the argument in the event name                 |
| `help`        | List all commands                                                               |
| `jump` or `j` | Move to the event on the specified date (if no argument, move to today's event) |
| `md`          | Desplay events in markdown and Copy to clipboard them                           |
| `sync` or `s` | Sync with Google Calendar                                                       |
| `update`      | Update Gcal.js                                                                  |

## Shortcuts
Some functions and commands have shortcuts.  
You can also assign your own preferred keys.  
The default key bindings are shown below.

| Key               | Description                              |
| ----------------- | ---------------------------------------- |
| `1`,`2`or`3`      | Toggle display each table in full screen |
| `q` or `Ctrl + c` | Exit the program                         |
| `a`               | Add a new event                          |
| `n`               | Jump to one week later                   |
| `l`               | Add event with LLM                       |
| `p`               | Jump to one week earlier                 |
| `Ctrl + n`        | Jump to the next month                   |
| `Ctrl + p`        | Jump to the previous month               |
| `t`               | Jump to today                            |

Set your key bindings:  
Edit setting.json, key bindings can be changed.
```
{
    "keyBindings": {
        "quit": [
            "q",
            "C-c"
        ],

        [...]

        "today": [
            "t",
            "home"
        ]
    }
}
```
## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.