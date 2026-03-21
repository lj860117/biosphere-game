# Changelog — 微生物帝国 (Biosphere Game)

> 提交标记：`[office]` = 公司电脑 · `[home]` = 家里电脑

---

## v1.3.0 — 2026-03-22 · 新手防呆引导系统

> **Player Onboarding & Anti-Stuck System**
> 针对B站玩家反馈"新手教程没仔细看就卡住"的问题，全面加强引导提示的可见性和主动性。
> 代码变更：game.js ~80行新增，index.html ~60行新增

### 帝国总览折叠提示
- [office] 折叠状态下在 header 居中显示 "▸ 点击展开" 提示文字
- [office] 绝对定位居中 + 呼吸动画(hintPulse)，青绿色调与主题一致
- [office] 展开后自动隐藏，折叠后重新显示

### 卡住检测 + 主动提醒系统
- [office] 在 `updateGuide()` 中跟踪引导步骤，同一步骤停留>45s 自动弹出橙色提醒浮条
- [office] 浮条内容：`💡 看起来卡住了？→ [当前该做的事]`，12s后自动消失
- [office] 点击浮条自动展开右侧目标面板
- [office] 引导步骤切换时目标面板(secGoal)边框闪烁青色光效1.8s

### 培养皿内常驻引导提示条
- [office] 帝国总览下方、网格上方新增 `#dishGuideBar` 常驻提示条
- [office] 同步显示当前引导步骤 icon + 简短文字，步骤变化时闪烁动画
- [office] 点击提示条展开右侧目标面板并滚动到位，通关后自动隐藏

---

## v1.2.0 — 2026-03-22 · UI/UX 四轮改造 Sprint 1-4

> **UI/UX Overhaul — 4 Sprints, 16 Sub-items**
> 基于 UI_UX_AUDIT.md 诊断报告(F-K方案)，全面实施4轮UI/UX改造。
> 代码变更：game.js ~800行新增/修改，index.html ~200行新增/修改

### Sprint 1: 核心反馈与效率优化
- [office] H2: 资源负值脉冲 — `.res-rate.neg` 脉冲动画 + `.critical` 存量告急(30秒)加强闪烁
- [office] H1: 智能告警摘要条 — `updateAlertBar()` 3级告警(info/warn/danger)，实时资源/休眠监控
- [office] I2: 低价免确认 — 升级费用占存量<10%时自动执行，跳过弹窗
- [office] F: 升级视觉分级 — 5级体系(Lv1默认→Lv2 upgraded→Lv3蓝金→Lv4金晕脉冲→Lv5 MAX紫色浮动)

### Sprint 2: 信息架构精简
- [office] G2: 建造按钮简化 — 从4行压缩为2行(名称+内联造价+产出提示)，详情移入tooltip
- [office] G3: 帝国总览精简 — 默认折叠+摘要行(阶段/效率/评分)，`updateEmpireSummary()`
- [office] G4: 右侧面板重排 — CSS order重新排列优先级，统计/日志默认折叠
- [office] I1: 弹窗简化 — 升级弹窗从5行压缩为2行(名称+等级inline, 倍率+造价inline)

### Sprint 3: 菌主沉浸感
- [office] J1: 菌主形象常驻 — topbar阶段微头像(🦠→🧬→🧪→⚙️→🏛️) + 状态语实时更新
- [office] J2: 叙事化文案 — `_NARRATIVE_MAP` 正则映射(阻塞→饥饿, 回收→分解重组, 建造→培育…)
- [office] J3: 微叙事事件 — 首个建筑milestone + 阶段升级叙事日志
- [office] K1: 培养皿液体质感 — `::before` 波纹渐变 + `::after` 暗角

### Sprint 4: 美术风格提升
- [office] K2: 格子美术升级 — 工作中建筑呼吸动画(scale 1→1.015) + 产出边框微发光
- [office] K3: 色彩系统简化 — 4色状态变量(--status-ok/warn/danger/special/reward)
- [office] K4: 字体层级精简 — 3档字体变量(--font-heading/body/mono) + 实用CSS类

### 📄 新增/更新文档
- [office] `UI_UX_AUDIT.md` — UI/UX诊断报告(8个问题 + 6大方案F-K + 4个Sprint路线图)

---

## v1.1.0 — 2026-03-21 · 视觉叙事增强 Phase A-E

> **Visual Narrative Enhancement — 5 Phase Implementation**
> 完整实施视觉叙事方案5大提案，从"能用"升级为"有感觉"。
> 代码变更：game.js +1574/-44 行，index.html 多处增强，新增 VISUAL_NARRATIVE_PLAN.md

### Phase A: 阶段色彩演变系统
- [office] `PHASE_COLORS` 常量 — 5阶段色彩映射（primary/glow/border/bg-tint）
- [office] `setPhaseColors(phase)` 全局函数 — 动态设置CSS变量 + transition过渡
- [office] topbar/sidebar/center 边框使用阶段动态色彩

### Phase B: 传送带资源流动可视化
- [office] 传送带负载级别视觉反馈：空闲虚线 / 低载稀疏流动 / 满载金黄光晕+脉冲光点
- [office] 货物粒子增强：满载时放大1.3x + 金色光晕，低载时缩小0.85x

### Phase D: 阶段升级视觉仪式
- [office] 3秒异步仪式序列：遮罩→核心进化→色彩切换→24光粒子爆发→阶段名称→屏震→闪烁→恢复
- [office] CSS: `.phase-ceremony-overlay` / `.core-evolving` / `.ceremony-particle` / `.ceremony-flash`
- [office] HTML: 仪式遮罩DOM结构

### Phase C: 培养基生命感
- [office] bgCanvas营养粒子漂浮系统：布朗运动 + 阶段色彩 + 密度递增(20→150)
- [office] 空格子培养基纹理CSS：radial-gradient微光暗示"这里是活的培养基"

