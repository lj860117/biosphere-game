# SceneCraft（场景工坊）架构速查

> **最后更新**：2026-03-30（新增维护归属章节）  
> **源码位置**：`G:\Project_15hb\client\unity\Assets\ArtOnly\SceneCraft\Editor\`  
> **命名空间**：`SceneCraftKit`  
> **文件数量**：28 个 .cs 文件  
> **总代码量**：约 30,000+ 行

---

## 一、整体架构概览

```
SceneCraft/Editor/
├── 主窗口（partial class SceneCraftWindow : EditorWindow）── 17 个文件
│   ├── SceneCraftWindow.cs              主入口 + 框架
│   ├── SceneCraftWindow.Sync.cs         P4 同步核心逻辑
│   ├── SceneCraftWindow.SyncUI.cs       同步 UI 绘制
│   ├── SceneCraftWindow.SyncSafe.cs     安全同步过滤
│   ├── SceneCraftWindow.Compare.cs      对比功能
│   ├── SceneCraftWindow.P4.cs           P4 引擎集成
│   ├── SceneCraftWindow.P4UI.cs         P4 连接 UI
│   ├── SceneCraftWindow.P4Login.cs      P4 登录流程
│   ├── SceneCraftWindow.Scale.cs        缩放 Prefab 功能
│   ├── SceneCraftWindow.ScaleUI.cs      缩放 UI 绘制
│   ├── SceneCraftWindow.LOD.cs          LOD 管理
│   ├── SceneCraftWindow.Replace.cs      Prefab 替换
│   ├── SceneCraftWindow.Rename.cs       批量重命名
│   ├── SceneCraftWindow.Search.cs       搜索功能
│   ├── SceneCraftWindow.Trace.cs        溯源功能
│   ├── SceneCraftWindow.Batch.cs        批处理
│   └── SceneCraftWindow.Debug.cs        调试页签
│
├── 支撑文件
│   ├── SceneCraftData.cs                数据定义（枚举/结构体/常量）
│   ├── SceneCraftStyles.cs              GUIStyle 缓存
│   ├── SceneCraftSettings.cs            ScriptableObject 配置持久化
│   ├── SceneCraftHub.cs                 工具总控面板
│   ├── SceneCraftSubWindows.cs          子窗口集合
│   └── SceneCraftReadme.cs              帮助文档窗口
│
└── 独立工具
    ├── P4SubmitChecker.cs               P4 提交预检工具（~6874行）
    ├── SceneAssetChecker.cs             场景资源检查器（~5995行）
    ├── ModelExporterWindow.cs           模型导出工具（~5285行）
    ├── MeshDecimator.cs                 网格减面器（~1100行）
    ├── DisLODGroupTool.cs               DisLODGroup 管理工具（~739行）
    ├── AssetLowercaseRenamer.cs         资源小写重命名工具（~930行）
    └── P4AssetHelper.cs                 P4 资产辅助类（~534行）
```

---

## 二、主窗口 — SceneCraftWindow（partial class，17 文件）

### 2.1 SceneCraftWindow.cs — 主入口 + 框架

**约 2685 行** | 主菜单入口、页签系统、全局字段、OnGUI 调度

**核心字段：**
```csharp
// 页签系统
private int _selectedTab = 0;
private readonly string[] _tabNames;

// P4 连接状态
private string _p4ExePath;
private string _p4Port;
private string _p4User;
private string _p4Client;
private bool _isP4Connected;
private int _p4LoginState;      // -2=从未检测, 0=失败, 1=成功

// 同步相关
private List<P4FileEntry> _syncFileList;
private Vector2 _syncScrollPos;

