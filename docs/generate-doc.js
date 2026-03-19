#!/usr/bin/env node
/**
 * 🧬 微生物帝国 — 游戏设计文档生成器
 * 
 * 用法：node docs/generate-doc.js
 * 输出：docs/biosphere-game-doc.html
 * 
 * 功能：自动从 game.js 提取数据，生成包含核心玩法、产线图、
 *       经济系统和数值的可打印 HTML 文档。
 *       浏览器打开后 Ctrl+P 即可导出 PDF。
 */

const fs = require('fs');
const path = require('path');

// ── 路径 ──────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const GAME_JS = path.join(ROOT, 'game.js');
const OUT_HTML = path.join(__dirname, 'biosphere-game-doc.html');

// ── 读取源码 ──────────────────────────────────────
const src = fs.readFileSync(GAME_JS, 'utf-8');

// ── 提取 JS 常量（支持 {} 和 [] 两种结构） ─────────
function extractConst(name) {
  // 匹配 const NAME = { ... } 或 const NAME = [ ... ]
  const re = new RegExp(`const\\s+${name}\\s*=\\s*([{\\[])`, 'm');
  const m = re.exec(src);
  if (!m) return null;

  const open = m[1];
  const close = open === '{' ? '}' : ']';
  let depth = 1, i = m.index + m[0].length;

  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      // skip string
      const q = ch; i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
    } else if (ch === '/' && src[i+1] === '/') {
      // skip line comment
      while (i < src.length && src[i] !== '\n') i++;
    } else if (ch === '/' && src[i+1] === '*') {
      i += 2;
      while (i < src.length - 1 && !(src[i] === '*' && src[i+1] === '/')) i++;
      i++;
    } else if (ch === '{' || ch === '[') {
      depth++;
    } else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }

  const raw = src.substring(m.index + m[0].length - 1, i + 1);
  return raw;
}

// ── 安全 eval（去掉函数/箭头/this引用，只留纯数据） ───
function safeEval(raw) {
  if (!raw) return null;
  try {
    // 移除 check / onUnlock / apply 等函数属性
    let cleaned = raw
      .replace(/,?\s*(check|onUnlock|apply|effect|onBuy|onPrestige|onActivate|transform)\s*:\s*(function\s*\([^)]*\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}|[^,}]*=>[^,}]*(?:\{[^}]*(?:\{[^}]*\}[^}]*)*\})?)/g, '')
      .replace(/,?\s*(check|onUnlock|apply|effect|onBuy|onPrestige|onActivate|transform)\s*:\s*\([^)]*\)\s*=>\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, '')
      .replace(/,?\s*(check|onUnlock|apply|effect|onBuy|onPrestige|onActivate|transform)\s*:\s*\w+\s*=>[^,}]*/g, '')
      // 单引号key → 双引号
      .replace(/(\w+)\s*:/g, '"$1":')
      // 单引号值 → 双引号
      .replace(/'/g, '"')
      // 移除尾逗号
      .replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(cleaned);
  } catch {
    // fallback: 用 Function 构造（沙箱受限 eval）
    try {
      const fn = new Function(`
        const s = {}; const self = {};
        const formatNum = x => x;
        return (${raw});
      `);
      return fn();
    } catch {
      return null;
    }
  }
}

// ── 提取方法体 ────────────────────────────────────
function extractMethod(name) {
  const re = new RegExp(`\\b${name}\\s*\\([^)]*\\)\\s*\\{`, 'm');
  const m = re.exec(src);
  if (!m) return '';
  let depth = 1, i = m.index + m[0].length;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.substring(m.index, i);
}

// ── 提取数据 ──────────────────────────────────────
console.log('📖 正在从 game.js 提取数据...');

const rawRES = extractConst('RES');
const rawBLDS = extractConst('BLDS');
const rawTECHS = extractConst('TECHS');
const rawPHASES = extractConst('PHASES');
const rawFLOW_MAP = extractConst('FLOW_MAP');
const rawPORT_DEFS = extractConst('PORT_DEFS');
const rawADJ_RULES = extractConst('ADJACENCY_RULES');
const rawMAINT = extractConst('MAINTENANCE');
const rawRES_COMP = extractConst('RESOURCE_COMPETITION');
const rawACHIEVE = extractConst('ACHIEVE');
const rawPRESTIGE = extractConst('PRESTIGE');
const rawMUTATIONS = extractConst('MUTATIONS');
const rawMUT_RARITY = extractConst('MUT_RARITY');
const rawMUT_LAB = extractConst('MUT_LAB_CONFIG');
const rawCORE = extractConst('CORE_COLONY');

