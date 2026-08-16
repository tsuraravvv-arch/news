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

# JSON文字列に安全に埋め込むための最小限のエスケープ（ConvertTo-Json自体が失敗した場合のフォールバック用）
function ConvertTo-SafeJsonString {
  param([string]$Text)
  if ($null -eq $Text) { return '' }
  return ($Text -replace '\\', '\\\\' -replace '"', '\"' -replace "`r", '\r' -replace "`n", '\n' -replace "`t", '\t')
}

# HTTPレスポンス本文が絶対に空にならないようにする。
# ConvertTo-Jsonでの直列化失敗・OutputStreamへの書き込み失敗のいずれが起きても、
# ここより外側へ例外を伝播させず、可能な限り有効なJSONを返す（最終手段として手組みJSONを使う）。
function Write-JsonResponse {
  param($Response, [int]$StatusCode, $Obj)

  $json = $null
  try {
    $json = $Obj | ConvertTo-Json -Depth 30 -Compress
    if ($null -eq $json -or $json -eq '') { throw 'ConvertTo-Json returned empty output.' }
  } catch {
    $StatusCode = 500
    $json = '{"ok":false,"error":"レスポンスの生成に失敗しました: ' + (ConvertTo-SafeJsonString $_.Exception.Message) + '"}'
  }

  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $Response.StatusCode = $StatusCode
    $Response.ContentType = 'application/json; charset=utf-8'
    $Response.ContentLength64 = $bytes.Length
    $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    Write-Host "レスポンス送信に失敗しました: $($_.Exception.Message)"
  } finally {
    try { $Response.OutputStream.Close() } catch {}
  }
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

# --- Claudeへの依頼文を組み立てる（オリジナル入力: ニュース・トレンド収集を経由しない、ユーザー制作済みプロンプト向け） ---
function Build-OriginalGenerationPrompt {
  param($Fields)

  function V($name) {
    if ($Fields.PSObject.Properties[$name]) { return [string]$Fields.$name }
    return ''
  }

  $lines = @()
  $lines += 'あなたは Tsurara Idea Lab というAI画像生成プロンプト紹介サイトの正式記事を作成するアシスタントです。'
  $lines += '以下は、ニュース・トレンド収集を経由せず、ユーザーが独自に制作した完成済みのAI画像生成プロンプトです。これをもとに、正式記事データを1件だけ作成してください。'
  $lines += ''
  $lines += '# 最重要ルール'
  $lines += '- 「完成した日本語プロンプト」は promptJa の正本（そのまま採用する原文）として扱ってください。意味・条件・構造を不用意に省略・簡略化・改変しないでください（誤字脱字レベルの整形のみ可）。'
  $lines += '- 記事タイトル・テーマ、完成した日本語プロンプト、補足情報に無い事実（ニュース・トレンド・流行情報など）を新たに作らないでください。'
  $lines += '- 存在しないニュースソースや情報源URLを作らないでください。sourceUrlに相当する情報は出力に含めないでください（ツール側で空文字として扱います）。'
  $lines += '- 【制作引き継ぎ AIIxxxxx】のような制作引き継ぎIDを生成しないでください。'
  $lines += '- 正式記事IDはこの段階では採番しません。出力にidフィールドは含めないでください（ツール側で別途採番します）。'
  $lines += ''
  $lines += '# カテゴリ判定'
  $lines += '- カテゴリは以下7種類から、内容の主目的に最も合うものを1つだけ判定してください。カメラ・構図・ライティング・画風・エフェクト・演出などが含まれていても、機械的にVISへ固定しないでください。衣装やアイテム、ポーズが主目的ならそちらを優先してください。'
  $lines += '  - FAS: ファッション（衣装・スタイル全般）'
  $lines += '  - JOB: 職業（コスチューム含む職業モチーフ）'
  $lines += '  - PNF: ポーズ・表情'
  $lines += '  - VIS: ビジュアル演出（カメラ・構図・ライティング・画風・エフェクト・映像演出が主目的の場合）'
  $lines += '  - SSN: 季節（季節・イベント）'
  $lines += '  - ORI: オリジナル企画'
  $lines += '  - ITM: アイテム（小物・装飾品など）'
  $lines += '- 判定理由を categoryReason に1〜2文で必ず記入してください。'
  $lines += ''
  $lines += '# 出力フィールドの作成方針'
  $lines += '- title/summary/trendElements/useCases/notes/noteTitle は日本語、titleEn/summaryEn/trendElementsEn/useCasesEn/notesEn/noteTitleEn は英語で、両方とも必ず作成してください（英語は日本語の機械的な直訳ではなく、内容が対応する自然な英語にしてください）。'
  $lines += '- title/titleEn は、入力された「記事タイトル・テーマ」を土台に、記事として適切な形へ整えてください（テーマ程度の簡潔な入力であっても、完成した日本語プロンプトの内容から自然なタイトルへ整形してください）。'
  $lines += '- trendElements/trendElementsEn は、説明文ではなく「タグとして使える短い要素」にしてください。1件あたり短い名詞句または単文とし、3〜5件程度に厳選してください。trendElements と trendElementsEn は件数・順序・意味を対応させてください。summary/notes等、他のフィールドはこの短文化ルールの対象外です。'
  $lines += '- promptJa には、下記の「完成した日本語プロンプト」の内容をそのまま採用してください（正本のため書き換えないこと）。promptEn は、その内容から対応関係を保った自然な英語プロンプトとして作成してください。'
  $lines += '- noteTitle/noteTitleEn は「画像生成メモ」に類する見出しにしてください。notes/notesEn には、完成した日本語プロンプトと補足情報から、実際に使う際に役立つ具体的なメモを箇条書きで数点入れてください。'
  $lines += ''
  $lines += '# 入力情報'
  $lines += ('記事タイトル・テーマ: ' + (V 'theme'))
  $lines += ''
  $lines += '完成した日本語プロンプト:'
  $lines += (V 'promptJa')
  $supplementalNotes = V 'supplementalNotes'
  if ($supplementalNotes) {
    $lines += ''
    $lines += '補足情報:'
    $lines += $supplementalNotes
  }
  $lines += ''
  $lines += '# 出力形式'
  $lines += '- 指定されたJSON Schemaに従い、フィールドを過不足なく埋めてください。'
  $lines += '- 配列項目は必ずJSONの配列にしてください（文字列を1つに連結したものにしないでください）。'

  return ($lines -join "`n")
}

