# コードアシスト コーディング環境（WordPress・FLOCSS・スマホファースト）

Sass・JavaScript・画像圧縮・自動リロードが最初から入った、実務用のコーディング環境です。

## 動作環境

| | |
|---|---|
| Node.js | **20以上**（推奨：22 LTS） |
| Gulp | 5 |
| 対応OS | Windows / Mac（Intel・Apple Silicon 両対応） |

Node.jsが入っていない場合は https://nodejs.org/ja から **LTS版** をインストールしてください。

---

## 使い方

**講座の動画どおりの手順で動きます。**

```bash
cd gulp      # gulpフォルダに移動
npm i        # 1回だけ。必要なものをインストール
npx gulp     # 起動
```

止める時は **Control + C**。

> **先にLocalでWordPressを起動しておいてください。**
> `gulp/gulpfile.js` の `proxy: "http://localhost:10105/"` を、
> **ご自身のLocalのSite host（アドレス）に書き換えてから**起動してください。ここが違うと画面が出ません。

納品用に書き出すだけなら：
```bash
npx gulp build
npm run build:prod      # 納品用（ソースマップを出しません）
```

---

## フォルダの使い分け

| 書く場所 | 出力先 |
|---|---|
| `src/sass/` にSassを書く | → `WordPressTheme/assets/css/` |
| `src/js/` にJSを書く | → `WordPressTheme/assets/js/` |
| `src/images/` に画像を置く | → `WordPressTheme/assets/images/`（**圧縮＋WebP・AVIF**） |
| `WordPressTheme/` にPHPを書く | そのままテーマとして動きます |

**`WordPressTheme` フォルダが「テーマ本体」**です。これをWordPressのthemesに入れます。

---

## こんな時は（トラブルシュート）

### ❶ `npm i` でエラーが出て止まる
まず、ターミナルでこれを打ってください。
```
node -v
```
**v20 より小さい数字**（v14・v16 など）が出たら、それが原因です。
https://nodejs.org/ja から **LTS版**を入れ直してください。

> **Windowsで「Cannot create the directory ... already exists」と出た場合**
> 前に入れたNode.jsが残っています。
> ①設定→アプリ→Node.jsをアンインストール ②`C:\Program Files\nodejs` フォルダが残っていたら削除
> ③パソコンを再起動 ④インストーラーを**右クリック→管理者として実行**

それでもダメなら、`gulp/node_modules` フォルダを削除してから、もう一度 `npm i`。

### ❷ 黄色い文字がたくさん出る
**エラーではありません。**`npm warn deprecated ...` は「古い書き方だよ」というお知らせです。そのまま進んで大丈夫です。
**黄色＝警告（無視してOK）／赤＝エラー（対処が必要）**で見分けてください。

### ❸ ブラウザに変更が反映されない
1. ターミナルに緑の「✔ CSSを書き出しました」が出ていますか？
2. **VSCodeの拡張機能「Live Sass Compiler」「Live Server」をオフに**（これが一番多い原因です）
3. ブラウザをスーパーリロード（Win: `Ctrl+Shift+R` / Mac: `⌘+Shift+R`）

### ❹ 「gulp が見つかりません」と出る
`cd gulp` を打ち忘れています。**gulpフォルダの中**で打ってください。
今いる場所は `pwd`（Windowsは `cd`）で確認できます。

### ❺ 赤いエラーが出た
**Gulpは止まっていません。**直して保存すれば、自動でやり直します。
エラー文にファイル名と行番号が出ているので、そこを直してください。

### ❻ `gulpfile.js` を書き換えたのに反映されない
gulpfile.js だけは**変更後に再起動**が必要です。`Control + C` → もう一度起動。

### ❼ 課題を提出する時
**`node_modules` は必ず削除してから**ギガファイル便で送ってください（数百MBあります）。
gulpフォルダだけでなく、**プロジェクト全体**を送ってください。

---

## 他のテンプレートとの違い

コードアシストには、目的別に**5種類**のテンプレートがあります。

| テンプレート | 何ができる | どんな時に使う |
|---|---|---|
| **gulp-dev_static_FLOCSS_SPtoPC / PCtoSP** | Sass・JS・画像圧縮 | **講座で使う標準。まずはこれ** |
| **gulp-dev_WordPress_FLOCSS_SPtoPC / PCtoSP** | 上記＋WordPressテーマ用 | WordPress案件 |
| **gulp-dev_static_EJS** | 上記＋**ヘッダー等を1ファイルで管理** | ページ数が多い静的サイト |
| **gulp-dev_static_Pug** | 同上（書き方が違う） | Pugを使いたい人 |
| **astro-dev_static** | 最新の作り方。表示が速い | 実務で本格的に作る時 |

### いちばん大きな違いは「共通部分の管理」

ふつうのテンプレートだと、10ページあるサイトのヘッダーを直すには、**10個のHTMLを全部直す**必要があります。
EJS・Pug・Astro版なら、**1ファイル直すだけで全ページに反映**されます。

> **まずはこの標準テンプレートで学んでください。**
> EJS・Pug・Astroは、**WordPressまで終わった方**が、実務でページ数の多い案件を受けた時に使うものです。
> 使える方は使ってください。無理に切り替える必要はありません。

---

## クライアントへの説明（そのまま使えます）

技術名を出しても伝わりません。**相手の得になることだけ**を伝えます。

> 「**表示が速いつくり方**で制作します。ページの表示速度は、**Googleの評価**にも、**見た人が離脱するかどうか**にも影響します。」

> 「ヘッダーやフッターのような**共通部分は一箇所で管理**するので、後から『電話番号を変えたい』となった時に、**全ページへ一度で反映**できます。修正漏れが起きません。」（EJS/Pug/Astroの場合）

> 「書き出されるのは**通常のHTML・CSSファイル**です。特殊な仕組みに閉じ込めないので、将来どこに頼まれても引き継げます。」

---

## 中で使っているもの

| 役割 | 使用 |
|---|---|
| タスク管理 | Gulp 5 |
| Sass | dart-sass（最新） |
| CSS互換 | postcss-preset-env |
| CSS圧縮 | clean-css |
| JS圧縮 | uglify |
| 画像圧縮・WebP/AVIF変換 | **sharp**（インストールで失敗しません） |
| SVG圧縮 | svgo |
| 自動リロード | browser-sync 3 |

> 以前のバージョンで多かった「`npm i` が通らない」「Windowsで勝手にサブシステムが入る」という問題は、
> 画像圧縮の仕組みを **sharp** に変えたことで解消しています。
