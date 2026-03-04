/**
 * 検索キーワードの表記揺れを吸収するための辞書とユーティリティ
 */

// よくある表記揺れや同義語のマッピング
export const synonymDictionary: Record<string, string[]> = {
    '鶏胸肉': ['鶏', 'むね', '肉'],
    '鶏ムネ肉': ['鶏', 'むね', '肉'],
    '鶏むね肉': ['鶏', 'むね', '肉'],
    'チキンブレスト': ['鶏', 'むね', '肉'],
    '鶏もも肉': ['鶏', 'もも', '肉'],
    '鶏モモ肉': ['鶏', 'もも', '肉'],
    '豚バラ': ['豚', 'ばら', '肉'],
    '豚ばら肉': ['豚', 'ばら', '肉'],
    '卵': ['鶏卵'],
    'たまご': ['鶏卵'],
    'タマゴ': ['鶏卵'],
    'ご飯': ['精白米', 'めし'],
    'ごはん': ['精白米', 'めし'],
    '白米': ['精白米', 'めし'],
};

/**
 * 検索元の入力文字列を、表記揺れ辞書を参照して正規化または複数キーワードに分割します。
 * @param query ユーザーの入力した検索キーワード
 * @returns 検索に使用するキーワードの配列
 */
export function normalizeSearchQuery(query: string): string[] {
    if (!query || query.trim() === '') return [];

    const trimmedQuery = query.trim();

    // 1. 完全一致で辞書に登録されていれば、分割されたキーワード群を返す
    if (synonymDictionary[trimmedQuery]) {
        return synonymDictionary[trimmedQuery];
    }

    // 2. スペース（全角・半角）区切りで入力された場合は分割して返す
    const tokens = trimmedQuery.split(/[\s　]+/);
    if (tokens.length > 1) {
        return tokens;
    }

    // 3. それ以外は単一のキーワードとして返す
    // TODO: 必要に応じて、部分一致での辞書置換など高度なロジックを追加
    return [trimmedQuery];
}
