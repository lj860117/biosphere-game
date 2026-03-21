# 🏗️ 建筑系统 2.0 — 整合设计方案

> **版本**: v2.1 | **日期**: 2026-03-21  
> **前置文档**: `GAME_DESIGN_EVALUATION.md` (评估报告)、`PORT_SYSTEM_DESIGN.md` (端口v1.0)  
> **设计目标**: 将端口系统、4个高优问题的解决方案、邻接可视化、系统解锁节奏调整整合为一份可实施的完整设计文档  
> **覆盖范围**: 本文档完全包含并替代 `PORT_SYSTEM_DESIGN.md` v1.0 的所有内容

---

## 📋 高优问题覆盖矩阵

| # | 高优问题 | 本文档解决方案 | 章节 |
|---|---------|--------------|------|
| **1** | 能量ATP是唯一瓶颈（只有2种产出建筑） | 新增P3级"发酵液泡"建筑 + 端口数值配合 ✅**已实施** | §2, §3 |
| **2** | P2→P3复杂度断崖（6个新系统同时涌入） | 分散解锁时间表 + 渐进揭示方案 | §8 |
| **3** | 维护费+资源竞争的死亡螺旋 | 维护费结构调整 + 竞争阈值放宽 + 端口效率奖励 | §7 |
| **4** | P1和P3的科技互斥分支失衡 | 增强弱势分支 + 端口扩展科技 | §6, §9 |

| 建筑系统2.0组件 | 覆盖状态 | 章节 |
|---------------|---------|------|
| ①建筑角色可辨识性 | ✅ 完整覆盖 | §4.5 |
| ②端口连接数约束 | ✅ 完整覆盖（含v1.0全部内容） | §3, §4, §5 |
| ③邻接规则可视化 | ✅ **新增** | §10 |

---

## 一、设计支柱

本文档的所有设计决策都必须回溯到以下5个不可协商的体验目标：

1. **一眼可读** — 建筑角色、端口状态、邻接关系在格子上直观可见
2. **有策略的约束** — 端口数=连接上限，维护费=扩张成本，两者协同创造"布局即策略"
3. **渐进揭示** — P1零学习成本→P2首次接触端口→P3完全展开，不在任何一个时刻倾倒6个新系统
4. **经济可控** — 任何玩家路径下经济都不会进入死亡螺旋，总存在"下一步该做什么"的清晰指引
5. **分支有意义** — 每个科技互斥分支都有明确的适用场景，不存在"永远选A"的假选择

---

## 二、新增建筑：发酵液泡 ✅ 已实施

> **实施状态**：代码中已以 `fermentVacuole`（发酵液泡）实现，参数完全一致。
> 建筑定义、邻接规则(6条)、FLOW_MAP(18条)、端口配置、SVG图标、解锁链全部就位。

### 2.1 设计动机

**解决高优问题#1：能量(ATP)是唯一瓶颈**

当前能量供给现状：
- 能量产出建筑只有2种：ATP合成酶(2.5⚡/s) 和 能量缓冲池(1.8⚡/s)
- 两者都是P1建筑，都消耗葡萄糖
- 20种建筑中15种消耗ATP
- 端口系统限制ATP合成酶输出口=3，进一步收紧了能量分发能力

需要一个**P3级的能量旁路建筑**，使用**非葡萄糖原料**产出能量，打破"能量只靠P1建筑+葡萄糖"的单一路径。

### 2.2 建筑定义

```javascript
// P3 建筑 — 发酵液泡 ✅ 已在 game.js L952-959 实现
fermentVacuole: {
  n:'发酵液泡', phase:3,
  d:'生物质+蛋白质→能量（替代路线）',
  ratio:'0.5🧱 + 0.3🧪 → 2.0⚡/s',
  cost:{ biomass:20, protein:15, energy:35 },
  prod:{ energy:2.0 }, cons:{ biomass:0.5, protein:0.3 },
  color:'#f59e0b', bg:'bg-amber', emoji:'🫧', tier:3, techReq:'biofilmTech',
}
```

### 2.3 数值设计理由

| 参数 | 值 | 理由 |
|------|-----|------|
| 产出 | 2.0⚡/s | 介于ATP合成酶(2.5)和能量缓冲池(1.8)之间。不能超过合成酶（否则P1建筑无存在意义），但要足够有吸引力 |
| 消耗 | 0.5🧱+0.3🧪 | 使用生物质+蛋白质而非葡萄糖 → **打破葡萄糖独占能量供给的垄断**。消耗生物质形成"生物质→能量→生物质"的循环可能性 |
| 建造成本 | 20🧱+15🧪+35⚡ | P3中等偏高成本，需要玩家已建立生物质产线后才能负担 |
| 无能量消耗 | 0 | 关键设计：这是唯一一种**不消耗能量**的能量产出建筑。如果消耗能量就失去了"替代能量路径"的意义 |
| 阶段 | P3 | P3是能量压力开始加剧的时刻（生物膜反应器1⚡、孢子播种器0.5⚡、生物质转化炉0.8⚡、噬菌体裂解器1.2⚡全部在P3吃能量）|

### 2.4 端口定义

```
fermentVacuole: { maxIn: 2, maxOut: 2, role: 'bypass' }  // ✅ 已实施 game.js L645
```

| 端口 | 数量 | 理由 |
|------|------|------|
| In | 2 | 匹配2种消耗资源（生物质+蛋白质），各1个输入口 |
| Out | 2 | 作为旁路建筑通常给1输出口，但考虑到能量是最高需求资源，给2口让它有实用价值。这也是对"旁路=1 out"规则的**刻意例外**，与能量缓冲池一致（同为能量旁路，同给2输出口）|

### 2.5 邻接规则

```javascript
// 邻接规则 ✅ 已实施 game.js L1069-1078（6条规则）
// 正向：发酵液泡自身获得的加成
{ self:'fermentVacuole', neighbor:'biofilmReactor',   bonus:0.15, name:'发酵直供', icon:'🧱', stackable:true, maxStack:2, phase:3 },
{ self:'fermentVacuole', neighbor:'proteinFactory',    bonus:0.12, name:'蛋白催化', icon:'🧪', stackable:true, maxStack:1, phase:3 },
{ self:'fermentVacuole', neighbor:'energyStation',     bonus:0.08, name:'能量串联', icon:'⚡', stackable:true, maxStack:1, phase:3 },
{ self:'fermentVacuole', neighbor:'fermentVacuole',    bonus:0.10, name:'液泡矩阵', icon:'🫧', stackable:true, maxStack:2, phase:3 },
// 反向：发酵液泡作为邻居对其他建筑的增益
{ self:'biofilmReactor', neighbor:'fermentVacuole',    bonus:0.08, name:'能量回流', icon:'🫧', stackable:true, maxStack:1, phase:3 },
{ self:'sporeSower',     neighbor:'fermentVacuole',    bonus:0.10, name:'发酵驱动', icon:'🫧', stackable:true, maxStack:1, phase:3 },
```

### 2.6 FLOW_MAP 新增

