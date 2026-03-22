# 方案C：P2渐退 + P3软着陆 — 传送带过渡设计方案

> 版本: v1.0 | 日期: 2026-03-22
> 目标: 消除P2→P3的手动管线断崖，通过渐进脚手架让玩家自然学会手动操作

---

## 1. 问题诊断

### 现状（BELT_MODE 常量）
```js
const BELT_MODE = {
  1: 'auto',      // P1: 纯自动
  2: 'hybrid',    // P2: 自动+可选手动（但玩家零动力学手动）
  3: 'manual',    // P3+: 纯手动（断崖！）
};
```

### 根因
| 问题 | 原因 |
|------|------|
| P2的hybrid没教会任何东西 | 自动跑得太好，手动是锦上添花 |
| P2→P3是硬切 | 前一秒全自动，下一秒全手动 |
| P3教学只有一行文字 | `_p3LogisticsTutorialPending` 只弹一条日志 |
| 首次手动连接无正反馈 | 连完之后和自动连接无区别 |

### 设计目标
1. P2中期开始**逐步移除自动**，让玩家在安全网下练习
2. P3入口有**缓冲过渡**，不是瞬间清空
3. 手动管线给**正向激励**，让玩家感受到"我比系统做得好"
4. 端口约束**延迟引入**，不和手动操作同时增加认知负荷

---

## 2. 方案总览

```
P2 早期          P2 中期(bld≥4)       P2 后期(bld≥6)       P3 入口            P3 稳态
─────────────────────────────────────────────────────────────────────────────────────
全自动+引导       新建筑手动          旧管线虚线+降效      保留3条遗留→退化    纯手动
"试试自己连"     "新建筑需你连"     "老管线老化了"      "赶紧替换！"       "掌控一切"
                  │                   │                    │
                  └── 第一拍 ──────── 第二拍 ─────────── 第三拍
```

---

## 3. C1: P2 渐退三拍

### 3.1 核心改动：BELT_MODE 从常量→函数

```js
// ===== 替换原 BELT_MODE 常量 =====
function getBeltMode(phase, totalBuildings, manualBeltCount) {
  if (phase <= 1) return 'auto';
  if (phase >= 3) return 'manual'; // P3+始终手动（软着陆由另一机制处理）

  // P2 渐退三拍
  if (totalBuildings < 4) return 'hybrid';          // 第一拍：全自动+引导
  if (totalBuildings < 6) return 'hybrid-newManual'; // 第二拍：新建筑手动
  return 'hybrid-decay';                             // 第三拍：旧管线老化
}
```

### 3.2 状态变量（添加到 `G` 初始状态）

```js
_p2BeltPhase: 0,           // 0=未进入渐退, 1=第一拍, 2=第二拍, 3=第三拍
_p2ManualBldSet: new Set(), // P2第二拍后放置的建筑idx（这些建筑不享受自动连线）
_p2DecayStartTime: 0,      // 第三拍开始时间（用于计算老化进度）
_p2FirstManualBeltDone: false, // P2中是否完成过首条手动管线
```

### 3.3 第一拍实现（P2初期，bld < 4）

**触发点**: `cellClick()` 建筑放置后 (game.js ~7316行)

```js
// 在 currentBeltMode === 'hybrid' 分支中增强
} else if (currentBeltMode === 'hybrid') {
  if (beltInfoAfter.count > 0) {
    this.log(`🔗 自动连接 ×${beltInfoAfter.count}`, 's');
  }
  // ★ C1-第一拍：P2首次放置时引导手动连接
  if (!this._p2FirstManualBeltDone && this.phase === 2 && this.totalBuildings() >= 2) {
    setTimeout(() => {
      this._showGuideBubble(
        '🔗 这条管线是系统帮你连的\n试试自己连一条？效率更高哦！',
        document.getElementById('beltConnectBtn'),
        { duration: 8000 }
      );
    }, 1500);
  }
}
```

