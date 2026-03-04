# マスタデータ DBスキーマ設計 (Supabase)

本ドキュメントは、文部科学省「日本食品標準成分表」データおよび、JANコード付き市販品データを扱うためのSupabaseテーブル設計について記載します。

## 1. 文科省マスタテーブル: `ingredients_master`

文科省「日本食品標準成分表2020年版（八訂）」のデータを格納し、食材検索エンジンの基盤となるテーブルです。

### カラム定義（実際のDB構造）

| カラム名 | データ型 | プライマリキー | Null許容 | 説明 |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `uuid` | ○ | ✕ | Supabase標準のID (自動生成) |
| `name` | `text` | - | ✕ | 食品名（例: `若鶏 むね 皮なし 生`） |
| `common_name` | `text` | - | ○ | 別名・通称（将来的に検索精度向上に活用） |
| `category` | `text` | - | ✕ | 食品群（`肉類`, `魚介類`, `野菜類` 等） |
| `calories_per_100g` | `numeric` | - | ✕ | 100gあたりのエネルギー (kcal) |
| `protein_per_100g` | `numeric` | - | ✕ | 100gあたりのタンパク質 (g) |
| `fat_per_100g` | `numeric` | - | ✕ | 100gあたりの脂質 (g) |
| `carbs_per_100g` | `numeric` | - | ✕ | 100gあたりの炭水化物 (g) |
| `embedding` | `vector` | - | ○ | （将来拡張）ベクトル検索用の埋め込みデータ |
| `created_at` | `timestamptz` | - | ✕ | 作成日時 |

### 投入済みデータ

- **2,635件の食品成分データ**を投入済み。
- 投入スクリプト: `src/scripts/seed_ingredients.ts`（実行時のみ `dotenv` `xlsx` パッケージが必要）

### 検索エンジンとの連携

- 検索は `name` カラムに対する PostgreSQL `ilike` を使用（多段フォールバック: AND → OR → 部分一致）。
- 表記揺れの正規化（カタカナ→ひらがな等）はアプリケーション側（`src/lib/searchUtils.ts`）で処理。
- 同義語辞書は `src/data/synonymDictionary.json` に外出しし、ロジックとデータを分離。

---

## 2. JANコード・市販品テーブル: `custom_products_jan`

ユーザーがコンビニ商品や特定の市販品を指定・登録した際のデータを保持します。

### カラム定義

| カラム名 | データ型 | プライマリキー | Null許容 | 説明 |
| :--- | :--- | :---: | :---: | :--- |
| `jan_code` | `text` | ○ | ✕ | JANコード (13桁/8桁) |
| `product_name` | `text` | - | ✕ | 商品名（例: サラダチキン プレーン） |
| `maker_name` | `text` | - | ○ | メーカー・ブランド名 |
| `net_weight` | `numeric` | - | ○ | 内容量（例: 110） |
| `net_weight_unit` | `text` | - | ○ | 内容量単位（例: "g"） |
| `cal_per_package` | `numeric` | - | ✕ | 1パッケージあたりのエネルギー |
| `p_per_package` | `numeric` | - | ✕ | 1パッケージあたりのタンパク質 |
| `f_per_package` | `numeric` | - | ✕ | 1パッケージあたりの脂質 |
| `c_per_package` | `numeric` | - | ✕ | 1パッケージあたりの炭水化物 |
| `is_verified` | `boolean` | - | ✕ | 管理者等によるデータ検証完了フラグ |
| `created_at` | `timestamptz` | - | ✕ | 作成日時 |
| `updated_at` | `timestamptz` | - | ✕ | 更新日時 |

- **備考**: 初期は独自データとして登録し、将来的に外部のJANコードAPIと連携する拡張も視野に入れます。

---

## 3. RLS (Row Level Security) の方針

- 両テーブルともに、基本的に**全ユーザー（認証・未認証問わず）からの参照(`SELECT`)を許可**します。
- 更新・追加(`INSERT`, `UPDATE`, `DELETE`)に関しては、**管理者ロール（特定のAdmin User）のみ**に制限します。
