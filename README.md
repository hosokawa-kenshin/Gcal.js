# Gcal.js
このプログラムは，Google Calendar APIを使用して，複数のカレンダーから特定の期間内のイベントを取得し表示したり，予定の追加を行うJavaScriptアプリケーションである．

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
### コマンドとして実行

コマンドとして実行したい場合はパスを通した任意のディレクトリ内にcldrファイルへのシンボリックリンクを作成してください．

``` bash
export PATH=path/to/your/directory:$PATH
cd your/directory
ln -s path/to/Gcal.js/cldr cldr
```

### cldr コマンド一覧

| コマンド | 説明 | 例 |
| --- | --- | --- |
| `cldr list` | 購読カレンダーの取得 | `cldr list` |
| `cldr nm (keyword)` | イベントの検索（キーワード） | `cldr nm 打合せ` |
| `cldr 01/01 12/31` | イベントの取得（指定期間） | `cldr 01/01 12/31` |
| `cldr add` | イベントの追加 | `cldr add` |
| `cldr rm` | イベントの削除 | `cldr rm` |
| `cldr md` | イベントの表示 (markdown形式) | `cldr md` |
| `cldr show` | イベントの表示  | `cldr show` |


### コマンドの詳細

#### 購読カレンダー取得
コマンドからプログラムを実行するときに，listという引数を渡す．
``` bash
cldr list
```

#### イベント検索
コマンドからプログラムを実行するときに，`nm (keyword)`を引数として指定する．
購読しているすべてのカレンダーの中で，今日から1ヶ月先までの予定を取得し，keywordまたは日付(MM/DD)検索を行う．
keywordを指定しない場合，購読しているすべてのカレンダーの中で，今日から1ヶ月先までの予定を取得する．

``` bash
cldr nm 打合せ
```
例: 上記のコマンドは，購読しているすべてのカレンダーの中の今日から1ヶ月先までの予定から，打合せという文字列がタイトルに含まれているイベントを取得する．

表示フォーマットは以下の通りである．
``` bash
+ (11/28) 第1回グループA打合せ
+ (12/3) 第3回開発打合せ
+ (12/3) 第21回グループB打合せ
```

取得したイベントが + (MM/DD) イベントのタイトル形式で出力される．

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

#### イベント追加(試作)
コマンドからプログラムを実行するときに，カレンダーID，予定名，開始時間，終了時間を入力する
``` bash
cldr add
```
