---
name: scenecraft-dev
description: >
  SceneCraft（场景工坊）工具套件的开发规范 Skill。包含 Unity 编辑器工具 UI/UX 偏好、
  SceneCraft 专属代码规范、架构速查、已知问题台账等。当开发或修改 SceneCraft 代码时加载此 Skill。
  前置依赖：hermanlei-conventions 必须已加载。[归属:项目(15hb)]
  This skill should be used when developing, modifying, or refactoring SceneCraft editor tool code,
  including EditorWindow development, IMGUI UI work, and SceneCraft architecture changes.
---

# SceneCraft 开发规范

> **定位**：SceneCraft（场景工坊）工具套件的**开发规范**——编码标准、架构约定、UI 偏好、共享类清单等。
> **与 scenecraft-agent 的区别**：scenecraft-agent 是「怎么使用 SceneCraft」的操作指南；本 Skill 是「怎么开发 SceneCraft」的代码规范。
> **前置依赖**：本 Skill 假定 `hermanlei-conventions` 已加载。如果没有，先加载它。
> **从 hermanlei-conventions 拆分**：2026-04-11，原第二章（编辑器工具偏好）+ 第八章（SceneCraft 专属规范）+ 4 个 reference 文件。

---

## 一、项目基本信息

- **开发路径**：WorkBuddy workspace 中开发
- **同步目标**：`G:\Project_15hb\client\unity\Assets\ArtOnly\SceneCraft\Editor\`
- **命名空间**：`SceneCraftKit`
- **主类**：`SceneCraftWindow`
- **PREFS_PREFIX**：保持旧的 `"PrefabMaster_"` 前缀（向后兼容）
- **文件数量**：29 个 .cs 文件，约 30,000+ 行
- **技术栈**：Unity IMGUI 编辑器扩展

---

## 二、Unity 编辑器工具开发偏好

> 原 hermanlei-conventions 第二章，适用于所有 Unity 编辑器工具开发（不限 SceneCraft）。

### UI/UX 原则

| 原则 | 说明 |
|------|------|
| **文字优于图标** | UI 中使用文字标签，不用 emoji/图标。用户明确要求 emoji 时除外 |
| **颜色要可区分** | 相邻状态的颜色必须有明显区分度，避免灰色和浅色混淆。需要特别注意：需关 Unity 的项目用紫色 `(0.7, 0.5, 1.0)` 而非灰色 |
| **不在 OnGUI 执行阻塞操作** | 绝不在 `OnGUI()` / `OnInspectorGUI()` 中自动执行外部进程、网络请求或耗时命令。这类操作必须由用户点击按钮手动触发 |
| **输入框可编辑+预设下拉** | 配置项（如服务器地址、路径）提供可编辑输入框 + ▼ 下拉预设菜单，兼顾灵活性和便利性 |
| **错误重试不限次数** | 密码输入、连接重试等场景，错误后继续弹框让用户重试，只有用户点「取消」才退出。不要自动放弃 |
| **颜色图例固定可见** | 列表上方的颜色图例条使用 ■ 方块 + 实际颜色 + 文字说明，固定不随滚动消失 |
| **子节点继承父节点样式** | 树形结构中，子节点应继承父节点的颜色/样式标记（如 `parentIsArt` 参数传递） |
| **耗时操作加提示** | 点击后需要等待的按钮，旁边加"点击后请耐心等待"文字提示 |
| **首次操作加说明** | 首次使用的检测/连接按钮，附加详细说明文字，降低用户困惑 |

### 代码组织原则

- 初始状态使用特殊值（如 `-2` 表示"从未检测"），与正常状态值 `0`/`1` 区分
- 环境变量检测结果要缓存（如 `_p4EnvScanned`），避免每帧重复执行
- EditorPrefs 保存用户配置时，PREFS_PREFIX 保持旧前缀以向后兼容
- 工具自身的文件在列表中自动过滤（如过滤 `/SceneCraft/` 路径）
- 路径探测采用多级回退：缓存 → EditorPrefs → 内嵌 → PATH → 常见路径

### 单文件工具的务实态度

对于 Editor 工具类，如果功能内聚且团队只有少数人维护，**单文件大类是可接受的**（如 5000+ 行的 EditorWindow）。不要为了"架构正确"强行拆分导致维护成本增加。但要保持良好的 `#region` 分区和注释。

