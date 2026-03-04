import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Ensure the necessary env vars are present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup the file path
const FILE_PATH = path.join(process.cwd(), 'data', '20201225-mxt_kagsei-mext_01110_012.xlsx');

// Helper to safely parse numbers from the Excel data
// Handle string variations like "Tr", "(0)", "-", "<1 empty item>"
function parseNumber(val: any): number {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const s = val.trim();
        if (s === '-' || s === 'Tr' || s === '*' || s.startsWith('<')) return 0;

        // Remove parentheses for estimated values e.g. "(0)", "(5.8)"
        const cleaned = s.replace(/[()]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}

// Main processing function
async function seedIngredients() {
    console.log(`Reading ${FILE_PATH}...`);
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`Error: File not found at ${FILE_PATH}`);
        process.exit(1);
    }

    const workbook = xlsx.readFile(FILE_PATH);
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    // Read as 2D array
    const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const records = [];

    // Skip headers (data starts around row 13 = index 12 in the sample, let's start reading from index 12, but we can also check for standard structure)
    // Let's filter rows that have a valid item_code in column 1 (e.g. "01001")
    for (let i = 12; i < rows.length; i++) {
        const row = rows[i];

        // Column 1 is item_code. Make sure we have enough columns and that item_code looks like a string of digits
        if (!row || row.length < 15) continue;

        const itemCode = row[1];
        if (typeof itemCode !== 'string' || !/^\d{5}$/.test(itemCode)) continue;

        const groupCode = row[0]; // e.g. "01"
        const name = row[3];

        // According to our exploration script output mapping:
        // [5]: Calories
        // [7]: Protein
        // [9]: Fat
        // [13]: Available Carbs (or we can use [14] if unavailable, let's use [14] as a fallback or simply [13])
        // The data we saw:
        // Row 15: [ '01', '01004', 4, 'おおむぎ　玄麦　皮麦', 0, 1373, 325, 12.0, '(6.3)', 6.3, ... ]
        //   5 -> 1373 (kJ), 6 -> 325 (kcal), 7 -> 12.0 (protein g), 9 -> 6.3 (fat g), 13 -> 69.8 (carb g)
        // Wait, let's double check the indices from the console log:
        // Row 15:
        //  0: '01'
        //  1: '01004'
        //  2: 4
        //  3: 'おおむぎ　玄麦　皮麦'
        //  4: 0
        //  5: 1373  (Energy kJ)
        //  6: 325   (Energy kcal)
        //  7: 12.0  (Protein g - amino acid composition)
        //  8: '(6.3)'
        //  9: 6.3   (Protein - Total N * factor?)
        // 10: 10.9
        // 11: '(0)'
        // 12: 1.6   (Lipid)
        // 13: 69.8  (Carb - available)
        // 14: ''
        // 15: 68.2  (Carb - difference)

        // Let's adjust based on the standard table (八訂):
        // 1(B): 食品群
        // 2(C): 食品番号
        // 4(E): 索引番号
        // 5(F): 食品名
        // 7(H): kcal 
        // Wait, the index mapping in our explore_excel.ts:
        // In our `row` array from xlsx:
        // index 0: '01' -> group_code
        // index 1: '01004' -> item_code
        // index 2: 4 -> index numbers skip
        // index 3: 'おおむぎ　玄麦　皮麦' -> name
        // index 4: 0 廃アルカリフラグ等？
        // index 5: 1373 (kJ)
        // index 6: 325 (kcal) -> calories
        // index 7: 12.0 (たんぱく質) -> protein
        // index 9: 6.3 -> ? (たんぱく質のアミノ酸組成による値だったりする)
        // Wait, to be perfectly accurate for basic macronutrients in 八訂:
        // 6: エネルギー(kcal)
        // 7: 水分
        // 8: アミノ酸組成によるたんぱく質
        // 9: 基準窒素量によるたんぱく質
        // (Actually 八訂 has many columns)

        // Let's use standard assumption for PFC macro goals, picking the most representative:
        // 6: calories (kcal)
        // 9: protein (たんぱく質 g)
        // 12: fat (脂質 g)
        // 15: carbs (炭水化物 利用可能炭水化物(質量計) or 差引法)

        // Based on Row 16 output:
        //  6: 332 (kcal) 
        //  7: 11.2 (水分)
        //  8: '-' (アミノ酸)
        //  9: 7.0 (タンパク質)
        // 10: '-'
        // 11: '(0)'
        // 12: 1.7 (脂質)
        // 13: '-'
        // 14: ''
        // 15: 76.2 (炭水化物差引)

        const calories = parseNumber(row[6]);
        const protein = parseNumber(row[9]);
        const fat = parseNumber(row[12]);

        // 炭水化物は利用可能炭水化物(質量計) [13] があればそれを優先、なければ差引法 [15]
        let carbs = parseNumber(row[13]);
        if (carbs === 0 && parseNumber(row[15]) > 0) {
            carbs = parseNumber(row[15]);
        }

        // フィルタリング: AIでの献立提案で使用させるかのフラグ（usable_for_ai）
        // 例えば、調味料や調理油などは少し特殊扱いにするかもしれませんが、
        // ここではすべて初期値 true として後で修正可能にする、または
        // 少なくともカロリーなどがすべて0のものはfalseにするなどにします。
        // 今回は一律 true にします。
        const usableForAi = true;

        const ingredientName = String(name).trim();

        // Check if we already have this name to avoid duplicates on upsert depending on the schema
        // The table might not enforce uniqueness on name, but upsert needs a constraint. 
        // We'll gather them and let upsert handle it if 'name' is the unique key, 
        // or we just insert if there is no conflict key.

        records.push({
            name: ingredientName,
            category: String(groupCode),
            calories_per_100g: calories,
            protein_per_100g: protein,
            fat_per_100g: fat,
            carbs_per_100g: carbs,
        });
    }

    console.log(`Parsed ${records.length} records. Commencing seeded...`);

    const BATCH_SIZE = 500;
    const CONCURRENCY = 5;

    // Split into chunks
    const chunks: any[][] = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        chunks.push(records.slice(i, i + BATCH_SIZE));
    }

    let totalUpserted = 0;

    // Function to process a single chunk
    const processChunk = async (chunk: any[], chunkIndex: number) => {
        try {
            const { error } = await supabase
                .from('ingredients_master')
                .insert(chunk); // Since there is no unique constraint on name, we simply insert.

            if (error) {
                console.error(`Error upserting chunk ${chunkIndex}:`, error.message);
            } else {
                totalUpserted += chunk.length;
                console.log(`  -> Upserted chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} items)`);
            }
        } catch (e: any) {
            console.error(`Exception upserting chunk ${chunkIndex}:`, e.message);
        }
    };

    // Queue wrapper for concurrency control
    let chunkIndex = 0;
    async function worker() {
        while (chunkIndex < chunks.length) {
            const idx = chunkIndex++;
            await processChunk(chunks[idx], idx);
        }
    }

    // Create worker promises
    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY, chunks.length); i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    console.log(`\nSeeding completed. Total upserted records: ${totalUpserted}`);
}

seedIngredients().catch(console.error);
