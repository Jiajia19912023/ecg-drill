# ECG DRILL

医療者向けの12誘導心電図トレーニングアプリ(日本語・英語)。
手元の紙の記録やモニターの心電図と照らし合わせる「波形チェック」がメインで、練習・クイズはサブです。

- ログインなし。記録はその端末のブラウザ(localStorage)にだけ保存し、サーバーには送りません
- 無料・APIなし(AI機能なし)
- 心電図の波形は、今はプログラムで描いた模式的なサンプル(あとでPTB-XLの実波形に差し替え予定)

## 動かし方

```bash
npm install
npm run dev      # http://localhost:3000 (自動で /ja か /en に振り分け)
npm run build    # 本番用のビルド
```

## Vercelへの公開

1. このリポジトリをVercelの「Add New → Project」で読み込む
2. 設定はそのままで「Deploy」(Framework: Next.js が自動で選ばれる)
3. 環境変数は不要

## 言語

- `/ja` が日本語、`/en` が英語。`/` に来た人は、前回選んだ言語(cookie)→ブラウザの言語の順で振り分け(`src/proxy.ts`)
- 設定画面の「言語」で切り替え。記録は両方の言語で共通
- 文章はデータの中に `T('日本語', 'English')` の形で並べて書いてあります

## フォルダの構成

```
src/
  app/[lang]/        ページとレイアウト(/ja・/en)
  app/globals.css    スタイル(心電図用紙モチーフ・ダークモード)
  proxy.ts           言語の振り分け
  components/
    App.tsx          状態と操作・画面の切り替え
    AppCtx.tsx       状態の型と、各画面に渡す仕組み
    ecg.tsx          心電図の描画(方眼紙は実寸の比率:25mm/秒・10mm/mV)
    ui.tsx           アイコン・ヘッダー・メニューなど共通の部品
    Modals.tsx       拡大表示・説明のシート・トースト
    screens/         各画面(Home, Guide=波形チェック, Step, Quick, Quiz, ReviewList, Compare, Learn, Analysis, Settings, Splash)
  data/
    cases.ts         練習問題の12症例・判読ステップ・選択肢
    guide.ts         波形チェックの質問・見本の10症例・22の心電図の特徴
    diaginfo.ts      心電図をタップしたときの説明(原因・治療・薬の例・注意点・採血)
    readquiz.ts      心電図を読む問題(45問)
    knowledge.ts     基礎知識の問題(72問)
    learn.ts         「学ぶ」の動画・画像
  lib/
    engine.ts        波形の生成
    logic.ts         答え合わせ・解説・復習の予定
    store.ts         記録の保存(端末内)
    i18n.ts          言語の型とヘルパー
```

## よくある変更

- **「学ぶ」に動画・画像を入れる**:ファイルを `public/learn/` に置き、`src/data/learn.ts` の `src` にパス(例 `'/learn/heart.mp4'`)を書く
- **実波形(PTB-XL)に差し替える**:`src/lib/engine.ts` の `caseSig()` / `normSig()` が返す `sig`(誘導ごとの250Hz・10秒の配列、単位mV)を実データにする。出典の表示(CC BY 4.0)を忘れずに
- **復習の間隔**:`src/lib/store.ts` の `INTERVALS`(今は翌日→7日後→卒業)

## 公開前の確認(臨床監修)

- `src/data/diaginfo.ts` の治療・薬の例・採血の内容
- 英語版の薬の例は、日本でしか使われていない薬(ピルシカイニド、シベンゾリン、ニフェカラント、ランジオロールなど)を、北米などで一般的な薬に置き換えています
- 英語版の基礎知識 1-4(四肢電極の色)は、北米のAHA式を正解にした問題に変えています(日本語版は国内で一般的なIEC式)

## 根拠

AHA/ACCF/HRS Recommendations for the Standardization and Interpretation of the ECG, Part I–VI (2007, 2009) / Fourth Universal Definition of Myocardial Infarction (2018)

本アプリは教育目的です。診断や治療の判断には使わず、施設の手順と医師の判断に従ってください。
