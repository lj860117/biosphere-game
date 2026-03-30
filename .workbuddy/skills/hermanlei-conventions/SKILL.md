---
name: hermanlei-conventions
description: >
  厉害了哥（hermanlei）的个人开发习惯、代码规范和工作流约定。
  hermanlei 主要从事 Unity 编辑器工具开发和渲染方向的工作。
  涵盖代码重构纪律、Unity 编辑器工具开发偏好（UI排版布局、颜色编码、分步引导、
  列表/树形展示、连接/登录流程、按钮交互模式）、功能模块间接口设计、
  Git 版本管理规范、P4 工作流、以及 UI/UX 设计原则。
  当为 hermanlei 编写代码、做重构、开发 Unity 工具、开发渲染/Shader 相关功能、
  或管理版本控制时，必须遵守这些约定。
  This skill should be used when working on any coding task, code review,
  refactoring, Unity editor tool development, rendering/shader development,
  or version control operations for hermanlei's projects.
---

# 厉害了哥的开发约定 (hermanlei-conventions)

本 Skill 定义了 hermanlei（厉害了哥）在日常开发中积累的核心习惯和偏好。
所有协助 hermanlei 的工作都必须遵守这些约定，它们来自真实项目中的血泪教训。

## 适用范围

hermanlei 当前的主要工作方向：

- **Unity 编辑器工具开发** — 自定义 EditorWindow、PropertyDrawer、AssetPostprocessor 等，代表作品为 SceneCraft（场景工坊）工具套件
- **渲染方向** — 图形渲染管线、Shader 开发、材质系统、渲染优化
- **P4 (Perforce) 集成** — 在 Unity 编辑器内集成 P4 版本控制操作

本约定中的 UI 设计偏好、按钮交互模式、颜色编码等规则，均来自上述方向的实际开发经验。
**当协助 hermanlei 开发相关工具时，必须加载并遵守本 Skill。**

---

## 一、代码重构铁律

> **2026-03-27 血的教训**：用 PowerShell 正则脚本自动替换 GUIStyle 变量名 `s`，
> `\b` 匹配短变量名导致正则表达式、字符串字面量、函数参数被全局污染，
> 7+ 个文件严重损坏，被迫 P4 全量回滚。

### 六条铁律（不可违反）

1. **绝不用正则做 C# 批量重构** — `\b` 匹配短变量名会污染正则表达式、字符串字面量、函数参数。只用手工逐文件替换或 AST 感知工具。
2. **改代码前先确认可回滚** — P4 项目没有 git，改之前必须告诉用户"我要改这些文件"，让用户确认有回滚手段。
3. **改完一个文件立即验证** — 不要攒一堆改动最后才发现炸了。做一个验一个。
4. **出了问题不要硬修** — 超过 2 轮修不好就停下来，告诉用户需要回滚哪些文件，让用户操作。不要越修越烂。
5. **linter ≠ 编译器** — VSCode/OmniSharp 说零错误不等于 Unity 能编译通过。不要以 linter 结果作为"修好了"的依据。
6. **不写 PowerShell/Bash 脚本做代码变换** — 这不是文本替换，是代码变换，需要理解语法树。

### 重构前备份检查单（每次重构开始前必须执行）

开始任何涉及多文件修改的重构前，按以下顺序执行：

1. 列出即将修改的所有文件清单
2. 提醒用户："这些文件即将被修改，请确认已有备份/回滚手段（P4 shelve、.bak 文件、或其他方式）"
3. 等用户明确确认后再动手
4. 如果是 P4 项目，提醒用户先 Checkout 相关文件

未经用户确认，**禁止**开始修改文件。

---

## 二、Unity 编辑器工具开发偏好

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

### UI 排版布局规则

