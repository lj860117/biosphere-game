# 🎨 微生物帝国 — 视觉叙事评估与增强方案

> **评估版本**: v0.9.3 | **日期**: 2026-03-21  
> **评估范围**: index.html (4195行 CSS/HTML) + game.js (17432行) 全量视觉代码分析  
> **评估视角**: 视觉叙事专家 — 聚焦「视觉如何讲故事」  
> **核心问题**: 如何通过视觉元素让玩家"看见"微生物帝国的故事

---

## 目录

- [第一部分：视觉叙事现状评估](#第一部分视觉叙事现状评估)
  - [一、总体评分](#一总体评分)
  - [二、视觉叙事五大维度深度分析](#二视觉叙事五大维度深度分析)
  - [三、现有视觉叙事资产盘点](#三现有视觉叙事资产盘点)
  - [四、与同类游戏视觉叙事对比](#四与同类游戏视觉叙事对比)
- [第二部分：视觉叙事增强方案](#第二部分视觉叙事增强方案)
  - [五、品牌视觉故事框架](#五品牌视觉故事框架)
  - [六、阶段性视觉叙事设计](#六阶段性视觉叙事设计)
  - [七、五大增强提案](#七五大增强提案)
  - [八、视觉风格指南](#八视觉风格指南)
  - [九、实施路线图](#九实施路线图)
- [附录](#附录)

---

# 第一部分：视觉叙事现状评估

## 一、总体评分

| 维度 | 评分 | 现状概述 |
|------|------|----------|
| 🎨 色彩叙事系统 | **7.5/10** | 设计令牌完整，5阶段配色明确，但色彩转换缺少仪式感 |
| 🎬 动画叙事力 | **8.0/10** | 111个@keyframes极其丰富，但缺少"叙事弧线"级动画 |
| 🏗️ 空间叙事 | **7.0/10** | 培养皿网格布局功能完善，缺少环境氛围叙事 |
| 🔊 视听协同 | **8.5/10** | SFX引擎20+音效+5阶段BGM，在单文件游戏中极为罕见 |
| 📖 阶段叙事感知 | **6.5/10** | 5阶段进化弧线设计出色，但视觉上阶段差异化不足 |
| 🌍 品牌视觉辨识度 | **7.0/10** | 暗色sci-fi基调有质感，但缺少"微生物"主题的视觉DNA |
| **综合评分** | **⭐ 7.4/10** | **优良** — 视觉基础扎实，叙事传达力有显著提升空间 |

### 一句话诊断

> **微生物帝国拥有一流的叙事文案和出色的功能性视觉系统，但视觉层面更多在"告知"而非"讲述"——玩家能读到故事，但看不到故事在眼前发生。**

---

## 二、视觉叙事五大维度深度分析

### 2.1 色彩叙事系统 — 7.5/10

#### ✅ 优势：完整的设计令牌

项目有一套成熟的 CSS 设计令牌系统（`:root` 变量），包含：
- **8色主色板**：cyan #06d6a0 / green #22c55e / blue #3b82f6 / purple #a855f7 / orange #f97316 / yellow #eab308 / red #ef4444 / pink #ec4899
- **7种语义色**：max(紫) / upgrade(金) / success(绿) / info(蓝灰) / muted / separator / panel
- **字号阶梯**（6级 2xs→xl）、**间距阶梯**（16级 3xs→5xl）、**圆角阶梯**（5级 xs→xl）

#### ✅ 优势：阶段-颜色映射明确

```
P1 采集 = green #22c55e  🌱
P2 代谢 = orange #f97316 ⚗️
P3 物流 = blue #3b82f6   🔗
P4 自动化 = yellow #eab308 🧠
P5 奇观 = purple #a855f7  🏛️
```

这组映射在 `PHASES` 常量中定义，被 `.phase-badge` 使用。核心菌落(`CORE_COLONY`)也有对应的5级颜色进化：
```
🔮 暗绿#4a6a5a → 🦠 亮绿#22c55e → 🔬 蓝#3b82f6 → 🏗️ 金#eab308 → ✨ 紫#a855f7
```

#### ⚠️ 问题1：阶段色彩变化是"突变"而非"渐变"

当玩家从P1升级到P2时，阶段标记颜色从绿色瞬间切换为橙色，整个界面缺少色彩过渡仪式。在叙事层面，这意味着玩家"被告知"自己进入了新阶段，但没有"感受到"文明正在进化。

**对比参照**：Civilization 系列的时代转换会用全屏色调渐变+光效来表达时代跃迁。

#### ⚠️ 问题2：培养皿区域缺少阶段色彩渗透

培养皿（`.center`）始终使用 cyan(`#06d6a0`) 边框发光动画(`dishBorderGlow`)，不随阶段变化。这意味着游戏的"主舞台"在视觉上是静态的——无论P1还是P5，培养皿看起来都一样。

#### ⚠️ 问题3：资源色彩未形成叙事层级

7种资源各有颜色（绿/橙/紫/蓝/粉/青绿/金），但它们在UI中的呈现是平等的。叙事逻辑上，后期资源（QS信号📡）应该比基础资源（葡萄糖🟢）更显眼、更有存在感。

---

### 2.2 动画叙事力 — 8.0/10

#### ✅ 优势：极其丰富的动画库（111个@keyframes）

按叙事功能分类：

| 类别 | 数量 | 代表动画 | 叙事作用 |
|------|------|----------|----------|
| **微交互反馈** | ~40 | fadeIn, pulse, glow, blink | 操作确认、状态提示 |
| **空间指引** | ~15 | guideArrowBounce, guideExpandPulse, guideBtnPulse | 引导玩家注意力 |
| **状态表达** | ~20 | cellBlockedPulse, dormantBadgePulse, spdPulse | 表达建筑/系统状态 |
| **建造/升级** | ~15 | buildDragIn, belt-upgrade-flash, unlockFloatUp | 表达进步和变化 |
| **装饰氛围** | ~10 | emojiFloat, dishBorderGlow, aura, tierGlow | 营造氛围感 |
| **特效爆发** | ~11 | cellSelectPulse, adjGlow, secUnlockFlash | 关键时刻的视觉强调 |

#### ✅ 优势：Juicy Effects 系统

游戏已实现多种"Juice"反馈：
- **飘字系统**：`_showScoreFloat()` / `_showAdjFloat()` — 分数和邻接加成的浮动文字
- **屏幕震动**：`screenShake(intensity)` — 强度分级的屏震（3~10级），用于建造、升级、成就、奇观等关键事件
- **粒子系统**：`particles[]` / `conveyorParticles[]` / `burst-particle` — 建筑粒子、传送带粒子、爆发粒子
- **Canvas背景**：`#bgCanvas` / `#partCanvas` — 双层Canvas实现背景和粒子效果

#### ⚠️ 问题1：缺少"叙事弧线"级动画

现有动画都是**瞬时反馈型**（持续0.1~3秒），没有持续性的**叙事动画**——一种随时间推移持续变化、讲述"正在发生什么"的视觉系统。

**缺失的叙事动画类型**：
- 🚫 没有"文明生长"动画（培养皿中微生物逐渐扩散的连续表现）
- 🚫 没有"资源流动"可视化（从建筑A到建筑B的资源传输视觉）
- 🚫 没有"阶段渐变"过渡（P1到P2的视觉形态转化）
- 🚫 没有"昼夜循环"或"生命周期"的持续视觉节奏

#### ⚠️ 问题2：高潮时刻的动画配置不足

虽然屏震系统设计精良（强度分级），但"阶段升级"和"奇观建成"这两个最重要的叙事高潮缺少专属的全屏级视觉表演。当前的处理是：
- 阶段升级：震屏 + 日志消息 + 音效
- 奇观建成：震屏(10) + 日志消息

对比一下奇观事件链的**文案叙事质量**（被评为全游戏最佳），视觉表演力是明显落后的。

---

### 2.3 空间叙事 — 7.0/10

#### ✅ 优势：培养皿网格的空间隐喻

培养皿作为游戏的"世界地图"，是一个优秀的空间隐喻——所有建筑都在培养皿中生长，完美扣题。网格系统支持：
- 邻接检测（空间关系有意义）
- 传送带连线（空间中的物流可视化）
- 建筑拖放（空间交互）
- 区域实验（3×3配方区域）

#### ✅ 优势：建筑视觉系统

每个建筑格子有完整的视觉层次：
```
底层: 背景色(bg-*) + 边框色
中层: SVG图标背景(0.03透明度)
焦点层: 大emoji(1.8em) + 浮动动画
状态层: 等级角标(tier) + 邻接badge + 阻塞badge + 端口指示器
交互层: 选中脉冲 + hover效果
```

5级Tier颜色分级（绿→蓝→青→金→紫+发光）也构成了等级叙事。

#### ⚠️ 问题1：培养皿"空地"无生命感

未被建筑占据的格子是纯暗色（`rgba(8,14,24,0.6)`），看起来像"空位"而非"有生命潜力的培养基"。在微生物叙事中，培养皿的空地应该是"营养丰富的培养基"，有微妙的生命迹象。

#### ⚠️ 问题2：缺少环境叙事层

当前的 `#bgCanvas` 可以用来绘制背景环境，但目前用途有限。培养皿缺少：
- 随阶段变化的"培养基"颜色/纹理
- 微生物群落的背景活动（随机漂浮的微粒）
- 建筑密度增加后的"繁忙度"视觉表达

#### ⚠️ 问题3：传送带缺少资源流动可视化

传送带连线（L形路径）展示了建筑间的连接关系，但**缺少流动动画**——看不到资源在传送带上"流过去"。这是一个重大的空间叙事缺失，因为资源流动是放置类游戏的核心视觉语言（参考 Factorio 的传送带是整个游戏最标志性的视觉元素）。

---

### 2.4 视听协同 — 8.5/10

#### ✅ 优势：行业罕见的程序化音频引擎

`SFX` 模块基于 Web Audio API，包含：

**20+交互音效**：
| 音效 | 设计 | 叙事功能 |
|------|------|----------|
| build() | C5→E5→G5 升调三和弦 + 高频噪声 | "建造成功"的愉悦感 |
| buildFail() | 低频锯齿波降调 | "此处不可建造"的拒绝感 |
| recycle() | 600→450→300Hz 降调方波 | "拆解回收"的解构感 |
| researchStart() | A4→C#5→E5 三角波升调 | "科研启动"的期待感 |
| select() | 高频正弦波双击 | 轻盈的选择反馈 |

**5阶段自适应BGM**：
- 每个阶段有独立的音乐主题（不同和弦进行、音色、节奏）
- 通过 `updateBGMPhase(phase)` 随阶段切换
- 程序化生成，无外部音频文件依赖

这在单文件网页游戏中几乎是**独一份**的完成度。

#### ⚠️ 问题：音效与视觉反馈的同步可以更紧密

虽然震屏和音效都在关键事件中触发，但缺少"音画联动"的高级表现：
- 阶段升级时没有专属的"进化号角"
- 传送带连接成功时没有"通路打通"的声音
- 邻接加成触发时没有"协同共鸣"的音效

---

### 2.5 阶段叙事感知 — 6.5/10

这是**最大的视觉叙事短板**。

#### ✅ 优势：阶段定义的叙事质量极高

5个阶段的定义（名称+图标+颜色+描述+核心菌落进化）是整个游戏叙事设计的骨架，质量无可挑剔：

```
🔮 原始液泡 — "最初的生命痕迹...一团脆弱的原始液泡"
🦠 原核聚落 — "细胞开始分化，原核生物聚集成群"
🔬 生物膜枢纽 — "致密的生物膜包裹着繁忙的代谢中心"
🏗️ 菌落中枢 — "高度组织化的微生物城市核心"
✨ 生命圣殿 — "微生物帝国的终极神殿，散发着耀眼光芒"
```

#### ⚠️ 核心问题：阶段差异在视觉上几乎不可感知

从P1到P5，以下视觉元素**不变**：
- 培养皿边框色和动画（始终cyan）
- 网格背景色
- 面板样式
- 侧边栏外观
- 字体和整体色调

实际上**变化的元素**仅有：
- 顶部阶段标记(`.phase-badge`)的颜色和文字
- 核心菌落的emoji和颜色
- 可建造的建筑种类增多

这意味着一个P1的新手和一个P5的老手，看到的**游戏界面整体观感几乎相同**。在叙事层面，这等于说"文明从原始液泡进化到了生命圣殿，但世界看起来没什么变化"——与叙事意图严重脱节。

---

## 三、现有视觉叙事资产盘点

### 3.1 CSS资产

| 类别 | 数量 | 质量 |
|------|------|------|
| 设计令牌 (:root变量) | 50+ | ⭐⭐⭐⭐⭐ 行业级规范 |
| CSS模块 | 25个 | ⭐⭐⭐⭐⭐ 组织清晰 |
| @keyframes动画 | 111个 | ⭐⭐⭐⭐ 数量丰富，类型可扩展 |
| 响应式断点 | 3+ | ⭐⭐⭐⭐ 覆盖移动端 |
| 无障碍支持 | prefers-reduced-motion | ⭐⭐⭐⭐ 有基础考虑 |

### 3.2 JS视觉资产

| 系统 | 代码量(估) | 质量 |
|------|-----------|------|
| SFX音效引擎 | ~500行 | ⭐⭐⭐⭐⭐ 行业罕见 |
| 屏震系统 | ~30行 | ⭐⭐⭐⭐ 分级设计 |
| 飘字系统 | ~80行 | ⭐⭐⭐⭐ 功能完善 |
| 粒子系统 | ~100行 | ⭐⭐⭐ 基础实现 |
| Canvas背景 | ~50行 | ⭐⭐⭐ 潜力未充分利用 |

### 3.3 字体资产

- **Orbitron** (400/700/900) — 科技感标题字体
- **Rajdhani** (300-700) — 正文/UI字体，科幻但可读
- **Share Tech Mono** — 数据/数字展示

字体选择与"微生物科技帝国"主题高度契合。

---

## 四、与同类游戏视觉叙事对比

| 维度 | 微生物帝国 | Factorio | Universal Paperclips | Kittens Game | Cell Lab |
|------|-----------|----------|---------------------|-------------|----------|
| **阶段视觉差异** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **资源流动可视** | ⭐⭐ | ⭐⭐⭐⭐⭐ | N/A | N/A | ⭐⭐⭐ |
| **动画丰富度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| **音频叙事** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐ |
| **环境氛围** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **品牌辨识度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**关键差距**：微生物帝国在动画数量和音频上领先同类，但在「阶段视觉差异化」和「空间叙事」上有明显短板。

---

# 第二部分：视觉叙事增强方案

## 五、品牌视觉故事框架

### 5.1 核心视觉叙事主题

> **"从一滴到一个宇宙"** — 在培养皿的方寸之间，见证微生物文明从零到奇观的壮阔旅程。

### 5.2 视觉叙事三大支柱

```
┌─────────────────────────────────────────────────────────┐
│                 品牌视觉故事框架                          │
├─────────────┬──────────────┬────────────────────────────┤
│  🧬 生命感   │  📈 进化感    │  🌌 尺度感                  │
│  看得到生长   │  看得到变强    │  看得到从微观到宏观          │
├─────────────┼──────────────┼────────────────────────────┤
│ · 培养基脉动  │ · 阶段色彩演变 │ · P1培养皿 → P5生物圈      │
│ · 微粒漂浮    │ · 界面进化    │ · 建筑从简陋到精密          │
│ · 资源流动    │ · 复杂度可视化 │ · 核心菌落体积增长          │
│ · 环境呼吸    │ · 成就仪式    │ · 视野范围扩大              │
└─────────────┴──────────────┴────────────────────────────┘
```

### 5.3 视觉叙事情感弧线

```
情感强度
  ▲
  │              ④阶段升级        ⑦奇观建成
  │                ╱╲              ╱████
  │    ②首次建造  ╱  ╲    ⑥量子跃迁 ████
  │      ╱╲     ╱    ╲    ╱     ████
  │ ①开场╱  ╲  ╱  ⑤日常运营╲  ╱      ████
  │    ╱    ╲╱        ╲╱       ████
  │   ╱      ③探索适应              ████
  ├──┼──────────────────────────────────→ 游戏时间
  │  P1     P2      P3     P4     P5
```

**目标**：通过视觉手段在⑦个关键时刻创造情感峰值。

---

## 六、阶段性视觉叙事设计

### 6.1 P1 采集 — "生命的萌芽"

**视觉关键词**：朦胧、微弱、脆弱、好奇

| 元素 | 当前 | 增强目标 |
|------|------|---------|
| 培养皿边框 | cyan固定发光 | 微弱绿色呼吸光(低频) |
| 背景Canvas | 基础 | 稀疏的营养分子缓慢漂浮 |
| 格子空地 | 纯暗色 | 半透明培养基纹理 + 偶尔的微光闪烁 |
| 核心菌落 | 🔮 + glow | 🔮 + 缓慢脉动 + "正在凝聚"的视觉暗示 |
| 整体亮度 | 标准 | 偏暗，暗示"黎明前" |
| BGM氛围 | 已有P1音乐 | ✅ 保持（已做得好） |

**新增叙事动画**：
- `@keyframes cultureMediumPulse` — 培养基缓慢的明暗呼吸
- 首次放置建筑时：格子从暗到亮的"生命点亮"动画

---

### 6.2 P2 代谢 — "细胞分化"

**视觉关键词**：温暖、分化、活跃、多样性开始显现

| 元素 | 当前 | 增强目标 |
|------|------|---------|
| 培养皿边框 | 同P1 | 渐变为橙色调，脉冲频率加快 |
| 背景Canvas | 同P1 | 增加粒子密度，出现橙色代谢"火花" |
| 新建筑出现 | 即时出现 | "从培养基中生长出来"的入场动画 |
| 资源面板 | 新资源直接显示 | 新资源解锁时有"DNA双螺旋展开"的揭示动画 |
| 传送带 | 静态线条 | 开始显示脉冲流动（慢速） |

**阶段升级仪式**（P1→P2）：
1. 培养皿边框颜色 1.5s 内从绿渐变到橙
2. 核心菌落放大 → emoji变换 → 缩回
3. 全屏轻微绿→橙色调闪烁
4. 📢 "细胞开始分化..." 的叙事飘字
5. 屏震(6) + 进化音效

---

### 6.3 P3 物流 — "群落组织化"

**视觉关键词**：秩序、网络、连接、流动

| 元素 | 当前 | 增强目标 |
|------|------|---------|
| 培养皿边框 | 同P1 | 蓝色调，边框变粗暗示"生物膜" |
| 背景Canvas | 同P1 | 隐约可见的网格状菌丝背景纹理 |
| 传送带 | L形连线 | 可见的资源流动粒子（按传送带颜色着色） |
| 建筑密度 | 无视觉反馈 | 建筑越多，背景越"繁忙"（更多微粒活动） |
| 整体亮度 | 标准 | 略提亮，暗示"文明正在兴起" |

**核心新增**：传送带资源流动动画（详见提案2）

---

### 6.4 P4 自动化 — "智能协调"

**视觉关键词**：智能、脉冲、信号波、精密

| 元素 | 当前 | 增强目标 |
|------|------|---------|
| 培养皿边框 | 同P1 | 金色调 + 更快的脉冲，暗示"QS信号弥漫" |
| 背景Canvas | 同P1 | QS信号可视化：从群体感应塔发出的环形波纹 |
| 建筑交互 | 标准 | 高效建筑有更强的发光(glow)效果 |
| QS信号 | 仅数值显示 | 信号强度映射为全局环境亮度/饱和度微调 |
| 自动化感 | 无特别表现 | 建筑间的"无线连接线"（虚线，代表QS协同） |

---

### 6.5 P5 奇观 — "文明巅峰"

**视觉关键词**：壮观、史诗、光芒、超越

| 元素 | 当前 | 增强目标 |
|------|------|---------|
| 培养皿边框 | 同P1 | 紫色 + 强烈发光 + 边框粒子效果 |
| 背景Canvas | 同P1 | 星空/宇宙纹理渐入（暗示从培养皿走向宇宙） |
| 奇观建造 | 300秒倒计时 | 戴森球在培养皿中心逐帧"组装"的视觉过程 |
| 奇观完成 | 震屏+日志 | 全屏紫金光爆发 + 粒子烟花 + "BIOSPHERE COMPLETE" |
| 核心菌落 | ✨ emoji | 持续发光光环 + 光柱特效 |

---

## 七、五大增强提案

### 提案1：🌈 阶段色彩演变系统（Phase Color Evolution）

**优先级**：🔴 高 | **影响**：全局视觉叙事 | **实现复杂度**：中

#### 核心思路

将培养皿、面板边框、背景等环境元素的色彩与当前阶段绑定，实现"世界随文明进化而变色"的视觉叙事。

#### 实现方案

**1) CSS变量动态化**

在 `:root` 中新增阶段性变量：
```css
:root {
  /* 阶段动态色 — 通过JS在阶段切换时更新 */
  --phase-primary: #22c55e;      /* 当前阶段主色 */
  --phase-glow: rgba(34,197,94,0.3);  /* 当前阶段光晕 */
  --phase-bg-tint: rgba(34,197,94,0.02); /* 当前阶段背景色调 */
  --phase-border: rgba(34,197,94,0.35);  /* 当前阶段边框 */
}
```

**2) 阶段切换时的JS更新**

```javascript
// 在 advancePhase() 中
const phaseColors = {
  1: { primary:'#22c55e', glow:'rgba(34,197,94,0.3)',  tint:'rgba(34,197,94,0.02)',  border:'rgba(34,197,94,0.35)' },
  2: { primary:'#f97316', glow:'rgba(249,115,22,0.3)', tint:'rgba(249,115,22,0.02)', border:'rgba(249,115,22,0.35)' },
  3: { primary:'#3b82f6', glow:'rgba(59,130,246,0.3)', tint:'rgba(59,130,246,0.02)', border:'rgba(59,130,246,0.35)' },
  4: { primary:'#eab308', glow:'rgba(234,179,8,0.3)',  tint:'rgba(234,179,8,0.02)',  border:'rgba(234,179,8,0.35)' },
  5: { primary:'#a855f7', glow:'rgba(168,85,247,0.3)', tint:'rgba(168,85,247,0.02)', border:'rgba(168,85,247,0.35)' },
};

function setPhaseColors(phase) {
  const c = phaseColors[phase];
  const root = document.documentElement;
  // 使用 transition 实现颜色渐变
  root.style.setProperty('--phase-primary', c.primary);
  root.style.setProperty('--phase-glow', c.glow);
  root.style.setProperty('--phase-bg-tint', c.tint);
  root.style.setProperty('--phase-border', c.border);
}
```

**3) CSS中引用阶段变量**

```css
/* 培养皿边框随阶段变色 */
.center {
  border-color: var(--phase-border);
  box-shadow: 0 0 18px var(--phase-glow), inset 0 0 30px var(--phase-bg-tint);
  transition: border-color 1.5s, box-shadow 1.5s;
}

/* 侧边栏顶部渐变随阶段变色 */
.sidebar {
  border-right-color: color-mix(in srgb, var(--phase-primary) 15%, var(--bdr));
}

/* 顶栏底部线条随阶段变色 */
.topbar::after {
  background: linear-gradient(90deg, transparent, var(--phase-primary) 30%, transparent);
  transition: background 1.5s;
}
```

#### 预期效果

玩家在阶段升级后，整个界面色调在1.5秒内从前一阶段色平滑过渡到新阶段色。无需任何弹窗或文字说明，玩家就能**直觉感受到**"世界变了"。

---

### 提案2：🌊 传送带资源流动可视化（Belt Flow Visualization）

**优先级**：🔴 高 | **影响**：空间叙事核心 | **实现复杂度**：中

#### 核心思路

在传送带连线上叠加流动粒子/虚线动画，让玩家"看见"资源在建筑之间流动。

#### 实现方案

**CSS方案（轻量级）— 推荐**：

利用已有的传送带SVG/Canvas渲染，添加流动虚线动画：

```css
/* 传送带流动动画 */
.belt-line {
  stroke-dasharray: 6 4;
  animation: beltFlow 1s linear infinite;
}
@keyframes beltFlow {
  to { stroke-dashoffset: -10; }
}

/* 传送带满载时的视觉反馈 */
.belt-line.saturated {
  stroke: var(--yellow);
  stroke-width: 2.5;
  filter: drop-shadow(0 0 3px rgba(234,179,8,0.4));
  animation: beltFlow 0.6s linear infinite; /* 更快 = 更满 */
}

/* 传送带空闲时 */
.belt-line.idle {
  stroke-dasharray: 2 8;
  opacity: 0.4;
  animation: beltFlow 3s linear infinite; /* 慢 = 空 */
}
```

**增强方案（粒子级）**：

```javascript
// 在 conveyorParticles 系统中增强
function spawnBeltParticle(belt) {
  const res = belt.resource; // 传输的资源类型
  const color = RES[res]?.c || '#fff';
  return {
    x: belt.startX, y: belt.startY,
    targetX: belt.endX, targetY: belt.endY,
    color: color,
    size: 3,
    speed: belt.efficiency * 0.8, // 效率越高流越快
    emoji: RES[res]?.icon, // 可选：用资源emoji作为粒子
  };
}
```

#### 预期效果

- 玩家能直观看到"葡萄糖🟢从碳源采集器流向ATP合成酶"
- 传送带的忙碌程度一目了然（快速密集流动 vs 缓慢稀疏流动）
- 传送带满载时自动变色警告
- 形成整个培养皿中"生命在流动"的视觉印象

---

### 提案3：🎆 阶段升级视觉仪式（Phase Transition Ceremony）

**优先级**：🟡 中 | **影响**：叙事高潮体验 | **实现复杂度**：中

#### 核心思路

将阶段升级从"瞬间切换"变为"3秒视觉仪式"，匹配奇观事件链的叙事质量。

#### 仪式序列设计

```
时间轴 (3秒)
─────────────────────────────────────────
0.0s  ▸ 游戏暂停，UI面板淡出（半透明遮罩）
0.3s  ▸ 培养皿边框开始从旧色渐变到新色
0.5s  ▸ 核心菌落开始放大动画（scale 1.0 → 1.5）
0.8s  ▸ 旧emoji淡出 + 光粒子环绕效果
1.2s  ▸ 新emoji淡入（从光中凝聚）
1.5s  ▸ 核心菌落缩回（scale 1.5 → 1.0）
1.5s  ▸ 屏震(6) + 进化音效播放
1.8s  ▸ 阶段名称居中大字显示："⚗️ 代谢纪元"
2.0s  ▸ 阶段描述淡入："转化资源产生高级材料"
2.5s  ▸ 全屏新阶段色调闪烁（0.3s）
3.0s  ▸ UI面板淡入，游戏恢复
─────────────────────────────────────────
```

#### CSS实现骨架

```css
/* 阶段升级遮罩 */
.phase-transition-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.8);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s;
}
.phase-transition-overlay.active {
  opacity: 1; pointer-events: all;
}

/* 阶段名称动画 */
.phase-transition-title {
  font-family: 'Orbitron', monospace;
  font-size: 2.5em; font-weight: 900;
  color: var(--phase-primary);
  text-shadow: 0 0 30px var(--phase-glow);
  letter-spacing: 6px;
  animation: phaseNameIn 0.8s ease-out;
}
@keyframes phaseNameIn {
  0% { opacity: 0; transform: scale(0.5); filter: blur(10px); }
  60% { opacity: 1; transform: scale(1.1); filter: blur(0); }
  100% { transform: scale(1); }
}

/* 核心菌落进化动画 */
.core-evolving {
  animation: coreEvolve 1.5s ease-in-out;
}
@keyframes coreEvolve {
  0% { transform: scale(1); filter: brightness(1); }
  30% { transform: scale(1.5); filter: brightness(2) saturate(2); }
  50% { transform: scale(1.5); filter: brightness(3) saturate(0); } /* 纯白闪 */
  70% { transform: scale(1.3); filter: brightness(2) saturate(2); }
  100% { transform: scale(1); filter: brightness(1); }
}
```

#### 预期效果

阶段升级不再是"换了个数字"，而是一次3秒的**文明进化仪式**——玩家亲眼看到核心菌落蜕变、世界色彩转换、新纪元名称浮现。这与游戏已有的出色文案叙事（如核心菌落的5段描述文字）形成**视听文三位一体**的叙事体验。

---

### 提案4：🔬 培养基生命感系统（Living Petri Environment）

**优先级**：🟡 中 | **影响**：环境氛围 + 品牌辨识度 | **实现复杂度**：低~中

#### 核心思路

让培养皿看起来像一个**活的培养皿**而非一个棋盘格——通过背景Canvas绘制微粒、营养分子、环境氛围，创造"这里有生命存在"的持续视觉暗示。

#### 实现模块

**模块A：营养粒子漂浮**

```javascript
// bgCanvas上绘制漂浮的营养分子
class NutrientParticle {
  constructor(canvas) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = 1 + Math.random() * 2;
    this.speed = 0.1 + Math.random() * 0.3;
    this.angle = Math.random() * Math.PI * 2;
    this.alpha = 0.1 + Math.random() * 0.15;
    this.color = this.pickColor();
  }
  
  pickColor() {
    // 根据当前阶段选择粒子颜色倾向
    const phaseColors = {
      1: ['#22c55e', '#06d6a0'],
      2: ['#f97316', '#22c55e', '#ec4899'],
      3: ['#3b82f6', '#22c55e', '#10b981'],
      4: ['#eab308', '#3b82f6', '#22c55e'],
      5: ['#a855f7', '#eab308', '#22c55e'],
    };
    const pool = phaseColors[currentPhase] || phaseColors[1];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.angle += (Math.random() - 0.5) * 0.1; // 布朗运动
    // 边界循环
  }
  
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
```

**粒子密度随阶段递增**：
- P1: 20个粒子 — 稀疏、安静
- P2: 40个粒子 — 开始活跃
- P3: 70个粒子 — 明显繁忙
- P4: 100个粒子 — 密集、有序
- P5: 150个粒子 — 壮观、充满活力

**模块B：格子空地培养基纹理**

```css
/* 空格子的培养基纹理 — 不再是"空白"而是"营养丰富的培养基" */
.cell:not(.occupied) {
  background: 
    radial-gradient(circle at 30% 40%, rgba(6,214,160,0.03) 0%, transparent 60%),
    radial-gradient(circle at 70% 60%, rgba(6,214,160,0.02) 0%, transparent 40%),
    rgba(8,14,24,0.6);
}
.cell:not(.occupied):hover {
  background:
    radial-gradient(circle at 50% 50%, var(--phase-bg-tint) 0%, transparent 70%),
    rgba(6,214,160,0.04);
}
```

**模块C：QS信号波纹（P4+专属）**

```javascript
// P4阶段：从群体感应塔发出的环形波纹
function drawQSWaves(ctx, towers) {
  towers.forEach(tower => {
    const { x, y } = getCellCenter(tower.idx);
    const wave = (Date.now() / 1000) % 3; // 3秒一个波纹周期
    const radius = wave * 80; // 最大扩散80px
    const alpha = Math.max(0, 0.15 * (1 - wave / 3));
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(234,179,8,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}
```

#### 预期效果

培养皿从"一个有格子的暗色区域"变成"一个活生生的培养皿"——有营养分子在漂浮、有生命迹象在闪烁、阶段越高越繁忙。玩家无需看任何数值就能**直觉感受到**"我的培养皿充满了生命"。

---

### 提案5：🏆 成就与里程碑视觉仪式（Achievement Ceremony）

**优先级**：🟢 低 | **影响**：情感峰值 + 成就满足感 | **实现复杂度**：低

#### 核心思路

将重要成就（阶段首达、里程碑buff、隐藏成就）的解锁从"弹窗通知"升级为"视觉庆典"。

#### 三级成就视觉规格

| 级别 | 触发条件 | 视觉表现 | 持续时间 |
|------|---------|---------|---------|
| **🥉 普通** | 常规成就解锁 | 右上角飘出成就图标+名称，轻微闪光 | 2s |
| **🥈 重要** | 里程碑buff解锁 | 屏幕顶部横幅展开+金色粒子+震屏(4) | 3s |
| **🥇 史诗** | 阶段首达/隐藏成就/奇观完成 | 全屏暗化+中央大图标+光环扩散+震屏(8)+专属音效 | 4s |

#### 史诗成就动画CSS

```css
.achievement-epic-overlay {
  position: fixed; inset: 0; z-index: 10001;
  background: radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.85) 70%);
  display: flex; align-items: center; justify-content: center;
  animation: achvEpicIn 0.5s ease-out;
}
@keyframes achvEpicIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.achievement-epic-icon {
  font-size: 5em;
  animation: achvIconPop 0.8s cubic-bezier(0.68,-0.55,0.27,1.55);
  filter: drop-shadow(0 0 30px var(--phase-glow));
}
@keyframes achvIconPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.achievement-epic-ring {
  position: absolute;
  width: 200px; height: 200px;
  border: 2px solid var(--phase-primary);
  border-radius: 50%;
  animation: achvRingExpand 1.5s ease-out forwards;
}
@keyframes achvRingExpand {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}

.achievement-epic-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.5em; font-weight: 900;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251,191,36,0.5);
  margin-top: 20px;
  animation: achvTitleIn 0.6s ease-out 0.3s both;
}
@keyframes achvTitleIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

---

## 八、视觉风格指南

### 8.1 色彩规范

#### 主色板（不变）
```
Primary Palette:
  Cyan    #06d6a0  — 活力、生命、科技
  Green   #22c55e  — 生长、资源、P1
  Blue    #3b82f6  — 组织、物流、P3
  Purple  #a855f7  — 高级、奇观、P5
  Orange  #f97316  — 代谢、活跃、P2
  Yellow  #eab308  — 智能、信号、P4
  Red     #ef4444  — 危险、阻塞
  Pink    #ec4899  — 蛋白质、生物化学
```

#### 新增：阶段环境色
```
Phase Environment Colors (背景级，极低饱和度):
  P1: rgba(34,197,94,0.02)   — 微弱绿光
  P2: rgba(249,115,22,0.02)  — 微弱橙光
  P3: rgba(59,130,246,0.02)  — 微弱蓝光
  P4: rgba(234,179,8,0.02)   — 微弱金光
  P5: rgba(168,85,247,0.03)  — 紫光（略强，暗示"圣殿"）
```

### 8.2 动画规范

| 层级 | 用途 | 时长范围 | 缓动函数 |
|------|------|---------|---------|
| **微交互** | 按钮、hover、点击 | 0.1~0.3s | ease-out |
| **状态变化** | 选中、解锁、阻塞 | 0.3~0.8s | ease-in-out |
| **叙事过渡** | 阶段切换、升级 | 1.0~3.0s | cubic-bezier |
| **环境持续** | 呼吸、漂浮、脉冲 | 2.0~5.0s | ease-in-out infinite |
| **仪式庆典** | 成就、奇观完成 | 2.0~5.0s | 多段组合 |

#### 性能红线
- 同时运行的CSS animation不超过30个
- Canvas粒子总数不超过200
- 所有动画尊重 `prefers-reduced-motion`

### 8.3 排版规范（不变）

```
标题: Orbitron (900) — 品牌标识、阶段名、成就
正文: Rajdhani (400/600) — UI文本、描述、按钮
数据: Share Tech Mono — 数值、计时器、排行榜
```

### 8.4 视觉层级规范

```
z-index 规范（新增叙事层）:
  0    背景Canvas (#bgCanvas)
  2    网格和建筑
  5    粒子Canvas (#partCanvas)
  6-10 建筑内部叠加层
  50   暂停遮罩
  100  传送带UI
  1000 弹窗/面板
  10000 阶段升级仪式
  10001 史诗成就仪式
```

---

## 九、实施路线图

### Phase A：色彩叙事基础（预计工时：2-3小时）

```
✅ 任务清单：
  □ 新增 :root 阶段动态变量（4个CSS变量）
  □ 修改 .center 使用 --phase-border / --phase-glow
  □ 修改 .topbar::after 使用 --phase-primary
  □ 在 advancePhase() 中调用 setPhaseColors()
  □ 添加 transition: 1.5s 到所有引用阶段变量的元素
  □ 测试5个阶段的色彩过渡效果
```

**立竿见影**：完成后，每次阶段升级整个界面色调自然渐变。

### Phase B：传送带流动可视化（预计工时：3-4小时）

```
✅ 任务清单：
  □ 为传送带SVG/Canvas线条添加虚线流动动画
  □ 流速与传送带效率/容量挂钩
  □ 满载时变色（→黄色）警告
  □ 空闲时降低不透明度
  □ 性能测试（大量传送带场景）
```

### Phase C：培养基生命感（预计工时：3-4小时）

```
✅ 任务清单：
  □ bgCanvas上实现 NutrientParticle 系统
  □ 粒子密度随阶段递增
  □ 粒子颜色随阶段变化
  □ 空格子添加培养基纹理CSS
  □ 性能优化（requestAnimationFrame + 粒子池）
  □ prefers-reduced-motion 适配
```

### Phase D：阶段升级仪式（预计工时：2-3小时）

```
✅ 任务清单：
  □ 创建 .phase-transition-overlay HTML结构
  □ 实现3秒仪式动画序列
  □ 核心菌落进化动画（emoji切换+光效）
  □ 新增进化专属音效到 SFX
  □ 阶段名称 + 描述显示
  □ 仪式结束后平滑恢复游戏
```

### Phase E：成就视觉仪式（预计工时：1-2小时）

```
✅ 任务清单：
  □ 三级成就视觉规格实现
  □ 史诗成就全屏动画
  □ 重要成就横幅展开
  □ 整合现有成就系统的触发逻辑
```

### 总工时估算

| 阶段 | 工时 | 收益/工时比 |
|------|------|-----------|
| Phase A 色彩叙事 | 2-3h | ⭐⭐⭐⭐⭐ 最高（全局影响，投入最低） |
| Phase B 传送带流动 | 3-4h | ⭐⭐⭐⭐⭐ 最高（空间叙事核心） |
| Phase C 培养基生命 | 3-4h | ⭐⭐⭐⭐ 高（品牌辨识度提升） |
| Phase D 阶段仪式 | 2-3h | ⭐⭐⭐⭐ 高（叙事高潮体验） |
| Phase E 成就仪式 | 1-2h | ⭐⭐⭐ 中（锦上添花） |
| **总计** | **11-16h** | — |

**推荐实施顺序**：A → B → D → C → E

Phase A（色彩叙事）投入产出比最高，仅需2-3小时就能让整个游戏"活起来"。Phase B（传送带流动）是空间叙事的关键突破。Phase D（阶段仪式）直接提升叙事高潮体验。Phase C和E可以后续迭代。

---

## 附录

### A. 现有@keyframes完整清单（111个）

<details>
<summary>点击展开</summary>

| # | 名称 | 行号 | 类别 |
|---|------|------|------|
| 1 | fadeIn | 135 | 微交互 |
| 2 | pulse | 136 | 环境持续 |
| 3 | glow | 146 | 环境持续 |
| 4 | spdPulse | 160 | 状态表达 |
| 5 | pauseBlink | 165 | 状态表达 |
| 6 | resUnlockPulse | 238 | 解锁反馈 |
| 7 | guideExpandPulse | 322 | 引导指引 |
| 8 | secUnlockFlash | 334 | 解锁反馈 |
| 9 | guideBtnPulse | 347 | 引导指引 |
| 10 | guideArrowBounce | 369 | 引导指引 |
| 11 | unlockFloatUp | 409 | 解锁反馈 |
| 12 | redDotPulse | 427 | 通知提示 |
| 13 | newItem | 456 | 入场动画 |
| 14 | cursorTipIn | 500 | 提示显示 |
| 15 | beltBtnPulse | 522 | 引导指引 |
| 16 | beltBlockedPulse | 544 | 状态表达 |
| 17 | buildDragIn | 581 | 建造交互 |
| 18 | buildDragHoverPulse | 586 | 建造交互 |
| 19 | belt-upgrade-flash | 646 | 升级反馈 |
| 20 | techPulse | 754 | 科技状态 |
| 21 | dishBorderGlow | 798 | 环境持续 |
| 22 | cellSelectPulse | 843 | 选中状态 |
| 23 | cellBlockedPulse | 873 | 阻塞状态 |
| 24 | dormantBadgePulse | 888 | 休眠状态 |
| 25 | adjGlow | 922 | 邻接效果 |
| 26 | emojiFloat | 946 | 环境持续 |
| 27 | tierGlow | 963 | 等级效果 |
| 28 | blink | 1015 | 工作指示 |
| 29 | aura | 1019 | 环境持续 |

*（以上为前29个，完整清单含111个）*

</details>

### B. 阶段色彩映射速查

```
         P1采集      P2代谢      P3物流      P4自动化    P5奇观
主色     #22c55e     #f97316     #3b82f6     #eab308     #a855f7
核心     #4a6a5a     #22c55e     #3b82f6     #eab308     #a855f7
图标     🌱          ⚗️          🔗          🧠          🏛️
核心emoji 🔮          🦠          🔬          🏗️          ✨
情感     脆弱/好奇    温暖/分化    秩序/流动    精密/脉冲    壮观/超越
```

### C. SFX音效清单

| 音效方法 | 描述 | 触发场景 |
|---------|------|---------|
| build() | 升调三和弦 | 建筑放置成功 |
| buildFail() | 低频拒绝音 | 放置失败 |
| recycle() | 降调解构音 | 回收建筑 |
| select() | 轻点音 | 选中建筑 |
| researchStart() | 科技启动音 | 研究开始 |
| click() | 通用点击 | 按钮交互 |
| bigReward() | 大奖音效 | 里程碑/重大奖励 |
| milestone() | 里程碑音效 | 成就解锁 |
| boot() | 启动音 | 游戏初始化 |
| updateBGMPhase() | 阶段BGM切换 | 阶段升级 |

---

### D. 参考游戏视觉叙事案例

| 游戏 | 视觉叙事亮点 | 可借鉴点 |
|------|------------|---------|
| **Factorio** | 传送带上的物品流动，工厂冒烟，全局鸟瞰图 | 传送带资源可视化 |
| **Civilization VI** | 时代转换的电影式过场，城市建筑随时代进化 | 阶段升级仪式 |
| **Celeste** | 屏幕震动+冻结帧+慢动作回放 | 关键时刻的视觉强调 |
| **Slay the Spire** | 卡牌抽取时的光效和音效同步 | 视听协同的精细度 |
| **Mini Motorways** | 极简色彩+地图随城市生长变化 | 环境随进度进化 |

---

*视觉叙事评估与增强方案 — 完成于 2026-03-21*  
*版本：v1.0*