# --- Claudeへの依頼文を組み立てる（CRI: 情報収集・制作管理用のクリエイティブトレンドID。CRIは正式カテゴリではなく、既存7カテゴリへ振り分ける） ---
function Build-CriGenerationPrompt {
  param($Fields)

  function V($name) {
    if ($Fields.PSObject.Properties[$name]) { return [string]$Fields.$name }
    return ''
  }

  $categoryHint = V 'categoryOverride'
  $categoryInstruction = if ($categoryHint) {
    "- カテゴリは「$categoryHint」に固定してください。"
  } else {
    "- カテゴリは以下7種類から、内容の主目的に最も合うものを1つだけ判定してください。CRIは情報収集・制作管理用のIDであり、Tsurara Idea Labの正式カテゴリではありません。カメラ・構図・ライティング・画風・エフェクト・演出などが含まれていても、機械的にVISへ固定しないでください。衣装やアイテム、ポーズが主目的ならそちらを優先してください。`n" +
    "  - FAS: ファッション（衣装・スタイル全般）`n" +
    "  - JOB: 職業（コスチューム含む職業モチーフ）`n" +
    "  - PNF: ポーズ・表情`n" +
    "  - VIS: ビジュアル演出（カメラ・構図・ライティング・画風・エフェクト・映像演出が主目的の場合）`n" +
    "  - SSN: 季節（季節・イベント）`n" +
    "  - ORI: オリジナル企画（複数要素を組み合わせた独自企画で、他カテゴリに明確に当てはまらない場合）`n" +
    "  - ITM: アイテム（小物・装飾品など）`n" +
    "- 判定理由を categoryReason に1〜2文で必ず記入してください。"
  }

  $lines = @()
  $lines += 'あなたは Tsurara Idea Lab というAI画像生成プロンプト紹介サイトの正式記事を作成するアシスタントです。'
  $lines += '以下の「CRI制作引き継ぎ情報」（ネット上の流行・創作表現を画像生成アイデアへ変換した、情報収集・制作管理用のクリエイティブトレンド情報）をもとに、正式記事データを1件だけ作成してください。'
  $lines += ''
  $lines += '# 最重要ルール（事実関係・記事化方針）'
  $lines += '- 記事の事実関係は、必ず下記の「CRI制作引き継ぎ情報」のテキスト項目だけを根拠にしてください。引き継ぎ情報に無い確証のない事実は作らないでください。'
  $lines += '- 元ネタそのものの解説記事にはしないでください。特定の作品名・キャラクター名など、引き継ぎ情報に明記されていない固有名詞を新たに追加しないでください。'
  $lines += '- CRIは流行・表現の傾向を抽象化したものです。画像生成で再利用できる独立した表現として整理し、「何を試せるプロンプトなのか」が読者に伝わる記事にしてください。'
  $lines += '- 「サンプル制作向け日本語プロンプト」が提供されている場合も、その内容をそのまま転記せず、公開記事としてユーザーがそのまま画像生成AIに使える完成形の本番プロンプトへ整えてください。'
  $lines += ''
  $lines += '# カテゴリ判定'
  $lines += $categoryInstruction
  $lines += ''
  $lines += '# 出力フィールドの作成方針'
  $lines += '- title/summary/trendElements/useCases/notes/noteTitle は日本語、titleEn/summaryEn/trendElementsEn/useCasesEn/notesEn/noteTitleEn は英語で、両方とも必ず作成してください（英語は日本語の機械的な直訳ではなく、内容が対応する自然な英語にしてください）。'
  $lines += '- trendElements/trendElementsEn は、説明文ではなく「タグとして使える短い要素」にしてください。1件あたり短い名詞句または単文とし、3〜5件程度に厳選してください。trendElements と trendElementsEn は件数・順序・意味を対応させてください。'
  $lines += '- useCases/useCasesEn も、説明文ではなく3〜5件程度の短い用途表現にしてください。'
  $lines += '- 下記「Lab記事向けトレンド要素」「Lab記事向け使いどころ」が存在する場合は、それぞれ trendElements・useCases 作成時の優先材料として使用してください。'
  $lines += '- promptJa / promptEn は、公開記事としてユーザーがそのまま画像生成AIに使える完成形の本番プロンプトにしてください。promptJa と promptEn は内容が大きく変わらないようにしてください（英語版は自然な英語プロンプトとして整えつつ、対応関係を保つ）。'
  $lines += '- noteTitle/noteTitleEn は「画像生成メモ」に類する見出しにしてください。notes/notesEn には、再現のポイントや必須ポイントなど、実際に使う際に役立つ具体的なメモを箇条書きで数点入れてください。'
  $lines += ''
  $lines += '# CRI制作引き継ぎ情報'
  $lines += ('CRI管理ID: ' + (V 'criId'))
  $lines += ('アイデア名: ' + (V 'ideaName'))
  $lines += ('アイデア概要: ' + (V 'ideaSummary'))
  $lines += ('注目理由: ' + (V 'attentionReason'))
  $lines += ('創作での魅力: ' + (V 'creativeAppeal'))
  $lines += ('使いどころ: ' + (V 'useCasesRaw'))
  $lines += ('再現のポイント: ' + (V 'reproPoints'))
  $lines += ('分類: ' + (V 'classification'))
  $lines += ('中心となる表現: ' + (V 'coreExpression'))
  $lines += ('変更する要素: ' + (V 'changedElements'))
  $lines += ('維持する要素: ' + (V 'keptElements'))
  $lines += ('再現上の必須ポイント: ' + (V 'mustHavePoints'))
  $lines += ('Lab記事向けトレンド要素（優先材料）: ' + (V 'labTrendHints'))
  $lines += ('Lab記事向け使いどころ（優先材料）: ' + (V 'labUseCaseHints'))
  $lines += ('サンプル制作向け日本語プロンプト（参考・そのまま転記しないこと）: ' + (V 'sampleTestPrompt'))
  $lines += ('情報源URL（参考のみ。sourceUrlフィールドはツール側で別途設定するため出力に含めなくてよい）: ' + (V 'sourceUrl'))
  $lines += ''
  $lines += '# 出力形式'
  $lines += '- 指定されたJSON Schemaに従い、フィールドを過不足なく埋めてください。'
  $lines += '- 配列項目は必ずJSONの配列にしてください（文字列を1つに連結したものにしないでください）。'
  $lines += '- 出力にidフィールドやCRI管理IDに相当する文字列を含めないでください（正式IDはこの段階では採番せず、ツール側で別途設定します）。'

  return ($lines -join "`n")
}

