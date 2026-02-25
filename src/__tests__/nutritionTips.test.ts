import { describe, it, expect } from "vitest";
import { nutritionTips } from "@/data/nutritionTips";

describe("nutritionTips データの整合性", () => {
    it("1件以上のデータが存在する", () => {
        expect(nutritionTips.length).toBeGreaterThan(0);
    });

    it("すべてのエントリが必須フィールドを持つ", () => {
        nutritionTips.forEach((tip, index) => {
            expect(tip.title, `tips[${index}].title が空`).toBeTruthy();
            expect(tip.content, `tips[${index}].content が空`).toBeTruthy();
            expect(tip.category, `tips[${index}].category が空`).toBeTruthy();
        });
    });

    it("タイトルが重複していない", () => {
        const titles = nutritionTips.map((t) => t.title);
        const uniqueTitles = new Set(titles);
        expect(uniqueTitles.size).toBe(titles.length);
    });

    it("コンテンツが空文字列でない", () => {
        nutritionTips.forEach((tip) => {
            expect(tip.content.trim().length).toBeGreaterThan(0);
        });
    });
});