| 规则 | 说明 |
|------|------|
| **Toolbar 固定顶部** | 工具栏（按钮行、颜色图例条）固定在窗口/区域顶部，不随 ScrollView 滚动消失 |
| **功能区用 HelpBox 包裹** | 逻辑上独立的功能块用 `EditorStyles.helpBox` 背景包裹，视觉分隔清晰 |
| **Foldout 分组折叠** | 多个功能模块使用 Foldout 折叠分组，默认展开核心功能、折叠次要功能 |
| **列表区用 ScrollView** | 文件列表、检测结果等可变长内容必须包在 `EditorGUILayout.BeginScrollView` 中 |
| **状态信息内联显示** | 连接状态、用户名等关键信息直接显示在相关控件旁（如 "✅ P4 已连接 (用户名@workspace名)"），不要单独弹窗 |
| **页签分离大功能** | 功能差异大的模块用页签（Tab）分离（如"提交预检" vs "版本管理"），不要挤在一个长页面 |
| **输入框+下拉预设并排** | 可编辑输入框右侧紧贴 ▼ 下拉按钮，点击展开预设列表（如服务器地址预设） |

### 颜色编码系统

预览列表等场景中的颜色图例使用 **■ 方块 + 实际颜色 + 文字说明** 的格式：

| 颜色 | 用途 | 备注 |
|------|------|------|
| **美术场景色**（自定义） | `scene_making/scenes` 下的美术场景文件 | ART_FOCUS_FOLDERS 只限核心场景目录 |
| **绿色** | 其他美术资源（非场景的美术目录文件） | ART_FOCUS_FOLDERS 缩小后，其余美术用绿色 |
| **冲突色**（自定义） | 有冲突的文件 | |
| **上次跳过色**（自定义） | 上次同步时被跳过的文件 | |
| **紫色** `(0.7, 0.5, 1.0)` | 需关 Unity 才能同步的文件/文件夹 | ❗ 不用灰色，避免和普通灰色混淆 |
| **非美术新增色**（自定义） | 非美术目录的新增文件 | |
| **黄色**（文字色） | 非场景目录含场景子文件时的提示文字 | 如 "含N个场景更新" |
| **绿色**（高亮背景） | Workspace 选择中自动匹配的 workspace | 绿色高亮 + 一键按钮 |
| **灰色** | Workspace 选择中不匹配的 workspace | 灰色显示但允许强制使用 |

**颜色调整历史教训**：
- 需关 Unity 的项最初用灰色，和普通灰色混淆 → 改为紫色
- 图例最初用纯文字描述 → 改为 ■ 方块 + 实际颜色，直观

### 分步引导 UI（Step Wizard）模式

适用于需要多步骤初始化/连接的场景（如 P4 连接引导）：

1. **每步独立状态** — 每个 Step 有自己的检测状态变量（如 `_p4ExeFound`、`_p4EnvScanned`、`_p4LoginState`）
2. **初始状态用特殊值** — 用 `-2` 表示"从未检测"，区别于 `0`（检测失败）和 `1`（检测成功），避免 OnGUI 误触发
3. **步骤间有依赖** — Step 2 依赖 Step 1 通过，Step 3 依赖 Step 2 通过，未通过的步骤不展示后续内容
4. **每步有独立按钮+结果显示** — 检测按钮 + 检测结果（成功/失败 + 详细信息）+ 修复操作按钮
5. **检测结果要缓存** — 如 `_p4EnvScanned` 防止每帧重复执行耗时操作
6. **重置时全链路同步** — 重置某步状态时，必须同步重置其依赖的缓存标记（如 `_p4LoginState = 0` 时同步重置 `_p4EnvScanned`）

### 列表/树形展示规则

| 规则 | 说明 |
|------|------|
| **颜色图例固定顶部** | 图例条在 ScrollView 外面，不随列表滚动 |
| **子节点继承父节点样式** | 树形结构中子节点继承父节点颜色标记（通过 `parentIsArt` 等参数传递） |
| **工具自身文件自动过滤** | 列表中自动过滤掉工具自己的文件（如过滤 `/SceneCraft/` 路径的条目） |
| **非叶子节点含特定子项加提示** | 非场景目录如果包含场景子文件，加黄色 "含N个场景更新" 提示 |
| **ART_FOCUS_FOLDERS 要精确** | 焦点目录只限核心目录（如 `scene_making/scenes`），不要范围过大 |
| **需关 Unity 的文件夹列表可扩展** | `Settings`、`scripts_dll` 等需关 Unity 同步的目录应维护在可配置列表中 |

### 连接/登录流程设计

**零配置理念**：用户打开工具应该尽可能不需要手动输入任何配置。

