# 功能变更记录（Features Log）

> **维护者**：unity-knowledge-guardian Skill
> **编号规则**：`FEAT-序号`，全局不重复
> **状态**：`[开发中]` / `[已完成]` / `[已弃用]`
> **最后更新**：2026-04-11
> **说明**：初始盘点基于 MEMORY.md 和 daily log 中记录的已完成功能

---

## SceneCraft（场景工坊）

### FEAT-1：APV Lighting Scenario 切换 [已完成]
- **日期**：2026-04-01
- **负责人**：hermanlei
- **描述**：编辑器内通过反射切换 APV Lighting Scenario，支持下拉选择已烘焙 Scenario
- **关联文件**：SceneCraftWindow.SceneEffect.cs
- **依赖**：反射调用 ProbeReferenceVolume（APV-1~5）

### FEAT-2：P4 版本自动检测 [已完成]
- **日期**：2026-04-10
- **负责人**：hermanlei
- **描述**：`DetectP4Version()` 自动检测 p4.exe 版本，根据版本决定是否用 chcp 65001 包装。兼容 2014.2 和 2023.2。
- **关联文件**：P4SubmitChecker.cs
- **依赖**：解决 P4-2 + P4-3 矛盾

### FEAT-3：P4 Login 密码输入优化 [已完成]
- **日期**：2026-04-10
- **负责人**：hermanlei
- **描述**：移除 cmd/c 包装，改用 P4PASSWD 环境变量传密码，保留 stdin 备份
- **关联文件**：P4SubmitChecker.cs
- **依赖**：—

### FEAT-4：脏文件子目录分批 Reconcile [已完成]
- **日期**：2026-04-09
- **负责人**：hermanlei
- **描述**：检测到 "No Translation" + stdout 为空时，自动展开子目录分批 reconcile
- **关联文件**：P4SubmitChecker.cs
- **依赖**：解决 P4-1

### FEAT-5：SceneCraft 目录守卫 [已完成]
- **日期**：2026-04（具体日期待确认）
- **负责人**：hermanlei
- **描述**：要求 .cs 文件头必须写 `// 维护者：hermanlei`
- **关联文件**：SceneCraft/Editor/ 下所有 .cs
- **依赖**：—

### FEAT-6：体素灯光密度检测 [已完成]
- **日期**：2026-04（具体日期待确认）
- **负责人**：hermanlei
- **描述**：基于体素系统的灯光密度检测功能，LOD0（≤8m，16x64x16m）和 LOD1（>8m，64x128x64m）
- **关联文件**：SceneCraftWindow 相关
- **依赖**：体素扫描系统

### FEAT-7：相机移动自动重新扫描（方案A）[已完成]
- **日期**：2026-04（具体日期待确认）
- **负责人**：hermanlei
- **描述**：相机移动超 32m 阈值时自动重新扫描体素数据（`_lastSnappedCameraPos`）
- **关联文件**：SceneCraftWindow 相关
- **依赖**：体素扫描系统

---

## Skill 体系

### FEAT-8：Skill 拆分 — Hub-Spoke 模式 [已完成]
- **日期**：2026-04-11
- **负责人**：hermanlei
- **描述**：hermanlei-conventions 拆分为中枢 + scenecraft-dev + scenecraft-agent + unity-rendering 四个 Skill
- **关联文件**：~/.workbuddy/skills/ 下 4 个 Skill 目录
- **依赖**：—

### FEAT-9：skill-lint.py 自动验证 [已完成]
- **日期**：2026-04-11
- **负责人**：hermanlei
- **描述**：Python 脚本验证 Skill 结构一致性（6 条规则，77 项检查），配置每日 14:00 自动运行
- **关联文件**：~/.workbuddy/skills/skill-lint.py
- **依赖**：—

### FEAT-10：unity-knowledge-guardian Skill [开发中]
- **日期**：2026-04-11
- **负责人**：hermanlei
- **描述**：项目知识守护者 — 维护 pitfalls/features/bugs 三个知识库 + context-triggers 主动提醒
- **关联文件**：~/.workbuddy/skills/unity-knowledge-guardian/
- **依赖**：hermanlei-conventions
