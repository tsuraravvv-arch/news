# Tsurara Idea Lab - 本番記事登録ツール ローカルサーバー
#
# STEP1（記事作成: AII引き継ぎ情報からのClaude生成）・STEP2（ローカルへ登録）・
# STEP3（GitHubへPush）に対応しています。
#
# 追加インストールは不要です。PowerShell 7+ 標準の System.Net.HttpListener のみを使用し、
# 外部公開はせず 127.0.0.1（このPCから）のみ待ち受けます。
#
# 起動方法:
#   pwsh -File tools/article-publisher/server.ps1
#   （ポートを変えたい場合: pwsh -File tools/article-publisher/server.ps1 -Port 8888）
#
# 起動後、ブラウザで http://127.0.0.1:8877/tools/article-publisher/ を開いてください。
# 終了するには、このウィンドウで Ctrl+C を押してください。

param(
  [int]$Port = 8877
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

# --- 静的ファイル配信のユーティリティ ---

$ContentTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
}

function Get-ContentType {
  param([string]$Path)
  $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  if ($ContentTypes.ContainsKey($ext)) { return $ContentTypes[$ext] }
  return 'application/octet-stream'
}

function Write-JsonResponse {
  param($Response, [int]$StatusCode, $Obj)
  $json = $Obj | ConvertTo-Json -Depth 30 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = 'application/json; charset=utf-8'
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.OutputStream.Close()
}

function Write-FileResponse {
  param($Response, [string]$FilePath)
  if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) {
    $Response.StatusCode = 404
    $Response.OutputStream.Close()
    return
  }
  $bytes = [System.IO.File]::ReadAllBytes($FilePath)
  $Response.StatusCode = 200
  $Response.ContentType = Get-ContentType $FilePath
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.OutputStream.Close()
}

# --- カテゴリ定義（script.js の categoryNames と一致させること。旧カテゴリ互換分岐は新規記事に使わないため含めない） ---
$CategoryNames = @{
  FAS = @{ ja = 'ファッション'; en = 'Fashion' }
  JOB = @{ ja = '職業'; en = 'Jobs' }
  PNF = @{ ja = 'ポーズ・表情'; en = 'Pose & Expression' }
  VIS = @{ ja = 'ビジュアル演出'; en = 'Visual Direction' }
  SSN = @{ ja = '季節'; en = 'Seasonal' }
  ORI = @{ ja = 'オリジナル企画'; en = 'Original Projects' }
  ITM = @{ ja = 'アイテム'; en = 'Items' }
}

# --- Claude生成の出力を強制するJSON Schema ---
$ArticleJsonSchema = @'
{
  "type": "object",
  "properties": {
    "category": { "type": "string", "enum": ["FAS", "JOB", "PNF", "VIS", "SSN", "ORI", "ITM"] },
    "title": { "type": "string" },
    "titleEn": { "type": "string" },
    "summary": { "type": "string" },
    "summaryEn": { "type": "string" },
    "trendElements": { "type": "array", "items": { "type": "string" } },
    "trendElementsEn": { "type": "array", "items": { "type": "string" } },
    "useCases": { "type": "array", "items": { "type": "string" } },
    "useCasesEn": { "type": "array", "items": { "type": "string" } },
    "promptJa": { "type": "string" },
    "promptEn": { "type": "string" },
    "noteTitle": { "type": "string" },
    "noteTitleEn": { "type": "string" },
    "notes": { "type": "array", "items": { "type": "string" } },
    "notesEn": { "type": "array", "items": { "type": "string" } },
    "categoryReason": { "type": "string" }
  },
  "required": [
    "category", "title", "titleEn", "summary", "summaryEn",
    "trendElements", "trendElementsEn", "useCases", "useCasesEn",
    "promptJa", "promptEn", "noteTitle", "noteTitleEn", "notes", "notesEn", "categoryReason"
  ]
}
'@

