# Changelog — 微生物帝国 (Biosphere Game)

> 提交标记：`[office]` = 公司电脑 · `[home]` = 家里电脑

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
