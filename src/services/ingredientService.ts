import { createClient } from "@/lib/supabase/server";

export interface IngredientMatchResult {
  id: string;
  name: string;
  common_name: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  similarity: number;
}

/**
 * 渡されたベクトル（Embedding）を使って食材を検索し、最も類似度が高いものを返します。
 * @param queryEmbedding OpenAI等で生成された1536次元ベクトル
 * @param matchThreshold 類似度の閾値（例: 0.7）
 * @param topK 取得する件数
 * @returns 検索結果の配列
 */
export async function searchIngredientsByVector(
  queryEmbedding: number[],
  matchThreshold: number = 0.5,
  topK: number = 1
): Promise<IngredientMatchResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("match_ingredients", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: topK,
  });

  if (error) {
    console.error("Supabase RPC match_ingredients error:", error);
    throw new Error(`マスタ食材の検索に失敗しました: ${error.message}`);
  }

  return data as IngredientMatchResult[];
}