// 尝试 parse 纯数据的（函数类的跳过）
const RES = safeEval(rawRES);
const PHASES = safeEval(rawPHASES);
const PORT_DEFS = safeEval(rawPORT_DEFS);
const MAINT = safeEval(rawMAINT);
const RES_COMP = safeEval(rawRES_COMP);
const MUT_LAB = safeEval(rawMUT_LAB);
const MUT_RARITY = safeEval(rawMUT_RARITY);
const CORE = safeEval(rawCORE);

// ── 手动从原始文本提取关键数据（比 JSON.parse 更可靠） ──

// 从 BLDS 原始文本提取建筑信息
function parseBLDS(raw) {
  if (!raw) return [];
  const buildings = [];
  // 匹配每个建筑 key 和 name
  const re = /(\w+)\s*:\s*\{[^}]*n\s*:\s*'([^']+)'[^}]*phase\s*:\s*(\d)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const id = m[1], name = m[2], phase = parseInt(m[3]);
    // 提取该建筑的完整块
    const startIdx = m.index;
    let depth = 0, endIdx = startIdx;
    for (let i = raw.indexOf('{', startIdx); i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
    }
    const block = raw.substring(startIdx, endIdx + 1);

    // 提取 emoji
    const emojiM = block.match(/icon\s*:\s*'([^']+)'/);
    const emoji = emojiM ? emojiM[1] : '';

    // 提取 cost
    const costM = block.match(/cost\s*:\s*\{([^}]+)\}/);
    const cost = costM ? costM[1].replace(/'/g, '').trim() : '';

    // 提取 prod
    const prodM = block.match(/prod\s*:\s*\{([^}]+)\}/);
    const prod = prodM ? prodM[1].replace(/'/g, '').trim() : '';

    // 提取 cons
    const consM = block.match(/cons\s*:\s*\{([^}]+)\}/);
    const cons = consM ? consM[1].replace(/'/g, '').trim() : '';

    // 提取 desc
    const descM = block.match(/desc\s*:\s*'([^']+)'/);
    const desc = descM ? descM[1] : '';

    // 提取 ratio
    const ratioM = block.match(/ratio\s*:\s*'([^']+)'/);
    const ratio = ratioM ? ratioM[1] : '';

    buildings.push({ id, name, emoji, phase, cost, prod, cons, desc, ratio });
  }
  return buildings;
}

// 从 TECHS 原始文本提取科技
function parseTECHS(raw) {
  if (!raw) return [];
  const techs = [];
  const re = /(\w+)\s*:\s*\{[^}]*n\s*:\s*'([^']+)'[^}]*phase\s*:\s*(\d)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const id = m[1], name = m[2], phase = parseInt(m[3]);
    const startIdx = m.index;
    let depth = 0, endIdx = startIdx;
    for (let i = raw.indexOf('{', startIdx); i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
    }
    const block = raw.substring(startIdx, endIdx + 1);

    const costM = block.match(/cost\s*:\s*\{([^}]+)\}/);
    const cost = costM ? costM[1].replace(/'/g, '').trim() : '';

    const timeM = block.match(/time\s*:\s*(\d+)/);
    const time = timeM ? parseInt(timeM[1]) : 0;

    const exclM = block.match(/exclusive\s*:\s*'([^']+)'/);
    const exclusive = exclM ? exclM[1] : '';

    const descM = block.match(/desc\s*:\s*'([^']+)'/);
    const desc = descM ? descM[1] : '';

    techs.push({ id, name, phase, cost, time, exclusive, desc });
  }
  return techs;
}

// 从 FLOW_MAP 原始文本提取流向
function parseFLOW_MAP(raw) {
  if (!raw) return [];
  const flows = [];
  const re = /\{\s*from\s*:\s*'(\w+)'\s*,\s*to\s*:\s*'(\w+)'\s*,\s*res\s*:\s*'(\w+)'\s*,\s*icon\s*:\s*'([^']+)'\s*,\s*color\s*:\s*'([^']+)'\s*,\s*label\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    flows.push({ from: m[1], to: m[2], res: m[3], icon: m[4], color: m[5], label: m[6] });
  }
  return flows;
}

// 从 ADJACENCY_RULES 原始文本提取
function parseADJ(raw) {
  if (!raw) return [];
  const rules = [];
  const re = /\{\s*self\s*:\s*'([^']+)'\s*,\s*neighbor\s*:\s*'([^']+)'\s*,\s*bonus\s*:\s*([\d.]+)\s*,\s*name\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    rules.push({ src: m[1], near: m[2], bonus: parseFloat(m[3]), type: m[4] });
  }
  return rules;
}

