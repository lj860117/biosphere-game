# 技术雷达 — 调研总索引

> **用途**：AI 在接到任何技术任务时，**先读此文件**快速定位"之前有没有查过类似的"，再去对应的知识索引文件看详情。
> **维护规则**：每次月度调研后，在"调研时间线"顶部追加新条目；同时更新"领域快速检索"表的日期和条目数。
> **保鲜周期**：每月（跟随月度调研自动更新）
> **最后更新**：2026-04-11

---

## 领域快速检索

| 标签 | 领域 | 最近更新 | 主要条目数 | 详情文件 | 归属 Skill |
|------|------|---------|-----------|---------|-----------|
| #rendering | 渲染管线 & GPU 技术 | 2026-04-10 | 15 | rendering-knowledge-index.md | unity-rendering |
| #material | 材质 & Substance Designer | 2026-04-10 | 10 | material-stylization-knowledge-index.md | unity-rendering |
| #gamedev | 游戏架构 & 设计趋势 | 2026-03-31 | 8 | gamedev-knowledge-index.md | conventions |
| #terrain | 地形 & PCG 程序化生成 | 2026-03-30 | 12 | terrain-pcg-knowledge-index.md | conventions |
| #scenecraft | SceneCraft 工具开发 | 2026-04-10 | — | scenecraft-architecture.md | scenecraft-dev |
| #editor | Unity 编辑器工具通用 | 2026-04-10 | — | editor-ui-detailed-rules.md | scenecraft-dev |
| #ai-ops | AI 使用效率 & Token 经济学 | 2026-04-11 | 1 | — | conventions |

> **新增领域时**：在此表加一行，创建对应的 knowledge-index.md 文件。

---

## 调研时间线（最新在前）

### 2026-04-11（专题调研）