### Phase E: 成就视觉仪式
- [office] 三级成就规格：bronze轻闪光 / gold金色粒子+全屏微闪 / diamond全屏史诗仪式
- [office] `_showEpicAchievement()` — 全屏暗化 + 中央💎图标 + 双波光环扩散 + 4秒淡出
- [office] gold/diamond粒子爆发(12/20颗)，diamond紫色粒子+震屏12+二次震屏
- [office] CSS: `.achievement-epic-overlay` / `.achievement-epic-ring` / `.achv-particle`

### 📄 新增文档
- [office] `VISUAL_NARRATIVE_PLAN.md` — 视觉叙事评估(7.4/10)与增强方案(5提案)完整文档

---

## v0.9.3 — 2026-03-21 · 建筑系统2.0完善 + 距离-效率衰减

> **Building System 2.0 Polish + Distance-Efficiency Decay (INTEGRATED_DESIGN §4)**
> 建筑系统2.0收尾（休眠、冲击预览、邻接图鉴、端口突变/转生、P3分散解锁、引导视觉统一），以及融合设计文档§4距离-效率衰减系统全部实施。
> 代码变更：game.js +719/-148 行，index.html +83/-17 行

### ✨ 新功能 — 距离-效率衰减（INTEGRATED_DESIGN §4）
- [home] `getBeltDistance(beltKey)` — 新增曼哈顿距离计算函数
- [home] `_distanceEfficiency(dist)` — 距离衰减查找表：1格=100%, 2格=92%, 3格=80%, 4格=65%
- [home] `getBeltEfficiency()` 整合距离衰减：效率 = 等级效率 × 距离因子
- [home] 远距传送带维护费 — 距离≥3时扣除ATP: `0.3 × (dist - 2)` /s
- [home] 连线高亮时显示距离+效率标签（`belt-dist-badge`），远距目标橙色、近距青色
- [home] 传送带tooltip增加距离衰减%和维护费信息
- [home] 传送带渲染：远距线条按distScale缩细（0.92/0.8/0.65）

### 🏆 新成就 — 远距传送带（4项）
- [home] `longBelt2` 远程传输（2格首次）、`longBelt3` 远程物流（3格首次）
- [home] `longBelt4` 物流大师（4格首次）、`longBelt10` 网络编织者（累计10条远距）
- [home] 首次远距弹窗提示（showEvent），含策略引导文案
- [home] stats追踪：`maxBeltDist`, `longBeltCount`

### ✨ 新功能 — 建筑休眠系统（v2.1）
- [home] 右键菜单→💤休眠/☀️唤醒，休眠建筑不生产不消耗，维护费降至25%
- [home] 休眠建筑灰色虚线边框 + 顶部灰色badge脉冲动画
- [home] 休眠传送带灰色渲染、停止货物传输
- [home] 回收时自动清除休眠状态

### ✨ 新功能 — 建造前资源冲击预览（v2.1）
- [home] 空格hover（按Space）显示建造成本占比+速率变化+赤字警告

### ✨ 新功能 — 邻接图鉴面板（v2.1 §10.4）
- [home] 邻接发现追踪系统 + 邻接图鉴UI面板
- [home] 邻接发现成就

### ✨ 新功能 — 端口突变/转生加成（v2.1 §9.2/§9.3）
- [home] 突变端口加成（branchPipeline/hubNode extraIn/extraOut）
- [home] 转生端口扩展（inf_port）
- [home] 菌丝运输网加成提升至20%（0.05→0.10）+ beltCapBonus 0.30

### ✨ 新功能 — P3配方分散解锁（v2.1 §8.2）
- [home] 培养皿P3+配方按探索进度分散解锁
- [home] 解锁引导提示

### 🎨 视觉 / UI 调整
- [home] 引导系统视觉统一为琥珀金色系（#fbbf24）：呼吸高亮、提示条、箭头浮层
- [home] 箭头字体放大 0.6em→0.78em + text-shadow发光

### 📄 文档
- [home] 新增 INTEGRATED_DESIGN.md — 节奏×连线融合设计 v1.0
- [home] 新增 PACING_ENHANCEMENT.md — 节奏增强方案（已被INTEGRATED_DESIGN替代）
- [home] BUILDING_SYSTEM_2_0.md 更新至 v2.1（Checklist 100%）

### ✨ 新功能 — 邻接加成体验升级：六维度成就系统 & 全局统计
- [office] 新增 **邻接** 成就分类（🔗 图标），包含 6 个阶梯式成就
- [office] calcScore() 新增第 11 计分维度：每 10% 总邻接加成 = 25 分，封顶 200 分
- [office] 统计面板/供应链面板新增邻接统计行
- [office] 放置建筑后邻接加成变化飘字
- [office] 供应链面板显示邻接加成 Top 5 建筑排行（点击可高亮跳转）
- [office] `_getAdjStats()` 带 5 秒缓存 + `_invalidateAdjStats()` 强制刷新

---

## v0.9.2 — 2026-03-19 · 邻接分数热力图 — 可视化放置引导系统

> **Adjacency Score Heatmap**
> 将邻接预览从简单的 ×N 计数升级为百分比分数热力图，新增 hover 加成明细 tooltip 和反向加成闪烁提示，P1 阶段即解锁。
> 代码变更：game.js +107/-8 行，index.html +59/-19 行

### ✨ 新功能 — 热力图分数显示
- [office] 邻接预览从 `×1` / `×2` / `×3+` 升级为精确百分比分数 `+8%` / `+15%` / `+32%`
- [office] 四档颜色梯度热力图：暗绿（<5%）→ 亮绿（5~15%）→ 金色（15~30%）→ 闪金（30%+）
- [office] 30%+ 最佳位置格子和 badge 带脉冲发光动画，一眼锁定最优放置点

### ✨ 新功能 — Hover 邻接加成明细 Tooltip
- [office] 鼠标悬停有邻接加成的空格子，弹出详细加成明细面板：
  - 🔗 正向加成：每条规则的 icon + 名称 + 百分比 + 来源建筑
  - 🔄 反向加成：放置后对邻居建筑的增益明细
  - ∑ 综合加成：总百分比汇总
- [office] 复用现有 tooltip 系统，动态生成分类 HTML

