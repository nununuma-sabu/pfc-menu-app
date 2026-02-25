# 入力バリデーション設計

ユーザーの入力データに対するバリデーション処理は、**フロントエンドとバックエンドの二層構造**で実装されています。

---

## 設計方針

フロントエンドのバリデーションはあくまで UX 向上のための即時フィードバックです。  
セキュリティ観点から、**バックエンドは常に独立してバリデーションを行い**、フロントエンドを信頼しません。

```
ユーザー操作
    │
    ▼
[フロントエンド] InputForm.tsx
    ├─ PFC合計 100% チェック
    ├─ 固定メニューのカロリー超過チェック
    └─ エラー表示 / Submitボタン無効化
    │
    ▼ (APIリクエスト送信)
    │
[バックエンド] route.ts (API Route)
    ├─ Zod スキーマによる型・範囲バリデーション
    ├─ ユーザー入力のサニタイズ（プロンプトインジェクション対策）
    └─ 固定メニューのカロリー超過チェック → 400エラー
```

---

## フロントエンド (`InputForm.tsx`)

### PFCバランス合計チェック

```ts
const totalRatio = pRatio + fRatio + cRatio;
const isInvalidTotal = totalRatio !== 100;
```

- P / F / C の合計が **ちょうど100%** でない場合、Submitを無効化しエラーを表示します。
- 入力は整数のみ許可（`e`, `E`, `+`, `-`, `.` キーを `onKeyDown` で抑制）。
- 先頭ゼロ除去のサニタイズ処理も施しています（例: `"05"` → `"5"`）。

### 固定メニューのカロリー超過チェック

```ts
const fixedCalories = fixedMeals.reduce((sum, fm) => {
    const recipe = FAVORITE_RECIPES.find(r => r.id === fm.recipeId);
    return sum + (recipe?.calories ?? 0);
}, 0);

const isCalorieExceeded = fixedMeals.length > 0 && fixedCalories >= targetCalories;
```

- 固定したレシピの合計カロリーが目標カロリー**以上**になった場合、Submitを無効化します。
- バックエンドの判定条件（`fixedCal >= calories`）と意図的に統一しています。
- エラーメッセージには具体的な数値（固定カロリー / 目標カロリー）を表示します。

---

## バックエンド (`route.ts` + `validation.ts`)

### Zod スキーマによる型・範囲バリデーション

`validation.ts` で定義された Zod スキーマによって、APIの入り口でリクエストボディを検証します。

```ts
export const generateMenuRequestSchema = z.object({
    calories: z.number().positive().max(10000),
    p: z.number().min(0).max(1000),
    f: z.number().min(0).max(1000),
    c: z.number().min(0).max(1000),
    mainIngredient: z.string().max(200).optional(),
    allergies: z.string().max(500).default(""),
    ...
    mealCount: z.number().int().min(1).max(10).default(3),
    days: z.number().int().min(1).max(14).default(3),
    fixedMeals: z.array(fixedMealSchema).max(10).optional().default([]),
});
```

- 型・正負・上限値のチェックを一元管理します。
- バリデーション失敗時は **400 Bad Request** を返します。
- フロントエンドをバイパスして直接リクエストされた場合も安全に処理します。

### 固定メニューのカロリー超過チェック

```ts
if (fixedMeals.length > 0 && fixedCal >= calories) {
    return NextResponse.json(
        { error: "固定メニューのカロリーが目標カロリー以上です。..." },
        { status: 400 }
    );
}
```

- フロントエンドと同じ条件で独立して検証します。
- APIを直接叩いた場合でも必ず弾かれます。

### ユーザー入力のサニタイズ

テキスト入力（食材名・アレルギーなど）は `sanitizeUserInput()` 関数でサニタイズされます。

- 制御文字の除去
- 改行をスペースに統一
- プロンプトインジェクションパターンの除去（`ignore previous instructions` 等）
- 最大200文字に切り詰め

詳細は [`security.md`](./security.md)（作成予定）を参照。

---

## エラーコードまとめ

| 状況 | ステータス | 発生箇所 |
|---|---|---|
| Zodバリデーション失敗 | `400` | バックエンド |
| 固定メニューカロリー超過 | `400` | バックエンド |
| APIキー未設定 | `500` | バックエンド |
| レート制限 (429) | `429` | バックエンド |
| その他のAPIエラー | `500` | バックエンド |
