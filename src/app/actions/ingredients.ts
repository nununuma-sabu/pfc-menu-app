'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizeText, normalizeSearchQuery } from '@/lib/searchUtils';

export interface IngredientSearchParams {
    query: string;
    category?: string;
    sortBy?: 'rel_desc' | 'protein_desc' | 'fat_asc' | 'calories_asc';
    limit?: number;
}

export interface IngredientSearchResult {
    id: string;
    name: string;
    common_name: string | null;
    category: string;
    calories_per_100g: number;
    protein_per_100g: number;
    fat_per_100g: number;
    carbs_per_100g: number;
}

// ─── スコアリング関数 ──────────────────────────────────────

/**
 * 各候補のマッチスコアを計算する (高いほど良い)
 */
function calculateRelevanceScore(
    normalizedName: string,
    originalName: string,
    keywords: string[],
    originalQuery: string,
): number {
    let score = 0;

    // (1) キーワードマッチ数 — 最重要
    const matchedKeywords = keywords.filter((kw) =>
        normalizedName.includes(normalizeText(kw)),
    );
    score += matchedKeywords.length * 30;

    // (2) 完全一致ボーナス
    const normalizedQuery = normalizeText(originalQuery);
    if (normalizedName === normalizedQuery) {
        score += 100;
    }

    // (3) 名前の短さボーナス（ベース食材は名前が短い傾向）
    //     例: "鶏卵 全卵 生" (7文字) vs "鶏卵　たまご焼　厚焼きたまご" (14文字)
    score -= normalizedName.length * 0.5;

    // (4) ベース食材ボーナス
    if (originalName.includes('生')) score += 15;
    if (originalName.includes('ゆで') || originalName.includes('水煮')) score += 12;
    if (originalName.includes('全卵')) score += 10;
    if (originalName.includes('赤肉')) score += 8;
    if (originalName.includes('皮なし')) score += 5;
    if (originalName.includes('皮つき')) score += 3;

    // (5) 加工品ペナルティ
    if (originalName.includes('フライ')) score -= 10;
    if (originalName.includes('天ぷら')) score -= 10;
    if (originalName.includes('缶詰')) score -= 8;
    if (originalName.includes('乾燥')) score -= 5;
    if (originalName.includes('パウダー')) score -= 5;

    // (6) 「若鶏」「にわとり」等の短い通称が含まれるものを優先
    //     Seeding時のシンプルな名前 (e.g. "若鶏 むね 皮なし 生") を優先
    if (originalName.startsWith('若鶏') || originalName.startsWith('豚 ') || originalName.startsWith('牛 ')) {
        score += 5;
    }

    return score;
}

// ─── メイン検索関数 ───────────────────────────────────────

/**
 * 多段フォールバック検索:
 *   Stage 1: AND検索 (全キーワード一致) — 精度重視
 *   Stage 2: OR検索 (いずれかのキーワード一致、マッチ数でスコアリング) — 網羅重視
 *   Stage 3: 部分一致検索 (キーワードの先頭2文字) — 最後の砦
 */