| 阶段 | 设计 |
|------|------|
| **探测可执行文件** | 多级回退：缓存 → EditorPrefs → 内嵌文件 → PATH 环境变量 → 同类进程探测 → 常见安装路径 |
| **读取环境配置** | 自动从 `p4 set` 命令输出 + Windows 注册表读取配置值，缺失时自动补全 |
| **默认值填充** | 无配置时，服务器地址自动填公司主服务器（如 `192.168.31.15:1667`），不留空 |
| **输入框可编辑** | 自动探测到的值显示在**可编辑**输入框中，允许用户手动修改 |
| **密码登录** | Unity 内直接弹密码输入框，通过 `Process.StandardInput.WriteLine(password)` 喂给 `p4 login`，不需要开命令行 |
| **回车确认** | 密码输入框支持回车键直接提交 |
| **ticket 过期** | 自动弹 `EditorInputDialog` 密码框，支持回车确认，至少 3 次重试机会 |
| **完全零配置** | 提供服务器地址 + 用户名 + 密码三合一界面，一键"配置并登录" |

### 按钮交互模式

| 模式 | 说明 | 示例 |
|------|------|------|
| **一键排除** | 一个按钮同时排除多种危险/不可操作项 | 「仅安全」同时排除冲突文件 + 需关 Unity 文件夹 |
| **内联下拉** | 状态行旁附带下拉按钮，不跳转页面 | 已连接状态行的「切换分支」下拉、P4PORT 的 ▼ 服务器预设 |
| **状态行内联信息** | 连接成功后在同一行显示关键上下文 | "✅ P4 已连接 (用户名@workspace名)" |
| **首次操作加说明** | 用户从未执行过的操作按钮附加详细说明文字 | 首次检测 P4 连接按钮下方的说明文字 |
| **耗时操作加等待提示** | 执行后需等待的按钮旁标注提示 | 预览更新按钮旁 "点击后请耐心等待" |
| **一键自动修复** | 检测到问题时提供一键修复，不让用户手动执行命令 | Workspace 不匹配 → 扫描 + 一键 ApplyWorkspace |
| **匹配高亮 + 强制可用** | 自动匹配项绿色高亮 + 一键确认；不匹配项灰色但仍可强制使用 | Workspace 选择列表 |

### Workspace 选择 UI

- 显示 **stream 分支名**和**描述信息**，支持多分支开发场景
- 自动匹配的 workspace 绿色高亮 + 一键应用按钮
- 不匹配的灰色显示，但允许强制使用（别拦死用户）
- 状态行加「切换分支」下拉按钮和「刷新」按钮

---

## 三、功能模块间接口设计

### 共享工具类

- 多个编辑器工具共用的功能（如 `GetP4ExePath()`）抽到共享工具类（如 `P4Helper`）
- 共享方法修改时，**所有调用方必须同步更新**（如 `P4AssetHelper` 和 `P4SubmitChecker` 同步更新 `GetP4ExePath()`）
- 共享类以 `static` 方法或单例提供，不要每个工具各自实现一份

### 模块间通信

- 模块间**不直接引用彼此的实例**，通过以下方式解耦：
  - **EditorPrefs**：用统一的 `PREFS_PREFIX` 存取配置（如 `"PrefabMaster_P4Port"`）
  - **共享工具类**：公共方法作为桥接
  - **事件/回调**：需要实时通知时用 `System.Action` 回调，不用轮询
- EditorPrefs key 命名规范：`{PREFS_PREFIX}{模块名}_{配置项}`

### 向后兼容

- `PREFS_PREFIX` 和 `TRACEABILITY_PREFIX` 保持旧前缀（如 `"PrefabMaster_"`），即使工具已改名
- 改名时不迁移旧配置，直接兼容读取

---

## 四、Git 版本管理规范

### Commit 消息格式

```
[office/home] 类型: 简短描述
```

- **公司电脑**（leijiang / hermanlei@tencent.com）：`[office]` 前缀
- **家里电脑**（lj860117）：`[home]` 前缀
- **类型**：`feat` / `fix` / `perf` / `style` / `refactor` / `docs`

示例：
```
[office] feat: 添加 P4 workspace 自动选择功能
[home] fix: 修复 OnGUI 每帧执行 P4 命令导致卡死
```

### 版本管理