// 从 MUTATIONS 原始文本提取
function parseMUTATIONS(raw) {
  if (!raw) return [];
  const muts = [];
  const re = /(\w+)\s*:\s*\{[^}]*n\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const id = m[1], name = m[2];
    const startIdx = m.index;
    let depth = 0, endIdx = startIdx;
    for (let i = raw.indexOf('{', startIdx); i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
    }
    const block = raw.substring(startIdx, endIdx + 1);
    const rarM = block.match(/rarity\s*:\s*'(\w+)'/);
    const rarity = rarM ? rarM[1] : 'common';
    const descM = block.match(/desc\s*:\s*'([^']+)'/);
    const desc = descM ? descM[1] : '';
    const emojiM = block.match(/icon\s*:\s*'([^']+)'/);
    const emoji = emojiM ? emojiM[1] : '';
    muts.push({ id, name, rarity, desc, emoji });
  }
  return muts;
}

// 从 ACHIEVE 原始文本提取
function parseACHIEVE(raw) {
  if (!raw) return [];
  const achs = [];
  const re = /\{\s*id\s*:\s*'(\w+)'\s*,\s*n\s*:\s*'([^']+)'\s*,\s*d\s*:\s*'([^']+)'\s*,\s*tier\s*:\s*'(\w+)'/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    achs.push({ id: m[1], name: m[2], desc: m[3], tier: m[4] });
  }
  return achs;
}

const buildings = parseBLDS(rawBLDS);
const techs = parseTECHS(rawTECHS);
const flows = parseFLOW_MAP(rawFLOW_MAP);
const adjRules = parseADJ(rawADJ_RULES);
const mutations = parseMUTATIONS(rawMUTATIONS);
const achieves = parseACHIEVE(rawACHIEVE);

console.log(`  ✅ 资源: ${RES ? Object.keys(RES).length : '?'} 种`);
console.log(`  ✅ 建筑: ${buildings.length} 种`);
console.log(`  ✅ 科技: ${techs.length} 项`);
console.log(`  ✅ 产线流向: ${flows.length} 条`);
console.log(`  ✅ 邻接规则: ${adjRules.length} 条`);
console.log(`  ✅ 突变: ${mutations.length} 种`);
console.log(`  ✅ 成就: ${achieves.length} 个`);

// ── 资源名称映射 ──────────────────────────────────
const resNames = {};
if (RES) {
  for (const [k, v] of Object.entries(RES)) {
    resNames[k] = `${v.icon || ''} ${v.n}`;
  }
}

// 建筑名称映射
const bldNames = {};
for (const b of buildings) {
  bldNames[b.id] = `${b.emoji} ${b.name}`;
}

// ── 按阶段分组建筑 ────────────────────────────────
const bldsByPhase = {};
for (const b of buildings) {
  if (!bldsByPhase[b.phase]) bldsByPhase[b.phase] = [];
  bldsByPhase[b.phase].push(b);
}

// ── 按阶段分组流向 ────────────────────────────────
function getFlowPhase(flow) {
  const fromBld = buildings.find(b => b.id === flow.from);
  const toBld = buildings.find(b => b.id === flow.to);
  return Math.max(fromBld?.phase || 1, toBld?.phase || 1);
}

// ── 科技按阶段分组 ────────────────────────────────
const techsByPhase = {};
for (const t of techs) {
  if (!techsByPhase[t.phase]) techsByPhase[t.phase] = [];
  techsByPhase[t.phase].push(t);
}

// ── 格式化 cost/prod/cons 字符串 ──────────────────
function fmtResStr(str) {
  if (!str) return '-';
  return str.replace(/(\w+)\s*:\s*([\d.]+)/g, (_, k, v) => {
    const name = resNames[k] || k;
    return `${name} ×${v}`;
  }).replace(/,/g, '，');
}

// ── 阶段颜色 ──────────────────────────────────────
const phaseColors = {
  1: '#22c55e', 2: '#f97316', 3: '#a855f7',
  4: '#ef4444', 5: '#eab308'
};
const phaseNames = { 1:'P1 采集', 2:'P2 代谢', 3:'P3 合成', 4:'P4 生态', 5:'P5 终局' };

// ── 生成 HTML ─────────────────────────────────────
console.log('🎨 正在生成 HTML 文档...');