# --- Claudeへの依頼文を組み立てる ---
function Build-GenerationPrompt {
  param($Fields)

  function V($name) {
    if ($Fields.PSObject.Properties[$name]) { return [string]$Fields.$name }
    return ''
  }

  $categoryHint = V 'categoryOverride'
  $categoryInstruction = if ($categoryHint) {
    "- カテゴリは「$categoryHint」に固定してください。"
  } else {
    "- カテゴリは以下7種類から、内容の主目的に最も合うものを1つだけ判定してください。カメラ・構図・ライティング・画風・エフェクト・演出などが含まれていても、機械的にVISへ固定しないでください。衣装やアイテム、ポーズが主目的ならそちらを優先してください。`n" +
    "  - FAS: ファッション（衣装・スタイル全般）`n" +
    "  - JOB: 職業（コスチューム含む職業モチーフ）`n" +
    "  - PNF: ポーズ・表情`n" +
    "  - VIS: ビジュアル演出（カメラ・構図・ライティング・画風・エフェクト・映像演出が主目的の場合）`n" +
    "  - SSN: 季節（季節・イベント）`n" +
    "  - ORI: オリジナル企画`n" +
    "  - ITM: アイテム（小物・装飾品など）`n" +
    "- 判定理由を categoryReason に1〜2文で必ず記入してください。"
  }

  $lines = @()
  $lines += 'あなたは Tsurara Idea Lab というAI画像生成プロンプト紹介サイトの正式記事を作成するアシスタントです。'
  $lines += '以下の「AII制作引き継ぎ情報」をもとに、正式記事データを1件だけ作成してください。'
  $lines += ''
  $lines += '# 最重要ルール（事実関係）'
  $lines += '- 記事の事実関係（何が起きているか、何が新しいか等）は、必ず下記の「AII制作引き継ぎ情報」のテキスト項目だけを根拠にしてください。'
  $lines += '- サンプル画像は今回渡していません。画像から事実を逆推定することは元々できないため、テキスト項目の内容のみで判断してください。'
  $lines += '- 引き継ぎ情報に無い確証のない事実は作らないでください。不足している部分は、記事用途に沿った一般的な表現にとどめてください。'
  $lines += ''
  $lines += '# カテゴリ判定'
  $lines += $categoryInstruction
  $lines += ''
  $lines += '# 出力フィールドの作成方針'
  $lines += '- title/summary/trendElements/useCases/notes/noteTitle は日本語、titleEn/summaryEn/trendElementsEn/useCasesEn/notesEn/noteTitleEn は英語で、両方とも必ず作成してください（英語は日本語の機械的な直訳ではなく、内容が対応する自然な英語にしてください）。'
  $lines += '- trendElements/trendElementsEn は、説明文ではなく「タグとして使える短い要素」にしてください。1件あたり短い名詞句または単文とし、3〜5件程度に厳選してください（粒度の例：「輪郭限定の多色エッジライト」「青紫〜ピンクの光彩」「暗背景との高コントラスト」）。trendElements と trendElementsEn は件数・順序・意味を対応させてください。summary/notes等、他のフィールドはこの短文化ルールの対象外です。'
  $lines += '- promptJa / promptEn は、ニュース配信時やサンプル制作時のプロンプトをそのままコピーするのではなく、公開記事としてユーザーがそのまま画像生成AIに使える完成形の本番プロンプトにしてください。'
  $lines += '- 「採用したサンプル制作プロンプト」が提供されている場合は、その表現の方向性を尊重しつつ、記事の中心効果・背景・ライティング・構図・エフェクト・衣装やアイテムなどが自然に統合された内容にしてください。'
  $lines += '- promptJa と promptEn は、内容が大きく変わらないようにしてください（英語版は自然な英語プロンプトとして整えつつ、対応関係を保つ）。'
  $lines += '- noteTitle/noteTitleEn は「画像生成メモ」に類する見出しにしてください。notes/notesEn には、再現のポイントや必須ポイントなど、実際に使う際に役立つ具体的なメモを箇条書きで数点入れてください。'
  $lines += ''
  $lines += '# AII制作引き継ぎ情報'
  $lines += ('AII管理ID: ' + (V 'aiiId'))
  $lines += ('ニュースタイトル: ' + (V 'newsTitle'))
  $lines += ('ニュース概要: ' + (V 'newsSummary'))
  $lines += ('何が新しいか: ' + (V 'whatsNew'))
  $lines += ('創作での効果: ' + (V 'creativeEffect'))
  $lines += ('使いどころ: ' + (V 'useCasesRaw'))
  $lines += ('再現のポイント: ' + (V 'reproPoints'))
  $lines += ('対象: ' + (V 'targetType'))
  $lines += ('表現タイプ: ' + (V 'expressionType'))
  $lines += ('中心となる効果: ' + (V 'coreEffect'))
  $lines += ('変更する要素: ' + (V 'changedElements'))
  $lines += ('維持する要素: ' + (V 'keptElements'))
  $lines += ('再現上の必須ポイント: ' + (V 'mustHavePoints'))
  $lines += ('サンプル制作向け日本語プロンプト（参考・そのまま転記しないこと）: ' + (V 'sampleTestPrompt'))
  $lines += ('採用したサンプル制作プロンプト（参考。本番プロンプトの方向性の参考にする）: ' + (V 'adoptedSamplePrompt'))
  $lines += ('情報源URL（参考のみ。sourceUrlフィールドはツール側で別途設定するため出力に含めなくてよい）: ' + (V 'sourceUrl'))
  $extra = V 'extraComments'
  if ($extra) {
    $lines += ''
    $lines += '# 補足コメント'
    $lines += $extra
  }
  $lines += ''
  $lines += '# 出力形式'
  $lines += '- 指定されたJSON Schemaに従い、フィールドを過不足なく埋めてください。'
  $lines += '- 配列項目は必ずJSONの配列にしてください（文字列を1つに連結したものにしないでください）。'

  return ($lines -join "`n")
}