- 阶段性完成时用 `git tag` 打语义化版本号（如 `v1.3.0`）
- 打 tag 前更新项目根目录的 `CHANGELOG.md`
- PowerShell 中 commit 含特殊字符时，用 `-F` 文件方式传递消息（文件需 UTF-8 编码，用 write_to_file 而非 echo）

---

## 五、P4 (Perforce) 工作流

### 操作规范

- P4 项目**没有 git 的撤销能力**，所有修改前必须确认回滚手段
- 批量修改前提醒用户先 `p4 edit`（Checkout）相关文件
- 使用 `p4 -s` (tagged output) 解析命令输出，比纯文本解析更可靠
- P4CLIENT 环境变量经常是错误的（机器名默认值），工具中需要主动检测和修复
- 工具内嵌 `p4.exe` 时，目录名不能用 `~` 后缀（如 `Bin~`），Unity 不生成 .meta 会导致 P4 trigger 报错

### Unity + P4 集成注意

- P4V 的 workspace 配置和 `p4` 命令行用的 P4CLIENT 可能不一致
- 通过 `p4 clients -u 用户名` 列出 workspace，按 Root 路径匹配工程
- 密码登录通过 `Process.StandardInput.WriteLine(password)` 喂给 `p4 login`

---

## 六、项目特定约定

### 项目识别索引（AI 匹配规则）

> 用户提到某个功能/bug 时，AI 根据下表的「别名/口语」列匹配项目。**匹配不到任何一行时必须询问用户**，不得猜测。

