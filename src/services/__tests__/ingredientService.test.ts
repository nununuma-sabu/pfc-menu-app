import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { searchIngredientsByVector, getIngredientEmbedding } from '../ingredientService';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// @supabase/ssr のサーバー側クライアントのモック
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

// @google/generative-ai のモック
vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn(),
    };
});

describe('ingredientService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' };
    });

    it('searchIngredientsByVector は正しくSupabase RPCを呼び出し結果を返す', async () => {
        const mockRpc = vi.fn().mockResolvedValue({
            data: [
                {
                    id: 'mock-uuid',
                    name: '若鶏 もも 皮なし',
                    common_name: '鶏もも肉',
                    calories_per_100g: 116,
                    protein_per_100g: 18.8,
                    fat_per_100g: 3.9,
                    carbs_per_100g: 0,
                    similarity: 0.89,
                }
            ],
            error: null,
        });

        (createClient as Mock).mockResolvedValue({
            rpc: mockRpc,
        });

        const dummyEmbedding = new Array(1536).fill(0.1);
        const result = await searchIngredientsByVector(dummyEmbedding, 0.7, 3);

        expect(mockRpc).toHaveBeenCalledWith('match_ingredients', {
            query_embedding: dummyEmbedding,
            match_threshold: 0.7,
            match_count: 3,
        });
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('若鶏 もも 皮なし');
    });

    it('Supabaseがエラーを返した場合、例外をスローする', async () => {
        const mockRpc = vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'DB Error' },
        });

        (createClient as Mock).mockResolvedValue({
            rpc: mockRpc,
        });

        const dummyEmbedding = new Array(1536).fill(0.1);
        await expect(searchIngredientsByVector(dummyEmbedding)).rejects.toThrow('マスタ食材の検索に失敗しました: DB Error');
    });

    describe('getIngredientEmbedding', () => {
        it('正常に食材名のEmbeddingを取得できる', async () => {
            const dummyEmbedding = [0.1, 0.2, 0.3];
            const mockEmbedContent = vi.fn().mockResolvedValue({
                embedding: { values: dummyEmbedding }
            });

            // GoogleGenerativeAIコンストラクタのモック実装を上書き
            (GoogleGenerativeAI as Mock).mockImplementation(function () {
                return {
                    getGenerativeModel: vi.fn().mockReturnValue({
                        embedContent: mockEmbedContent
                    })
                };
            });

            const result = await getIngredientEmbedding('鶏もも肉');

            expect(result).toEqual(dummyEmbedding);
            expect(mockEmbedContent).toHaveBeenCalledWith('鶏もも肉');
        });

        it('APIキーが設定されていない場合エラーになる', async () => {
            delete process.env.GEMINI_API_KEY;

            await expect(getIngredientEmbedding('鶏もも肉')).rejects.toThrow('GEMINI_API_KEY is not set');
        });

        it('Gemini APIがエラーを返した場合エラーになる', async () => {
            const mockEmbedContent = vi.fn().mockRejectedValue(new Error('API Error'));

            (GoogleGenerativeAI as Mock).mockImplementation(function () {
                return {
                    getGenerativeModel: vi.fn().mockReturnValue({
                        embedContent: mockEmbedContent
                    })
                };
            });

            await expect(getIngredientEmbedding('鶏もも肉')).rejects.toThrow('Embedding生成に失敗しました: API Error');
        });
    });
});
