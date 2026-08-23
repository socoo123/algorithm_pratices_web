#!/usr/bin/env python3
"""Generate 灵茶一期 / 二期 bank markdown from algorithm-journey."""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JOURNEY = Path("/Users/zy/ai_learn/algorithm-journey/灵茶problems")
BASE_DIR = ROOT / "content/banks/base"
P1_FILE = JOURNEY / "第一期刷题计划-300题.md"
P2_FILE = JOURNEY / "第二期刷题计划-300题.md"

DIFF_CN = {"简单": "Easy", "中等": "Medium", "困难": "Hard"}
DIFF_ORDER = {"Easy": 0, "Medium": 1, "Hard": 2}

SOURCE_FILES = {
    "sliding-window": JOURNEY / "01-滑动窗口与双指针.md",
    "binary-search": JOURNEY / "02-二分算法.md",
    "monotonic-stack": JOURNEY / "03-单调栈.md",
    "grid": JOURNEY / "04-网格图.md",
    "bit": JOURNEY / "05-位运算.md",
    "graph": JOURNEY / "06-图论算法.md",
    "dp": JOURNEY / "07-动态规划.md",
    "data-structure": JOURNEY / "08-常用数据结构.md",
    "math": JOURNEY / "09-数学算法.md",
    "greedy": JOURNEY / "10-贪心与思维.md",
    "linked-tree-backtrack": JOURNEY / "11-链表树与回溯.md",
    "string": JOURNEY / "12-字符串.md",
}

SKIP_KEYS = [
    "网络流",
    "费用流",
    "最小割",
    "斜率优化",
    "WQS",
    "SOS",
    "轮廓线",
    "插头",
    "基环树",
    "欧拉路径",
    "欧拉回路",
    "强连通",
    "双连通",
    "2-SAT",
    "2-sat",
]

INTERVIEW_BOOST = {
    4, 5, 8, 12, 13, 14, 22, 23, 31, 32, 33, 34, 35, 37, 39, 40, 41, 42, 43,
    45, 46, 47, 49, 51, 53, 54, 55, 56, 72, 74, 75, 76, 78, 79, 81, 84, 85,
    91, 94, 98, 102, 103, 105, 106, 114, 121, 122, 124, 127, 128, 130, 131,
    133, 136, 138, 139, 140, 146, 148, 152, 153, 155, 162, 198, 200, 207,
    208, 210, 212, 215, 221, 224, 226, 227, 230, 234, 236, 238, 239, 240,
    253, 279, 283, 287, 295, 297, 300, 301, 309, 310, 312, 322, 329, 337,
    347, 378, 380, 394, 399, 406, 416, 417, 437, 438, 460, 494, 516, 518,
    542, 543, 547, 560, 572, 621, 647, 695, 703, 718, 721, 739, 743, 752,
    763, 785, 787, 815, 863, 875, 889, 912, 973, 981, 990, 994, 1091, 1143,
    1248, 1319, 1514, 1584, 1631,
}

ROW_RE = re.compile(
    r"^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\((https://leetcode\.cn/problems/([^/]+)/)\)\s*\|\s*(简单|中等|困难)\s*\|\s*([^|]*)\|"
)
P1_RE = re.compile(
    r"^- \[[ xX]\] \*\*\[#(\d+)\s+([^\]]+)\]\((https://leetcode\.cn/problems/([^/]+)/)\)\*\* · (Easy|Medium|Hard) · ([^·]+) · (.+)$"
)
BASE_RE = re.compile(
    r"^- \[[ xX]\] \*\*\[#(\d+)\s+([^\]]+)\]\((https://leetcode\.cn/problems/([^/]+)/)\)\*\*"
)

P1_CATS: list[tuple[str, str]] = [
    ("滑动窗口与双指针", "sliding-window"),
    ("二分算法", "binary-search"),
    ("常用数据结构", "data-structure"),
    ("链表树与回溯", "linked-tree-backtrack"),
    ("网格图", "grid"),
    ("单调栈", "monotonic-stack"),
    ("贪心与思维", "greedy"),
    ("位运算", "bit"),
    ("数学算法", "math"),
    ("字符串", "string"),
    ("动态规划", "dp"),
]

