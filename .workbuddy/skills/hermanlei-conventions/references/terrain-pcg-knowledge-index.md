# Unity 地形编辑与程序化内容生成（PCG）知识索引

> **用途**：AI 在接到地形编辑、程序化生成、大世界场景组装等任务时，先读此文档定位方向。
> **类型**：📖 知识索引
> **维护规则**：每次调研地形/PCG 话题后更新。每月巡检时检查内容是否过时。
> **最后更新**：2026-03-30
> **保鲜周期**：每月

---

## 一、当前状态概览

### Unity 地形系统现状

| 维度 | 现状 |
|------|------|
| **Unity 内置 Terrain** | 基于 Heightmap 的地形系统，支持 Terrain Layers（最多 16 层）、树和草、WindZone |
| **性能瓶颈** | 大世界场景下 CPU-bound（DrawCall 多、Culling 开销大），LOD 不够精细 |
| **GPU Resident Drawer** | Unity 6 的 GRD 可以部分加速地形渲染（减少 CPU 开销） |
| **第三方方案** | Microsplat、MapMagic 2、Terrain Composer 2、Gaia Pro 等 |
| **Houdini 集成** | Houdini Engine for Unity，通过 HDA 导入程序化地形和散布 |

### 3A 大世界地形方案对比

| 方案 | 核心技术 | 代表项目/引擎 | Unity 可用性 |
|------|----------|-------------|-------------|
| **UE5 World Partition** | 自动分块加载/卸载 + Nanite + Virtual Heightfield Mesh | UE5 官方 | ❌ 需自实现类似方案 |
| **Unity DOTS Terrain** | ECS 驱动的地形系统（实验性） | Unity 内部实验 | ⚠️ 非公开 API |
| **Virtual Texturing + Terrain** | 地形贴图用虚拟纹理，减少 VRAM 压力 | Unity 6 URP 支持 | ✅ 可用但需配置 |
| **Clipmap 地形 LOD** | GPU 端的连续 LOD 细分方案，如 CDLOD/Geometry Clipmap | 学术+自研引擎 | ⚠️ 需自实现 |
| **Voxel Terrain** | 体素地形，支持洞穴/悬崖/任意地形 | Astroneer、Deep Rock | ⚠️ 需自实现或用插件 |

---

## 二、地形编辑前沿技术

### 2.1 GPU 驱动的地形渲染

| 技术 | 原理 | 现状 | 查找关键词 |
|------|------|------|-----------|
| **Geometry Clipmap** | 以相机为中心的多级 LOD 网格环，GPU 端采样 Heightmap | 成熟，UE/自研引擎常用 | `geometry clipmap terrain GPU` |
| **CDLOD (Continuous Distance LOD)** | GPU 端四叉树 LOD 细分 + morphing 消除 LOD 接缝 | 成熟 | `CDLOD terrain continuous LOD` |
| **GPU Tessellation Terrain** | 用 Hull/Domain Shader 在 GPU 端细分地形 mesh | 桌面端可用，移动端不支持 | `GPU tessellation terrain Unity` |
| **Virtual Heightfield Mesh (UE5)** | Runtime Virtual Texture 驱动的自适应地形网格 | UE5 独占 | `Virtual Heightfield Mesh` |
| **Mesh Shader Terrain** | 用 Mesh Shader 直接生成地形 mesh（跳过顶点流水线） | 实验性 | `mesh shader terrain rendering` |

### 2.2 大世界地形管理

| 方案 | 解决什么问题 | 实现要点 |
|------|------------|---------|
| **Terrain Streaming** | 超大地图分块加载 | Heightmap 分块 + 按相机距离异步加载卸载 + LOD 衰减 |
| **Virtual Texturing** | 地形材质 VRAM 不够 | RVT (Runtime Virtual Texture) 只加载可见 tiles 的贴图 |
| **Terrain Layers Blending** | 16 层不够用 / 混合不自然 | 基于 Height + Slope 的智能混合（Microsplat 方案）|
| **Heightmap Streaming** | 超高分辨率地形数据 | 分级 Heightmap LOD + 磁盘缓存 + GPU 采样 |
| **Scene Streaming (Additive)** | Unity 多场景方案 | 地形切分为 Scene Tiles，用 SceneManager.LoadSceneAsync Additive |

### 2.3 风格化地形技术

| 技术 | 效果 | 实现方式 |
|------|------|---------|
| **Hand-Painted Terrain Shader** | 类似风之旅人/原神的地形质感 | 自定义 Shader：减少 PBR 参数、加 Gradient Map 色调映射、用 Ramp 替代平滑光照 |
| **Triplanar Projection** | 悬崖等陡峭面无拉伸 | Shader 中三轴投影采样，按法线混合 |
| **Slope-Based Texturing** | 坡面自动草→石头→雪 | Shader 按世界空间 Normal.y 值混合材质层 |
| **Distance-Based Detail Fading** | 远处简化纹理，近处高细节 | 两套贴图 + 距离插值 |

---

## 三、程序化内容生成（PCG）

### 3.1 PCG 技术体系

