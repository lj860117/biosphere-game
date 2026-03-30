# 项目上下文参考

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
