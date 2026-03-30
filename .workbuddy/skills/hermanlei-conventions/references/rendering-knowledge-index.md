# Unity 渲染前沿知识索引

> **用途**：AI 在接到渲染相关任务时，先读此文档定位方向，再去搜索最新资料。
> **维护规则**：每次调研渲染话题后更新此文档。每月巡检时检查链接有效性。
> **最后更新**：2026-03-30

---

## 一、Unity 渲染管线战略（2026 年现状）

| 管线 | 状态 | 适用场景 | 未来方向 |
|------|------|----------|----------|
| **URP** | ✅ 主力发展 | 所有游戏类型、所有平台 | 持续加新功能：实时 GI、SSR、物理光源、天空管理器 |
| **HDRP** | ⚠️ 维护模式 | 高端主机/PC 项目 | 不加新功能，只修 bug + 支持 Switch 2（Unity 6.5） |
| **Built-in** | ❌ 将弃用 | 旧项目维护 | Unity 6.5 标记弃用，2028 年底前支持，之后移除 |
| **Custom SRP** | 🛠️ 自行维护 | EcoEngine 等自研管线 | Unity SRP API 持续可用 |

> **关键结论**：新项目一律用 URP。现有 EcoEngine 项目走 Custom SRP。不要启动新的 HDRP 项目。

---

## 二、2025-2026 全球渲染前沿技术图谱

### 第一梯队：已在 AAA 生产中使用

| 技术 | 是什么 | 谁在用 | Unity 可用性 | 查找关键词 |
|------|--------|--------|-------------|-----------|
| **GPU Resident Drawer (GRD)** | GPU 端自动剔除+BatchRendererGroup，CPU→GPU 工作转移 | Unity 6 内置 | ✅ URP 17 原生支持 | `GPU Resident Drawer Unity 6` |
| **Render Graph** | 声明式渲染流程图，自动资源管理和调度 | Unity 6 内置 | ✅ URP/HDRP 原生 | `RenderGraph Unity URP` |
| **STP (Spatial Temporal Post-processing)** | 时空后处理抗锯齿+超采样 | Unity 6 | ✅ URP 17 | `STP Unity 6 temporal` |
| **ReSTIR** | 时空蓄水池重采样，多光源高效采样 | NVIDIA RTX | ⚠️ 需自实现 | `ReSTIR sampling light Unity` |
| **Nanite** | 虚拟微多边形几何体，无级 LOD | UE5 独占 | ❌ Unity 无对应 | `Nanite virtual geometry` |
| **Lumen** | 实时全局光照+反射 | UE5 独占 | ❌ Unity 无对应（URP 规划中有实时 GI） | `Lumen global illumination` |
| **Virtual Shadow Maps** | 高分辨率虚拟阴影贴图 | UE5 | ❌ Unity 无直接对应 | `Virtual Shadow Maps` |
| **MegaLights** | 随机直接光照，支持百万级动态光源 | UE5.5 | ❌ | `MegaLights UE5 stochastic` |

### 第二梯队：2025-2026 新兴/即将落地

| 技术 | 是什么 | 现状 | 查找关键词 |
|------|--------|------|-----------|
| **DLSS 5 / 神经渲染** | AI 模型直接生成像素级光照和材质 | 2026 秋发布 | `DLSS 5 neural rendering` |
| **DLSS 4.5** | 第二代 Transformer 超分 + 多帧生成 | 2026.3 可用 | `DLSS 4.5 Transformer` |
| **AMD FSR Redstone** | 神经网络超分 + ML 帧生成 + Radiance Caching | 2026 | `FSR Redstone neural` |
| **RTX Mega Geometry** | 几何体压缩+簇复用，密集场景路径追踪提速100x | GDC 2026 | `RTX Mega Geometry` |
| **Cooperative Vector (DX)** | DirectX API 标准化 Tensor Core 加速 | 2025.3 发布 | `Cooperative Vector DirectX` |
| **Neural Texture Compression** | 神经网络驱动的纹理压缩 | 实验中 | `neural texture compression` |
| **Stochastic Tile-Based Lighting** | 跨平台（移动→PC）随机瓦片光照 | SIGGRAPH 2025 | `stochastic tile lighting HypeHype` |

### 第三梯队：学术/实验阶段

| 技术 | 是什么 | 查找关键词 |
|------|--------|-----------|
| **3D Gaussian Splatting** | 实时神经辐射场渲染 | `3DGS real-time rendering` |
| **Neural Radiance Caching** | 用神经网络缓存全局光照 | `neural radiance cache GI` |
| **GPU-Driven Voxel Rendering** | GPU 驱动的大规模体素场景 | `GPU voxel Aokana` |

---

## 三、移动端渲染特有知识

| 技术 | 要点 | 查找关键词 |
|------|------|-----------|
| **Tile-Based Deferred Rendering (TBDR)** | 移动 GPU 的核心架构，所有移动端优化都建立在此基础上 | `TBDR mobile GPU tile` |
| **On-Chip Post-processing** | 后处理在 tile 内完成，不写回主存，URP 规划中 | `on-chip post-processing URP mobile` |
| **Vulkan Subpass** | 利用 tile 内存做多 pass 而不读写主存 | `Vulkan subpass tile mobile` |
| **Metal Tile Shading** | Apple 的 tile 内计算 API | `Metal tile shading deferred` |
| **Foveated Rendering** | 注视点渲染，VR/XR 核心优化 | `foveated rendering Unity` |

---

## 四、Unity Shader 编写资源

| 资源 | 类型 | 适用场景 | URL/关键词 |
|------|------|----------|-----------|
| **Catlike Coding Custom SRP** | 教程系列 | 从零学自定义管线 | `catlikecoding.com/unity/tutorials/custom-srp` |
| **Daniel Ilett 系列** | 博客+教程 | Unity Shader 代码入门 | `danielilett.com shader` |
| **Unity Shader Cheatsheet** | 速查表 | ShaderLab/HLSL 语法速查 | `pavelzosim.com Unity ShaderLab Cheatsheet` |
| **Unity 官方 HLSL 文档** | 文档 | 内置函数/宏/语义 | `docs.unity3d.com Manual writing-shader-writing-shader-programs-hlsl` |
| **Building Quality Shaders for Unity (Springer)** | 书 | 系统学习 Shader Graph + 代码 | ISBN 978-1-4842-8652-4 |
| **SIGGRAPH Advances in Real-Time Rendering** | 年度课程 | 业界最前沿技术 | `advances.realtimerendering.com` |

---

## 五、知识保鲜策略

> AI 每月渲染巡检时执行以下操作：

1. **搜索** `Unity rendering new features [当前年月]` 看 Unity 官方博客有无新公告
2. **搜索** `SIGGRAPH [当前年] real-time rendering` 看年度前沿演讲
3. **搜索** `GDC [当前年] rendering` 看 GDC 渲染相关分享
4. **检查** NVIDIA/AMD 开发者博客看 DLSS/FSR 新版本
5. **更新此文档**：新技术加到对应梯队，过时的标注或移除
