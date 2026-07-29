/**
 * コードアシスト コーディング環境 v2（WordPress・SPファースト）
 * ------------------------------------------------------------
 * フォルダ構成・出力・タスクは今まで通りです。中身だけ最新にしました。
 *
 * 変更点（動かない問題への対策）
 *   - Gulp 5 / Node 20〜24 対応
 *   - 画像圧縮を imagemin系 → sharp / svgo に変更（npm i で失敗しなくなります）
 *   - postcss-cssnext（開発終了）→ postcss-preset-env
 *   - 通知(gulp-notify)を廃止（環境によってエラーになるため）→ ターミナルに表示
 *   - del を廃止（Node標準の fs で削除）
 *   - エラーが出ても watch が止まりません
 *   - 画像は変更したものだけ処理（差分ビルド）
 *   - WebP に加えて AVIF も出力
 */
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  console.log("\n\x1b[31m【重要】Node.js のバージョンが古いです（現在 v" + process.versions.node + "）\x1b[0m");
  console.log("この環境は Node.js 20以上で動きます。https://nodejs.org/ja から LTS版 を入れ直してください。\n");
  process.exit(1);
}

const { src, dest, watch, series, parallel } = require("gulp");
const fs = require("node:fs");
const path = require("node:path");

// ------------------------------------------------------------
// 入出力先（今まで通り）
// ------------------------------------------------------------
const srcBase = "../src";
const themeName = "WordPressTheme"; // テーマフォルダ名と合わせる
const distBase = `../${themeName}`;
const srcPath = {
  css: `${srcBase}/sass/**/*.scss`,
  img: `${srcBase}/images/**/*`,
  js: [
    `${srcBase}/js/**/*.js`,
    `!${srcBase}/js/swiper-bundle.min.js`,
    `!${srcBase}/js/**/swiper-bundle.min.min.js`,
  ],
  jsUnminified: `${srcBase}/js/swiper-bundle.min.js`,
};
const distPath = {
  css: `${distBase}/assets/css/`,
  img: `${distBase}/assets/images/`,
  js: `${distBase}/assets/js/`,
  php: `${distBase}/**/*.php`,
};

// ------------------------------------------------------------
// ログとエラー処理（エラーが出ても止まりません）
// ------------------------------------------------------------
const C = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", gray: "\x1b[90m", reset: "\x1b[0m" };
const log = (m) => console.log(`${C.green}✔${C.reset} ${m}`);
const warn = (m) => console.log(`${C.yellow}!${C.reset} ${m}`);
const onError = function (err) {
  const m = (err && err.message ? err.message : String(err)).trim();
  console.log(`\n${C.red}────────────── エラー ──────────────${C.reset}`);
  console.log(m);
  console.log(`${C.gray}※ 直して保存すれば、自動でやり直します。gulpは動いたままです。${C.reset}`);
  console.log(`${C.red}────────────────────────────────────${C.reset}\n`);
  this.emit("end");
};

// ------------------------------------------------------------
// ローカルサーバー
// ------------------------------------------------------------
const browserSync = require("browser-sync");
const browserSyncFunc = (done) => { browserSync.init({ proxy: "http://localhost:10105/", notify: false }); done(); };
const browserSyncReload = (done) => { browserSync.reload(); done(); };

// ------------------------------------------------------------
// Sass → CSS
// ------------------------------------------------------------
const sass = require("gulp-sass")(require("sass"));
const sassGlob = require("gulp-sass-glob-use-forward");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const postcssPresetEnv = require("postcss-preset-env");
const sourcemaps = require("gulp-sourcemaps");
const cleanCSS = require("gulp-clean-css");
const rename = require("gulp-rename");
const uglify = require("gulp-uglify");

const isProd = process.env.NODE_ENV === "production";
const sassOptions = { style: "expanded", silenceDeprecations: ["legacy-js-api", "import", "global-builtin"] };
const postcssPlugins = [postcssPresetEnv({ stage: 2, features: { "custom-properties": false } })];

const cssSass = () => {
  const s = src(srcPath.css).pipe(plumber({ errorHandler: onError }));
  if (isProd) {
    return s.pipe(sassGlob()).pipe(sass(sassOptions)).pipe(postcss(postcssPlugins))
      .pipe(dest(distPath.css)).on("end", () => log("CSSを書き出しました（納品用・ソースマップなし）"));
  }
  return s.pipe(sourcemaps.init()).pipe(sassGlob()).pipe(sass(sassOptions)).pipe(postcss(postcssPlugins))
    .pipe(sourcemaps.write("./")).pipe(dest(distPath.css))
    .on("end", () => log("CSSを書き出しました"));
};

const cssMin = () => {
  return src(srcPath.css)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sassGlob())
    .pipe(sass(sassOptions))
    .pipe(postcss(postcssPlugins))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest(distPath.css))
    .on("end", () => log("CSSを圧縮しました（.min.css）"));
};

