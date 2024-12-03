# Gcal.js
このプログラムは，Google Calendar APIを使用して，複数のカレンダーから特定の期間内のイベントを取得し表示したり，予定の追加を行う TUI アプリケーションである．

<img src="./img/TUI.png" alt="TUI" width="600">

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

## コマンド一覧
| コマンド名 | 説明 |
|--------|----------------------------------|
| add    | Googleカレンダーに新しいイベントを追加 |
| config | 購読するGoogleカレンダーを選択       |
| help   | コマンドを一覧表示                  |
| md     | Googleカレンダーのイベントを更新      |
| rm     | Googleカレンダーのイベントを削除      |
| sync   | Googleカレンダーからイベントを取得    |