### 编辑器 UI 技术选型（IMGUI vs UI Toolkit）

| 场景 | 推荐 | 理由 |
|------|------|------|
| **维护现有工具**（SceneCraft 等） | IMGUI | 15000+ 行 IMGUI 代码，迁移成本远大于收益。IMGUI 不会被废弃 |
| **从零开始的新工具** | **优先评估 UI Toolkit** | 数据绑定、UXML/USS 分离布局与逻辑、热重载样式，长期维护更省力 |
| **快速原型 / 一次性小工具** | IMGUI | 上手快，不需要建 UXML/USS 文件，几十行搞定 |

> **不强制迁移**。这是建议而非铁律。选哪个取决于工具的预期寿命和复杂度。
> 如果新工具预期会长期维护且 UI 复杂（多页签、列表、拖拽），UI Toolkit 的投资会回本。
> 如果只是写个小脚本弹个窗口，IMGUI 依然是最快的路。

### 详细 UI 规则（按需查阅）

> 以下详细规则在 `references/editor-ui-detailed-rules.md`，包含：
> - UI 排版布局规则（Toolbar/HelpBox/Foldout/ScrollView/页签）
> - 颜色编码系统（完整颜色表 + 历史教训）
> - 分步引导 UI（Step Wizard）模式
> - 列表/树形展示规则
> - 连接/登录流程设计（零配置理念）
> - 按钮交互模式（一键排除/内联下拉/耗时等待提示等）
> - Workspace 选择 UI

---

## 三、SceneCraft 专属规范

> 以下规则仅在开发 SceneCraft（场景工坊）及类似 Unity 编辑器工具时适用。

### ⚠️ 铁律：先读速查文档，禁止遍历源码

> **这是 SceneCraft 开发的第一条规则，优先级最高。**

1. **任何 SceneCraft 相关任务开始前，第一步必须读** `references/scenecraft-architecture.md`（架构速查文档）
2. **通过速查文档定位到具体的 1~3 个文件**，然后只读这几个文件
3. **绝对禁止** 用 `search_file` / `list_dir` 遍历 SceneCraft 全部 28 个 .cs 文件来"了解项目结构"——速查文档就是干这个的
4. **新功能开发时**，先在速查文档中查"快速定位指南"确认代码放哪、改哪，再动手
5. **速查文档过时了怎么办**？如果发现实际文件与文档不符，先完成当前任务，任务结束后更新速查文档

违反此规则 = 浪费用户 token + 浪费时间。没有例外。

### ⚠️ 铁律：改完代码必须同步文档

> **用户经常忘记更新文档，所以这是 AI 的责任，每次改完代码后必须主动执行。**

**触发条件**（满足任意一条就触发）：
- 新增了 .cs 文件
- 删除或重命名了 .cs 文件
- 给现有类新增了重要的公共方法或字段
- 修改了类的职责范围（比如把一个功能从 A 文件搬到 B 文件）
- 新增了共享类 / 工具类
- 新增了配置项、枚举、数据类型

**必须做的事**：
1. **更新架构速查文档** `references/scenecraft-architecture.md` — 加入新文件的类声明、核心方法、依赖关系；或更新已有文件的描述
2. **如果涉及新的共享类或代码组织规则变化**，更新本 Skill 文档中的相关章节（3.1 共享类清单、3.2 新代码放哪里等）
3. **主动问用户**："这次改动要不要更新到架构速查文档里？" — 即使你觉得不需要，也问一句，因为用户自己可能记不住

**时机**：在当前任务的代码改动全部完成、验证通过后，作为收尾步骤执行。不要等到下次任务才想起来。

### 3.1 共享类清单（新功能优先查这些）

