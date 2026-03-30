# 游戏开发前沿知识索引

> **用途**：AI 在接到游戏开发相关任务时（biosphere-game 等），先读此文档了解架构原则和设计方向，再动手。
> **类型**：📖 知识索引
> **维护规则**：每月前沿调研时更新；踩坑后追加到对应章节。
> **最后更新**：2026-03-30
> **保鲜周期**：每月

---

## 一、当前项目状态概览

### biosphere-game

| 属性 | 状态 |
|------|------|
| **阶段** | 早期开发 |
| **平台** | 待定（可能微信小游戏 / 移动端） |
| **Unity 版本** | 2022+ |
| **渲染管线** | 待定（新项目建议 URP） |
| **当前 tag** | v1.3.0（2026-03-22） |
| **架构方向** | SO 优先 + 组合模式（见 SKILL.md 7.9） |

> 此表随项目发展更新。

---

## 二、游戏架构参考模式

### 核心模式：ScriptableObject 数据驱动

> 详见 SKILL.md 7.9 小节的架构原则。以下是具体模式的参考实现。

| 模式 | 用途 | 关键类 | 参考来源 |
|------|------|--------|----------|
| **FloatVariable SO** | 共享运行时数值（HP、分数、速度） | `FloatVariable : ScriptableObject` | Ryan Hipple GDC 2017 |
| **GameEvent SO** | 跨系统解耦消息传递 | `GameEvent : ScriptableObject` + `GameEventListener` | Ryan Hipple GDC 2017 |
| **RuntimeSet SO** | 无单例实体跟踪 | `RuntimeSet<T> : ScriptableObject` | Ryan Hipple GDC 2017 |
| **SO 状态机** | 状态模式 + 数据驱动 | State/Transition 都是 SO 资产 | 进阶模式 |
| **对象池** | 避免频繁 Instantiate/Destroy | Unity 2021+ 内置 `ObjectPool<T>` | Unity 官方文档 |

### 反模式观察名单

| ❌ 反模式 | 为什么不好 | ✅ 替代方案 |
|-----------|-----------|------------|
| `DontDestroyOnLoad` 单例泛滥 | 生命周期不可控、测试困难、加载顺序依赖 | SO 变量 + SO 事件通道 |
| `GameObject.Find()` / `FindObjectOfType()` | O(n) 搜索、字符串依赖、跨场景脆弱 | 通过 Inspector 注入 SO 引用 |
| God MonoBehaviour（500+ 行组件） | 职责不清、改一处影响全局 | 拆分为单一职责组件，通过 SO 通信 |
| `Update()` 里做可以事件驱动的逻辑 | 浪费帧预算 | 用 SO 事件 / UnityEvent / 协程 |
| public 字段满天飞 | 封装性差、Inspector 杂乱 | `[SerializeField] private` |

---

## 三、移动端/小游戏性能知识

> biosphere-game 可能部署在移动端或微信小游戏平台。以下是平台限制和优化方向。

| 类别 | 要点 | 详情 |
|------|------|------|
| **帧预算** | 30fps → 33ms/帧 | 渲染 ~16ms + 逻辑 ~10ms + 余量 ~7ms |
| **内存** | 微信小游戏 200-300MB 限制 | 纹理压缩 ASTC/ETC2、音频压缩、资源按需加载 |
| **DrawCall** | 移动端 < 100 为佳 | 合批（Static/Dynamic Batching）、SRP Batcher、图集 |
| **GC** | 每帧零分配为目标 | 对象池、避免 LINQ 热路径、缓存 GetComponent |
| **纹理** | 2K max，小游戏更严格 | 移动端 1K 为主，UI 用图集 |
| **Shader** | 移动端避免多 pass | URP Lit Shader 即可，避免自定义复杂 Shader |
| **加载** | 首包 < 20MB（微信小游戏） | Addressables 分包 + 首屏快速加载 |

---

## 四、游戏设计参考资源

| 资源 | 类型 | 关键词 |
|------|------|--------|
| **Ryan Hipple - Game Architecture with SO** | GDC 2017 演讲 | `scriptableobject game architecture GDC` |
| **Unite Austin 2017 - Overthrowing the MonoBehaviour Tyranny** | Unity 官方演讲 | `unite 2017 monobehaviour tyranny` |
| **Game Programming Patterns (Robert Nystrom)** | 在线书 | `gameprogrammingpatterns.com` |
| **Unity Best Practices** | 官方文档 | `docs.unity3d.com best practices` |
| **同类小游戏 benchmark** | 竞品研究 | 具体关键词根据游戏类型定 |

---

## 五、踩坑记录（游戏开发特有）

> 与 SKILL.md 7.9 的踩坑表同步维护。这里放详细描述，SKILL.md 放摘要。

| # | 日期 | 踩坑场景 | 详情 | 正确做法 |
|---|------|---------|------|---------|
| _(待积累)_ | | | | |

---

## 六、知识保鲜策略

> AI 每月游戏开发调研时执行以下操作：

1. **搜索** `Unity game development new features [当前年月]` 看 Unity 官方有无新功能
2. **搜索** `GDC [当前年] game design` 看 GDC 游戏设计分享
3. **搜索** `indie game innovative mechanics [当前年]` 看独立游戏创新玩法
4. **搜索** `微信小游戏 技术限制 [当前年]` 看平台限制更新（如果目标平台是微信小游戏）
5. **检查** 同类游戏（生态/生物圈主题）的最新作品
6. **更新此文档**：新技术/模式加到对应章节，过时的标注或移除