# --- claude CLI をヘッドレスモードで呼び出す ---
function Invoke-ClaudeGenerate {
  param([string]$PromptText)

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'claude'
  $psi.ArgumentList.Add('-p')
  $psi.ArgumentList.Add($PromptText)
  $psi.ArgumentList.Add('--output-format')
  $psi.ArgumentList.Add('json')
  $psi.ArgumentList.Add('--json-schema')
  $psi.ArgumentList.Add($ArticleJsonSchema)
  $psi.ArgumentList.Add('--disallowedTools')
  $psi.ArgumentList.Add('Bash,Read,Write,Edit,WebFetch,WebSearch,Glob,Grep,Task')
  $psi.WorkingDirectory = $RepoRoot
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
  $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

  $proc = [System.Diagnostics.Process]::Start($psi)
  $stdout = $proc.StandardOutput.ReadToEnd()
  $stderr = $proc.StandardError.ReadToEnd()
  $proc.WaitForExit()

  if ($proc.ExitCode -ne 0) {
    throw "claude CLI がエラー終了しました（exit code $($proc.ExitCode)）: $stderr"
  }

  $resultObj = $null
  try {
    $resultObj = $stdout | ConvertFrom-Json -Depth 30
  } catch {
    throw "claude の出力をJSONとして解析できませんでした: $($_.Exception.Message)"
  }

  if ($resultObj.is_error) {
    throw "claude の実行結果がエラーでした: $($resultObj.result)"
  }

  if ($resultObj.PSObject.Properties['structured_output'] -and $resultObj.structured_output) {
    return $resultObj.structured_output
  }

  # structured_output が無い場合は result 文字列（コードフェンス付きの場合あり）から抽出する
  $text = [string]$resultObj.result
  $text = $text.Trim()
  $fenceMatch = [regex]::Match($text, '```(?:json)?\s*([\s\S]*?)```')
  if ($fenceMatch.Success) { $text = $fenceMatch.Groups[1].Value.Trim() }

  try {
    return ($text | ConvertFrom-Json -Depth 30)
  } catch {
    throw "claude の生成結果をJSONとして解析できませんでした。出力: $text"
  }
}

# --- STEP2: ローカルへ登録（data/articles.json への追記・画像保存） ---

