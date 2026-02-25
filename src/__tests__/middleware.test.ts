import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// @upstash/ratelimit と @upstash/redis のモック
// vi.mock はホイストされるため、ファイル先頭で宣言する
// ─────────────────────────────────────────────

const mockLimit = vi.fn();

vi.mock("@upstash/ratelimit", () => {
    // function 構文でクラスコンストラクタとして動くモックを作成
    function MockRatelimit() {
        return { limit: mockLimit };
    }
    // 静的メソッドのモック
    (MockRatelimit as any).slidingWindow = vi.fn().mockReturnValue("sliding-window-limiter");
    return { Ratelimit: MockRatelimit };
});

vi.mock("@upstash/redis", () => ({
    Redis: {
        fromEnv: vi.fn().mockReturnValue({}),
    },
}));

// ─────────────────────────────────────────────
// 環境変数の保存・復元
// ─────────────────────────────────────────────

const ORIGINAL_URL = process.env.UPSTASH_REDIS_REST_URL;
const ORIGINAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

beforeEach(() => {
    mockLimit.mockReset();
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
});

afterAll(() => {
    process.env.UPSTASH_REDIS_REST_URL = ORIGINAL_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = ORIGINAL_TOKEN;
});

// ─────────────────────────────────────────────
// middleware の静的インポート（モック済みの状態で読み込まれる）
// ─────────────────────────────────────────────

import { middleware, config } from "@/middleware";

// ─────────────────────────────────────────────
// ヘルパー: テスト用リクエスト生成
// ─────────────────────────────────────────────

function makeRequest(ip = "192.168.1.1"): NextRequest {
    return new NextRequest("http://localhost/api/generate-menu", {
        method: "POST",
        headers: { "x-forwarded-for": ip },
    });
}

// ─────────────────────────────────────────────
// テスト
// ─────────────────────────────────────────────

describe("middleware (レートリミット)", () => {
    it("制限内のリクエストは通過する (status 200)", async () => {
        mockLimit.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 });

        const res = await middleware(makeRequest("1.1.1.1"));

        expect(res.status).toBe(200);
        expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
        expect(res.headers.get("X-RateLimit-Remaining")).toBe("4");
    });

    it("制限超過時は 429 を返す", async () => {
        mockLimit.mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: Date.now() + 30000 });

        const res = await middleware(makeRequest("2.2.2.2"));

        expect(res.status).toBe(429);
        const body = await res.json();
        expect(body.error).toMatch(/リクエストが多すぎます/);
    });

    it("超過時のレスポンスに Retry-After ヘッダーが含まれる", async () => {
        const resetAt = Date.now() + 45000;
        mockLimit.mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: resetAt });

        const res = await middleware(makeRequest("3.3.3.3"));

        expect(res.status).toBe(429);
        const retryAfter = Number(res.headers.get("Retry-After"));
        expect(retryAfter).toBeGreaterThan(0);
        expect(retryAfter).toBeLessThanOrEqual(45);
    });

    it("x-forwarded-for ヘッダーの IP アドレスが limit() に渡される", async () => {
        mockLimit.mockResolvedValue({ success: true, limit: 5, remaining: 3, reset: Date.now() + 60000 });

        const targetIp = "203.0.113.42";
        await middleware(makeRequest(targetIp));

        expect(mockLimit).toHaveBeenCalledWith(targetIp);
    });

    it("config.matcher が /api/generate-menu を含む", () => {
        expect(config.matcher).toContain("/api/generate-menu");
    });
});