### ✨ 新功能 — 反向加成闪烁提示
- [office] 放置新建筑时如果能让邻居也获得加成，邻居建筑底部显示闪烁 `↑+X%` 提示
- [office] 金色脉冲动画（`reverseHintPulse`），引导玩家关注协同效应
- [office] 按邻居聚合反向加成，同一邻居多条规则合并显示

### 🔓 P1 阶段解锁邻接预览
- [office] 移除 `phase >= 2` 限制，P1 即可使用邻接放置预览
- [office] 教学提示前移：3 栋建筑触发（原 P2+6 栋），文案更新匹配新功能

### 🎨 视觉 / UI 调整
- [office] 新增 `.adj-heat-1~4` 四档热力图格子样式（box-shadow 内发光 + 内辉光）
- [office] 新增 `.adj-badge-t1~4` 四档 badge 样式（绿→金渐变背景 + 文字阴影）
- [office] 新增 `.adj-reverse-hint` 反向加成提示样式（金色底 + 缩放脉冲动画）
- [office] 替换旧的 `.adj-preview-1~3` / `adjPulse` 为新热力图样式体系

### 🔧 技术实现
- [office] `_showAdjPreview()` 重构为两遍渲染：第一遍计算所有格子的正向/反向加成百分比，第二遍渲染热力图
- [office] 新增 `_adjPreviewData` 存储预览数据，供 hover tooltip 实时读取
- [office] `_clearAdjPreview()` 更新为清理四档热力类 + 反向提示 + 预览数据
- [office] mouseenter 事件增加空格子分支：有预览数据时生成分类加成明细 HTML
- [office] 教学提示条件简化：移除阶段限制，仅需 `totalBuildings() >= 3`

---

## v0.9.1 — 2026-03-19 · 终局高潮系统 — 史诗终章与文明编年史

> **Endgame Climax System**
> 本版本为游戏终局添加了宏大的高潮演出系统,包括史诗级音效、文明编年史弹窗和视觉特效,为玩家的完整旅程画上震撼的句点。
> 代码变更：game.js +432/-12 行，index.html +441/-11 行

### ✨ 新功能 — 史诗终章音效 (Finale Soundtrack)
- [office] 新增 `wonderFinale()` 音效方法：4阶段渐进式史诗终章
  - Phase 1: 深沉冲击波（低频基础音 + 白噪声）
  - Phase 2: 上行色彩音阶（12个音符从低到高，伴随微失谐增加厚度）
  - Phase 3: 持续大和弦（C大调+附加音，8个音符持续2.5秒）
  - Phase 4: 高频余韵闪烁（8次随机高频闪烁）
  - 最终定音：低沉而温暖的低音三和弦
- [office] 音效持续时间约4秒,比之前的 `wonderDone` 更宏大、更持久

### ✨ 新功能 — 文明编年史弹窗 (Chronicle Popup)
- [office] 新增 `chroniclePopup` 弹窗系统：展示玩家的完整游戏旅程
- [office] 编年史内容包括：
  - 📜 标题："文明编年史"
  - 🌟 副标题："从一团原始液泡到征服微生物宇宙的史诗旅程"
  - 🗺️ 旅程回顾（`chronicleJourney`）：展示关键里程碑
  - 📊 统计数据（`chronicleStats`）：游戏时长、总产出等
  - 💭 结语引言（`chronicleQuote`）：富有哲理的结束语
- [office] 弹窗优先级：最高级（`_popupIds` 数组首位）
- [office] 金色主题设计：边框、按钮、背景均采用金色系

### ✨ 新功能 — 终局视觉效果 (Finale Visual Effects)
- [office] **闪光覆盖层**（`wonderFlash`）：白色闪光渐变动画
- [office] **涟漪扩散**（`wonderRipple`）：从中心扩散的金色涟漪
- [office] **余晖覆盖**（`afterglowOverlay`）：金色余晖渐隐效果
- [office] **金色飘字**（`finale-golden-float`）：固定定位 + 上浮动画
  - Orbitron 字体 + 金色 + 发光阴影
  - 动画：2.5秒 ease-out，上移80px + 放大1.3倍
- [office] **粒子喷发**（`finale-particle`）：随机方向的粒子爆发
  - CSS 变量控制动画方向（`--dx`, `--dy`）
  - 渐隐 + 缩放消失效果

### 🎨 视觉 / UI 调整 — 方案D：建筑格子视觉降噪
- [office] **Lv.1 角标默认隐藏**：`.tier-lv1` 类 `opacity:0` + `translateX(-4px)`，hover 时 0.3s 滑入显示
- [office] **序号角标半透明化**：`.cell-seq` 默认 `opacity:0.45`，hover 时全亮，减少视觉噪音
- [office] **Lv.2+ / ★MAX 不受影响**：升级后等级角标始终常驻显示，保留有意义的信息
- [office] JS 端 Lv.1 分支新增 `tier-lv1` class 标记，配合 CSS 选择器实现差异化显示

### 🎨 视觉 / UI 调整 — 终局视觉效果
- [office] 新增 `.chronicle-*` 系列 CSS 类：弹窗标题、副标题、旅程、统计、引言、按钮
- [office] 新增 `.finale-*` 系列 CSS 类：金色飘字、粒子喷发
- [office] 新增 `.wonder-flash-overlay`、`.wonder-ripple`、`.afterglow-overlay` 覆盖层样式
- [office] 所有终局动画均支持 `prefers-reduced-motion` 无障碍偏好

### 🔧 技术实现
- [office] 弹窗管理增强：`_popupIds` 新增 `chroniclePopup` 并置于首位（最高优先级）
- [office] `hidePopup()` 方法新增 `chroniclePopup` 清理逻辑
- [office] 技能树显示修复：使用空字符串 `''` 替代 `'block'`，让 CSS 的 `display:flex` 生效
- [office] 新增 HTML 结构：闪光、涟漪、余晖、编年史弹窗等 DOM 元素

### 🐛 Bug 修复
- [office] 修复 `.cell-seq` 序号角标与等级角标重叠：旧定义残留 `bottom/left` 未被重置，新增 `bottom:auto;left:auto` 确保右上角定位生效
- [office] 修复技能树（`skill-tree`）display 样式被错误覆盖的问题
- [office] 确保编年史弹窗关闭时正确清理状态

