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

        sbQuery = sbQuery.limit(limit);

        const { data, error } = await sbQuery;

        if (error) {
            console.error('Supabase search error:', error);
            return { data: null, error: 'データベースの検索でエラーが発生しました。' };
        }

        return { data: data as IngredientSearchResult[], error: null };
    } catch (error) {
        console.error('Unexpected search error:', error);
        return { data: null, error: '予期せぬエラーが発生しました。' };
    }
}