// 配置
private const string PREFS_PREFIX = "PrefabMaster_";   // 向后兼容
private const string TRACEABILITY_PREFIX = "PrefabMaster_";
```

**核心方法：**
```csharp
[MenuItem("EcoEngine/SceneCraft 场景工坊")]
static void ShowWindow();
void OnEnable();                    // 初始化、加载配置
void OnGUI();                       // 主绘制调度 → 根据 _selectedTab 派发
void OnDestroy();                   // 清理
```

**逻辑分区（#region）：**
- `Fields & Constants` — 全局字段、常量、PREFS_PREFIX
- `Initialization` — OnEnable、菜单入口
- `Tab System` — 页签切换、OnGUI 主调度
- `Utility Methods` — 通用辅助方法
- `Settings Migration` — EditorPrefs → ScriptableObject 配置迁移

---

### 2.2 SceneCraftWindow.Sync.cs — P4 同步核心逻辑

**约 2550 行** | `p4 sync` 的核心业务逻辑

**核心方法：**
```csharp
void ExecuteSync();                     // 执行同步
void PreviewSync();                     // 预览待同步文件
void ParseSyncPreview(string output);   // 解析 p4 sync -n 输出
void BuildSyncTree();                   // 构建文件树形结构
void FilterSyncFiles();                 // 过滤/分类文件
bool IsArtFocusPath(string path);       // 判断是否美术焦点路径
bool NeedsUnityRestart(string path);    // 判断是否需关 Unity
```

**关键数据结构：**
```csharp
class P4FileEntry {
    string depotPath;
    string clientPath;
    string action;       // add/edit/delete/...
    bool isConflict;
    bool needsUnityRestart;
    bool isArtFocus;
    bool isSkipped;
}

