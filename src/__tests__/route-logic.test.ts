import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import {
    normalizeItemName,
    parseAmount,
    mergeShoppingList,
} from "@/services/geminiService";
import type { ShoppingListItem } from "@/types/menu";
import { POST } from "@/app/api/generate-menu/route";

const mockLimit = vi.fn();

// --- モック設定 ---

vi.mock("@upstash/ratelimit", () => {
    function MockRatelimit() {
        return { limit: mockLimit };
    }
    MockRatelimit.slidingWindow = vi.fn().mockReturnValue("sliding-window-limiter");
    return { Ratelimit: MockRatelimit };
});

vi.mock("@upstash/redis", () => ({
    Redis: {
        fromEnv: vi.fn().mockReturnValue({}),
    },
}));

vi.mock("@/services/geminiService", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/geminiService")>();
    return {
        ...actual,
        generateMenu: vi.fn().mockResolvedValue({
            menus: [],
            shoppingList: [],
            totals: { calories: 0, protein: 0, fat: 0, carbs: 0 }
        }),
    };
});

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: () => mockGetUser(),
        },
    }),
}));

const mockData = {
    calories: 2000,
    p: 150,
    f: 50,
    c: 200,
    mealCount: 3,
};

// ─── normalizeItemName ───

describe("normalizeItemName", () => {
    it("半角スペースを除去する", () => {
        expect(normalizeItemName("冷凍 バナナ")).toBe("冷凍バナナ");
    });

    it("全角スペースを除去する", () => {
        expect(normalizeItemName("冷凍　バナナ")).toBe("冷凍バナナ");
    });

    it("前後の空白を除去する", () => {
        expect(normalizeItemName("  鶏むね肉  ")).toBe("鶏むね肉");
    });

    it("スペースが混在している場合もすべて除去する", () => {
        expect(normalizeItemName(" 冷凍 　ミックス ベリー ")).toBe("冷凍ミックスベリー");
    });

    it("空文字列はそのまま返す", () => {
        expect(normalizeItemName("")).toBe("");
    });
});

// ─── parseAmount ───

describe("parseAmount", () => {
    it("数値+単位をパースする (100g)", () => {
        const result = parseAmount("100g");
        expect(result).toEqual({ value: 100, unit: "g" });
    });

    it("小数点を含む数値をパースする (0.5kg)", () => {
        const result = parseAmount("0.5kg");
        expect(result).toEqual({ value: 0.5, unit: "kg" });
    });

    it("数値と単位の間にスペースがある場合もパースする (30 g)", () => {
        const result = parseAmount("30 g");
        expect(result).toEqual({ value: 30, unit: "g" });
    });

    it("日本語の単位をパースする (1本)", () => {
        const result = parseAmount("1本");
        expect(result).toEqual({ value: 1, unit: "本" });
    });

    it("大さじ表記をパースする (大さじ1)", () => {
        // 数値が先頭に来ない場合はパース不可
        const result = parseAmount("大さじ1");
        expect(result).toBeNull();
    });

    it("数値がない文字列はnullを返す", () => {
        expect(parseAmount("少々")).toBeNull();
    });

    it("空文字列はnullを返す", () => {
        expect(parseAmount("")).toBeNull();
    });
});

// ─── mergeShoppingList ───

