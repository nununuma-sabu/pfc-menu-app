# マスタデータ DBスキーマ設計 (Supabase)

本ドキュメントは、文部科学省「日本食品標準成分表」データおよび、JANコード付き市販品データを扱うためのSupabaseテーブル設計について記載します。将来の非同期アーキテクチャやAI連携において、効率的な検索とマスタ補正を行う基盤となります。

## 1. 文科省マスタテーブル: `ingredients_master`

文科省のデータを格納するテーブルです。データ更新（年次等）に対応できるよう、変更可能なメタデータと成分データを整理します。

### カラム定義

| カラム名 | データ型 | プライマリキー | Null許容 | 説明 |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `uuid` | 〇 | ✕ | Supabase標準のID (自動生成) |
| `item_code` | `text` | - | ✕ | 食品番号（文科省データに準拠。例: `01001`） |
| `group_code` | `text` | - | ✕ | 食品群（1〜18類など） |
| `name` | `text` | - | ✕ | 食品名（例: 精白米、豚もも肉など） |
| `calories` | `numeric` | - | ✕ | 100gあたりのエネルギー (kcal) |
| `protein` | `numeric` | - | ✕ | 100gあたりのタンパク質 (g) |
| `fat` | `numeric` | - | ✕ | 100gあたりの脂質 (g) |
| `carbs` | `numeric` | - | ✕ | 100gあたりの炭水化物 (g) |
| `usable_for_ai` | `boolean` | - | ✕ | AIでの献立提案で使用させる食品かどうか（マイナー食品の除外フラグ） |
| `ai_search_vector` | `vector(1536)` | - | 〇 | （将来拡張）ベクトル検索用の埋め込みデータ |
| `created_at` | `timestamptz` | - | ✕ | 作成日時 |
| `updated_at` | `timestamptz` | - | ✕ | 更新日時 |

- **インデックス**: `item_code`へのユニークインデックス、およびよく検索される `group_code` へのインデックス。
- **備考**: 文科省データは膨大かつ文字列が細かいため、`usable_for_ai: true` のものだけをAIプロンプトの検索対象にするなどの工夫が必要です。

---

## 2. JANコード・市販品テーブル: `custom_products_jan`

ユーザーがコンビニ商品や特定の市販品を指定・登録した際のデータを保持します。

### カラム定義

| カラム名 | データ型 | プライマリキー | Null許容 | 説明 |
| :--- | :--- | :---: | :---: | :--- |
| `jan_code` | `text` | 〇 | ✕ | JANコード (13桁/8桁) |
| `product_name` | `text` | - | ✕ | 商品名（例: サラダチキン プレーン） |
| `maker_name` | `text` | - | 〇 | メーカー・ブランド名 |
| `net_weight` | `numeric` | - | 〇 | 内容量（例: 110） |
| `net_weight_unit` | `text` | - | 〇 | 内容量単位（例: "g"） |
| `cal_per_package` | `numeric` | - | ✕ | 1パッケージ（あるいは1食分）あたりのエネルギー |
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
- 一般ユーザーが新商品を登録する場合は、別のテーブル（`suggested_products`）に蓄積し、管理者が承認してから `custom_products_jan` に反映させる運用を推奨します。