# --- 日英同期（日本語を正本として、変更のあった日英ペアだけを再同期する）で使うJA→EN対応表 ---
# AII/CRI/オリジナルいずれの生成結果に対しても共通で使用する（入力元別の生成ロジックは変更しない）。
$EnSyncFieldMap = [ordered]@{
  title          = @{ enKey = 'titleEn';          isArray = $false }
  summary        = @{ enKey = 'summaryEn';        isArray = $false }
  trendElements  = @{ enKey = 'trendElementsEn';  isArray = $true }
  useCases       = @{ enKey = 'useCasesEn';       isArray = $true }
  promptJa       = @{ enKey = 'promptEn';         isArray = $false }
  noteTitle      = @{ enKey = 'noteTitleEn';      isArray = $false }
  notes          = @{ enKey = 'notesEn';          isArray = $true }
}

# --- 日英同期用のJSON Schemaを動的に組み立てる（dirtyなペアに対応する英語フィールドのみを要求する） ---
function Build-EnSyncSchema {
  param([string[]]$DirtyPairs)

  $properties = [ordered]@{}
  $required = @()
  foreach ($pair in $DirtyPairs) {
    if (-not $EnSyncFieldMap.Contains($pair)) { continue }
    $enKey = $EnSyncFieldMap[$pair].enKey
    if ($EnSyncFieldMap[$pair].isArray) {
      $properties[$enKey] = @{ type = 'array'; items = @{ type = 'string' } }
    } else {
      $properties[$enKey] = @{ type = 'string' }
    }
    $required += $enKey
  }

  $schemaObj = [ordered]@{
    type                 = 'object'
    properties           = $properties
    required             = $required
    additionalProperties = $false
  }

  return ($schemaObj | ConvertTo-Json -Depth 10 -Compress)
}