# name, id, source key, filename, (Easy, Medium, Hard)
P2_CATS: list[tuple[str, str, str, str, tuple[int, int, int]]] = [
    ("滑动窗口与双指针", "sliding-window", "sliding-window", "滑动窗口与双指针.md", (3, 20, 2)),
    ("二分算法", "binary-search", "binary-search", "二分算法.md", (2, 16, 2)),
    ("常用数据结构", "data-structure", "data-structure", "常用数据结构.md", (4, 32, 4)),
    ("链表树与回溯", "linked-tree-backtrack", "linked-tree-backtrack", "链表树与回溯.md", (4, 23, 3)),
    ("网格图", "grid", "grid", "网格图.md", (1, 13, 1)),
    ("图论算法", "graph", "graph", "图论算法.md", (4, 32, 4)),
    ("单调栈", "monotonic-stack", "monotonic-stack", "单调栈.md", (0, 8, 2)),
    ("贪心与思维", "greedy", "greedy", "贪心与思维.md", (3, 20, 2)),
    ("位运算", "bit", "bit", "位运算.md", (3, 6, 1)),
    ("数学算法", "math", "math", "数学算法.md", (3, 8, 1)),
    ("字符串", "string", "string", "字符串.md", (1, 15, 2)),
    ("动态规划", "dp", "dp", "动态规划.md", (2, 47, 6)),
]

INTROS: dict[str, dict[str, object]] = {
    "sliding-window": {
        "intro": (
            "- 定长窗口、可变窗口计数、双序列双指针、分组循环都要能默写。\n"
            "- 先问自己：窗口何时合法？扩右、缩左各自维护什么？\n"
            "- 双指针题先画左右指针的单调性，再写代码。"
        ),
        "tips": [
            "面试常把定长窗口改成「至多 / 至少 K 个」——同一套欠债计数。",
            "相向双指针（接雨水 / 容器）和同向双指针（删除重复）不要混模板。",
        ],
    },
    "binary-search": {
        "intro": (
            "- 重点是二分答案、旋转数组、二维矩阵上的二分。\n"
            "- 写之前先定义：二分的是下标还是值？check() 是否单调？\n"
            "- 开闭区间选一套坚持到底。"
        ),
        "tips": [
            "搜索旋转数组、求峰值、吃香蕉 / 运货的「最小化最大值」极高频。",
            "面试爱追问：为什么 mid 要 +1、为什么不会死循环。",
        ],
    },
    "data-structure": {
        "intro": (
            "- 补前缀和、差分数组、单调队列、字典树、有序集合。\n"
            "- 先想要维护什么信息，再选结构。\n"
            "- 并查集：按秩合并 + 路径压缩，面试可能要求手写。"
        ),
        "tips": [
            "前缀和 + 哈希（和为 K）是数组题万金油。",
            "Top-K 用堆、滑动窗口最值用单调队列，两套必须能默写。",
        ],
    },
    "linked-tree-backtrack": {
        "intro": (
            "- 基础链表 / 树遍历之外，补构造、展开、BST 进阶和回溯剪枝。\n"
            "- 树题默认递归已经处理完子树，只想当前节点。\n"
            "- 回溯：做选择 → 递归 → 撤销；去重靠同层跳过。"
        ),
        "tips": [
            "二叉树构造、展开为链表、BST 第 K 小很爱考。",
            "子集 / 排列 / 组合去重说不清，这轮面试基本过不了。",
        ],
    },
    "grid": {
        "intro": (
            "- 网格 DFS/BFS 是图论的面试形态。方向数组写熟。\n"
            "- 先判边界再访问；改网格当 visited 要说明副作用。\n"
            "- 多源 BFS（腐烂橘子）比单源更常考。"
        ),
        "tips": [
            "岛屿类、二进制矩阵最短路、太平洋大西洋水流是网格高频套装。",
            "面试常要求原地修改或 O(1) 额外空间。",
        ],
    },
    "graph": {
        "intro": (
            "- 连通性、拓扑排序、最短路、并查集建模是图论面试主干。\n"
            "- 不刷网络流 / 强连通 / 基环树——绝大多数公司用不到。\n"
            "- 先建邻接表，再选 BFS / DFS / Dijkstra / 拓扑。"
        ),
        "tips": [
            "课程表、岛屿 / 省份、网络延迟几乎是图论面试三件套。",
            "能把矩阵 / 账户合并 / 方程建成图，比背模板加分。",
        ],
    },
    "monotonic-stack": {
        "intro": (
            "- 把下一个更大、矩形面积、贡献法再练一遍。\n"
            "- 栈里存下标，看的是高度或数值的单调性。\n"
            "- 先写暴力枚举左右边界，再说明单调栈如何一次求出。"
        ),
        "tips": [
            "每日温度、柱状图最大矩形、接雨水是单调栈门面题。",
            "面试会问：栈里为什么存下标而不是值。",
        ],
    },
    "greedy": {
        "intro": (
            "- 偏区间调度、分发、重构队列、跳跃游戏进阶。\n"
            "- 先想局部最优能否推到全局，写不出证明就先举反例。\n"
            "- 排序关键字选错，整题就错。"
        ),
        "tips": [
            "区间按右端点排序、按身高重建队列、分糖果是常考套路。",
            "跳跃游戏 / 加油站要能讲清贪心指针为什么只前进。",
        ],
    },
    "bit": {
        "intro": (
            "- 补异或找数、二进制枚举、入门状压。\n"
            "- `x & -x` 取最低 1 位；`x & (x-1)` 消最低 1 位。\n"
            "- 能用位运算就不要硬模拟。"
        ),
        "tips": [
            "只出现一次的数字、汉明重量、子集枚举最常见。",
            "先说清为什么可以用异或，再提 Kernighan 技巧。",
        ],
    },
    "math": {
        "intro": (
            "- 质数筛、快速幂、gcd、前缀积。\n"
            "- 快速幂可能手写；注意取模和 overflow。\n"
            "- 先看数据范围，再决定 O(√n) 还是筛法。"
        ),
        "tips": [
            "pow(x,n)、计数质数在部分公司很爱考。",
            "讲清时间和空间，比背公式重要。",
        ],
    },
    "string": {
        "intro": (
            "- 哈希、回文、子序列、字符串解码是面试主干。\n"
            "- 先判断双指针 / 哈希计数 / DP，再考虑 KMP。\n"
            "- 回文优先中心扩展，面试比 DP 更常考。"
        ),
        "tips": [
            "最长回文子串、字母异位词分组、字符串解码高频。",
            "KMP 能讲 next 数组原理即可，多数公司不要求默写。",
        ],
    },
    "dp": {
        "intro": (
            "- 线性 / 背包之外，补区间、划分、状态机、树形和入门状压。\n"
            "- 跳过斜率优化 / WQS / 轮廓线——竞赛向。\n"
            "- 状态定义先写在注释里，再写转移。"
        ),
        "tips": [
            "编辑距离、LIS、背包、股票、打家劫舍、区间 DP 是面试主干。",
            "能把二维压到一维是加分项，正确性优先。",
        ],
    },
}


