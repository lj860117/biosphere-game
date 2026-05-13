#!/usr/bin/env python3
"""
skill-lint.py — hermanlei 的 Skill 体系结构一致性检查工具

6 条规则：
  1. 引用路径检查：.md 中引用的文件路径是否实际存在
  2. YAML 元数据检查：SKILL.md 有 name/description，子 Skill 有归属标签
  3. 交叉引用完整性：每个子 Skill 有"交叉引用"表
  4. 前置依赖一致性：子 Skill 声明了前置依赖，且 conventions 路由表包含它
  5. 文件树一致性：ARCHITECTURE.md 中列出的文件 vs 实际磁盘文件
  6. 截止日期检查：待清理副本是否过期

用法：
  python skill-lint.py                    # 检查所有 hermanlei 自建 Skill
  python skill-lint.py --verbose          # 显示每条规则的详细检查过程
  python skill-lint.py --fix-hints        # 显示修复建议

退出码：
  0 = 全部通过
  1 = 有 FAIL
"""

import os
import re
import sys
import glob
from datetime import datetime, date
from pathlib import Path

# ============================================================
# 配置
# ============================================================

SKILLS_ROOT = Path(os.path.expanduser("~")) / ".workbuddy" / "skills"

# hermanlei 自建的 Skill（需要 lint 的）
MANAGED_SKILLS = [
    "hermanlei-conventions",
    "scenecraft-dev",
    "scenecraft-agent",
    "unity-rendering",
    "unity-knowledge-guardian",
]

HUB_SKILL = "hermanlei-conventions"

# 子 Skill（排除 hub 自身）
CHILD_SKILLS = [s for s in MANAGED_SKILLS if s != HUB_SKILL]

VERBOSE = "--verbose" in sys.argv
FIX_HINTS = "--fix-hints" in sys.argv

# ============================================================
# 工具函数
# ============================================================

class LintResult:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []

    def ok(self, rule, msg):
        self.passed.append((rule, msg))
        if VERBOSE:
            print(f"  [PASS] {msg}")

    def fail(self, rule, msg, hint=""):
        self.failed.append((rule, msg, hint))
        print(f"  [FAIL] {msg}")
        if FIX_HINTS and hint:
            print(f"     -> Fix: {hint}")

    def warn(self, rule, msg):
        self.warnings.append((rule, msg))
        print(f"  [WARN] {msg}")


