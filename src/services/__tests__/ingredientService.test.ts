import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchIngredientsByVector } from '../ingredientService';
import { createClient } from '@/lib/supabase/server';

// @supabase/ssr のサーバー側クライアントのモック
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('ingredientService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

        import type { Mock } from 'vitest';
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

        import type { Mock } from 'vitest';
        (createClient as Mock).mockResolvedValue({
            rpc: mockRpc,
        });

        const dummyEmbedding = new Array(1536).fill(0.1);
        await expect(searchIngredientsByVector(dummyEmbedding)).rejects.toThrow('マスタ食材の検索に失敗しました: DB Error');
    });
});
