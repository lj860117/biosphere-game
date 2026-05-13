# 上下文触发表（Context Triggers）

> **维护者**：unity-knowledge-guardian Skill
> **用途**：AI 收到任务后提取关键词，匹配此表，命中则在回复开头插入提醒
> **最后更新**：2026-04-11
> **规则**：新增 pitfall/bug 时同步更新此表

---

## 触发表

| 触发关键词 | 关联条目 | 级别 | 提醒摘要 |
|-----------|---------|------|---------|
| APV, 烘焙, bake, Probe Volume, lightingScenario | APV-1, APV-2 | 🔴 | EcoEngine 魔改 ProbeReferenceVolume 到 EcoEngine.Rendering 命名空间，必须用反射；编辑模式不能用 BigWorld.SceneManager |
| APV, Scenario, 切换, 场景效果 | APV-3 | 🟡 | 切换 Scenario 后需 SceneView.RepaintAll() + QueuePlayerLoopUpdate()，加载需要几百ms~几秒 |
| APV, Scenario, 列表, 下拉 | APV-4 | 🟡 | 获取已烘焙 Scenario 列表需反射穿越 internal 字段，结果要缓存 |
| APV, isInitialized, 初始化 | APV-5 | 🟡 | 设置 lightingScenario 前必须检查 isInitialized |
| APV, BakingSet, 创建, 新建 | APV-7 | 🔴 | 不能用 YAML/代码创建 BakingSet，只能通过面板 "+" 按钮 |
| APV, Touchup, Adjustment, 光照泄漏, 探针调整 | APV-8 | 🟡 | 项目中叫 Probe Touchup Volume（不是 Adjustment Volume） |
| P4, reconcile, Process.Start, 中文路径 | P4-1, P4-2 | 🔴 | Process.Start 调用 p4 必须处理代码页问题；含特殊字符目录需分批 reconcile |
| P4, chcp, 代码页, 65001 | P4-2, P4-3 | 🔴 | 旧版 p4（<2020）需要 chcp 65001，新版（>=2020）加了 chcp 就炸。必须用 DetectP4Version() |
| P4, login, 登录, 密码 | P4-4 | 🟡 | login -s 在不同版本输出位置不同（stdout vs stderr），必须合并判断 |
| P4, p4.exe, 版本, 2014, 2023 | P4-3 | 🔴 | 团队 p4 版本不统一，所有 P4 代码必须兼容 2014.2 和 2023.2 |
| linter, OmniSharp, 编译, 花括号, CS0106, CS1513 | TOOL-1 | 🔴 | VSCode linter 零错误 ≠ Unity 编译通过，大文件尤其不可信 |
| 重构, 批量替换, 正则, PowerShell | — | 🔴 | 绝不用正则/脚本做 C# 批量重构（2026-03-27 血的教训，7+ 文件损坏回滚） |
| 文件名, 命名, 大小写 | — | 🟡 | Unity 项目所有 AI 生成文件名一律全小写（P4 大小写敏感） |
| Skill, SKILL.md, 拆分, 交叉引用, references, 新增Skill, 修改Skill | — | 🟡 | 修改 Skill 文件后记得跑 skill-lint.py 验证一致性（每日 14:00 也会自动跑） |
| 新功能, 调研, 之前做过, 有没有类似, 以前研究过, 参考, 知识索引 | — | 🟡 | 开发新功能前先查 `references/research-index.md`，看有没有之前调研过相关领域的成果 |

---

## 使用说明

**AI 行为流程**：
1. 收到用户任务
2. 提取任务中的关键词（任务描述 + 涉及的文件名/模块名）
3. 逐行扫描触发表，匹配关键词（部分匹配即命中）
4. 命中条目：
   - 🔴 必知 → **加粗放在回复最开头**，最多 3 条
   - 🟡 注意 → 正常提醒，放任务开始前
   - 🟢 参考 → 简短一行
5. 同一会话已提醒过的条目不重复提醒
6. 用户说"不用提醒了" → 本次会话后续不再提醒

**提醒格式**：
```
[知识守护者] 🔴 P4-2/P4-3：P4 调用必须经过版本检测，旧版需 chcp 65001，新版不能加
[知识守护者] 🟡 APV-8：项目中叫 Probe Touchup Volume（不是 Adjustment）
```
