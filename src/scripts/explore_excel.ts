import * as xlsx from 'xlsx';
import path from 'path';

// 012.xlsx が第2章（データ）の本表（メインの成分表）
const FILE_PATH = path.join(process.cwd(), 'data', '20201225-mxt_kagsei-mext_01110_012.xlsx');

function exploreExcel() {
    console.log(`Reading ${FILE_PATH}...`);
    const workbook = xlsx.readFile(FILE_PATH);

    console.log(`Sheet Names: ${workbook.SheetNames.join(', ')}`);

    // 最初のシートを読む
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    // JSONの配列として取得（header: 1 は 2D配列として取得するオプション）
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`\nTotal rows: ${data.length}`);
    console.log('\n--- First 20 rows ---');
    for (let i = 0; i < Math.min(20, data.length); i++) {
        console.log(`Row ${i}:`, data[i]);
    }
}

exploreExcel();
