/**
 * build-chugaku-data.js
 * 中学英単語 1812語 のデータJSONを生成し、flashcard-chugaku.html にインライン埋め込みするスクリプト
 *
 * 入力: c:/Dev/.pipeline/artifacts/eitango/level{1..5}_part*.tsv
 *       （タブ区切り5列: 単語 / 品詞 / 和訳 / 英語の例文 / 例文の和訳、ヘッダーなし、UTF-8）
 * 出力: data/chugaku-words.json
 *       flashcard-chugaku.html 内の <script id="chugaku-data" type="application/json"> の中身（存在する場合）
 *
 * 実行: node scripts/build-chugaku-data.js
 * 検証: 件数 1812・レベル別 360/362/365/378/347 を満たさなければ異常終了する
 */
'use strict';

const fs = require('fs');
const path = require('path');

const INPUT_DIR = 'c:/Dev/.pipeline/artifacts/eitango';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'chugaku-words.json');
const HTML_FILE = path.join(__dirname, '..', 'flashcard-chugaku.html');

const LEVELS = [1, 2, 3, 4, 5];
const EXPECTED_BY_LEVEL = { 1: 360, 2: 362, 3: 365, 4: 378, 5: 347 };
const EXPECTED_TOTAL = 1812;
const COLUMN_COUNT = 5;
const DEF_SEPARATOR = '、';
const EMBED_RE = /(<script id="chugaku-data" type="application\/json">)[\s\S]*?(<\/script>)/;

/** level{n}_part{m}.tsv を part 番号の数値順で返す */
function listLevelFiles(level) {
  const re = new RegExp('^level' + level + '_part(\\d+)\\.tsv$');
  return fs.readdirSync(INPUT_DIR)
    .map(f => ({ f, m: f.match(re) }))
    .filter(x => x.m)
    .sort((a, b) => Number(a.m[1]) - Number(b.m[1]))
    .map(x => path.join(INPUT_DIR, x.f));
}

function build() {
  const words = [];
  for (const level of LEVELS) {
    for (const file of listLevelFiles(level)) {
      const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
      for (const line of text.split(/\r?\n/)) {
        if (line.trim() === '') continue;
        const cols = line.split('\t');
        if (cols.length !== COLUMN_COUNT) {
          throw new Error(`列数が ${COLUMN_COUNT} ではありません: ${path.basename(file)}: ${line}`);
        }
        const [word, pos, ja, example, exampleJa] = cols.map(s => s.trim());
        const defs = ja.split(DEF_SEPARATOR).map(s => s.trim()).filter(Boolean);
        words.push({
          no: words.length + 1,
          word,
          level,
          meanings: [{ pos, defs }],
          example,
          exampleJa,
        });
      }
    }
  }
  return words;
}

function verify(words) {
  const errors = [];
  if (words.length !== EXPECTED_TOTAL) errors.push(`総数 ${words.length} != ${EXPECTED_TOTAL}`);
  for (const level of LEVELS) {
    const n = words.filter(w => w.level === level).length;
    if (n !== EXPECTED_BY_LEVEL[level]) errors.push(`レベル${level}: ${n} != ${EXPECTED_BY_LEVEL[level]}`);
  }
  for (const w of words) {
    if (!w.word || !w.meanings[0].pos || w.meanings[0].defs.length === 0 || !w.example || !w.exampleJa) {
      errors.push(`欠損あり: no=${w.no} ${w.word}`);
    }
  }
  return errors;
}

function main() {
  const words = build();
  const errors = verify(words);
  if (errors.length) {
    console.error('検証エラー:\n' + errors.join('\n'));
    process.exit(1);
  }
  const json = JSON.stringify(words, null, 2);
  fs.writeFileSync(OUTPUT_FILE, json, 'utf8');
  console.log(`OK: ${words.length}語 -> ${OUTPUT_FILE}`);
  for (const level of LEVELS) {
    console.log(`  レベル${level}: ${words.filter(w => w.level === level).length}語`);
  }

  // HTML へのインライン埋め込み（HTML が存在し、埋め込み枠がある場合のみ）
  if (fs.existsSync(HTML_FILE)) {
    const html = fs.readFileSync(HTML_FILE, 'utf8');
    if (EMBED_RE.test(html)) {
      // "</" を含む文字列で script が閉じないよう念のためエスケープ
      const safe = json.replace(/<\//g, '<\/');
      fs.writeFileSync(HTML_FILE, html.replace(EMBED_RE, (_, a, b) => `${a}\n${safe}\n${b}`), 'utf8');
      console.log(`埋め込み完了: ${HTML_FILE}`);
    }
  }
}

main();