// ------------------------------------------------------------
// 画像：圧縮 ＋ WebP / AVIF 生成（sharp・svgo／ネイティブビルド不要）
// ------------------------------------------------------------
const sharp = require("sharp");
const { optimize: svgoOptimize } = require("svgo");
const IMG_SRC = path.resolve(__dirname, srcBase, "images");
const IMG_DIST = path.resolve(__dirname, distBase, "assets", "images");

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
};
const isNewer = (a, b) => { try { return fs.statSync(a).mtimeMs > fs.statSync(b).mtimeMs; } catch { return true; } };

const imgImagemin = async () => {
  const files = walk(IMG_SRC);
  if (!files.length) { warn("src/images が空です"); return; }
  let done = 0, skipped = 0;
  for (const file of files) {
    const rel = path.relative(IMG_SRC, file);
    const out = path.join(IMG_DIST, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const ext = path.extname(file).toLowerCase();
    if (!isNewer(file, out)) { skipped++; continue; }
    try {
      if (ext === ".svg") {
        fs.writeFileSync(out, svgoOptimize(fs.readFileSync(file, "utf8"), { multipass: true }).data);
      } else if ([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff", ".gif"].includes(ext)) {
        const img = sharp(file);
        if (ext === ".jpg" || ext === ".jpeg") await img.jpeg({ quality: 80, mozjpeg: true }).toFile(out);
        else if (ext === ".png") await img.png({ quality: 80, compressionLevel: 9 }).toFile(out);
        else await img.toFile(out);
        const base = out.replace(/\.[^.]+$/, "");
        await sharp(file).webp({ quality: 80 }).toFile(base + ".webp");
        if (ext !== ".gif") await sharp(file).avif({ quality: 55 }).toFile(base + ".avif");
      } else {
        fs.copyFileSync(file, out);
      }
      done++;
    } catch (e) {
      warn(`画像 ${rel} は処理できませんでした（${e.message}）— 他の画像は続けます`);
    }
  }
  log(`画像 ${done}件を圧縮＋WebP/AVIF化${skipped ? `（変更なし ${skipped}件はスキップ）` : ""}`);
};

// ------------------------------------------------------------
// JavaScript
// ------------------------------------------------------------
const jsUglify = () => {
  return src(srcPath.js, { allowEmpty: true })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(dest(distPath.js))
    .pipe(uglify())
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest(distPath.js))
    .on("end", () => log("JavaScriptを書き出しました"));
};

const jsCopy = () => {
  return src(srcPath.jsUnminified, { allowEmpty: true })
    .pipe(plumber({ errorHandler: onError }))
    .pipe(dest(distPath.js));
};

// ------------------------------------------------------------
// 出力先の掃除
// ------------------------------------------------------------
const KEEP = ["swiper-bundle.min.css", "swiper-bundle.min.js", "swiper-bundle.min.min.js"];
const cleanDir = (absDir, filter) => {
  if (!fs.existsSync(absDir)) return;
  for (const f of walk(absDir)) {
    const name = path.basename(f);
    if (KEEP.includes(name)) continue;
    if (filter && !filter(name)) continue;
    try { fs.rmSync(f); } catch (_) {}
  }
};
const clean = (done) => {
  cleanDir(path.resolve(__dirname, distPath.css), (n) => n.endsWith(".css") || n.endsWith(".css.map"));
  cleanDir(path.resolve(__dirname, distPath.js), (n) => n.endsWith(".js") || n.endsWith(".js.map"));
  cleanDir(IMG_DIST);
  done();
};

// ------------------------------------------------------------
// 起動時の自己診断
// ------------------------------------------------------------
const doctor = (done) => {
  for (const [rel, label] of [["sass", "src/sass"], ["js", "src/js"], ["images", "src/images"]]) {
    const abs = path.resolve(__dirname, srcBase, rel);
    if (!fs.existsSync(abs)) { fs.mkdirSync(abs, { recursive: true }); warn(`${label} が無かったので作りました`); }
  }
  console.log(`${C.gray}Node.js v${process.versions.node} / Gulp 5${C.reset}`);
  console.log(`${C.gray}※ VSCodeの拡張機能「Live Sass Compiler」「Live Server」はオフにしてください（Gulpとぶつかります）${C.reset}`);
  done();
};

// ------------------------------------------------------------
// 監視
// ------------------------------------------------------------
const watchOpt = { events: ["add", "change", "unlink"], ignoreInitial: true, delay: 150 };
const watchFiles = (done) => {
  watch(srcPath.css, watchOpt, series(cssSass, cssMin, browserSyncReload));
  watch(srcPath.img, watchOpt, series(imgImagemin, browserSyncReload));
  watch(srcPath.js, watchOpt, series(jsUglify, browserSyncReload));
  watch(srcPath.jsUnminified, watchOpt, series(jsCopy, browserSyncReload));
  watch(distPath.php, watchOpt, series(browserSyncReload));
  console.log(`\n${C.green}見張り中です。ファイルを保存すると自動で反映されます。${C.reset}`);
  console.log(`${C.gray}止める時は Control + C${C.reset}\n`);
  done();
};

exports.doctor = doctor;
exports.build = series(doctor, clean, imgImagemin, cssSass, cssMin, jsUglify, jsCopy);
exports.default = series(doctor, clean, imgImagemin, cssSass, cssMin, jsUglify, jsCopy,
  parallel(watchFiles, browserSyncFunc));
