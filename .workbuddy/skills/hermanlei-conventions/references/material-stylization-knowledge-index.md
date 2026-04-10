# Substance Designer 材质风格化知识索引

> **用途**：AI 在接到 SD 材质制作、风格化材质、PBR 工作流等任务时，先读此文档定位方向。
> **类型**：📖 知识索引
> **维护规则**：每次调研材质/SD 话题后更新。每月巡检时检查内容是否过时。
> **最后更新**：2026-04-10
> **保鲜周期**：每月

---

## 一、当前状态概览

### Substance Designer 在 3A 工作流中的定位

| 维度 | 现状 |
|------|------|
| **行业地位** | PBR 材质制作的行业标准工具，几乎所有 3A 项目都在用 |
| **当前版本** | Substance 3D Designer 15.x（2025-2026），**16.0 预览已在 GDC 2026 公布** |
| **Unity 集成** | 通过 Substance 3D for Unity 插件，可运行时调参 SBSAR；或预烘焙为贴图导入 |
| **竞品** | Quixel Mixer（被 Epic 收购，偏扫描混合）、Material Maker（开源替代）、InstaMAT（AI 辅助新秀） |

### Substance 3D Designer 16.0 预览（🆕 GDC 2026）

| 特性 | 详情 | 价值 |
|------|------|------|
| **Shape Splatter v2** | 从 Heightmap 驱动升级为 **SDF（签名距离场）** 驱动，支持 3D 形状 + 实时光追渲染 + 逐实例控制（朝向/大小）+ Atlas 输入支持无限形状种类 | 地面碎片/石块散布质量和控制力大幅提升 |
| **OpenPBR 支持** | 引入新的 OpenPBR 材质模型 + 改进的 Displacement UI | 行业标准化方向 |
| **Ribbon Graph 示例** | 为 Painter 的 Ribbon Path 系统提供自定义工具基础 | 降低 TA 自定义工具门槛 |

> **定价**：Steam 永久许可证 $199.99，Texturing 订阅 $24.99/月，Collection 订阅 $59.99/月。发布日期"很快"但未确定。

### SD MCP 集成（社区方向）

社区开发了 Substance Designer 的 MCP Server，允许 AI 代理控制节点图、调参、自动化材质制作。目前成熟度待验证，但方向值得关注。

### 风格化 vs 写实的选择

| 风格 | 特征 | SD 工作流差异 | 适用场景 |
|------|------|-------------|---------|
| **PBR 写实** | 基于物理的光照响应，Metallic/Roughness 贴图 | 标准 PBR 流程，重视 texel density 和物理准确性 | 3A 写实游戏、建筑可视化 |
| **风格化 PBR** | 遵循 PBR 框架但艺术化处理色彩/纹理 | 在 PBR 基础上加 Hand-painted overlay、色彩偏移、边缘增强 | 风格化 3A（原神、塞尔达）|
| **NPR / 手绘** | 不遵循 PBR 物理规则，纯艺术表现 | 需自定义 Shader，SD 主要提供纹理，光照靠 Shader 控制 | 卡通、赛璐珞、水墨风 |

> **关键结论**：你的方向——"材质风格化"——大概率是**风格化 PBR**路线。这是目前 3A 的主流趋势（写实太贵，纯卡通受众窄，风格化 PBR 是甜点）。

---

## 二、SD 材质制作规范与最佳实践

### 2.1 Graph 组织规范（3A 生产级）

| 规范 | 说明 | 来源 |
|------|------|------|
| **命名约定** | `M_[MaterialType]_[Variant]`（如 `M_Stone_Mossy`）| Adobe 官方 + 行业惯例 |
| **输出标准化** | 至少包含：BaseColor、Normal、Roughness、Height（AO 可选）| PBR Metallic-Roughness 标准 |
| **Texel Density** | 统一 texel density（如 10.24 px/cm @2K），避免场景中不同材质清晰度不一致 | 3A 美术规范通用 |
| **模块化 Sub-Graph** | 通用模式（裂缝、磨损、泥土、苔藓）做成 Sub-Graph 复用 | Allegorithmic 最佳实践 |
| **非破坏性工作流** | 所有调整通过参数暴露，不要"烘死"在节点图里 | SD 核心设计哲学 |
| **SBSAR 发布** | 发布为 .sbsar 包，暴露关键参数（颜色、密度、磨损程度），供美术团队和引擎运行时调参 | 3A 工作流标准 |

### 2.2 风格化材质的关键技术

