# AI 生图 & 3D 美术周报 2026-05-18

> 覆盖周期：2026.05.12 — 2026.05.18

---

## 1. 🖼️ AI 生图动态

### 🆕 Anima-Base v1.0 正式发布（5月15日）
**本周重点。** CircleStone Labs × Comfy Org 联合开发的动漫/插画专用生图模型 Anima 结束 Preview 阶段，正式发布 Base v1.0。

- **参数量仅 2B**（约 4.18GB），基于 NVIDIA Cosmos-Predict2-2B 架构 + Qwen 3 0.6B 文本编码器
- **双模式提示词**：同时支持 Danbooru 标签 + 自然语言，可混合使用
- **多角色区分力强**：在多角色场景中精准区分发色、姿态等属性，超越 SDXL/Illustrious 系列
- **ComfyUI 原生支持**，下载即用；Kohya 已发布 ControlNet-LLLite（含 inpaint）权重
- **注意**：非商用许可（CircleStone Labs Non-Commercial License）
- 链接：[HuggingFace](https://huggingface.co/circlestone-labs/Anima) | [Civitai](https://civitai.com/models/2458426)

### 🆕 SD.Next 大版本更新（5月12日）—— 六款新模型一次性接入
SD.Next（基于 A1111 的增强前端）发布重量级更新：

- **HiDream-O1-Image** 全面接入（base + Dev 蒸馏版）
- **UltraFlux-v1**：基于 FLUX.1-dev 的原生 **4K** 文生图模型，论文级工作（Resonance 2D RoPE + SNR-Aware 损失函数）
- **JoyAI Image Edit**（50GB 大模型）/ **Step1X-Edit v1.1** / **VIBE Image Edit**：三款图像编辑模型
- **Lumina-DiMOO**：统一多模态扩散模型（T2I / I2I / 多视图）
- **多图输入工作流**：支持多张参考图同时输入，串联角色+背景+风格
- 链接：[SD.Next Changelog](https://vladmandic.github.io/sdnext-docs/CHANGELOG)

### Luma Uni-1.1 持续发酵（上周发布，本周落地加速）
5月6日发布的 Uni-1.1 API 本周进入更多平台集成：
- Arena.ai 榜单全球第三（仅次于 GPT-Image-2 和 Nano Banana 2）
- 2K 单图最低 $0.0404（约 ¥0.28），价格为同类一半
- 已进入 ComfyUI Partner Nodes、Envato、Krea、Magnific 等平台
- **核心卖点**：推理+生成统一架构（decoder-only autoregressive），不是扩散模型；支持最多9张参考图，品牌一致性极强
- 链接：[Luma API](https://lumalabs.ai/api) | [发布公告](https://lumalabs.ai/news/uni-1-1-api)

---

## 2. 🧊 AI 生 3D 动态

### 🆕 SATO（Strips as Tokens）—— AI 拓扑 + UV 的里程碑（SIGGRAPH 2026）
**本周最值得关注的 3D 研究进展。** Deemos（Rodin/Hyper3D 团队）发表的 SATO 论文被 SIGGRAPH 2026 条件接收。

- **核心突破**：用 triangle strip 启发的 token 序列化方式，让自回归 Transformer 在生成 mesh 的同时**原生生成 UV 分区**
- **三角/四边面统一**：同一套 token 序列可解码为 tri mesh 或 quad mesh
- **UV 岛按语义分割**：手臂/躯干/腿部等部位自动分到不同 UV 岛
- **现状**：论文质量令人兴奋，但实测仍有拉伸和非最优切割，需要后期清理
- **即将集成到 Hyper3D Rodin 平台**
- 链接：[项目页](https://ruixu.me/html/SATO/) | [GitHub](https://github.com/Xrvitd/SATO) | [论文](https://arxiv.org/abs/2604.09132)

### 🆕 Meshy Workspace 3.0 发布
Meshy 推出全新工作区，从"工具集合"升级为"任务导向平台"：

- **即时创建栏**：首页直接输入 prompt 开始生成，带预设提示词
- **端到端 3D 模型工作流**：生成→纹理化→Remesh→绑定→动画，一页完成
- **新增 Scene 模块**：3D 场景创建和合成
- **新增 Video 模块**：从 3D 资产直接生成视频
- **3D 打印模块**：支持多色打印，一键导出到 6 款切片软件（Bambu Studio 等）
- **Formlabs Form Now 集成**：AI 生成 → 一键下单专业 3D 打印
- 链接：[Meshy Blog](https://www.meshy.ai/blog/workspace3)

### HiDream-O1-Image Dev 更新（5月13日）
- 加速 IP 推理、IP 管线新增布局和骨骼条件控制
- 注意：PyTorch 2.9.x 存在兼容问题，不推荐使用

---

## 3. 🎨 3D 美术行业动态

### DCC 工具更新

**Substance 3D Designer 16.0 正式发布（4月15日发布，本周持续关注）**
- **Shape Splatter v2**：从散布 2D 形状升级为散布 3D SDF 形状，实时光线追踪碰撞
- **3D SDF 节点工具集**：20 种 3D 基元 + 布尔运算 + 变换（弯曲/扭曲/拉伸）
- **OpenPBR 成为默认材质模型**：替代旧版 Adobe Standard Material
- **移除 Iray 渲染器和 MDL 材质**，改用 MaterialX
- 链接：[发布说明](https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/release-notes/version-16-0)

**Maya 2026.3 + 3ds Max 2026.3**
- Maya：新增 Dynamic Geometry Attributes（表面张力/位移可视化），Bifrost 2.15 首次支持破坏模拟
- Arnold 7.4.3：新增推理成像器（Inference Imager），可用 ONNX 模型做渲染风格化
- Maya Creative 2026.3 精简版面向小型工作室

**Redshift 2026.6.0（5月6日）**
- 新增 Maya 2027 + 3ds Max 2027 支持
- 材质节点默认切换到 OpenPBR（从 RS Standard Material 迁移）
- Houdini 21.0.671/700 支持

### 行业趋势
- **OpenPBR 全面铺开**：Substance 3D、Redshift、Maya 同步默认切换到 OpenPBR，行业标准正在统一
- **AI + DCC 融合加速**：Arnold 推理成像器让 ML 模型直接参与渲染后处理；LookdevX 支持 JSON 模板对接外部 AI 纹理生成
- **Meshy 用户超 1000 万，ARR 超 $4000 万**：AI 3D 不再是实验品，已是规模化产品

---

## 4. 🎮 游戏美术相关

### AI 3D 在游戏管线中的落地案例
- **37互娱案例**：概念图 → Meshy 生成初始模型 → 美术精修，整体效率提升 50%，节省 30-40% 时间
- **腾讯、网易**已将 Meshy 集成到 3D 资产生产管线
- Tripo P1.0 Smart Mesh：2 秒生成 5000-20000 面游戏级模型，面数可控

### ComfyUI 视频生成管线成熟
- **FunPack 2.6.0**（5月17日）：FunPack Studio 统一节点，集成 Refinement/Scene Builder/LoRA/Refiner/Sampler
- **WhatDreamsCost LTX 节点包**：实时预览、语音时长计算器、多图加载器，LTX 2.3 视频工作流从"能用"升级到"生产级"
- **Detail Stitch 节点**（5月13日）：精确裁剪→局部编辑→回贴，解决编辑模型污染未编辑区域的问题

### Unity/Unreal 集成
- Meshy Workspace 3.0 支持 FBX/GLB/OBJ/USDZ 导出，DCC Bridge 插件覆盖 Blender/Unity/Godot
- Arnold 推理成像器可在 Unreal/Unity 管线中做 AI 风格化后处理

---

## 5. 💡 本周推荐

### ⭐ Anima-Base v1.0 — 动漫/插画生图新标杆
**为什么推荐**：2B 参数在动漫领域超越 SDXL 系列，自然语言 + 标签双模式提示词体验极好，多角色场景精准度远超前代。ComfyUI 原生支持，LoRA/ControlNet 生态正在快速建立。

**上手指南**：
```
1. 下载三个文件到 ComfyUI 对应目录：
   - anima-base-v1.0.safetensors → models/diffusion_models/
   - qwen_3_06b_base.safetensors → models/text_encoders/
   - qwen_image_vae.safetensors → models/vae/
2. 从 HuggingFace 示例图拖入 ComfyUI 加载工作流
3. 推荐正向前缀："masterpiece, best quality, score_7, safe,"
4. 推荐负向："worst quality, low quality, score_1, score_2, score_3, artist name"
5. 参数：1024 分辨率，30-50 步，CFG 4-5
```

### ⭐ SATO 论文 — 了解 AI 3D 拓扑/UV 的未来方向
**为什么推荐**：如果你做游戏 3D 美术，拓扑和 UV 是永恒痛点。SATO 代表了 AI 生成 mesh 从"好看"走向"可用"的关键一步。虽然代码尚未完整释出，但论文思路值得学习。

**上手**：关注 [GitHub](https://github.com/Xrvitd/SATO) 的代码释出进度，以及 Hyper3D Rodin 平台的后续集成。

---

## 6. ⚡ 当前最佳实践快照

### AI 生图当前最优方案

| 场景 | 推荐方案 | 验证时间 | 置信度 |
|------|---------|---------|--------|
| 最佳文生图（质量优先） | GPT-Image-2 / Nano Banana 2 | 2026-05 | 高 |
| 最佳文生图（开源/本地） | 🆕 HiDream-O1-Image Full（50步，8B） | 2026-05-08 | 中（社区验证中） |
| 最佳文生图（速度优先） | Flux 2 Pro（4.5s/图） | 2026-05 | 高 |
| 最佳文生图（风格化/艺术） | Midjourney V8 | 2026-03 | 高 |
| 🆕 最佳文生图（品牌一致性/多参考图） | Luma Uni-1.1 API（≤9张参考图） | 2026-05-06 | 中（新发布） |
| 🆕 最佳文生图（动漫/插画本地） | Anima-Base v1.0 + ComfyUI | 2026-05-15 | 中（生态建设中） |
| 🆕 最佳文生图（原生 4K） | UltraFlux-v1（基于 FLUX.1-dev） | 2026-05-12 | 低（刚发布） |
| 最佳图生图/局部重绘 | ComfyUI + Flux inpaint | 2026-04 | 高 |
| 最佳风格化概念图 | Midjourney V8 + img2img 精修 | 2026-03 | 高 |
| 游戏贴图生成 | Substance 3D Sampler + AI 辅助 / Flux tiling LoRA | 2026-04 | 中 |

### AI 生 3D 当前最优方案

| 场景 | 推荐方案 | 验证时间 | 置信度 |
|------|---------|---------|--------|
| 最佳文生3D（速度优先） | Meshy 6（20s 极速，低多边形模式） | 2026-01 | 高 |
| 🆕 最佳文生3D（极速 + 可用拓扑） | Tripo P1.0 Smart Mesh（2 秒，500-20000 面可控） | 2026-05 | 中（新版） |
| 最佳图生3D | Tripo 3.1（hero asset 级别质量） | 2026-05-11 | 中 |
| 最佳多视图生3D | Tripo 3.1 multiview mode | 2026-05-11 | 中 |
| 🆕 最佳 AI 拓扑+UV（研究前沿） | SATO by Deemos/Rodin（SIGGRAPH 2026） | 2026-05 | 低（论文阶段） |
| 输出质量 | Tripo 3.1 > Meshy 6（几何精度）；Meshy 6 胜在速度和游戏优化 | 2026-05 | 中 |
| 导入 Unity 最快路径 | 输出 GLB → Unity 直接导入 → 检查法线/缩放 → 手动指定 PBR 通道 | 2026-04 | 高 |
| 🆕 全流程平台 | Meshy Workspace 3.0（生成→纹理→Remesh→绑定→动画→场景→视频） | 2026-05 | 中 |
| 已知坑 | ① Tripo quad 选项已废弃勿用 ② 自动 UV 接缝常在可见面 ③ 面数不可控需后处理 decimation（Tripo 3.1）④ Meshy 非商用需 Pro 计划 | 2026-05 | 高 |

### 3D 美术工具当前推荐

| 场景 | 推荐方案 | 验证时间 | 置信度 |
|------|---------|---------|--------|
| 角色建模（高精度雕刻） | ZBrush 2025+（新增 Substance Bridge 一键导出到 Painter） | 2026-05 | 高 |
| 角色建模（独立开发/全流程） | Blender 4.x | 2026-04 | 高 |
| 硬表面/机械/场景 | Maya + HardOps(Blender) | 2026-03 | 高 |
| 🆕 材质制作（手工精度） | Substance 3D Designer 16 + Painter（OpenPBR 默认） | 2026-05 | 高 |
| 材质制作（AI 辅助快速） | Substance 3D Sampler + AI 贴图生成（Flux tiling） | 2026-04 | 中 |
| 🆕 程序化地形/散布 | Substance 3D Designer 16 Shape Splatter v2（3D SDF 散布） | 2026-05 | 中（新功能） |
| 🆕 渲染后处理 AI 风格化 | Arnold 7.4.3 推理成像器（ONNX 模型） | 2026-05 | 低（实验性） |
| 当前最值得学的新技能 | ComfyUI 节点化工作流（串联生图+生3D+视频） | 2026-05 | 高 |
| 🆕 值得关注的新标准 | OpenPBR（Substance/Redshift/Maya 全线默认） | 2026-05 | 高 |

---

*本报告基于公开信息整理。标注 🆕 的条目为本周新增或更新。*