@dataclass
class Item:
    number: int
    title: str
    slug: str
    url: str
    difficulty: str
    score: int | None
    section: str
    cat_id: str
    optional: bool = False
    skipped: bool = False


def parse_score(raw: str) -> int | None:
    s = raw.strip().replace("—", "").replace("–", "").replace("-", "")
    s = s.replace("≈", "").replace("~", "").replace("分", "")
    if not s or s in {"无", "无评分"}:
        return None
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else None


def default_score(diff: str) -> int:
    return {"Easy": 1300, "Medium": 1600, "Hard": 1900}[diff]


def stars_of(score: int | None) -> int:
    if score is None:
        return 4
    if score < 1400:
        return 2
    if score < 1600:
        return 3
    if score < 1850:
        return 4
    return 5


def heat_of(num: int, score: int | None, optional: bool, boosted: bool) -> int:
    if boosted:
        h = 5
    elif num < 2000:
        h = 4
    else:
        h = 3
    if optional:
        h -= 1
    if score is not None and score > 2000:
        h -= 1
    return max(1, min(5, h))


def hint_of(item: Item) -> str:
    score_text = f"{item.score}分" if item.score is not None else "无评分"
    section = item.section.strip() or "核心模板"
    return f"{score_text} · {section}"


def is_skipped(h2: str, h3: str) -> bool:
    return any(k in f"{h2} {h3}" for k in SKIP_KEYS)


def is_optional(h2: str, h3: str) -> bool:
    return "选做" in f"{h2} {h3}"