### 3.4 第二拍实现（P2中期，bld ≥ 4）

**核心逻辑**: `computeBelts()` 中区分"旧建筑"和"新建筑"

```js
// 在 computeBelts() 中 (game.js ~13100行)
const beltMode = getBeltMode(this.phase, this.totalBuildings(), 
                              Object.keys(this.manualBelts||{}).length);

if (beltMode === 'hybrid-newManual') {
  // 第二拍：只为 _p2ManualBldSet 之外的旧建筑计算自动管线
  // 新建筑需要手动连接
  // ...（在rawLinks过滤中排除_p2ManualBldSet中的idx）
}
```

**触发点**: `cellClick()` 放置后

```js
// P2 第二拍：新建筑进入手动集合
if (this.phase === 2 && beltMode === 'hybrid-newManual') {
  this._p2ManualBldSet.add(idx);
  if (!this._p2Phase2Announced) {
    this._p2Phase2Announced = true;
    this.log('🧬 新细胞器正在适应手动调控...新建筑需要你亲手连接管线', 'ev');
    this._showGuideBubble(
      '🧬 新放置的建筑需要你手动连接管线了\n点击 🔗 按钮开始连接',
      document.getElementById('beltConnectBtn'),
      { duration: 6000 }
    );
  } else {
    this._showBeltGuide(idx, bd); // 在新建筑上显示连接引导
  }
}
```

### 3.5 第三拍实现（P2后期，bld ≥ 6）

**视觉变化**: 自动管线变为虚线 + 效率降低

```js
// drawConveyorBelts() 中 (game.js ~13283行)
if (beltMode === 'hybrid-decay') {
  // 自动管线用虚线绘制 + 低透明度
  beltStyle.strokeDasharray = '6 4';
  beltStyle.opacity = 0.5;
  beltStyle.filter = 'saturate(0.3)'; // 去色暗示"老化"
}
```

**效率衰减**: `updateRates()` 中

```js
// 自动管线效率降低（非手动管线）
if (beltMode === 'hybrid-decay' && !isManualBelt) {
  beltEfficiency *= 0.5; // 自动管线效率减半
}
```

**触发提示**: 进入第三拍时

```js
if (this._p2BeltPhase < 3 && beltMode === 'hybrid-decay') {
  this._p2BeltPhase = 3;
  this.log('⚡ 自动管线开始老化！效率降低50%。用手动管线替换它们！', 'w');
  this._showGuideBubble(
    '⚡ 自动管线正在老化\n效率降低了50%\n用手动管线替换来恢复满效率！',
    document.querySelector('.belt-auto'), // 指向某条自动管线
    { duration: 8000, direction: 'bottom' }
  );
}
```

### 3.6 便捷操作：一键替换自动管线

```js
// 点击自动管线时显示"替换为手动"选项
// 在belt右键/点击菜单中增加：
{
  label: '🔄 替换为手动管线',
  icon: '🔗',
  show: belt => !belt.isManual && this.phase === 2,
  action: belt => {
    // 保留路径，转为手动
    const key = belt.key;
    this.manualBelts[key] = {
      fi: belt.fi, ti: belt.ti,
      colors: belt.colors, icons: belt.icons, labels: belt.labels,
    };
    this.log('🔄 已替换为手动管线 — 效率恢复100%', 's');
    SFX.build();
    this.refreshBelts();
    this.updateRates();
  }
}
```

---

## 4. C2: P3 软着陆

### 4.1 遗留管线机制

**进入P3时（`_doPhaseUpgrade()` ~11515行）**:

```js
// ★ C2: P3软着陆 — 保留最多3条自动管线作为"遗留管线"
if (newPhase === 3) {
  // 筛选当前最重要的3条自动管线（按产线收入排序）
  const autoBelts = this._activeBelts.filter(b => !this.manualBelts[b.key]);
  const top3 = autoBelts
    .sort((a, b) => (b.flowValue || 0) - (a.flowValue || 0))
    .slice(0, 3);
  
  this._p3LegacyBelts = top3.map(b => ({
    key: b.key, fi: b.fi, ti: b.ti,
    colors: b.colors, icons: b.icons, labels: b.labels,
    expiresAt: Date.now() + 30000, // 30秒后开始退化
    efficiency: 0.8, // 起始80%效率（已有老化感）
  }));
  this._p3LegacyDecayTimer = 0;
}
```

### 4.2 遗留管线退化时间轴

```
进入P3
  │
  ├── 0-30s: 3条遗留管线正常工作（80%效率），虚线样式
  │          引导气泡："这些是旧时代的自动管线，它们正在退化..."
  │
  ├── 30s: 第1条退化
  │        效率→30%，闪烁警告
  │        气泡："⚡ 1条管线即将断裂！赶紧手动补上！" + 高亮两端建筑
  │
  ├── 45s: 第1条消失，第2条退化
  │        同上引导
  │
  ├── 60s: 第2条消失，第3条退化
  │
  └── 75s: 全部消失 → 纯手动模式
```

### 4.3 退化tick实现

```js
// 在 animationLoop / tick 中（每秒检查一次）
_tickP3LegacyBelts() {
  if (this.phase !== 3 || !this._p3LegacyBelts?.length) return;
  
  const now = Date.now();
  let changed = false;
  
  for (let i = this._p3LegacyBelts.length - 1; i >= 0; i--) {
    const lb = this._p3LegacyBelts[i];
    if (now >= lb.expiresAt + 15000) {
      // 已过期15秒 → 彻底移除
      this._p3LegacyBelts.splice(i, 1);
      changed = true;
      const fromBld = BLDS[this.grid[lb.fi]?.type];
      const toBld = BLDS[this.grid[lb.ti]?.type];
      this.log(`💀 遗留管线断裂: ${fromBld?.emoji||''}→${toBld?.emoji||''}`, 'w');
      
      // 引导：指向断裂位置
      const remaining = this._p3LegacyBelts.length;
      if (remaining > 0) {
        this._showGuideBubble(
          `⚡ 还有${remaining}条遗留管线即将断裂\n赶紧手动连接替代方案！`,
          document.querySelector(`.cell[data-i="${lb.fi}"]`),
          { duration: 5000, direction: 'top' }
        );
      }
    } else if (now >= lb.expiresAt) {
      // 过期中 → 效率逐渐降低
      const elapsed = (now - lb.expiresAt) / 15000; // 0→1
      lb.efficiency = 0.8 * (1 - elapsed);
      
      // 首次过期提示
      if (!lb._warningShown) {
        lb._warningShown = true;
        const fromBld = BLDS[this.grid[lb.fi]?.type];
        const toBld = BLDS[this.grid[lb.ti]?.type];
        this.log(`⚡ 遗留管线老化: ${fromBld?.emoji||''}→${toBld?.emoji||''} 效率下降中...`, 'w');
        this._showGuideBubble(
          `⚡ 管线正在老化！\n手动连接一条新管线来替换它`,
          document.querySelector(`.cell[data-i="${lb.ti}"]`),
          { duration: 6000 }
        );
      }
    }
  }
  
  if (changed) {
    this.refreshBelts();
    this.updateRates();
  }
}
```

### 4.4 遗留管线视觉样式

```css
/* 遗留管线：虚线+呼吸闪烁 */
.belt-legacy {
  stroke-dasharray: 8 4;
  opacity: 0.6;
  animation: legacyBeltFade 2s ease-in-out infinite;
}

/* 过期中的遗留管线：急促闪烁 */
.belt-legacy-dying {
  stroke-dasharray: 4 4;
  animation: legacyBeltDying 0.5s ease-in-out infinite;
}

@keyframes legacyBeltFade {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

@keyframes legacyBeltDying {
  0%, 100% { opacity: 0.7; stroke: #ef4444; }
  50% { opacity: 0.2; stroke: #ef444480; }
}
```

