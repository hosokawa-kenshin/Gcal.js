# google_calendar_to_markdown
このプログラムは，Google Calendar APIを使用して，複数のカレンダーから特定の期間内のイベントを取得し，表示するJavaScriptアプリケーションである．

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

### 取得するカレンダーを設定

```
cp calendarIds.js.example calendarIds.js
vim calendarIds.js
```

## 実行方法
### nodeで実行
#### 購読カレンダー取得
コマンドラインからプログラムを実行するときに，listという引数を渡す．
``` bash
node index.js list
``` 
#### イベント取得
コマンドラインからプログラムを実行するときに，開始日と終了日をMM/DD形式で引数として指定する．
``` bash
node index.js 01/01 12/31
```
例: 上記のコマンドは，1月1日から12月31日までのイベントを取得する．

表示フォーマットは以下の通りである．
``` bash
+ (11/19) A社合同会議
+ (11/21) B社訪問
+ (11/23) 忘年会
```
指定されたカレンダー内のイベントが，開始日時順にソートされ，+ (MM/DD) イベントのタイトル形式で出力される．

### コマンドとして実行

コマンドとして実行したい場合はパスを通した任意のディレクトリ内にcldrファイルへのシンボリックリンクを作成してください．

``` bash
export PATH=path/to/your/directory:$PATH
cd your/directory
ln -s path/to/google_calendar_to_markdown/cldr cldr
```

#### 購読カレンダー取得
コマンドからプログラムを実行するときに，listという引数を渡す．
``` bash
cldr list
``` 
#### イベント取得
コマンドからプログラムを実行するときに，開始日と終了日をMM/DD形式で引数として指定する．
``` bash
cldr 01/01 12/31
```
例: 上記のコマンドは，1月1日から12月31日までのイベントを取得する．

表示フォーマットは以下の通りである．
``` bash
+ (11/19) A社合同会議
+ (11/21) B社訪問
+ (11/23) 忘年会
```
指定されたカレンダー内のイベントが，開始日時順にソートされ，+ (MM/DD) イベントのタイトル形式で出力される．