class SyncTreeNode {
    string name;
    string fullPath;
    List<SyncTreeNode> children;
    P4FileEntry fileEntry;   // 叶子节点才有
    bool parentIsArt;        // 继承父节点美术标记
}
```

**逻辑分区：**
- `Sync Core` — 同步执行、预览
- `File Parsing` — P4 输出解析
- `Tree Building` — 文件树构建
- `File Classification` — 文件分类（美术/场景/冲突/需关Unity）
- `ART_FOCUS_FOLDERS` — 美术焦点目录定义

---

### 2.3 SceneCraftWindow.SyncUI.cs — 同步 UI 绘制

**约 1500 行** | 同步预览列表的 UI 绘制

**核心方法：**
```csharp
void DrawSyncTab();                         // 同步页签主绘制
void DrawSyncToolbar();                     // 顶部工具栏（按钮行）
void DrawColorLegend();                     // 颜色图例条（固定在 ScrollView 外）
void DrawSyncTree(SyncTreeNode node, int indent);   // 递归绘制树形列表
void DrawFileEntry(P4FileEntry entry);      // 绘制单个文件条目
```

**逻辑分区：**
- `Sync Tab Layout` — 整体布局
- `Toolbar` — 预览/同步按钮、过滤选项
- `Color Legend` — ■ 方块颜色图例
- `Tree Rendering` — 树形递归绘制
- `File Row` — 单行文件条目绘制

---

### 2.4 SceneCraftWindow.SyncSafe.cs — 安全同步过滤

**约 600 行** | 「仅安全」一键过滤逻辑

**核心方法：**
```csharp
void ApplySafeFilter();                     // 应用安全过滤
bool IsSafeToSync(P4FileEntry entry);       // 判断文件是否安全
List<string> GetUnsafeReasons(P4FileEntry entry);   // 获取不安全原因列表
```

**逻辑分区：**
- `Safe Filter Logic` — 安全过滤规则
- `Exclusion Rules` — 排除冲突文件、需关Unity文件

---

### 2.5 SceneCraftWindow.Compare.cs — 对比功能

**约 800 行** | 文件对比/差异查看

**核心方法：**
```csharp
void DrawCompareTab();                      // 对比页签
void CompareFiles(string path1, string path2);  // 执行对比
void ShowDiffResult();                      // 展示差异结果
```

---

### 2.6 SceneCraftWindow.P4.cs — P4 引擎集成

**约 2300 行** | P4 命令执行引擎、环境探测

**核心方法：**
```csharp
string RunP4Command(string args);                    // 执行 p4 命令
string RunP4Command(string args, int timeoutMs);     // 带超时
ProcessResult RunP4Process(string args);             // 底层 Process 封装
void DetectP4Environment();                          // 环境自动探测
string FindP4ExePath();                              // 多级回退查找 p4.exe
void ScanP4Config();                                 // 读取 p4 set 配置
List<P4WorkspaceInfo> ListWorkspaces();              // 列出 workspace
void ApplyWorkspace(P4WorkspaceInfo ws);             // 应用 workspace
string GetP4ExePath();                               // 获取 p4.exe 路径（共享方法）
```

**关键字段：**
```csharp
private string _p4ExePath;                  // p4.exe 完整路径
private bool _p4EnvScanned = false;         // 环境是否已扫描（缓存标记）
private List<P4WorkspaceInfo> _workspaces;  // workspace 列表
private int _selectedWorkspaceIdx;          // 当前选中 workspace 索引
```

**p4.exe 查找优先级：**
1. EditorPrefs 缓存路径
2. 内嵌 `Bin/p4.exe`
3. `PATH` 环境变量
4. 已运行的 p4/p4v 进程路径
5. 常见安装路径（`C:\Program Files\Perforce\`）

**逻辑分区：**
- `P4 Command Execution` — 命令执行封装
- `P4 Environment Detection` — 环境探测
- `P4 Exe Path Resolution` — p4.exe 路径查找
- `P4 Config Parsing` — p4 set 输出解析
- `Workspace Management` — workspace 列表和切换

---

### 2.7 SceneCraftWindow.P4UI.cs — P4 连接 UI

**约 1200 行** | P4 连接引导分步 UI

**核心方法：**
```csharp
void DrawP4ConnectionTab();                 // P4 连接页签
void DrawStep1_FindP4Exe();                 // Step1: 查找 p4.exe
void DrawStep2_ScanEnvironment();           // Step2: 扫描环境
void DrawStep3_Login();                     // Step3: 登录
void DrawWorkspaceSelector();               // Workspace 选择器
void DrawP4StatusBar();                     // 连接状态栏
```

**状态变量：**
```csharp
private int _p4Step1State = -2;     // -2=从未检测
private int _p4Step2State = -2;
private int _p4Step3State = -2;     // 即 _p4LoginState
```

---

### 2.8 SceneCraftWindow.P4Login.cs — P4 登录流程

**约 800 行** | 密码登录、ticket 管理

**核心方法：**
```csharp
void AttemptP4Login(string password);       // 尝试登录
void HandleTicketExpired();                 // ticket 过期处理
bool CheckP4LoginStatus();                  // 检查登录状态
void ShowPasswordDialog();                  // 弹出密码输入框
```

**关键类：**
```csharp
class EditorInputDialog : EditorWindow {    // 通用输入对话框
    string _inputText;
    System.Action<string> _onConfirm;
    // 支持回车确认
}
```

---

### 2.9 SceneCraftWindow.Scale.cs — 缩放 Prefab 功能

**约 1800 行** | Prefab 缩放的核心算法

**核心方法：**
```csharp
void ScalePrefab(GameObject prefab, float scaleFactor);
void ScaleTransform(Transform t, float factor);
void ScaleMeshVertices(Mesh mesh, float factor);
void ScaleColliders(GameObject go, float factor);
void ScaleParticleSystem(ParticleSystem ps, float factor);
void ScaleAnimationClips(AnimationClip[] clips, float factor);
void ProcessLODGroup(LODGroup lodGroup, float factor);
```

**逻辑分区：**
- `Scale Core` — 缩放主逻辑
- `Transform Scaling` — Transform 组件缩放
- `Mesh Scaling` — Mesh 顶点缩放
- `Collider Scaling` — 碰撞体缩放
- `Particle Scaling` — 粒子系统缩放
- `Animation Scaling` — 动画曲线缩放
- `LOD Scaling` — LOD 组缩放

---

### 2.10 SceneCraftWindow.ScaleUI.cs — 缩放 UI 绘制

**约 700 行** | 缩放功能的 UI 绘制

**核心方法：**
```csharp
void DrawScaleTab();                        // 缩放页签
void DrawScaleOptions();                    // 缩放选项面板
void DrawScalePreview();                    // 缩放预览
void DrawScaleHistory();                    // 缩放历史记录
```

---

### 2.11 SceneCraftWindow.LOD.cs — LOD 管理

**约 1500 行** | LOD 组管理、DisLODGroup 操作

**核心方法：**
```csharp
void DrawLODTab();                          // LOD 页签
void ScanLODGroups();                       // 扫描场景中的 LOD 组
void SetLODDistances(LODGroup group, float[] distances);
void BatchSetLOD();                         // 批量设置 LOD
// DisLODGroup 相关（通过反射访问 EcoEngine.Runtime.dll）
object GetDisLODComponent(GameObject go);
void SetDisLODProperty(object comp, string prop, object value);
```

**反射访问：**
```csharp
// DisLODGroup 在 EcoEngine.Runtime.dll 中，非公开 API
private System.Type _disLODGroupType;       // 通过反射获取
private MethodInfo _setDistanceMethod;
```

---

### 2.12 SceneCraftWindow.Replace.cs — Prefab 替换

**约 900 行** | 场景中 Prefab 批量替换

**核心方法：**
```csharp
void DrawReplaceTab();                      // 替换页签
void ReplacePrefabInScene(GameObject source, GameObject target);
void BatchReplacePrefabs();                 // 批量替换
void PreviewReplace();                      // 预览替换结果
```

---

### 2.13 SceneCraftWindow.Rename.cs — 批量重命名

**约 800 行** | 资源/对象批量重命名

**核心方法：**
```csharp
void DrawRenameTab();                       // 重命名页签
void BatchRename(List<Object> objects, string pattern);
void PreviewRename();                       // 预览重命名
string ApplyRenamePattern(string name, string pattern, int index);
```

---

### 2.14 SceneCraftWindow.Search.cs — 搜索功能

**约 900 行** | 资源搜索、引用查找

**核心方法：**
```csharp
void DrawSearchTab();                       // 搜索页签
void SearchAssets(string query);            // 搜索资源
void FindReferences(Object target);         // 查找引用
void ShowSearchResults();                   // 显示搜索结果
```

---

### 2.15 SceneCraftWindow.Trace.cs — 溯源功能

**约 1200 行** | Prefab 实例溯源

**核心方法：**
```csharp
void DrawTraceTab();                        // 溯源页签
void TraceSelectedObjects();                // 对选中对象执行溯源
void BuildTraceReport();                    // 构建溯源报告
void SaveTraceData();                       // 保存溯源数据（TRACEABILITY_PREFIX）
void LoadTraceData();                       // 加载溯源数据
```

---

### 2.16 SceneCraftWindow.Batch.cs — 批处理

**约 1000 行** | 批量操作功能

**核心方法：**
```csharp
void DrawBatchTab();                        // 批处理页签
void BatchProcess(List<GameObject> targets, System.Action<GameObject> operation);
void ShowBatchProgress(int current, int total);
```

---

### 2.17 SceneCraftWindow.Debug.cs — 调试页签

**约 500 行** | 开发调试功能

**核心方法：**
```csharp
void DrawDebugTab();                        // 调试页签
void DumpP4State();                         // 输出 P4 状态信息
void DumpSyncState();                       // 输出同步状态
void ResetAllPrefs();                       // 重置所有 EditorPrefs
```

---

## 三、支撑文件

### 3.1 SceneCraftData.cs — 数据定义

**约 600 行** | 枚举、结构体、常量

**关键类型：**
```csharp
// P4 文件操作类型
enum P4Action { Add, Edit, Delete, MoveAdd, MoveDelete, Branch, Integrate }

