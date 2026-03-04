/**
 * 食材検索エンジン - テキスト正規化 & 同義語辞書
 *
 * ハルシネーション防止の根幹を担う検索基盤。
 * ユーザーのあいまいな入力を正規化し、DBの正式名称とマッチングする。
 */

// ─── テキスト正規化 ───────────────────────────────────────

/**
 * カタカナをひらがなに変換する
 */
function katakanaToHiragana(str: string): string {
    return str.replace(/[\u30A1-\u30F6]/g, (match) =>
        String.fromCharCode(match.charCodeAt(0) - 0x60)
    );
}

/**
 * 全角英数字・記号を半角に変換する
 */
function fullwidthToHalfwidth(str: string): string {
    return str
        // 全角英数字 → 半角
        .replace(/[\uFF01-\uFF5E]/g, (ch) =>
            String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
        )
        // 全角スペース → 半角
        .replace(/\u3000/g, ' ');
}

/**
 * DB名称に付いている装飾プレフィックス（＜鳥肉類＞等）を除去する
 */
function removeDecorations(str: string): string {
    return str
        // ＜...＞ or <...> のブロックを除去
        .replace(/[＜<][^＞>]*[＞>]/g, '')
        // ［...］ or [...] のブロックを除去
        .replace(/[［\[][^］\]]*[］\]]/g, '')
        .trim();
}

/**
 * テキストを検索用に正規化する。
 * DB側の search_text 生成時と、ユーザー入力の正規化の両方で使用。
 */
export function normalizeText(text: string): string {
    let normalized = text;
    normalized = fullwidthToHalfwidth(normalized);
    normalized = removeDecorations(normalized);
    normalized = katakanaToHiragana(normalized);
    // 連続スペースを1つに
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
}

// ─── 同義語辞書 ──────────────────────────────────────────
//
// データは src/data/synonymDictionary.json に外出し。
// ロジックとデータを分離し、辞書の追加・修正を容易にする。

import synonymData from '@/data/synonymDictionary.json';

export const synonymDictionary: Record<string, string[]> = synonymData;

// ─── クエリ正規化 ─────────────────────────────────────────

/**
 * ユーザーの検索入力を、表記揺れ辞書 + テキスト正規化を通して
 * 検索に使用するキーワード配列に変換する。
 *
 * @returns 検索キーワード配列（正規化済み）
 */
export function normalizeSearchQuery(query: string): string[] {
    if (!query || query.trim() === '') return [];

    const trimmedQuery = query.trim();

    // 1. 完全一致で辞書に登録されていれば、そのキーワード群を返す
    if (synonymDictionary[trimmedQuery]) {
        return synonymDictionary[trimmedQuery];
    }

    // 2. 正規化した上で辞書を再検索（カタカナ→ひらがな変換後）
    const normalizedQuery = normalizeText(trimmedQuery);
    for (const [key, values] of Object.entries(synonymDictionary)) {
        if (normalizeText(key) === normalizedQuery) {
            return values;
        }
    }

    // 3. スペース区切りで複数キーワードが入力された場合
    const tokens = trimmedQuery.split(/[\s　]+/);
    if (tokens.length > 1) {
        // 各トークンについても辞書を引く
        const expanded: string[] = [];
        for (const token of tokens) {
            if (synonymDictionary[token]) {
                expanded.push(...synonymDictionary[token]);
            } else {
                expanded.push(token);
            }
        }
        return expanded;
    }

    // 4. 辞書に無い単一キーワード → そのまま返す
    return [trimmedQuery];
}
