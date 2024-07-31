# gulp-dev_WordPress_flocss_SPtoPC

## 動作が確認できている環境
- Nodeバージョン v14.16.0
- Gulp 4系

## 使い方
- gulp-dev_WordPress_FLOCSS_SPtoPCフォルダの中身を、WordPress環境のapp/public/wp-content/themes直下に配置する
- themesフォルダをvscodeで開く
- WordPressThemeフォルダを任意のフォルダ名に変更する
- gulpfile.jsの5行目のWordPressThemeの部分を上の手順で変更したフォルダ名に変更する
- gulpfile.jsの23行目にLocalのURLを記載する
- style.cssの中身を任意の内容に変更する
- ターミナルを開き、「 cd gulp 」とコマンドを入力する
- ターミナルを開き、「 npm i 」とコマンドを入力する
- gulpフォルダ直下に、node_modulesとpackage-lock.jsonが生成されるのを確認する
- 「 npx gulp 」とコマンドを入力するとgulpが動き出す

## 作業ディレクトリ
- sass・jsの記述はsrcフォルダの中で行う
- 画像はsrcフォルダのimagesの中に格納する
- コンパイルされたCSS・jsと圧縮された画像はWordPressTheme/assetsフォルダの中に出力される
- phpはWordPressTheme直下のphpファイルに直接記述する

## 備考
- CSS設計はFLOCSS( https://github.com/hiloki/flocss )を採用
- スマホファースト
- rem記述を前提