| 项目 | 别名 / 口语关键词 | 命名空间 | 文件路径特征 | 技术栈 | 适用规范章节 |
|------|-------------------|---------|-------------|--------|-------------|
| SceneCraft | 场景工坊、工具、编辑器工具、SceneCraft | `SceneCraftKit` | `SceneCraft\Editor\` | Unity IMGUI 编辑器扩展 | 七 + 八 |
| biosphere-game | 游戏、小游戏、biosphere | — | `biosphere-game\` | Unity C# 游戏逻辑 | 七 |
| hermanlei-conventions | Skill、规范、约定 | — | `.workbuddy\skills\hermanlei-conventions\` | Markdown 文档 | 四 |

> **以后新增项目时，在此表追加一行即可。**

#### 消歧义交互规则

> **当 AI 无法确定用户说的是哪个项目或模块时，必须用选择框（`ask_followup_question`）让用户点选，而非文字追问。**

**第一层：识别项目**（匹配不到时触发）
- 选项从上表动态生成，末尾固定加一个「其他 / 新项目」

**第二层：识别模块**（确定了项目但不确定具体模块时触发）
- 选项从该项目的架构速查文档（如 `references/scenecraft-architecture.md`）中的模块列表生成
- 如果没有速查文档，用简短文字追问即可

**不需要弹选择的情况**：
- 上下文已经很明确（比如正在连续讨论同一个项目的代码）
- 用户的描述能精确匹配到索引表中的某一行

#### Skill 自动路由规则

> AI 根据用户需求的领域关键词，**自动加载**对应 Skill，无需用户手动指定。
> 多个 Skill 匹配时，按优先级加载（最多同时 2 个）。
> 用户也可以直接说"用 XXX Skill"强制指定。
> **路由表中没有覆盖的领域（标记「待补充」的行）**：必须用选择框询问用户"要不要搜索合适的 Skill"。用户选择搜 → 用 `find-skills` 搜索并推荐；用户选择不搜 → 用当前角色知识直接回答。**不得跳过询问自行判断。**

| 需求领域 | 触发关键词 | 推荐 Skill | 备注 |
|----------|-----------|-----------|------|
| Unity 编辑器工具 IMGUI | EditorWindow, Inspector, IMGUI, 编辑器工具, 自定义面板 | `unity-editor-imgui-design` | 可叠加 `unity-workflows` |
| Unity 编辑器自动化 | 自动化, 批量操作, 菜单脚本 | `unity-workflows` | |
| Unity UI 系统选型 | UI 选型, UGUI 还是 Toolkit, 该用哪个 UI | `unity-ui-selector` | 选完后按结果加载对应 Skill |
| Unity UI Toolkit | UI Toolkit, USS, UXML, VisualElement | `unity-uitoolkit` | |
| Unity 代码架构 / SO | ScriptableObject, 解耦, 事件通道, 架构设计 | _(当前会话已有 Unity架构师角色)_ | 角色自带，无需额外 Skill |
| Unity 场景性能优化 | 性能, draw call, 帧率, 卡顿, batching | `unity-scene-optimizer` | |
| Unity 代码质量 | 代码审查, review, 规范检查, 最佳实践 | `unity-script-validator` | |
| Unity 编译错误修复 | 编译报错, CS0xxx, 红色错误, 编译不过 | `unity-compile-fixer` | |
| Unity 新脚本模板 | 新建脚本, 生成模板, MonoBehaviour 模板 | `unity-template-generator` | |
| Unity 测试 | 单元测试, PlayMode, EditMode, Test Runner | `unity-test-runner` | |
| Unity 关卡/场景设计 | 关卡设计, 地图布局, 场景搭建, 原型 | `level-design-patterns` | 可叠加 `unity-level-design` |
| 游戏设计 / 策划 | 玩法, 机制, 数值, 策划, 系统设计 | `game-developer-skill` | |
| Shader / 渲染 | Shader, 材质, 渲染管线, URP, HDRP | _(待补充，遇到时用 find-skills 搜索)_ | shadergraph-editor 仅限 visionOS |
| 2D / 3D 美术表现 | 美术风格, 动画, 粒子, VFX, 2D 美术 | _(待补充，遇到时用 find-skills 搜索)_ | |
| 后端开发 | 服务器, API, 数据库, 网络, 后端 | _(待补充，遇到时用 find-skills 搜索)_ | |
| Git / GitHub | PR, issue, CI, Actions, GitHub | `github` | |
| 图片生成 | 生成图片, 画一张, 概念图 | `nano-banana-pro` 或 `openai-image-gen` | |

> **维护说明**：安装新 Skill 后，在此表追加对应行。标记「待补充」的行表示该领域尚无专用 Skill，AI 应在用户首次触发时主动搜索推荐。

---

### SceneCraft（场景工坊）

- **开发路径**：WorkBuddy workspace 中开发
- **同步目标**：`G:\Project_15hb\client\unity\Assets\ArtOnly\SceneCraft\Editor\`
- **命名空间**：`SceneCraftKit`
- **主类**：`SceneCraftWindow`
- **PREFS_PREFIX**：保持旧的 `"PrefabMaster_"` 前缀（向后兼容）

### biosphere-game

- 使用上述 Git commit 规范（[office]/[home] 前缀）
- 当前最新 tag：`v1.3.0`（2026-03-22）
- **远程仓库**：`https://github.com/lj860117/biosphere-game.git`（origin/main）
- **仓库内容**：游戏代码 + hermanlei-conventions Skill 副本（`.workbuddy/skills/hermanlei-conventions/`）

#### 快捷指令："更新 git"

> 当用户说 **"更新 git"** / **"同步到 git"** / **"把 Skill 更新到 git"** 时，执行以下流程：

1. **同步 Skill 文件**：将 Skill 源目录（见下表）的所有文件（SKILL.md + references/）复制到 biosphere-game 仓库对应位置，覆盖旧文件
2. **git add** `.workbuddy/skills/hermanlei-conventions/`
3. **git diff --stat** 确认改动范围
4. **git commit -F**（UTF-8 临时文件方式），commit 后删除临时文件
5. 如果 `git push` 失败（远程有新提交），先 `git pull --rebase origin main` 再 push
6. push 成功后报告 commit hash 和变更摘要

**路径对照表**（按电脑选择）：

