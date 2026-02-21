export interface NutritionTipData {
    title: string;
    content: string;
    category: string;
}

export const nutritionTips: NutritionTipData[] = [
    // タンパク質（既存）
    {
        title: "タンパク質",
        category: "三大栄養素",
        content: "筋肉を維持して基礎代謝を落とさないために必須であり、痩せやすくリバウンドしにくい体を作る鍵となる栄養素です。"
    },
    // ビタミン群（調子を整える・代謝サポート）
    {
        title: "ビタミンA",
        category: "ビタミン群",
        content: "目や皮膚の粘膜を健康に保ち、免疫力をサポート。"
    },
    {
        title: "ビタミンC",
        category: "ビタミン群",
        content: "コラーゲンの生成を助け、強力な抗酸化作用で疲労や老化をケア。"
    },
    {
        title: "ビタミンD",
        category: "ビタミン群",
        content: "カルシウムの吸収を促し、丈夫な骨づくりをサポート。"
    },
    {
        title: "ビタミンB1",
        category: "ビタミン群",
        content: "糖質をエネルギーに変換する着火剤。疲労回復に直結。"
    },
    {
        title: "ビタミンB2",
        category: "ビタミン群",
        content: "脂質をエネルギーに変換し、皮膚や髪の健康を維持。"
    },
    {
        title: "ビタミンB6",
        category: "ビタミン群",
        content: "タンパク質の代謝に不可欠。筋肉づくりや血液生成の要。"
    },
    {
        title: "ビタミンB12",
        category: "ビタミン群",
        content: "赤血球を作り、神経機能を正常に保つ（貧血予防）。"
    },
    // ミネラル・機能性成分（回復・調整）
    {
        title: "クエン酸",
        category: "ミネラル・機能性成分",
        content: "エネルギー代謝をスムーズにし、疲労回復やミネラルの吸収を促進。"
    },
    {
        title: "亜鉛",
        category: "ミネラル・機能性成分",
        content: "タンパク質の合成やホルモン分泌に関わり、味覚を正常に保つ。"
    },
    {
        title: "GABA",
        category: "ミネラル・機能性成分",
        content: "脳の興奮を鎮め、ストレス緩和や睡眠の質向上をサポート。"
    },
    // アミノ酸群（筋肉・成長・脳内伝達）
    {
        title: "バリン",
        category: "アミノ酸【BCAA】",
        content: "筋肉の修復を促し、運動時の疲労を軽減する。"
    },
    {
        title: "ロイシン",
        category: "アミノ酸【BCAA】",
        content: "筋肉合成の強力なスイッチとなり、筋分解を防ぐ。"
    },
    {
        title: "イソロイシン",
        category: "アミノ酸【BCAA】",
        content: "筋肉へのエネルギー供給を助け、スタミナを維持する。"
    },
    {
        title: "グルタミン",
        category: "アミノ酸",
        content: "ハードな運動による筋肉の分解を防ぎ、免疫力や胃腸を保護。"
    },
    {
        title: "アルギニン",
        category: "アミノ酸",
        content: "血流を促進し、成長ホルモンの分泌やパフォーマンス向上を助ける。"
    },
    {
        title: "スレオニン",
        category: "アミノ酸",
        content: "コラーゲンなどの材料になり、脂肪が肝臓に蓄積するのを防ぐ。"
    },
    {
        title: "ヒスチジン",
        category: "アミノ酸",
        content: "成長を促し、神経機能のサポートや食欲抑制に関与する。"
    },
    {
        title: "リジン",
        category: "アミノ酸",
        content: "体の組織修復やカルシウムの吸収を助け、免疫力をサポートする。"
    },
    {
        title: "トリプトファン",
        category: "アミノ酸",
        content: "精神を安定させる「セロトニン」や睡眠ホルモンの材料になる。"
    },
    {
        title: "メチオニン",
        category: "アミノ酸",
        content: "肝臓の働きを助け、老廃物の排出（デトックス）をサポートする。"
    },
    {
        title: "フェニルアラニン",
        category: "アミノ酸",
        content: "脳内伝達物質の材料となり、気分の高揚や集中力アップに繋がる。"
    },
];
