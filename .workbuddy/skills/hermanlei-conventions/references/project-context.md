# 项目上下文参考

> **最后更新**：2026-04-10（补充 chcp 65001 包装方案到 P4 集成决策参考）

## 开发环境

| 项目 | 说明 |
|------|------|
| **操作系统** | Windows, PowerShell |
| **Unity 版本** | 2022+ |
| **引擎** | EcoEngine（自研） |
| **版本控制** | Git（个人项目）、P4/Perforce（公司项目） |
| **Unity 项目路径** | `G:\Project_15hb\client\unity\` |

## 项目清单

### SceneCraft（场景工坊）

Unity 编辑器工具套件，前身为 PrefabMaster / PrefabScaleTool。

| 属性 | 值 |
|------|------|
| 开发环境 | WorkBuddy workspace |
| 同步目标 | `G:\Project_15hb\client\unity\Assets\ArtOnly\SceneCraft\Editor\` |
| 命名空间 | `SceneCraftKit` |
| 主类 | `SceneCraftWindow` |
| PREFS_PREFIX | `"PrefabMaster_"`（向后兼容） |
| TRACEABILITY_PREFIX | `"PrefabMaster_"`（向后兼容） |

#### 核心文件

- `P4SubmitChecker.cs` — P4 提交预检和版本管理工具（~6000行）
- `P4AssetHelper.cs` — P4 资产自动 Checkout 和右键菜单（~500行）
- `P4Bin/p4.exe` — 内嵌 P4 命令行工具（2.45MB）

#### 版本历史

- v1.2 → v1.3（2026-03-28）：零配置 P4 集成、Unity 内登录、workspace 自动选择

### biosphere-game

个人游戏项目，使用 Git 版本管理。

| 属性 | 值 |
|------|------|
| 最新 tag | `v1.3.0`（2026-03-22） |
| tag 范围 | `v0.0.1` ~ `v1.3.0` |
| commit 规范 | `[office/home] 类型: 描述` |

#### Git 设备标识

| 设备 | Git 用户 | 前缀 |
|------|---------|------|
| 公司电脑 | leijiang / hermanlei@tencent.com | `[office]` |
| 家里电脑 | lj860117 | `[home]` |

## PowerShell 注意事项

- commit 消息含特殊字符（如中文、括号）时，使用 `-F` 文件方式传递
- 临时消息文件必须用 `write_to_file` 创建（确保 UTF-8），不用 `echo`
- PowerShell 的 `echo` / `Out-File` 默认编码不是 UTF-8，会导致中文乱码

## P4 集成 UI 决策参考

| 决策项 | 最终方案 |
|--------|----------|
| p4.exe 存放 | `Editor/P4Bin/p4.exe`（不用 `Bin~`，因为 Unity 不生成 .meta 导致 P4 trigger 报错） |
| 探测链 | 缓存 → EditorPrefs → 内嵌 → PATH → 同类进程探测 → 常见路径 |
| 登录方式 | Unity 内密码输入框，`Process.StandardInput` 喂密码 |
| Workspace 选择 | `p4 clients -u` 自动扫描 + Root 路径匹配 + 一键 ApplyWorkspace，绿色/灰色区分 |
| 默认服务器 | `192.168.31.15:1667` |
| 连接检测触发 | 手动按钮触发，绝不自动执行（`_p4LoginState` 初始 `-2`） |
| Ticket 过期 | 自动弹 EditorInputDialog，回车确认，≥3 次重试 |
| 预览过滤 | 自动过滤 `/SceneCraft/` 目录（工具自身文件不显示） |
| 安全同步 | 「仅安全」一键排除冲突 + 需关 Unity 文件 |
| 分支支持 | 状态行显示 `(用户名@workspace名)`，下拉切换分支 |
| 图例条 | 固定顶部不滚动，■ 方块 + 实际颜色 + 文字 |
| 需关 Unity 目录 | `Settings`、`scripts_dll` 等（可扩展列表） |
| P4 进程代码页 | 所有 p4 调用统一 `cmd /c "chcp 65001 >nul 2>&1 && p4 ..."` 包装，防止 GBK 下 digest 假阳性 |

## 颜色编码速查

| 颜色 | RGB 参考 | 用途 |
|------|----------|------|
| 紫色 | `(0.7, 0.5, 1.0)` | 需关 Unity 才能同步的文件/文件夹 |
| 绿色 | — | 其他美术资源 / Workspace 自动匹配项 |
| 黄色 | — | 非场景目录含场景子文件的提示文字 |
| 灰色 | — | 不匹配的 Workspace（可强制使用） |

## "预览更新 0 文件" 五轮修复历史

这是一个典型的"来回调整"案例，记录完整修复链路以供参考：

1. **第一轮**：改用 `p4 -s sync -n`（tagged output）— 但根因不在这
2. **第二轮**：加 `DiagnoseSyncOutput()` 诊断 — 发现 **P4CLIENT 环境变量是机器名默认值**，P4 服务器不认识
3. **第三轮**：加 Step 3 Workspace 有效性检测（`p4 where ...`）+ 修复指引
4. **第四轮**：P4CLIENT 一键自动修复（`ScanUserWorkspaces` + `ApplyWorkspace`）
5. **第五轮**：完全零配置 + Unity 内登录（内嵌 p4.exe + 注册表读取 + 密码输入框）

**教训**：表面问题（sync 解析）和根因（P4CLIENT 配置错误）可能相差很远，诊断工具比直接修代码更重要。