def read_file(path):
    """读取文件内容，返回字符串。文件不存在返回 None。"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except (FileNotFoundError, PermissionError):
        return None


def parse_yaml_header(content):
    """从 SKILL.md 解析 YAML front matter，返回 dict。"""
    if not content or not content.startswith("---"):
        return {}
    end = content.find("---", 3)
    if end == -1:
        return {}
    header_text = content[3:end]
    result = {}
    current_key = None
    current_value_lines = []

    for line in header_text.split("\n"):
        # 匹配 key: value 或 key: >
        m = re.match(r"^(\w[\w-]*):\s*(.*)", line)
        if m:
            # 保存前一个 key
            if current_key:
                result[current_key] = " ".join(current_value_lines).strip()
            current_key = m.group(1)
            val = m.group(2).strip()
            if val == ">":
                current_value_lines = []
            else:
                current_value_lines = [val]
        elif current_key and line.strip():
            current_value_lines.append(line.strip())

    if current_key:
        result[current_key] = " ".join(current_value_lines).strip()

    return result


def find_md_path_references(content, source_skill):
    """
    扫描 .md 内容中对其他文件的引用。
    匹配模式：
      - `references/xxx.md`
      - `skill-name/references/xxx.md`
      - `skill-name/SKILL.md`
    返回 [(引用路径, 行号)] 列表。
    """
    refs = []
    for i, line in enumerate(content.split("\n"), 1):
        # 匹配反引号中的路径引用
        for m in re.finditer(r"`([a-zA-Z0-9_-]+/(?:references/)?[a-zA-Z0-9_.-]+\.md)`", line):
            refs.append((m.group(1), i))
        # 匹配 references/xxx.md（本 Skill 内的引用）
        for m in re.finditer(r"`(references/[a-zA-Z0-9_.-]+\.md)`", line):
            refs.append((m.group(1), i))
    # 去重
    seen = set()
    unique = []
    for ref, line_no in refs:
        if ref not in seen:
            seen.add(ref)
            unique.append((ref, line_no))
    return unique


def resolve_ref_path(ref, source_skill):
    """
    将引用路径解析为实际磁盘路径。
    - `references/xxx.md` → {source_skill}/references/xxx.md
    - `skill-name/references/xxx.md` → {skill-name}/references/xxx.md
    - `skill-name/SKILL.md` → {skill-name}/SKILL.md
    """
    parts = ref.split("/")
    if parts[0] == "references":
        # 本 Skill 内的引用
        return SKILLS_ROOT / source_skill / ref
    elif parts[0] in MANAGED_SKILLS:
        # 跨 Skill 引用
        return SKILLS_ROOT / ref
    else:
        # 未知格式，跳过
        return None


# ============================================================
# 规则实现
# ============================================================

def rule_1_reference_paths(results):
    """规则 1：引用路径检查 — .md 中引用的文件路径是否实际存在"""
    print("\n[R1] Reference Path Check")

    for skill in MANAGED_SKILLS:
        skill_dir = SKILLS_ROOT / skill
        md_files = list(skill_dir.glob("*.md")) + list(skill_dir.glob("references/*.md"))

        for md_file in md_files:
            content = read_file(md_file)
            if not content:
                continue

            refs = find_md_path_references(content, skill)
            for ref, line_no in refs:
                resolved = resolve_ref_path(ref, skill)
                if resolved is None:
                    continue  # 无法解析的引用，跳过

                rel_source = f"{skill}/{md_file.name}"
                if resolved.exists():
                    results.ok("R1", f"[{rel_source}:L{line_no}] `{ref}` → 存在")
                else:
                    results.fail(
                        "R1",
                        f"[{rel_source}:L{line_no}] `{ref}` → 文件不存在！",
                        f"检查路径是否正确，或文件是否已移动/删除"
                    )


def rule_2_yaml_metadata(results):
    """规则 2：YAML 元数据检查"""
    print("\n[R2] YAML Metadata Check")

    for skill in MANAGED_SKILLS:
        skill_md = SKILLS_ROOT / skill / "SKILL.md"
        content = read_file(skill_md)
        if not content:
            results.fail("R2", f"[{skill}] SKILL.md 不存在或无法读取！")
            continue

        header = parse_yaml_header(content)

        # 检查 name
        if header.get("name"):
            if header["name"] == skill:
                results.ok("R2", f"[{skill}] name = '{header['name']}' OK")
            else:
                results.fail("R2",
                    f"[{skill}] name = '{header['name']}'，但目录名是 '{skill}'",
                    "name 应与目录名一致")
        else:
            results.fail("R2", f"[{skill}] 缺少 name 字段", "在 YAML header 中添加 name")

        # 检查 description
        if header.get("description"):
            results.ok("R2", f"[{skill}] 有 description OK")
        else:
            results.fail("R2", f"[{skill}] 缺少 description 字段")

        # 子 Skill 检查归属标签
        if skill in CHILD_SKILLS:
            desc = header.get("description", "")
            if re.search(r"\[归属:", desc):
                results.ok("R2", f"[{skill}] 有归属标签 OK")
            else:
                results.fail("R2",
                    f"[{skill}] description 缺少 [归属:xxx] 标签",
                    "在 description 末尾添加 [归属:通用] 或 [归属:项目(15hb)]")


def rule_3_cross_references(results):
    """规则 3：交叉引用完整性 — 每个子 Skill 有交叉引用表"""
    print("\n[R3] Cross-Reference Check")

    for skill in CHILD_SKILLS:
        skill_md = SKILLS_ROOT / skill / "SKILL.md"
        content = read_file(skill_md)
        if not content:
            results.fail("R3", f"[{skill}] SKILL.md 无法读取")
            continue

        # 检查是否有交叉引用表
        if "交叉引用" in content or "cross-reference" in content.lower():
            results.ok("R3", f"[{skill}] 有交叉引用段落 OK")

            # 检查是否引用了兄弟 Skill
            siblings = [s for s in CHILD_SKILLS if s != skill]
            for sibling in siblings:
                if sibling in content:
                    results.ok("R3", f"[{skill}] 引用了兄弟 Skill `{sibling}` OK")
                else:
                    results.warn("R3",
                        f"[{skill}] 交叉引用中未提及兄弟 Skill `{sibling}`（可能不需要，请确认）")
        else:
            results.fail("R3",
                f"[{skill}] 缺少「相关 Skill 交叉引用」段落",
                "添加一个表格列出与其他子 Skill 的协作场景")


def rule_4_dependency_consistency(results):
    """规则 4：前置依赖一致性"""
    print("\n[R4] Dependency Consistency Check")

    # 读取 conventions 路由表
    hub_md = SKILLS_ROOT / HUB_SKILL / "SKILL.md"
    hub_content = read_file(hub_md)
    if not hub_content:
        results.fail("R4", f"[{HUB_SKILL}] SKILL.md 无法读取，跳过依赖检查")
        return

    for skill in CHILD_SKILLS:
        skill_md = SKILLS_ROOT / skill / "SKILL.md"
        content = read_file(skill_md)
        if not content:
            results.fail("R4", f"[{skill}] SKILL.md 无法读取")
            continue

        # 检查子 Skill 声明了前置依赖
        if "hermanlei-conventions" in content and ("前置依赖" in content or "prerequisite" in content.lower()):
            results.ok("R4", f"[{skill}] 声明了前置依赖 hermanlei-conventions OK")
        else:
            results.fail("R4",
                f"[{skill}] 未声明前置依赖 hermanlei-conventions",
                "在 SKILL.md 顶部添加前置依赖说明")

        # 检查 conventions 路由表是否包含此子 Skill
        if f"`{skill}`" in hub_content or f"'{skill}'" in hub_content:
            results.ok("R4", f"[{HUB_SKILL}] 路由表包含 `{skill}` OK")
        else:
            results.fail("R4",
                f"[{HUB_SKILL}] 路由表中未找到 `{skill}` 的引用",
                f"在 conventions SKILL.md 的路由表中添加 {skill}")


def rule_5_file_tree_consistency(results):
    """规则 5：文件树一致性 — ARCHITECTURE.md 列出的文件 vs 实际磁盘"""
    print("\n[R5] File Tree Consistency Check")

    arch_path = SKILLS_ROOT / HUB_SKILL / "references" / "ARCHITECTURE.md"
    arch_content = read_file(arch_path)
    if not arch_content:
        results.fail("R5", "ARCHITECTURE.md 无法读取，跳过文件树检查")
        return

    for skill in MANAGED_SKILLS:
        skill_dir = SKILLS_ROOT / skill

        # 获取磁盘上 references/ 下的实际文件
        refs_dir = skill_dir / "references"
        if refs_dir.exists():
            actual_files = set(f.name for f in refs_dir.glob("*.md"))
        else:
            actual_files = set()

        # 从 ARCHITECTURE.md 中提取该 Skill 段落列出的 references 文件
        # 查找 ├── xxx.md 或 └── xxx.md 格式
        arch_files = set()
        # 找到属于该 skill 的文件树段落
        skill_section = False
        for line in arch_content.split("\n"):
            # 简单地匹配 ARCHITECTURE 中所有 .md 文件引用
            if skill + "/" in line or (skill_section and "```" in line):
                skill_section = not skill_section if "```" in line else skill_section

            # 匹配文件树中的 .md 文件
            m = re.search(r"[├└│─\s]+(\S+\.md)", line)
            if m and skill_section:
                arch_files.add(m.group(1))

        # 简化：直接检查每个实际 reference 文件是否在 ARCHITECTURE.md 中被提及
        for actual in actual_files:
            if actual in arch_content:
                results.ok("R5", f"[{skill}] references/{actual} 在 ARCHITECTURE.md 中有记录 OK")
            else:
                results.fail("R5",
                    f"[{skill}] references/{actual} 存在于磁盘但 ARCHITECTURE.md 中未记录",
                    f"更新 ARCHITECTURE.md 的文件树，添加 {actual}")

        # 检查 SKILL.md 是否存在
        if not (skill_dir / "SKILL.md").exists():
            results.fail("R5", f"[{skill}] SKILL.md 不存在！")


def rule_6_deadline_check(results):
    """规则 6：截止日期检查 — 待清理副本是否过期"""
    print("\n[R6] Deadline Check")

    today = date.today()

    # 扫描所有 SKILL.md 和 ARCHITECTURE.md 中的截止日期
    files_to_check = [
        SKILLS_ROOT / HUB_SKILL / "SKILL.md",
        SKILLS_ROOT / HUB_SKILL / "references" / "ARCHITECTURE.md",
        SKILLS_ROOT / HUB_SKILL / "references" / "README.md",
    ]

    deadline_pattern = re.compile(r"截止[日期时间]*[：:]*\s*(\d{4}-\d{2}-\d{2})")
    alt_pattern = re.compile(r"(\d{4}-\d{2}-\d{2})\s*前.*(?:清理|删除|移除)")
    alt_pattern2 = re.compile(r"(?:清理|删除|移除).*(\d{4}-\d{2}-\d{2})")

    found_deadlines = []

    for fpath in files_to_check:
        content = read_file(fpath)
        if not content:
            continue

        for line_no, line in enumerate(content.split("\n"), 1):
            for pattern in [deadline_pattern, alt_pattern, alt_pattern2]:
                m = pattern.search(line)
                if m:
                    try:
                        dl = datetime.strptime(m.group(1), "%Y-%m-%d").date()
                        found_deadlines.append((fpath.name, line_no, dl, line.strip()))
                    except ValueError:
                        pass

    if not found_deadlines:
        results.ok("R6", "未找到待清理截止日期（无副本需清理）")
        return

    # 去重
    seen = set()
    for fname, line_no, dl, line_text in found_deadlines:
        key = (fname, dl)
        if key in seen:
            continue
        seen.add(key)

        days_left = (dl - today).days
        if days_left < 0:
            results.fail("R6",
                f"[{fname}:L{line_no}] 截止日期 {dl} 已过期 {abs(days_left)} 天！",
                "立即清理过期副本或更新截止日期")
        elif days_left <= 3:
            results.warn("R6",
                f"[{fname}:L{line_no}] 截止日期 {dl} 还剩 {days_left} 天，即将到期")
        else:
            results.ok("R6", f"[{fname}:L{line_no}] 截止日期 {dl}，还剩 {days_left} 天 OK")


# ============================================================
# 主函数
# ============================================================

def main():
    print("=" * 60)
    print("[LINT] Skill Lint -- hermanlei Skill Structure Checker")
    print(f"   Scope: {', '.join(MANAGED_SKILLS)}")
    print(f"   Root:  {SKILLS_ROOT}")
    print(f"   Time:  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    results = LintResult()

    rule_1_reference_paths(results)
    rule_2_yaml_metadata(results)
    rule_3_cross_references(results)
    rule_4_dependency_consistency(results)
    rule_5_file_tree_consistency(results)
    rule_6_deadline_check(results)

    # Summary
    print("\n" + "=" * 60)
    print("[SUMMARY]")
    print("=" * 60)

    total = len(results.passed) + len(results.failed) + len(results.warnings)
    print(f"  Total checks: {total}")
    print(f"  [PASS]: {len(results.passed)}")
    print(f"  [FAIL]: {len(results.failed)}")
    print(f"  [WARN]: {len(results.warnings)}")

    if results.failed:
        print(f"\n{'~' * 60}")
        print("[FAIL] Summary:")
        for rule, msg, hint in results.failed:
            print(f"  [{rule}] {msg}")
        print(f"\nResult: {len(results.failed)} issue(s) need fixing!")
        return 1
    elif results.warnings:
        print(f"\nResult: All passed, {len(results.warnings)} warning(s) to review.")
        return 0
    else:
        print(f"\nResult: ALL PASS! Skill structure is consistent.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