def parse_source_file(cat_id: str, path: Path) -> list[Item]:
    items: list[Item] = []
    h2, h3 = "", ""
    seen: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            h2 = line[3:].strip()
            h3 = ""
            continue
        if line.startswith("### "):
            h3 = line[4:].strip()
            continue
        m = ROW_RE.match(line)
        if not m:
            continue
        slug = m.group(4)
        if slug in seen:
            continue
        seen.add(slug)
        url = m.group(3)
        items.append(
            Item(
                number=int(m.group(1)),
                title=m.group(2).strip(),
                slug=slug,
                url=url if url.endswith("/") else url + "/",
                difficulty=DIFF_CN[m.group(5)],
                score=parse_score(m.group(6)),
                section=h3 or h2,
                cat_id=cat_id,
                optional=is_optional(h2, h3),
                skipped=is_skipped(h2, h3),
            )
        )
    return items


def parse_base_slugs() -> set[str]:
    slugs: set[str] = set()
    for f in BASE_DIR.glob("*.md"):
        if f.name == "README.md":
            continue
        for line in f.read_text(encoding="utf-8").splitlines():
            m = BASE_RE.match(line)
            if m:
                slugs.add(m.group(4))
    return slugs


def parse_period1() -> dict[str, list[Item]]:
    text = P1_FILE.read_text(encoding="utf-8")
    current_id = ""
    by_cat: dict[str, list[Item]] = defaultdict(list)
    for line in text.splitlines():
        if line.startswith("## "):
            for name, cid in P1_CATS:
                if name in line:
                    current_id = cid
                    break
            continue
        m = P1_RE.match(line)
        if not m or not current_id:
            continue
        url = m.group(3)
        by_cat[current_id].append(
            Item(
                number=int(m.group(1)),
                title=m.group(2).strip(),
                slug=m.group(4),
                url=url if url.endswith("/") else url + "/",
                difficulty=m.group(5),
                score=parse_score(m.group(6)),
                section=m.group(7).strip(),
                cat_id=current_id,
            )
        )
    return by_cat


def rank_key(item: Item) -> tuple:
    boosted = 0 if item.number in INTERVIEW_BOOST else 1
    score = item.score if item.score is not None else default_score(item.difficulty)
    return (
        boosted,
        1 if item.optional else 0,
        1 if item.number >= 3400 else 0,
        score,
        item.number,
    )


def pick(candidates: list[Item], n: int, used: set[str]) -> list[Item]:
    if n <= 0:
        return []
    chosen: list[Item] = []

    def take(pred) -> None:
        for c in sorted((x for x in candidates if pred(x)), key=rank_key):
            if len(chosen) >= n:
                return
            if c.slug in used:
                continue
            used.add(c.slug)
            chosen.append(c)

    take(lambda x: not x.skipped and not x.optional and x.number < 3400)
    take(lambda x: not x.skipped and not x.optional)
    take(lambda x: not x.skipped)
    take(lambda x: True)
    return chosen


def make_day_plan(cat_items: list[tuple[str, list[Item]]]) -> list[tuple[int, str, str]]:
    days: list[tuple[int, str, str]] = []
    buf_names: list[str] = []
    buf_count = 0
    day = 1

    def flush() -> None:
        nonlocal buf_names, buf_count, day
        if buf_count == 0:
            return
        days.append((day, " + ".join(buf_names), str(buf_count)))
        day += 1
        buf_names = []
        buf_count = 0

    for name, items in cat_items:
        n = len(items)
        i = 0
        chunk = 1
        total_chunks = (n + 14) // 15 if n else 0
        while i < n:
            take_n = min(15, n - i)
            if buf_count and buf_count + take_n > 18:
                flush()
            label = name if total_chunks <= 1 else f"{name} {chunk}"
            buf_names.append(label)
            buf_count += take_n
            i += take_n
            chunk += 1
            if buf_count >= 15:
                flush()
    flush()
    days.append((day, "总复习 + 二刷错题", "—"))
    return days


def render_problem(item: Item) -> str:
    boosted = item.number in INTERVIEW_BOOST
    stars = "★" * stars_of(item.score)
    heat = "🔥" * heat_of(item.number, item.score, item.optional, boosted)
    line = (
        f"- [ ] **[#{item.number} {item.title}]({item.url})** · {item.difficulty} · "
        f"{stars} · {heat} · {hint_of(item)}"
    )
    return "\n".join([line, "    - [ ] 第 1 遍", "    - [ ] 第 2 遍", "    - [ ] 第 3 遍"])


