# hermanlei-conventions 架构指南

> **用途**：首次接触此 Skill 的 AI/维护者，读本文件即可建立完整上下文，无需通读 1200 行 SKILL.md
> **类型**：🏗️ 架构速查
> **维护规则**：SKILL.md 章节结构变更或 references 增删时更新
> **最后更新**：2026-04-11
> **保鲜周期**：每次 SKILL.md 结构变更时

---

## 一句话定位

厉害了哥（hermanlei）的个人开发规范**路由中枢** —— 管路由、管通用底线、管自我进化。
具体业务知识归各领域子 Skill，这里只管：通用安全底线（铁律）、通用编码规范、Skill 路由分发、自我进化机制。

---

## Skill 体系总览（Hub-Spoke 模式，2026-04-11 更新）

```
hermanlei-conventions          ← 🔧 中枢：铁律 + 通用编码规范 + 路由表 + 成长引擎
  ├── scenecraft-dev           ← 📦 子 Skill：编辑器工具偏好 + SceneCraft 开发规范
  ├── scenecraft-agent         ← 📦 子 Skill：SceneCraft 使用/操作指南（看代码走 dev，用工具走 agent）
  ├── unity-rendering          ← 🎨 子 Skill：渲染知识索引 + 材质风格化 + TCRender/APV
  └── unity-knowledge-guardian ← 🧠 子 Skill：项目知识守护者 — pitfalls/features/bugs + 主动提醒
```

**加载依赖链**：
- `scenecraft-dev` → 前置依赖 `hermanlei-conventions`
- `scenecraft-agent` → 前置依赖 `hermanlei-conventions`
- `unity-rendering` → 前置依赖 `hermanlei-conventions`
- `unity-knowledge-guardian` → 前置依赖 `hermanlei-conventions`
- 中枢 Skill 路由表自动路由到子 Skill，使用者无需手动管理

---

## 文件结构

### hermanlei-conventions（中枢）

```
hermanlei-conventions/
├── SKILL.md                    # 主文件（~1210 行）── 规则层
└── references/                 # 知识工具箱（6 个保留文档 + 6 个待清理副本）
    ├── README.md               # 📋 本目录管理规范
    ├── ARCHITECTURE.md         # 🏗️ 本文件
    ├── project-context.md      # 📋 项目路径/版本/技术栈
    ├── tech-radar.md           # 🔭 跨领域调研总索引
    ├── terrain-pcg-knowledge-index.md   # 📖 地形/PCG 索引
    ├── gamedev-knowledge-index.md       # 📖 游戏开发索引
    │
    │   ⚠️ 以下为已迁移到子 Skill 的副本（待清理，截止日期：2026-04-25）
    ├── editor-ui-detailed-rules.md      # → scenecraft-dev/references/
    ├── scenecraft-architecture.md       # → scenecraft-dev/references/
    ├── scenecraft-dev-rules.md          # → scenecraft-dev/references/
    ├── scenecraft-known-issues.md       # → scenecraft-dev/references/
    ├── rendering-knowledge-index.md     # → unity-rendering/references/
    └── material-stylization-knowledge-index.md  # → unity-rendering/references/
```

### scenecraft-dev（子 Skill — SceneCraft 开发规范）

```
scenecraft-dev/
├── SKILL.md                    # 主文件 — 编辑器工具偏好 + SceneCraft 专属规范
└── references/
    ├── editor-ui-detailed-rules.md      # 📋 编辑器 UI 排版/颜色/交互详细规则
    ├── scenecraft-architecture.md       # 🏗️ SceneCraft 29 个 .cs 文件架构速查
    ├── scenecraft-dev-rules.md          # 📋 体量限制/预审工作流/踩坑记录
    └── scenecraft-known-issues.md       # 🐛 代码预审问题台账
```

### scenecraft-agent（子 Skill — SceneCraft 操作指南）

```
scenecraft-agent/
├── SKILL.md                    # 主文件 — 口令系统/报告分析/能力边界
└── references/
    └── check-rules.md          # 检查规则详细说明
```

### unity-rendering（子 Skill — 渲染知识）

```
unity-rendering/
├── SKILL.md                    # 主文件 — TCRender/APV 要点 + 知识索引入口
└── references/
    ├── rendering-knowledge-index.md     # 📖 渲染前沿知识索引
    └── material-stylization-knowledge-index.md  # 📖 材质风格化索引
```

### unity-knowledge-guardian（子 Skill — 项目知识守护者）

```
unity-knowledge-guardian/
├── SKILL.md                    # 主文件 — 三大职能 + 加载规则 + 格式规范 + 协作
└── references/
    ├── pitfalls.md              # 🔥 踩坑记录库（APV/P4/编辑器工具/Shader/大世界）
    ├── features-log.md          # 📋 功能变更记录
    ├── bug-tracker.md           # 🐛 Bug 追踪
    ├── context-triggers.md      # 🔔 上下文触发表（关键词→提醒映射）
    └── research-index.md        # 🔍 调研成果总索引（所有月度/专题调研的入口）
```

---

## SKILL.md 章节地图（2026-04-11 拆分后）

> **想改什么 → 查这张表 → 直接定位章节**

