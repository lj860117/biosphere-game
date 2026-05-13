# 调研成果总索引

> **用途**：所有月度/专题调研的成果入口。开发新功能前先查此表，看有没有之前收集过类似的知识。
> **维护规则**：每次调研完成后追加一行。每月巡检时检查是否有条目过时。
> **最后更新**：2026-04-11

---

## 索引表

| # | 日期 | 领域 | 调研主题 | 核心结论 / 关键发现 | 存放位置 | 关键词（供检索） |
|---|------|------|---------|-------------------|---------|-----------------|
| R-001 | 2026-03-30 | 渲染 | Unity 渲染管线战略 + 全球渲染前沿 | URP 确认为唯一未来管线；HDRP 将合并进 URP；DLSS 5 神经渲染、RTX Neural Shaders、腾讯 MagicDawn AI GI | `hermanlei-conventions/references/rendering-knowledge-index.md` + `unity-rendering/references/rendering-knowledge-index.md` | 渲染, URP, HDRP, DLSS, 神经渲染, MagicDawn, RTX, GI |
| R-002 | 2026-03-30 | 材质/风格化 | SD 材质风格化 + AI 材质生成 | SD 16.0 预览(SDF Shape Splatter v2)；风格化 PBR 是 3A 甜点方向；InstaMAT/NVIDIA Edify 新兴 | `hermanlei-conventions/references/material-stylization-knowledge-index.md` + `unity-rendering/references/material-stylization-knowledge-index.md` | SD, Substance Designer, 风格化, PBR, AI材质, InstaMAT |
| R-003 | 2026-03-30 | 地形/PCG | 地形编辑 + 程序化内容生成 | Geometry Clipmap/CDLOD 成熟方案；Houdini+Unity PCG 工作流；WFC 关卡生成 | `hermanlei-conventions/references/terrain-pcg-knowledge-index.md` | 地形, PCG, Houdini, WFC, Clipmap, 大世界 |
| R-004 | 2026-03-31 | 游戏开发 | 游戏设计趋势 + 架构模式 | PCG+适应性叙事趋势；SO 数据驱动架构；ECS+GO 混合模式(Unity 6.4+) | `hermanlei-conventions/references/gamedev-knowledge-index.md` | 游戏设计, SO, ScriptableObject, ECS, GDC |
| R-005 | 2026-04-10 | 渲染 | Unity 6.5 渲染更新 | Built-in 正式弃用；旧版 Render Graph 编译器移除；DX12 成 Windows 默认；着色器编译优化 45% | `hermanlei-conventions/references/rendering-knowledge-index.md` | Unity 6.5, Built-in弃用, Render Graph, DX12 |
| R-006 | 2026-04-10 | 材质/风格化 | SD MCP 集成 + SD 16.0 | SD MCP Server 社区方向；OpenPBR 支持；Ribbon Graph | `hermanlei-conventions/references/material-stylization-knowledge-index.md` | SD MCP, OpenPBR, SD 16.0 |
| R-007 | 2026-04-11 | Skill 体系 | Skill 体系 vs 全球 AI 编程助手方案 | 我们主动提醒+结构自检全球领先；缺调研索引+记忆演化；Claude Code 五层记忆、A-MEM Zettelkasten 演化可借鉴 | artifact: `skill-system-global-comparison.md` | Skill, 记忆, context engineering, Claude Code, A-MEM |

---

## 使用方式

### 开发新功能时
AI 收到新功能需求 → 提取关键词 → 在上表的"关键词"列搜索 → 命中则提醒用户"之前调研过相关的"并给出位置链接。

### 月度调研后
每次完成调研 → 在上表追加一行（编号递增 R-NNN）→ 更新"最后更新"日期。

### 巡检时
检查每条记录的"存放位置"文件是否仍然存在且内容未过时。超过 90 天未更新的标记 ⚠️。
