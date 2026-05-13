# 踩坑记录库（Pitfalls）

> **维护者**：unity-knowledge-guardian Skill
> **编号规则**：`领域缩写-序号`（如 APV-1），全局不重复
> **规则**：只追加不删除。即使问题已修复，记录本身有历史价值。
> **最后更新**：2026-04-11
> **数据源**：从 project-codebase-wiki/pitfalls.md 迁移 + hermanlei-conventions 7.8 节摘要

---

## 快速索引

| 领域 | 条数 | 编号范围 | 关键词 |
|------|------|----------|--------|
| [APV](#apv-adaptive-probe-volumes) | 8 | APV-1~8 | 反射调用、EcoEngine、编辑模式、Scenario、BakingSet、Touchup Volume |
| [P4/版本控制](#p4版本控制) | 4 | P4-1~4 | No Translation、GBK 代码页、chcp 65001、p4 版本检测、login -s stderr |
| [编辑器工具](#编辑器工具) | 1 | TOOL-1 | VSCode linter、花括号闭合 |
| [Shader](#shader) | 0 | — | _待积累_ |
| [大世界/流式加载](#大世界流式加载) | 0 | — | _待积累_ |

---

## APV (Adaptive Probe Volumes)

### APV-1：EcoEngine 魔改导致 ProbeReferenceVolume 无法直接引用 [🔴]
- **日期**：2026-04-01
- **触发场景**：SceneCraft 场景效果切换需要切换 APV Lighting Scenario
- **问题**：EcoEngine 把 `com.unity.render-pipelines.core` 源码编译进引擎 DLL（`EcoEngine.Runtime.dll`），`Assembly-CSharp-Editor` 无法直接引用 `ProbeReferenceVolume`
- **解决**：**反射调用**。双命名空间回退：先搜 `EcoEngine.Rendering.ProbeReferenceVolume`，再搜 `UnityEngine.Rendering.ProbeReferenceVolume`
- **关联代码**：SceneCraftWindow.SceneEffect.cs
- **触发关键词**：APV, ProbeReferenceVolume, 反射, 烘焙, bake, Scenario, lightingScenario

### APV-2：EcoEngine.BigWorld.SceneManager 在编辑模式下返回 null [🔴]
- **日期**：2026-04-01
- **触发场景**：用 EcoEngine API 切换 APV Scenario
- **问题**：`EcoEngine.BigWorld.SceneManager.GetActiveScene()` 在编辑模式返回 null（运行时 API，编辑模式场景管理器未初始化）
- **解决**：不用 EcoEngine SceneManager，直接用 `ProbeReferenceVolume.instance.lightingScenario`（通过反射）
- **关联代码**：SceneCraftWindow.SceneEffect.cs
- **触发关键词**：APV, SceneManager, 编辑模式, BigWorld

### APV-3：切换 Scenario 后视觉效果不立即刷新 [🟡]
- **日期**：2026-04-01
- **触发场景**：反射设置 `lightingScenario` 后 Scene View 无变化
- **问题**：切换成功（读回值正确），但 Scene View 不刷新
- **解决**：`SceneView.RepaintAll()` + `EditorApplication.QueuePlayerLoopUpdate()`。APV 数据加载仍需几百毫秒到几秒。
- **关联代码**：SceneCraftWindow.SceneEffect.cs
- **触发关键词**：APV, 刷新, RepaintAll, Scenario, 切换

### APV-4：获取已烘焙 Scenario 列表需穿越多层 internal 字段 [🟡]
- **日期**：2026-04-01
- **触发场景**：做下拉列表让用户选 Scenario
- **问题**：`ProbeReferenceVolume` 无公开方法获取 scenario 列表
- **解决**：反射路径 `instance → sceneData(internal) → bakingSets(internal) → lightingScenarios(public)`。未烘焙时 bakingSets 为空 → 回退手动输入。结果应缓存。
- **关联代码**：SceneCraftWindow.SceneEffect.cs
- **触发关键词**：APV, Scenario, 列表, 下拉, bakingSets

### APV-5：isInitialized 检查不可省略 [🟡]
- **日期**：2026-04-01
- **触发场景**：APV 未初始化时调用 lightingScenario
- **问题**：`ProbeReferenceVolume.instance` 不为 null，但 APV 系统未初始化时设置可能无效或抛异常
- **解决**：设置前先检查 `isInitialized` 属性（反射）
- **关联代码**：SceneCraftWindow.SceneEffect.cs
- **触发关键词**：APV, isInitialized, 初始化

### APV-6：APVCellsManager.current 是 EcoEngine 扩展（未验证） [🟢]
- **日期**：2026-04-01
- **触发场景**：诊断报告中发现 `APVCellsManager` 有 `current` 静态属性
- **问题**：EcoEngine 扩展类，可能是大世界流式加载的 APV Cell 管理器。潜在替代 API，但当前 ProbeReferenceVolume 已满足需求
- **解决**：留作记录，未验证
- **关联代码**：—
- **触发关键词**：APVCellsManager, 大世界, 流式加载

### APV-7：YAML 手动创建的 BakingSet 不会注册到面板 [🔴]
- **日期**：2026-04-08
- **触发场景**：APV 助手工具自动创建 BakingSet 资产（复制 YAML + AssetDatabase.Refresh）
- **问题**：文件在 Project 窗口正常显示，但 Probe Volume Settings 面板看不到。注册信息由 EcoEngine 引擎 DLL 内部管理，不在 YAML 里。
- **解决**：引导用户通过面板 "+" 按钮创建，不要用代码/YAML 创建
- **关联代码**：—
- **触发关键词**：APV, BakingSet, 创建, YAML, 面板

### APV-8：Probe Adjustment Volume 在 EcoEngine 中叫 Probe Touchup Volume [🟡]
- **日期**：2026-04-08
- **触发场景**：修复大型物体 APV 光照泄漏
- **问题**：Unity 2023 叫 `Probe Touchup Volume`，Unity 6 改名 `Probe Adjustment Volume`。功能相同。
- **解决**：项目中创建找 Touchup Volume，查文档搜 Adjustment Volume
- **关联代码**：—
- **触发关键词**：APV, Touchup, Adjustment, 光照泄漏, Volume

---

## P4/版本控制

### P4-1：非 Unicode Server + 特殊字符文件名 → stdout 全部丢失 [🔴]
- **日期**：2026-04-09
- **触发场景**：P4SubmitChecker 对 `Assets/formal/...` 执行 `p4 reconcile -n`
- **问题**：Unity `Process.Start` 环境下碰到含中文/零宽 Unicode 字符的文件名，P4 client Fatal error 断开 session，stdout 全部丢失。命令行直接执行正常。
- **解决**：检测 "No Translation" + stdout 为空 → 自动展开子目录分批重试。`isFatalError` 和 `hasTranslationWarning` 优先级很重要。
- **关联代码**：P4SubmitChecker.cs, P4AssetHelper.cs
- **触发关键词**：P4, reconcile, No Translation, Fatal, Process.Start, 中文路径, Unicode

### P4-2：GBK 代码页导致 reconcile 返回大量假阳性 [🔴]
- **日期**：2026-04-10
- **触发场景**：Unity Process.Start 调用 `p4 reconcile -n`，返回 296 条（实际 9 条）
- **问题**：Windows 默认 Console Code Page 936 (GBK)，p4.exe 在 GBK 下对中文路径 digest 计算出错。命令行 PowerShell 预设了 `chcp 65001` 所以正常。
- **解决**：所有 `Process.Start` 调用 p4 用 `cmd /c "chcp 65001 >nul 2>&1 && p4 ..."` 包装
- **关联代码**：P4AssetHelper.cs, P4SubmitChecker.cs, SceneAssetChecker.cs（共 3 文件 5 处）
- **触发关键词**：P4, GBK, chcp, 代码页, 假阳性, reconcile, Process.Start

### P4-3：p4 2023.2 + chcp 65001 完全不兼容 [🔴]
- **日期**：2026-04-10
- **触发场景**：同事 paul 升级 p4.exe 到 2023.2 后 SceneCraft P4 功能全失效
- **问题**：p4 2023.2 在 chcp 65001 的 cmd.exe 环境中所有命令 stdout 为空。与 P4-2 形成矛盾（旧版必须 chcp，新版加了 chcp 就炸）。
- **解决**：`DetectP4Version()` 自动检测版本，>= 2020 不包 chcp，< 2020 包 chcp。login -s 一律 RunP4Direct。
- **关联代码**：P4SubmitChecker.cs
- **触发关键词**：P4, 版本, 2023.2, 2014.2, chcp, DetectP4Version

### P4-4：p4 login -s 部分版本将结果输出到 stderr [🟡]
- **日期**：2026-04-10
- **触发场景**：P4SubmitChecker 检测登录状态
- **问题**：p4 2014.2 输出到 stdout，2023.2 输出到 stderr（exitCode 都是 0）。只读 stdout 在新版上误判"未登录"。
- **解决**：合并 stdout + stderr 判断。任何 p4 命令都应同时检查 stdout 和 stderr。
- **关联代码**：P4SubmitChecker.cs
- **触发关键词**：P4, login, stderr, stdout, 登录状态

---

## 编辑器工具

### TOOL-1：VSCode OmniSharp Linter ≠ Unity 编译器 [🔴]
- **日期**：2026-04-09
- **触发场景**：P4SubmitChecker.cs 新增方法漏了闭合花括号
- **问题**：VSCode OmniSharp 报告零错误，但 Unity Console 持续 CS0106 + CS1513。大文件（7000+ 行）花括号闭合检测有延迟/遗漏。
- **解决**：1) 写完含 if/else 多分支的方法后 read_file 确认闭合 2) 每次改动后提醒用户确认 Unity Console 3) 不并行堆积未编译验证的改动
- **关联代码**：P4SubmitChecker.cs
- **触发关键词**：linter, 编译, 花括号, OmniSharp, CS0106, CS1513

---

## Shader

_暂无记录，踩坑后追加。_

---

## 大世界/流式加载

_暂无记录，踩坑后追加。_
