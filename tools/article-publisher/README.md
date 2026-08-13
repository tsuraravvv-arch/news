# 本番記事登録ツール（tools/article-publisher）

Tsurara Idea Lab の本番運用向けツールです。採用済みのAII制作引き継ぎ情報から、正式記事（`data/articles.json`形式）を作成します。

**STEP1（記事作成）・STEP2（ローカルへ登録）・STEP3（GitHubへPush）** に対応しています。

## できること（STEP1: 記事作成）

- AII制作引き継ぎ情報のフォーム入力
- `claude` CLIのヘッドレスモード（`claude -p`）による正式記事内容の自動生成
  - カテゴリ判定／タイトル・概要／トレンド要素／使いどころ／本番プロンプト（日英）／メモ を生成
  - ログイン中のClaude Pro/Max契約の利用枠内で実行されます。別課金のAPIキーは使用しません
- `data/articles.json`の既存IDから、正式ID候補を自動採番（この時点では読み取りのみ）
- 記事プレビュー表示
- 日本語／英語プロンプトのワンクリックコピー
- サンプル画像・最終画像のアップロード／ドラッグ＆ドロップ／差し替え／削除
- 最終JSONの表示・コピー

## できること（STEP2: ローカルへ登録）

- 「ローカルへ登録」ボタンで、以下を1回の操作で実行します。
  1. `data/articles.json`のバックアップを別フォルダ（`%LOCALAPPDATA%\TsuraraArticlePublisher\backups\`）へ作成
  2. JSON構文・必須項目（id/category/datetime/title/summary）・ID形式・カテゴリ・ID重複を検証（検証に失敗した場合は何も書き込みません）
  3. `data/articles.json`の末尾へ新しい記事オブジェクトのみを追記（既存の記事は一切書き換えません）
  4. 最終画像が指定されている場合、PNGへ自動変換のうえ`images/articles/<正式ID>.png`へ保存（同名ファイルが既にある場合は上書きせずバックアップを取ってから保存）
  5. 追記後のJSONを再検証し、件数・末尾IDが正しいことを確認
  6. `git status`による変更ファイル・差分概要の取得
- 途中で失敗した場合は、バックアップから自動的に元の状態へロールバックします（`data/articles.json`と画像は1つの処理単位として扱われます）。
- 登録前後の件数・追加記事のID/タイトル/カテゴリ・各検証結果・画像保存結果・Git差分概要を画面に表示します。

## できること（STEP3: GitHubへPush）

- 「GitHubへPush」ボタンで、以下を1回の操作で実行します。
  1. `git status`で、この記事登録（`data/articles.json`・`images/articles/<正式ID>.png`）以外の変更が作業ツリーに残っていないかを確認（見つかった場合は何もコミット・pushせずに中止）
  2. `data/articles.json`をコミット（コミットメッセージ: `Update articles.json`）
  3. 最終画像がある場合は続けて画像もコミット（新規なら`Create <ID>.png`、既存画像の上書きなら`Update <ID>.png`。過去にGitHub上で手動登録していた際の命名慣例に合わせています）
  4. 上記コミットをまとめて1回、現在のブランチ（`main`）へ`git push`
- 実行前に確認ダイアログでコミット内容とpush先を表示します。
- pushはリポジトリの`origin`（GitHub）へ直接反映され、GitHub Pagesにも即時反映されます。認証は、このPCに設定済みのGit認証情報（資格情報マネージャー／SSH等）をそのまま利用します。
- コミットは成功したがpushだけ失敗した場合（回線エラーやリモートの分岐など）は、その旨を表示します。再度「GitHubへPush」を押すと、未pushのコミットのみをpushします（同じ内容を再コミットすることはありません）。

## 起動方法

このツールは、ユーザーPC上で動くローカル管理ツールです。GitHub Pagesには公開されません。

1. リポジトリのルートで、PowerShellから以下を実行します。

   ```powershell
   pwsh -File tools/article-publisher/server.ps1
   ```

   ポートを変更したい場合は `-Port` を指定してください（既定は8877）。

   ```powershell
   pwsh -File tools/article-publisher/server.ps1 -Port 8888
   ```

2. ターミナルに表示されるURL（既定: `http://127.0.0.1:8877/tools/article-publisher/`）をブラウザで開きます。

3. 使い終わったら、サーバーを起動したターミナルで `Ctrl+C` を押して終了してください。

## 前提条件

- PowerShell 7以降（`pwsh`）
- `claude` コマンドがPATH上で実行でき、Claude Pro/Max契約でログイン済みであること（`claude /login` 済みであること）
- 追加のnpmパッケージ・Node.js・Pythonのインストールは不要です（`System.Net.HttpListener`のみを使用）

## 安全に関する注意

- サーバーは `127.0.0.1`（このPCから）のみで待ち受け、外部には公開されません。
- 記事生成呼び出し（`/api/generate`）では、`claude` にファイル操作系ツール（Bash/Read/Write/Edit等）へのアクセスを許可していません。生成はテキスト応答のみを行います。
- 登録（`/api/register`）は、`data/articles.json`への追記と最終画像の保存のみを行います。既存の記事・既存の画像を上書きすることはありません（同名の画像が既にある場合はバックアップしてから保存します）。
- バックアップはリポジトリ外（`%LOCALAPPDATA%\TsuraraArticlePublisher\backups\`）に保存されるため、`git status`や誤ったコミット対象には含まれません。
- 最終画像は、サイトの既定仕様（`images/articles/<ID>.png`固定）に合わせるため、PNG以外の形式でアップロードした場合もブラウザ側でPNGへ自動変換してから保存します。
- 「GitHubへPush」（`/api/push`）は、`data/articles.json`と該当記事の画像ファイル**以外**をコミット・push対象に含めません。作業ツリーに他の変更（未コミットの編集や、このツール自身の未コミットファイルなど）が残っている場合は、誤push防止のため何もせず中止します。その場合は、他の変更を別途コミットするか退避してから、改めて実行してください。