| 共享类 | 职责 | 什么时候用 |
|--------|------|-----------|
| `P4AssetHelper.cs` | 所有 P4 操作（edit/add/delete/rename/revert） | 任何 P4 相关功能 |
| `SceneCraftStyles.cs` | 所有 UI 颜色和 GUIStyle | 任何 UI 绘制 |
| `SceneCraftData.cs` | 所有数据类型（枚举/结构体/常量） | 新增数据类型 |
| `SceneCraftSettings.cs` | 所有配置项读写（ScriptableObject） | 新增配置项 |

### 3.2 新增代码放哪里

| 场景 | 放哪 | 示例 |
|------|------|------|
| 主窗口的新页签/新功能 | 新建 `SceneCraftWindow.XXX.cs`（partial class） | 加个"资源统计"功能 → `SceneCraftWindow.Stats.cs` |
| 独立弹窗工具 | 新建独立 `XXXWindow.cs` 文件 | 新的检查工具 → `TextureChecker.cs` |
| 新的数据类型/枚举 | 加到 `SceneCraftData.cs` | 新增一个状态枚举 |
| 新的 UI 样式/颜色 | 加到 `SceneCraftStyles.cs` | 新增一种高亮色 |
| 新的配置项 | 加到 `SceneCraftSettings.cs` | 新增一个路径配置 |
| 多个工具共用的 P4 方法 | 加到 `P4AssetHelper.cs` | 新增 `P4Shelve()` |
| 只有一个工具用的辅助方法 | 放在该工具自己的文件里 | `P4SubmitChecker` 内部的辅助方法 |

### ⚠️ 铁律：新工具入口统一在 Hub 注册

> **所有新增工具 / 独立工具的入口统一在 SceneCraftHub 的 `EnsureHubToolsRegistered()` 中注册卡片。**

1. **绝不在 `Tools/SceneCraft/` 下注册子 MenuItem** — `Tools/SceneCraft` 是场景工坊主入口（快捷键 `%#p`），一旦有子菜单就会变成子菜单展开，导致主入口按钮失效
2. 新工具在 `_hubTools.Add(...)` 中注册卡片（名称 + 描述 + 打开方法）
3. `SceneCraft/` 顶级菜单下的 MenuItem（如场景效果切换、快速切换阶段）**不影响** `Tools/SceneCraft`，可以继续用
4. 外部工具注册需 hermanlei 审核、author 必填、文件放 `External/` 子目录（详见 Hub.cs 底部注释）

### 3.3 详细开发细则（按需查阅）

> 以下详细规则在 `references/scenecraft-dev-rules.md`，包含：
> - 体量限制（partial ≤ 2000 行，独立工具 ≤ 3000 行）
> - 编辑器 UI 错误展示规范
> - #region 组织规则
> - 修改代码的额外检查项
> - 新功能 Checklist
> - 代码预审工作流（L1/L2/L3 三层机制）
> - 已知问题台账维护规则
> - SceneCraft 专属踩坑记录

---

## 相关 Skill 交叉引用

| 场景 | 应加载的 Skill | 说明 |
|------|--------------|------|
| 用户要**使用** SceneCraft（查场景/查P4/分析报告） | `scenecraft-agent` | 操作指南，与本 Skill 互补 |
| 任务涉及渲染/Shader/材质/APV | `unity-rendering` | SceneCraft 的 SceneLightManager 涉及光照管理 |
| Unity 代码开发/调试，查踩坑记录 | `unity-knowledge-guardian` | 提供 SceneCraft 相关的 P4/编辑器踩坑主动提醒 |
| 通用铁律/编码规范/路由表 | `hermanlei-conventions` | 本 Skill 的前置依赖 |

---

## 参考文档

- **SceneCraft 架构速查**：`references/scenecraft-architecture.md` — 29 个 .cs 文件的完整架构文档（类声明、核心方法、字段、依赖关系、快速定位指南）。**修改 SceneCraft 代码前必读此文档**
- **SceneCraft 已知问题台账**：`references/scenecraft-known-issues.md` — 代码预审发现的所有问题。**改代码前查对应文件章节**
- **SceneCraft 开发细则**：`references/scenecraft-dev-rules.md` — 体量限制、预审工作流、踩坑记录
- **编辑器 UI 详细规则**：`references/editor-ui-detailed-rules.md` — UI 排版、颜色编码、交互模式、闭环流程详细步骤