| 技术 | 做什么 | 成熟度 | 适用场景 |
|------|--------|--------|---------|
| **Noise-Based Generation** | 用 Perlin/Simplex/Worley 噪声生成地形、纹理 | ✅ 成熟 | 地形高度图、洞穴、自然纹理 |
| **L-System** | 规则驱动的分形生长（植物、道路网络） | ✅ 成熟 | 树木、植物、城市道路 |
| **Wave Function Collapse (WFC)** | 基于约束的 tile 拼接 | ✅ 成熟 | 关卡布局、地牢、建筑 |
| **Poisson Disk Sampling** | 均匀随机分布点，保证最小间距 | ✅ 成熟 | 植被散布、物体放置 |
| **GPU Compute Scatter** | GPU 并行计算实例放置 | ⚠️ 需自实现 | 大规模植被/岩石散布 |
| **Biome System** | 基于温度/湿度/海拔等参数定义生态区 | ⚠️ 需设计 | 大世界不同区域的自然过渡 |
| **Agent-Based Generation** | 模拟"建造者 Agent"按规则生成内容 | 🔬 研究中 | 城市、聚落、文明遗迹 |

### 3.2 3A 级场景 PCG 工作流

> 3A 项目的 PCG **不是全自动**的——是"程序化辅助 + 人工精调"。

**典型流程**：

```
1. 大地形骨架 → Houdini/SD 程序化生成 Heightmap
2. Biome 划分 → 根据海拔/坡度/温度参数自动分区
3. 植被散布 → 规则驱动（密度/品种/朝向）+ 画笔微调
4. 道路/河流 → Spline 路径 + 沿路程序化放置
5. 建筑/POI → 预制件库 + 放置规则 + 人工布局关键点
6. 细节丰富 → 小物件（石头/残骸/垃圾）程序化散布
7. 美术精修 → 人工调整不自然的地方
```

### 3.3 Houdini + Unity PCG 工作流

| 功能 | Houdini 端做什么 | Unity 端做什么 |
|------|-----------------|---------------|
| **地形生成** | HDA 生成 Heightmap + Splat Map | 导入 Unity Terrain Data，自动配置层 |
| **植被散布** | HDA 计算散布点位（位置+旋转+缩放） | 用 GPU Instancing 渲染实例 |
| **道路网络** | HDA 生成 Spline + 沿路修平地形 | 导入 Spline → Mesh → 贴花 |
| **建筑布局** | HDA 按规则排列建筑（间距、朝向、类型变化） | 实例化预制件 |
| **LOD 生成** | 自动生成多级 LOD mesh | 导入 LOD Group |

> **Houdini Engine for Unity**：最新版支持 Session Sync（Unity 和 Houdini 实时双向同步），可以在 Houdini 中调参立刻看到 Unity 中的效果。搜索关键词：`Houdini Engine Unity Session Sync`

### 3.4 Unity 原生 PCG 工具（新兴）

| 工具 | 现状 | 适用场景 |
|------|------|---------|
| **Spline Tool (Unity 2022+)** | ✅ 内置 | 道路、河流、铁轨路径定义 |
| **SpeedTree 10 集成** | ✅ Unity 6 | 高质量植被 + LOD + Wind |
| **Terrain Tools Package** | ✅ 官方包 | 增强型笔刷、噪声生成器、Stamp 工具 |
| **Addressables + Terrain Streaming** | ✅ 可组合 | 大世界地形分块加载 |
| **DOTS + GPU Instancing** | ⚠️ 实验性 | 超大规模实例渲染（百万级草） |

---

## 四、与我们项目的关联

### EcoEngine 自研引擎 + Unity 2022+

| 需求 | 推荐方案 | 优先级 |
|------|----------|--------|
| 大世界地形编辑 | Unity Terrain + Microsplat 增强材质混合 + Scene Streaming | ⭐ 值得采纳 |
| 地形材质风格化 | SD 生成基础贴图 + 自定义 Terrain Shader（风格化 PBR）| ⭐ 值得采纳 |
| 植被散布 | Houdini HDA 规则散布 + GPU Instancing 渲染 | 👀 值得关注 |
| 关卡/场景 PCG | WFC 关卡布局 + Biome 系统 + 人工精调 | 👀 值得关注 |
| 地形 LOD | Geometry Clipmap 或 CDLOD（如果内置不够用）| ℹ️ 了解即可（先评估内置 LOD 够不够）|

---

## 五、学习资源与信息源

| 资源 | 类型 | 适用场景 |
|------|------|---------|
| **Houdini Game Dev Toolset** | SideFX 官方工具集 | 游戏场景 PCG 现成 HDA |
| **Brackeys / Sebastian Lague** | YouTube 教程 | Unity 程序化地形/洞穴生成入门 |
| **Red Blob Games** | 交互式教程 | 噪声/地图生成/寻路算法可视化 |
| **GDC Vault: Open World** | GDC 分享 | 3A 开放世界场景制作经验 |
| **SideFX Houdini Journal** | 官方博客 | Houdini + 游戏引擎最新集成方案 |
| **WFC 论文原文** | 学术 | Wave Function Collapse 算法细节 |

### 关键搜索词（以后调研用）

```
"Unity terrain large world streaming"
"procedural terrain generation GPU"
"Houdini Engine Unity workflow 2026"
"WFC wave function collapse level generation"
"biome system procedural open world"
"vegetation scatter GPU instancing Unity"
"terrain shader stylized PBR"
```

---

## 六、知识保鲜策略

> AI 每月地形/PCG 方向巡检时执行：

1. **搜索** `Unity terrain new features [当前年月]` 看 Unity Terrain 系统更新
2. **搜索** `Houdini Engine Unity [当前年]` 看 Houdini 集成新功能
3. **搜索** `procedural generation game GDC [当前年]` 看 PCG 方向 GDC 分享
4. **搜索** `open world terrain AAA [当前年]` 看 3A 项目的地形方案分享
5. **更新此文档**：新技术/工具补充，过时内容标注或移除
