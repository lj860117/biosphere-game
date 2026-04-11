# SceneCraft 已知问题台账

> **用途**：记录每次代码预审发现的问题，AI 改代码前先读此台账，不需要重新审计。
> **维护规则**：修了一个就标 ✅，新发现的追加到末尾。每条带日期。
> **首次审计日期**：2026-03-30
> **最后更新**：2026-03-30

---

## 快速统计

| 状态 | 🔴 严重 | 🟡 中等 | 🟢 轻微 |
|------|---------|---------|---------|
| ⬜ 未修 | 21 | 54+ | 30+ |
| ✅ 已修 | 0 | 0 | 0 |

---

## 一、跨文件系统性问题

> 这些问题横跨多个文件，修复时需要统一方案。

### SYS-01 🔴 Process 死锁模式（4 处）
- **状态**：⬜ 未修
- **发现日期**：2026-03-30
- **模式**：同步 `ReadToEnd()` 先 stdout 后 stderr，缓冲区满时永久阻塞
- **涉及文件**：
  - `P4AssetHelper.cs` → `RunP4()` 方法
  - `P4SubmitChecker.cs` → `P4LoginWithPassword()` L5548-5549（且 `WaitForExit(15000)` L5551 不可达）
  - `SceneAssetChecker.cs` → `RunP4Command()` L5478-5482
  - `SceneAssetChecker.cs` → `RunP4CommandWithInput()` L5527-5533
- **正确做法**：参考 `P4SubmitChecker.RunP4Command`（L5324-5330）的异步 `BeginOutputReadLine`/`BeginErrorReadLine` 模式
- **修复建议**：抽取统一的 `P4ProcessRunner` 工具方法，所有 P4 进程调用走同一套异步读取

### SYS-02 🟡 OnGUI new GUIStyle 每帧分配（62+ 处）
- **状态**：⬜ 未修
- **发现日期**：2026-03-30
- **涉及文件**：
  - `SceneCraftWindow.cs` 各 partial — 12+ 处
  - `P4SubmitChecker.cs` — 31 处（L3844, 3940, 3948, 3953, 3959, 4022, 4247, 4282, 4317 等）
  - `SceneAssetChecker.cs` — 19 处
- **修复建议**：类级别缓存 `_cachedStyleXxx ??= new GUIStyle(...)`

### SYS-03 🟡 God Class 模式（3 个巨型类）
- **状态**：⬜ 未修
- **发现日期**：2026-03-30
- **涉及文件**：
  - `SceneCraftWindow` — ~15000 行，15 个 partial，400+ 字段
  - `P4SubmitChecker` — 6874 行，单文件单类
  - `SceneAssetChecker` — 5995 行，单文件单类
- **备注**：长期问题，拆分风险高，建议新增功能时逐步瘦身而非一次性重构

### SYS-04 🟡 重复的 P4 基础设施（3 套独立实现）
- **状态**：⬜ 未修
- **发现日期**：2026-03-30
- **详情**：
  - `P4AssetHelper.cs` — `GetP4ExePath()` + `RunP4()`
  - `P4SubmitChecker.cs` — 自己的 `GetP4ExePath()` + `RunP4Command()`
  - `SceneAssetChecker.cs` — 自己的 `RunP4Command()` + `RunP4CommandWithInput()`
- **修复建议**：抽取 `P4Service` 共享类到 `P4AssetHelper.cs` 或新文件

### SYS-05 🟡 重复的枚举/类型定义
- **状态**：⬜ 未修
- **发现日期**：2026-03-30
- **详情**：`CheckResult`、`AssetKind`、`Severity` 在 P4SubmitChecker 和 SceneAssetChecker 中各有一份

### SYS-06 🔴 命令注入风险（2 个文件）
- **状态**：⬜ 未修
- **发现日期**：2026-03-30
- **涉及文件**：
  - `P4AssetHelper.cs` → `RunP4()` arguments 参数
  - `P4SubmitChecker.cs` → L4072, 4081, 4144-4145, 4211-4212, 5379, 5469
- **修复建议**：路径参数加引号包裹，或用 `ProcessStartInfo.ArgumentList`

---

## 二、P4SubmitChecker.cs（6874 行）