$RequiredArticleKeys = @('id', 'category', 'datetime', 'title', 'summary')
$IdPattern = '^[A-Za-z]{3}\d{5}$'
$ArticlesJsonPath = Join-Path $RepoRoot 'data\articles.json'
$ArticlesImagesDir = Join-Path $RepoRoot 'images\articles'
$BackupRoot = Join-Path $env:LOCALAPPDATA 'TsuraraArticlePublisher\backups'

function Get-GitStatusSummary {
  param([string[]]$Paths)
  Push-Location $RepoRoot
  try {
    $gitArgs = @('status', '--porcelain', '--') + $Paths
    $out = & git @gitArgs 2>&1
    if ($LASTEXITCODE -ne 0) { return "git status の取得に失敗しました: $out" }
    if (-not $out) { return '変更はありません。' }
    return ($out -join "`n")
  } finally {
    Pop-Location
  }
}

function Indent-Text {
  param([string]$Text, [int]$Spaces)
  $prefix = ' ' * $Spaces
  return (($Text -split "`n") | ForEach-Object { $prefix + $_ }) -join "`n"
}

# 記事1件を data/articles.json へ追記し、必要なら最終画像を images/articles/<ID>.png に保存する。
# 既存データは一切再シリアライズせず、末尾に追記するだけに留める（既存記事の書式が変わらないようにするため）。
# 事前検証（JSON構文・必須項目・ID形式・カテゴリ・ID重複）に失敗した場合は何も書き込まない。
# 書き込み後の検証・画像保存で失敗した場合は、バックアップから元の状態へロールバックする。
function Register-Article {
  param([string]$ArticleJsonText, [string]$ImageDataUrl)

  $validations = [ordered]@{
    jsonSyntaxBefore = $false
    requiredFields   = $false
    idFormat         = $false
    categoryValid    = $false
    idDuplicate      = $false
    jsonSyntaxAfter  = $null
  }
  $missingFields = @()

  try {
    $newArticle = $ArticleJsonText | ConvertFrom-Json -Depth 30
  } catch {
    throw "送信された記事JSONを解析できませんでした: $($_.Exception.Message)"
  }

  foreach ($key in $RequiredArticleKeys) {
    $value = $null
    if ($newArticle.PSObject.Properties[$key]) { $value = $newArticle.$key }
    if ([string]::IsNullOrWhiteSpace([string]$value)) { $missingFields += $key }
  }
  $validations.requiredFields = ($missingFields.Count -eq 0)

  $id = [string]$newArticle.id
  $validations.idFormat = ($id -match $IdPattern)

  $category = [string]$newArticle.category
  $validations.categoryValid = $CategoryNames.ContainsKey($category)

  $originalText = Get-Content -LiteralPath $ArticlesJsonPath -Raw -Encoding UTF8
  $existingArticles = @()
  try {
    $parsed = $originalText | ConvertFrom-Json -Depth 30
    if ($null -eq $parsed) { throw 'ファイルが空です。' }
    $existingArticles = @($parsed)
    $validations.jsonSyntaxBefore = $true
  } catch {
    $validations.jsonSyntaxBefore = $false
  }

  $beforeCount = $existingArticles.Count
  $existingIds = New-Object System.Collections.Generic.HashSet[string]
  foreach ($a in $existingArticles) {
    if ($a.id) { [void]$existingIds.Add(([string]$a.id).ToUpperInvariant()) }
  }
  $validations.idDuplicate = -not ($id -and $existingIds.Contains($id.ToUpperInvariant()))

  $allPreChecksPassed = $validations.jsonSyntaxBefore -and $validations.requiredFields `
    -and $validations.idFormat -and $validations.categoryValid -and $validations.idDuplicate

  if (-not $allPreChecksPassed) {
    return [ordered]@{
      ok             = $false
      error          = '検証に失敗したため、登録を中止しました。内容を確認してください。'
      validations    = $validations
      missingFields  = $missingFields
      before         = $beforeCount
      after          = $beforeCount
      added          = 0
      id             = $id
      title          = [string]$newArticle.title
      category       = $category
      changedFiles   = @()
      imageResult    = 'not_attempted'
      gitDiffSummary = ''
    }
  }

  if (-not (Test-Path -LiteralPath $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
  }
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $jsonBackupPath = Join-Path $BackupRoot "articles.json.$timestamp.bak"
  Copy-Item -LiteralPath $ArticlesJsonPath -Destination $jsonBackupPath -Force

  $imageTargetPath = Join-Path $ArticlesImagesDir ($id + '.png')
  $imageBackupPath = $null
  $imageWritten = $false
  $tempPath = $null
  $changedFiles = @('data/articles.json')

  try {
    $indentedNew = Indent-Text -Text $ArticleJsonText.Trim() -Spaces 2
    $hadTrailingNewline = $originalText -match '[\r\n]\s*$'
    $trimmedOriginal = $originalText.TrimEnd()
    if (-not $trimmedOriginal.EndsWith(']')) {
      throw 'data/articles.json の末尾が配列の閉じ括弧 ] ではありません。手動で確認してください。'
    }
    $head = $trimmedOriginal.Substring(0, $trimmedOriginal.Length - 1).TrimEnd()

    if ($beforeCount -eq 0) {
      $newText = "[`n" + $indentedNew + "`n]"
    } else {
      $newText = $head + ",`n" + $indentedNew + "`n]"
    }
    if ($hadTrailingNewline) { $newText += "`n" }

    $tempPath = $ArticlesJsonPath + '.tmp'
    [System.IO.File]::WriteAllText($tempPath, $newText, (New-Object System.Text.UTF8Encoding($false)))

    $verifyText = Get-Content -LiteralPath $tempPath -Raw -Encoding UTF8
    $verifyArticles = @($verifyText | ConvertFrom-Json -Depth 30)
    $lastArticle = $verifyArticles[$verifyArticles.Count - 1]
    if ($verifyArticles.Count -ne ($beforeCount + 1) -or [string]$lastArticle.id -ne $id) {
      throw '追記後のJSON検証に失敗しました（件数または末尾IDが一致しません）。'
    }
    $validations.jsonSyntaxAfter = $true

    Move-Item -LiteralPath $tempPath -Destination $ArticlesJsonPath -Force
    $tempPath = $null

    $imageResult = 'skipped'
    if ($ImageDataUrl) {
      if (-not (Test-Path -LiteralPath $ArticlesImagesDir)) {
        New-Item -ItemType Directory -Path $ArticlesImagesDir -Force | Out-Null
      }
      if (Test-Path -LiteralPath $imageTargetPath) {
        $imageBackupPath = Join-Path $BackupRoot ($id + '.png.' + $timestamp + '.bak')
        Copy-Item -LiteralPath $imageTargetPath -Destination $imageBackupPath -Force
      }

      $commaIdx = $ImageDataUrl.IndexOf(',')
      if ($commaIdx -lt 0) { throw '画像データの形式が不正です（data URLではありません）。' }
      $base64 = $ImageDataUrl.Substring($commaIdx + 1)
      $bytes = [System.Convert]::FromBase64String($base64)
      [System.IO.File]::WriteAllBytes($imageTargetPath, $bytes)
      $imageWritten = $true
      $imageResult = 'saved'
      $changedFiles += "images/articles/$id.png"
    }

    $gitDiffSummary = Get-GitStatusSummary -Paths @('data/articles.json', 'images/articles')

    return [ordered]@{
      ok             = $true
      before         = $beforeCount
      after          = $beforeCount + 1
      added          = 1
      id             = $id
      title          = [string]$newArticle.title
      category       = $category
      changedFiles   = $changedFiles
      validations    = $validations
      missingFields  = $missingFields
      imageResult    = $imageResult
      gitDiffSummary = $gitDiffSummary
      backupPath     = $jsonBackupPath
    }
  } catch {
    if ($tempPath -and (Test-Path -LiteralPath $tempPath)) {
      Remove-Item -LiteralPath $tempPath -Force -ErrorAction SilentlyContinue
    }
    Copy-Item -LiteralPath $jsonBackupPath -Destination $ArticlesJsonPath -Force
    if ($imageWritten) {
      if ($imageBackupPath -and (Test-Path -LiteralPath $imageBackupPath)) {
        Copy-Item -LiteralPath $imageBackupPath -Destination $imageTargetPath -Force
      } else {
        Remove-Item -LiteralPath $imageTargetPath -Force -ErrorAction SilentlyContinue
      }
    }
    throw "登録処理中にエラーが発生したため、元の状態へロールバックしました: $($_.Exception.Message)"
  }
}

