# 開発TODO

## バックエンド・インフラ
- [ ] 本番デプロイ前にSupabase環境変数のモックフォールバック（`https://mock.supabase.co` など）を外す、または本番環境でのみエラーとするようにする。
  - 対象ファイル: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`
