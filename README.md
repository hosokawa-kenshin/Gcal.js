<h1 align="center">
<img src="./img/logo_transparent.png" alt="TUI" width="250", height="250">
</h1>

<p align="center">
<b>TUI</b> <b>Google Calendar<b>Management Application 🧑‍💻👩‍💻👨‍💻
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

## Requirements
- Node.js
- Google Calendar API must be enabled in the Google Cloud Console
- `credentials.json` file must be obtained from the Google Cloud Console and placed in the program directory
- Rename `setting.json.sample` to `setting.json` (you use this file to set your own key bindings)

## Setup
### Install dependencies

Run the following command in the project directory to install the necessary dependencies:
```bash
npm install
```

### Create a symlink

```bash
export PATH=path/to/your/directory:$PATH
cd your/directory
ln -s path/to/Gcal.js/cldr cldr
```

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
Default key bindings:
| Key               | Description                |
| ----------------- | -------------------------- |
| `q` or `Ctrl + c` | Exit the program           |
| `a`               | Add a new event            |
| `n`               | Jump to one week later     |
| `p`               | Jump to one week earlier   |
| `Ctrl + n`        | Jump to the next month     |
| `Ctrl + p`        | Jump to the previous month |
| `t`               | Jump to today              |

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