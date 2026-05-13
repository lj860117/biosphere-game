---
name: scenecraft-agent
description: >
  SceneCraft（场景工坊）工具套件的 AI 协作 Skill。当用户提到"检查场景"、"查资产"、
  "P4 提交"、"同步工坊"、"查P4"、"写新规则"等与 SceneCraft 工具套件相关的操作时，
  加载此 Skill。它让 AI 了解 SceneCraft 的完整能力、检查规则和工作流，
  能够分析检查报告、建议修复方案、帮助编写新检查规则、以及协调代码同步。
  This skill should be used when the user mentions SceneCraft, scene checking,
  asset validation, P4 submit checking, LOD management, prefab scaling,
  or any Unity editor tool related to the SceneCraft suite.
  [归属:项目(15hb)]
---

# SceneCraft Agent — AI 协作岗位手册

> **定位**：这不是 SceneCraft 的技术文档（那在 `scenecraft-dev` 的 references 里），
> 而是 AI 如何**使用 SceneCraft、配合 SceneCraft 工作**的行动指南。
>
> **前置依赖**：本 Skill 假定 `hermanlei-conventions` 已加载。如果没有，先加载它。

---

## 一、SceneCraft 是什么

SceneCraft（场景工坊）是一个 Unity 编辑器工具套件，面向地编美术团队，提供：

| 功能域 | 具体能力 | 对应工具/文件 |
|--------|---------|-------------|
| **资产检查** | DrawCall、Transform、命名、材质、LOD、FakeOverride 等 14 项检查 | SceneAssetChecker |
| **P4 版本管理** | 连接/登录/同步/提交预检/冲突解决 | P4SubmitChecker + SceneCraftWindow.P4*.cs |
| **P4 提交预检** | GUID 重复、大小写冲突、依赖完整性、Missing 引用、.meta 缺失 | P4SubmitChecker |
| **Prefab 操作** | 缩放/替换/批量重命名/搜索/溯源 | SceneCraftWindow.Scale/Replace/Rename/Search/Trace |
| **LOD 管理** | DisLODGroup 批量设置、LOD0 Only、备份/恢复 | SceneCraftWindow.LOD + DisLODGroupTool |
| **材质生成** | 根据贴图自动创建材质（TCStoneLit/TCBaseLit/TCTrunk/TCLeaf） | SceneCraftWindow.Material |
| **模型导出** | 场景/Prefab 导出 FBX/OBJ（cat1986 维护，勿动） | ModelExporterWindow |
| **网格减面** | QEM 算法减面 | MeshDecimator |
| **资源改名** | 批量转小写（适配大小写敏感平台） | AssetLowercaseRenamer |

**代码规模**：28 个 .cs 文件，~30,000+ 行，命名空间 `SceneCraftKit`。

---

## 二、口令系统（快捷指令）

用户说以下口令时，执行对应的工作流：

### "查场景" / "检查场景" / "场景有问题吗"

**触发动作**：
1. 确认用户指的是哪个场景（当前打开的？还是特定路径？）
2. 检查 `{Unity项目根}/SceneCraftReports/latest_check.json` 是否存在
3. 如果有 JSON 报告 → 直接读取并分析（见第三节「报告分析流程」）
4. 如果没有 → 询问用户是否在 Unity 里运行了扫描（扫描完会自动导出 JSON）
5. 也可以读用户手动导出的 CSV/txt 报告

**输出格式**：
```
## 场景检查报告分析

### 🔴 必须修复（N 项）
- [检查项名称] — 问题描述 — 修复建议

### 🟡 建议修复（N 项）
- [检查项名称] — 问题描述 — 修复建议

### ✅ 通过（N 项）
- [检查项列表]
```

### "查P4" / "P4 提交检查" / "能提交吗"