---

## v0.9.0 — 2026-03-19 · Building System 2.0 Phase 2 — 端口系统 & 邻接重构 & 经济再平衡

> **Building System 2.0 Phase 2 — UI / 渲染 / 交互层**
> 本版本实现了 BUILDING_SYSTEM_2_0.md 设计文档中的 7 大模块，为建筑系统引入端口可视化、建筑角色区分、邻接放置预览、混合传送带模式、虚拟邻接、教学系统扩展，以及全面的经济数值再平衡。
> 代码变更：game.js +581/-74 行，index.html +114/-9 行

### ✨ 新功能 — §4 端口 UI 系统 (Port System)
- [office] 新增 `PORT_DEFS` 常量表：22 种建筑的输入/输出端口定义（maxIn/maxOut/role）
- [office] P2+ 阶段建筑格子左右两侧渲染端口图标（半圆=输入📥，三角=输出📤）
- [office] 端口实时状态：已连接端口高亮着色（`linked`），未连接端口呼吸动画（`idle`）
- [office] 端口满载时格子金色外发光提示（`.ports-full`），引导玩家优化连接
- [office] 新增 `getUsedPorts(idx, direction)` — 统计建筑已使用的输入/输出端口数
- [office] 新增 `hasAvailablePort(idx, direction)` — 检查是否还有可用端口（含科技加成 `_extraOutPorts`）
- [office] 新增 `getPortEfficiencyDiscount(idx)` — 端口利用率>50%时维护费减免（最高20%）
- [office] 建筑 tooltip 增加端口占用信息展示

### ✨ 新功能 — §4.5 建筑角色视觉区分 (Building Roles)
- [office] 基于 `PORT_DEFS.role` 为建筑格子自动添加角色样式类：
  - `.role-source` — 源头建筑：绿色边框（如碳源采集器）
  - `.role-bypass` — 旁路建筑：虚线边框（如氨基酸合成器）
  - `.role-boost` — 增益建筑：蓝色外发光（如菌丝运输网）
  - `.role-wonder` — 奇观建筑：紫金渐变边框 + 1.5x 大端口

### ✨ 新功能 — §10.2 邻接放置预览高亮 (Adjacency Preview)
- [office] 新增 `previewAdjacencyBonuses(idx, bldType)` — 计算指定位置放置建筑后可获得的邻接加成数
- [office] 选中建筑类型后，所有空格根据预计邻接数分三级高亮：
  - 1个加成 — 淡绿色内框（`.adj-preview-1`）
  - 2个加成 — 中绿色内框（`.adj-preview-2`）
  - 3+个加成 — 亮绿色脉冲内框 + 角标显示加成数（`.adj-preview-3`）
- [office] 放置建筑后自动清除预览高亮

### ✨ 新功能 — §10.3 已触发邻接指示器 (Adjacency Indicators)
- [office] 已有建筑实时显示当前激活的邻接加成数量（右下角小标记 `.cell-adj-indicator`）
- [office] 渲染逻辑在 `renderGrid()` 中遍历 `ADJACENCY_RULES` 检测每栋建筑的生效规则数

### ✨ 新功能 — §8.4 混合传送带模式 (Hybrid Belt Mode)
- [office] 新增 `BELT_MODE` 常量：P1=自动, P2=hybrid（自动+可选手动）, P3+=纯手动
- [office] P2 阶段保留自动管线的同时允许玩家手动添加额外连接
- [office] 传送带连接提示根据当前阶段模式动态变化

### ✨ 新功能 — §10.5 虚拟邻接（传送带直连）
- [office] 新增 `isEffectivelyAdjacent(idx1, idx2)` — 判断"有效邻接"关系（物理相邻 OR 传送带直连）
- [office] 传送带直连的建筑享受物理邻接 50% 的加成效果，每栋建筑最多 2 条虚拟邻接
- [office] 邻接加成计算（`calcAdj()`）整合虚拟邻接逻辑

### ✨ 新功能 — §11 教学系统扩展 (Tutorial System)
- [office] P2 端口教学：进入 P2 后显示端口概念引导（"手动管线预览"）
- [office] 邻接推荐教学：P2 建筑数≥6 时提示"绿色高亮格子=邻接加成推荐位"
- [office] P3 物流时代教学：进入 P3 后显示"自动管线已关闭，需手动规划所有连接"
- [office] 资源竞争教学：P3 资源竞争系统启用时触发供需平衡概念引导
- [office] 新增 4 个教学状态 flag：`_p2PortTutorialPending`、`_p3LogisticsTutorialPending`、`_adjPreviewShown`、`_competitionTutorialShown`
- [office] 阶段升级时自动设置对应教学 flag，`once` 机制保证每条教学只显示一次

### ⚖️ 经济再平衡 — v2.0 数值调整
- [office] **维护费结构调整**：从"能量为主"改为"葡萄糖为主、能量为辅"
  - P2: `{energy:0.15}` → `{glucose:0.15, energy:0.05}`
  - P3: `{energy:0.25, glucose:0.08}` → `{glucose:0.20, energy:0.08}`
  - P4: `{energy:0.35, glucose:0.10, protein:0.03}` → `{glucose:0.25, energy:0.10, protein:0.03}`
- [office] **管理开销缓和**：阈值 8→12 栋、增长率 6%→4%、上限 180%→160%
- [office] **资源竞争缓和**：阈值 75%→85%、最低效率 50%→60%
- [office] **P3 缓冲期**：进入 P3 后前 180 秒阈值从 95% 渐进降到 85%，避免断崖式压力
- [office] **P4 解锁门槛提升**：进化等级要求 Lv.3→Lv.4 + 至少已建过 1 台 P3 建筑
- [office] **端口效率折扣**：端口利用率>50%时维护费减免最高 20%，鼓励连接优化

