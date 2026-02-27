// ============================================================================
// 日本食品標準成分表 (MEXT) および コンビニ商品(JANコード) 用の型定義
// TypeScriptの strict モードに準拠し、any の使用を禁止します。
// ============================================================================

/**
 * 基本的な三大栄養素（PFC）+ エネルギー
 */
export interface BaseNutrition {
    calories: number; // エネルギー (kcal)
    protein: number;  // タンパク質 (g)
    fat: number;      // 脂質 (g)
    carbs: number;    // 炭水化物 (g)
}

/**
 * 拡張栄養素（ビタミン・ミネラル等オプション）
 * 文科省データには多数の項目が含まれるため、アプリ独自で必要そうなものを抜粋定義
 */
export interface ExtendedNutrition extends BaseNutrition {
    dietaryFiber?: number; // 食物繊維総量 (g)
    saltEq?: number;       // 食塩相当量 (g)
    calcium?: number;      // カルシウム (mg)
    iron?: number;         // 鉄 (mg)
    vitaminC?: number;     // ビタミンC (mg)
    // 今後必要に応じて追加
}

/**
 * 文科省「日本食品標準成分表」に基づく食材マスタの型
 * - database schema: `ingredients_master`
 */
export interface IngredientMaster {
    id: string;             // UUID or 文科省の食品番号(5桁)
    foodGroupCode: string;  // 食品群コード (01:穀類, 10:肉類, 11:卵類, etc.)
    foodGroupName: string;  // 食品群名
    name: string;           // 食品名（例: ぶた　［大型種肉］　もも　赤肉　生）
    itemCode: string;       // 食品番号

    // 基本的に可食部100gあたりの成分値を持つ
    nutritionPer100g: ExtendedNutrition;

    // AI利用時の検索・分類用メタデータ
    aiSearchTags?: string[]; // 例: ["豚肉", "赤身", "高タンパク"]
    isUsableForAI: boolean;  // AIの献立提案で使用を許可するかどうか（マイナーな食材を弾くため）

    createdAt: Date;
    updatedAt: Date;
}

/**
 * 市販品（コンビニ商品など）JANコードベースの商品マスタの型
 * - database schema: `custom_products_jan`
 */
export interface JanCodeProduct {
    janCode: string;        // 主キー: JANコード (13桁 or 8桁の文字列)
    productName: string;    // 商品名（例: セブンプレミアム サラダチキン プレーン）
    makerName?: string;     // メーカー名・ブランド名

    // パッケージ全体、または1食分あたりの成分値
    nutritionPerPackage: BaseNutrition;

    // 内容量などの付加情報
    netWeightAmount?: number; // 内容量数値 (例: 110)
    netWeightUnit?: string;   // 内容量単位 (例: "g", "ml")

    isVerified: boolean;    // 管理者等によってデータが検証済みかどうか

    createdAt: Date;
    updatedAt: Date;
}

/**
 * AIとの連携において、マスタからの検索結果をまとめるためのDTO
 */
export interface MasterSearchResponse {
    ingredients: IngredientMaster[];
    janProducts: JanCodeProduct[];
    totalCount: number;
}
