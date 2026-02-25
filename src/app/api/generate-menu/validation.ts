import { z } from "zod";

// ─────────────────────────────────────────────
// リクエストバリデーションスキーマ (Zod v4)
// ─────────────────────────────────────────────

const fixedMealSchema = z.object({
    recipeId: z.string(),
    mealIndex: z.number().int().min(0),
});

/**
 * GenerateMenuRequest のランタイムバリデーションスキーマ。
 * TypeScript の型定義では防げない不正なリクエスト（文字列の数値、
 * 負の値、範囲外の値など）をAPIの入り口で検出し、400エラーを返す。
 */
export const generateMenuRequestSchema = z.object({
    calories: z.number().positive().max(10000),
    p: z.number().min(0).max(1000),
    f: z.number().min(0).max(1000),
    c: z.number().min(0).max(1000),
    mainIngredient: z.string().max(200).optional(),
    allergies: z.string().max(500).default(""),
    dislikedFoods: z.string().max(500).default(""),
    avoidFoods: z.string().max(500).default(""),
    mealCount: z.number().int().min(1).max(10).default(3),
    days: z.number().int().min(1).max(14).default(3),
    fixedMeals: z.array(fixedMealSchema).max(10).optional().default([]),
});

export type ValidatedMenuRequest = z.infer<typeof generateMenuRequestSchema>;