- [#ai-ops] ⭐ **AI Token 消耗优化全球最佳实践调研**：7 大策略（prompt caching -90%、模型路由 -60%、上下文管理 -75%、prompt 压缩 -40%、子 Agent 架构、输出约束、批处理），对咱们最立竿见影的是简单任务切低价模型 + 长任务开新会话 + 大搜索用 Task 子 Agent。详见 artifact: token-optimization-research.md
  - 来源：Anthropic 官方上下文工程博客、AI University、TianPan.co（前 Uber 工程师）、Redis 官方
  - 关注等级：⭐ Prompt Caching / 模型路由 / 上下文管理 / 子 Agent | 👀 Prompt 压缩 / 语义缓存 | ℹ️ LLMLingua / 硬限制

### 2026-04-10（月度调研）

- [#rendering] Unity 6.5 渲染路线图重大更新：URP 确认为唯一主力管线，HDRP 将合并进 URP
- [#rendering] SCGI（Surface Caching Global Illumination）—— Unity 全新实时 GI 系统，基于表面缓存，预计 6.5+
- [#rendering] DLSS 4.5 完整版发布：第二代 Transformer 超分 + 动态多帧生成 + 6X 多帧生成
- [#rendering] RTX Mega Geometry：几何体压缩+簇复用，密集场景路径追踪提速 100x
- [#rendering] RTX Neural Shaders：Tensor Core 运行小型神经网络着色器，替代传统 BRDF
- [#rendering] Neural Texture Compression (NTC)：16:1 压缩比，VRAM 减少 6x
- [#rendering] 腾讯 MagicDawn：AI 驱动 GI，Neural Radiance Caching，已确认兼容 Unity
- [#rendering] Cooperative Vector (DX)：DirectX 标准化 Tensor Core 加速 API
- [#rendering] Gaussian Splatting Unity 集成方案对比（UnityGS vs 3DGS-Unity）
- [#material] Substance 3D Designer 16.0 预览：Shape Splatter v2（SDF 驱动）+ OpenPBR 支持
- [#material] SD MCP 集成（社区方向）：AI 代理控制 SD 节点图、调参、自动化材质制作
- [#material] InstaMAT AI 辅助材质创建：text-to-material，快速迭代中
- [#material] 材质风格化路线确认：风格化 PBR 是当前 3A 甜点方向

→ 详见 rendering-knowledge-index.md、material-stylization-knowledge-index.md

### 2026-03-31（月度调研）

- [#gamedev] GDC 2026 行业热点：AI 全面渗透游戏开发（腾讯 VISVISE、ASI World、Unity Agentic AI）
- [#gamedev] 独立游戏设计趋势：程序化生成+适应性叙事、混合类型玩法、短平快高冲击
- [#gamedev] ECS+GameObject 混合模式：Unity 6.4+ ECS 成为核心包，可直接附加到 GO
- [#gamedev] biosphere-game v1.3.0 架构复盘：模块化 JS + 事件驱动

→ 详见 gamedev-knowledge-index.md

### 2026-03-30（月度调研）

- [#terrain] 3A 大世界地形方案全景对比：UE5 World Partition vs Unity DOTS Terrain vs Virtual Texturing vs Clipmap
- [#terrain] GPU 驱动地形渲染技术：Geometry Clipmap、CDLOD、GPU Tessellation、Mesh Shader Terrain
- [#terrain] Houdini + Unity PCG 工作流：HDA 生成 → Session Sync 实时同步 → GPU Instancing 渲染
- [#terrain] 程序化生成技术体系：Noise / L-System / WFC / Poisson Disk / Biome System / Agent-Based
- [#terrain] 风格化地形技术：Hand-Painted Terrain Shader、Triplanar、Slope-Based Texturing
- [#terrain] Unity 原生 PCG 工具现状：Spline Tool / SpeedTree 10 / Terrain Tools Package

→ 详见 terrain-pcg-knowledge-index.md

### 2026-03（GDC 2026 专题调研）

- [#rendering] GDC 2026 NVIDIA RTX Neural Rendering 三件套：Neural Shaders + NTC + Mega Geometry
- [#rendering] GDC 2026 腾讯 MagicDawn：Neural Radiance Caching + 空间音频 + 遮挡剔除
- [#rendering] GDC 2026 Unity 渲染路线图：URP 全面加强 + GRD 2.0 + SpeedTree 10 + Built-in 弃用
- [#rendering] GDC 2026 前沿技术：DLSS 5 神经渲染（图形界的 GPT 时刻）、AMD FSR Redstone
- [#material] GDC 2026 AI 材质工具：Adobe Sampler AI（生产可用）、NVIDIA Edify 3D Materials
- [#gamedev] GDC 2026 游戏趋势：叙事崛起、跨学科协作、AI 渗透全开发链

→ 详见各领域知识索引文件

---

## 技术关注等级

> 根据"与我们项目的关联度"标注，方便快速判断优先级。

| 等级 | 含义 | 当前标注的技术 |
|------|------|--------------|
| ⭐ 直接相关 | 可能在当前项目中使用 | MagicDawn（腾讯内部+Unity 兼容）、NTC（大世界 VRAM 瓶颈）、SD 16 Shape Splatter v2、风格化 PBR 路线 |
| 👀 值得跟踪 | 短期不急但方向对的 | Neural Shaders、Cooperative Vector API、InstaMAT、SCGI、Gaussian Splatting |
| ℹ️ 了解即可 | 竞品/学术/暂不适用 | Nanite/Lumen（UE5 独占）、DLSS 5（2026 下半年）、Mesh Shader Terrain |

---

## 维护规则

### 月度调研后必做

1. 在"调研时间线"**最顶部**追加新的月份条目
2. 每个条目格式：`- [#标签] 一句话摘要`
3. 末尾加 `→ 详见 xxx.md` 指向具体知识索引文件
4. 更新"领域快速检索"表的"最近更新"日期和"主要条目数"
5. 检查"技术关注等级"是否需要调整（技术落地了就升级、过时了就降级）

### 新增领域时

1. 在"领域快速检索"表加一行
2. 创建对应的 `xxx-knowledge-index.md` 文件
3. 标注归属 Skill（拆分后的领域 Skill 名）

### 年度归档

> 超过 12 个月的调研条目，压缩为年度摘要，保持文件不膨胀。
