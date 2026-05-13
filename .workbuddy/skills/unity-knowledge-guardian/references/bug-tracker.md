# Bug 追踪（Bug Tracker）

> **维护者**：unity-knowledge-guardian Skill
> **编号规则**：`BUG-序号`，全局不重复
> **状态**：`[待修复]` / `[已修复]` / `[无法复现]` / `[设计如此]`
> **最后更新**：2026-04-11
> **说明**：从 daily log 和 MEMORY.md 中提取的已知 bug

---

### BUG-1：P4 reconcile 返回 296 条假阳性 [已修复]
- **发现日期**：2026-04-10
- **修复日期**：2026-04-10
- **现象**：Unity 内 Process.Start 调用 `p4 reconcile -n` 返回 296 条变更（实际 9 条），差值 287 条全是含中文路径文件
- **根因**：Windows 默认 936 GBK 代码页导致 p4 digest 计算出错
- **修复方案**：所有 Process.Start 调用 p4 用 `cmd /c "chcp 65001 && p4 ..."` 包装
- **关联条目**：P4-2

### BUG-2：p4 2023.2 下所有 P4 命令输出为空 [已修复]
- **发现日期**：2026-04-10
- **修复日期**：2026-04-10
- **现象**：同事 paul 升级 p4.exe 到 2023.2 后，SceneCraft 所有 P4 功能失效
- **根因**：p4 2023.2 与 chcp 65001 包装不兼容
- **修复方案**：DetectP4Version() 版本自动检测，根据版本决定是否包 chcp
- **关联条目**：P4-3, FEAT-2

### BUG-3：P4 Login 状态误判（新版 p4）[已修复]
- **发现日期**：2026-04-10
- **修复日期**：2026-04-10
- **现象**：p4 2023.2 已登录但工具判断为"未登录"，弹出密码框
- **根因**：p4 2023.2 的 `login -s` 将状态信息输出到 stderr 而非 stdout
- **修复方案**：合并 stdout + stderr 判断
- **关联条目**：P4-4

### BUG-4：P4 reconcile Assets/formal 时 stdout 全部丢失 [已修复]
- **发现日期**：2026-04-09
- **修复日期**：2026-04-09
- **现象**：对含特殊字符文件名的目录执行 reconcile，Process.Start 环境下 stdout 为 0 行
- **根因**：非 Unicode Server + 零宽 Unicode 字符 → Fatal client error 断开 session
- **修复方案**：检测 "No Translation" + stdout 为空 → 子目录分批重试
- **关联条目**：P4-1, FEAT-4

### BUG-5：VSCode 零错误但 Unity 编译报错 [设计如此]
- **发现日期**：2026-04-09
- **修复日期**：—
- **现象**：VSCode OmniSharp 报告零错误，Unity Console 报 CS0106 + CS1513
- **根因**：OmniSharp 增量分析对大文件（7000+ 行）花括号闭合检测有延迟/遗漏
- **修复方案**：无法"修复" OmniSharp，只能靠工作流规避（写完确认闭合 + Unity Console 验证）
- **关联条目**：TOOL-1
