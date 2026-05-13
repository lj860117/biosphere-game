# SceneCraft 检查规则详细参考

> **最后更新**：2026-04-02
> **用途**：AI 分析检查报告时参考，不需要每次都读，遇到具体检查项时查阅

---

## 一、SceneAssetChecker 检查项

### 1.1 DrawCallCount（DrawCall 数量）

- **阈值**：≤ 8
- **严重度**：🔴 导出阻塞
- **检查逻辑**：统计 Prefab 根节点下所有 Renderer 组件使用的不同材质数
- **常见问题**：
  - 多个子网格使用不同材质 → 合并材质或合并网格
  - LOD0 材质数过多 → 检查是否有多余的子材质
- **修复建议**：
  - 合并使用相同 Shader 的材质
  - 使用纹理图集（Texture Atlas）减少材质数
  - 检查是否有多余的 Renderer 组件

### 1.2 NormalizedTransform（Transform 单位化）

- **阈值**：Position=(0,0,0), Rotation=(0,0,0), Scale=(1,1,1)
- **严重度**：🔴 导出阻塞
- **检查逻辑**：检查 Prefab 根 Transform 是否为单位值
- **常见问题**：美术在制作时移动了根节点位置
- **修复建议**：
  - 在 Unity 中选中 Prefab → Reset Transform
  - 或在 DCC 工具中重新导出，确保枢轴点在原点
- **SceneCraft 自动修复**：SceneAssetChecker 有 Reset Transform 按钮

### 1.3 MissingScripts（丢失脚本）

- **阈值**：0 个
- **严重度**：🔴 导出阻塞
- **检查逻辑**：遍历所有 Component，检查是否有 null
- **常见问题**：脚本文件被删除或重命名，但 Prefab 引用还在
- **修复建议**：
  - 手动删除 Missing 的 Component
  - 或用 `GameObjectUtility.RemoveMonoBehavioursWithMissingScript(go)` 批量清理

### 1.4 HiddenChildren（隐藏子物体）

- **阈值**：0 个
- **严重度**：🟡 警告
- **检查逻辑**：检查 `gameObject.activeSelf == false` 的子节点
- **常见问题**：美术临时隐藏了参考物体忘记删除
- **修复建议**：删除不需要的隐藏子物体

### 1.5 VariantPrefab（变体 Prefab）

- **阈值**：不允许
- **严重度**：🔴 导出阻塞
- **检查逻辑**：检查 Prefab 是否为 Variant 类型
- **常见问题**：美术用了 Prefab Variant 但导出工具不支持
- **修复建议**：将 Variant 解包为独立 Prefab

### 1.6 LegalFileName（合法文件名）

- **阈值**：全小写 + 合法字符（字母/数字/下划线）
- **严重度**：🔴 导出阻塞
- **检查逻辑**：正则匹配文件名
- **常见问题**：
  - 文件名包含中文字符
  - 文件名有大写字母
  - 文件名有空格或特殊字符
- **修复建议**：使用 AssetLowercaseRenamer 批量重命名

### 1.7 Materials — 合法 Shader

- **阈值**：必须使用 TCDemo 系列 Shader
- **严重度**：🔴 导出阻塞
- **检查逻辑**：遍历所有 Renderer 的 SharedMaterial，检查 Shader 名称
- **合法 Shader 列表**：
  - TCDemo/TCStoneLit
  - TCDemo/TCBaseLit
  - TCDemo/TCTrunk
  - TCDemo/TCLeaf
  - （更多待补充）
- **修复建议**：使用 SceneCraft 材质生成功能重新创建材质

### 1.8 TextureImportSettings（贴图导入设置）

- **严重度**：🟡 警告
- **检查逻辑**：检查贴图压缩格式、最大尺寸等设置
- **状态**：部分实现

### 1.9 DisLODGroup（LOD 配置）

- **严重度**：🟡 警告
- **检查逻辑**：检查是否有 DisLODGroup 组件且配置合理
- **修复建议**：使用 SceneCraft LOD 管理功能批量设置

### 1.10 LODRatios（LOD 比例）

- **严重度**：🟡 警告
- **检查逻辑**：检查 LOD 各级的距离/屏占比是否合理
- **常见问题**：LOD 切换距离设置不合理，导致过早或过晚切换

### 1.11 FakeOverride（假 Override）

- **严重度**：🟡 警告
- **检查逻辑**：检查 Prefab Instance 是否有不必要的 Override
- **常见问题**：场景中的 Prefab 被意外修改了属性但没有 Apply 或 Revert
- **修复建议**：SceneCraft 有 `FixRevertSafeOverrides` 自动 Revert 安全的 Override

### 1.12 Tag（标签检查）

- **严重度**：🟢 信息
- **说明**：SceneCraft 独有检查项，检查 GameObject 标签是否正确

### 1.13 GrassShadowOff（草投影关闭）

- **严重度**：🟢 信息
- **说明**：SceneCraft 独有，草地物体应关闭投影以优化性能

### 1.14 ReferencedFBX（引用 FBX）

- **严重度**：🟢 信息
- **说明**：SceneCraft 独有，场景不应直接引用 FBX 而应引用 Prefab

---

## 二、P4SubmitChecker 检查项

### 2.1 GUID 重复检查

- **严重度**：🔴 阻塞
- **检查逻辑**：扫描 .meta 文件中的 guid 值，检测重复
- **常见原因**：复制文件夹时连 .meta 一起复制了
- **修复**：删除重复 .meta，让 Unity 重新生成

### 2.2 大小写冲突

- **严重度**：🔴 阻塞
- **检查逻辑**：检查同目录下是否有仅大小写不同的文件
- **P4 特点**：P4 服务器可能大小写不敏感，本地和服务器可能不一致
- **修复**：统一改为小写（使用 AssetLowercaseRenamer）

### 2.3 依赖完整性

- **严重度**：🔴 阻塞
- **检查逻辑**：检查提交的文件是否包含了所有依赖
- **常见问题**：改了 Prefab 但没把引用的新材质一起提交

### 2.4 Missing 引用

- **严重度**：🔴 阻塞
- **检查逻辑**：检查提交的场景/Prefab 是否有 Missing 引用

### 2.5 .meta 缺失

- **严重度**：🔴 阻塞
- **检查逻辑**：每个资产文件/文件夹必须有对应的 .meta 文件
- **修复**：让 Unity 重新生成或手动创建

### 2.6 场景 GUID

- **严重度**：🟡 警告
- **检查逻辑**：检查场景文件中引用的 GUID 是否都有效

---

## 三、报告导入格式

SceneAssetChecker 支持从大世界导出工具的 `ValidationReport.txt` 导入报告。

**格式示例**（导出工具生成的报告）：
```
[ERROR] prefab_name: DrawCall count 12 exceeds limit 8
[ERROR] prefab_name: Transform is not normalized
[WARNING] prefab_name: Hidden children found: 3
[INFO] prefab_name: Referenced FBX directly
```

SceneCraft 会解析这个报告，自动分类到对应的检查项，并在 UI 中展示带修复按钮。

---

*本文档随 SceneCraft 检查规则变更而更新。新增检查规则时追加到对应章节。*
