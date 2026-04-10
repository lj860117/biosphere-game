# Unity 渲染前沿知识索引

> **用途**：AI 在接到渲染相关任务时，先读此文档定位方向，再去搜索最新资料。
> **维护规则**：每次调研渲染话题后更新此文档。每月巡检时检查链接有效性。
> **保鲜周期**：每月
> **最后更新**：2026-04-07

---

## 一、Unity 渲染管线战略（2026 年现状）

| 管线 | 状态 | 适用场景 | 未来方向 |
|------|------|----------|----------|
| **URP** | ✅ 主力发展 | 所有游戏类型、所有平台 | 持续加新功能：实时 GI、SSR、物理光源、天空管理器 |
| **HDRP** | ⚠️ 维护模式 | 高端主机/PC 项目 | 不加新功能，只修 bug + 支持 Switch 2（Unity 6.5） |
| **Built-in** | ❌ 6.5 正式标记弃用 | 旧项目维护 | 支持到 2028 年底（Enterprise/Industry 到 2029），之后移除。教育资源和 Asset Store 默认转 URP |
| **Custom SRP** | 🛠️ 自行维护 | EcoEngine 等自研管线 | Unity SRP API 持续可用。注意 6.5 移除旧版 Render Graph 编译器 |

> **关键结论**：新项目一律用 URP。现有 EcoEngine 项目走 Custom SRP（注意 Render Graph 编译器变更）。不要启动新的 HDRP 项目。BiRP 弃用时间线已确认——实时服务项目应开始评估迁移。

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
| **DLSS 5 / 神经渲染** | AI 模型实时生成光照、纹理、反射（不再只是超采样），黄仁勋称"图形界的 GPT 时刻" | 2026 下半年发布，GTC 2026 演示 | `DLSS 5 neural rendering GTC 2026` |
| **DLSS 4.5（完整版 2026.3.31）** | 第二代 Transformer 超分 + **动态多帧生成**（自动变速箱式倍率调整）+ **6X 多帧生成**（RTX 50 系列，4K 光追再提升 35%）+ 增强型 UI 渲染模型 | ✅ 已发布 | `DLSS 4.5 Dynamic MFG 6X` |
| **AMD FSR Redstone** | 神经网络超分 + ML 帧生成 + Radiance Caching | 2026 | `FSR Redstone neural` |
| **RTX Mega Geometry** | 几何体压缩+簇复用，密集场景路径追踪提速100x | GDC 2026 演示 | `RTX Mega Geometry cluster` |
| **RTX Neural Shaders** | Tensor Core 运行小型神经网络着色器，替代传统 BRDF 着色 | RTX 50 系列可用 | `RTX Neural Shaders cooperative vector` |
| **Neural Texture Compression (NTC)** | 神经网络纹理压缩，16:1 压缩比保持高保真，VRAM 减少 6x | SDK 公开 | `neural texture compression NVIDIA` |
| **Cooperative Vector (DX)** | DirectX API 标准化 Tensor Core 加速，让所有引擎接入神经渲染 | 2025.3 发布 | `Cooperative Vector DirectX` |
| **腾讯 MagicDawn** | AI 驱动全局光照，用 Neural Radiance Caching 替代传统光线追踪弹射 | GDC 2026 发布 | `Tencent MagicDawn AI GI` |
| **Stochastic Tile-Based Lighting** | 跨平台（移动→PC）随机瓦片光照 | SIGGRAPH 2025 | `stochastic tile lighting HypeHype` |

### 第三梯队：学术/实验阶段

| 技术 | 是什么 | 查找关键词 |
|------|--------|-----------|
| **3D Gaussian Splatting** | 实时神经辐射场渲染，快速场景重建 | `3DGS real-time rendering` |
| **Neural Radiance Caching** | 用神经网络缓存全局光照（MagicDawn 已有生产级实现） | `neural radiance cache GI` |
| **GPU-Driven Voxel Rendering** | GPU 驱动的大规模体素场景 | `GPU voxel Aokana` |
| **AI Material Generation** | 用扩散模型生成 PBR 材质贴图（Adobe/NVIDIA 研究中） | `AI material generation diffusion PBR` |
| **Neural Style Transfer for Textures** | 将参考图风格迁移到 PBR 材质，SD 插件方向 | `neural style transfer texture material` |

---

## 二-B、GDC 2026 渲染技术要点（2026-03 调研）

> 本节记录 GDC 2026 期间发布的渲染技术亮点，供后续追踪。

### NVIDIA RTX Neural Rendering 全景

NVIDIA 在 GDC 2026 提出"神经渲染时代"概念，核心三件套：

1. **RTX Neural Shaders**：在着色器代码中嵌入小型神经网络，用 Tensor Core 实时推理。支持 AI 学习的 BRDF/材质响应，比手写近似更准确。通过 Cooperative Vector API 接入 DirectX/Vulkan，任何引擎均可使用
2. **Neural Texture Compression (NTC)**：用神经网络编解码纹理数据。相比 BC7，在同等质量下 VRAM 占用减少 ~6x。对高分辨率 4K 贴图和虚拟纹理管线意义重大
3. **RTX Mega Geometry**：面向密集路径追踪场景的几何体处理优化。通过 cluster 复用和压缩，密集场景性能提升可达 100x

> **与我们的关联**：Neural Texture Compression 对大世界项目有直接价值（VRAM 是瓶颈）。Neural Shaders 属于下一代技术储备，短期不急但要跟踪。EcoEngine 自研管线可以较早尝试 Cooperative Vector API 集成。

### 腾讯 MagicDawn

腾讯天美 J3 在 GDC 2026 展示的 AI 驱动实时全局光照系统：
- 用 Neural Radiance Caching 替代传统光线追踪的多次弹射
- 降低了对光线弹射次数的依赖，低端硬件也能获得近似全局光照效果
- 适用于开放世界、室内外混合照明场景
- **集成空间音频和高级遮挡剔除**（GDC 2026 新披露）
- **官方确认兼容 Unreal Engine、Unity 和 Godot**（GDC 2026 新披露）

> **与我们的关联**：作为腾讯内部技术，且**已确认兼容 Unity**，这是最值得密切跟踪的技术之一。如果 EcoEngine/Unity 项目能试用，有望显著提升光照质量。

### Unity 2026 渲染管线战略更新

- **URP 全面加强**：实时 GI Probe（预计 Unity 6.5+）、增强 SSR、Physical Light Units 标准化、物理天空与动态天空管理器、预曝光与自动曝光、移动端片上后处理
- **GPU Resident Drawer 2.0**：BatchRendererGroup 升级，支持更多绘制类型，减少 CPU 开销
- **SpeedTree 10 原生集成**：新的植被渲染管线，自动 LOD + wind animation
- **HDRP 功能冻结**：只修 bug + 支持 Switch 2 硬件适配（Unity 6.5）
- **Built-in (BiRP) 正式弃用**：Unity 6.5 标记弃用，6.7 LTS 仍包含，支持到 2028 年底
- **Unity 6.5 破坏性变更**：移除旧版 Render Graph 编译器，仅保留新编译器
- **DX12 成为 Windows 默认**：内存优化 + 平滑管线编译后默认启用
- **着色器编译时间优化**：新构建设置可减少 URP 着色器编译时间最多 45%

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
