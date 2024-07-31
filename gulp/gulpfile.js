const { src, dest, watch, series, parallel } = require("gulp");

// 入出力先指定
const srcBase = '../src';
const themeName = "WordPressTheme"; // テーマフォルダ名と合わせる
const distBase = `../${themeName}`;
const srcPath = {
  css: [`${srcBase}/sass/**/*.scss`], // 'swiper-bundle.min.css'を除外
  img: srcBase + '/images/**/*',
  js: [`${srcBase}/js/**/*.js`, `!${srcBase}/js/swiper-bundle.min.js`], // 'swiper-bundle.min.js'を除外
  jsUnminified: `${srcBase}/js/swiper-bundle.min.js`
};
const distPath = {
  css: distBase + '/assets/css/',
  img: distBase + '/assets/images/',
  js: distBase + '/assets/js/',
  php: distBase + '/**/*.php',
};

// ローカルサーバー立ち上げ
const browserSync = require("browser-sync");
const browserSyncOption = {
  proxy: 'http://localhost:10105/', // LocalのSite hostを入れる
};
const browserSyncFunc = (done) => {
  browserSync.init(browserSyncOption);
  done();
};
const browserSyncReload = (done) => {
  browserSync.reload();
  done();
};

// Sassコンパイル
const sass = require('gulp-sass')(require('sass')); // sassコンパイル（DartSass対応）
const sassGlob = require('gulp-sass-glob-use-forward'); // globパターンを使用可にする
const plumber = require("gulp-plumber"); // エラーが発生しても強制終了させない
const notify = require("gulp-notify"); // エラー発生時のアラート出力
const postcss = require("gulp-postcss"); // PostCSS利用
const cssnext = require("postcss-cssnext"); // 最新CSS使用を先取り
const sourcemaps = require("gulp-sourcemaps"); // ソースマップ生成
const cleanCSS = require('gulp-clean-css'); // CSS圧縮
const rename = require('gulp-rename'); // ファイル名変更
const uglify = require('gulp-uglify'); // JavaScript圧縮
const browsers = [ // 対応ブラウザの指定
  'last 2 versions',
  '> 5%',
  'ie = 11',
  'not ie <= 10',
  'ios >= 8',
  'and_chr >= 5',
  'Android >= 5',
]

const cssSass = (done) => {
  src(srcPath.css)
    .pipe(sourcemaps.init()) // ソースマップの初期化
    .pipe(
      plumber({ // エラーが出ても処理を止めない
          errorHandler: notify.onError('Error:<%= error.message %>')
      }))
    .pipe(sassGlob()) // globパターンを使用可にする
    .pipe(sass.sync({ // sassコンパイル
      includePaths: ['src/sass'], // 相対パス省略
      outputStyle: 'expanded' // 出力形式をCSSの一般的な記法にする
    }))
    .pipe(postcss([cssnext({
      features: {
        rem: false
      }
    },browsers)])) // 最新CSS使用を先取り
    .pipe(sourcemaps.write('.')) // ソースマップの出力先をcssファイルから見たパスに指定
    .pipe(dest(distPath.css)) // 元のディレクトリに出力
    .pipe(cleanCSS({ compatibility: 'ie8', sourceMap: false })) // CSS圧縮、ソースマップを無効化
    .pipe(rename({ suffix: '.min' })) // 圧縮されたCSSのファイル名に`.min`を追加
    .pipe(dest(distPath.css)) // 圧縮されたCSSをassetsフォルダに出力
    .pipe(notify({ // エラー発生時のアラート出力
      message: 'Sassをココンパイルして圧縮したで〜！',
      onLast: true
    }));
  done();
}

// 画像圧縮
const imagemin = require("gulp-imagemin"); // 画像圧縮
const imageminMozjpeg = require("imagemin-mozjpeg"); // jpgの高圧縮に必要
const imageminPngquant = require("imagemin-pngquant"); // pngの高圧縮に必要
const imageminSvgo = require("imagemin-svgo");  // svgの高圧縮に必要
const webp = require('gulp-webp'); // WebPへの変換に必要
const imgImagemin = (done) => {
  src(srcPath.img)
    .pipe(imagemin([
      imageminMozjpeg({
        quality: 80
      }),
      imageminPngquant(),
      imageminSvgo({
        plugins: [{
          removeViewbox: false // viewBox属性を削除しない
        }]
      })
    ], {
      verbose: true
    }))
    .pipe(dest(distPath.img))
    .pipe(webp())
    .pipe(dest(distPath.img));
  done();
};

// JavaScript圧縮
const jsUglify = (done) => {
  src(srcPath.js)
    .pipe(plumber({
      errorHandler: notify.onError('Error:<%= error.message %>')
    }))
    .pipe(dest(distPath.js)) // 元のディレクトリに出力
    .pipe(uglify()) // JavaScript圧縮
    .pipe(rename({ suffix: '.min' })) // 圧縮されたJSのファイル名に`.min`を追加
    .pipe(dest(distPath.js)) // 圧縮されたJSをassetsフォルダに出力
    .pipe(notify({
      message: 'JavaScriptをコンパイルして圧縮したで〜！',
      onLast: true
    }));
  done();
};

// JavaScriptそのまま出力
const jsCopy = (done) => {
  src(srcPath.jsUnminified, { allowEmpty: true })
    .pipe(plumber({
      errorHandler: notify.onError('Error:<%= error.message %>')
    }))
    .pipe(dest(distPath.js))
    .pipe(notify({
      message: 'swiper-bundle.min.jsをコピーしたで！',
      onLast: true
    }));
  done();
};

// script.js を圧縮して script.min.js にするタスク
const jsCompress = (done) => {
  src(`${srcBase}/js/script.js`)
    .pipe(plumber({
      errorHandler: notify.onError('Error:<%= error.message %>')
    }))
    .pipe(dest(distPath.js)) // 元のディレクトリに出力
    .pipe(uglify()) // JavaScript圧縮
    .pipe(rename({ suffix: '.min' })) // 圧縮されたJSのファイル名に`.min`を追加
    .pipe(dest(distPath.js)) // 圧縮されたJSをassetsフォルダに出力
    .pipe(notify({
      message: 'script.js をコンパイルして圧縮したで〜！',
      onLast: true
    }));
  done();
};

// ファイルの変更を検知
const watchFiles = (done) => {
  watch(srcPath.css, series(cssSass, browserSyncReload));
  watch(srcPath.img, series(imgImagemin, browserSyncReload));
  watch(srcPath.js, series(jsCompress, browserSyncReload)); // script.js の変更を監視
  watch(srcPath.jsUnminified, series(jsCopy, browserSyncReload)); // 'swiper-bundle.min.js'の変更を監視
  watch(distPath.php, series(browserSyncReload));
  done();
};

// clean
const del = require('del');
const delPath = {
  css: `${distBase}/assets/css/**/*.css`,
  img: `${distBase}/assets/images/**/*`,
  js: `${distBase}/assets/js/**/*.js`
};
const clean = (done) => {
  del([delPath.css, `!${distBase}/assets/css/swiper-bundle.min.css`, delPath.img, delPath.js, `!${distBase}/assets/js/swiper-bundle.min.js`], { force: true });
  done();
};

// 実行
exports.default = series(clean, imgImagemin, cssSass, parallel(jsCompress, jsCopy), parallel(watchFiles, browserSyncFunc));
