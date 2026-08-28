#!/usr/bin/env python3
"""验收新生成的题解：八章结构、KaTeX 违禁字面量、Mermaid 深色配色。"""
import re
import sys
from pathlib import Path

import os
SOL_DIR = Path(os.environ.get("SOL_DIR", "/Users/zy/ai_web_page/algorithm_pratices_web/solutions/base"))

CHAPTERS = [
    "一、问题描述", "二、暴力解法", "三、优化探索", "四、代码实现",
    "五、", "六、复杂度", "七、", "八、举一反三",
]
CHAPTER_NAMES = ["问题描述", "暴力", "优化探索", "代码实现", "例子演示", "复杂度", "总结", "举一反三"]
BAD_MATH = ["$$", r"\(", "\\Theta", r"\lg", r"\lfloor"]
MERMAID_STYLE_RE = re.compile(r"fill:#2b2d3a")
LANG_RE = re.compile(r"```(java|python)")

def check(slug: str) -> dict:
    path = SOL_DIR / f"{slug}.md"
    res = {"slug": slug, "exists": path.exists(), "lines": 0, "missing_chapters": [],
           "bad_math": [], "mermaid_blocks": 0, "mermaid_styled": 0,
           "has_java": False, "has_python": False, "lc_links": 0}
    if not path.exists():
        return res
    text = path.read_text(encoding="utf-8")
    res["lines"] = text.count("\n") + 1
    res["missing_chapters"] = [c for c in CHAPTER_NAMES if not re.search(r"^## [一二三四五六七八]、.*" + c, text, re.M)]
    res["bad_math"] = [b for b in BAD_MATH if b in text]
    blocks = re.findall(r"```mermaid\n(.*?)```", text, re.S)
    res["mermaid_blocks"] = len(blocks)
    res["mermaid_styled"] = sum(1 for b in blocks if MERMAID_STYLE_RE.search(b))
    res["has_java"] = bool(LANG_RE.search(text.replace("```python", "```py_")) and "```java" in text)
    res["has_python"] = "```python" in text
    res["lc_links"] = text.count("leetcode.cn/problems/")
    # 浅色实心块违规（规范禁止）
    res["light_fill"] = bool(re.search(r"fill:#(FFE082|80DEEA|90CAF9|1f1f1f)", text))
    return res

def main():
    slugs = sys.argv[1:] or [
        "reverse-linked-list", "maximum-number-of-vowels-in-a-substring-of-given-length", "subsets",
        "merge-two-sorted-lists", "contains-duplicate-ii", "permutations",
        "maximum-depth-of-binary-tree", "climbing-stairs", "valid-parentheses",
    ]
    ok_all = True
    for s in slugs:
        r = check(s)
        flags = []
        if not r["exists"]:
            flags.append("❌ 文件不存在"); ok_all = False
        else:
            if r["missing_chapters"]: flags.append(f"❌ 缺章节:{r['missing_chapters']}"); ok_all = False
            if r["bad_math"]: flags.append(f"❌ 违禁数学:{r['bad_math']}"); ok_all = False
            if r["mermaid_blocks"] == 0: flags.append("❌ 无Mermaid图"); ok_all = False
            elif r["mermaid_styled"] < r["mermaid_blocks"]: flags.append(f"⚠️ {r['mermaid_styled']}/{r['mermaid_blocks']} 图未用深色规范")
            import os as _os
            if not r["has_java"] and _os.environ.get("LANG_MODE") != "python":
                flags.append("❌ 缺Java"); ok_all = False
            if not r["has_python"]: flags.append("⚠️ 缺Python")
            if r["light_fill"]: flags.append("❌ 浅色填充违规"); ok_all = False
        status = " ".join(flags) if flags else "✅ 通过"
        print(f"{s:58s} {r['lines']:4d}行 mermaid:{r['mermaid_styled']}/{r['mermaid_blocks']} {status}")
    print("\n总体:", "全部通过 ✅" if ok_all else "存在问题，见上 ❌")

if __name__ == "__main__":
    main()