# --- STEP3: GitHubへPush（data/articles.json への追記・画像保存後のコミット・push） ---

# この記事登録（data/articles.json・images/articles/<ID>.png）以外の変更が作業ツリーに
# 残っている場合は、意図しないファイルを誤ってpushしないよう処理を中止する。
# articles.json と 画像は履歴の慣例（Update articles.json → Create/Update <ID>.png）に
# 合わせて別コミットにし、その後まとめて1回だけ push する。
function Push-Article {
  param([string]$Id)

  if (-not ($Id -match $IdPattern)) {
    throw '記事IDの形式が不正です。'
  }

  Push-Location $RepoRoot
  try {
    $articlesRelPath = 'data/articles.json'
    $imageRelPath = "images/articles/$Id.png"
    $allowedPaths = @($articlesRelPath, $imageRelPath)

    $statusRaw = @(& git status --porcelain 2>&1)
    if ($LASTEXITCODE -ne 0) { throw "git status の取得に失敗しました: $($statusRaw -join "`n")" }

    $unexpected = @()
    $relevant = @{}
    foreach ($line in $statusRaw) {
      if (-not $line) { continue }
      $statusCode = $line.Substring(0, 2)
      $path = $line.Substring(3).Trim()
      if ($path -match '^(.*) -> (.*)$') { $path = $Matches[2] }
      $path = $path.Trim('"') -replace '\\', '/'
      if ($allowedPaths -contains $path) {
        $relevant[$path] = $statusCode
      } else {
        $unexpected += $line
      }
    }

    if ($unexpected.Count -gt 0) {
      return [ordered]@{
        ok                = $false
        error             = 'この記事登録（data/articles.json・該当画像）以外の変更が作業ツリーに見つかったため、Pushを中止しました。内容を確認してください。'
        unexpectedChanges = $unexpected
        committed         = $false
        pushed            = $false
      }
    }

    $aheadCount = 0
    $aheadRaw = @(& git rev-list --count '@{u}..HEAD' 2>&1)
    if ($LASTEXITCODE -eq 0) { [void][int]::TryParse(($aheadRaw | Select-Object -Last 1), [ref]$aheadCount) }

    if (-not $relevant.ContainsKey($articlesRelPath) -and -not $relevant.ContainsKey($imageRelPath) -and $aheadCount -eq 0) {
      return [ordered]@{
        ok        = $false
        error     = 'Push対象の変更が見つかりませんでした。STEP2（ローカルへ登録）を実行済みか確認してください。'
        committed = $false
        pushed    = $false
      }
    }

    $commits = @()
    $committed = $false

    if ($relevant.ContainsKey($articlesRelPath)) {
      & git add -- $articlesRelPath 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw 'git add (data/articles.json) に失敗しました。' }
      $commitOut = & git commit -m 'Update articles.json' 2>&1
      if ($LASTEXITCODE -ne 0) { throw "git commit (data/articles.json) に失敗しました: $($commitOut -join "`n")" }
      $committed = $true
      $hash = (& git rev-parse --short HEAD 2>&1)
      $commits += "Update articles.json ($hash)"
    }

    if ($relevant.ContainsKey($imageRelPath)) {
      $verb = if ($relevant[$imageRelPath].Trim() -eq '??') { 'Create' } else { 'Update' }
      & git add -- $imageRelPath 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw 'git add (画像) に失敗しました。' }
      $msg = "$verb $Id.png"
      $commitOut = & git commit -m $msg 2>&1
      if ($LASTEXITCODE -ne 0) { throw "git commit (画像) に失敗しました: $($commitOut -join "`n")" }
      $committed = $true
      $hash = (& git rev-parse --short HEAD 2>&1)
      $commits += "$msg ($hash)"
    }

    $pushOut = @(& git push 2>&1)
    if ($LASTEXITCODE -ne 0) {
      return [ordered]@{
        ok         = $false
        error      = 'コミットは完了しましたが、pushに失敗しました。再度「GitHubへPush」を実行するか、手動で git push を行ってください。'
        committed  = $committed
        commits    = $commits
        pushed     = $false
        pushOutput = ($pushOut -join "`n")
      }
    }

    return [ordered]@{
      ok         = $true
      committed  = $committed
      pushed     = $true
      commits    = $commits
      pushOutput = ($pushOut -join "`n")
    }
  } finally {
    Pop-Location
  }
}