def render_category_md(title: str, count: int, items: list[Item], cat_id: str, bank_label: str) -> str:
    meta = INTROS[cat_id]
    easy = [x for x in items if x.difficulty == "Easy"]
    medium = [x for x in items if x.difficulty == "Medium"]
    hard = [x for x in items if x.difficulty == "Hard"]
    parts = [
        f"# {title}（{count} 题）",
        "",
        f"> {bank_label}。按 Easy → Medium → Hard 排列；同难度内面试优先级高、难度分低的在前。",
        "",
        "## 刷题建议",
        str(meta["intro"]),
        "",
        "## 评分说明",
        "- 经典度 ★：由灵神难度分映射（分越高通常越难）。",
        "- 常考热度 🔥：综合题号经典程度与面试出现频率；选做小节会降一档。",
        "- 考点列保留灵茶小节名 + 难度分，方便对照原题单。",
        "",
        "## 题目清单（按难度排序）",
        "",
    ]

    def dump(label: str, bucket: list[Item]) -> None:
        parts.append(f"### {label}（共 {len(bucket)} 题）")
        parts.append("")
        if not bucket:
            parts.append("（本分类无此难度）")
            parts.append("")
            return
        for it in bucket:
            parts.append(render_problem(it))
        parts.append("")

    dump("Easy", easy)
    dump("Medium", medium)
    dump("Hard", hard)
    parts.append("## 面试高频提示")
    for t in meta["tips"]:  # type: ignore[union-attr]
        parts.append(f"- {t}")
    parts.append("")
    return "\n".join(parts)


def render_readme(
    title: str,
    blurb: list[str],
    cat_rows: list[tuple[str, int, str]],
    day_plan: list[tuple[int, str, str]],
    easy: int,
    medium: int,
    hard: int,
) -> str:
    lines = [
        f"# {title}",
        "",
        *[f"> {b}" for b in blurb],
        "",
        "## 标签分布",
        "",
        "| 标签 | 题数 | 文件 |",
        "|------|------|------|",
    ]
    for name, n, fname in cat_rows:
        lines.append(f"| {name} | {n} | [{fname}]({fname}) |")
    lines += [
        f"| **合计** | **{easy + medium + hard}** | 简单 {easy} / 中等 {medium} / 困难 {hard} |",
        "",
        "## 评分体系",
        "- **经典度 ★**：由灵神难度分映射，帮助判断要吃透到什么程度。",
        "- **常考热度 🔥**：面试优先级。两个维度都高的题先刷。",
        "",
        "## 刷题计划",
        "",
        "| 天数 | 任务 | 题数 |",
        "|------|------|------|",
    ]
    for day, task, count in day_plan:
        lines.append(f"| Day {day} | {task} | {count} |")
    lines += [
        "",
        "## 使用方法",
        "1. 按分类文件从上往下刷（已按难度和优先级排好）。",
        "2. 时间紧先刷 🔥🔥🔥🔥 以上。",
        "3. 错题标记，计划最后一天集中二刷。",
        "",
    ]
    return "\n".join(lines)