// 文件条目
class P4FileEntry {
    string depotPath, clientPath, localPath;
    P4Action action;
    int revision;
    bool isConflict, needsUnityRestart, isArtFocus, isSkipped;
}

// 同步树节点
class SyncTreeNode { ... }

// P4 Workspace 信息
class P4WorkspaceInfo {
    string name, root, stream, description;
    bool isCurrentMatch;
}

// Process 执行结果
struct ProcessResult {
    int exitCode;
    string stdout, stderr;
}

// 美术焦点目录列表
static readonly string[] ART_FOCUS_FOLDERS = { "scene_making/scenes", ... };

// 需关 Unity 同步的目录
static readonly string[] NEEDS_UNITY_RESTART_FOLDERS = { "Settings", "scripts_dll", ... };
```

---

### 3.2 SceneCraftStyles.cs — GUIStyle 缓存

**约 400 行** | GUIStyle 统一管理，懒加载单例

**设计模式：**
```csharp
static class SceneCraftStyles {
    // 懒加载缓存
    private static GUIStyle _headerStyle;
    public static GUIStyle HeaderStyle => _headerStyle ??= new GUIStyle(EditorStyles.boldLabel) { fontSize = 14 };
    
    private static GUIStyle _fileEntryStyle;
    public static GUIStyle FileEntryStyle => _fileEntryStyle ??= ...;
    
