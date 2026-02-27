import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

/**
 * 食材の名称からEmbedding（ベクトル表現）を取得します
 * @param ingredientName マスタ検索用の食材名
 * @returns 1536次元(text-embedding-004)の数値配列
 */
export async function getIngredientEmbedding(ingredientName: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  try {
    const result = await model.embedContent(ingredientName);
    return result.embedding.values;
  } catch (error: any) {
    console.error("Failed to generate embedding for:", ingredientName, error);
    throw new Error(`Embedding生成に失敗しました: ${error.message || "Unknown error"}`);
  }
}
