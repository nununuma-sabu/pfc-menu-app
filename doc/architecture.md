# アーキテクチャ・設計ドキュメント

AI PFC Menu Generator の全体的なシステムアーキテクチャと、主要な技術要素（認証、ディレクトリ構成）についての技術文書です。

---

## 1. ディレクトリ構成

当面は **Next.js App Router** の標準的な構成に則り、以下のようなディレクトリ構造を採用しています。

```
src/
 ├─ app/                 # Next.js App Routerのルーティングと各ページのレイアウト・ページコンポーネント
 │   ├─ api/             # バックエンド API Routes (例: /api/generate-menu)
 │   ├─ login/           # ログインページ
 │   ├─ signup/          # サインアップページ
 │   ├─ auth/            # 認証コールバック用等のルーティング
 │   ├─ page.tsx         # メインのアプリケーション（入力〜献立表示）
 │   └─ layout.tsx       # 全体レイアウト（認証状態に応じたヘッダー表示等）
 │
 ├─ components/          # 再利用可能な UI コンポーネント (InputForm, MenuDisplay など)
 ├─ lib/                 # アプリケーション全体で使うユーティリティ・インフラ層
 │   ├─ supabase/        # Supabase クライアント実装 (Server, Client, Middleware 用)
 │   └─ env.ts           # 環境変数の検証ロジック
 │
 ├─ data/                # 静的データ (FAVORITE_RECIPES など)
 ├─ services/            # ドメインロジック（現時点では主に API 周り）
 ├─ types/               # TypeScript 型定義 (メニューの型など)
 └─ __tests__/           # 単体・結合テストの構成 (主に Vitestを使用)
```

この構成により、クライアント側の View (components) とバックエンド側のロジック (API/lib) が整理されています。

---

## 2. 認証機能 (Supabase)

PFC Menu Generator は **Supabase Auth (SSR対応)** を用いてユーザー認証（メール/パスワード登録・ログイン等）を行っています。

### 認証方式とセッション管理
*   **認証方式**: `@supabase/ssr` を使用した Cookie ベースの認証セッション管理を行っています。
*   **ログイン/サインアップ**: `src/app/login/page.tsx`, `src/app/signup/page.tsx` において、Supabaseを用いたセッション作成を行います。

### Supabase クライアントの使い分け (`src/lib/supabase/`)
Next.js App Routerの設計（SSR・RSCとクライアントコンポーネントの分離）に対応するため、実行環境に応じてSupabaseクライアントを明確に使い分けています。

1.  **Server クライアント (`server.ts`)**: Server Actions や Route Handlers (`app/api`配下) など、**サーバー側**でデータや認証状態を安全に取得するために使用します。Cookie への読み書き権限を持ちます。
2.  **Client クライアント (`client.ts`)**: Client Components (ブラウザ上) で使用します。クライアント側のCookieからセッション情報を読み取ります。
3.  **Middleware クライアント (`middleware.ts`)**: `src/middleware.ts` などの Next.js Middleware レイヤーで使用されます。すべてのリクエストに対して、最新の認証セッションの取得・Cookie の更新（リフレッシュトークン対応等）をエッジで実行します。

### データフローと保護されたルートへのアクセス
非ログインユーザーに対してもアプリケーションの主要機能は解放されるかもしれませんが、今後のデータベース連携等を見据え、認証状態 (`user` オブジェクト) を `layout.tsx` などで取得し、ユーザー情報に基づいたUIの出し分け等を行える状態に整備しています。

---

## 3. システムデータフロー（献立生成時）

代表的な「献立生成」のフローは以下のように連携します。

1. **[Client] InputForm**: ユーザーが設定内容を入力。フロントエンド側で基本的なバリデーション（`validation.md`参照）を実施し、API `/api/generate-menu` をコールする。
2. **[Middleware] Rate Limiter**: `/api/generate-menu` に対するリクエストを Upstash Redis を用いてレート制限確認。制限超過時は 429 エラーを即返却する。（DoS・過剰なAPI課金対策）
3. **[Server API] route.ts**: 受け取ったリクエストデータを Zod (`src/lib/validation.ts`) で検証。さらにプロンプトインジェクション対策のサニタイズ（`security.md`を参照）を実施する。
4. **[External] Gemini API**: 構成されたプロンプトと `responseSchema` を用いて、Gemini 2.0 Flash にリクエストを送り、構造化出力 (JSON) で献立データを受け取る。
5. **[Client] MenuDisplay**: クライアントに返却された JSON データを、React コンポーネントおよびグラフ (`PfcComparisonChart` 等) として描画する。