# --- 日英同期用のClaude依頼文を組み立てる ---
# 現在確定している日本語の内容（正本）を渡し、指定された英語フィールドだけを更新させる。
# 記事全体の再生成は行わない（idやカテゴリなど、日英同期に無関係なフィールドは扱わない）。
function Build-EnSyncPrompt {
  param($Fields, [string[]]$DirtyPairs)

  function V($name) {
    if ($Fields.PSObject.Properties[$name]) { return [string]$Fields.$name }
    return ''
  }

  function VLines($name) {
    if (-not $Fields.PSObject.Properties[$name]) { return '' }
    $value = $Fields.$name
    if ($value -is [array]) { return ($value -join "`n") }
    return [string]$value
  }

  $requestedEnFields = $DirtyPairs | Where-Object { $EnSyncFieldMap.Contains($_) } | ForEach-Object { $EnSyncFieldMap[$_].enKey }

  $lines = @()
  $lines += 'あなたは Tsurara Idea Lab というAI画像生成プロンプト紹介サイトの正式記事を作成するアシスタントです。'
  $lines += '以下は、ユーザーが確認・確定した最新の日本語記事内容（正本）です。この日本語をもとに、指定された英語フィールドだけを更新してください。'
  $lines += ''
  $lines += '# 最重要ルール'
  $lines += '- 出力するのは、下記「更新が必要な英語フィールド」に列挙されたフィールドのみです。それ以外のフィールドは出力しないでください。'
  $lines += '- 単純な機械翻訳ではなく、記事表現として自然な英語にしてください。promptEnを更新する場合は、promptJaの意味を保ちながら英語の画像生成AIでそのまま使える自然なプロンプトにしてください。'
  $lines += '- 日本語に無い要素を新たに追加しないでください。日本語から削除された要素を英語側で復活させないでください。'
  $lines += '- trendElementsEn/useCasesEn/notesEn を更新する場合は、対応する日本語配列と件数・順序・意味を1件ずつ対応させてください（要約・統合・分割はしないでください）。'
  $lines += ''
  $lines += '# 現在の日本語記事内容（正本）'
  $lines += ('title: ' + (V 'title'))
  $lines += ('summary: ' + (V 'summary'))
  $lines += 'trendElements:'
  $lines += (VLines 'trendElements')
  $lines += 'useCases:'
  $lines += (VLines 'useCases')
  $lines += 'promptJa:'
  $lines += (V 'promptJa')
  $lines += ('noteTitle: ' + (V 'noteTitle'))
  $lines += 'notes:'
  $lines += (VLines 'notes')
  $lines += ''
  $lines += '# 更新が必要な英語フィールド'
  $lines += ($requestedEnFields -join ', ')
  $lines += ''
  $lines += '# 出力形式'
  $lines += '- 指定されたJSON Schemaに従い、上記フィールドのみを過不足なく埋めてください。'
  $lines += '- 配列項目は必ずJSONの配列にしてください（文字列を1つに連結したものにしないでください）。'

  return ($lines -join "`n")
}

# --- claude CLI をヘッドレスモードで呼び出す ---
# $Schema省略時は既存の記事生成用スキーマ（$ArticleJsonSchema）を使用する（既存呼び出し元の挙動は変わらない）。
function Invoke-ClaudeGenerate {
  param([string]$PromptText, [string]$Schema = $ArticleJsonSchema, [int]$TimeoutSeconds = 180)

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'claude'
  $psi.ArgumentList.Add('-p')
  $psi.ArgumentList.Add($PromptText)
  $psi.ArgumentList.Add('--output-format')
  $psi.ArgumentList.Add('json')
  $psi.ArgumentList.Add('--json-schema')
  $psi.ArgumentList.Add($Schema)
  $psi.ArgumentList.Add('--disallowedTools')
  $psi.ArgumentList.Add('Bash,Read,Write,Edit,WebFetch,WebSearch,Glob,Grep,Task')
  $psi.WorkingDirectory = $RepoRoot
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
  $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

  $proc = New-Object System.Diagnostics.Process
  $proc.StartInfo = $psi
  [void]$proc.Start()

  # WaitForExitの前に非同期読み取りを開始し、出力バッファ詰まりによるデッドロックを避ける（Invoke-Gitと同じ対策）。
  # 修正前はReadToEnd()を同期・順番に呼んでおり、claudeがstderrへ十分な量を書き込むとパイプが詰まって
  # 双方が待ち合ったまま応答が返らず、結果として空/不完全なHTTPレスポンスになる不具合があった。
  $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
  $stderrTask = $proc.StandardError.ReadToEndAsync()

  $exited = $proc.WaitForExit([Math]::Max(1, $TimeoutSeconds) * 1000)
  if (-not $exited) {
    try { $proc.Kill($true) } catch {}
    throw "claude CLI の応答が ${TimeoutSeconds} 秒以内に完了しなかったため中断しました（タイムアウト）。"
  }

  [System.Threading.Tasks.Task]::WaitAll(@($stdoutTask, $stderrTask), 5000) | Out-Null
  $stdout = [string]$stdoutTask.Result
  $stderr = [string]$stderrTask.Result

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

# 制作引き継ぎ管理ID（AIIxxxxx/CRIxxxxx）→ 正式記事IDの対応表。リポジトリ外（ローカル専用）に保存し、
# data/articles.json のスキーマや履歴には一切影響しない。同じ管理IDを再度読み込んだ際に、
# computeIdCandidate() による新規連番採番ではなく既存の正式記事IDを再利用するために使う。
$HandoffIdMapPath = Join-Path $env:LOCALAPPDATA 'TsuraraArticlePublisher\handoff-id-map.json'

function Read-HandoffIdMap {
  if (-not (Test-Path -LiteralPath $HandoffIdMapPath)) { return @{} }
  try {
    $raw = Get-Content -LiteralPath $HandoffIdMapPath -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) { return @{} }
    $obj = $raw | ConvertFrom-Json -Depth 5
    $map = @{}
    if ($obj) {
      foreach ($prop in $obj.PSObject.Properties) { $map[$prop.Name] = [string]$prop.Value }
    }
    return $map
  } catch {
    return @{}
  }
}