export async function searchIngredients(
    params: IngredientSearchParams,
): Promise<{ data: IngredientSearchResult[] | null; error: string | null }> {
    const supabase = await createClient();
    const { query, category, sortBy = 'rel_desc', limit = 20 } = params;

    try {
        const keywords = normalizeSearchQuery(query);
        if (keywords.length === 0 && !category) {
            return { data: [], error: null };
        }

        // ─── Stage 1: AND検索 ─────────────────────────────
        const andResults = await searchAND(supabase, keywords, category);
        const results: IngredientSearchResult[] = [...andResults];

        // ─── Stage 2: OR検索 (Stage 1 が少なかった場合) ───
        if (results.length < 3 && keywords.length > 1) {
            const orResults = await searchOR(supabase, keywords, category);
            // Stage 1 の結果を保持しつつ追加（重複除去）
            const existingIds = new Set(results.map((r) => r.id));
            for (const r of orResults) {
                if (!existingIds.has(r.id)) {
                    results.push(r);
                }
            }
        }

        // ─── Stage 3: 部分一致 (まだ少ない場合) ──────────
        if (results.length < 3) {
            const partialResults = await searchPartial(supabase, keywords, category);
            const existingIds = new Set(results.map((r) => r.id));
            for (const r of partialResults) {
                if (!existingIds.has(r.id)) {
                    results.push(r);
                }
            }
        }

        // ─── ソート ───────────────────────────────────────

        switch (sortBy) {
            case 'protein_desc':
                results.sort((a, b) => b.protein_per_100g - a.protein_per_100g);
                break;
            case 'fat_asc':
                results.sort((a, b) => a.fat_per_100g - b.fat_per_100g);
                break;
            case 'calories_asc':
                results.sort((a, b) => a.calories_per_100g - b.calories_per_100g);
                break;
            case 'rel_desc':
            default:
                // 関連度スコアでソート
                results.sort((a, b) => {
                    const scoreA = calculateRelevanceScore(normalizeText(a.name), a.name, keywords, query);
                    const scoreB = calculateRelevanceScore(normalizeText(b.name), b.name, keywords, query);
                    return scoreB - scoreA; // 降順
                });
                break;
        }

        return { data: results.slice(0, limit), error: null };
    } catch (err) {
        console.error('Unexpected search error:', err);
        return { data: null, error: '予期せぬエラーが発生しました。' };
    }
}

// ─── 検索ステージ実装 ─────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Stage 1: AND検索 — すべてのキーワードが名前に含まれるもの
 */
async function searchAND(
    supabase: SupabaseClient,
    keywords: string[],
    category?: string,
): Promise<IngredientSearchResult[]> {
    let sbQuery = supabase.from('ingredients_master').select('*');

    for (const kw of keywords) {
        sbQuery = sbQuery.ilike('name', `%${kw}%`);
    }

    if (category) {
        sbQuery = sbQuery.eq('category', category);
    }

    const { data, error } = await sbQuery.limit(50);
    if (error) {
        console.error('AND search error:', error.message);
        return [];
    }
    return (data as IngredientSearchResult[]) || [];
}

/**
 * Stage 2: OR検索 — いずれかのキーワードが含まれるもの
 * Supabase の .or() フィルタを使用
 */
async function searchOR(
    supabase: SupabaseClient,
    keywords: string[],
    category?: string,
): Promise<IngredientSearchResult[]> {
    // name.ilike.%kw1%,name.ilike.%kw2% ...
    const orFilters = keywords
        .map((kw) => `name.ilike.%${kw}%`)
        .join(',');

    let sbQuery = supabase
        .from('ingredients_master')
        .select('*')
        .or(orFilters);

    if (category) {
        sbQuery = sbQuery.eq('category', category);
    }

    const { data, error } = await sbQuery.limit(80);
    if (error) {
        console.error('OR search error:', error.message);
        return [];
    }
    return (data as IngredientSearchResult[]) || [];
}

/**
 * Stage 3: 部分一致検索 — キーワードの先頭2文字で検索
 */
async function searchPartial(
    supabase: SupabaseClient,
    keywords: string[],
    category?: string,
): Promise<IngredientSearchResult[]> {
    // 各キーワードの先頭2文字で緩い検索
    const shortKeywords = keywords
        .map((kw) => kw.slice(0, Math.max(2, Math.ceil(kw.length * 0.6))))
        .filter((kw) => kw.length >= 2);

    if (shortKeywords.length === 0) return [];

    const orFilters = shortKeywords
        .map((kw) => `name.ilike.%${kw}%`)
        .join(',');

    let sbQuery = supabase
        .from('ingredients_master')
        .select('*')
        .or(orFilters);

    if (category) {
        sbQuery = sbQuery.eq('category', category);
    }

    const { data, error } = await sbQuery.limit(50);
    if (error) {
        console.error('Partial search error:', error.message);
        return [];
    }
    return (data as IngredientSearchResult[]) || [];
}