    // 颜色定义
    public static readonly Color ArtFocusColor = new Color(1f, 0.8f, 0.2f);
    public static readonly Color ConflictColor = new Color(1f, 0.3f, 0.3f);
    public static readonly Color NeedsRestartColor = new Color(0.7f, 0.5f, 1.0f);  // 紫色
    public static readonly Color SkippedColor = ...;
    public static readonly Color SafeColor = ...;
    
    // 重置方法（域重载时调用）
    public static void Reset() { _headerStyle = null; ... }
}
```

---

### 3.3 SceneCraftSettings.cs — ScriptableObject 配置持久化

**约 500 行** | 替代 EditorPrefs 的配置持久化方案

**核心设计：**
```csharp
[CreateAssetMenu]
class SceneCraftSettings : ScriptableObject {
    // 单例访问
    private static SceneCraftSettings _instance;
    public static SceneCraftSettings Instance => _instance ??= LoadOrCreate();
    
    // P4 配置
    [SerializeField] string p4Port = "192.168.31.15:1667";
    [SerializeField] string p4User;
    [SerializeField] string p4Client;
    [SerializeField] string p4ExePath;
    
    // 同步配置
    [SerializeField] List<string> artFocusFolders;
    [SerializeField] List<string> needsRestartFolders;
    [SerializeField] bool autoPreviewOnOpen = true;
    