```javascript
// 发酵液泡的输入 ✅ 已实施 game.js L1682-1701（18条流关系）
{ from:'biofilmReactor',   to:'fermentVacuole', res:'biomass',  icon:'🧱', color:'#10b981', label:'生物质' },
{ from:'biomassConverter', to:'fermentVacuole', res:'biomass',  icon:'🧱', color:'#10b981', label:'生物质' },
{ from:'nanoAssembler',    to:'fermentVacuole', res:'biomass',  icon:'🧱', color:'#10b981', label:'生物质' },
{ from:'proteinFactory',   to:'fermentVacuole', res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
{ from:'aminoSynth',       to:'fermentVacuole', res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },

// 发酵液泡的输出（能量供给所有消耗能量的建筑）
{ from:'fermentVacuole', to:'simpleExtractor',  res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'nitrogenFixer',    res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'proteinFactory',   res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'geneExtractor',    res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'ribosomeCluster',  res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'biofilmReactor',   res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'sporeSower',       res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'biomassConverter', res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'quantumExtractor', res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'qsController',     res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'nanoAssembler',    res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'pheromoneStation',  res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
{ from:'fermentVacuole', to:'resonanceChamber', res:'energy', icon:'⚡', color:'#f59e0b', label:'ATP' },
```

### 2.7 SVG图标

```javascript
// ✅ 已实施 game.js L1185（使用液泡气泡动画风格）
fermentVacuole:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#1a1205" stroke="#f59e0b" stroke-width="1.5"/><ellipse cx="32" cy="30" rx="16" ry="14" fill="#f59e0b" opacity="0.06" stroke="#f59e0b" stroke-width="1"/><circle cx="24" cy="26" r="4" fill="#f59e0b" opacity="0.15"><animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite"/></circle><circle cx="38" cy="34" r="3" fill="#f59e0b" opacity="0.12"><animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite"/></circle><circle cx="30" cy="36" r="2.5" fill="#f59e0b" opacity="0.1"><animate attributeName="r" values="1.5;3.5;1.5" dur="2s" repeatCount="indefinite"/></circle><path d="M22 42l3 0-1.5 4 3 0-5 7 1.5-4.5-3 0z" fill="#f59e0b" opacity="0.5"/><circle cx="20" cy="20" r="3" fill="#10b981" opacity="0.2" stroke="#10b981" stroke-width="0.6"/><circle cx="44" cy="20" r="3" fill="#ec4899" opacity="0.2" stroke="#ec4899" stroke-width="0.6"/></svg>`,
```

### 2.8 经济影响模拟

**场景：P3中期，12台非豁免建筑**

改造前（无发酵液泡）：
```
能量供给：3×ATP合成酶(7.5⚡) + 1×能量缓冲池(1.8⚡) = 9.3⚡/s
能量消耗：~11.1⚡/s (评估报告数据)
缺口：-1.8⚡/s → 需要第4台ATP合成酶(再消耗1🟢) → 葡萄糖压力
```

改造后（加入1台发酵液泡）：
```
能量供给：3×ATP合成酶(7.5⚡) + 1×能量缓冲池(1.8⚡) + 1×发酵液泡(2.0⚡) = 11.3⚡/s
能量消耗：~11.1⚡/s
缺口：+0.2⚡/s → 转正！且不额外消耗葡萄糖
代价：额外消耗 0.5🧱+0.3🧪/s，需要现有生物质/蛋白质产线有余量
```

**设计效果**：
- ✅ 打破了"能量只靠葡萄糖"的单一路径
- ✅ 给P3玩家一个清晰的"下一步"：建发酵液泡缓解能量压力
- ✅ 不会取代ATP合成酶（产出更低、成本更高），但提供了关键的补充
- ✅ 创造了"生物质→能量→生物膜反应器→生物质"的循环经济可能性，增加布局策略

---

## 三、完整建筑端口数值表 (v2.0)

### 3.1 设计原则（继承v1.0）

1. **源头建筑** — 无输入，输出受限（供给有限，必须选择给谁）
2. **标准转化器** — 输入端口 ≥ 消耗资源种类数，输出端口 = 产出种类数 + 0~1 额外分发口
3. **旁路转化器** — 输出受限（通常1口，能量旁路例外给2口）
4. **增益建筑** — 0/0（不参与传送带）
5. **奇观** — 仅输出，端口数最多

### 3.2 完整端口表（22种建筑，含新增）

| 建筑ID | 名称 | 阶段 | 角色 | In | Out | 设计理由 |
|--------|------|------|------|---:|----:|---------|
| **P1 — 采集** |
| `glucoseCollector` | 碳源采集器 | P1 | 源头 | **0** | **2** | 核心供能，2口→选择供给谁 |
| `energyStation` | ATP合成酶 | P1 | 转化 | **2** | **3** | 能量中枢，3口供给3台下游 |
| `simpleExtractor` | 简易提取器 | P1 | 转化 | **2** | **1** | DNA终端产品→1输出足够 |
| `energyBuffer` | 能量缓冲池 | P1 | 旁路 | **1** | **2** | 备用能量源，2输出提供灵活分发 |
| **P2 — 代谢** |
| `nitrogenFixer` | 固氮装置 | P2 | 转化 | **1** | **2** | 低消耗→1口够，氮源需供给多方→2输出 |
| `proteinFactory` | 蛋白质工厂 | P2 | 转化 | **2** | **2** | 2消耗2输出均匹配 |
| `geneExtractor` | DNA提取器 | P2 | 转化 | **2** | **1** | 终端输出→1口 |
| `aminoSynth` | 氨基酸合成仪 | P2 | 旁路 | **2** | **1** | 旁路效率折扣 |
| `ribosomeCluster` | 核糖体集群 | P2 | 转化 | **2** | **2** | 2消耗2产出各匹配 |
| **P3 — 物流** |
| `biofilmReactor` | 生物膜反应器 | P3 | 核心转化 | **3** | **2** | 三料→3口刚需；核心→2输出分发 |
| `transport` | 菌丝运输网 | P3 | 增益 | **0** | **0** | 全局增益→无端口 |
| `sporeSower` | 孢子播种器 | P3 | 转化 | **2** | **2** | 2消耗2产出各匹配 |
| `metabolicLoop` | 代谢回路 | P3 | 增益 | **0** | **0** | 全局增益→无端口 |
| `biomassConverter` | 生物质转化炉 | P3 | 旁路 | **2** | **1** | 旁路输出受限 |
| `quantumExtractor` | 噬菌体裂解器 | P3 | 旁路 | **2** | **1** | 旁路输出受限 |
| `fermentVacuole` | 🫧 发酵液泡 ✅ | P3 | 旁路 | **2** | **2** | 能量旁路例外，同能量缓冲池规则 |
| **P4 — 自动化** |
| `qsController` | 群体感应塔 | P4 | 核心转化 | **1** | **2** | QS分发给纳米+共振→2输出 |
| `nanoAssembler` | 纳米组装线 | P4 | 转化 | **2** | **2** | P4高端2消耗2产出 |
| `pheromoneStation` | 信息素广播站 | P4 | 旁路 | **2** | **1** | QS旁路→输出受限 |
| `resonanceChamber` | 共振培养箱 | P4 | 多输出 | **2** | **3** | 3种产出需3输出口 |
| **P5 — 奇观** |
| `microDyson` | 微型戴森球 | P5 | 奇观 | **0** | **4** | 终极无输入，4口全局供给 |

### 3.3 PORT_DEFS 常量（代码级）

```javascript
const PORT_DEFS = {
  // Phase 1
  glucoseCollector: { maxIn: 0, maxOut: 2, role: 'source' },
  energyStation:    { maxIn: 2, maxOut: 3, role: 'converter' },
  simpleExtractor:  { maxIn: 2, maxOut: 1, role: 'converter' },
  energyBuffer:     { maxIn: 1, maxOut: 2, role: 'bypass' },

  // Phase 2
  nitrogenFixer:    { maxIn: 1, maxOut: 2, role: 'converter' },
  proteinFactory:   { maxIn: 2, maxOut: 2, role: 'converter' },
  geneExtractor:    { maxIn: 2, maxOut: 1, role: 'converter' },
  aminoSynth:       { maxIn: 2, maxOut: 1, role: 'bypass' },
  ribosomeCluster:  { maxIn: 2, maxOut: 2, role: 'converter' },

  // Phase 3
  biofilmReactor:   { maxIn: 3, maxOut: 2, role: 'converter' },
  transport:        { maxIn: 0, maxOut: 0, role: 'boost' },
  sporeSower:       { maxIn: 2, maxOut: 2, role: 'converter' },
  metabolicLoop:    { maxIn: 0, maxOut: 0, role: 'boost' },
  biomassConverter: { maxIn: 2, maxOut: 1, role: 'bypass' },
  quantumExtractor: { maxIn: 2, maxOut: 1, role: 'bypass' },
  fermentVacuole:   { maxIn: 2, maxOut: 2, role: 'bypass' },  // ✅ 已实施

  // Phase 4
  qsController:    { maxIn: 1, maxOut: 2, role: 'converter' },
  nanoAssembler:    { maxIn: 2, maxOut: 2, role: 'converter' },
  pheromoneStation: { maxIn: 2, maxOut: 1, role: 'bypass' },
  resonanceChamber: { maxIn: 2, maxOut: 3, role: 'converter' },

  // Phase 5
  microDyson:       { maxIn: 0, maxOut: 4, role: 'wonder' },
};
```

---

## 四、端口UI视觉规格

> 本章完整继承 PORT_SYSTEM_DESIGN.md v1.0 §3，无修改。

### 4.1 端口形态设计

#### 桌面端规格

```
端口尺寸:    14×14px
端口间距:    3px
端口形状:
  输入端口 → 半圆形（右半，开口朝建筑内部）
             border-radius: 0 50% 50% 0
  输出端口 → 三角/箭头形（朝右，指向外部）
             clip-path: polygon(0 0, 100% 50%, 0 100%)
  增益建筑 → 无端口，四角发光标记
  奇观     → 圆形端口（比普通大1.5x → 21×21px）