# --- HTTPリスナー ---
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

Write-Host "Tsurara Idea Lab 本番記事登録ツール（STEP1〜3）を起動しました。"
Write-Host "ブラウザで以下を開いてください:"
Write-Host "  http://127.0.0.1:$Port/tools/article-publisher/"
Write-Host "終了するには Ctrl+C を押してください。"

try {
  while ($listener.IsListening) {
    $context = $null
    try {
      $context = $listener.GetContext()
    } catch {
      break
    }
    $request = $context.Request
    $response = $context.Response

    try {
      if ($request.HttpMethod -eq 'GET') {
        $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
        if ($urlPath -eq '/' -or $urlPath -eq '') {
          $urlPath = '/tools/article-publisher/index.html'
        } elseif ($urlPath.EndsWith('/')) {
          $urlPath = $urlPath + 'index.html'
        }
        $relativePath = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = Join-Path $RepoRoot $relativePath
        $fullPath = [System.IO.Path]::GetFullPath($filePath)

        if (-not $fullPath.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
          $response.StatusCode = 403
          $response.OutputStream.Close()
        } else {
          Write-FileResponse $response $fullPath
        }
      }
      elseif ($request.HttpMethod -eq 'POST' -and $request.Url.AbsolutePath -eq '/api/generate') {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()

        $fields = $bodyText | ConvertFrom-Json

        $promptText = Build-GenerationPrompt $fields
        $generated = Invoke-ClaudeGenerate $promptText

        $cat = [string]$generated.category
        $labelJa = if ($CategoryNames.ContainsKey($cat)) { $CategoryNames[$cat].ja } else { '' }
        $labelEn = if ($CategoryNames.ContainsKey($cat)) { $CategoryNames[$cat].en } else { '' }

        Write-JsonResponse $response 200 @{
          ok              = $true
          article         = $generated
          categoryLabel   = $labelJa
          categoryLabelEn = $labelEn
        }
      }
      elseif ($request.HttpMethod -eq 'POST' -and $request.Url.AbsolutePath -eq '/api/register') {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()

        $body = $bodyText | ConvertFrom-Json
        try {
          $result = Register-Article -ArticleJsonText ([string]$body.articleJson) -ImageDataUrl ([string]$body.imageDataUrl)
          Write-JsonResponse $response 200 $result
        } catch {
          Write-Host "登録エラー: $($_.Exception.Message)"
          Write-JsonResponse $response 500 @{ ok = $false; error = $_.Exception.Message }
        }
      }
      elseif ($request.HttpMethod -eq 'POST' -and $request.Url.AbsolutePath -eq '/api/push') {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()

        $body = $bodyText | ConvertFrom-Json
        try {
          $result = Push-Article -Id ([string]$body.id)
          Write-JsonResponse $response 200 $result
        } catch {
          Write-Host "Pushエラー: $($_.Exception.Message)"
          Write-JsonResponse $response 500 @{ ok = $false; error = $_.Exception.Message }
        }
      }
      else {
        $response.StatusCode = 404
        $response.OutputStream.Close()
      }
    } catch {
      Write-Host "エラー: $($_.Exception.Message)"
      try {
        Write-JsonResponse $response 500 @{ ok = $false; error = $_.Exception.Message }
      } catch {}
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