describe("mergeShoppingList", () => {
    it("同じ食材・同じ単位の場合、数値を合算する", () => {
        const existing: ShoppingListItem[] = [
            { name: "鶏むね肉", amount: "200g", category: "肉魚" },
        ];
        const additions: ShoppingListItem[] = [
            { name: "鶏むね肉", amount: "100g", category: "肉魚" },
        ];

        const result = mergeShoppingList(existing, additions);
        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe("300g");
    });

    it("multiplierが適用される (3日分)", () => {
        const existing: ShoppingListItem[] = [
            { name: "鮭", amount: "100g", category: "肉魚" },
        ];
        const additions: ShoppingListItem[] = [
            { name: "鮭", amount: "50g", category: "肉魚" },
        ];

        const result = mergeShoppingList(existing, additions, 3);
        expect(result).toHaveLength(1);
        // 100 + 50*3 = 250
        expect(result[0].amount).toBe("250g");
    });

    it("食材名の表記揺れ（スペース違い）を同一と判定する", () => {
        const existing: ShoppingListItem[] = [
            { name: "冷凍バナナ", amount: "1本", category: "野菜" },
        ];
        const additions: ShoppingListItem[] = [
            { name: "冷凍 バナナ", amount: "1本", category: "野菜" },
        ];

        const result = mergeShoppingList(existing, additions);
        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe("2本");
    });

    it("単位が異なる場合、並記する", () => {
        const existing: ShoppingListItem[] = [
            { name: "トマト", amount: "2個", category: "野菜" },
        ];
        const additions: ShoppingListItem[] = [
            { name: "トマト", amount: "100g", category: "野菜" },
        ];

        const result = mergeShoppingList(existing, additions);
        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe("2個 + 100g");
    });

    it("パース不可能な分量は並記する", () => {
        const existing: ShoppingListItem[] = [
            { name: "塩", amount: "少々", category: "乾物調味料" },
        ];
        const additions: ShoppingListItem[] = [
            { name: "塩", amount: "適量", category: "乾物調味料" },
        ];

        const result = mergeShoppingList(existing, additions);
        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe("少々 + 適量");
    });

    it("新規食材はリストに追加される", () => {
        const existing: ShoppingListItem[] = [
            { name: "鶏むね肉", amount: "200g", category: "肉魚" },
        ];
        const additions: ShoppingListItem[] = [
            { name: "ブロッコリー", amount: "1株", category: "野菜" },
        ];

        const result = mergeShoppingList(existing, additions);
        expect(result).toHaveLength(2);
        expect(result[1].name).toBe("ブロッコリー");
        expect(result[1].amount).toBe("1株");
    });

    it("新規食材にmultiplierが適用される（パース可能な場合）", () => {
        const existing: ShoppingListItem[] = [];
        const additions: ShoppingListItem[] = [
            { name: "冷凍ミックスベリー", amount: "100g", category: "野菜" },
        ];

        const result = mergeShoppingList(existing, additions, 3);
        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe("300g");
    });

    it("新規食材にmultiplierが適用される（パース不可の場合）", () => {
        const existing: ShoppingListItem[] = [];
        const additions: ShoppingListItem[] = [
            { name: "イヌリン", amount: "大さじ1", category: "乾物調味料" },
        ];

        const result = mergeShoppingList(existing, additions, 3);
        expect(result).toHaveLength(1);
        expect(result[0].amount).toBe("大さじ1 x 3日分");
    });

    it("既存リストを変更せず新しい配列を返す（イミュータブル）", () => {
        const existing: ShoppingListItem[] = [
            { name: "鶏むね肉", amount: "200g", category: "肉魚" },
        ];
        const additions: ShoppingListItem[] = [
            { name: "鶏むね肉", amount: "100g", category: "肉魚" },
        ];

        const result = mergeShoppingList(existing, additions);
        expect(result[0].amount).toBe("300g");
        // 元の配列は変更されていない
        expect(existing[0].amount).toBe("200g");
    });

    it("空の追加リストの場合、既存リストのコピーを返す", () => {
        const existing: ShoppingListItem[] = [
            { name: "鶏むね肉", amount: "200g", category: "肉魚" },
        ];

        const result = mergeShoppingList(existing, []);
        expect(result).toEqual(existing);
    });
});

// ─── API Route POST (Rate Limiting) ───

describe("POST /api/generate-menu", () => {
    const ORIGINAL_URL = process.env.UPSTASH_REDIS_REST_URL;
    const ORIGINAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
        process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    });

    afterAll(() => {
        process.env.UPSTASH_REDIS_REST_URL = ORIGINAL_URL;
        process.env.UPSTASH_REDIS_REST_TOKEN = ORIGINAL_TOKEN;
    });

    function createRequest(body: Record<string, unknown> = mockData) {
        return new Request("http://localhost/api/generate-menu", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    it("レートリミット超過時は429ステータスとRetry-Afterヘッダーを返す", async () => {
        // 認証成功のモック
        mockGetUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
        // レートリミット超過のモック
        mockLimit.mockResolvedValue({
            success: false,
            limit: 30,
            remaining: 0,
            reset: Date.now() + 60000,
        });

        const req = createRequest();
        const res = await POST(req);

        expect(res.status).toBe(429);
        const json = await res.json();
        expect(json.error).toMatch(/リクエストが多すぎます/);

        const retryAfter = Number(res.headers.get("Retry-After"));
        expect(retryAfter).toBeGreaterThan(0);
        expect(retryAfter).toBeLessThanOrEqual(60);
    });

    it("レートリミット内で認証済みの場合は200ステータスで通過する", async () => {
        // 認証成功のモック
        mockGetUser.mockResolvedValue({ data: { user: { id: "test-user-id" } } });
        // レートリミット通過のモック
        mockLimit.mockResolvedValue({
            success: true,
            limit: 30,
            remaining: 29,
            reset: Date.now() + 60000,
        });

        const req = createRequest();
        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(mockLimit).toHaveBeenCalledWith("test-user-id");
    });

    it("未認証の場合は401ステータスを返す", async () => {
        // 未認証のモック
        mockGetUser.mockResolvedValue({ data: { user: null } });

        const req = createRequest();
        const res = await POST(req);

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe("認証されていません。");
        // レートリミットは呼ばれないはず
        expect(mockLimit).not.toHaveBeenCalled();
    });
});