### 🎨 视觉 / UI 调整
- [office] 格子色标简化：移除左侧 L 型竖条（`.cell-stripe` → `display:none`），仅保留顶部 1px 细线
- [office] SVG 背景装饰降低至 opacity 0.03（原 0.3），减少视觉干扰
- [office] 呼吸光环移除（`.aura` → `display:none`），由端口发光取代
- [office] 序号角标位置调整：右上角 → 左下角（`bottom:1px;left:1px`）
- [office] 新增端口组件 CSS：`.port`、`.port.in`（半圆）、`.port.out`（三角）、`.port.linked`、`.port.idle`
- [office] 新增邻接预览 CSS：三级高亮 + 脉冲动画 + 角标
- [office] 新增端口容器 CSS：`.port-group` flex 布局，响应式适配（768px 以下缩小）

### 🔧 技术实现
- [office] `PORT_DEFS` 数据驱动：22 种建筑的端口配置集中定义，渲染/验证/教学统一引用
- [office] `renderGrid()` 增量渲染扩展：端口 DOM 元素、角色 class、邻接指示器均在同一渲染循环中生成
- [office] 邻接计算支持正向+反向双向匹配，避免 self/neighbor 类型相同时重复计算
- [office] 传送带连接验证增加端口可用性检查（`hasAvailablePort`）
- [office] 教学系统与阶段升级、建筑放置、建筑数量变化事件联动

### 📄 设计文档
- [office] 新增 `BUILDING_SYSTEM_2_0.md`（~47KB，1265行）：Building System 2.0 完整设计文档
- [office] 新增 `PORT_SYSTEM_DESIGN.md`：端口系统专项设计规格
- [office] 新增 `GAME_DESIGN_EVALUATION.md`：游戏设计整体评估报告
- [office] 新增 5 份专项评估文档：消耗压力、传送带趣味性/可教学性/时机、四问评估

---

## v0.8.3 — 2026-03-18 · 建筑辨识度增强（方案D）

### 🎨 视觉 / UI — 建筑格子辨识度优化
- [office] Emoji 放大到 1.8em，成为格子视觉中心，辨识更醒目
- [office] 名称标签改为徽章式：深色半透明底 + 纯白字 + 圆角，类似游戏 HUD
- [office] L 型色标：左侧色条加粗到 4px + 顶部新增 2px 色条，形成 L 型快速颜色索引
- [office] SVG 背景装饰 opacity 从 0.2 提升到 0.3，saturate 从 0.5 提升到 0.6，增加视觉层次
- [office] 独特边框色：每种建筑使用自身 color 字段（半透明）作为边框色，同色系建筑也可区分
- [office] 序号角标移至右上角：避免与底部名称徽章重叠，显示格式改为 `#1/3`，用建筑主题色着色

### 🔧 技术实现
- [office] 新增 `.cell-stripe-top` CSS 类实现顶部色条
- [office] 渲染逻辑新增 `stripeTop` 元素创建，与 `stripe` 配合形成 L 型色标
- [office] `cell.style.borderColor` 行内样式设置独特边框色，重置时正确清除
- [office] `cell-seq` 位置从 `bottom:0;right:1px` 改为 `top:1px;right:1px`
- [office] 序号角标 `seqEl.style.color = bd.color` 实现主题色着色

---

## v0.8.2 — 2026-03-18 · 折叠增强 + 引导自动展开

### ✨ 新功能 — 引导系统自动展开折叠面板
- [office] 新增 `_ensureSectionExpanded(secId)` 方法：当引导目标在折叠面板内时，自动静默展开（不触发音效）
- [office] 新增 `_ensureGuideSectionVisible()` 方法：根据引导步骤文本智能匹配目标面板
- [office] 三入口点覆盖：`updateGuide()` / `updateGuideHighlight()` / `_updateGuideHand()` 均在执行前自动展开目标面板
- [office] 展开时带绿色脉冲动画（`guideExpandPulse`），提示玩家面板刚打开
- [office] 引导类型映射：建造→`secBuild`、研究→`techSection`、进化→`evoSection`、变异→`mutLabSection`

### 🎨 视觉 / UI — 折叠图标增强
- [office] 折叠按钮放大：1.1em → 1.4em，padding 增加，hover 时有背景色高亮（`rgba(6,214,160,0.08)`）
- [office] 所有 9 个可折叠面板新增折叠状态提示 `▸ 点击展开`（`.sec-collapsed-hint`）
- [office] 折叠状态下 section-title 带微弱绿色背景，视觉暗示内容被收起

### 🔧 其他
- [office] production-map：P4 阶段图标 🤖→🧠、量子提取器更名为噬菌体裂解器

---

## v0.8.1 — 2026-03-18 · 右侧栏面板布局优化

### 🎨 布局调整
- [office] 变异实验室（`#mutLabSection`）从左侧栏移至右侧栏，位于进化面板下方
- [office] 培养皿实验（`#secPetri`）移至流水线·传送带上方

### 📍 调整后右侧栏顺序
```
🎯 目标 → 🧬 进化 → 🧬 变异实验室 → 🧫 培养皿实验 → 🏭 流水线·传送带 → 📊 统计 → 📝 日志
```

### ✅ 兼容性验证
- [office] 全部 JS 通过 `getElementById` 定位，无 DOM 相对位置依赖，零代码改动
- [office] 教学引导系统（GUIDE）、解锁动画、渲染逻辑均不受影响

---

## v0.8.0 — 2026-03-18 · 变异实验室 + 升级条件 Tooltip

### ✨ 新功能 — Q4：变异实验室系统
- [office] **全新子系统**：变异实验室（Mutation Lab），P2阶段自动解锁
- [office] **突变培育**：消耗 ATP + DNA 启动培育，进度条实时显示，完成后随机生成候选突变
- [office] **5级品质体系**：普通 / 精良 / 稀有 / 史诗 / 传说，品质越高效果越强
  - 史诗/传说突变有专属发光动画（紫色/金色脉冲）
