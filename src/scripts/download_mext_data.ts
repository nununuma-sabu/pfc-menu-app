import fs from 'fs';
import path from 'path';

const TARGET_URL = 'https://www.mext.go.jp/a_menu/syokuhinseibun/mext_01110.html';
const BASE_URL = 'https://www.mext.go.jp';
const DATA_DIR = path.join(process.cwd(), 'data');

async function downloadMextExcelFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log(`Fetching from ${TARGET_URL}...`);
  const response = await fetch(TARGET_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch main page: ${response.statusText}`);
  }
  const html = await response.text();

  // リンク（href）から拡張子が .xlsx のものを抽出
  const regex = /href="([^"]+\.xlsx)"/g;
  const matches = [...html.matchAll(regex)];

  // 重複排除
  const rawUrls = [...new Set(matches.map(m => m[1]))];
  
  const fileUrls = rawUrls.map(url => {
    if (url.startsWith('http')) {
      return url;
    }
    return url.startsWith('/') ? BASE_URL + url : BASE_URL + '/' + url;
  });

  console.log(`${fileUrls.length}件のExcelファイルが見つかりました。ダウンロードを開始します...`);

  let count = 0;
  // ダウンロードを並列ではなく直列でやさしく行う
  for (const fileUrl of fileUrls) {
    const fileName = path.basename(new URL(fileUrl).pathname);
    const destPath = path.join(DATA_DIR, fileName);

    console.log(`[${count + 1}/${fileUrls.length}] ダウンロード中: ${fileName}`);
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) {
        console.error(`  -> ダウンロード失敗 (${res.status}): ${fileUrl}`);
        continue;
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(destPath, buffer);
      console.log(`  -> 保存完了: ${destPath}`);
      count++;
    } catch (e) {
      console.error(`  -> エラーが発生しました:`, e);
    }
  }

  console.log(`\nダウンロードが完了しました。(成功: ${count}/${fileUrls.length}件)`);
}

downloadMextExcelFiles().catch(console.error);