**触发动作**：
1. 确认用户是想做提交预检还是查看同步状态
2. 如果是提交预检 → 引导用户运行 P4SubmitChecker 或分析其报告
3. 如果是同步状态 → 询问 `p4 sync -n` 的输出

**输出格式**：
```
## P4 提交预检分析

### ❌ 不能提交（N 项阻塞问题）
- [问题描述] — 修复步骤

### ⚠️ 需要注意（N 项风险）
- [风险描述] — 建议操作

### ✅ 可以提交
- 涉及文件 N 个，预计 changelist 描述：...
```

### "新规则：XXX" / "加个检查" / "SceneCraft 加功能"

**触发动作**：
1. 理解用户描述的检查规则/功能需求
2. 判断该规则应该加到哪个模块（SceneAssetChecker？P4SubmitChecker？新独立工具？）
3. 按 hermanlei-conventions 的闭环流程走（根据规模选择 🟢/🟡/🔴）
4. **必须先读** `scenecraft-dev/references/scenecraft-architecture.md` 定位代码位置
5. 编写代码并遵守 SceneCraft 专属规范（`scenecraft-dev` 第三章）

### "同步工坊" / "同步到 Unity"

**触发动作**：
1. 确认 WorkBuddy workspace 中修改了哪些 SceneCraft 文件
2. 列出需要同步到 `G:\Project_15hb\client\unity\Assets\ArtOnly\SceneCraft\Editor\` 的文件清单
3. 提醒用户在 P4 中 Checkout 目标文件
4. 执行文件复制（用户确认后）
5. 提醒用户在 Unity 中编译验证

### "写周报" / "工作总结"

**触发动作**：
1. 读取本周的 working memory 日志
2. 筛选与 SceneCraft 相关的条目
3. 生成结构化周报（功能新增、bug 修复、优化改进）

---

## 三、报告分析流程

### SceneAssetChecker 报告格式

SceneAssetChecker 的检查结果基于 `CheckResult` 数据结构：

```
检查项 | 严重度 | 通过阈值 | 说明
-------|--------|---------|------
DrawCallCount | 🔴 严重 | ≤ 8 | DrawCall 超标会导致导出失败
NormalizedTransform | 🔴 严重 | 单位化 | Position 非零/Rotation 非零/Scale 非 1
MissingScripts | 🔴 严重 | 0 个 | 丢失的脚本组件
HiddenChildren | 🟡 警告 | 0 个 | 隐藏的子物体（可能是遗留垃圾）
VariantPrefab | 🔴 严重 | 0 个 | 变体 Prefab 不允许导出
LegalFileName | 🔴 严重 | 全小写+合法字符 | 文件名不合规
Materials | 🔴 严重 | TCDemo Shader | 使用了非法 Shader
TextureImportSettings | 🟡 警告 | 符合规范 | 贴图导入设置不规范
DisLODGroup | 🟡 警告 | 已配置 | 缺少 DisLODGroup 组件
LODRatios | 🟡 警告 | 合理比例 | LOD 距离比例不合理
FakeOverride | 🟡 警告 | 0 个 | Prefab 假 Override（应 revert）
Tag | 🟢 信息 | 正确标签 | 标签检查（SceneCraft 独有）
GrassShadowOff | 🟢 信息 | 关闭 | 草地投影应关闭
ReferencedFBX | 🟢 信息 | 无直接引用 | 引用了 FBX 文件而非 Prefab
```

### 分析时的判断框架

拿到检查报告后，按以下优先级排序问题：

1. **🔴 导出阻塞**：DrawCallCount、MissingScripts、VariantPrefab、LegalFileName、Materials — 这些不修就无法导出
2. **🟡 质量风险**：FakeOverride、HiddenChildren、TextureImportSettings — 不修可以导出但可能有问题
3. **🟢 优化建议**：Tag、GrassShadowOff、ReferencedFBX — 改了更好，不改也行

### 修复建议模板

对于每个问题，提供三层建议：

```
**问题**：[具体描述]
**影响**：[不修会怎样]
**修复方式**：
- 手动修复：[在 Unity 里怎么操作]
- SceneCraft 一键修复：[工具里有没有自动修复按钮]
- 代码修复：[如果需要写脚本修复，给出代码片段]
```

---

## 四、能力边界（什么能做 / 什么不能做）

### ✅ 现在就能做的

| 场景 | 怎么做 |
|------|--------|
| 分析检查报告（JSON） | 读取 `{项目根}/SceneCraftReports/latest_check.json` → 解析 → 按优先级排序 → 给修复建议 |
| 分析检查报告（CSV） | 读取用户手动导出的 CSV 文件 → 解析 → 分析 |
| 编写新检查规则 | 理解需求 → 定位代码 → 在正确的位置写新检查 |
| 编写新工具功能 | 理解需求 → 走闭环流程 → 写代码 → 同步 |
| 修复 SceneCraft 的 bug | 读代码 → 分析问题 → 修复 → 验证 |
| 分析 P4 输出 | 读用户贴过来的 p4 命令输出 → 解释含义 → 给建议 |
| 帮助理解 SceneCraft 代码 | 回答"这段代码是干什么的"之类的问题 |
| 生成 changelist 描述 | 根据改动文件列表生成 P4 提交描述 |

**JSON 报告路径**：`C:\Users\hermanlei\.workbuddy\SceneCraftReports\latest_check.json`
- 路径在用户本地目录，不在 P4 workspace 内，不会有版本冲突
- 每次扫描完成后自动导出（`latest_check.json` 每次覆盖）
- 同时生成带时间戳的历史版本（`check_{场景名}_{时间戳}.json`）
- UI 上也有手动"导出JSON"按钮

### ❌ 现在不能做的

| 场景 | 原因 | 替代方案 |
|------|------|---------|
| 在运行中的 Unity 里触发检查 | 没有实时桥接（MCP/WebSocket） | 引导用户在 Unity 里手动操作 |
| 直接看 Unity 场景层级 | 无法访问运行中的 Unity 进程 | 用户描述或提供导出数据 |
| 实时监听 P4 变更 | 没有事件触发机制 | 用户手动触发或用自动化定时任务 |

### 🔜 未来可扩展的（需要加基础设施）

| 场景 | 需要什么 |
|------|---------|
| Agent 直接触发 SceneCraft 检查 | SceneCraft 加 CLI 接口（batchmode 支持） |
| 实时控制 Unity Editor | 安装 MCP 插件（unity-editor-toolkit） |
| 自动化提交前检查 | SceneCraft 加 batchmode 支持 |

---

## 五、代码定位速查（Agent 用）

需要修改 SceneCraft 代码时，**不要遍历文件**，直接查这个表：

| 想做什么 | 去哪个文件 | 注意 |
|----------|-----------|------|
| 加新的资产检查规则 | `SceneAssetChecker.cs` | ~5995 行，找对应的 Check 方法区域 |
| 加新的 P4 提交检查 | `P4SubmitChecker.cs` | ~6874 行，找 Check Rules 区域 |
| 改 P4 同步逻辑 | `Sync.cs` + `SyncUI.cs` + `SyncSafe.cs` | partial class，字段可能在主文件 |
| 改 P4 连接/登录 | `P4.cs` + `P4UI.cs` + `P4Login.cs` | 三层分离：引擎/UI/登录流程 |
| 加新页签 | `SceneCraftWindow.cs` 的 Tab System 区域 | 新功能代码放新 partial 文件 |
| 改颜色/样式 | `SceneCraftStyles.cs` | 统一管理，不要在其他文件定义样式 |
| 加新配置项 | `SceneCraftSettings.cs` | SO 配置，记得 SetDirty |
| 加新数据类型 | `SceneCraftData.cs` | 枚举/结构体/常量集中定义 |
| P4 底层操作 | `P4AssetHelper.cs` | 共享类，改了要检查所有调用方 |
| LOD 相关 | `SceneCraftWindow.LOD.cs` + `DisLODGroupTool.cs` | DisLOD 用反射访问 |
| Prefab 缩放 | `Scale.cs` + `ScaleUI.cs` | 逻辑和 UI 分离 |
| 批量操作 | `Batch.cs` | 通用批处理框架 |
| 模型导出 ⚠️ | `ModelExporterWindow.cs` | **cat1986 维护，勿动** |

**完整架构文档**：`scenecraft-dev/references/scenecraft-architecture.md`

---

## 六、与 hermanlei-conventions 及 scenecraft-dev 的协作

### 职责分工

| 内容 | 在哪里 |
|------|--------|
| SceneCraft 的架构细节（29 个文件的完整文档） | `scenecraft-dev/references/scenecraft-architecture.md` |
| SceneCraft 的开发规范（代码规范、预审流程） | `scenecraft-dev/SKILL.md` 第三章 |
| SceneCraft 的已知问题台账 | `scenecraft-dev/references/scenecraft-known-issues.md` |
| 通用铁律、编码规范、路由表 | `hermanlei-conventions/SKILL.md` |
| **AI 如何使用 SceneCraft**（本文件） | `scenecraft-agent/SKILL.md` |
| **口令系统、报告分析、能力边界** | `scenecraft-agent/SKILL.md` |
| **检查规则详细说明** | `scenecraft-agent/references/check-rules.md` |

### 加载顺序

1. 用户说了 SceneCraft 相关的话 → 加载 `scenecraft-agent`
2. 如果需要**写代码** → 追加加载 `scenecraft-dev`（会自动拉入 `hermanlei-conventions` 作为前置依赖）
3. 如果只是**分析报告/聊架构** → 只需 `scenecraft-agent` 就够

---

## 七、主动建议机制

AI 在日常协助中，遇到以下情况应主动建议：

### 发现新检查规则需求

```
💡 SceneCraft 检查规则建议：
用户在做 XXX 时，发现了一个 SceneAssetChecker 当前没覆盖的问题：[描述]。
建议新增检查项 "[名称]"，检查逻辑为 [简述]。
要我写个实现草稿吗？
```

### 发现工作流可优化

```
💡 SceneCraft 工作流建议：
用户经常手动做 XXX 操作（已在 N 次对话中出现）。
建议给 SceneCraft 加一个 [功能名称]，自动化这个流程。
要我设计一下吗？
```

### 发现报告分析中的模式

```
💡 场景检查趋势：
最近 N 次检查报告中，[检查项] 的失败率特别高（N/M 个场景不合格）。
可能的根因：[分析]。
建议：[预防措施]。
```

---

### 相关 Skill 交叉引用

| 场景 | 应加载的 Skill | 说明 |
|------|--------------|------|
| 需要**修改** SceneCraft 代码 | `scenecraft-dev` | 开发规范，与本 Skill 互补 |
| 任务涉及渲染/光照/材质 | `unity-rendering` | 场景检查中的材质/Shader 问题需参考 |
| Unity 代码开发/调试，查踩坑记录 | `unity-knowledge-guardian` | 提供 P4/编辑器工具/APV 踩坑主动提醒 |
| 通用铁律/编码规范 | `hermanlei-conventions` | 本 Skill 的前置依赖 |

---

## 八、维护说明

- **本 Skill 由 AI 和用户共同维护**
- 新增口令 → 加到第二节
- 检查规则变更 → 更新第三节和 references/check-rules.md
- 能力边界变化（比如加了 MCP 桥接）→ 更新第四节
- 代码结构变化 → 更新第五节（同时确保 hermanlei-conventions 的架构文档同步）
- **Skill 内容归属规则** → 见 `hermanlei-conventions/SKILL.md` 成长引擎区域的「Skill 内容归属规则」