- [office] **突变槽管理**：最多3个激活槽位（可通过突变扩展），支持替换和锁定
- [office] **CRISPR类别锁定**：可锁定培育类别，提高目标突变的出现概率
- [office] **20+种突变效果**，涵盖：
  - 🛡️ 防御类：厚壁菌膜（维护费-10%）、生物膜装甲等
  - ⚡ 产出类：快速分裂（全局产出+8%）、高效代谢等
  - 🔗 物流类：菌丝增幅（传送带效率+12%）等
  - 🧬 实验类：基因漂变（竞争抗性+40%）等
  - 🏆 传说级：完美适应（产出+25%/维护-25%/邻接距离+1）
- [office] **突变影响全局系统**：
  - 维护费调节（`mutMaintMod`）
  - 全局产出加成（`mutGlobalBonus`）
  - 竞争抗性（`competitionResist`）
  - 传送带效率加成（`beltEffBonus`）
  - 培育成本/速度优化
- [office] **变异实验室成就**：💎 精良品质（获得精良+品质突变）
- [office] **存档兼容**：变异实验室状态完整存入 localStorage

### ✨ 新功能 — Q5：帝国核心升级条件 Hover Tooltip
- [office] 鼠标悬停升级条件项，弹出详细信息面板：
  - 🧬 **进化等级条件**：当前等级 → 目标等级、还差几级、下次进化费用、效率加成
  - 🏗️ **建筑条件**：已建/未建状态、建造费用清单、转化比例、是否核心供能
  - 📖 **科技条件**：已研/未研状态、研究费用+时间、效果描述、前置科技
- [office] 复用 `GameTooltip` 系统，新增 `showRaw(info, anchorRect)` 方法支持直接传入数据
- [office] `getPhaseUpReqs()` 重构为三个辅助函数 `evoReq()` / `bldReq()` / `techReq()`，返回丰富的 tooltip 数据
- [office] 条件项 hover 高亮效果（背景变亮 + 紫色微光）

### ✨ 新功能 — 阶段标签 Hover Tooltip
- [office] `#phaseBadge` 和 `#corePhaseTag` 悬停显示阶段概览：
  - 全部5个阶段列表（当前阶段标记 `← 当前`）
  - 核心名称和供能上限
  - 下一阶段预告

### 🎨 视觉 / UI
- [office] 变异实验室完整 UI：突变槽卡片、培育按钮、进度条、候选选择面板
- [office] 品质专属边框颜色：灰/绿/蓝/紫/金 + 史诗紫色脉冲 + 传说金色脉冲动画
- [office] 升级条件项 `cursor: help` + hover 背景高亮过渡动画
- [office] `GameTooltip.showRaw()` 支持自定义边框颜色

### 🔧 技术实现
- [office] `MUTATIONS` 常量表定义全部突变（id/名称/描述/品质/效果/类别）
- [office] `MUT_RARITY` 品质权重表控制掉落概率
- [office] `MUT_LAB_CONFIG` 配置培育费用、时间、候选数量
- [office] `_mutActiveEffects` 缓存当前生效突变的合并效果，避免每帧重算
- [office] `updateCoreUpgradeUI()` 每次渲染后重新绑定 hover 事件（innerHTML 清空旧 DOM）
- [office] 阶段标签 hover 在 BOOT 区域一次性绑定，`buildPhaseTooltip()` 动态读取当前阶段数据

---

## v0.7.0 — 2026-03-18 · 经济系统大改 + 传送带UX + 收支透明化

### ✨ 新功能 — Q1：资源收支明细 Tooltip
- [office] 鼠标悬停资源卡片弹出浮动收支面板，逐项拆解：
  - 🏭 建筑产出（所有建筑对该资源的总产出）
  - 🔗 物流加成（菌丝网+物流人口的额外加成）
  - ⚙️ 建筑消耗（建筑运转的资源消耗）
  - 🔧 维护费（P2起的建筑维护开销）
  - 🦠 人口消耗（每100人口/s消耗0.5葡萄糖）
  - ⚖️ 竞争损耗（P3起供需紧张的产出惩罚）
  - **净值**（最终每秒增减量，绿正红负）
- [office] `updateRates()` 新增 `_rateBreakdown` 对象，每帧追踪六维度收支明细数据
- [office] 新增 `_showResBreakdown()` 函数，动态生成 tooltip HTML
- [office] Tooltip 跟随鼠标移动，自动避免超出屏幕边界

### ✨ 新功能 — Q2：传送带模式三层提醒
- [office] **持续浮动标签**：进入传送带连接模式后，屏幕顶部居中显示青色胶囊 `🔗 传送带连接模式 · ESC/右键退出`，点击即退出
- [office] **30秒闲置提醒**：无操作30秒 Banner 变黄色脉冲 + 文字 `⏰ 未操作30秒，是否仍需连接？`；60秒追加鼠标旁浮动提示
- [office] **操作冲突提示**：传送带模式下切换建造时自动退出并提示 `已退出传送带模式 → 切换到建造`；Banner 红色闪烁反馈
- [office] 每次选择格子或成功连接都重置闲置计时器
- [office] 新增 `_showBeltModeBanner()` / `_hideBeltModeBanner()` / `_startBeltIdleTimer()` / `_stopBeltIdleTimer()` / `_resetBeltIdleTimer()` / `_beltModeConflictCheck()` 系列函数

### ✨ 新功能 — Q3：2个过渡成就
- [office] **📊 收支平衡**（银）— P2阶段拥有6+建筑且所有资源速率≥0 → 奖励 80⚡40🟢10🧬
- [office] **🔄 经济复苏**（银）— 从维护费赤字恢复到全正速率 → 奖励 100⚡15🧬30🟢
- [office] 在铜级「入不敷出」和金级「高效帝国」之间搭建难度台阶，平滑经济系统学习曲线
- [office] 经济成就分类 `economy` 更新为5个成就

### ✨ 新功能 — 经济系统（方案A+C+F）
- [office] **维护费系统**（P2起）：每栋建筑持续消耗维护资源，管理开销倍率随建筑数量增加
- [office] **资源竞争系统**（P3起）：供需紧张时全局该资源产出下降
- [office] **供给同步系统**（方案F）：多输入建筑的供给均衡度影响产出效率
- [office] **传送带连击系统**（方案A）：快速连接传送带触发连击特效和加成
- [office] 维护费赤字追踪 `_everMaintDeficit` 标记，支持成就检测
- [office] 资源紧张度 `_resourceTension` 和竞争惩罚 `_competitionPenalty` 系统

