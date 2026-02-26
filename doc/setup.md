# 開発・セットアップガイド

## 技術スタック
*   Next.js (App Router)
*   Tailwind CSS
*   Google Gemini API
*   Vercel

## セットアップ (APIキーについて)
このアプリを使用するには **Google Gemini APIキー** が必要です。
1.  [Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを取得してください。
2.  プロジェクトルートに `.env.local` ファイルを作成し、以下のように設定します。
    ```bash
    GEMINI_API_KEY=あなたのAPIキー
    ```
    ※ `.env.local` はGitにはアップロードされないので安心してください。

## デプロイ時の注意点
Vercelなどのホスティングサービスにデプロイする場合、**環境変数 (Environment Variables) の設定が別途必要**です。
`.env.local` はアップロードされないため、Vercelのダッシュボード等で `GEMINI_API_KEY` を直接設定してください。