| 章节 | 标题 | 温度 | 能不能改 | 一句话概要 | 备注 |
|------|------|------|----------|-----------|------|
| 元规范 | Skill 使用手册 | — | ⚠️ 慎改 | 内容地图、温度分级、AI 行为准则、跨平台可移植性 | |
| 零 | 工具开发闭环流程 | 🟡 | 可优化步骤，不可删步骤 | 8 步闭环 + 任务分级（🟢轻/🟡标/🔴重） | |
| 一 | 代码重构铁律 | 🔴 | ⛔ 修改须用户确认+说明原因 | 十条铁律 + 备份检查单 + 安全重构四件套 + 技术债管理 | |
| 二 | 编辑器工具开发偏好 | 🟡 | — | 📦 **已拆分到 `scenecraft-dev` 第二章** | 原位只留路由指引 |
| 三 | 功能模块间接口设计 | 🟡 | ✅ 可增补 | 共享工具类、模块间通信、向后兼容 | |
| 四 | Git 版本管理规范 | ⚪ | ✅ 可改 | commit 格式、tag 规范、PowerShell 注意事项 | |
| 五 | P4 工作流 | ⚪ | ✅ 可改 | P4 操作规范、Unity+P4 集成注意 | |
| 六 | 项目特定约定 | ⚪/🟡 | ✅ 可增补项目 | 项目识别索引 + Skill 路由表 + 成长引擎 + **拆分验收清单** | |
| 七 | 通用 C# 编码规范 | 🟡 | ✅ 可增补 | DRY、体量控制、命名、错误处理、Unity 通用、踩坑记录、游戏规范 | |
| 八 | SceneCraft 专属规范 | 🟡/🔴 | — | 📦 **已拆分到 `scenecraft-dev` 第三章** | 原位只留路由指引 |
| 九 | 沟通风格偏好 | ⚪ | ✅ 可改 | 直接高效、中文为主、偶尔皮一下 | |

---

## 修改规则速查

| 修改级别 | 什么算 | 需要用户确认？ | 需要 Git 同步？ |
|----------|--------|---------------|----------------|
| **S 级** | 修改/删除 🔴 铁律 | ✅ 必须 + 说明原因 | ✅ 立即 |
| **A 级** | 新增/修改 🟡 规范、闭环流程 | ✅ 必须 | ✅ 会话结束时 |
| **B 级** | 更新 🟢 知识索引、新增 references | ⚠️ 告知即可 | ✅ 积累 2-3 个后统一 |
| **C 级** | 更新 ⚪ 路径/约定、修 typo | ❌ 不需要 | ✅ 顺带同步 |

**结构冻结规则**：
- 章节编号（零~九）和顺序**不轻易变动**
- 新内容优先在现有章节内追加小节
- 需要新章节时编号追加在最后（如「十」）

---

## 温度体系（四层分级）

| 温度 | 标签 | AI 态度 | 更新节奏 |
|------|------|---------|----------|
| 🔥 烫 | 🔴 铁律 | **绝对不能违反** | 踩坑后才更新 |
| 🌡️ 暖 | 🟡 规范 | **应该遵守** | 发现更好实践时 |
| 🧊 凉 | 🟢 知识 | **按需参考** | 每月调研 |
| 💨 冷 | ⚪ 约定 | **照做就行** | 项目变化时 |

升温路径：🟢→🟡（3 次验证有效）→🔴（违反后造成事故）

---

## 成长引擎（三个定期机制）

| 机制 | 频率 | 做什么 |
|------|------|--------|
| 每周巡检 | 周一 14:30 | 路由表检查、路径有效性、休眠领域检测、分拆信号检查 |
| 前沿调研 | 每月/按领域 | 搜索各领域新技术，分三级（⭐采纳/👀关注/ℹ️了解），写入知识索引 |
| 沟通模式沉淀 | 每次对话后 | 发现新的用户决策模式/偏好 → 更新六章沟通模式表 |

---

## 分拆触发条件（满足 2 条以上 → 该拆了）

1. SKILL.md > 1300 行
2. references/ > 10 个文件
3. 内容地图 3+ 个互不相关领域
4. 某领域专属内容 > 总量 40%
5. 同时维护 2+ 个技术栈差异大的项目
6. token 消耗影响正常工作

**拆分方向**（2026-04-11 现状）：
```
hermanlei-conventions        ← 核心：铁律 + 通用编码规范 + 成长引擎 + 元规范 + 路由表
scenecraft-dev               ← ✅ 已拆分：编辑器工具偏好 + SceneCraft 开发规范 + 4 个 references
scenecraft-agent             ← ✅ 已拆分：SceneCraft 使用/操作指南 + 口令系统 + 报告分析
unity-rendering              ← ✅ 已拆分：渲染知识索引 + 材质风格化 + TCRender/APV
hermanlei-gamedev            ← 预留：游戏架构规范 + biosphere-game 约定（需求驱动）
```

---

## 快速决策树（拿到任务后）

```
收到任务
  ├── 判断是哪个项目？→ 看六章「项目识别索引」
  ├── 需要加载子 Skill 吗？→ 看六章「Skill 自动路由规则」
  │     ├── SceneCraft 操作/检查 → use_skill("scenecraft-agent")
  │     ├── SceneCraft 开发/改代码 → use_skill("scenecraft-dev")
  │     ├── 渲染/Shader/材质 → use_skill("unity-rendering")
  │     ├── Unity 代码开发/修改/调试 → use_skill("unity-knowledge-guardian")
  │     └── 其他领域 → 查路由表
  ├── 任务分级？→ 看零章（🟢轻/🟡标/🔴重）
  ├── 涉及重构？→ 必读一章（铁律 + 备份检查单）
  ├── 涉及 SceneCraft 代码？→ 加载 scenecraft-dev 后读其 references/scenecraft-architecture.md
  └── 涉及渲染/材质/地形/游戏？→ 加载对应子 Skill 后读其 references/
```

---

> **本文件的使命**：让任何 AI、任何会话，花 1 分钟读完就能上手维护这个 Skill。
> 如果你发现本文件与 SKILL.md 实际内容不符，**以 SKILL.md 为准**，然后更新本文件。