def render_journey_p2(
    by_cat: list[tuple[str, list[Item]]],
    easy: int,
    medium: int,
    hard: int,
) -> str:
    lines = [
        "# 第二期刷题计划（300 题）",
        "",
        "> 🎯 **目标**：在基础题库 + 灵茶一期之后，补齐图论面试考点，并按难度分 / 面试优先级下探各专题，覆盖绝大多数公司算法题。",
        f"> 📊 **配比**：简单 {easy}｜中等 {medium}｜困难 {hard}（困难仍优先选难度分较低的「简单 Hard」）。",
        "> 📚 **来源**：灵茶山艾府 12 题单剩余题；**已排除基础题库与第一期**，不重复刷。",
        "> 🧭 **顺序**：滑窗/二分/数据结构 → 链表树回溯/网格/图论 → 单调栈/贪心/位运算/数学/字符串 → 动态规划。",
        "> 📌 **说明**：网络流、强连通、基环树、斜率优化 DP 等竞赛向内容不纳入本期。",
        "",
        "## 总览",
        "",
        "| # | 专题 | 题数 | 简单 | 中等 | 困难 |",
        "| :--: | :--- | ---: | ---: | ---: | ---: |",
    ]
    numerals = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"]
    for i, (name, items) in enumerate(by_cat):
        e = sum(1 for x in items if x.difficulty == "Easy")
        m = sum(1 for x in items if x.difficulty == "Medium")
        h = sum(1 for x in items if x.difficulty == "Hard")
        lines.append(f"| {numerals[i]} | {name} | {len(items)} | {e} | {m} | {h} |")
    lines.append(f"| | **合计** | **{easy + medium + hard}** | **{easy}** | **{medium}** | **{hard}** |")
    lines += ["", "---", ""]
    for i, (name, items) in enumerate(by_cat):
        lines.append(f"## {numerals[i]}、{name}（{len(items)} 题）")
        lines.append("")
        for diff, label in (("Easy", "简单"), ("Medium", "中等"), ("Hard", "困难")):
            bucket = [x for x in items if x.difficulty == diff]
            if not bucket:
                continue
            lines.append(f"### {label}（{len(bucket)} 题）")
            lines.append("")
            for it in bucket:
                score_text = f"{it.score}分" if it.score is not None else "无评分"
                lines.append(
                    f"- [ ] **[#{it.number} {it.title}]({it.url})** · {it.difficulty} · {score_text} · {it.section}"
                )
                lines.append("    - [ ] 第 1 遍")
                lines.append("    - [ ] 第 2 遍")
                lines.append("    - [ ] 第 3 遍")
            lines.append("")
    return "\n".join(lines)


def write_bank(
    bank_dir: Path,
    bank_title: str,
    blurb: list[str],
    cat_specs: list[tuple[str, str, str, list[Item]]],
    bank_label: str,
) -> None:
    bank_dir.mkdir(parents=True, exist_ok=True)
    for f in bank_dir.glob("*.md"):
        f.unlink()
    cat_rows: list[tuple[str, int, str]] = []
    cat_items: list[tuple[str, list[Item]]] = []
    easy = medium = hard = 0
    for display, cat_id, fname, items in cat_specs:
        items_sorted = sorted(items, key=lambda x: (DIFF_ORDER[x.difficulty], rank_key(x)))
        (bank_dir / fname).write_text(
            render_category_md(display, len(items_sorted), items_sorted, cat_id, bank_label),
            encoding="utf-8",
        )
        cat_rows.append((display, len(items_sorted), fname))
        cat_items.append((display, items_sorted))
        easy += sum(1 for x in items_sorted if x.difficulty == "Easy")
        medium += sum(1 for x in items_sorted if x.difficulty == "Medium")
        hard += sum(1 for x in items_sorted if x.difficulty == "Hard")
    day_plan = make_day_plan(cat_items)
    (bank_dir / "README.md").write_text(
        render_readme(bank_title, blurb, cat_rows, day_plan, easy, medium, hard),
        encoding="utf-8",
    )


def select_period2(catalog: dict[str, list[Item]], used: set[str]) -> dict[str, list[Item]]:
    selected: dict[str, list[Item]] = {cid: [] for _, cid, _, _, _ in P2_CATS}
    local_used = set(used)

    for _display, cid, source_key, _fname, (qe, qm, qh) in P2_CATS:
        pool = catalog[source_key]
        for quota, diff in ((qe, "Easy"), (qm, "Medium"), (qh, "Hard")):
            bucket = [x for x in pool if x.difficulty == diff]
            selected[cid].extend(pick(bucket, quota, local_used))

    have = sum(len(v) for v in selected.values())
    need = 300 - have
    counts = {
        "Easy": sum(1 for v in selected.values() for x in v if x.difficulty == "Easy"),
        "Medium": sum(1 for v in selected.values() for x in v if x.difficulty == "Medium"),
        "Hard": sum(1 for v in selected.values() for x in v if x.difficulty == "Hard"),
    }
    want = {"Easy": 30, "Medium": 240, "Hard": 30}

    if need > 0:
        remain: list[Item] = []
        for items in catalog.values():
            remain.extend(it for it in items if it.slug not in local_used)
        remain.sort(key=rank_key)
        for it in remain:
            if need <= 0:
                break
            if counts[it.difficulty] >= want[it.difficulty]:
                continue
            local_used.add(it.slug)
            selected[it.cat_id].append(it)
            counts[it.difficulty] += 1
            need -= 1

    if sum(len(v) for v in selected.values()) < 300:
        remain = []
        for items in catalog.values():
            remain.extend(it for it in items if it.slug not in local_used and not it.skipped)
        remain.sort(key=rank_key)
        for it in remain:
            if sum(len(v) for v in selected.values()) >= 300:
                break
            local_used.add(it.slug)
            selected[it.cat_id].append(it)

    return selected


