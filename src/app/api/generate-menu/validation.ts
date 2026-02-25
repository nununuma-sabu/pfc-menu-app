import { z } from "zod";

// ─────────────────────────────────────────────
// リクエストバリデーションスキーマ (Zod)
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
    calories: z.number().positive({ message: "カロリーは正の値である必要があります" }).max(10000, { message: "カロリーは10000以下にしてください" }),
    p: z.number().min(0, { message: "タンパク質は0以上である必要があります" }).max(1000, { message: "タンパク質は1000g以下にしてください" }),
    f: z.number().min(0, { message: "脂質は0以上である必要があります" }).max(1000, { message: "脂質は1000g以下にしてください" }),
    c: z.number().min(0, { message: "炭水化物は0以上である必要があります" }).max(1000, { message: "炭水化物は1000g以下にしてください" }),
    mainIngredient: z.string().max(200).optional(),
    allergies: z.string().max(500).default(""),
    dislikedFoods: z.string().max(500).default(""),
    avoidFoods: z.string().max(500).default(""),
    mealCount: z.number().int({ message: "食事回数は整数である必要があります" }).min(1, { message: "食事回数は1以上にしてください" }).max(10, { message: "食事回数は10以下にしてください" }).default(3),
    days: z.number().int({ message: "日数は整数である必要があります" }).min(1, { message: "日数は1以上にしてください" }).max(14, { message: "日数は14以下にしてください" }).default(3),
    fixedMeals: z.array(fixedMealSchema).max(10).optional().default([]),
});

export type ValidatedMenuRequest = z.infer<typeof generateMenuRequestSchema>;