| | Skill 源目录 | biosphere-game 本地仓库 |
|---|---|---|
| **公司电脑** (office) | `C:\Users\hermanlei\.workbuddy\skills\hermanlei-conventions\` | `C:\Users\hermanlei\WorkBuddy\20260317212750\biosphere-game\` |
| **家里电脑** (home) | _(待补充，clone 后填入)_ | _(待补充，clone 后填入)_ |

> **注意**：家里电脑第一次使用前，需要先 `git clone` biosphere-game 仓库，然后把路径填到上表中。

---

## 七、通用 C# 编码规范（所有项目适用）

> **不管是 SceneCraft 编辑器工具、小游戏、渲染模块还是任何 C# 项目，都必须遵守这些规则。**

### 7.1 不要重复自己（DRY）

- **写新功能前，先检查项目中有没有现成方法可以复用**
- 如果两处代码做的事情超过 80% 相似，必须抽取为共享方法
- 共享方法放在**专门的工具类/Helper 类**中，不要散落在各个业务类里

### 7.2 方法和类的体量控制

- **单个方法** ≤ 50 行（超了就拆成子方法，方法名即注释）
- **单个文件** 新写的尽量 ≤ 500 行（历史遗留的大文件容忍，但新文件别再这么大）
- 如果一个方法需要滚动才能看全——它太长了
- 如果一个类能用"和"来描述它的职责——它该拆了

### 7.3 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 私有字段 | `_camelCase` | `_playerHealth`, `_syncFileList` |
| 公有属性 | `PascalCase` | `Instance`, `Value`, `MaxHealth` |
| 方法 | `PascalCase` | `Initialize()`, `CalculateDamage()` |
| 常量 | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_SPEED` |
| 局部变量 | `camelCase` | `filePath`, `hitCount` |
| 布尔变量 | `is/has/can/should` 前缀 | `_isReady`, `hasPermission` |
| 事件回调 | `On` 前缀 | `OnEnable()`, `OnDamageReceived()` |
| 接口 | `I` 前缀 | `IDamageable`, `ISaveable` |

### 7.4 修改现有代码的规矩

1. **改共享类/工具类时，必须检查所有调用方是否需要同步更新**
2. **改方法签名时，全局搜索该方法名**，确认没有遗漏的调用
3. **删除代码前确认没有其他文件引用**
4. **改完一个文件立即验证**——不要攒一堆改动最后才发现炸了

### 7.5 错误处理 & 防御式编程

**外部进程调用：**
- 所有外部进程调用必须设 **超时**（推荐 30 秒），超时后 Kill 进程并给用户明确提示
- 用 `Process.Start()` 时必须重定向 `StandardOutput` + `StandardError`，两者都要读
- 进程退出码非 0 时，把 stderr 内容展示给用户，不要默默吞掉

**文件和路径：**
- 操作文件前先 `File.Exists()` / `Directory.Exists()` 检查
- 路径拼接用 `Path.Combine()`，不要手拼 `"/" + xxx`
- 从用户输入获取的路径要 `Trim()` 并处理末尾多余的 `/` 或 `\`
- 文件读写包在 `try-catch` 里，catch 中给用户人话提示（不是堆栈信息）

**try-catch 原则：**
- **不要大范围 try-catch 吞异常** — 只包裹可能出错的具体操作（IO、进程、网络）
- catch 中必须做两件事：① 给用户看得懂的错误提示 ② `Debug.LogException(e)` 保留完整堆栈
- **绝不** catch 后空处理（`catch { }`）

### 7.6 注释 & 代码文档规范

**必须写注释的地方：**
- 复杂算法 / 业务逻辑前加注释说明**为什么这样做**（不是做了什么——代码本身说明做了什么）
- Hack / Workaround 必须加 `// HACK:` 或 `// WORKAROUND:` 前缀 + 原因说明
- 魔法数字必须有注释或提取为 `const`
- 公共 API 写 `/// <summary>` XML 注释

**注释语言：**
- **用中文**。这是给 hermanlei 和中文团队看的项目
- XML Summary（`/// <summary>`）也用中文，方便 IDE 悬停提示

**TODO / FIXME 标记：**
- `// TODO:` — 计划要做但还没做的
- `// FIXME:` — 已知有问题需要修的
- `// HACK:` — 临时方案，以后要改的
- 所有标记必须附上**简短说明**，不能光写 `// TODO:`

### 7.7 Unity 通用规范（游戏 + 工具都适用）

> 以下规则适用于所有 Unity C# 代码，不限于编辑器工具。

