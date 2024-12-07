<h1 align="center">
<img src="./img/logo_transparent.png" alt="TUI" width="250", height="250">
</h1>

<p align="center">
<b>TUI</b> <b>Google Calendar<b>管理アプリケーション 🧑‍💻👩‍💻👨‍💻
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
- Google Cloud ConsoleでGoogle Calendar APIが有効になっていること
- credentials.jsonファイルがGoogle Cloud Consoleから取得され，プログラムのディレクトリに配置されていること

## Setup
### 依存パッケージのインストール

プロジェクトディレクトリで下記のコマンドを実行し，必要な依存パッケージをインストールする．
``` bash
npm install
```

### Google Calendar APIの認証情報を設定

1. Google Cloud Consoleでプロジェクトを作成し，Google Calendar APIを有効化する
2. 認証情報を作成し，OAuth 2.0クライアントIDを生成する
3. credentials.jsonファイルをダウンロードし，このプログラムと同じディレクトリに保存する

### コマンドのパスを設定

パスを通した任意のディレクトリ内にcldrファイルへのシンボリックリンクを作成する

``` bash
export PATH=path/to/your/directory:$PATH
cd your/directory
ln -s path/to/Gcal.js/cldr cldr
```

## Commands
| コマンド名 | 説明 |
|--------|----------------------------------|
| `add`    | Googleカレンダーに新しいイベントを追加 |
| `config` | 購読するGoogleカレンダーを選択       |
| `find` or `f`   | 引数をイベント名に含むイベントのみ表示  |
| `help`   | コマンドを一覧表示                  |
| `jump` or `j` | 引数の日付のイベントに移動（引数がなければ今日のイベントに移動） |
| `md`     | Googleカレンダーのイベントを更新      |
| `rm`     | Googleカレンダーのイベントを削除      |
| `sync` or `s`   | Googleカレンダーと同期    |

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされている．
詳細は[LICENSE](LICENSE)ファイルを参照．