function html() {
  const parts = [];
  const w = s => parts.push(s);

  // ─── HEAD ───
  w(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>🧬 微生物帝国 — 游戏设计文档</title>
<style>
  @page { size: A4; margin: 15mm; }
  @media print {
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
    body { font-size: 10pt; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif;
    background: #0a0e14; color: #c8d6e5;
    line-height: 1.7; padding: 40px;
    max-width: 1100px; margin: 0 auto;
  }
  h1 { font-size: 2.2em; text-align: center; margin: 40px 0 10px;
       background: linear-gradient(90deg, #22c55e, #3b82f6, #a855f7);
       -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  h2 { font-size: 1.5em; margin: 35px 0 15px; padding-bottom: 8px;
       border-bottom: 2px solid #22c55e44; color: #22c55e; }
  h3 { font-size: 1.15em; margin: 20px 0 10px; color: #60a5fa; }
  p, li { margin-bottom: 6px; }
  .subtitle { text-align: center; color: #6b7b8d; font-size: 0.95em; margin-bottom: 30px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 10px;
           font-size: 0.8em; font-weight: 600; color: #fff; margin-right: 4px; }

  /* 表格 */
  table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 0.88em; }
  th, td { padding: 8px 10px; border: 1px solid #1e2a3a; text-align: left; }
  th { background: #141c28; color: #60a5fa; font-weight: 600; white-space: nowrap; }
  td { background: #0d1420; }
  tr:hover td { background: #141c28; }

  /* 卡片 */
  .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin: 12px 0; }
  .card { background: #0f1923; border: 1px solid #1e2a3a; border-radius: 8px; padding: 14px;
          transition: border-color 0.2s; }
  .card:hover { border-color: #22c55e66; }
  .card-title { font-weight: 700; margin-bottom: 4px; }
  .card-desc { font-size: 0.85em; color: #8899aa; }

  /* 产线流向图 */
  .flow-section { margin: 16px 0; }
  .flow-row { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin: 4px 0; font-size: 0.85em; }
  .flow-node { background: #141c28; border: 1px solid #1e2a3a; border-radius: 6px;
               padding: 4px 10px; white-space: nowrap; }
  .flow-arrow { color: #4ade80; font-weight: 700; font-size: 1.1em; }
  .flow-res { font-size: 0.78em; color: #8899aa; }

  /* 公式 */
  .formula { background: #141c28; border-left: 3px solid #a855f7; padding: 12px 16px;
             font-family: 'Consolas', 'Fira Code', monospace; font-size: 0.88em;
             border-radius: 0 6px 6px 0; margin: 12px 0; overflow-x: auto; white-space: pre-wrap; }

  /* 打印按钮 */
  .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 12px 24px;
               background: #22c55e; color: #000; border: none; border-radius: 8px;
               font-size: 1em; font-weight: 700; cursor: pointer; z-index: 999; }
  .print-btn:hover { background: #4ade80; }

  /* TOC */
  .toc { background: #0f1923; border: 1px solid #1e2a3a; border-radius: 8px;
         padding: 20px 30px; margin: 20px 0; }
  .toc a { color: #60a5fa; text-decoration: none; }
  .toc a:hover { text-decoration: underline; }
  .toc ol { padding-left: 20px; }
  .toc li { margin: 4px 0; }

  /* 邻接类型 badge */
  .adj-same { background: #22c55e33; color: #4ade80; }
  .adj-synergy { background: #3b82f633; color: #60a5fa; }
  .adj-chain { background: #a855f733; color: #c084fc; }
  .adj-penalty { background: #ef444433; color: #f87171; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ 导出 PDF</button>
`);

  // ─── 封面 ───
  w(`<h1>🧬 微生物帝国</h1>
<p class="subtitle">游戏设计文档 — 核心玩法 · 产线图 · 经济系统 · 数值表<br>
版本 v0.9.1 | 生成时间 ${new Date().toLocaleString('zh-CN')}</p>`);

  // ─── 目录 ───
  w(`<div class="toc"><h3>📑 目录</h3><ol>
  <li><a href="#ch1">游戏概述与核心循环</a></li>
  <li><a href="#ch2">资源体系</a></li>
  <li><a href="#ch3">游戏阶段 (P1–P5)</a></li>
  <li><a href="#ch4">建筑总览</a></li>
  <li><a href="#ch5">资源产线流向图</a></li>
  <li><a href="#ch6">科技树</a></li>
  <li><a href="#ch7">经济系统与数值公式</a></li>
  <li><a href="#ch8">传送带与端口系统</a></li>
  <li><a href="#ch9">邻接加成系统</a></li>
  <li><a href="#ch10">进化与变异系统</a></li>
  <li><a href="#ch11">转生系统</a></li>
  <li><a href="#ch12">成就系统</a></li>
</ol></div>`);

  // ─── CH1: 游戏概述 ───
  w(`<h2 id="ch1">1. 游戏概述与核心循环</h2>
<p><strong>微生物帝国</strong>是一款网页端放置/增量类游戏，玩家扮演微观生命的引导者，
从最初的原始液泡开始，通过建造采集器、转化站等建筑，逐步构建一个复杂的微生物经济体系。</p>
<h3>核心循环</h3>
<div class="formula">采集资源 → 建造/升级建筑 → 产出更多资源 → 解锁新阶段 → 新建筑/新资源 → 循环</div>
<h3>核心殖民地演化</h3>
<table><tr><th>阶段</th><th>形态</th><th>名称</th><th>描述</th><th>最大采集器</th></tr>`);
  if (CORE) {
    for (const [id, c] of Object.entries(CORE)) {
      w(`<tr><td>P${id}</td><td>${c.emoji}</td><td>${c.name}</td><td>${c.desc}</td><td>${c.maxCollectors}</td></tr>`);
    }
  }
  w(`</table>`);

  // ─── CH2: 资源体系 ───
  w(`<h2 id="ch2" class="page-break">2. 资源体系</h2>
<p>游戏共有 <strong>${RES ? Object.keys(RES).length : 7}</strong> 种资源，按阶段逐步解锁：</p>
<table><tr><th>图标</th><th>资源名</th><th>Key</th><th>解锁阶段</th><th>颜色</th></tr>`);
  if (RES) {
    for (const [k, v] of Object.entries(RES)) {
      w(`<tr><td>${v.icon || ''}</td><td>${v.n}</td><td><code>${k}</code></td>
         <td><span class="badge" style="background:${phaseColors[v.phase]||'#666'}">P${v.phase}</span></td>
         <td><span style="color:${v.c}">■</span> ${v.c}</td></tr>`);
    }
  }
  w(`</table>`);

  // ─── CH3: 游戏阶段 ───
  w(`<h2 id="ch3">3. 游戏阶段 (P1–P5)</h2>
<table><tr><th>阶段</th><th>图标</th><th>名称</th><th>描述</th><th>解锁建筑</th></tr>`);
  if (PHASES) {
    for (const p of PHASES) {
      const pBlds = bldsByPhase[p.id] || [];
      const bldList = pBlds.map(b => `${b.emoji} ${b.name}`).join('、');
      w(`<tr><td><span class="badge" style="background:${phaseColors[p.id]}">P${p.id}</span></td>
         <td>${p.icon}</td><td>${p.name}</td><td>${p.desc}</td><td>${bldList || '-'}</td></tr>`);
    }
  }
  w(`</table>`);

  // ─── CH4: 建筑总览 ───
  w(`<h2 id="ch4" class="page-break">4. 建筑总览</h2>
<p>共 <strong>${buildings.length}</strong> 种建筑，按阶段分组：</p>`);

  for (let phase = 1; phase <= 5; phase++) {
    const pBlds = bldsByPhase[phase] || [];
    if (pBlds.length === 0) continue;
    w(`<h3 style="color:${phaseColors[phase]}">${phaseNames[phase]} — ${pBlds.length} 种建筑</h3>
<table><tr><th>图标</th><th>名称</th><th>建造费用</th><th>产出</th><th>消耗</th><th>转化比</th><th>描述</th></tr>`);
    for (const b of pBlds) {
      w(`<tr><td>${b.emoji}</td><td>${b.name}</td><td>${fmtResStr(b.cost)}</td>
         <td>${fmtResStr(b.prod)}</td><td>${fmtResStr(b.cons)}</td>
         <td>${b.ratio || '-'}</td><td style="font-size:0.82em;color:#8899aa">${b.desc || '-'}</td></tr>`);
    }
    w(`</table>`);
  }

  // ─── CH5: 产线流向图 ───
  w(`<h2 id="ch5" class="page-break">5. 资源产线流向图</h2>
<p>共 <strong>${flows.length}</strong> 条资源流向，展示建筑间的资源传输关系：</p>`);

  for (let phase = 1; phase <= 5; phase++) {
    const pFlows = flows.filter(f => getFlowPhase(f) === phase);
    if (pFlows.length === 0) continue;
    w(`<h3 style="color:${phaseColors[phase]}">${phaseNames[phase]} 产线</h3>
<div class="flow-section">`);
    for (const f of pFlows) {
      const fromName = bldNames[f.from] || f.from;
      const toName = bldNames[f.to] || f.to;
      w(`<div class="flow-row">
  <span class="flow-node">${fromName}</span>
  <span class="flow-arrow"> →<span style="color:${f.color}">${f.icon}</span>→ </span>
  <span class="flow-node">${toName}</span>
  <span class="flow-res">(${f.label})</span>
</div>`);
    }
    w(`</div>`);
  }

  // ─── CH6: 科技树 ───
  w(`<h2 id="ch6" class="page-break">6. 科技树</h2>
<p>共 <strong>${techs.length}</strong> 项科技研究：</p>`);

  for (let phase = 1; phase <= 5; phase++) {
    const pTechs = techsByPhase[phase] || [];
    if (pTechs.length === 0) continue;
    w(`<h3 style="color:${phaseColors[phase]}">${phaseNames[phase]} 科技</h3>
<table><tr><th>科技名</th><th>研究费用</th><th>研究时间</th><th>互斥分支</th><th>描述</th></tr>`);
    for (const t of pTechs) {
      const exclTag = t.exclusive ? `<span class="badge" style="background:#ef444466">⚡ ${t.exclusive}</span>` : '-';
      w(`<tr><td><strong>${t.name}</strong></td><td>${fmtResStr(t.cost)}</td>
         <td>${t.time}s</td><td>${exclTag}</td>
         <td style="font-size:0.82em;color:#8899aa">${t.desc || '-'}</td></tr>`);
    }
    w(`</table>`);
  }

  // ─── CH7: 经济系统 ───
  w(`<h2 id="ch7" class="page-break">7. 经济系统与数值公式</h2>`);

  // 产出公式
  w(`<h3>7.1 产出计算公式</h3>
<div class="formula">实际产出 = 基础产出(prod) × 建筑等级倍率(bldMult) × 传送带效率(beltMult)
         × 菌群加成(popMult) × 邻接加成(adjBonus) × 协同加成(syncBonus)
         × 科技加成(techBonus) × 进化加成(evoBonus)
         × 全局产出倍率(globalProdMult) × 变异加成(mutBonus)</div>`);

  // 建筑升级
  w(`<h3>7.2 建筑升级数值</h3>
<table><tr><th>等级</th><th>产出倍率</th><th>升级费用倍率</th></tr>`);
  for (let lv = 1; lv <= 5; lv++) {
    const mult = (1 + (lv - 1) * 0.4).toFixed(1);
    const costMult = lv === 1 ? '-' : `基础造价 × ${Math.pow(1.8, lv).toFixed(2)}`;
    const tag = lv === 5 ? ' <span class="badge" style="background:#eab308">★MAX</span>' : '';
    w(`<tr><td>Lv.${lv}${tag}</td><td>${mult}x</td><td>${costMult}</td></tr>`);
  }
  w(`</table>
<div class="formula">升级倍率 = 1 + (Lv - 1) × 0.4
升级费用 = baseCost × 1.8^Lv</div>`);

  // 建造费用递增
  w(`<h3>7.3 建造费用递增</h3>
<div class="formula">第 N 个同类建筑的造价 = baseCost × 1.4^N</div>
<table><tr><th>第几个</th><th>费用倍率</th></tr>`);
  for (let n = 0; n <= 6; n++) {
    w(`<tr><td>#${n + 1}</td><td>${Math.pow(1.4, n).toFixed(2)}x</td></tr>`);
  }
  w(`</table>`);

  // 维护费
  w(`<h3>7.4 维护费系统</h3>`);
  if (MAINT) {
    w(`<p><strong>P1 免维护</strong>，P2 起按阶段收取：</p>
<table><tr><th>阶段</th><th>基础维护费 (每秒)</th></tr>`);
    if (MAINT.baseCost) {
      for (const [phase, costs] of Object.entries(MAINT.baseCost)) {
        const costStr = Object.entries(costs).map(([k,v]) => `${resNames[k]||k} ×${v}`).join('，');
        w(`<tr><td>P${phase}</td><td>${costStr}</td></tr>`);
      }
    }
    w(`</table>`);
  }

  // 资源竞争
  w(`<h3>7.5 资源竞争机制</h3>`);
  if (RES_COMP) {
    w(`<table>
<tr><th>参数</th><th>值</th></tr>
<tr><td>生效阶段</td><td>P${RES_COMP.startPhase}+</td></tr>
<tr><td>紧张阈值</td><td>消耗/产出 > ${(RES_COMP.tensionThreshold * 100)}%</td></tr>
</table>
<p>当资源消耗率超过产出率的 ${(RES_COMP.tensionThreshold * 100)}% 时，建筑效率开始下降。</p>`);
  }

  // ─── CH8: 传送带 & 端口 ───
  w(`<h2 id="ch8" class="page-break">8. 传送带与端口系统</h2>`);

  w(`<h3>8.1 传送带等级</h3>
<table><tr><th>等级</th><th>效率倍率</th><th>容量 (/s)</th><th>升级费用</th></tr>`);
  const beltData = [
    { lv:1, eff:'0.75x', cap:'2.0', cost:'-' },
    { lv:2, eff:'1.0x',  cap:'4.0', cost:'葡萄糖 50 + 能量 30' },
    { lv:3, eff:'1.15x', cap:'6.5', cost:'蛋白质 40 + 能量 60' },
    { lv:4, eff:'1.3x',  cap:'9.0', cost:'脂质 30 + 生物质 50' },
    { lv:5, eff:'1.5x',  cap:'12.0', cost:'DNA 20 + 生物质 80' },
  ];
  for (const b of beltData) {
    w(`<tr><td>Lv.${b.lv}</td><td>${b.eff}</td><td>${b.cap}</td><td>${b.cost}</td></tr>`);
  }
  w(`</table>`);

  w(`<h3>8.2 端口系统</h3>
<p>每种建筑有固定的输入/输出端口数和角色（源/汇/中转）：</p>
<table><tr><th>建筑</th><th>最大输入</th><th>最大输出</th><th>角色</th></tr>`);
  if (PORT_DEFS) {
    for (const [k, v] of Object.entries(PORT_DEFS)) {
      const name = bldNames[k] || k;
      w(`<tr><td>${name}</td><td>${v.maxIn}</td><td>${v.maxOut}</td><td>${v.role}</td></tr>`);
    }
  }
  w(`</table>`);

  // ─── CH9: 邻接加成 ───
  w(`<h2 id="ch9" class="page-break">9. 邻接加成系统</h2>
<p>共 <strong>${adjRules.length}</strong> 条邻接规则，当两种建筑相邻放置时触发加成（或惩罚）：</p>
<table><tr><th>来源建筑</th><th>相邻建筑</th><th>加成</th><th>类型</th></tr>`);
  // 只展示前40条 + 精选
  const shownRules = adjRules.slice(0, 40);
  for (const r of shownRules) {
    const srcName = bldNames[r.src] || r.src;
    const nearName = bldNames[r.near] || r.near;
    const bonusStr = r.bonus > 0 ? `+${(r.bonus * 100).toFixed(0)}%` : `${(r.bonus * 100).toFixed(0)}%`;
    const typeClass = r.type.includes('同类') ? 'adj-same' :
                      r.type.includes('惩罚') ? 'adj-penalty' :
                      r.type.includes('链') ? 'adj-chain' : 'adj-synergy';
    w(`<tr><td>${srcName}</td><td>${nearName}</td>
       <td><span class="${typeClass}" style="padding:2px 8px;border-radius:4px">${bonusStr}</span></td>
       <td>${r.type}</td></tr>`);
  }
  if (adjRules.length > 40) {
    w(`<tr><td colspan="4" style="text-align:center;color:#6b7b8d">… 还有 ${adjRules.length - 40} 条规则（见 game.js ADJACENCY_RULES）</td></tr>`);
  }
  w(`</table>`);

  // ─── CH10: 进化 & 变异 ───
  w(`<h2 id="ch10" class="page-break">10. 进化与变异系统</h2>`);

  w(`<h3>10.1 进化系统</h3>
<div class="formula">进化费用 = ⌈12 + 10 × Lv^1.6⌉ DNA （Lv2+需蛋白质，Lv4+需生物质）
效率奖励 = Lv1-2: +10%  |  Lv3-4: +15%  |  Lv5+: +20%</div>
<table><tr><th>进化等级</th><th>DNA 花费</th><th>额外需求</th><th>效率加成</th></tr>`);
  for (let lv = 1; lv <= 8; lv++) {
    const dna = Math.ceil(12 + 10 * Math.pow(lv, 1.6));
    const extra = lv >= 4 ? '蛋白质 + 生物质' : lv >= 2 ? '蛋白质' : '-';
    const bonus = lv >= 5 ? '+20%' : lv >= 3 ? '+15%' : '+10%';
    w(`<tr><td>Lv.${lv}</td><td>${dna}</td><td>${extra}</td><td>${bonus}</td></tr>`);
  }
  w(`</table>`);

  w(`<h3>10.2 变异实验室</h3>`);
  if (MUT_LAB) {
    w(`<p>解锁条件：<strong>P${MUT_LAB.unlockPhase}</strong> + 进化 Lv.${MUT_LAB.unlockEvoLv}</p>`);
  }

  // 变异按稀有度分组
  const mutByRar = {};
  for (const m of mutations) {
    if (!mutByRar[m.rarity]) mutByRar[m.rarity] = [];
    mutByRar[m.rarity].push(m);
  }

  const rarOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const rarNames = { common:'普通', uncommon:'稀有', rare:'精良', epic:'史诗', legendary:'传说' };
  const rarColors = { common:'#8aa0c0', uncommon:'#22c55e', rare:'#3b82f6', epic:'#a855f7', legendary:'#eab308' };

  for (const rar of rarOrder) {
    const muts = mutByRar[rar] || [];
    if (muts.length === 0) continue;
    w(`<h3><span class="badge" style="background:${rarColors[rar]}">${rarNames[rar] || rar}</span> 突变 (${muts.length})</h3>
<div class="card-grid">`);
    for (const m of muts) {
      w(`<div class="card" style="border-color:${rarColors[rar]}33">
  <div class="card-title">${m.emoji} ${m.name}</div>
  <div class="card-desc">${m.desc || '-'}</div>
</div>`);
    }
    w(`</div>`);
  }

  // ─── CH11: 转生系统 ───
  w(`<h2 id="ch11" class="page-break">11. 转生系统</h2>
<p>转生（Prestige）系统允许玩家重置进度以换取永久加成"进化因子"。</p>`);

  // 从原始文本中提取转生概要
  if (rawPRESTIGE) {
    const fixedM = rawPRESTIGE.match(/fixed\s*:\s*\[([\s\S]*?)\]/);
    if (fixedM) {
      const fixedItems = [];
      const fRe = /n\s*:\s*'([^']+)'[^}]*cost\s*:\s*(\d+)[^}]*desc\s*:\s*'([^']+)'/g;
      let fm;
      while ((fm = fRe.exec(fixedM[1])) !== null) {
        fixedItems.push({ name: fm[1], cost: fm[2], desc: fm[3] });
      }
      if (fixedItems.length) {
        w(`<h3>一次性升级 (${fixedItems.length} 项)</h3>
<table><tr><th>名称</th><th>花费</th><th>效果</th></tr>`);
        for (const f of fixedItems) {
          w(`<tr><td>${f.name}</td><td>${f.cost} 进化因子</td><td>${f.desc}</td></tr>`);
        }
        w(`</table>`);
      }
    }
  }

  // ─── CH12: 成就系统 ───
  w(`<h2 id="ch12" class="page-break">12. 成就系统</h2>
<p>共 <strong>${achieves.length}</strong> 个成就，按品质分为铜/银/金三级：</p>`);

  const achByTier = { bronze: [], silver: [], gold: [] };
  for (const a of achieves) {
    if (achByTier[a.tier]) achByTier[a.tier].push(a);
  }
  const tierNames = { bronze: '🥉 铜', silver: '🥈 银', gold: '🥇 金' };
  const tierColors = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700' };

  for (const [tier, achs] of Object.entries(achByTier)) {
    if (achs.length === 0) continue;
    w(`<h3>${tierNames[tier]} (${achs.length})</h3>
<div class="card-grid">`);
    for (const a of achs) {
      w(`<div class="card" style="border-color:${tierColors[tier]}44">
  <div class="card-title" style="color:${tierColors[tier]}">${a.name}</div>
  <div class="card-desc">${a.desc}</div>
</div>`);
    }
    w(`</div>`);
  }

  // ─── 尾部 ───
  w(`<div style="text-align:center;color:#4a5568;margin-top:60px;padding-top:20px;border-top:1px solid #1e2a3a">
  <p>🧬 微生物帝国 · 游戏设计文档 · v0.9.1</p>
  <p style="font-size:0.8em">由 generate-doc.js 自动生成 | ${new Date().toLocaleString('zh-CN')}</p>
</div>
</body></html>`);

  return parts.join('\n');
}

// ── 输出 ──────────────────────────────────────────
const result = html();
fs.writeFileSync(OUT_HTML, result, 'utf-8');
const sizeKB = (Buffer.byteLength(result, 'utf-8') / 1024).toFixed(1);
console.log(`\n✅ 文档已生成: ${OUT_HTML}`);
console.log(`   大小: ${sizeKB} KB`);
console.log(`   章节: 12 章`);
console.log(`\n💡 浏览器打开后按 Ctrl+P 可导出 PDF`);
