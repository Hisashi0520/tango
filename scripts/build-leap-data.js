/**
 * build-leap-data.js
 * 改訂版 必携 英単語 LEAP (2300語) のデータJSONを生成するスクリプト
 *
 * 入力: c:/tmp/leap-list.md (ukaru-eigo.com からの Markdown テーブル)
 * 出力: c:/Dev/personal/tango/data/leap-words.json
 *
 * 実行: node c:/Dev/personal/tango/scripts/build-leap-data.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'c:/tmp/leap-list.md';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'leap-words.json');

// 丸数字リスト（①〜⑳）
const CIRCLED_NUMS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩',
                      '⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];

/**
 * 丸数字で文字列を分割し、defs 配列を返す
 * 「①助言，ヒント ②チップ ③先，先端」 → ["助言，ヒント", "チップ", "先，先端"]
 */
function splitByCircledNums(str) {
  // 丸数字の出現位置でsplit
  // まず最初の丸数字より前のテキストを除去 (品詞記号は既に除去済みの前提)
  let text = str.trim();

  // 文字列内に丸数字が含まれるか確認
  const hasCircled = CIRCLED_NUMS.some(c => text.includes(c));
  if (!hasCircled) {
    // 丸数字なし → 単一定義
    return [text.trim()].filter(s => s.length > 0);
  }

  // 丸数字でsplit
  // ①②③... を区切り文字として扱う
  // 方法: 各丸数字の位置を探して、その間のテキストを取り出す
  const positions = [];
  for (const c of CIRCLED_NUMS) {
    let idx = 0;
    while (true) {
      const pos = text.indexOf(c, idx);
      if (pos === -1) break;
      positions.push({ pos, char: c, num: CIRCLED_NUMS.indexOf(c) + 1 });
      idx = pos + 1;
    }
  }

  if (positions.length === 0) {
    return [text.trim()].filter(s => s.length > 0);
  }

  // 位置でソート
  positions.sort((a, b) => a.pos - b.pos);

  const defs = [];
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].pos + 1; // 丸数字の次の文字から
    const end = i + 1 < positions.length ? positions[i + 1].pos : text.length;
    const def = text.slice(start, end).trim();
    if (def.length > 0) {
      defs.push(def);
    }
  }

  return defs.filter(s => s.length > 0);
}

/**
 * 意味文字列を品詞ブロックに分解する
 * 例: "[自] ①賛成する [他] ②～に反対する" → [{pos:"自", defs:[...]}, {pos:"他", defs:[...]}]
 */
function parseMeanings(meaningStr) {
  // バックスラッシュエスケープ解除: \[ → [, \] → ]
  let str = meaningStr.replace(/\\\[/g, '[').replace(/\\\]/g, ']');

  // 品詞パターン: [自] [他] [名] [形] [副] [前] [接] [助] [間] [代] など
  const posPattern = /\[([^\]]+)\]/g;

  // 品詞の出現位置を取得
  const posMatches = [];
  let m;
  while ((m = posPattern.exec(str)) !== null) {
    posMatches.push({ pos: m[1], index: m.index, end: m.index + m[0].length });
  }

  if (posMatches.length === 0) {
    // 品詞マーカーなし → そのまま返す（丸数字分割は試みる）
    const defs = splitByCircledNums(str);
    return [{ pos: '', defs: defs.length > 0 ? defs : [str.trim()] }];
  }

  const result = [];
  for (let i = 0; i < posMatches.length; i++) {
    const { pos, end } = posMatches[i];
    const nextStart = i + 1 < posMatches.length ? posMatches[i + 1].index : str.length;
    const defStr = str.slice(end, nextStart).trim();
    const defs = splitByCircledNums(defStr);
    result.push({
      pos,
      defs: defs.length > 0 ? defs : [defStr].filter(s => s.length > 0)
    });
  }

  return result;
}

/**
 * メイン処理
 */
function main() {
  console.log('=== build-leap-data.js ===');
  console.log(`入力: ${INPUT_FILE}`);
  console.log(`出力: ${OUTPUT_FILE}`);
  console.log('');

  // ファイル読み込み
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: 入力ファイルが見つかりません: ${INPUT_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = content.split('\n');

  const words = [];
  let skipped = 0;
  let parseErrors = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // テーブル行でない行はスキップ
    if (!trimmed.startsWith('|')) continue;

    // ヘッダー行・区切り行スキップ
    if (trimmed.includes('| No |') || trimmed.includes('| --- |') || trimmed.includes('|---|')) {
      skipped++;
      continue;
    }

    // | No | 単語 | 意味 | の形にsplit
    const parts = trimmed.split('|').map(p => p.trim());
    // parts[0] = '' (先頭の|), parts[1]=No, parts[2]=単語, parts[3]=意味, parts[4]='' (末尾の|)
    if (parts.length < 4) {
      skipped++;
      continue;
    }

    const noStr = parts[1];
    const word = parts[2];
    const meaningRaw = parts[3];

    // No が数値でなければスキップ（ヘッダーなど）
    const no = parseInt(noStr, 10);
    if (isNaN(no)) {
      skipped++;
      continue;
    }

    if (!word || word.length === 0) {
      console.warn(`WARN: No.${no} - 単語が空です`);
      parseErrors++;
      continue;
    }

    // 意味をパース
    let meanings;
    try {
      meanings = parseMeanings(meaningRaw);
    } catch (e) {
      console.warn(`WARN: No.${no} (${word}) - 意味のパースに失敗: ${e.message}`);
      meanings = [{ pos: '', defs: [meaningRaw] }];
      parseErrors++;
    }

    words.push({ no, word, meanings });
  }

  // noでソート（念のため）
  words.sort((a, b) => a.no - b.no);

  // 重複チェック
  const seenNos = new Set();
  const dupes = [];
  for (const w of words) {
    if (seenNos.has(w.no)) {
      dupes.push(w.no);
    }
    seenNos.add(w.no);
  }
  if (dupes.length > 0) {
    console.warn(`WARN: 重複した No があります: ${dupes.join(', ')}`);
  }

  // 出力
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(words, null, 2), 'utf8');

  console.log(`✅ 完了: ${words.length} 件を出力しました`);
  console.log(`   スキップ行: ${skipped}`);
  if (parseErrors > 0) console.log(`   パースエラー: ${parseErrors}`);
  if (words.length > 0) {
    console.log(`   先頭: No.${words[0].no} "${words[0].word}"`);
    console.log(`   末尾: No.${words[words.length-1].no} "${words[words.length-1].word}"`);
  }

  // 範囲チェック
  if (words.length < 2280 || words.length > 2320) {
    console.warn(`⚠ 件数が想定外です（期待: 2280〜2320, 実際: ${words.length}）`);
  } else {
    console.log(`   件数チェック: OK (2280〜2320の範囲内)`);
  }
}

main();
