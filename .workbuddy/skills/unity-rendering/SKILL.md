---
name: unity-rendering
description: >
  Unity 渲染管线、Shader 开发、材质系统、光照烘焙相关的知识索引和开发规范。
  当任务涉及 Shader、材质、渲染、光照、APV、LOD、TCRender 等领域时加载此 Skill。
  前置依赖：hermanlei-conventions 必须已加载。[归属:通用]
  This skill should be used when working on Unity rendering pipeline, Shader development,
  material systems, lighting, APV baking, LOD, or TCRender custom attributes.
---

# Unity 渲染开发规范

> **定位**：Unity 渲染管线、Shader 开发、材质系统、光照烘焙等渲染领域的知识索引和开发规范。
> **前置依赖**：本 Skill 假定 `hermanlei-conventions` 已加载。如果没有，先加载它。
> **从 hermanlei-conventions 拆分**：2026-04-11，原六章渲染段落 + 2 个 reference 文件。

---

## 一、渲染领域速查

### 当前项目渲染相关上下文

| 项目 | 渲染管线 | 关键特征 |
|------|---------|---------|
| 公司 Unity 项目 (15hb) | EcoEngine 自研管线 | TCRender 自定义 Shader 属性（如 `_NRMMap`）、APV 烘焙流程 |
| SceneCraft 工具 | — | 编辑器内光照管理（SceneLightManager）、场景效果切换 |

### 接到渲染任务时的标准流程

1. **先读** `references/rendering-knowledge-index.md` — 定位方向（管线战略/移动端特有/前沿技术）
2. **如果涉及材质风格化/SD** → 再读 `references/material-stylization-knowledge-index.md`
3. **查 project-codebase-wiki 的渲染相关 wiki**（如果可达）
4. **确认不清楚再搜索** — 知识索引覆盖的不重复搜索

### TCRender 自定义属性速查

> 公司项目使用 TCRender 自研引擎，Shader 属性名和 Unity 标准不一致。

| 功能 | Unity 标准属性 | TCRender 属性 | 备注 |
|------|--------------|--------------|------|
| 法线贴图 | `_BumpMap` | `_NRMMap` | 属性名不同，功能相同 |
| 其他属性 | _(待补充，遇到时追加)_ | | |

> **踩坑**：用 Unity 标准属性名去操作 TCRender 材质会静默失败（不报错但不生效）。
> 操作材质前先确认当前项目用的 Shader 是 TCRender 还是 Unity 标准。

### APV（Adaptive Probe Volumes）工作流要点

- APV 烘焙集有所有权概念 — 需要检查当前用户是否有权操作
- `Lightmapping.lightingSettings` 在 null 时读取**会抛 Exception**（不是返回 null）— 必须 try-catch
- 详细 APV 检查流程见 project-codebase-wiki

---

## 二、知识索引入口

> 以下知识索引按月度调研更新。接到渲染任务时按需查阅。

### 渲染前沿知识索引

**文件**：`references/rendering-knowledge-index.md`

**覆盖内容**：
- Unity 渲染管线战略（2026 年现状）
- 全球前沿技术图谱（三个梯队）
- 移动端渲染特有知识
- Shader 学习资源
- 知识保鲜策略

### 材质风格化知识索引

**文件**：`references/material-stylization-knowledge-index.md`

**覆盖内容**：
- Substance Designer 工作流规范
- 风格化 PBR 技术
- AI 材质生成前沿
- SD + Unity 集成方案

---

## 参考文档

- **渲染前沿知识索引**：`references/rendering-knowledge-index.md` — Unity 渲染管线战略、全球前沿技术图谱、移动端渲染特有知识。**接到渲染相关任务时先读此文档定位方向**
- **材质风格化知识索引**：`references/material-stylization-knowledge-index.md` — SD 工作流、风格化 PBR、AI 材质生成前沿。**接到材质/SD 相关任务时先读此文档**