    // 保存
    static SceneCraftSettings LoadOrCreate();   // 从 AssetDatabase 加载或创建
    void Save();                                 // EditorUtility.SetDirty + AssetDatabase.SaveAssets
}
```

**注意**：配置从 EditorPrefs 迁移到 ScriptableObject，但 `PREFS_PREFIX` 保持旧值以向后兼容。`SceneCraftWindow.cs` 中有 Settings Migration region 处理迁移逻辑。

---

### 3.4 SceneCraftHub.cs — 工具总控面板

**约 400 行** | 快速启动各子工具的面板

**核心方法：**
```csharp
class SceneCraftHub : EditorWindow {
    [MenuItem("EcoEngine/SceneCraft Hub")]
    static void ShowWindow();
    void OnGUI();                   // 绘制工具卡片网格
    void DrawToolCard(string name, string desc, System.Action onClick);
}
```

**功能**：以卡片网格展示所有 SceneCraft 子工具，一键打开。

---

### 3.5 SceneCraftSubWindows.cs — 子窗口集合

**约 600 行** | 弹出式子窗口

**包含的子窗口：**
```csharp
class EditorInputDialog : EditorWindow { ... }     // 通用输入对话框（密码/文本）
class ProgressWindow : EditorWindow { ... }         // 进度条窗口
class DetailViewWindow : EditorWindow { ... }       // 详情查看窗口
```

---

### 3.6 SceneCraftReadme.cs — 帮助文档窗口

**约 300 行** | 内嵌帮助文档

**核心方法：**
```csharp
class SceneCraftReadme : EditorWindow {
    [MenuItem("EcoEngine/SceneCraft/帮助文档")]
    static void ShowWindow();
    void OnGUI();                   // 渲染 markdown 风格帮助内容
}
```

---

## 四、独立工具

### 4.1 P4SubmitChecker.cs — P4 提交预检工具

**约 6874 行** | SceneCraft 套件中最大的单独工具

**核心类：** `P4SubmitChecker : EditorWindow`

**功能概述**：P4 提交前自动检查，包括文件命名规范、资源引用完整性、场景合法性、文件大小检查等。

**核心方法：**
```csharp
[MenuItem("EcoEngine/SceneCraft/P4 提交预检")]
static void ShowWindow();
void RunAllChecks();                        // 执行所有检查
void CheckFileNaming(P4FileEntry entry);    // 文件命名规范检查
void CheckAssetReferences();                // 资源引用完整性
void CheckSceneValidity();                  // 场景合法性
void CheckFileSize();                       // 文件大小检查
void CheckMissingReferences();              // 缺失引用检查
void GenerateReport();                      // 生成检查报告
```

**主要逻辑分区：**
- `Check Rules` — 检查规则定义
- `File Checks` — 单文件检查
- `Scene Checks` — 场景级检查
- `Reference Checks` — 引用完整性
- `Report Generation` — 报告生成
- `P4 Integration` — P4 changelist 操作
- `UI` — 检查结果展示

**依赖**：调用 `P4AssetHelper.GetP4ExePath()` 获取 p4.exe 路径。

---

### 4.2 SceneAssetChecker.cs — 场景资源检查器

**约 5995 行** | 场景级资源健康检查

**核心类：** `SceneAssetChecker : EditorWindow`

**功能概述**：扫描场景中的资源使用情况，检测问题（缺失引用、重复资源、过大纹理等）。

**核心方法：**
```csharp
[MenuItem("EcoEngine/SceneCraft/场景资源检查")]
static void ShowWindow();
void ScanCurrentScene();                    // 扫描当前场景
void CheckMissingComponents();              // 缺失组件检查
void CheckTextureSize();                    // 纹理尺寸检查
void CheckDuplicateMaterials();             // 重复材质检查
void CheckMeshComplexity();                 // 网格复杂度检查
void CheckLightmapSettings();              // 光照贴图设置检查
void GenerateAssetReport();                 // 生成资源报告
```

**主要逻辑分区：**
- `Scene Scan` — 场景扫描
- `Component Checks` — 组件检查
- `Texture Checks` — 纹理检查
- `Material Checks` — 材质检查
- `Mesh Checks` — 网格检查
- `Lightmap Checks` — 光照贴图检查
- `Report` — 报告生成与展示
- `Auto Fix` — 自动修复功能

---

### 4.3 ModelExporterWindow.cs — 模型导出工具

**约 5285 行** | 模型导出/转换工具

**核心类：** `ModelExporterWindow : EditorWindow`

**功能概述**：将 Unity 场景/Prefab 中的模型导出为外部格式，支持 LOD、材质、动画的导出处理。

**核心方法：**
```csharp
[MenuItem("EcoEngine/SceneCraft/模型导出")]
static void ShowWindow();
void ExportSelected();                      // 导出选中对象
void ExportScene();                         // 导出整个场景
void ProcessMeshForExport(Mesh mesh);       // 处理网格数据
void ProcessMaterialsForExport();           // 处理材质数据
void ProcessAnimationsForExport();          // 处理动画数据
void WriteFBX(string path);                 // 写入 FBX 格式
void WriteOBJ(string path);                 // 写入 OBJ 格式
```

**主要逻辑分区：**
- `Export Core` — 导出核心逻辑
- `Mesh Processing` — 网格处理
- `Material Processing` — 材质处理
- `Animation Processing` — 动画处理
- `File Writers` — 文件格式写入（FBX/OBJ）
- `UI` — 导出选项和进度 UI
- `LOD Export` — LOD 层级导出

---

### 4.4 MeshDecimator.cs — 网格减面器

**约 1100 行** | 网格简化/减面算法

**核心类：** `MeshDecimator`（静态工具类）+ `MeshDecimatorWindow : EditorWindow`

**功能概述**：基于 QEM（Quadric Error Metrics）算法的网格减面工具。

**核心方法：**
```csharp
// 算法核心
static Mesh Decimate(Mesh source, float targetRatio);
static Mesh Decimate(Mesh source, int targetTriCount);
static void ComputeQuadrics(Vector3[] vertices, int[] triangles);
static int CollapseEdge(int v1, int v2);    // 边折叠操作
static float ComputeEdgeCost(int v1, int v2); // 计算折叠代价