### PSC-C1 🔴 P4LoginWithPassword 死锁
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L5548-5549
- **归并**：→ SYS-01

### PSC-C2 🔴 WaitForExit(15000) 不可达
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L5551
- **归并**：→ SYS-01

### PSC-C3 🔴 GetP4ExePath 未检查 WaitForExit 返回值
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L5647-5655
- **详情**：`WaitForExit(5000)` 返回值未检查，进程可能仍运行时访问 ExitCode，重定向流未读取

### PSC-C4 🔴 命令注入
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **归并**：→ SYS-06

### PSC-C5 🔴 FixMissingReferencesInAsset 非原子写入
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L3799
- **详情**：`File.WriteAllLines` 直接写原 YAML 文件，无备份无临时文件，写入失败则文件损坏

### PSC-M1~M20 🟡 中等问题（20 个）
- 31 处 OnGUI GUIStyle 分配 → SYS-02
- God Class 6874 行 → SYS-03
- `DrawConflictResolver()` 1168 行单方法
- 编译正则每次调用重建（L3563）
- DRY：P4 tagged 输出解析重复（L6246-6259 vs L6596-6609）
- DRY：`p4 opened` 解析重复 3 处
- DRY：p4.exe 路径验证重复（L3986-3998 vs L4938-4946）
- 硬编码 IP 地址（L4093）
- 硬编码 STORY 号（L6108，注释说"随机"但固定）
- Magic numbers 遍布
- `File.ReadAllLines` 读大 YAML（L3559, 3697）
- OnGUI 同步 P4 命令（L3879, 3897, 4044）
- Process handle 泄漏（GetP4ExePath L5673-5684）
- 空 catch 吞异常（L4087, 5683, 5686）
- `CheckP4LoginStatus` 无限重试（L6132）
- 死代码 `propNameRegex`（L3565）
- `EditorInputDialog` 嵌套类应独立
- 变量命名缺 `_` 前缀
- 中英文注释混用
- 缺少 XML 文档注释

---

## 三、SceneAssetChecker.cs（5995 行）

### SAC-C1 🔴 RunP4Command / RunP4CommandWithInput 死锁
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L5478-5482, L5527-5533
- **归并**：→ SYS-01

### SAC-C2 🔴 PrefabEditScope.Dispose() 异常时仍保存
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L4406-4412
- **详情**：`Dispose()` 无条件调用 `SaveAsPrefabAsset`，异常导致的损坏数据会被写入磁盘
- **修复建议**：加 `_succeeded` 标记，仅在成功时保存

### SAC-C3 🔴 PrefabEditScope 构造函数异常泄漏
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L4403
- **详情**：`LoadPrefabContents` 异常未 catch，可能资源泄漏

### SAC-C4 🔴 面数计算只算 submesh 0
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：`CountTriangles` L4513, `CountAllTrianglesInFBX` L4541
- **详情**：`GetIndexCount(0)` 只计第一个 submesh，多材质网格面数严重低估
- **影响**：**导出合规检查核心计算结果不准确**
- **修复**：遍历所有 submesh `for (int i = 0; i < mesh.subMeshCount; i++) total += mesh.GetIndexCount(i) / 3;`

### SAC-C5 🔴 FindNestedPrefabByName 按名字匹配
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L3709-3724
- **详情**：同名嵌套 Prefab 时返回第一个匹配，可能 Revert 错误对象

### SAC-C6 🔴 FixRevertSafeOverrides 双向 Contains 匹配
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **位置**：L5173-5174
- **详情**：`t.name.Contains(hint) || hint.Contains(t.name)` — "Wall" 会匹配 "WallLight"，短名匹配长名

### SAC-M1~M18 🟡 中等问题（18 个）
- God Class 5995 行 → SYS-03
- DRY：`AutoFixBlockers` / `AutoFixSelected` 近乎相同
- DRY：Override 比较逻辑重复
- DRY：`ShowFixedFilesList` / `ShowModifiedFilesList` 几乎一样
- DRY：统计重算散布多处
- DRY：Transform Override 分类重复
- 面数限制 magic numbers（无常量）
- `GetValidationFixInfo` 脆弱字符串匹配
- `FindDisLODGroupType` 空 catch
- `TagExists` 用 try-catch 做流程控制 + GameObject 泄漏
- `stillBroken` 变量从未递增 — 死逻辑
- 同步 P4 阻塞主线程
- 静态 P4 状态无 Domain Reload 清理
- `BuildModSignature` 碰撞风险
- `P4EditFiles` 逐文件 checkout（应批量）
- `FindAssetPathByName` 三次 FindAssets
- `FixRemoveHiddenChildren` 只处理直接子物体
- 重复 `Path.GetDirectoryName(Application.dataPath)`