### 4.5 保底安全网

```js
// 如果P3进入60秒后仍然0条手动管线 → 弹出交互式教程
if (this.phase === 3 && this._p3EntryTime && 
    Date.now() - this._p3EntryTime > 60000 &&
    Object.keys(this.manualBelts||{}).length === 0 &&
    !this._p3TutorialShown) {
  this._p3TutorialShown = true;
  this._showBeltTutorialPanel(); // 全屏交互式教程
}
```

---

## 5. C3: 手动管线啊哈奖励

### 5.1 首条手动管线奖励

**触发点**: `manualBelts[key] = {...}` 之后 (~17746行)

```js
// ★ C3: 首条手动管线啊哈时刻
const manualCount = Object.keys(this.manualBelts).length;
if (manualCount === 1 && !this._firstManualBeltCelebrated) {
  this._firstManualBeltCelebrated = true;
  
  // 效率+10%永久标记
  this.manualBelts[key]._firstBelt = true;
  
  setTimeout(() => {
    this.showEvent(
      '🎉 首条手动管线！',
      `你亲手建立了第一条传送带连接！\n\n` +
      `手动管线比自动管线效率+10%\n` +
      `精心规划的布局是帝国强大的基石\n\n` +
      `💡 继续连接更多管线，打造你的物流网络！`,
      '#06d6a0'
    );
    SFX.milestone();
    // 粒子爆发
    this._spawnPlaceRipple(fromIdx);
    this._spawnPlaceRipple(idx);
  }, 300);
}
```

### 5.2 手动管线永久效率加成

**位置**: `updateRates()` / `getBeltMultiplierForBuilding()` 中

```js
// 手动管线 vs 自动管线的效率差异
function getBeltEfficiency(beltObj) {
  let eff = 1.0;
  
  if (beltObj.isManual) {
    eff *= 1.10; // 手动管线基础+10%
  }
  
  if (beltObj._firstBelt) {
    eff *= 1.05; // 首条管线额外+5%（纪念奖励）
  }
  
  // 距离衰减（已有逻辑）
  eff *= distanceEfficiency(beltObj.dist, beltObj.isRelay);
  
  return eff;
}
```

### 5.3 连接里程碑奖励

```js
// 每达成手动管线数量里程碑时弹出鼓励
const MANUAL_BELT_MILESTONES = {
  3:  { text: '🔗 物流新手！3条手动管线', reward: { energy: 30 } },
  8:  { text: '🔗 物流工程师！8条手动管线', reward: { energy: 60, dna: 10 } },
  15: { text: '🔗 物流大师！15条手动管线', reward: { energy: 100, dna: 20 } },
};
```

---

## 6. C4: 端口约束延迟展示

### 6.1 P3a 端口隐藏

```js
// hasAvailablePort() 函数修改 (~17688行)
function hasAvailablePort(idx, direction) {
  // ★ C4: P3a前期（手动管线<5条时）不限制端口
  if (G.phase === 3 && !G._p3bUnlocked && 
      Object.keys(G.manualBelts||{}).length < 5) {
    return true; // 始终允许连接
  }
  
  // 原有端口检查逻辑...
}
```

### 6.2 端口系统渐进引入

```
手动管线 0-4条: 端口无限制（隐藏端口UI）
手动管线 5条时: 
  → "🔗 端口系统激活！每个建筑有输入/输出端口上限"
  → 引导气泡解释端口概念
  → 悬停建筑开始显示端口数
手动管线 8+条: 完整端口约束（P3b探索度目标）
```

### 6.3 端口UI渐进显示