### ✨ 新功能 — 教学系统增强
- [office] 维护费教学：首次出现维护费赤字时触发教学提示
- [office] 供给同步教学：同步度阈值跨越时触发浮动文字提示
- [office] 资源竞争教学：P3首次触发竞争时引导理解
- [office] P2子阶段视觉分隔，帮助玩家理解阶段进程
- [office] 邻接规则渐进解锁：只启用当前阶段已解锁的邻接规则

### ✨ 新功能 — 奇观系统
- [office] 奇观建造事件：300秒建造期间每60秒触发一次互动选择

### 🎨 视觉 / UI
- [office] 资源收支 Tooltip：毛玻璃背景 + 圆角 + 分类颜色（绿/橙/红）+ 等宽数字字体
- [office] 传送带模式 Banner：青色胶囊样式 + 入场动画 + 闲置黄色脉冲 + 冲突红色闪烁
- [office] 建筑 tooltip 增加维护费、竞争和同步信息展示

### 🔧 技术实现
- [office] `_rateBreakdown` 在 `updateRates()` 中逐建筑累计，包含 prod/bldCons/maint/popFood/competition/logistics 六维度
- [office] 传送带闲置计时器基于 `setInterval(1000)`，在 `cancelBeltConnect` 和 `handleBeltConnectClick` 中正确清理/重置
- [office] 成就总数从 ~40 增至 42，里程碑阈值（5/10/15/20/25/30）保持不变

---

## v0.6.1 — 2026-03-17 · 点选修复 & 建筑置灰

### 🐛 Bug 修复
- [office] 修复点选建筑失灵：拖拽 mouseup/touchend 回退时不再主动调用 `selectBuilding()`，避免与 `btn.onclick` 双重触发导致 toggle 抵消
- [office] 同步修复触摸端：touchend 回退也移除多余的 `selectBuilding()` 调用

### ✨ 新功能
- [office] 资源不足建筑置灰：买不起的建筑按钮自动变灰（opacity 45% + grayscale 40%），造价文字变红
- [office] 实时状态刷新：`updateUI()` 每秒轻量遍历建造按钮，资源够时自动恢复彩色
- [office] hover 时适度恢复透明度，方便查看建筑信息

### 🔧 技术实现
- [office] `renderBuildings()` 初始创建按钮时即判断 `checkRes(scaledCost(key))` 设置 `cant-afford` class
- [office] `updateUI()` 末尾通过 `classList.toggle('cant-afford', !canAfford)` 实现轻量 DOM 更新
- [office] CSS 新增 `.action-btn.cant-afford` 及其 hover、`.act-cost` 子选择器样式

---

## v0.6.0 — 2026-03-17 · 拖拽建造 & UI 优化

### ✨ 新功能
- [office] 侧栏拖拽建造：从建造列表直接拖拽建筑到培养皿网格放置（替代"点选→点格"两步操作）
- [office] 拖拽建造 ghost 浮动指示器：显示建筑 emoji + 名称，绿色/红色反映资源是否充足
- [office] 拖拽目标格子高亮反馈：空格绿色脉冲（可放置）、占用格红色（不可放置）
- [office] 拖拽源按钮视觉反馈：拖拽中半透明 + 缩小 + 虚线边框 (`.build-dragging`)
- [office] 移动端触摸拖拽建造支持：`touchstart/touchmove/touchend`，拖拽中阻止页面滚动
- [office] 拖拽与点击共存：未超过 8px 移动阈值自动回退为原有点选行为

### 🎨 视觉 / UI 改进
- [office] CSS 间距令牌统一：硬编码 `gap/padding/margin` 替换为 `var(--sp-*)` 设计令牌
- [office] 折叠动画统一：帝国总览、科技树等折叠/展开动画时长统一为 `var(--dur-collapse)`
- [office] CSS 模块化重构：相关样式按功能分组、注释标记，提升可维护性
- [office] `buildHint` 默认文字更新为"点选或拖拽到培养皿"

### ♿ 无障碍增强
- [office] ARIA 属性增强：建造按钮、面板折叠、标签页等添加 `aria-label/aria-expanded/aria-selected`
- [office] 键盘导航改进：可聚焦元素 `tabindex` 与 `role` 属性完善

### 🔧 技术实现
- [office] 拖拽建造复用 `cellClick()` 建造逻辑，通过临时 `sel` 状态桥接
- [office] 全局 `mousemove/mouseup/touchmove/touchend` 事件委托到 `document`
- [office] `elementFromPoint` + `.closest('.cell')` 实现拖拽目标检测
- [office] 新增 4 个方法：`_buildDragMove`、`_buildDragEnd`、`_createBuildDragGhost`、`_cleanupBuildDrag`

---

## v0.5.0 — 2026-03-17 · 升级体验优化 & 条件存档 & 玩家昵称

### ✨ 新功能
- [office] 玩家昵称系统：荣誉区显示昵称，点击可重命名
- [office] 条件存档系统：阶段1-2不保存进度（重开即重置），阶段3起自动持久化；UI 显示"⚠ 阶段3前不保存"脉冲提示
- [office] 三级升级体系：快速单体升级（无确认弹窗）、批量升一级、一键升满
- [office] 传送带三级升级：同建筑升级逻辑，支持快速/批量/升满操作
- [office] 升级连击 Combo 系统：连续升级时计数器 + 金色飘字 + 屏幕震动反馈

### 🎨 视觉 / UI 改进
- [office] 建筑选择弹窗重构：标题改为"快速升级"，新增"🌟 全部升满"按钮
- [office] 传送带选择弹窗重构：新增批量升级 / 升满按钮
- [office] 升级闪光动画：`.just-upgraded` + `bld-upgrade-flash` / `belt-upgrade-flash`
- [office] 存档提示 `#noSaveHint` 带 `noSavePulse` 呼吸动画，小屏自动隐藏

