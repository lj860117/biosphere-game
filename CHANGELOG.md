# Changelog — 微生物帝国 (Biosphere Game)

> 提交标记：`[office]` = 公司电脑 · `[home]` = 家里电脑

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