```js
// renderGrid() 中建筑格子的端口数显示
if (this.phase >= 3 && Object.keys(this.manualBelts||{}).length >= 5) {
  // 显示端口占用: ●●○ (已用/总数)
  const usedIn = getUsedPorts(idx, 'in');
  const maxIn = PORT_DEFS[type]?.maxIn || 0;
  // ...渲染端口指示器
}
```

---

## 7. 存档兼容

### 7.1 新增存储字段

```js
// save() 中增加
_p2BeltPhase: this._p2BeltPhase || 0,
_p2ManualBldSet: [...(this._p2ManualBldSet || [])],
_p2FirstManualBeltDone: this._p2FirstManualBeltDone || false,
_p3LegacyBelts: this._p3LegacyBelts || [],
_p3EntryTime: this._p3EntryTime || 0,
_firstManualBeltCelebrated: this._firstManualBeltCelebrated || false,
_p3TutorialShown: this._p3TutorialShown || false,
```

### 7.2 老存档加载

```js
// load() 中兼容
if (!s._p2BeltPhase) this._p2BeltPhase = 0;
if (s._p2ManualBldSet) this._p2ManualBldSet = new Set(s._p2ManualBldSet);
// P3玩家加载旧存档：跳过渐退，直接纯手动（和以前行为一致）
if (this.phase >= 3 && !s._p3LegacyBelts) {
  this._p3LegacyBelts = []; // 不补遗留管线
}
```

---

## 8. 实施排期

| Sprint | 内容 | 估时 | 文件 |
|--------|------|------|------|
| C1a | `getBeltMode()` 函数 + 第一拍引导 | 1h | game.js |
| C1b | 第二拍：新建筑手动 + `computeBelts` 过滤 | 1.5h | game.js |
| C1c | 第三拍：虚线视觉 + 效率衰减 + 一键替换 | 1.5h | game.js + index.html |
| C2 | P3遗留管线 + 退化时间轴 + 安全网教程 | 1.5h | game.js + index.html |
| C3 | 首条啊哈 + 效率加成 + 里程碑 | 0.5h | game.js |
| C4 | 端口延迟展示 | 0.5h | game.js |
| 兼容 | save/load + 老存档处理 | 0.5h | game.js |
| **总计** | | **~7h** | |

---

## 9. 验证清单

- [ ] P1→P2升级后自动管线仍正常工作
- [ ] P2第4个建筑起，新建筑不自动连线 + 引导气泡
- [ ] P2第6个建筑起，旧管线变虚线 + 效率-50%
- [ ] 点击自动管线可一键替换为手动
- [ ] P2→P3过渡时保留3条遗留管线
- [ ] 遗留管线30秒后开始退化，75秒全部消失
- [ ] 首条手动管线触发啊哈事件 + 效率+10%
- [ ] P3a手动管线<5条时端口不受限
- [ ] 手动管线≥5条后端口UI出现 + 约束生效
- [ ] 老P3存档加载后行为与原版一致（无遗留管线）
- [ ] P3b探索度目标不受影响

---

## 10. 引导文案

### P2 第一拍
> 🔗 这条管线是系统帮你连的。试试自己连一条？手动管线效率更高哦！

### P2 第二拍
> 🧬 新的细胞器需要手动连接管线了。随着帝国壮大，自动化系统已无法跟上扩张速度...

### P2 第三拍
> ⚡ 旧时代的自动管线开始老化了...效率降低50%。用手动管线替换它们，恢复满效率！

### P3 入口
> 🔬 进入物流时代。系统保留了3条旧管线作为过渡——但它们正在退化。尽快建立你自己的物流网络！

### P3 首条手动管线
> 🎉 完美！你亲手建立了第一条传送带连接。手动管线效率比自动管线+10%——精心规划是帝国强大的基石！

### P3 遗留管线断裂
> ⚡ 一条遗留管线断裂了！还有{n}条即将断裂。赶紧手动连接替代方案！

### P3 保底教程
> 🔧 需要帮助？进入传送带模式：点击起始建筑→点击目标建筑→完成！（互动式演示）