---

## 四、P4AssetHelper.cs（534 行）

### PA-C1 🔴 RunP4 同步 ReadToEnd 死锁
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **归并**：→ SYS-01

### PA-C2 🔴 IsOpenForEdit 在 OnGUI 调用
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **详情**：同步 P4 命令阻塞渲染

### PA-C3 🔴 命令注入
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **归并**：→ SYS-06

### PA-C4 🔴 Process handle 泄漏
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **详情**：Process 对象未 using/Dispose

### PA-C5 🔴 GetP4ExePath 超时处理不当
- **状态**：⬜ 未修 | **发现**：2026-03-30

### PA-M1~M8 🟡 中等问题（8 个）
- 缓存缺失、错误处理不足、硬编码路径、重试逻辑缺失、编码假设（UTF-8）等

---

## 五、MeshDecimator.cs（1099 行）

### MD-C1 🔴 IsFlipped 热路径 new bool[] 堆分配
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **详情**：QEM 算法内层循环每次调用分配数组，严重 GC 压力

### MD-C2 🔴 硬编码 100 次迭代限制
- **状态**：⬜ 未修 | **发现**：2026-03-30
- **详情**：高面数网格可能达不到目标面数

### MD-C3 🔴 折叠后 stale references 未清理
- **状态**：⬜ 未修 | **发现**：2026-03-30

### MD-C4 🔴 插值公式错误
- **状态**：⬜ 未修 | **发现**：2026-03-30

### MD-C5 🔴 实例状态非可重入
- **状态**：⬜ 未修 | **发现**：2026-03-30

### MD-M1~M8 🟡 中等问题（8 个）
- 缺少进度回调、无法取消、法线/UV 退化检测缺失、边界顶点未加权保护等

---

## 六、核心文件（Window / Data / Settings / Styles）

### CORE-M1 🟡 SceneCraftWindow 400+ 字段 God Class → SYS-03
### CORE-M2 🟡 SceneCraftWindow 12+ OnGUI GUIStyle → SYS-02
### CORE-M3 🟡 EditorPrefs 双写（部分设置同时写 EditorPrefs 和 ScriptableObject）
### CORE-M4 🟡 SceneCraftData Debug.Log 遗留生产代码
### CORE-M5 🟡 SceneCraftData magic numbers
### CORE-M6 🟡 SceneCraftSettings `_instance != null` Unity 假 null
### CORE-M7 🟡 SceneCraftSettings 无 Domain Reload 清理
### CORE-M8 🟡 SceneCraftStyles 无 Domain Reload 清理
### CORE-M9 🟡 SceneCraftStyles Color hash 浮点精度

---

## 修复优先级快速索引

| 优先级 | 问题 | 工作量 | 核心理由 |
|--------|------|--------|----------|
| **P0** | SAC-C4 面数只算 submesh 0 | ⭐ | 检查规则核心计算错误 |
| **P1** | SYS-01 Process 死锁 ×4 | ⭐⭐ | 编辑器卡死 |
| **P2** | SAC-C2 PrefabEditScope 异常保存 | ⭐ | Prefab 数据损坏 |
| **P3** | SAC-C5/C6 模糊匹配 | ⭐⭐ | 自动修复改错文件 |
| **P4** | SYS-02 GUIStyle 缓存 ×62 | ⭐⭐ | GC 压力 |
| **P5** | 空 catch / 非原子写入 | ⭐ | 数据安全 |
| **P6** | SYS-06 命令注入 | ⭐ | 路径特殊字符 |
| **P7** | DRY 违规 | ⭐⭐⭐ | 可维护性 |
| **P8** | SYS-03 God Class | ⭐⭐⭐⭐ | 长期架构 |
| **P9** | SYS-04 P4 基础设施统一 | ⭐⭐⭐ | 长期架构 |