### 🐛 修复
- [office] 修复旧版阶段<3 存档残留问题：load() 自动清理无效存档
- [office] 升级弹窗操作后原地刷新列表，不再关闭重开

---

## v0.4.0 — 2026-03-17 · 15+ 新系统大版本 & 幽灵线修复

### ✨ 新功能
- [office] 成就殿堂系统：分类展示、进度追踪、奖励领取
- [office] 科技树面板：可视化节点解锁、前置条件、互斥分支
- [office] 培养皿实验系统：多配方合成、实验结果反馈
- [office] 挑战任务系统：限时目标、奖励机制
- [office] 菌群分工（人口分配）：拖拽式劳动力调配 UI
- [office] 建筑升级系统：多级强化、升级资源消耗
- [office] 传送带升级系统：带速提升、建筑产出加成 (`getBeltMultiplierForBuilding`)
- [office] 邻接加成规则系统：`ADJACENCY_RULES` 配置化
- [office] 转生 / Prestige 系统：重置进度换取永久加成
- [office] 词条百科浮窗 (`GameTooltip`)：悬停关键词即时释义
- [office] 抉择事件系统：随机弹出多选支剧情事件
- [office] 框选操作：拖拽多选格子批量操作
- [office] 新手引导 & 欢迎弹窗：引导手系统 (`_initGuideHand`)
- [office] SFX 音效引擎：点击、升级、成就等多种音效
- [office] 排行榜 & 建议箱面板增强

### 🐛 修复
- [office] **修复滚动提示幽灵线 bug**：`position:absolute` 伪元素在 `overflow:auto` 容器内随内容滚动导致培养皿出现青色横线；重构为 `.dish-view-wrap` 外层包裹 + `box-shadow: inset` 方案
- [office] 修复 bgCanvas 背景透明度帧叠加：`rgba(5,8,16,0.95)` → `clearRect` + `rgba(5,8,16,1)`
- [office] 修复 CRT 扫描线定位：从 `body::after` 移至 `.dish-scroll-inner::after` 使其随网格滚动
- [office] 修复消耗量未跟随物流等级缩放的问题
- [office] 修复消耗量未跟随建筑等级缩放的问题

### 🎨 视觉 / UI 改进
- [office] 光标 tooltip 多样式变体：`.ct-w`（警告）、`.ct-s`（成功）、`.ct-e`（错误）、`.ct-i`（信息）
- [office] 培养皿滚动提示改用 `box-shadow: inset` 渐变，视觉更柔和且不影响布局
- [office] Intro 弹窗 & 欢迎界面样式
- [office] 荣誉 / Honor 展示区域
- [office] 科技树节点样式：`.tt-node` 连线、高亮、锁定态
- [office] 成就殿堂分类标签页 UI
- [office] 屏幕震动特效 (`screenShake`)、Combo 连击提示 (`addCombo`)
- [office] 移动端响应式布局适配
- [office] 挑战任务面板 UI

### ⚡ 性能优化
- [office] bgCanvas 使用 `clearRect` 替代半透明覆盖，避免帧叠加
- [office] 滚动提示检测优化：同时更新 `.dish-view` 和 `.dish-view-wrap` 类名
- [office] 传送带乘数计算缓存
- [office] 引导手系统按需初始化
- [office] 事件委托优化减少 DOM 监听器数量

---

## v0.3.0 — 2026-03-17 · 帝国总览重构 & 性能优化

### ✨ 新功能
- [office] 帝国总览面板重构为左右两栏常驻布局 (`71b9606`)
- [office] 培养皿滚动时帝国总览自动平滑折叠，滚回顶部自动展开 (`71b9606`)
- [office] 传送带 tooltip 信息增强 + 字体放大优化 (`c6d2d87`)
- [office] 路线A邻接加成、科技互斥、新建筑、产出地图 (`7856fb0`)

### ⚡ 性能优化
- [office] renderGrid 增量渲染 + 事件委托，CSS 变量优化，FLOW_MAP 补全 (`d2f2f3d`)

### 🎨 视觉调整
- [office] UI 箭头图标更新 + 字体平衡调整 (`f26210b`)

---

## v0.2.0 — 传送带系统 & 排行榜修复

### ✨ 新功能
- [home] 添加资源阻塞视觉提示 (`6995439`)
- [home] 传送带按钮在有阻塞建筑时变红提示 (`b604803`)

### 🐛 修复
- [home] 传送带判定改为验证合法供给关系 (`4ac590d`)
- [home] 修复新建筑无传送带仍产出资源的 bug (`73f45e0`)
- [home] 修复排行榜提交网络同步错误 (`2224d57`)

### 🔧 其他
- [home] 修复五项主要短板 (`d788057`)

---

## v0.1.0 — 基础系统搭建 & 社交功能

### ✨ 新功能
- [home] Supabase 在线排行榜系统 (`0922ddd`)
- [home] 右侧面板 Top 3 迷你排行榜 (`d7b3c3d`)
- [home] 游戏修改建议栏（Supabase 同步）+ 闪动动画 (`0e2b6bc`)
- [home] 动态填充培养皿：根据屏幕自动计算格子数量 (`e159d01`)
- [home] 支持非正方形网格，宽屏不再左右留白 (`415adbc`)
- [home] hover tooltip 显示格子详细参数 (`d0a4e78`)

### 🎨 视觉调整
- [home] 培养皿荧光边框、资源发光层级、按钮区分、传送带方向着色 (`3514b46`)
- [home] 进化条件改为横向标签排布 + 作者署名 (`69455a2`)
- [home] 格子尺寸多次调整优化 (`58c32e5`, `bcd9448`, `94d36d6`)
- [home] 建议栏图标闪动亮度微调 (`afb3f3f`, `bf42488`)

### 🐛 修复
- [home] 修复宽屏下培养皿格子重叠问题 (`3031f88`, `86bb6fd`, `0aee759`)
- [home] 添加版本号防止浏览器缓存旧 JS (`1989b5c`)

---

## v0.0.1 — 初始版本

- [home] 微生物帝国游戏初始发布 (`a6dbb60`)