function Save-HandoffIdMap {
  param($Map)
  $dir = Split-Path -Parent $HandoffIdMapPath
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  ($Map | ConvertTo-Json -Depth 5) | Set-Content -LiteralPath $HandoffIdMapPath -Encoding UTF8
}

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

# JSON文字列・エスケープ・括弧深度を認識しながら、トップレベル配列（$Text全体が `[ {...}, {...} ]` 形式である前提）の
# 各要素オブジェクトについて、開き `{` と閉じ `}` の文字位置（0始まり、両端含む）を出現順に返す。
# 単純な正規表現での抜き出しと違い、記事の値に含まれる `{` `}` `,` （文字列中の文字）を要素境界と誤認しない。
# 戻り値はConvertFrom-Jsonでパースした配列と同じ「出現順」になるため、パース結果とインデックスで対応させて使う。
function Get-TopLevelObjectRanges {
  param([string]$Text)

  $ranges = New-Object System.Collections.Generic.List[object]
  $depth = 0
  $inString = $false
  $escapeNext = $false
  $elementStart = -1

  for ($i = 0; $i -lt $Text.Length; $i++) {
    $ch = $Text[$i]

    if ($inString) {
      if ($escapeNext) {
        $escapeNext = $false
      } elseif ($ch -eq '\') {
        $escapeNext = $true
      } elseif ($ch -eq '"') {
        $inString = $false
      }
      continue
    }

    if ($ch -eq '"') {
      $inString = $true
    } elseif ($ch -eq '[' -or $ch -eq '{') {
      if ($ch -eq '{' -and $depth -eq 1 -and $elementStart -lt 0) {
        $elementStart = $i
      }
      $depth++
    } elseif ($ch -eq ']' -or $ch -eq '}') {
      $depth--
      if ($ch -eq '}' -and $depth -eq 1 -and $elementStart -ge 0) {
        [void]$ranges.Add([ordered]@{ Start = $elementStart; End = $i })
        $elementStart = -1
      }
    }
  }

  return $ranges
}