- **`GetComponent` 结果缓存** — 不要在 Update/OnGUI 中每帧调用 `GetComponent<>()`，在 Awake/OnEnable 中缓存
- **字符串比较用 const** — Tag、Layer、Animator 参数等不要用魔法字符串，提取为 `const` 或 `static readonly`
- **`SerializeField` 优于 public** — 需要在 Inspector 暴露的字段用 `[SerializeField] private`，不要直接 public
- **`EditorUtility.SetDirty()` 不能忘** — 通过脚本修改 ScriptableObject/Asset 后必须调，否则改动不保存
- **避免 `Update()` 里做可以事件驱动的逻辑** — 能用事件/回调/协程的，不要每帧轮询
- **`null` 检查注意 Unity 假 null** — Unity 重写了 `==` 运算符，`Destroy` 后的对象 `== null` 为 true 但 `is null` 为 false。统一用 `== null` 而非 `is null`
- **协程异常不会冒泡** — `StartCoroutine` 中的异常只会停止协程，不会抛到外层。关键协程要自己 try-catch

### 7.8 通用踩坑记录

> 所有项目通用的坑。每次踩坑追加到这里。

| # | 踩坑场景 | 后果 | 正确做法 |
|---|---------|------|---------|
| 1 | 用 PowerShell 正则批量替换 C# 代码 | 文件污染，全量回滚 | 手工逐文件替换，绝不用正则脚本 |
| 2 | PowerShell 中 commit message 含特殊字符 | git commit 失败或乱码 | 用 `-F` 文件方式传递，UTF-8 编码 |
| 3 | `EditorUtility.SetDirty()` 忘记调 | SO/Asset 改动重启后丢失 | 修改 Asset 后立即调 `SetDirty` |
| 4 | Unity 假 null（`is null` vs `== null`） | 空引用异常或逻辑错误 | Unity 对象统一用 `== null` |

> **遇到新坑时，必须追加到此表。这是活文档。**

---

## 八、SceneCraft 专属规范（编辑器工具开发）

> **以下规则仅在开发 SceneCraft（场景工坊）及类似 Unity 编辑器工具时适用。**
> 开发小游戏等非工具项目时，遵守第七章通用规范即可，无需看本章。

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
2. **如果涉及新的共享类或代码组织规则变化**，更新本 Skill 文档中的相关章节（8.1 共享类清单、8.2 新代码放哪里等）
3. **主动问用户**："这次改动要不要更新到架构速查文档里？" — 即使你觉得不需要，也问一句，因为用户自己可能记不住

**时机**：在当前任务的代码改动全部完成、验证通过后，作为收尾步骤执行。不要等到下次任务才想起来。

### 8.1 共享类清单（新功能优先查这些）

| 共享类 | 职责 | 什么时候用 |
|--------|------|-----------|
| `P4AssetHelper.cs` | 所有 P4 操作（edit/add/delete/rename/revert） | 任何 P4 相关功能 |
| `SceneCraftStyles.cs` | 所有 UI 颜色和 GUIStyle | 任何 UI 绘制 |
| `SceneCraftData.cs` | 所有数据类型（枚举/结构体/常量） | 新增数据类型 |
| `SceneCraftSettings.cs` | 所有配置项读写（ScriptableObject） | 新增配置项 |

### 8.2 新增代码放哪里

| 场景 | 放哪 | 示例 |
|------|------|------|
| 主窗口的新页签/新功能 | 新建 `SceneCraftWindow.XXX.cs`（partial class） | 加个"资源统计"功能 → `SceneCraftWindow.Stats.cs` |
| 独立弹窗工具 | 新建独立 `XXXWindow.cs` 文件 | 新的检查工具 → `TextureChecker.cs` |
| 新的数据类型/枚举 | 加到 `SceneCraftData.cs` | 新增一个状态枚举 |
| 新的 UI 样式/颜色 | 加到 `SceneCraftStyles.cs` | 新增一种高亮色 |
| 新的配置项 | 加到 `SceneCraftSettings.cs` | 新增一个路径配置 |
| 多个工具共用的 P4 方法 | 加到 `P4AssetHelper.cs` | 新增 `P4Shelve()` |
| 只有一个工具用的辅助方法 | 放在该工具自己的文件里 | `P4SubmitChecker` 内部的辅助方法 |

### 8.3 SceneCraft 体量限制（补充通用 7.2）

- **单个 partial 文件** ≤ 2000 行（超了考虑拆分新 partial）
- **独立工具文件** ≤ 3000 行为宜（已有的大文件是历史遗留，新文件别再这么大）