def main() -> None:
    if not P1_FILE.exists():
        raise SystemExit(f"missing {P1_FILE}")

    catalog = {key: parse_source_file(key, path) for key, path in SOURCE_FILES.items()}
    all_source = [it for items in catalog.values() for it in items]
    print(f"灵茶全量（按文件计）: {len(all_source)}")

    base_slugs = parse_base_slugs()
    print(f"基础题库: {len(base_slugs)}")

    p1_by_cat = parse_period1()
    p1_items = [it for items in p1_by_cat.values() for it in items]
    p1_slugs = {it.slug for it in p1_items}
    print(f"第一期: {len(p1_items)} unique={len(p1_slugs)}")
    if len(p1_slugs) != 300:
        raise SystemExit(f"第一期不是 300 题：{len(p1_slugs)}")

    overlap_base = p1_slugs & base_slugs
    if overlap_base:
        print(f"警告：一期与 base 重叠 {len(overlap_base)}")

    used = set(base_slugs) | p1_slugs
    remain = [it for it in all_source if it.slug not in used]
    print(f"剩余候选: {len({it.slug for it in remain})}")
    print(f"剩余未 skip: {len({it.slug for it in remain if not it.skipped})}")

    p1_specs = [(name, cid, f"{name}.md", p1_by_cat[cid]) for name, cid in P1_CATS]
    for name, cid, _fname, items in p1_specs:
        print(f"  一期 {name}: {len(items)}")

    write_bank(
        ROOT / "content/banks/lingcha-1",
        "灵茶一期 · 300 题",
        [
            "灵茶题单**第一档**：系统补齐滑窗 / 二分 / 数据结构 / 树与回溯 / DP 等核心模板。",
            "已排除基础题库重复题。图论（最短路等）留到二期。",
            "配比：简单 30 ｜ 中等 240 ｜ 困难 30（简单 Hard）。",
        ],
        p1_specs,
        "灵茶一期",
    )

    selected = select_period2(catalog, used)
    p2_specs: list[tuple[str, str, str, list[Item]]] = []
    p2_for_journey: list[tuple[str, list[Item]]] = []
    total = easy = medium = hard = 0
    for display, cid, _src, fname, _q in P2_CATS:
        items = sorted(selected[cid], key=lambda x: (DIFF_ORDER[x.difficulty], rank_key(x)))
        p2_specs.append((display, cid, fname, items))
        p2_for_journey.append((display, items))
        total += len(items)
        e = sum(1 for x in items if x.difficulty == "Easy")
        m = sum(1 for x in items if x.difficulty == "Medium")
        h = sum(1 for x in items if x.difficulty == "Hard")
        easy += e
        medium += m
        hard += h
        print(f"  二期 {display}: {len(items)} (E{e} M{m} H{h})")

    print(f"二期合计 {total}  E{easy} M{medium} H{hard}")
    if total != 300:
        raise SystemExit(f"二期不是 300 题：{total}")

    write_bank(
        ROOT / "content/banks/lingcha-2",
        "灵茶二期 · 300 题",
        [
            "灵茶题单**第二档**：补图论面试考点，并按难度分与优先级下探各专题。",
            "已排除基础题库 + 灵茶一期。不收录网络流 / 强连通 / 斜率优化等竞赛向内容。",
            f"配比：简单 {easy} ｜ 中等 {medium} ｜ 困难 {hard}。",
        ],
        p2_specs,
        "灵茶二期",
    )

    P2_FILE.write_text(render_journey_p2(p2_for_journey, easy, medium, hard), encoding="utf-8")
    print(f"wrote {P2_FILE}")
    print("done")


if __name__ == "__main__":
    main()
