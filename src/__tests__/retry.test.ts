import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callGeminiWithRetry } from "@/services/geminiService";
import type { GenerativeModel } from "@google/generative-ai";
import type { MenuData } from "@/types/menu";

// テスト用のモックMenuData
const mockMenuData: MenuData = {
    days: [
        {
            dayLabel: "1日目",
            meals: [
                {
                    name: "焼き鮭定食",
                    timeLabel: "朝食",
                    calories: 450,
                    p: 30,
                    f: 15,
                    c: 50,
                    description: "バランスの良い朝食",
                    ingredients: [{ name: "鮭", amount: "1切れ" }],
                    steps: ["鮭を焼く"],
                },
            ],
            total: { calories: 450, p: 30, f: 15, c: 50 },
        },
    ],
    shoppingList: [{ name: "鮭", amount: "1切れ", category: "肉魚" }],
    grandTotal: { calories: 450, p: 30, f: 15, c: 50 },
};

/**
 * GenerativeModel のモックを作成するヘルパー
 */
function createMockModel(responses: Array<{ success: boolean; data?: MenuData; error?: Error }>): GenerativeModel {
    let callCount = 0;
    return {
        generateContent: vi.fn(async () => {
            const resp = responses[callCount++];
            if (!resp || !resp.success) {
                throw resp?.error ?? new Error("Mock API Error");
            }
            return {
                response: {
                    text: () => JSON.stringify(resp.data),
                },
            };
        }),
    } as unknown as GenerativeModel;
}

describe("callGeminiWithRetry", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("1回目で成功するケース", async () => {
        const model = createMockModel([{ success: true, data: mockMenuData }]);

        const result = await callGeminiWithRetry(model, "test prompt", 3);

        expect(result).toEqual(mockMenuData);
        expect(model.generateContent).toHaveBeenCalledTimes(1);
    });

    it("1回目失敗、2回目で成功するケース", async () => {
        const model = createMockModel([
            { success: false, error: new Error("Temporary failure") },
            { success: true, data: mockMenuData },
        ]);

        // vi.useFakeTimersを使うとsetTimeoutベースのdelayがブロックされるため
        // リアルタイマーを使用してリトライの動作を検証
        vi.useRealTimers();

        const result = await callGeminiWithRetry(model, "test prompt", 3);

        expect(result).toEqual(mockMenuData);
        expect(model.generateContent).toHaveBeenCalledTimes(2);
    });

    it("全リトライ失敗するケース", async () => {
        const model = createMockModel([
            { success: false, error: new Error("Error 1") },
            { success: false, error: new Error("Error 2") },
            { success: false, error: new Error("Error 3") },
        ]);

        vi.useRealTimers();

        await expect(callGeminiWithRetry(model, "test prompt", 3)).rejects.toThrow("Error 3");
        expect(model.generateContent).toHaveBeenCalledTimes(3);
    });

    it("JSONパースエラーでもリトライされる", async () => {
        let callCount = 0;
        const model = {
            generateContent: vi.fn(async () => {
                callCount++;
                if (callCount === 1) {
                    // 不正なJSON
                    return {
                        response: {
                            text: () => "not valid json {{{",
                        },
                    };
                }
                // 2回目は正常
                return {
                    response: {
                        text: () => JSON.stringify(mockMenuData),
                    },
                };
            }),
        } as unknown as GenerativeModel;

        vi.useRealTimers();

        const result = await callGeminiWithRetry(model, "test prompt", 3);

        expect(result).toEqual(mockMenuData);
        expect(model.generateContent).toHaveBeenCalledTimes(2);
    });

    it("maxRetries=1 の場合、リトライしない", async () => {
        const model = createMockModel([
            { success: false, error: new Error("Fail") },
        ]);

        vi.useRealTimers();

        await expect(callGeminiWithRetry(model, "test prompt", 1)).rejects.toThrow("Fail");
        expect(model.generateContent).toHaveBeenCalledTimes(1);
    });
});
