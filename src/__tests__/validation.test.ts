import { describe, it, expect } from "vitest";
import { generateMenuRequestSchema } from "@/app/api/generate-menu/validation";

describe("generateMenuRequestSchema", () => {
    // ─── 正常ケース ───

    it("全フィールドが正しく指定されたリクエストを受け入れる", () => {
        const validData = {
            calories: 2000,
            p: 150,
            f: 60,
            c: 200,
            mainIngredient: "鶏むね肉",
            allergies: "えび",
            dislikedFoods: "パクチー",
            avoidFoods: "ナッツ類",
            mealCount: 3,
            days: 3,
            fixedMeals: [{ recipeId: "protein-smoothie", mealIndex: 0 }],
        };

        const result = generateMenuRequestSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.calories).toBe(2000);
            expect(result.data.p).toBe(150);
            expect(result.data.mealCount).toBe(3);
            expect(result.data.fixedMeals).toHaveLength(1);
        }
    });

    it("省略可能フィールドが未指定の場合、デフォルト値が適用される", () => {
        const minimalData = {
            calories: 1800,
            p: 100,
            f: 50,
            c: 200,
        };

        const result = generateMenuRequestSchema.safeParse(minimalData);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.allergies).toBe("");
            expect(result.data.dislikedFoods).toBe("");
            expect(result.data.avoidFoods).toBe("");
            expect(result.data.mealCount).toBe(3);
            expect(result.data.days).toBe(3);
            expect(result.data.fixedMeals).toEqual([]);
        }
    });

    // ─── 異常ケース: 型の不一致 ───

    it("calories が文字列の場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: "二千",
            p: 100,
            f: 50,
            c: 200,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            expect(fieldErrors.calories).toBeDefined();
        }
    });

    it("p が文字列の場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: 2000,
            p: "百",
            f: 50,
            c: 200,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.p).toBeDefined();
        }
    });

    // ─── 異常ケース: 範囲外 ───

    it("calories が 0 の場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: 0,
            p: 100,
            f: 50,
            c: 200,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it("calories が負の値の場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: -500,
            p: 100,
            f: 50,
            c: 200,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it("mealCount が負の値(-1)の場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: 2000,
            p: 100,
            f: 50,
            c: 200,
            mealCount: -1,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.mealCount).toBeDefined();
        }
    });

    it("calories が上限(10000)を超えた場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: 99999,
            p: 100,
            f: 50,
            c: 200,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it("days が上限(14)を超えた場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: 2000,
            p: 100,
            f: 50,
            c: 200,
            days: 100,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.days).toBeDefined();
        }
    });

    it("mealCount が小数の場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: 2000,
            p: 100,
            f: 50,
            c: 200,
            mealCount: 2.5,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    // ─── 異常ケース: 必須フィールドの欠落 ───

    it("必須フィールド(calories)が欠落している場合、バリデーションに失敗する", () => {
        const invalidData = {
            p: 100,
            f: 50,
            c: 200,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.flatten().fieldErrors.calories).toBeDefined();
        }
    });

    it("全ての栄養素フィールドが欠落している場合、バリデーションに失敗する", () => {
        const invalidData = {
            mealCount: 3,
            days: 3,
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            expect(fieldErrors.calories).toBeDefined();
            expect(fieldErrors.p).toBeDefined();
            expect(fieldErrors.f).toBeDefined();
            expect(fieldErrors.c).toBeDefined();
        }
    });

    // ─── 異常ケース: fixedMeals の不正 ───

    it("fixedMeals の mealIndex が負の値の場合、バリデーションに失敗する", () => {
        const invalidData = {
            calories: 2000,
            p: 100,
            f: 50,
            c: 200,
            fixedMeals: [{ recipeId: "protein-smoothie", mealIndex: -1 }],
        };

        const result = generateMenuRequestSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    // ─── エッジケース ───

    it("境界値（最小有効値）を受け入れる", () => {
        const edgeData = {
            calories: 0.1,
            p: 0,
            f: 0,
            c: 0,
            mealCount: 1,
            days: 1,
        };

        const result = generateMenuRequestSchema.safeParse(edgeData);
        expect(result.success).toBe(true);
    });

    it("境界値（最大有効値）を受け入れる", () => {
        const edgeData = {
            calories: 10000,
            p: 1000,
            f: 1000,
            c: 1000,
            mealCount: 10,
            days: 14,
        };

        const result = generateMenuRequestSchema.safeParse(edgeData);
        expect(result.success).toBe(true);
    });

    it("空オブジェクトの場合、バリデーションに失敗する", () => {
        const result = generateMenuRequestSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it("null の場合、バリデーションに失敗する", () => {
        const result = generateMenuRequestSchema.safeParse(null);
        expect(result.success).toBe(false);
    });

    it("配列の場合、バリデーションに失敗する", () => {
        const result = generateMenuRequestSchema.safeParse([1, 2, 3]);
        expect(result.success).toBe(false);
    });
});