// 窗口
[MenuItem("EcoEngine/SceneCraft/网格减面")]
static void ShowWindow();
void OnGUI();                               // 减面参数 UI
void Preview();                             // 预览减面结果
```

**算法分区：**
- `QEM Core` — 二次误差度量核心算法
- `Edge Collapse` — 边折叠操作
- `Topology` — 拓扑维护
- `Preview` — 预览渲染
- `Window UI` — 编辑器窗口 UI

---

### 4.5 DisLODGroupTool.cs — DisLODGroup 管理工具

**约 739 行** | EcoEngine 自研 DisLODGroup 组件的管理工具

**核心类：** `DisLODGroupTool : EditorWindow`

**功能概述**：通过反射操作 EcoEngine.Runtime.dll 中的 DisLODGroup 组件，提供批量设置/检查功能。

**核心方法：**
```csharp
[MenuItem("EcoEngine/SceneCraft/DisLOD 管理")]
static void ShowWindow();
void ScanDisLODGroups();                    // 扫描场景中的 DisLODGroup
void BatchSetDistances(float[] distances);  // 批量设置距离
void ValidateDisLODSetup();                 // 验证 DisLOD 配置
// 反射调用
System.Type GetDisLODGroupType();           // 反射获取类型
object GetComponent(GameObject go);          // 反射获取组件
void SetProperty(object comp, string name, object value);  // 反射设属性
```

**关键特点**：
- **全部通过反射**访问 `EcoEngine.Runtime.DisLODGroup`（该类型在 Runtime DLL 中）
- 缓存反射结果避免每帧查找

---

### 4.6 AssetLowercaseRenamer.cs — 资源小写重命名工具

**约 930 行** | 批量将资源文件名转为小写

**核心类：** `AssetLowercaseRenamer : EditorWindow`

**功能概述**：扫描项目中文件名含大写的资源，批量重命名为全小写（适配某些平台对大小写敏感的要求）。

**核心方法：**
```csharp
[MenuItem("EcoEngine/SceneCraft/资源小写重命名")]
static void ShowWindow();
void ScanUppercaseAssets();                 // 扫描含大写的资源
void PreviewRename();                       // 预览重命名
void ExecuteRename();                       // 执行重命名
bool IsExcluded(string path);               // 排除规则
void HandleP4Rename(string oldPath, string newPath);  // P4 rename 操作
```

**主要逻辑分区：**
- `Scan` — 扫描逻辑
- `Rename Core` — 重命名核心
- `P4 Integration` — P4 rename 集成
- `Exclusion Rules` — 排除规则（脚本文件、特殊目录等）
- `UI` — 扫描结果列表和操作 UI

---

### 4.7 P4AssetHelper.cs — P4 资产辅助类

**约 534 行** | P4 操作的共享工具类

**核心类：** `static class P4AssetHelper`

**功能概述**：为所有需要 P4 操作的工具提供共享方法。

**核心方法：**
```csharp
static string GetP4ExePath();                           // 获取 p4.exe 路径
static ProcessResult RunP4(string args);                // 执行 p4 命令
static bool P4Edit(string filePath);                    // p4 edit
static bool P4Add(string filePath);                     // p4 add
static bool P4Delete(string filePath);                  // p4 delete
static bool P4Rename(string oldPath, string newPath);   // p4 move
static bool P4Revert(string filePath);                  // p4 revert
static string GetP4FileStat(string filePath);           // p4 fstat
static bool IsFileInPerforce(string filePath);          // 判断文件是否在 P4 中
```

**被调用方**：`P4SubmitChecker`、`AssetLowercaseRenamer`、`SceneCraftWindow.P4.cs`

---

## 五、跨文件依赖关系

```
SceneCraftWindow（17 partial files）
    ├── 引用 → SceneCraftData.cs       （数据类型）
    ├── 引用 → SceneCraftStyles.cs     （UI 样式）
    ├── 引用 → SceneCraftSettings.cs   （配置读写）
    ├── 引用 → SceneCraftSubWindows.cs （弹窗）
    ├── 引用 → P4AssetHelper.cs        （P4 共享方法）
    └── 反射 → EcoEngine.Runtime.dll   （DisLODGroup）

P4SubmitChecker
    ├── 引用 → P4AssetHelper.cs
    ├── 引用 → SceneCraftData.cs
    └── 引用 → SceneCraftStyles.cs

