# 微生物帝国 — 品牌视觉系统审计与升级方案

> **文档版本**: v1.0  
> **日期**: 2026-03-22  
> **范围**: 全量视觉系统审计 + 品牌升级路线图  
> **当前版本**: v3.0（含 v1.1.0 视觉叙事增强 + v1.2.0 K1-K4 UI 整理）

---

## 目录

1. [品牌视觉现状审计](#1-品牌视觉现状审计)
   - 1.1 [色彩系统审计](#11-色彩系统审计)
   - 1.2 [字体系统审计](#12-字体系统审计)
   - 1.3 [图形语言审计](#13-图形语言审计)
   - 1.4 [动效系统审计](#14-动效系统审计)
   - 1.5 [音频品牌审计](#15-音频品牌审计)
   - 1.6 [综合评分](#16-综合评分)
2. [核心问题诊断](#2-核心问题诊断)
3. [品牌视觉升级方案](#3-品牌视觉升级方案)
   - 3.1 [品牌色彩系统 2.0](#31-品牌色彩系统-20)
   - 3.2 [字体系统升级](#32-字体系统升级)
   - 3.3 [图形语言规范](#33-图形语言规范)
   - 3.4 [动效设计语言](#34-动效设计语言)
   - 3.5 [音频品牌统一](#35-音频品牌统一)
4. [阶段进化视觉叙事增强](#4-阶段进化视觉叙事增强)
5. [实施路线图](#5-实施路线图)
6. [品牌视觉速查卡](#6-品牌视觉速查卡)

---

## 1. 品牌视觉现状审计

### 1.1 色彩系统审计

#### 当前架构

游戏拥有一套**相当成熟的 CSS 变量色彩系统**，层次分明：

| 层级 | 内容 | Token 数量 | 评价 |
|------|------|-----------|------|
| **主色板** | 8 色基础色（cyan/green/blue/purple/orange/yellow/red/pink） | 8 | ✅ 覆盖全面 |
| **语义色** | 7 色（max/upgrade/success/info/muted/separator/panel） | 7 | ✅ 意图清晰 |
| **状态色 (K3)** | 4 色（ok/warn/danger/special） + reward | 5 | ✅ 功能明确 |
| **阶段动态色** | 5 组 PHASE_COLORS（primary/glow/tint/border） | 20 | ✅ 叙事驱动 |
| **建筑背景色** | 10 类 bg-*（green/blue/orange/cyan/yellow/purple/gray/pink/teal/wonder） | 10 | ⚠️ 分类依据不统一 |
| **资源色** | 7 色（glucose→green, energy→orange, dna→purple, nitrogen→blue, protein→pink, biomass→teal, qs→yellow） | 7 | ✅ 资源辨识清晰 |

**色值定义（来源代码）：**

```javascript
// PHASE_COLORS — 阶段色彩演变
const PHASE_COLORS = {
  1: { primary:'#22c55e', glow:'rgba(34,197,94,0.3)', ... },  // 采集·绿
  2: { primary:'#f97316', glow:'rgba(249,115,22,0.3)', ... }, // 代谢·橙
  3: { primary:'#3b82f6', glow:'rgba(59,130,246,0.3)', ... }, // 物流·蓝
  4: { primary:'#eab308', glow:'rgba(234,179,8,0.3)', ... },  // 自动化·黄
  5: { primary:'#a855f7', glow:'rgba(168,85,247,0.3)', ... }, // 奇观·紫
};

// 资源色彩
const RES = {
  glucose:  { c:'#22c55e', icon:'🟢' },   // 与P1共色 ✅
  energy:   { c:'#f97316', icon:'⚡' },    // 与P2共色 ✅
  dna:      { c:'#a855f7', icon:'🧬' },    // 与P5共色 ⚠️ 语义冲突
  nitrogen: { c:'#3b82f6', icon:'🔵' },    // 与P3共色 ⚠️
  protein:  { c:'#ec4899', icon:'🧪' },    // 独立色 ✅
  biomass:  { c:'#10b981', icon:'🧱' },    // 独立色 ✅
  qs:       { c:'#eab308', icon:'📡' },    // 与P4共色 ⚠️
};
```

#### 审计发现

**✅ 优点：**
- Token 化程度高，50+ CSS 变量可全局调控
- 阶段色到 CSS 变量的映射完整（`setPhaseColors()` 函数实时更新 4 个变量）
- 色彩层次结构逻辑清晰（基础色→语义色→状态色→阶段色）
- 资源色彩辨识度高，一看就知道资源类型

**⚠️ 问题：**

1. **阶段色与资源色的语义冲突**
   - P1 绿 = 葡萄糖绿 → P1 期间正好，P3 之后葡萄糖仍是绿色但 UI 色调已变蓝
   - DNA 紫 = P5 紫 → 玩家从 P1 就看到紫色 DNA，但紫色应该是"终极/奇观"的高贵色
   - QS 黄 = P4 黄 → P4 之前不存在 QS，没有实际冲突，但设计上应标注这种耦合

2. **建筑背景色分类依据不统一**
   - `bg-green`/`bg-blue` 等按颜色命名，而 `bg-wonder` 按语义命名
   - 缺少 `bg-amber` 正式定义（发酵液泡用了 `bg-amber` 但未在 CSS 中单独定义）
   - 10 个建筑背景色 vs 5 个阶段色 → 映射关系不够直观

3. **状态色与语义色存在重叠**
   - `--status-ok: #22c55e` vs `--color-success: #22c55e` → 同色不同 token，维护负担
   - `--status-special: #a855f7` vs `--color-max: #a855f7` → 又一组重复

4. **暗色背景单调**
   - 整体 `#0a0e17` 深空底色统一，缺少阶段相关的背景氛围变化
   - `--phase-bg-tint` 的 0.02 透明度过低，几乎不可感知

**评分：7.5/10** — 系统成熟但存在语义重叠和阶段感知弱化的问题

---

### 1.2 字体系统审计

#### 当前架构

```css
/* 三层字体系统 */
--font-heading: 'Orbitron', monospace;     /* 科幻标题体 */
--font-body: 'Rajdhani', sans-serif;       /* 印度几何体 */
--font-mono: 'Share Tech Mono', monospace; /* 技术数据体 */

/* 6 级尺寸标尺 */
--fs-2xs: 0.55em; --fs-xs: 0.62em; --fs-sm: 0.72em;
--fs-md: 0.82em;  --fs-lg: 0.92em; --fs-xl: 1.05em;
```

#### 审计发现

**✅ 优点：**
- 三层分工明确：标题/正文/数据各司其职
- Orbitron 的科幻感与微生物题材形成有趣张力（高科技观察微观世界）
- Share Tech Mono 用于数据展示非常合适
- 6 级尺寸标尺从 0.55em 到 1.05em 覆盖完整
- 提供了 `.font-heading` / `.font-body` / `.font-mono` 工具类

**⚠️ 问题：**

1. **尺寸基准偏小**
   - 最大的 `--fs-xl: 1.05em` 仅比正文大 5%，缺乏视觉冲击力
   - 阶段名称、成就标题等需要更醒目的尺寸（建议增加 `--fs-2xl: 1.3em` 和 `--fs-3xl: 1.6em`）

2. **Rajdhani 的中文兼容性**
   - Rajdhani 是拉丁字体，中文字符会 fallback 到系统默认
   - 游戏大量中文文案（建筑名、事件描述、引导文字）在 fallback 时字重和字形不统一
   - 建议为中文添加专门的字体栈（如 `'Noto Sans SC'` 或 `'Source Han Sans'`）

3. **缺少字重规范**
   - 字体 token 只定义了 family，没有 weight 规范
   - Orbitron 标题有的用 700，有的用 900，缺乏一致性
   - 建议定义 `--fw-regular: 400; --fw-medium: 500; --fw-bold: 700; --fw-black: 900`

4. **行高未 Token 化**
   - 行高散落在各个样式规则中，缺少统一的 `--lh-tight / --lh-normal / --lh-relaxed`

**评分：6.5/10** — 架构合理但尺寸偏保守、中文支持缺失、字重行高未规范

---

### 1.3 图形语言审计

#### 当前视觉元素清单

| 类别 | 内容 | 数量 | 实现方式 |
|------|------|------|---------|
| **建筑图标** | Emoji 为主（🌱🔋🔬💨⚗️🧫🕸️🍄🗼🔩📢☀️等） | 24+ | 文字 emoji |
| **资源图标** | Emoji（🟢⚡🧬🔵🧪🧱📡） | 7 | 文字 emoji |
| **核心菌落** | 阶段 emoji（🔮🦠🔬🏗️✨） | 5 | 文字 emoji |
| **建筑装饰** | SVG 背景 icon（0.03 透明度）、等级徽章、邻接徽章 | - | CSS/HTML |
| **端口指示** | 半圆输入（绿）+ 三角输出（橙）| 2 | CSS shapes |
| **粒子效果** | 营养粒子（bgCanvas）、光粒子（仪式）、传送带粒子 | 3 系统 | Canvas |
| **培养基纹理** | 径向渐变模拟培养皿同心圆 | 1 | CSS radial-gradient |
| **传送带** | 虚线动画 → 流动动画 → 金色脉冲（按负载） | 3 级 | CSS animation |
| **仪式特效** | 阶段仪式、成就仪式、奇观终章 | 3 套 | DOM + CSS + Canvas |

#### 审计发现

**✅ 优点：**
- **Emoji 策略非常聪明**：零资源加载、跨平台一致、辨识度高、天然带颜色
- 建筑视觉层次丰富：背景色 → SVG 底纹 → Emoji → 等级徽章 → 端口 → 悬停效果
- 5 层升级视觉阶梯（Lv1→Lv5 MAX）渐进感强
- 4 种建筑角色有独立的视觉语言（source 绿边/bypass 虚线/boost 蓝光/wonder 紫金渐变）
- 端口 UI（半圆+三角）直观传达输入/输出方向
- 培养基纹理增强了"培养皿"的世界观沉浸感

**⚠️ 问题：**

1. **Emoji 依赖的跨平台一致性风险**
   - 同一 emoji 在 Apple/Google/Windows/Samsung 上外观差异大
   - 🏗️ (building) 在某些平台上辨识度低
   - 🫧 (bubbles) 在旧系统上可能不显示
   - **建议**：对核心游戏 Emoji 建立一份跨平台兼容性速查表，对高风险 emoji 准备 SVG fallback

2. **缺少品牌专属图形**
   - 没有 Logo / 标志性图形
   - 没有吉祥物或品牌 mascot
   - 所有图形元素都是通用的（emoji + CSS 几何图形），缺乏"一看就知道是微生物帝国"的辨识度
   - **建议**：设计一个以微生物细胞为原型的品牌标识

3. **图标体系未形式化**
   - 建筑 emoji 的选择依据未文档化（为什么碳源采集器是 🌱 而不是 🧫？）
   - 部分 emoji 语义重叠（核糖体集群 🫧 和 发酵液泡 🫧 使用了相同 emoji）
   - 邻接加成的 icon 与建筑 emoji 有时重复（⚡ 既是能量资源也是邻接图标）

4. **空间层次感不足**
   - 培养皿格子是扁平的 2D 网格
   - 缺少纵深暗示（如格子阴影、微妙的 3D 透视、叠层效果）
   - 培养基纹理只有一套，5 个阶段不变化

**评分：7.0/10** — Emoji 策略务实高效，但缺少品牌专属图形和图标规范化

---

### 1.4 动效系统审计

#### 当前规模

- **111+ @keyframes 动画**，按功能分为 6 大类
- **5 层动效层级**（微交互→空间引导→状态表达→建造升级→装饰）
- 支持 `prefers-reduced-motion: reduce` 无障碍

| 类别 | 数量 | 代表动画 | 评价 |
|------|------|---------|------|
| 微交互 | ~40 | `fadeIn`, `slideUp`, `pulse-glow`, `shimmer` | ✅ 丰富 |
| 空间引导 | ~15 | `slideFromLeft`, `slideFromRight`, `expandIn` | ✅ 方向清晰 |
| 状态表达 | ~20 | `pulseOk`, `pulseWarn`, `pulseDanger`, `overloadPulse` | ✅ 分级合理 |
| 建造/升级 | ~15 | `buildPop`, `upgradePulse`, `wonderBuild` | ✅ 反馈清晰 |
| 装饰氛围 | ~10 | `floatUpDown`, `gentlePulse`, `bgShimmer` | ⚠️ 偏多 |
| 爆发粒子 | ~11 | `burstParticle-*`(0-7) + 变体 | ✅ 华丽但克制 |

#### 审计发现

**✅ 优点：**
- 数量庞大但组织有序，通过 CSS 模块注释分区管理
- 5 层层级设计合理，从细微到震撼梯度清晰
- 阶段仪式系统（3秒异步编排）非常出色：遮罩→核心进化→色调切换→光粒子→名称展示→屏震→闪白→恢复
- 成就仪式的三层级（铜/金/钻）与游戏奖励层级对应
- 无障碍支持到位

**⚠️ 问题：**

1. **缺少统一的 Easing Token**
   - 各动画散落使用 `ease`, `ease-out`, `ease-in-out`, `cubic-bezier(...)`
   - 没有品牌标准缓动函数（如 `--ease-brand: cubic-bezier(0.34, 1.56, 0.64, 1)`）
   - 建议定义 3-5 个品牌缓动：`--ease-spring` (弹性), `--ease-organic` (有机感), `--ease-tech` (科技感)

2. **Duration 未规范化**
   - 动画时长从 0.15s 到 15s 跨度极大
   - 缺少 `--dur-instant / --dur-fast / --dur-normal / --dur-slow / --dur-ceremony` 的 Token 化

3. **111 个动画的维护成本**
   - 部分动画高度相似（如 `pulseGreenSoft` / `pulseGold` / `pulsePurple` 仅色值不同）
   - 可通过 CSS 自定义属性 + 通用 keyframe 合并，减少到 ~50 个

4. **动效缺少"生物感"签名动作**
   - 大部分动效是通用的 UI 动效（fade, slide, pulse）
   - 缺少微生物题材专属的动效语言（如细胞分裂动画、膜渗透效果、DNA 双螺旋旋转）
   - 品牌动效应该让人看到就联想到"微生物"

**评分：8.0/10** — 数量充足、层次分明，但缺少品牌标识性动效和 Token 化

---

### 1.5 音频品牌审计

#### 当前系统

**SFX 引擎**：20+ 程序化音效（Web Audio API 合成）
```
build, buildFail, recycle, select, researchStart, researchDone,
achieve, evolve, phaseUp, combo, wonderStart, wonderDone,
wonderFinale, milestone, eventGood, eventBad, reward, bigReward,
click, pause, coreUpgrade, boot
```

**BGM 系统**：5 阶段程序化琶音 BGM
- P1：C 大调 sine 波，70BPM，安静原始
- P2：D 大调 triangle 波，80BPM，温暖成长
- P3：小调 triangle 波，95BPM，科技节奏
- P4：低沉 sine 波，85BPM，深沉有力
- P5：明亮大调 sine 波，75BPM，宏伟终章

**wonderFinale**：4 阶段史诗合成曲（低音震动→和弦攀升→主题旋律→辉煌终响）

#### 审计发现

**✅ 优点：**
- **零资源加载的全程序化音频** — 和 emoji 策略一样聪明，完美匹配单文件架构
- BGM 阶段主题设计精心，调性/波形/节奏都随阶段变化
- wonderFinale 是整个游戏的音频高潮，4 阶段编排令人满意
- SFX 覆盖全面，从微交互（click）到大事件（phaseUp/achieve）都有
- 支持独立的 SFX/BGM 音量控制和开关

**⚠️ 问题：**

1. **缺少品牌音频签名**
   - 没有"启动音"品牌 jingle（boot 音效只是简单的上行音阶）
   - 没有可辨识的"微生物帝国"音频 logo
   - 建议为 boot 设计 3-5 秒的品牌 jingle

2. **BGM 阶段切换突兀**
   - `startBGM(phase)` 直接 `stopBGM()` + 重启，没有交叉淡入淡出
   - 建议添加 1-2 秒的交叉淡入淡出过渡

3. **SFX 缺少空间感**
   - 所有音效都是单声道中央播放
   - 可考虑对建筑操作音效添加轻微的立体声偏移（左侧建筑偏左，右侧偏右）

**评分：8.5/10** — 程序化方案优雅高效，品牌签名是唯一明显缺失

---

### 1.6 综合评分

| 维度 | 评分 | 关键发现 |
|------|------|---------|
| 色彩系统 | **7.5/10** | Token 化成熟，阶段色-资源色语义冲突，背景感知弱 |
| 字体系统 | **6.5/10** | 三层分工好，中文缺失、尺寸偏小、字重未规范 |
| 图形语言 | **7.0/10** | Emoji 策略高效，缺品牌专属图形和图标规范 |
| 动效系统 | **8.0/10** | 111 动画组织有序，缺品牌签名动效和 Token |
| 音频品牌 | **8.5/10** | 程序化方案优雅，缺品牌 jingle |
| **总分** | **7.5/10** | **系统完整度高，品牌辨识度是最大短板** |

**一句话诊断**：微生物帝国拥有一套**功能上完备的视觉系统**，但缺少**品牌层面的差异化签名**——去掉文字标题后，玩家无法仅凭视觉识别出"这是微生物帝国"。

---

## 2. 核心问题诊断

### 问题 #1：品牌辨识度不足 🔴 优先级最高

**症状**：
- 没有品牌 Logo / 标识
- 没有品牌专属字体或字标
- 色彩虽丰富但不独特（Tailwind CSS 标准色）
- 图标全部使用通用 emoji，无专属图形
- 动效全是通用 UI 动效，无微生物主题标识动效

**根因**：项目从功能开发起步，视觉系统围绕"功能需求"搭建，未从"品牌识别"角度设计。

**影响**：
- 游戏截图在社交媒体上缺乏辨识度
- 玩家无法形成"一看就认出"的品牌印象
- 缺乏 merch/衍生品的视觉基础

### 问题 #2：阶段色与资源色语义耦合 🟡 中等优先级

**症状**：DNA（紫色）从 P1 出现，但紫色语义是"P5 奇观/终极"。

**影响**：P1 新手期间紫色 DNA 会弱化紫色的"终极"感知；P3 蓝色界面中蓝色氮源不够突出。

### 问题 #3：中文排版缺少专属字体 🟡 中等优先级

**症状**：Rajdhani 是拉丁字体，中文回退到系统默认字体。

**影响**：英文和中文在同一界面上字形风格断裂，降低视觉统一性。

### 问题 #4：视觉 Token 不完整 🟢 低优先级（但影响长期维护）

**症状**：Easing、Duration、Font Weight、Line Height 未 Token 化。

**影响**：增加新动效或调整风格时容易破坏一致性。

---

## 3. 品牌视觉升级方案

### 3.1 品牌色彩系统 2.0

#### 3.1.1 品牌主色：「生命青」

**当前问题**：8 个主色平等并列，没有一个"品牌代表色"。

**方案**：确立 **`--brand-primary: #06d6a0`（生命青）** 为品牌主色。

**理由**：
- Cyan/Teal 色系在自然界中代表藻类、蓝细菌 → 微生物世界观锚点
- 与任何阶段色都不冲突（阶段色是绿/橙/蓝/黄/紫，青色是独立的中性角色）
- 已经在 CSS 中定义为 `--cyan: #06d6a0`，改动最小
- 暗色背景上的可读性极佳

```css
/* 品牌色彩系统 2.0 */
:root {
  /* ═══ 品牌主色 ═══ */
  --brand-primary: #06d6a0;        /* 生命青 — 品牌标识色 */
  --brand-primary-light: #34d399;  /* 浅生命青 — 悬停态 */
  --brand-primary-dark: #059669;   /* 深生命青 — 按下态 */
  --brand-primary-glow: rgba(6,214,160,0.3);
  --brand-primary-tint: rgba(6,214,160,0.06);
  
  /* ═══ 品牌辅色 ═══ */
  --brand-accent: #a855f7;   /* 进化紫 — 升级/进化/高等级 */
  --brand-warm: #f97316;     /* 能量橙 — 活跃/能量/代谢 */
  --brand-cool: #3b82f6;     /* 信息蓝 — 数据/物流/系统 */
  
  /* ═══ 阶段色（保持不变，已经很好） ═══ */
  --phase-1: #22c55e;  /* 采集·自然绿 */
  --phase-2: #f97316;  /* 代谢·能量橙 */
  --phase-3: #3b82f6;  /* 物流·蓝 */
  --phase-4: #eab308;  /* 自动化·信号黄 */
  --phase-5: #a855f7;  /* 奇观·进化紫 */
}
```

#### 3.1.2 背景色分层增强

**方案**：为每个阶段添加可感知的环境色调变化。

```css
:root {
  --bg-base: #0a0e17;     /* 不变 */
  --bg-surface: #0f1320;  /* 新增：卡片/面板表面 */
  --bg-elevated: #151a2a; /* 新增：浮层/弹窗 */
}

/* 阶段背景氛围 — 将 tint 从 0.02 提升到 0.04，增加可感知度 */
/* 同时为 <body> 添加阶段相关的径向渐变氛围光 */
body::after {
  content: '';
  position: fixed; inset: 0; z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    ellipse 60% 40% at 50% 100%,
    var(--phase-bg-tint),
    transparent 70%
  );
  transition: background 1.5s ease;
}
```

#### 3.1.3 资源色微调建议

为解决阶段色-资源色语义冲突，对 DNA 色做微调：

```javascript
// 方案A（推荐 — 最小改动）：
// DNA 保持紫色但偏蓝（与P5的暖紫做区分）
dna: { c:'#818cf8', icon:'🧬' },  // 冷紫/靛蓝 vs P5的暖紫 #a855f7

// 方案B（激进 — 更彻底的区分）：
// DNA 改为靛蓝色，彻底与P5紫分离
dna: { c:'#6366f1', icon:'🧬' },  // 靛蓝色
```

**推荐方案 A**：将 DNA 色从 `#a855f7` 微调为 `#818cf8`（冷紫/靛蓝），与 P5 的暖紫 `#a855f7` 形成冷暖区分，同时保持紫色族的归属感。

---

### 3.2 字体系统升级

#### 3.2.1 中文字体栈

```css
:root {
  /* 升级后的字体系统 */
  --font-heading: 'Orbitron', 'Noto Sans SC', sans-serif;
  --font-body: 'Rajdhani', 'Noto Sans SC', sans-serif;
  --font-mono: 'Share Tech Mono', 'Noto Sans Mono', monospace;
  
  /* 中文专用（可选：当需要纯中文显示时） */
  --font-cn: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

**说明**：
- 添加 `Noto Sans SC` 作为中文回退字体
- 不额外加载字体文件（利用系统已安装的字体），保持零网络开销
- `PingFang SC` (macOS) / `Microsoft YaHei` (Windows) 作为二级回退

#### 3.2.2 字重 Token 化

```css
:root {
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;
  --fw-black: 900;
}
```

**使用规范**：
- 标题（Orbitron）：`--fw-bold` (700) 为默认，`--fw-black` (900) 仅用于阶段名称和品牌标识
- 正文（Rajdhani）：`--fw-regular` (400) 正文，`--fw-semibold` (600) 强调
- 数据（Share Tech Mono）：`--fw-medium` (500) 为默认

#### 3.2.3 尺寸标尺扩展

```css
:root {
  /* 现有 6 级保持不变 */
  --fs-2xs: 0.55em;
  --fs-xs: 0.62em;
  --fs-sm: 0.72em;
  --fs-md: 0.82em;
  --fs-lg: 0.92em;
  --fs-xl: 1.05em;
  
  /* 新增 3 级 — 用于标题和仪式 */
  --fs-2xl: 1.3em;   /* 面板标题 */
  --fs-3xl: 1.6em;   /* 阶段名称 */
  --fs-hero: 2.2em;  /* 品牌标题 / 仪式文字 */
}
```

#### 3.2.4 行高 Token 化

```css
:root {
  --lh-tight: 1.15;   /* 标题 */
  --lh-normal: 1.45;  /* 正文 */
  --lh-relaxed: 1.65; /* 长文 / 描述 */
}
```

---

### 3.3 图形语言规范

#### 3.3.1 品牌标识设计方向

**概念**：以「单细胞生物」为原型，抽象化为品牌标识。

```
  设计要素：
  ┌─────────────────────────┐
  │                         │
  │    ╭─── 细胞膜 ───╮     │  外圈：圆润的细胞轮廓
  │    │   ●  ○  ○    │     │  内部：3个不规则圆（细胞器）
  │    │  ○    ●      │     │  核心：发光的核（品牌青色）
  │    │    ○    ●    │     │  
  │    ╰──────────────╯     │  动态版：细胞器会缓慢浮动
  │                         │
  └─────────────────────────┘
```

**品牌标识 MVP**（纯 CSS 实现，保持零资源加载理念）：

```css
.brand-logo {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 55% 45%,
    var(--brand-primary) 20%,
    rgba(6,214,160,0.3) 40%,
    transparent 70%
  );
  border: 2px solid var(--brand-primary);
  box-shadow: 0 0 12px var(--brand-primary-glow);
  position: relative;
  animation: cellBreath 4s ease-in-out infinite;
}

/* 细胞器（3个小圆点） */
.brand-logo::before { /* 核 */
  content: '';
  position: absolute;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--brand-primary);
  top: 35%; left: 40%;
  animation: organelleFloat 6s ease-in-out infinite;
}

@keyframes cellBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes organelleFloat {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(2px, -1px); }
  66% { transform: translate(-1px, 2px); }
}
```

#### 3.3.2 建筑 Emoji 规范文档

| 建筑 | 当前 Emoji | 语义理由 | 跨平台风险 | 备注 |
|------|-----------|---------|-----------|------|
| 碳源采集器 | 🌱 | 萌芽=采集=起始 | 低 | ✅ |
| ATP 合成酶 | 🔋 | 电池=能量 | 低 | ✅ |
| 简易提取器 | 🔬 | 显微镜=研究 | 低 | ✅ |
| 能量缓冲池 | 🪫 | 低电量电池=缓冲 | **中** | 2022年新emoji |
| 固氮装置 | 💨 | 气体=氮气 | 低 | ✅ |
| 蛋白质工厂 | ⚗️ | 蒸馏=化学 | 低 | ✅ |
| DNA提取器 | 🏭 | 工厂=高效 | 低 | ✅ |
| 氨基酸合成仪 | 🧬 | DNA=基因 | 低 | ⚠️ 与资源图标🧬重复 |
| 核糖体集群 | 🫧 | 气泡=群体 | **高** | 2021新emoji |
| 生物膜反应器 | 🧫 | 培养皿=生物 | 低 | ✅ |
| 菌丝运输网 | 🕸️ | 蛛网=网络 | 低 | ✅ |
| 孢子播种器 | 🍄 | 蘑菇=孢子 | 低 | ✅ |
| 代谢回路 | ♻️ | 循环=代谢 | 低 | ✅ |
| 发酵液泡 | 🫧 | 气泡 | **高** | ⚠️ 与核糖体重复 |
| 信号中继站 | 📡 | 天线=信号 | 低 | ⚠️ 与QS资源图标重复 |
| 群体感应塔 | 🗼 | 塔=广播 | 低 | ✅ |
| 纳米组装线 | 🔩 | 螺丝=精密 | 低 | ✅ |
| 信息素广播站 | 📢 | 喇叭=广播 | 低 | ✅ |
| 共振培养箱 | 🌀 | 漩涡=共振 | 低 | ✅ |
| 微型戴森球 | ☀️ | 太阳=恒星能量 | 低 | ✅ |

**问题 Emoji 处理建议**：
- 🫧 (bubbles) → 发酵液泡改为 **🍶** (sake) 或 **🧪** (test tube)
- 🧬 (氨基酸合成仪) → 改为 **⚛️** (atom) 以避免与DNA资源图标冲突
- 🪫 (low battery) → 保持，但准备文字 fallback "[充]"
- 📡 (信号中继站) → 改为 **🔀** (shuffle) 或 **🔗** (link) 以与QS资源区分

#### 3.3.3 培养基纹理阶段化

**方案**：空格子的培养基纹理随阶段变化，增强环境叙事。

```css
/* P1：清澈培养基 — 稀薄、纯净 */
.cell:not(.has-building)[data-phase="1"] {
  background: radial-gradient(
    circle, 
    rgba(34,197,94,0.03) 30%, 
    transparent 70%
  );
}

/* P2：营养丰富 — 偏暖、密度升高 */
.cell:not(.has-building)[data-phase="2"] {
  background: radial-gradient(
    circle,
    rgba(249,115,22,0.04) 20%,
    rgba(34,197,94,0.02) 50%,
    transparent 70%
  );
}

/* P3：生物膜渗透 — 蓝色网状纹理 */
.cell:not(.has-building)[data-phase="3"] {
  background: 
    radial-gradient(circle, rgba(59,130,246,0.04) 25%, transparent 60%),
    repeating-conic-gradient(
      rgba(59,130,246,0.02) 0% 25%, 
      transparent 0% 50%
    );
}

/* P4：QS信号场 — 暗黄色脉冲纹理 */
/* P5：奇观光场 — 紫色辉光 */
```

---

### 3.4 动效设计语言

#### 3.4.1 品牌 Easing Token

```css
:root {
  /* ═══ 品牌缓动函数 ═══ */
  --ease-organic: cubic-bezier(0.25, 0.8, 0.25, 1);      /* 有机生物感 — 默认 */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);      /* 弹性 — 建造/弹出 */
  --ease-gentle: cubic-bezier(0.4, 0, 0.2, 1);            /* 柔和 — 淡入淡出 */
  --ease-sharp: cubic-bezier(0.16, 1, 0.3, 1);            /* 锐利 — 科技感 */
  --ease-bounce: cubic-bezier(0.68, -0.6, 0.32, 1.6);     /* 弹跳 — 奖励/成就 */
  
  /* ═══ 品牌时长 Token ═══ */
  --dur-instant: 80ms;    /* 点击反馈 */
  --dur-fast: 150ms;      /* 悬停/切换 */
  --dur-normal: 300ms;    /* 标准过渡 */
  --dur-slow: 600ms;      /* 面板展开 */
  --dur-dramatic: 1200ms; /* 升级/建造 */
  --dur-ceremony: 3000ms; /* 阶段仪式 */
}
```

#### 3.4.2 品牌签名动效：「细胞分裂」

**概念**：当建造新建筑时，不是简单的 `fadeIn + scale`，而是模拟"细胞分裂"过程。

```css
/* 品牌签名动效 — 细胞分裂建造 */
@keyframes cellDivision {
  0% {
    transform: scale(0);
    border-radius: 50%;
    opacity: 0;
  }
  15% {
    transform: scale(0.6);
    border-radius: 50%;
    opacity: 1;
  }
  30% {
    transform: scale(0.8) scaleX(1.3); /* 拉伸 — 分裂准备 */
    border-radius: 40%;
  }
  45% {
    transform: scale(0.75) scaleX(1.4); /* 继续拉伸 */
    border-radius: 35%;
  }
  55% {
    transform: scale(0.9) scaleX(1.1); /* 收缩回弹 */
    border-radius: 20%;
  }
  70% {
    transform: scale(1.05);
    border-radius: var(--r-md);
  }
  85% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
    border-radius: var(--r-md);
  }
}

/* 品牌签名动效 — 膜渗透出现 */
@keyframes membranePermeation {
  0% {
    clip-path: circle(0% at 50% 50%);
    filter: blur(8px);
  }
  40% {
    clip-path: circle(45% at 50% 50%);
    filter: blur(2px);
  }
  70% {
    clip-path: circle(60% at 48% 52%);
    filter: blur(0);
  }
  100% {
    clip-path: circle(100% at 50% 50%);
    filter: none;
  }
}
```

#### 3.4.3 动画合并方案

**目标**：将 111 个 @keyframes 减少到 ~60 个，通过 CSS 变量参数化。

```css
/* 之前：每种颜色一个 keyframe */
@keyframes pulseGreen { ... box-shadow: 0 0 12px rgba(34,197,94,0.4) ... }
@keyframes pulseGold  { ... box-shadow: 0 0 12px rgba(234,179,8,0.4) ... }
@keyframes pulsePurple { ... box-shadow: 0 0 12px rgba(168,85,247,0.4) ... }

/* 之后：一个参数化 keyframe */
@keyframes pulseColor {
  0%, 100% { box-shadow: 0 0 0 var(--pulse-color, rgba(6,214,160,0.3)); }
  50% { box-shadow: 0 0 12px var(--pulse-color, rgba(6,214,160,0.4)); }
}

.status-ok    { --pulse-color: rgba(34,197,94,0.4); animation: pulseColor 2s infinite; }
.status-warn  { --pulse-color: rgba(234,179,8,0.4); animation: pulseColor 1.5s infinite; }
.status-danger { --pulse-color: rgba(239,68,68,0.4); animation: pulseColor 1s infinite; }
```

**预计合并表**：

| 合并组 | 现有数量 | 合并后 | 方法 |
|--------|---------|--------|------|
| 颜色脉冲系列 | 12 | 1 | CSS 变量参数化 |
| 方向滑入系列 | 6 | 2 | direction 变量 |
| 淡入变体 | 8 | 2 | opacity + transform 变量 |
| 粒子爆发 | 11 | 4 | 角度变量 + 通用公式 |
| **总计** | ~37 | ~9 | 减少 28 个 |

---

### 3.5 音频品牌统一

#### 3.5.1 品牌启动 Jingle

**设计方向**：3.5 秒的品牌 jingle，模拟"微生物苏醒"。

```javascript
brandJingle() {
  const c = getCtx();
  const now = c.currentTime;
  
  // Phase 1: 低沉的嗡鸣 — 沉睡的微生物 (0-0.8s)
  playTone(110, 0.8, 'sine', 0.06);     // 低频底音
  playNoise(0.6, 0.02, 'lowpass', 400);  // 轻微的底噪
  
  // Phase 2: 生命脉冲 — 第一次心跳 (0.5-1.5s)
  playTone(220, 0.3, 'sine', 0.1, 0, 0.5);  // 脉冲 1
  playTone(220, 0.2, 'sine', 0.08, 0, 0.9);  // 脉冲 2
  
  // Phase 3: 上升琶音 — 苏醒 (1.2-2.5s)
  playTone(262, 0.2, 'triangle', 0.1, 0, 1.2);   // C4
  playTone(330, 0.2, 'triangle', 0.1, 0, 1.4);   // E4
  playTone(392, 0.2, 'triangle', 0.12, 0, 1.6);  // G4
  playTone(523, 0.3, 'triangle', 0.12, 0, 1.8);  // C5 — 品牌音
  
  // Phase 4: 品牌长音 — 生命青的声音 (2.0-3.5s)
  playTone(523, 0.8, 'sine', 0.1, 0, 2.0);       // C5 持续
  playTone(660, 0.6, 'sine', 0.06, 0, 2.2);      // E5 和声
  playTone(784, 0.4, 'sine', 0.04, 0, 2.4);      // G5 泛音
  // 柔和消散
  playNoise(0.3, 0.01, 'highpass', 8000, 2.8);    // 气泡消散感
}
```

#### 3.5.2 BGM 过渡优化

```javascript
function crossfadeBGM(newPhase) {
  if (bgmPhase === newPhase) return;
  const oldMaster = bgmNodes?.master;
  if (!oldMaster) { startBGM(newPhase); return; }
  
  const c = getCtx();
  const now = c.currentTime;
  
  // 旧BGM 1.5秒淡出
  oldMaster.gain.linearRampToValueAtTime(0, now + 1.5);
  
  // 0.5秒后开始新BGM（形成交叉区间）
  setTimeout(() => {
    stopBGM();
    startBGM(newPhase);
    // 新BGM 1秒淡入
    if (bgmNodes?.master) {
      bgmNodes.master.gain.setValueAtTime(0, c.currentTime);
      bgmNodes.master.gain.linearRampToValueAtTime(
        bgmVol * 0.6, c.currentTime + 1.0
      );
    }
  }, 500);
}
```

---

## 4. 阶段进化视觉叙事增强

### 4.1 阶段视觉签名矩阵

每个阶段应该有**完整的视觉签名**，形成从微观到宏观的进化感知：

| 维度 | P1 采集 | P2 代谢 | P3 物流 | P4 自动化 | P5 奇观 |
|------|---------|---------|---------|-----------|---------|
| **主色** | 🟢 #22c55e | 🟠 #f97316 | 🔵 #3b82f6 | 🟡 #eab308 | 🟣 #a855f7 |
| **情绪** | 安宁·朴素 | 温暖·忙碌 | 冷静·秩序 | 明亮·自信 | 神秘·辉煌 |
| **核心emoji** | 🔮 原始液泡 | 🦠 原核聚落 | 🔬 生物膜枢纽 | 🏗️ 菌落中枢 | ✨ 生命圣殿 |
| **BGM调性** | C大调 sine 70BPM | D大调 triangle 80BPM | 小调 triangle 95BPM | 低沉 sine 85BPM | 大调 sine 75BPM |
| **粒子密度** | 稀疏(20) | 中等(50) | 密集(100) | 有序(120) | 绚烂(150) |
| **培养基** | 清澈透明 | 营养浑浊 | 蓝色生物膜 | 黄色信号场 | 紫色星光 |
| **格子边框** | 细实线 | 实线+微光 | 双线 | 虚线+脉冲 | 渐变+辉光 |
| **建造动效** | 基础缩放 | 弹性出现 | 滑入+连接 | 自动弹出 | 细胞分裂+光爆 |

### 4.2 阶段过渡仪式增强建议

当前仪式系统已经很完善（3秒异步编排），但可以添加一个**视觉签名元素**：

```
阶段过渡时，在中心位置显示一个短暂的"进化符号"：

P1→P2:  🌱→🦠  "细胞开始分化"  — 绿色粒子变橙
P2→P3:  🦠→🔬  "生物膜形成"    — 橙色粒子变蓝
P3→P4:  🔬→🏗️  "智能觉醒"      — 蓝色粒子变黄
P4→P5:  🏗️→✨  "奇观启动"      — 黄色粒子变紫
```

**实现方式**：在现有仪式 overlay 上增加一行过渡 emoji 和文字，不需要大改。

---

## 5. 实施路线图

### Sprint 1：品牌基础 (1-2天)

| # | 任务 | 改动量 | 风险 |
|---|------|-------|------|
| 1.1 | 添加品牌色 Token（`--brand-primary` 等 5 个） | CSS 5 行 | 极低 |
| 1.2 | 添加中文字体栈回退 | CSS 3 行 | 极低 |
| 1.3 | 添加字重/行高 Token | CSS 8 行 | 低 |
| 1.4 | 添加字号扩展（2xl/3xl/hero） | CSS 3 行 | 低 |
| 1.5 | 添加 Easing/Duration Token | CSS 12 行 | 低 |
| 1.6 | 提升 `--phase-bg-tint` 透明度 0.02→0.04 | CSS 1 行 | 低 |

**预估**：~30 行 CSS 改动，零破坏性。

### Sprint 2：品牌图形 (2-3天)

| # | 任务 | 改动量 | 风险 |
|---|------|-------|------|
| 2.1 | 实现 CSS 品牌 Logo（细胞图形） | CSS ~30 行, HTML 2 行 | 低 |
| 2.2 | 修复重复 emoji（🫧×2, 📡×2） | JS 4 行 | 低 |
| 2.3 | 添加培养基阶段纹理 | CSS ~40 行, JS ~5 行 | 中 |
| 2.4 | 添加背景氛围渐变 | CSS ~15 行 | 低 |

**预估**：~90 行改动，无逻辑风险。

### Sprint 3：品牌动效 (2-3天)

| # | 任务 | 改动量 | 风险 |
|---|------|-------|------|
| 3.1 | 实现「细胞分裂」建造动效 | CSS ~30 行 | 低 |
| 3.2 | 合并同类 @keyframes（-28 个） | CSS 重构 ~200 行 | **中** |
| 3.3 | 将现有动画迁移到 Easing/Duration Token | CSS 批量替换 | 中 |
| 3.4 | 实现品牌启动 Jingle | JS ~20 行 | 低 |
| 3.5 | BGM 交叉淡入淡出 | JS ~25 行 | 低 |

**预估**：~275 行改动，keyframe 合并需要充分测试。

### Sprint 4：精细打磨 (1-2天)

| # | 任务 | 改动量 | 风险 |
|---|------|-------|------|
| 4.1 | DNA 色微调（#a855f7→#818cf8） | JS 1 行, CSS ~5 行 | 低 |
| 4.2 | 阶段过渡仪式增加"进化符号"层 | JS ~20 行, CSS ~15 行 | 低 |
| 4.3 | 建筑背景色命名统一（bg-* 语义化） | CSS 重命名 | 中 |
| 4.4 | 全面 QA + 响应式验证 | 测试 | - |

**预估**：~40 行改动 + 测试。

### 总览

| Sprint | 耗时 | 改动量 | 品牌辨识度提升 |
|--------|------|--------|--------------|
| S1 品牌基础 | 1-2天 | ~30行 | ⭐ |
| S2 品牌图形 | 2-3天 | ~90行 | ⭐⭐⭐ |
| S3 品牌动效 | 2-3天 | ~275行 | ⭐⭐ |
| S4 精细打磨 | 1-2天 | ~40行 | ⭐ |
| **合计** | **6-10天** | **~435行** | **7.5→9.0/10** |

---

## 6. 品牌视觉速查卡

### 色彩速查

```
品牌主色      #06d6a0  生命青       ████████
品牌辅色      #a855f7  进化紫       ████████
品牌暖色      #f97316  能量橙       ████████
品牌冷色      #3b82f6  信息蓝       ████████

阶段1 采集    #22c55e  自然绿       ████████
阶段2 代谢    #f97316  能量橙       ████████
阶段3 物流    #3b82f6  科技蓝       ████████
阶段4 自动化  #eab308  信号黄       ████████
阶段5 奇观    #a855f7  奇观紫       ████████

背景底色      #0a0e17  深空         ████████
面板表面      #0f1320  暗面         ████████
浮层背景      #151a2a  提升面       ████████
```

### 字体速查

```
标题    Orbitron / Noto Sans SC     700-900   紧凑行高 1.15
正文    Rajdhani / Noto Sans SC     400-600   标准行高 1.45
数据    Share Tech Mono             500       紧凑行高 1.15
```

### 动效速查

```
点击反馈    80ms     --ease-organic
悬停效果    150ms    --ease-gentle
标准过渡    300ms    --ease-organic
面板展开    600ms    --ease-gentle
建造动效    1200ms   --ease-spring    ← 使用细胞分裂动效
阶段仪式    3000ms   --ease-organic
```

### 品牌故事

> **从一滴到一个宇宙**
> 
> 玩家从一滴原始培养液中的第一个微生物开始，
> 经历采集、代谢、物流、自动化四个进化阶段，
> 最终建造微型戴森球，成就微生物帝国的辉煌。
> 
> 品牌视觉的核心叙事：
> - **生命感** — 一切视觉元素都带有有机的呼吸感和生长节奏
> - **进化感** — 从简单到复杂，从朴素到华丽，视觉复杂度随游戏进度渐增
> - **尺度感** — 从单细胞到帝国，视觉叙事传达微观世界的宏大史诗

---

> **文档结束**
> 
> 本文档为微生物帝国品牌视觉系统的完整审计与升级方案。
> 所有升级建议均基于现有代码分析，保持零外部资源加载的设计理念，
> 确保与单文件架构兼容。