端口位置:
  输入端口 → 左侧边框外延2px
  输出端口 → 右侧边框外延2px
  垂直排列 → 居中对齐
```

#### 手机端规格

```
端口尺寸:    10×10px
端口间距:    2px
最大可显示:  4个端口/侧
```

### 4.2 端口颜色状态

```
状态        | 填充   | 边框     | 含义
------------|--------|---------|-----------------------------------
空闲 idle   | 透明   | 灰色50% | 可以连接，等待传送带
已连 linked | 资源色 | 资源色  | 已有传送带连接
满载 full   | 金色   | 金色    | 所有端口都已连接
```

### 4.3 CSS实现

```css
.port {
  position: absolute;
  width: 14px;
  height: 14px;
  transition: all 0.2s ease;
  z-index: 8;
}
.port.in {
  left: -8px;
  border-radius: 0 50% 50% 0;
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(150,170,190,0.4);
  border-left: none;
}
.port.out {
  right: -8px;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(150,170,190,0.4);
}
.port.linked {
  background: var(--port-color);
  border-color: var(--port-color);
  box-shadow: 0 0 6px var(--port-color);
  opacity: 0.9;
}
.cell.ports-full {
  box-shadow: 0 0 8px 2px rgba(250,204,21,0.3);
}
.cell.ports-full .port.linked {
  border-color: #facc15;
  box-shadow: 0 0 4px #facc15;
}
.port.idle {
  animation: portBreath 2s ease-in-out infinite;
}
@keyframes portBreath {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
```

### 4.4 移除/降级的视觉元素

| 元素 | 当前 | 建议 | 理由 |
|------|------|------|------|
| 呼吸光环 `aura` | 全周闪烁 | **移除** | 与端口发光冲突 |
| L型色标 `cell-stripe` | 左竖条+顶横条 | **改为顶部1px细线** | 端口已标识角色 |
| SVG背景 `icon-bg` | 半透明 | 降低opacity至0.03 | 避免与端口层叠杂乱 |
| 工作指示灯 `work-dot` | 右上角 | 保留 | 不冲突 |
| 序号角标 `cell-seq` | 左下角 | 保留 | 不冲突 |

### 4.5 建筑角色视觉区分

```
建筑角色      | 边框色调          | 端口特征          | 视觉速记
-------------|------------------|------------------|------------------
源头          | 绿色系 (#22c55e) | 仅右侧有端口      | "只出不进 = 源头"
标准转化      | 建筑自身色       | 左右都有端口      | "有进有出 = 加工厂"
旁路转化      | 虚线边框         | 输出口少(通常1个) | "虚线+少输出 = 替代品"
增益          | 蓝色光晕         | 无端口            | "没管线 = 被动加成"
奇观          | 紫金渐变边框     | 仅右侧，端口大1.5x| "大端口 = 大输出"
```

---

## 五、传送带连接约束规则

> 本章完整继承 PORT_SYSTEM_DESIGN.md v1.0 §4，无修改。

### 5.1 连接数计算函数

```javascript
function getUsedPorts(idx, direction) {
  const belts = G._activeBelts || [];
  const type = G.grid[idx]?.type;
  if (!type) return 0;
  let count = 0;
  for (const belt of belts) {
    if (belt.fi !== idx && belt.ti !== idx) continue;
    const otherIdx = belt.fi === idx ? belt.ti : belt.fi;
    const otherType = G.grid[otherIdx]?.type;
    if (!otherType) continue;
    if (direction === 'in') {
      if (FLOW_MAP.some(f => f.from === otherType && f.to === type)) count++;
    } else {
      if (FLOW_MAP.some(f => f.from === type && f.to === otherType)) count++;
    }
  }
  return count;
}

function hasAvailablePort(idx, direction) {
  const type = G.grid[idx]?.type;
  if (!type) return false;
  const def = PORT_DEFS[type];
  if (!def) return true;
  const max = direction === 'in' ? def.maxIn : def.maxOut;
  return getUsedPorts(idx, direction) < max;
}
```

### 5.2 连接拒绝反馈

```
端口满时：
  1. 目标建筑端口全部闪红 0.5秒
  2. 传送带线变红色虚线
  3. G.log('⚠️ [建筑名] 输出端口已满 (N/N)，请连接其他建筑', 'w');
  4. Toast: "端口已满！此建筑最多连接 N 条输出管线"
```

### 5.3 P1自动传送带处理

```
P1: 自动连接遵守端口限制，但端口UI不显示
P2+: 端口UI可见，手动连接前检查余量
```

---

## 六、科技树平衡调整

### 6.1 解决高优问题#4：P1和P3分支失衡

#### P1分支改造

**当前问题**：快速代谢(+25%产出但+15%消耗)净收益远低于高效采集(+30%纯加成)

**改造方案**：

```javascript
// 方案：去掉快速代谢的消耗惩罚，改为"有条件的强效版"
rapidMetabolism: {
  n:'快速代谢', phase:1, cost:{ dna:8, energy:15 }, time:20,
  d:'加速ATP合成反应', 
  ef:'ATP合成酶产出+25%，且每台ATP合成酶邻接碳源采集器时额外+10%',
  // 改动：去掉 _energyCostPenalty，增加邻接条件bonus
  req:['pureCulture'], exclusive:['efficientHarvest'],
  fn: s => { 
    s._energyBonus = (s._energyBonus || 0) + 0.25; 
    s._energyAdjBonus = 0.10; // 新字段：ATP合成酶邻接碳源时额外加成
  },
}
```

**设计理由**：
- 去掉+15%消耗惩罚 → 快速代谢本身就有吸引力（+25% vs 高效采集+30%）
- 增加邻接条件bonus（+10%） → 如果玩家规划好布局，快速代谢可以达到+35%总收益，**反超**高效采集
- 创造了**布局技巧型 vs 简单稳定型**的有意义分支：
  - 高效采集：无脑+30%，任何布局都好使
  - 快速代谢：基础+25%，布局好了+35%，布局差了+25%

#### P3分支改造

**当前问题**：自适应物流仅+5%运输网加成，远弱于共生网络(+200种群+效率翻倍)

**改造方案**：

```javascript
adaptiveLogistics: {
  n:'自适应物流', phase:3, cost:{ dna:22, biomass:8 }, time:30,
  d:'智能物流路径规划', 
  ef:'菌丝运输网加成15%→20%，所有建筑+1输出端口，传送带容量+30%',
  req:['biofilmTech'], exclusive:['symbioticNetwork'],
  fn: s => { 
    s._transportBonus = (s._transportBonus || 0) + 0.05;   // 10→15→20%
    s._extraOutPorts = 1;     // 🆕 全局+1输出端口
    s._beltCapBonus = 0.30;   // 🆕 传送带容量+30%
  },
}
```

**设计理由**：
- 菌丝运输网加成 10%→20%（翻倍），本身就是有意义的提升
- **全局+1输出端口** → 这是端口系统下最强的物流科技，让每台建筑多连一条线
  - ATP合成酶：3→4 输出口（从"够用"变成"充裕"）
  - 碳源采集器：2→3 输出口（重大改变！每台多供给一个下游）
  - 旁路建筑：1→2 输出口（从瓶颈变成灵活）
- **传送带容量+30%** → 搭配端口扩展，物流重度玩家的天堂
- 创造了**物流优化型 vs 种群扩张型**的明确分支：
  - 自适应物流：更多管线、更高吞吐、更灵活的布局空间
  - 共生网络：更多种群、更多被动加成、种群相关策略更强

---

## 七、死亡螺旋缓解机制

### 7.1 解决高优问题#3：维护费+资源竞争双重压制

#### 当前问题复述

```
扩建 → 维护费↑ → 净能量↓ → 消耗/产出比↑ → 触发竞争惩罚 → 实际产出↓ → 净能量更差
→ 死亡螺旋
```

端口系统会**加剧**此问题：端口满→被迫多建同类建筑→更多维护费→更大能量压力。

#### 7.1.1 改动A：维护费结构调整

**将维护费从"能量为主"改为"葡萄糖为主"**

```javascript
// 维护费配置 v2.0
const MAINTENANCE = {
  // P2 维护费（改为葡萄糖为主）
  2: { 
    glucose: 0.15,   // 原来是 energy:0.15
    energy:  0.05,   // 保留少量能量消耗（原来是主力）
  },
  // P3 维护费
  3: { 
    glucose: 0.20,   // 原来是 energy:0.25, glucose:0.08
    energy:  0.08,   // 大幅降低能量占比
  },
  // P4 维护费
  4: {
    glucose: 0.25,
    energy:  0.10,
  },
};
```

**设计理由**：
- 能量是全游戏最紧张的资源 + 最多消费者 → 维护费再吃能量就是双重惩罚
- 葡萄糖产出路径更多（碳源采集器基础产出 + 核糖体集群副产物 + 共振培养箱 + 微型戴森球），承受维护费的能力更强
- 效果：玩家扩建时压力从"能量崩盘"变成"葡萄糖紧张"，后者有更多解法

#### 7.1.2 改动B：管理开销阈值提高

```javascript
// 管理开销配置 v2.0
const MGMT_OVERHEAD = {
  threshold: 12,     // 原来是 8，提高到12台才开始额外开销
  perExtra:  0.04,   // 原来是 6%/台，降低到4%/台
  maxMult:   1.60,   // 原来是 180% (1.80)，降低到160% (1.60)
};
```

**设计理由**：
- 阈值从8→12：P3初期有6-8台P2建筑+2-4台P3建筑=8-12台，原设计在P3一进来就触发开销，太快了
- 幅度从6%→4%：更温和的增长曲线
- 上限从180%→160%：极端堆叠的惩罚依然存在，但不那么致命
- **实际影响**：P3初期12台内完全无额外开销（原来8台就开始），给"复杂度断崖"一个缓冲垫

#### 7.1.3 改动C：资源竞争阈值放宽

```javascript
// 资源竞争配置 v2.0
const COMPETITION = {
  threshold:  0.85,   // 原来是 0.75，消耗/产出比达到85%才触发竞争
  minEff:     0.60,   // 原来是 0.50，最低效率60%（原来50%太致命）
  // 🆕 P3初期缓冲：前180秒使用渐进阈值
  p3BufferDuration: 180,  // P3初期缓冲180秒（3分钟）
  p3BufferThreshold: 0.95, // 缓冲期间阈值从95%渐进降到85%
};
```

**渐进阈值公式**：
```
P3进入后前180秒：
  actualThreshold = 0.95 - (0.95 - 0.85) × (elapsed / 180)
  即：95% → 渐降到 → 85%（3分钟内）
```

**设计理由**：
- 75%→85%：多出10%的喘息空间
- 50%→60%最低效率：即使最糟糕情况也保证6成产出（原来5成太致命）
- P3缓冲期：解决"一进P3就被竞争惩罚打脸"的体验问题

#### 7.1.4 改动D：端口效率奖励（新机制）

**端口利用率越高，维护费越低** — 奖励高效使用端口的玩家

```javascript
/**
 * 计算建筑的端口效率折扣
 * 端口利用率(已连/总端口) > 50% 时，维护费按比例减免
 * @returns {number} 维护费乘数 (0.80~1.00)
 */
function getPortEfficiencyDiscount(idx) {
  const type = G.grid[idx]?.type;
  if (!type) return 1.0;
  const def = PORT_DEFS[type];
  if (!def) return 1.0;
  
  const totalPorts = def.maxIn + def.maxOut;
  if (totalPorts === 0) return 1.0; // 增益建筑无端口，不享受折扣
  
  const usedIn = getUsedPorts(idx, 'in');
  const usedOut = getUsedPorts(idx, 'out');
  const utilization = (usedIn + usedOut) / totalPorts;
  
  if (utilization <= 0.5) return 1.0;  // 低利用率无折扣
  // 50%~100%利用率 → 0~20%维护费减免
  const discount = (utilization - 0.5) * 0.4;  // 最大0.2 = 20%减免
  return 1.0 - discount;
}
```

**效果示例**：
```
ATP合成酶(2in+3out=5端口)：
  使用3/5端口(60%利用率) → 维护费 ×0.96 (减免4%)
  使用4/5端口(80%利用率) → 维护费 ×0.88 (减免12%)
  使用5/5端口(100%利用率) → 维护费 ×0.80 (减免20%)
```

**设计理由**：
- 直接对抗"端口满→多建→更多维护费"的螺旋
- 玩家被激励去最大化每台建筑的端口利用率，而非堆数量
- 20%最大减免不会破坏维护费系统的经济意义
- **教学价值**：让玩家直观感受到"连满管线=省钱"

### 7.2 经济模型验证

#### 场景：P3中期，14台建筑

**v1.0（改造前）**：
```
管理开销：(14-8)×6% = 36%
维护费(能量)：0.25×1.36×(P3建筑4台) = 1.36/s
             + 0.15×1.36×(P2建筑6台) = 1.22/s
总额外能量消耗：2.58/s
资源竞争阈值：75%
→ 如果能量供需比>75%，竞争惩罚启动
→ 高概率进入死亡螺旋
```

**v2.0（改造后）**：
```
管理开销：(14-12)×4% = 8%（大幅降低！）
维护费(葡萄糖为主)：
  葡萄糖：0.20×1.08×(P3建筑4台) = 0.86/s
         + 0.15×1.08×(P2建筑6台) = 0.97/s
  能量：  0.08×1.08×(P3建筑4台) = 0.35/s
         + 0.05×1.08×(P2建筑6台) = 0.32/s
总额外能量消耗：0.67/s（原来2.58→0.67，降低74%！）
总额外葡萄糖消耗：1.83/s（新增，但有更多供给手段）
资源竞争阈值：85%（宽松10%）
端口效率折扣：假设平均70%利用率 → 维护费再×0.92
最终能量维护：0.67×0.92 = 0.62/s

→ 能量压力从致命级降到可控级
→ 葡萄糖压力增加但有碳源采集器+多种副产物应对
→ 竞争惩罚延后触发
→ 死亡螺旋被打破
```

---

## 八、P2→P3 系统解锁分散方案

### 8.1 解决高优问题#2：6个新系统同时涌入

#### 当前问题

P2→P3升级时，以下变化**同时发生**：
1. 传送带：自动→手动
2. 资源竞争启用
3. 维护费升级
4. 变异实验室解锁
5. 培养皿实验解锁
6. 进化需要蛋白质

#### 8.2 分散解锁时间表

```
P3 升级瞬间（第0秒）:
  ✅ 传送带手动模式 + 端口UI首次显示（搭配教学面板）
  ✅ 维护费升级（但已通过§7大幅缓解）
  ✅ 进化需要蛋白质
  ❌ 资源竞争 → 延迟180秒（§7.1.3的缓冲期）
  ❌ 变异实验室 → 推迟到P3中期
  ❌ 培养皿实验 → 推迟到P3后期

P3 + 180秒（3分钟后）:
  ✅ 资源竞争渐进启用（从95%阈值开始→85%）
  配合提示："⚖️ 资源竞争系统已启用！注意保持供需平衡"

P3 + 进化Lv.4 且 研究biofilmTech:
  ✅ 变异实验室解锁（原来P3+Lv.3就解锁，推迟1级）
  配合教学面板引导

P3 + 建造生物膜反应器×2 且 拥有菌丝运输网:
  ✅ 培养皿实验解锁
  配合教学引导
```

### 8.3 修改变异实验室解锁条件

```javascript
const MUT_LAB_CONFIG = {
  unlockPhase: 3,
  unlockEvoLv: 4,           // 原来是3 → 改为4
  unlockTech: 'biofilmTech',
  // 🆕 额外解锁条件：至少建造过1台P3建筑
  unlockExtraReq: (s) => s.bldCount('biofilmReactor') > 0 || s.bldCount('sporeSower') > 0,
  // ...其余不变
};
```

**设计理由**：
- 进化Lv.3→Lv.4：多1级进化的时间，让玩家先消化传送带手动模式+端口系统
- 额外要求已建P3建筑：确保玩家已经理解了P3的核心玩法后才引入变异
- 效果：P3的学习曲线从"瀑布式"变成"阶梯式"
  - 第一阶梯（0-3min）：传送带+端口
  - 第二阶梯（3min+）：资源竞争
  - 第三阶梯（Lv.4后）：变异实验室
  - 第四阶梯（2个反应器后）：培养皿

### 8.4 P2预热传送带

**在P2阶段允许"可选手动传送带"**，与自动传送带并存：

```javascript
// P2阶段传送带模式
const BELT_MODE = {
  1: 'auto',      // P1: 纯自动
  2: 'hybrid',    // P2: 自动+可选手动（🆕）
  3: 'manual',    // P3+: 纯手动
};
```

P2 hybrid模式规则：
```
1. 系统仍然自动创建基础传送带连接
2. 玩家可以额外手动添加传送带（显示端口UI）
3. 手动传送带优先级高于自动传送带
4. P2→P3升级时：所有自动连接转为手动连接（已有逻辑）
5. 教学提示："💡 你可以手动添加管线来优化产线，或让系统自动处理"
```

**设计理由**：
- P2阶段就能"预习"手动传送带，但不强制
- P3完全手动时不再是"突然要学新东西"，而是"自然过渡"
- 有探索欲的玩家P2就开始玩端口，保守玩家P3再学——两种玩家都被照顾到

---

## 九、科技/变异/转生的端口扩展

> 本章继承 PORT_SYSTEM_DESIGN.md v1.0 §5，并整合§6的科技改造。

### 9.1 科技树扩展

P3科技"自适应物流"的改造已在§6.1定义。此外：

```javascript
// P3互斥分支（改造后）
adaptiveLogistics: {
  // 效果：菌丝运输网加成→20%，全局+1输出端口，传送带容量+30%
  // 详见 §6.1
}
symbioticNetwork: {
  // 不变：种群上限+200，种群效率翻倍
}
```

### 9.2 变异扩展

新增2种端口相关突变：

```javascript
// 稀有级
branchPipeline: {
  n:'分支管线', rarity:'rare', icon:'🔀',
  d:'随机1种建筑类型 +1 输出端口',
  flavor:'突变让细胞膜多长出一个分泌通道。',
  ef: { extraOutPort: 1, targetRandom: true },
  category:'logistics',
},
// 史诗级
hubNode: {
  n:'枢纽节点', rarity:'epic', icon:'🔄',
  d:'随机1种建筑类型 +1 输入和 +1 输出端口',
  flavor:'膜蛋白的双向改造创造了前所未有的物质交换效率。',
  ef: { extraInPort: 1, extraOutPort: 1, targetRandom: true },
  category:'logistics',
},
```

### 9.3 转生加成

```javascript
// 无限加成新增
portEngineering: {
  id: 'pres_portExpand',
  n: '管线工程学',
  d: '每级：随机1种建筑 +1 输出端口（上限每种+2）',
  cost: { base: 5, scale: 3 },
  maxLevel: Infinity,
  category: 'logistics',
}
```

---

## 十、邻接加成可视化系统（🆕）

### 10.1 设计动机

**覆盖建筑系统2.0组件③：邻接规则可视化**

当前60+条邻接规则存在**信息过载**问题。玩家不可能记住所有规则，但邻接加成对效率的影响可达30-50%。

### 10.2 放置时高亮推荐位

当玩家选中一种建筑准备放置时：

```
1. 扫描网格中所有已有建筑
2. 对每个空格子计算"如果放在这里，能触发几条邻接加成"
3. 按加成数量分级高亮：

   0条加成 → 不高亮（默认灰色）
   1条加成 → 淡绿色边框 + "×1" 小标签
   2条加成 → 中绿色边框 + "×2" 小标签
   3条以上 → 亮绿色边框 + "×3+" 小标签 + 呼吸动画
```

#### 实现逻辑

```javascript
/**
 * 计算某格子放置指定建筑后的邻接加成数
 * @param {number} idx - 格子索引
 * @param {string} bldType - 建筑类型
 * @returns {{ count: number, bonuses: Array }}
 */
function previewAdjacencyBonuses(idx, bldType) {
  const neighbors = getAdjacentCells(idx);
  const bonuses = [];
  
  for (const rule of ADJACENCY_RULES) {
    // 检查 self 匹配
    if (rule.self !== '*' && rule.self !== bldType) continue;
    
    // 检查 neighbor 是否存在于相邻格子中
    for (const nIdx of neighbors) {
      const nType = G.grid[nIdx]?.type;
      if (!nType) continue;
      if (rule.neighbor !== nType) continue;
      
      bonuses.push({
        rule: rule,
        neighborIdx: nIdx,
        bonus: rule.bonus,
      });
    }
    
    // 反向检查：新建筑作为 neighbor 时对已有建筑的加成
    for (const nIdx of neighbors) {
      const nType = G.grid[nIdx]?.type;
      if (!nType) continue;
      for (const revRule of ADJACENCY_RULES) {
        if (revRule.self !== '*' && revRule.self !== nType) continue;
        if (revRule.neighbor !== bldType) continue;
        bonuses.push({
          rule: revRule,
          neighborIdx: nIdx,
          bonus: revRule.bonus,
          isReverse: true, // 标记：是对邻居的加成，不是对自己
        });
      }
    }
  }
  
  return { count: bonuses.length, bonuses };
}
```

#### CSS样式

```css
/* 放置预览高亮 */
.cell.adj-preview-1 {
  box-shadow: inset 0 0 0 2px rgba(34,197,94,0.3);
}
.cell.adj-preview-2 {
  box-shadow: inset 0 0 0 2px rgba(34,197,94,0.5);
}
.cell.adj-preview-3 {
  box-shadow: inset 0 0 0 2px rgba(34,197,94,0.8);
  animation: adjPulse 1.5s ease-in-out infinite;
}
@keyframes adjPulse {
  0%, 100% { box-shadow: inset 0 0 0 2px rgba(34,197,94,0.6); }
  50% { box-shadow: inset 0 0 0 3px rgba(34,197,94,1.0); }
}

/* 推荐位角标 */
.adj-preview-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(34,197,94,0.8);
  color: #fff;
  font-size: 9px;
  padding: 1px 3px;
  border-radius: 3px;
  z-index: 10;
}
```

### 10.3 已触发邻接加成指示器

对已放置的建筑，显示当前激活的邻接加成：

```
建筑格子右下角显示邻接计数标记：
  无激活加成 → 不显示
  1-2条 → 小绿点 ●
  3-4条 → 双绿点 ●●
  5条以上 → 金色星标 ★

悬停显示详细列表：
  "📐 邻接加成 (3条):"
  "  🔗 碳源直供 +15% (← 碳源采集器)"
  "  ⚡ ATP催化 +10% (← ATP合成酶)"  
  "  🕸️ 菌丝渗透 +6% (← 菌丝运输网)"
  "  总计: +31%"
```

### 10.4 邻接图鉴面板

在建筑详情面板或专门的"图鉴"面板中展示所有邻接规则的发现进度：

```
邻接图鉴
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
已发现: 12/60+ | 解锁率: 20%

✅ 已触发:
  🌱 碳源共振 (+10%) — 碳源×碳源
  🔗 碳源直供 (+15%) — ATP合成酶 ← 碳源采集器
  ⚡ 能量直供 (+12%) — 简易提取器 ← ATP合成酶
  ...

🔒 未发现:
  ??? — ???×??? (P2解锁后可触发)
  ??? — ???×??? (P3解锁后可触发)
  ...
```

**设计理由**：
- "已发现"有成就感，"未发现"有探索欲
- 不剧透具体规则，但提示阶段（知道P2有更多规则→有动力升级）
- 可以关联成就系统（如"发现20条邻接规则"获得成就）

### 10.5 邻接与端口的联动

当前邻接规则基于"物理相邻"，端口基于"传送带连接"。两者独立。

**新增规则：传送带直连建筑视为"虚拟邻接"**

```javascript
/**
 * 检查两个建筑是否具有"有效邻接"关系
 * 有效邻接 = 物理相邻(上下左右) OR 传送带直连
 */
function isEffectivelyAdjacent(idx1, idx2) {
  // 物理相邻
  if (getAdjacentCells(idx1).includes(idx2)) return true;
  
  // 传送带直连（新增）
  const belts = G._activeBelts || [];
  return belts.some(b => 
    (b.fi === idx1 && b.ti === idx2) || 
    (b.fi === idx2 && b.ti === idx1)
  );
}
```

**约束**：
- 传送带直连的"虚拟邻接"加成为物理邻接的 **50%**
  - 即：碳源直供物理相邻=+15%，传送带直连=+7.5%
  - 理由：物理相邻仍然是最优选择，但传送带直连提供了布局空间不够时的备选方案
- 每个建筑最多享受 **2条** 虚拟邻接加成
  - 防止通过无限传送带连接刷邻接

**设计效果**：
- 端口系统和邻接系统不再完全独立——连了管线还能拿到一部分邻接加成
- 给玩家更多理由去规划传送带拓扑（不仅是资源传输，还有邻接收益）
- 物理布局规划仍然是主要策略（完整加成），传送带是补充策略（半额加成）

---

## 十一、新手引导适配（整合版）

### 11.1 P1阶段：零接触

```
- 端口UI不渲染
- 邻接高亮不渲染
- 自动传送带逻辑内部遵守端口限制（玩家无感知）
- 0学习成本
```

### 11.2 P2阶段：预热期

```
P2升级时：
  弹出面板1："手动管线预览"
    "从本阶段开始，你可以手动添加管线来优化产线"
    "每种建筑有输入📥和输出📤端口，端口数=最多连几条管线"
    [显示ATP合成酶端口图示]
    "不想手动？没关系，系统仍会自动帮你连接基础管线"

首次手动连接成功时：
  "+1 管线连接成功！注意看建筑边缘的端口变亮了"

P2阶段首次放置建筑时：
  如果有推荐邻接位：
    "💡 绿色高亮的格子表示放在那里可以获得邻接加成！"
```

### 11.3 P3阶段：完全展开

```
P3升级瞬间：
  弹出面板："物流时代"
    "自动管线已关闭，从现在起需要手动规划所有连接"
    "端口是你的核心约束——合理分配每条管线"
    [快速教学：选中建筑→拖拽到目标→连接成功]
    
P3 + 3分钟（资源竞争启用时）：
  弹出面板："供需平衡"
    "⚖️ 资源竞争系统已启用"
    "当某种资源的消耗接近产出时，所有消费建筑效率会下降"
    "保持充足的资源供给，或者减少不必要的消费者"
    
P3 + 变异实验室解锁时：
  弹出面板："变异实验室"
    "🧬 突变培育已解锁！"
    (现有教学流程)
```

### 11.4 首次端口满

```
首次触发（全游戏一次）：
  弹出面板："端口已满！"
    "[建筑名]的输出端口都已连接"
    "解决方案："
    "  1. 多建一台同类建筑分担负载"
    "  2. 升级传送带提高单条管线吞吐量"
    "  3. 研究科技或获取突变来扩展端口"
    [不再提示]
```

---

## 十二、交互流程

> 本章继承 PORT_SYSTEM_DESIGN.md v1.0 §6，并增加邻接预览交互。

### 12.1 端口悬停 Tooltip

```
┌──────────────────────────────────┐
│ 🔋 ATP合成酶 Lv.2              │
│ ─────────────────────────────── │
│ 📥 输入: 1/2 (空闲1口)          │
│ 📤 输出: 2/3 (空闲1口)          │
│ ─────────────────────────────── │
│ 消耗: 1🟢/s                     │
│ 产出: 2.5⚡/s (×1.4 = 3.5⚡/s)  │
│ ─────────────────────────────── │
│ 📐 邻接加成: +23%              │ ← 新增
│   🔗 碳源直供 +15%              │
│   ⚡ 能量串联 +8%               │
│ 🔧 维护费折扣: -12% (端口效率)  │ ← 新增
│ ─────────────────────────────── │
│ 🔗 传送带: 3条 (Lv.1-2)         │
│ 📊 容量利用: 68%                 │
└──────────────────────────────────┘
```

### 12.2 建筑放置模式

```
选中建筑类型准备放置时：
  1. 空格子按邻接加成数量高亮（§10.2）
  2. 端口可连接范围用虚线圈标示（哪些已有建筑有空闲输入端口）
  3. 推荐位带角标（×1, ×2, ×3+）
  4. 点击空格子确认放置

放置成功后：
  1. 邻接高亮消失
  2. 如果有可连接建筑→自动提示"要连接管线吗？"
```

### 12.3 传送带连接模式

```
选中起点建筑后：
  1. 起点输出端口空闲→亮绿色脉冲
  2. 可连接目标→输入端口白色脉冲
  3. 端口满的建筑→整体变暗+端口红色
  4. 不在FLOW_MAP中→整体变暗

连接成功：
  1. 端口变为资源色(已连)
  2. 传送带线从端口圆心出发
  3. 音效"咔嗒"
  
连接失败（端口满）：
  1. 端口闪红0.5s
  2. 短震动（移动端）
  3. log + toast
```

---

## 十三、改动清单（开发Checklist）

### 13.1 数据层

- [x] `game.js` BLDS — ~~新增 `bioFuelCell`~~ → `fermentVacuole`（发酵液泡）建筑定义 ✅
- [x] `game.js` — 新增 `PORT_DEFS` 常量表（22项） ✅ (L626-653)
- [x] `game.js` — 新增 `getUsedPorts()` / `hasAvailablePort()` / `getPortConfig()` ✅ (L656-687)
- [x] `game.js` — 新增 `getPortEfficiencyDiscount()` 端口效率折扣函数 ✅ (L692-705)
- [x] `game.js` — 新增 `previewAdjacencyBonuses()` 邻接预览函数 ✅ (L719-750)
- [x] `game.js` — 新增 `isEffectivelyAdjacent()` 有效邻接判定函数 ✅ (L772: physical/virtual判定)
- [x] `game.js` SVG — ~~新增 `bioFuelCell`~~ → `fermentVacuole` 的SVG图标 ✅
- [x] `game.js` FLOW_MAP — ~~新增 `bioFuelCell`~~ → `fermentVacuole` 的所有输入/输出流关系（18条） ✅
- [x] `game.js` ADJACENCY_RULES — ~~新增 `bioFuelCell`~~ → `fermentVacuole` 相关6条邻接规则 ✅
- [x] `game.js` MUTATIONS — 新增 `branchPipeline`(稀有) 和 `hubNode`(史诗) 突变数据 ✅ (L1328-1371)
- [x] `game.js` 转生加成 — 新增 `portEngineering` 无限加成 ✅ (L1976 inf_port/管线工程学)

### 13.2 经济系统改动

- [x] `game.js` 维护费计算 — 改为葡萄糖为主 ✅ (L595-609)
- [x] `game.js` 管理开销 — 阈值8→12，幅度6%→4%，上限180%→160% ✅ (L604-606)
- [x] `game.js` 资源竞争 — 阈值75%→85%，最低效率50%→60% ✅ (L613-617)
- [x] `game.js` 资源竞争 — 新增P3缓冲期180秒渐进阈值 ✅ (L620-622, L7043-7051)
- [x] `game.js` 维护费计算 — 整合端口效率折扣 ✅ (L692-705, L6982)

### 13.3 科技系统改动

- [x] `game.js` TECHS `rapidMetabolism` — 去掉消耗惩罚，增加邻接条件bonus ✅ (L1095: 无_energyCostPenalty, +_energyAdjBonus 0.10, 运行时L6927)
- [x] `game.js` TECHS `adaptiveLogistics` — 增加+1输出端口+传送带容量+30%（§6.1）✅ (L1132: _transportBonus+0.10, _extraOutPorts=1, _beltCapBonus=0.30)

### 13.4 解锁节奏改动

- [x] `game.js` MUT_LAB_CONFIG — `unlockEvoLv: 3 → 4` ✅ (代码中已是4)
- [x] `game.js` MUT_LAB_CONFIG — 新增 `unlockExtraReq` 条件 ✅ (L7388: hasP3Bld硬编码检查)
- [x] `game.js` — 新增P3缓冲期逻辑（竞争阈值渐进） ✅ (L620-622, L7043-7051)
- [x] `game.js` — P2 hybrid传送带模式（自动+可选手动）✅ (BELT_MODE已实现)
- [x] `game.js` — 新增分散解锁的事件触发时间点 ✅ (v2.1: _checkPetriP3Unlock — P3配方需2×反应器+菌丝网)

### 13.5 传送带逻辑改动

- [x] `game.js` `computeBelts()` — 自动连接增加端口余量检查 ✅ (getUsedPorts/hasAvailablePort已实现)
- [x] `game.js` 手动连接 — 增加 `hasAvailablePort` 检查 ✅
- [x] `game.js` 手动断开 — 更新端口状态 ✅
- [x] `game.js` `getBeltMultiplierForBuilding()` — 验证不超过端口上限 ✅

### 13.6 渲染层改动

- [x] `game.js` `renderGrid()` — 端口渲染（半圆/箭头/颜色状态） ✅ (L3991-4035 DOM方式)
- [x] `game.js` `renderGrid()` — 邻接预览高亮（放置模式）✅ (_showAdjPreview/adj-heat-1~4热力图 + 分数badge + hover tooltip)
- [x] `game.js` `renderGrid()` — 已激活邻接计数标记 ✅ (L4037-4052 cell-adj-indicator)
- [x] `game.js` — 移除呼吸光环 `aura` ✅ (CSS `.aura{display:none}` L963-964, CHANGELOG已记录)
- [x] `game.js` — L型色标→顶部细线 ✅ (CSS `.cell-stripe{display:none}` L875, `.cell-stripe-top` 保留为1px顶线)
- [x] `game.js` tooltip — 增加端口信息 + 邻接信息 + 端口折扣 ✅ (L4336-4356)
- [x] `index.html` — 端口样式（.port.in / .port.out / .port.linked / .port.idle）✅ (L968-1002)
- [x] `index.html` — 邻接预览样式（adj-heat-1~4 + adj-preview-badge）✅ (L1039-1072)
- [x] `index.html` — .cell.ports-full 样式 ✅ (L994-999)

### 13.7 教学与引导

- [x] `game.js` GUIDE — P2阶段增加端口+邻接教学消息 ✅ (L1563: p2PortTutorial GUIDE条目, L1569: adjPreviewHint)
- [x] `game.js` GUIDE — P3阶段分阶段教学消息（传送带→竞争→变异）✅ (L1580: p3LogisticsTutorial, L1592: competitionTutorial)
- [x] `game.js` — P2升级时的端口教学面板 ✅ (L8104-8105: _p2PortTutorialPending flag + GUIDE once触发)
- [x] `game.js` — P3升级时的物流时代教学面板 ✅ (L8108: _p3LogisticsTutorialPending flag + GUIDE once触发)
- [x] `game.js` — P3+3min资源竞争启用教学面板 ✅ (L8109-8111: setTimeout 180s → _competitionEnabled + GUIDE once触发)
- [x] `game.js` — 首次端口满一次性提示 ✅ (L12648-12666: _portFullShown flag + showEvent弹窗)
- [x] `game.js` — 首次邻接放置推荐提示 ✅ (L1569: adjPreviewHint GUIDE条目, L2116: _adjPreviewShown flag)

### 13.8 UI面板新增

- [x] 邻接图鉴面板（发现/未发现列表）✅ (v2.1: showAdjGuide() — 6分类+发现追踪+进度条+锁定提示)
- [x] 建筑信息面板增加端口使用详情 ✅ (tooltip L4361-4384: 端口使用/上限+突变加成+效率折扣)
- [x] 传送带满载提示UI ✅ (getBeltCapacity系统 + 传送带面板 avgCap + beltActionInfo效率/容量显示)

### 13.9 扩展系统（可选，二期）

- [x] 变异系统 — 整合端口相关突变 ✅ (v2.1: branchPipeline/hubNode运行时逻辑 + _mutPortBonuses缓存)
- [x] 转生系统 — 整合端口扩展加成 ✅ (v2.1: inf_port/_presPortExpand消费 → _mutPortBonuses合并)
- [x] 成就系统 — 新增邻接发现成就 ✅ (v2.1: adj5/adj15/adj30/adjAll + 'adjacency'分类)

---

## 十四、风险评估

| 风险 | 严重性 | 缓解方案 |
|------|--------|---------|
| 维护费改动后P2经济太松 | 中 | 维护费数值标记为`[可调]`，首轮测试后微调葡萄糖维护费比例 |
| 发酵液泡太强导致ATP合成酶过时 | 中 | 产出刻意低于ATP合成酶(2.0 vs 2.5)，且消耗的生物质/蛋白质是P3稀缺资源 |
| P3解锁分散后节奏太慢 | 中 | 缓冲期180秒可调，变异实验室解锁等级可调 |
| 端口效率折扣叠加维护费调整导致维护费过低 | 低 | 折扣上限20%，且仅100%利用率才能享受最大折扣 |
| 虚拟邻接(传送带直连)被滥用 | 低 | 限制每建筑最多2条虚拟邻接，且只有50%加成 |
| 邻接预览高亮在大量空格时性能下降 | 低 | 只计算相邻格子(4方向)的规则匹配，计算量O(空格数×4×规则数)，可控 |
| "自适应物流"科技+1端口导致某些建筑过于灵活 | 中 | 后续测试中如果某建筑利用率过高，可针对性排除端口扩展 |

---

## 十五、调整电子表格

### 15.1 端口数值指标

```
指标                          | 目标值         | 崩溃阈值
------------------------------|---------------|------------------
平均每台建筑端口利用率         | 60-80%        | < 40% → 端口太多
                              |               | > 95% → 端口太少
ATP合成酶输出口使用分布        | 3口均匀       | 1口占80%+ → 布局问题
碳源采集器2口分配选择多样性    | 3种以上分法   | 只有1种 → 假选择
首次触发"端口满"的时间         | P2 中期       | P1 → 太早, P3+ → 太晚
```

### 15.2 经济数值指标

```
指标                          | 目标值         | 崩溃阈值
------------------------------|---------------|------------------
P3中期能量净速率（14台建筑）   | +0.5~2.0⚡/s | < 0 → 能量崩溃
P3中期葡萄糖净速率             | +0.5~3.0🟢/s | < 0 → 葡萄糖崩溃
维护费占总产出比例             | 15-25%        | > 35% → 维护费太重
资源竞争触发时机               | P3后期        | P3初期 → 太早
端口效率折扣触发率             | 50%+建筑享受  | < 20% → 折扣门槛太高
发酵液泡使用率（P3玩家）   | 30-60%        | < 10% → 不够吸引
                              |               | > 80% → 太必须
```

### 15.3 节奏指标

```
指标                          | 目标值         | 崩溃阈值
------------------------------|---------------|------------------
P2→P3过渡期玩家流失率         | < 10%         | > 20% → 断崖仍存在
P3首次手动传送带成功率         | > 85%         | < 60% → 教学不够
P3竞争系统理解率（问卷）       | > 80%         | < 60% → 解释不清晰
变异实验室解锁时的活跃率       | > 90%         | < 70% → 推迟太晚
P2阶段手动传送带尝试率         | 30-60%        | < 10% → 预热功能被忽视
```

---

## 十六、版本变更日志

```
v2.1 (2026-03-21)
  命名统一:
    - "生物燃料电池"(bioFuelCell) → "发酵液泡"(fermentVacuole)，与代码实现对齐
    - 全文档替换所有引用
  实施状态审计:
    - §2 发酵液泡：建筑定义/邻接/FLOW_MAP/端口/SVG/解锁 全部已实施 ✅
    - §8.3 变异实验室 unlockEvoLv 3→4：已实施 ✅
    - §8.4 P2 hybrid传送带模式：已实施 ✅
    - §13 全部26项unchecked条目逐一审计，确认均已实施并标记 ✅
    - checklist 更新标记已完成项（100% 完成）
  新增实施:
    - §8.2 分散解锁事件触发：培养皿P3+配方需2×生物膜反应器+菌丝运输网
    - 新增 _checkPetriP3Unlock() 检查函数 + tick循环调用
    - 新增 P3配方门控逻辑（_matchPetriRecipe maxPhase限制）
    - 新增 培养皿UI面板P3解锁状态提示
    - 新增 P3教学引导：高阶配方解锁条件提示
    - 存档系统支持 _petriP3Unlocked 持久化
  Bug修复:
    - §6.1 adaptiveLogistics: _transportBonus 0.05→0.10（菌丝运输网加成15%→20%，与设计文档对齐）
    - §9.2 branchPipeline/hubNode: 突变数据已有但无运行时逻辑 → 新增 _recalcMutEffects() 端口突变处理
    - §9.3 inf_port/管线工程学: _presPortExpand 值设置但从未消费 → 新增转生端口扩展运行时处理
  新增功能:
    - §9.2/§9.3 统一端口加成缓存 _mutPortBonuses：聚合突变+转生端口加成
    - §9.2/§9.3 6处端口检查点统一消费 _mutPortBonuses（hasAvailablePort/renderGrid/tooltip/auto-belt/manual-connect/checkPortFull）
    - §9.2 突变目标持久化 _mutPortTargets + §9.3 转生目标持久化 _presPortTargets
    - §10.4 邻接发现追踪系统 _discoveredAdj（getAdjacencyBonus运行时自动记录）
    - §10.4 邻接图鉴面板 showAdjGuide()（6分类/发现-未发现-锁定/进度条/点击入口）
    - §10.4 4个邻接成就 adj5/adj15/adj30/adjAll + adjacency成就分类

v2.0 (2026-03-19)
  新增:
    - §2: 发酵液泡建筑（解决能量瓶颈问题）
    - §7: 死亡螺旋缓解机制（维护费+竞争阈值+端口效率折扣）
    - §8: P2→P3系统解锁分散方案
    - §10: 邻接加成可视化系统
    - §6: 科技分支平衡调整（P1快速代谢、P3自适应物流）
  整合:
    - 完整包含PORT_SYSTEM_DESIGN.md v1.0的全部内容
    - 端口表从21种扩展到22种建筑
  覆盖:
    - 评估报告4个高优问题全部有对应解决方案
    - 建筑系统2.0的3个组件全部覆盖

v1.0 (PORT_SYSTEM_DESIGN.md)
  初版端口系统设计
```

---

*文档版本: v2.1*  
*作者: GameDesigner Agent*  
*状态: ✅ 全部实施完成 (Checklist 100%)*  
*前置依赖: GAME_DESIGN_EVALUATION.md*  
*替代文档: PORT_SYSTEM_DESIGN.md v1.0（本文档完全包含其内容）*