| 技术 | 做什么 | 如何在 SD 中实现 |
|------|--------|-----------------|
| **手绘纹理叠加** | 在 PBR 贴图上叠加手绘笔触质感 | Directional Warp + Slope Blur 模拟笔触方向，Paint Filter 叠加 |
| **色彩偏移/色调映射** | 不用真实物理色彩，用艺术化调色 | Gradient Map + HSL Shift，在 BaseColor 阶段做 |
| **边缘增强** | 几何边缘高亮/描边，增加"画"的感觉 | Curvature/AO 驱动的 Edge Detect → 叠加到 BaseColor 或 Emissive |
| **简化细节层级** | 大面读大色块、中景适度细节、近景高细节 | 用 Distance 参数控制细节密度，多级 LOD 材质变体 |
| **Color Palette 约束** | 限定材质在特定色板范围内，保持全场景风格统一 | Quantize + Palette 节点，或用 Gradient Map 映射到预设色板 |

### 2.3 SD + Unity 集成工作流

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **预烘焙贴图** | 零运行时开销，兼容所有平台 | 无法运行时调参 | 移动端、最终发布 |
| **SBSAR 运行时** | 运行时调参、减少贴图变体数量 | 需要 Substance 插件、占用 CPU | PC/主机、需要大量变体 |
| **Shader Graph + SD 贴图** | 在 Shader 层面混合多张 SD 输出贴图 | 需要更多 Shader 工作 | 地形混合、动态天气 |

---

## 三、2025-2026 前沿趋势

### AI 驱动的材质生成

| 工具/技术 | 是什么 | 成熟度 | 查找关键词 |
|-----------|--------|--------|-----------|
| **Adobe Substance 3D Sampler AI** | 从照片/参考图自动生成 PBR 材质 | ✅ 生产可用 | `Substance Sampler AI photo to material` |
| **InstaMAT** | AI 辅助材质创建，text-to-material | ⚠️ 新兴，快速迭代 | `InstaMAT AI material` |
| **NVIDIA Edify 3D Materials** | 文本描述生成 PBR 贴图 | ⚠️ API 阶段 | `NVIDIA Edify material generation` |
| **Diffusion Model → PBR** | 用扩散模型（Stable Diffusion 等）生成 PBR 多通道贴图 | 🔬 学术研究 | `diffusion model PBR material generation` |
| **Neural Style Transfer** | 将参考风格迁移到现有材质 | 🔬 实验中 | `neural style transfer material texture` |

> **与我们的关联**：
> - Adobe Sampler AI 已经生产可用，适合**快速原型**阶段从照片生成基础材质
> - InstaMAT 值得关注，但还不够稳定做生产用
> - 扩散模型生成 PBR 贴图是大趋势，但目前质量和一致性不够 3A 标准

### 风格化渲染的 Shader 侧配合

| 技术 | 与 SD 材质的配合方式 |
|------|---------------------|
| **Cel Shading / Toon Shader** | SD 输出 Ramp Texture（光照梯度贴图），Shader 用 Ramp 采样替代平滑光照 |
| **Outline / Edge Detection** | SD 输出 Curvature/Edge Map，Shader 叠加描边效果 |
| **Hatching / Cross-Hatching** | SD 生成多级密度的 Hatching 纹理（TAM），Shader 按光照强度混合 |
| **Watercolor / Ink Wash** | SD 生成水彩/水墨纹理和扩散图案，Shader 做 Bleed/Diffuse 效果 |

---

## 四、学习资源与信息源

| 资源 | 类型 | 适用场景 |
|------|------|---------|
| **Substance Academy** | 官方教程 | SD 系统学习 |
| **ArtStation Learning** | 视频课程 | 风格化材质制作实战 |
| **Stylized Station** | 社区博客 | 风格化 PBR 技巧和案例分析 |
| **Adobe Substance 3D Magazine** | 周刊 | 行业趋势和新功能预告 |
| **polycount / 80.lv** | 社区论坛 | 3A 美术技术讨论 |
| **GDC Art Direction talks** | 年度分享 | 3A 项目的艺术方向决策 |

### 关键搜索词（以后调研用）

```
"Substance Designer stylized" "hand painted PBR"
"Substance Designer color palette" "material authoring AAA"
"SD graph best practices" "substance workflow production"
"AI material generation 2026" "text to material PBR"
```

---

## 五、知识保鲜策略

> AI 每月材质方向巡检时执行：

1. **搜索** `Substance Designer new features [当前年月]` 看 Adobe 有无更新
2. **搜索** `stylized PBR material workflow [当前年]` 看 3A 项目分享
3. **搜索** `AI material generation [当前年]` 跟踪 AI 材质工具进展
4. **检查** ArtStation / polycount 热门材质作品的风格趋势
5. **更新此文档**：新技术/工具补充，过时内容标注或移除
