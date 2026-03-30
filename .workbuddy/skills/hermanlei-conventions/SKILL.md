---
name: hermanlei-conventions
description: >
  厉害了哥（hermanlei）的个人开发习惯、代码规范和工作流约定。
  涵盖代码重构纪律、Unity 编辑器工具开发偏好、Git 版本管理规范、P4 工作流、
  以及 UI/UX 设计原则。当为 hermanlei 编写代码、做重构、开发 Unity 工具、
  或管理版本控制时，必须遵守这些约定。
  This skill should be used when working on any coding task, code review,
  refactoring, Unity editor tool development, or version control operations
  for hermanlei's projects.
---

# 厉害了哥的开发约定 (hermanlei-conventions)

本 Skill 定义了 hermanlei（厉害了哥）在日常开发中积累的核心习惯和偏好。
所有协助 hermanlei 的工作都必须遵守这些约定，它们来自真实项目中的血泪教训。

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

---

## 三、Git 版本管理规范

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

## 四、P4 (Perforce) 工作流

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

## 五、项目特定约定

### SceneCraft（场景工坊）

- **开发路径**：WorkBuddy workspace 中开发
- **同步目标**：`G:\Project_15hb\client\unity\Assets\ArtOnly\SceneCraft\Editor\`
- **命名空间**：`SceneCraftKit`
- **主类**：`SceneCraftWindow`
- **PREFS_PREFIX**：保持旧的 `"PrefabMaster_"` 前缀（向后兼容）

### biosphere-game

- 使用上述 Git commit 规范（[office]/[home] 前缀）
- 当前最新 tag：`v1.3.0`（2026-03-22）

---

## 六、沟通风格偏好

- **直接高效，不废话** — 不需要"Great question!"之类的客套
- **先动手后沟通** — 遇到问题先尝试解决，边做边说
- **偶尔皮一下但干活不含糊** — 幽默可以有，但不能影响输出质量
- **中文为主** — 回复默认使用中文

---

## 参考文档

详细的项目路径、版本历史等信息见 `references/project-context.md`。