### 8.4 编辑器工具特有的状态管理

- **初始状态用特殊值** — `-2` 表示"从未检测"，`0` 表示失败，`1` 表示成功。不要用 `false` 表示"还没检测过"
- **缓存标记防重复执行** — 耗时操作（P4 命令、文件扫描）必须有 `_xxxScanned` 标记，防止 OnGUI 每帧触发
- **重置状态要全链路** — 重置某步骤时，同步重置所有依赖它的下游状态
- **不在 OnGUI 中执行阻塞操作** — 外部进程、文件扫描、网络请求一律由按钮点击触发

### 8.5 编辑器 UI 错误展示

- 非致命错误用 `EditorUtility.DisplayDialog()` 弹窗，标题写清什么操作失败了
- 致命错误（初始化失败）在窗口区域用红色大字显示，不要只打 Console.log
- 错误重试不限次数——只有用户点「取消」才退出

### 8.6 #region 组织规则

- 每个 partial 文件按功能用 region 分区，region 名用中文
- region 嵌套不超过 2 层
- 同类方法放同一个 region（所有 Draw 方法放一起，所有数据处理方法放一起）
- **新增 #region 要与现有 region 风格一致**——看同文件中其他 region 怎么命名的

### 8.7 修改 SceneCraft 代码的额外检查

在通用 7.4 的基础上，额外注意：
1. **第一步永远是读速查文档**（见本章开头铁律），通过文档定位文件，不要遍历源码
2. **改共享类（P4AssetHelper / SceneCraftStyles / SceneCraftData / SceneCraftSettings）时，必须检查所有调用方**
3. **partial class 之间的字段引用**——删除代码前确认没有其他 partial 文件在用这个字段

### 8.8 新增 SceneCraft 功能的 Checklist

每次实现新功能前，过一遍这个清单：

- [ ] **第一步：读了架构速查文档**（本章铁律），通过文档定位到具体文件
- [ ] 查了共享类（8.1 表格），确认没有可复用的现成方法
- [ ] 新增代码放对了文件（见 8.2 表格）
- [ ] 新增配置项走了 `SceneCraftSettings.cs`
- [ ] 新增颜色/样式走了 `SceneCraftStyles.cs`
- [ ] 新增数据类型走了 `SceneCraftData.cs`
- [ ] 方法没超 50 行（通用 7.2）
- [ ] 命名符合通用 7.3 规范

### 8.9 SceneCraft 专属踩坑记录

> 编辑器工具开发特有的坑，与通用坑（7.8）分开记录。

| # | 踩坑场景 | 后果 | 正确做法 |
|---|---------|------|---------|
| 1 | `OnGUI()` 中执行 P4 命令 / 外部进程 | 编辑器卡死 | 必须由按钮点击触发 |
| 2 | GUIStyle 在域重载（Domain Reload）后丢失 | 样式变成空白 | 用 `SceneCraftStyles` 集中缓存 + null 检查 lazy 初始化 |
| 3 | `Bin~` 目录被 P4 trigger 拦截报错 | P4 add 失败 | 过滤带 `~` 后缀的 Unity 临时目录 |
| 4 | P4CLIENT 环境变量默认是机器名 | P4 命令执行在错误的 workspace | 显式传 `-c` 参数或从 p4 set 读取 |
| 5 | 列表"预览 0 文件"问题 | 用户体验差 + 五轮调试 | 显示前验证数据源是否已加载，未加载显示"加载中..." |

> **遇到新坑时，必须追加到此表。这是活文档。**

---

## 九、沟通风格偏好

- **直接高效，不废话** — 不需要"Great question!"之类的客套
- **先动手后沟通** — 遇到问题先尝试解决，边做边说
- **偶尔皮一下但干活不含糊** — 幽默可以有，但不能影响输出质量
- **中文为主** — 回复默认使用中文

---

## 参考文档

- **项目上下文**：`references/project-context.md` — 项目路径、版本历史、P4 集成决策等
- **SceneCraft 架构速查**：`references/scenecraft-architecture.md` — 28 个 .cs 文件的完整架构文档（类声明、核心方法、字段、依赖关系、快速定位指南）。**修改 SceneCraft 代码前必读此文档**，避免遍历全部源码浪费 token