# 記事1件を data/articles.json へ登録する（新規は末尾へ追記、既存IDが1件だけ一致した場合はその配列位置で置換するUpsert）。
# 既存データは一切再シリアライズせず、対象記事のテキスト範囲だけを書き換える（他の記事の書式・並び順を変えないため）。
# 事前検証（JSON構文・必須項目・ID形式・カテゴリ・ID一致件数）に失敗した場合は何も書き込まない。
# 書き込み後の検証・画像保存で失敗した場合は、バックアップから元の状態へロールバックする。
function Register-Article {
  param([string]$ArticleJsonText, [string]$ImageDataUrl, [string]$ManagementId)

  $validations = [ordered]@{
    jsonSyntaxBefore = $false
    requiredFields   = $false
    idFormat         = $false
    categoryValid    = $false
    idCountValid     = $false
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

  # HashSetでは「同一IDが何件存在するか」を判定できないため、対象IDの実際の一致件数と、
  # 一致した配列インデックス（出現順）を数え上げる。比較は大文字小文字を区別しない。
  $idUpper = if ($id) { $id.ToUpperInvariant() } else { '' }
  $matchIndexes = @()
  for ($i = 0; $i -lt $existingArticles.Count; $i++) {
    $existingId = [string]$existingArticles[$i].id
    if ($idUpper -and $existingId -and ($existingId.ToUpperInvariant() -eq $idUpper)) {
      $matchIndexes += $i
    }
  }
  $idMatchCount = $matchIndexes.Count
  $validations.idCountValid = ($idMatchCount -le 1)

  # 0件なら新規登録、1件なら既存記事の更新、2件以上はdata/articles.json自体の異常なID重複として中止する。
  $operation = if ($idMatchCount -eq 0) { 'create' } elseif ($idMatchCount -eq 1) { 'update' } else { 'duplicate' }

  $allPreChecksPassed = $validations.jsonSyntaxBefore -and $validations.requiredFields `
    -and $validations.idFormat -and $validations.categoryValid -and $validations.idCountValid

  if (-not $allPreChecksPassed) {
    return [ordered]@{
      ok             = $false
      error          = '検証に失敗したため、登録を中止しました。内容を確認してください。'
      validations    = $validations
      missingFields  = $missingFields
      before         = $beforeCount
      after          = $beforeCount
      added          = 0
      updated        = 0
      operation      = $operation
      idMatchCount   = $idMatchCount
      id             = $id
      title          = [string]$newArticle.title
      category       = $category
      changedFiles   = @()
      imageResult    = 'not_attempted'
      gitDiffSummary = ''
    }
  }

  # 画像は、JSON・画像本体のいずれも書き換える前に data URL 形式の確認とBase64デコードまで済ませておく。
  # 不正な画像データが原因で、ファイルを書き換えたあとに失敗してロールバックする事態を避けるため。
  $imageBytes = $null
  if ($ImageDataUrl) {
    $commaIdx = $ImageDataUrl.IndexOf(',')
    if ($commaIdx -lt 0) { throw '画像データの形式が不正です（data URLではありません）。' }
    $base64 = $ImageDataUrl.Substring($commaIdx + 1)
    try {
      $imageBytes = [System.Convert]::FromBase64String($base64)
    } catch {
      throw "画像データのBase64デコードに失敗しました: $($_.Exception.Message)"
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

    if ($operation -eq 'create') {
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
    } else {
      # update: 既存記事をテキスト範囲で特定し、その配列位置のまま新しい記事JSONへ置換する。
      # 配列全体は再シリアライズせず、対象記事以外の書式・並び順は一切変更しない。
      $ranges = Get-TopLevelObjectRanges -Text $originalText
      if ($ranges.Count -ne $beforeCount) {
        throw "記事範囲の解析結果（$($ranges.Count)件）が記事数（$beforeCount 件）と一致しませんでした。手動で確認してください。"
      }
      $targetRange = $ranges[$matchIndexes[0]]

      # 対象記事の `{` が行頭からどれだけ字下げされているかを、直前の空白文字を逆方向にたどって求める。
      # この範囲を置換対象に含めることで、Indent-Textで生成した新しいテキスト（先頭行も字下げ済み）を
      # そのまま差し込んでも二重字下げにならないようにする。
      $lineStart = $targetRange.Start
      while ($lineStart -gt 0 -and ($originalText[$lineStart - 1] -eq ' ' -or $originalText[$lineStart - 1] -eq "`t")) {
        $lineStart--
      }

      $newText = $originalText.Substring(0, $lineStart) + $indentedNew + $originalText.Substring($targetRange.End + 1)
    }

    $tempPath = $ArticlesJsonPath + '.tmp'
    [System.IO.File]::WriteAllText($tempPath, $newText, (New-Object System.Text.UTF8Encoding($false)))

    $verifyText = Get-Content -LiteralPath $tempPath -Raw -Encoding UTF8
    $verifyArticles = @($verifyText | ConvertFrom-Json -Depth 30)

    if ($operation -eq 'create') {
      $lastArticle = $verifyArticles[$verifyArticles.Count - 1]
      if ($verifyArticles.Count -ne ($beforeCount + 1) -or [string]$lastArticle.id -ne $id) {
        throw '登録後のJSON検証に失敗しました（件数または末尾IDが一致しません）。'
      }
    } else {
      $verifyMatchCount = 0
      $verifyMatchedArticle = $null
      foreach ($a in $verifyArticles) {
        if (([string]$a.id).ToUpperInvariant() -eq $idUpper) {
          $verifyMatchCount++
          $verifyMatchedArticle = $a
        }
      }
      if ($verifyArticles.Count -ne $beforeCount -or $verifyMatchCount -ne 1 -or [string]$verifyMatchedArticle.title -ne [string]$newArticle.title) {
        throw '登録後のJSON検証に失敗しました（件数、対象IDの一致件数、または内容が一致しません）。'
      }
    }
    $validations.jsonSyntaxAfter = $true

    Move-Item -LiteralPath $tempPath -Destination $ArticlesJsonPath -Force
    $tempPath = $null

    $imageResult = 'skipped'
    if ($null -ne $imageBytes) {
      if (-not (Test-Path -LiteralPath $ArticlesImagesDir)) {
        New-Item -ItemType Directory -Path $ArticlesImagesDir -Force | Out-Null
      }
      if (Test-Path -LiteralPath $imageTargetPath) {
        $imageBackupPath = Join-Path $BackupRoot ($id + '.png.' + $timestamp + '.bak')
        Copy-Item -LiteralPath $imageTargetPath -Destination $imageBackupPath -Force
      }

      [System.IO.File]::WriteAllBytes($imageTargetPath, $imageBytes)
      $imageWritten = $true
      $imageResult = 'saved'
      $changedFiles += "images/articles/$id.png"
    }

    $gitDiffSummary = Get-GitStatusSummary -Paths @('data/articles.json', 'images/articles')

    # 制作引き継ぎ管理IDが渡されている場合は、正式記事IDとの対応をローカルファイルへ保存する（ベストエフォート）。
    # この保存に失敗しても記事登録自体は成功として扱う（対応表はあくまで次回のID再利用のための補助情報のため）。
    if ($ManagementId) {
      try {
        $map = Read-HandoffIdMap
        $map[$ManagementId.ToUpperInvariant()] = $id
        Save-HandoffIdMap -Map $map
      } catch {
        Write-Host "管理ID対応表の保存に失敗しました（登録処理自体は継続します）: $($_.Exception.Message)"
      }
    }

    $addedCount = if ($operation -eq 'create') { 1 } else { 0 }
    $updatedCount = if ($operation -eq 'update') { 1 } else { 0 }
    $afterCount = if ($operation -eq 'create') { $beforeCount + 1 } else { $beforeCount }

    return [ordered]@{
      ok             = $true
      before         = $beforeCount
      after          = $afterCount
      added          = $addedCount
      updated        = $updatedCount
      operation      = $operation
      idMatchCount   = $idMatchCount
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

# git をネイティブプロセスとして直接起動し、stdout/stderrを分離して読み取るヘルパー。
# 「& git ... 2>&1」は使わない：PowerShellはネイティブコマンドのstderr出力を2>&1で
# 合流させるとErrorRecordとして扱うため、スクリプト先頭の $ErrorActionPreference = 'Stop'
# の下では、git が成功時に出す通常の警告・進捗出力（例: 改行コード変換の警告、
# git push が標準で標準エラー出力へ書く進捗サマリなど）でも即座に例外化してしまう。
# ここでは Process を直接扱い、終了コードのみで成否を判定することでこの問題を避ける。
function Invoke-Git {
  param([string[]]$GitArgs, [int]$TimeoutSeconds = 30)

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'git'
  foreach ($a in $GitArgs) { $psi.ArgumentList.Add($a) }
  $psi.WorkingDirectory = $RepoRoot
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
  $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

  $proc = New-Object System.Diagnostics.Process
  $proc.StartInfo = $psi
  [void]$proc.Start()

  # WaitForExitの前に非同期読み取りを開始し、出力バッファ詰まりによるデッドロックを避ける
  $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
  $stderrTask = $proc.StandardError.ReadToEndAsync()

  $exited = $proc.WaitForExit([Math]::Max(1, $TimeoutSeconds) * 1000)
  if (-not $exited) {
    try { $proc.Kill($true) } catch {}
    return [ordered]@{ exitCode = -1; stdout = ''; stderr = ''; timedOut = $true }
  }

  [System.Threading.Tasks.Task]::WaitAll(@($stdoutTask, $stderrTask), 5000) | Out-Null

  return [ordered]@{
    exitCode = $proc.ExitCode
    stdout   = [string]$stdoutTask.Result
    stderr   = [string]$stderrTask.Result
    timedOut = $false
  }
}

# この記事登録（data/articles.json・images/articles/<ID>.png）以外の変更が作業ツリーに
# 残っている場合は、意図しないファイルを誤ってpushしないよう処理を中止する。
# articles.json と 画像は履歴の慣例（Update articles.json → Create/Update <ID>.png）に
# 合わせて別コミットにし、その後まとめて1回だけ push する。
function Push-Article {
  param([string]$Id)

  if (-not ($Id -match $IdPattern)) {
    throw '記事IDの形式が不正です。'
  }

  $articlesRelPath = 'data/articles.json'
  $imageRelPath = "images/articles/$Id.png"
  $allowedPaths = @($articlesRelPath, $imageRelPath)

  $statusResult = Invoke-Git -GitArgs @('status', '--porcelain') -TimeoutSeconds 20
  if ($statusResult.timedOut) { throw 'git status の取得がタイムアウトしました。' }
  if ($statusResult.exitCode -ne 0) { throw "git status の取得に失敗しました: $($statusResult.stderr)" }

  $statusLines = @($statusResult.stdout -split "`r?`n" | Where-Object { $_ -ne '' })

  $unexpected = @()
  $relevant = @{}
  foreach ($line in $statusLines) {
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
  $aheadResult = Invoke-Git -GitArgs @('rev-list', '--count', '@{u}..HEAD') -TimeoutSeconds 20
  if (-not $aheadResult.timedOut -and $aheadResult.exitCode -eq 0) {
    [void][int]::TryParse($aheadResult.stdout.Trim(), [ref]$aheadCount)
  }

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
    $addResult = Invoke-Git -GitArgs @('add', '--', $articlesRelPath) -TimeoutSeconds 20
    if ($addResult.timedOut) { throw 'git add (data/articles.json) がタイムアウトしました。' }
    if ($addResult.exitCode -ne 0) { throw "git add (data/articles.json) に失敗しました: $($addResult.stderr)" }

    $commitResult = Invoke-Git -GitArgs @('commit', '-m', 'Update articles.json') -TimeoutSeconds 20
    if ($commitResult.timedOut) { throw 'git commit (data/articles.json) がタイムアウトしました。' }
    if ($commitResult.exitCode -ne 0) { throw "git commit (data/articles.json) に失敗しました: $($commitResult.stdout)$($commitResult.stderr)" }
    $committed = $true

    $hashResult = Invoke-Git -GitArgs @('rev-parse', '--short', 'HEAD') -TimeoutSeconds 10
    $commits += "Update articles.json ($($hashResult.stdout.Trim()))"
  }

  if ($relevant.ContainsKey($imageRelPath)) {
    $verb = if ($relevant[$imageRelPath].Trim() -eq '??') { 'Create' } else { 'Update' }
    $addResult = Invoke-Git -GitArgs @('add', '--', $imageRelPath) -TimeoutSeconds 20
    if ($addResult.timedOut) { throw 'git add (画像) がタイムアウトしました。' }
    if ($addResult.exitCode -ne 0) { throw "git add (画像) に失敗しました: $($addResult.stderr)" }

    $msg = "$verb $Id.png"
    $commitResult = Invoke-Git -GitArgs @('commit', '-m', $msg) -TimeoutSeconds 20
    if ($commitResult.timedOut) { throw 'git commit (画像) がタイムアウトしました。' }
    if ($commitResult.exitCode -ne 0) { throw "git commit (画像) に失敗しました: $($commitResult.stdout)$($commitResult.stderr)" }
    $committed = $true

    $hashResult = Invoke-Git -GitArgs @('rev-parse', '--short', 'HEAD') -TimeoutSeconds 10
    $commits += "$msg ($($hashResult.stdout.Trim()))"
  }

  $pushResult = Invoke-Git -GitArgs @('push') -TimeoutSeconds 90
  if ($pushResult.timedOut) {
    return [ordered]@{
      ok         = $false
      error      = 'コミットは完了しましたが、git push が90秒以内に終わらなかったため中断しました（ネットワークまたは認証待ちの可能性があります）。再度「GitHubへPush」を実行するか、手動で git push を行ってください。'
      committed  = $committed
      commits    = $commits
      pushed     = $false
      pushOutput = ''
    }
  }
  if ($pushResult.exitCode -ne 0) {
    return [ordered]@{
      ok         = $false
      error      = 'コミットは完了しましたが、pushに失敗しました。再度「GitHubへPush」を実行するか、手動で git push を行ってください。'
      committed  = $committed
      commits    = $commits
      pushed     = $false
      pushOutput = ($pushResult.stdout + $pushResult.stderr)
    }
  }

  return [ordered]@{
    ok         = $true
    committed  = $committed
    pushed     = $true
    commits    = $commits
    pushOutput = ($pushResult.stdout + $pushResult.stderr)
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
      if ($request.HttpMethod -eq 'GET' -and $request.Url.AbsolutePath -eq '/api/handoff-id-map') {
        # 制作引き継ぎ管理ID→正式記事IDの対応表を返す（ページ読み込み時にキャッシュするため）。
        try {
          Write-JsonResponse $response 200 @{ ok = $true; map = (Read-HandoffIdMap) }
        } catch {
          Write-JsonResponse $response 500 @{ ok = $false; error = $_.Exception.Message }
        }
      }
      elseif ($request.HttpMethod -eq 'GET') {
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

        $mode = if ($fields.PSObject.Properties['mode']) { [string]$fields.mode } else { 'handoff' }
        $promptText = if ($mode -eq 'original') {
          Build-OriginalGenerationPrompt $fields
        } elseif ($mode -eq 'cri') {
          Build-CriGenerationPrompt $fields
        } else {
          Build-GenerationPrompt $fields
        }
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
      elseif ($request.HttpMethod -eq 'POST' -and $request.Url.AbsolutePath -eq '/api/sync-en') {
        # 日英同期：日本語を正本として、変更のあった日英ペアだけを再同期する（STEP2の登録処理自体には触れない）。
        # 成功・失敗を問わず必ず有効なJSON（{ok:true,...} または {ok:false, error:...}）を返すよう、
        # このエンドポイント自身でtry/catchする（/api/register・/api/pushと同じ方針）。
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()

        try {
          $body = $bodyText | ConvertFrom-Json
          $dirtyPairs = @()
          if ($body.PSObject.Properties['dirtyPairs']) {
            $dirtyPairs = @($body.dirtyPairs | ForEach-Object { [string]$_ } | Where-Object { $_ })
          }

          if ($dirtyPairs.Count -eq 0) {
            Write-JsonResponse $response 400 @{ ok = $false; error = '同期対象のフィールドが指定されていません。' }
          } else {
            $promptText = Build-EnSyncPrompt -Fields $body.ja -DirtyPairs $dirtyPairs
            $schema = Build-EnSyncSchema -DirtyPairs $dirtyPairs
            $generated = Invoke-ClaudeGenerate -PromptText $promptText -Schema $schema

            Write-JsonResponse $response 200 @{ ok = $true; en = $generated }
          }
        } catch {
          Write-Host "英語同期エラー: $($_.Exception.Message)"
          Write-JsonResponse $response 500 @{ ok = $false; error = $_.Exception.Message }
        }
      }
      elseif ($request.HttpMethod -eq 'POST' -and $request.Url.AbsolutePath -eq '/api/register') {
        $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
        $bodyText = $reader.ReadToEnd()
        $reader.Close()

        $body = $bodyText | ConvertFrom-Json
        try {
          $managementId = if ($body.PSObject.Properties['managementId']) { [string]$body.managementId } else { '' }
          $result = Register-Article -ArticleJsonText ([string]$body.articleJson) -ImageDataUrl ([string]$body.imageDataUrl) -ManagementId $managementId
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
