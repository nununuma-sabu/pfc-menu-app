'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizeSearchQuery } from '@/lib/searchUtils';

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

/**
 * 検索キーワードを受け取り、Supabaseの ingredients_master から条件に合う食品を検索します。
 */
export async function searchIngredients(params: IngredientSearchParams): Promise<{ data: IngredientSearchResult[] | null, error: string | null }> {
    const supabase = await createClient();
    const { query, category, sortBy = 'rel_desc', limit = 20 } = params;

    try {
        // 検索語句の正規化・分割
        const keywords = normalizeSearchQuery(query);
        if (keywords.length === 0 && !category) {
            return { data: [], error: null };
        }

        let sbQuery = supabase.from('ingredients_master').select('*');

        // キーワードすべてを含む (AND検索) ※PostgreSQLのilikeを利用
        keywords.forEach(kw => {
            // name に部分一致
            sbQuery = sbQuery.ilike('name', `%${kw}%`);
        });

        if (category) {
            sbQuery = sbQuery.eq('category', category);
        }

        // ソート条件の適用
        switch (sortBy) {
            case 'protein_desc':
                sbQuery = sbQuery.order('protein_per_100g', { ascending: false });
                break;
            case 'fat_asc':
                sbQuery = sbQuery.order('fat_per_100g', { ascending: true });
                break;
            case 'calories_asc':
                sbQuery = sbQuery.order('calories_per_100g', { ascending: true });
                break;
            case 'rel_desc':
            default:
                // name が短くて検索キーワードに最も一致するものを上に持ってくる等したいが、
                // 単純なilikeの場合、デフォルトはid順もしくは順不同になりがち。
                // ここでは便宜上、よく使われそうな順（カロリー順等）にするか、DBのデフォルトに任せる。
                sbQuery = sbQuery.order('id', { ascending: true });
                break;
        }

        // rel_desc の場合は多めに取得してメモリ上でソートする
        if (sortBy === 'rel_desc') {
            sbQuery = sbQuery.limit(100);
        } else {
            sbQuery = sbQuery.limit(limit);
        }

        const { data, error } = await sbQuery;

        if (error) {
            console.error('Supabase search error:', error);
            return { data: null, error: 'データベースの検索でエラーが発生しました。' };
        }

        let sortedData = data as IngredientSearchResult[];

        // 関連度ソートのロジック:
        // 文字列長が短い (装飾語が少ない) 要素や、「生」「全卵」「赤肉」といったベースの食材を示すキーワードが含まれる要素を上位にする
        if (sortBy === 'rel_desc' && sortedData.length > 0) {
            const calculateScore = (name: string) => {
                let score = name.length; // 文字が少ないほど優先（基本スコア）

                // 元の検索クエリと完全一致なら超ボーナス
                if (name === query) score -= 100;

                // ベース食材の特徴となる単語があれば優先（スコアを下げる）
                if (name.includes('生') || name.includes('水煮')) score -= 15;
                if (name.includes('全卵')) score -= 10;
                if (name.includes('皮なし') || name.includes('皮つき')) score -= 5;
                if (name.includes('赤肉')) score -= 5;

                // 加工品や調理済みのものはペナルティ（スコアを上げる）
                if (name.includes('焼') || name.includes('フライ') || name.includes('天ぷら')) score += 20;
                if (name.includes('乾燥') || name.includes('パウダー') || name.includes('缶')) score += 10;

                return score;
            };

            sortedData.sort((a, b) => calculateScore(a.name) - calculateScore(b.name));

            // limitに合わせてスライス
            sortedData = sortedData.slice(0, limit);
        }

        return { data: sortedData, error: null };
    } catch (error) {
        console.error('Unexpected search error:', error);
        return { data: null, error: '予期せぬエラーが発生しました。' };
    }
}