SceneAssetChecker
    ├── 引用 → SceneCraftData.cs
    └── 引用 → SceneCraftStyles.cs

ModelExporterWindow
    └── 引用 → SceneCraftData.cs

AssetLowercaseRenamer
    ├── 引用 → P4AssetHelper.cs
    └── 引用 → SceneCraftData.cs

DisLODGroupTool
    └── 反射 → EcoEngine.Runtime.dll

MeshDecimator
    └── 独立（无外部依赖）

SceneCraftHub
    └── 引用各工具窗口的 ShowWindow() 方法

SceneCraftReadme
    └── 独立
```

---

## 六、关键设计决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 单文件大类 vs 拆分 | partial class 拆分到 17 文件 | 单窗口功能内聚，partial 既保持单类优势又方便导航 |
| 配置存储 | ScriptableObject（新）+ EditorPrefs（兼容） | SO 可版本控制、可序列化，但保留旧 prefix 读取旧配置 |
| P4 集成方式 | 内嵌 p4.exe + Process 调用 | 零安装依赖，用户不需要装 P4 客户端 |
| DisLODGroup 访问 | 反射 | EcoEngine Runtime DLL 中的非公开 API，无法直接引用 |
| GUIStyle 管理 | 静态懒加载 + Reset | 避免每帧 new GUIStyle，域重载时 Reset 防止泄漏 |
| 树形列表 | 自定义递归绘制 | TreeView 控件灵活性不足以实现颜色图例+父子继承+混合过滤 |
| 文件名规范 | 全小写（AssetLowercaseRenamer） | 目标平台大小写敏感，源头规范化 |

---

## 七、维护归属

SceneCraft 套件中大部分模块由厉害了哥（hermanlei）维护，但以下模块由 **cat1986** 维护：

| 模块 | 页签/入口 | 对应代码 | 维护者 | 备注 |
|------|----------|---------|--------|------|
| Hierarchy 文件夹 | `H` 页签 | SceneCraftWindow 内嵌页签 | **cat1986** | 请勿修改 |
| 模型导出 & 检查 | `E` 页签 | `ModelExporterWindow.cs` | **cat1986** | 请勿修改 |

**AI 行为规则**：
- 对 cat1986 维护的模块，只遵守铁律（安全底线），**不主动改代码、不推重构建议**
- 如果用户需要修改这些模块，提醒用户"这是 cat1986 维护的模块，建议先跟 cat1986 沟通"
- 这些模块的 bug 或优化建议，记录下来但不直接动手

---

## 八、使用本文档

**当需要修改 SceneCraft 代码时：**

1. 先查本文档确定目标功能在哪个文件
2. 只读取需要修改的文件（不必遍历全部 28 个文件）
3. 注意 partial class 的字段可能定义在其他 partial 文件中
4. 修改 P4 相关逻辑时检查 `P4AssetHelper.cs` 是否需要同步更新
5. UI 样式修改统一在 `SceneCraftStyles.cs` 中进行
6. 新增配置项添加到 `SceneCraftSettings.cs` 中

**快速定位指南：**

| 想改什么 | 去哪个文件 |
|----------|-----------|
| P4 同步逻辑 | `Sync.cs` + `SyncUI.cs` + `SyncSafe.cs` |
| P4 连接/登录 | `P4.cs` + `P4UI.cs` + `P4Login.cs` |
| Prefab 缩放 | `Scale.cs` + `ScaleUI.cs` |
| LOD 管理 | `LOD.cs` + `DisLODGroupTool.cs` |
| 颜色/样式 | `SceneCraftStyles.cs` |
| 数据结构 | `SceneCraftData.cs` |
| 配置项 | `SceneCraftSettings.cs` |
| 提交预检 | `P4SubmitChecker.cs` |
| 场景检查 | `SceneAssetChecker.cs` |
| 模型导出 | `ModelExporterWindow.cs` |
| 网格减面 | `MeshDecimator.cs` |
| 批量重命名 | `Rename.cs`（场景内）/ `AssetLowercaseRenamer.cs`（资源文件名） |
