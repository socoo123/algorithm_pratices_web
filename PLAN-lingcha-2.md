# 灵茶二期题解工程 · 批次规划与执行手册

> 本文件是主会话的**唯一进度源**。清空 Cursor 上下文后：读本节「当前指针」+「启动清单」即可开跑下一批，不必依赖聊天记录。
> 最后更新：批 14 完成（磁盘 280 篇 / 280/300）

## 〇、当前指针（清空会话后只看这里）

| 项 | 值 |
|----|-----|
| **下一批** | **批 15** · DP③：背包 / 状压 / 优化 DP / Hard 收尾 |
| 已完成 | 14/15 批（280/300） |
| 磁盘核对 | `ls solutions/lingcha-2/*.md \| wc -l` 应为 `280`；`280 ÷ 20 = 14` 已完成批 → 下一批 = 15 |
| 预查新题 | #3218, #3334, #3376, #3250 |
| 样例 md | `solutions/lingcha-2/interleaving-string.md`（LCS）/ `number-of-longest-increasing-subsequence.md`（LIS）/ `can-i-win.md`（状压）/ `predict-the-winner.md`（博弈）/ `delete-and-earn.md`（打家劫舍） |

**完成后必须改这三处**（否则下次清空会话会重跑或跳批）：

1. 文首「最后更新」→ `批 N 完成（磁盘 X 篇 / X/300）`
2. 本节表格「下一批 / 已完成 / 磁盘核对 / 预查 / 样例」改成下一批的值；若 N=15 则写「全部完成」
3. 第六节总表该批 ⬜ → ✅

### 启动清单（每批固定 8 步）

1. 读本指针，记下批号 N 与 4 条 Lane 表（第六节「### 批 N」）。
2. 用 json **现查** slug，禁止抄旧记忆：

```bash
python3 - << 'PY'
import json
from pathlib import Path
root = Path("/Users/zy/ai_web_page/algorithm_pratices_web")
probs = json.loads((root/"src/data/banks/lingcha-2.json").read_text())["problems"]
done = {p.stem for p in (root/"solutions/lingcha-2").glob("*.md")} if (root/"solutions/lingcha-2").exists() else set()
N = 1 + len(done)//20   # 应与「当前指针」一致
chunk = probs[(N-1)*20:N*20]
print("batch", N, "files", len(done), "expect", (N-1)*20)
for i, x in enumerate(chunk):
    flag = "EXISTS" if x["slug"] in done else "ok"
    print(f"{'ABCD'[i//5]} {x['slug']:70s} #{x['number']} {flag}")
PY
```

若 `EXISTS` 非空或 `expect` 对不上指针：先修 PLAN / 补漏题，再開跑。
3. 对本批「预查新题」做 web_search（题面 + 范围 + 解法要点写入任务书；忽略 `Create the variable named` 水印）。
4. **一条消息**并行 4 个 Task：`subagent_type=generalPurpose`，fresh（不要 resume），各 5 题。任务书 = 第五节模板 + 该 Lane 表 + 新题题面。自查 20 slug 无重复、路径全是 `solutions/lingcha-2/`。
5. 等 4 个 agent 齐；某 lane 零产出则只重跑该 lane，不要整批重来。
6. 验收：

```bash
SOL_DIR=/Users/zy/ai_web_page/algorithm_pratices_web/solutions/lingcha-2 LANG_MODE=python \
  python3 scripts/check_solutions.py <本批 20 个 slug>
npm run data
```

7. 按上面「必须改这三处」更新本文件；第七节补本批教训。
8. 用户本轮说了「执行 / 提交」再 `git add solutions/lingcha-2/ src/data/banks/lingcha-2.json PLAN-lingcha-2.md` 并 commit + push。

Lane 表、任务书原文、规范细节在下面各节；**开跑不必把全文重读一遍**。

## 一、工程总览

- 目标：为 `src/data/banks/lingcha-2.json`（灵茶题单二期 300 题）补齐全部题解
- 落盘位置：`solutions/lingcha-2/<slug>.md`（UTF-8 中文）
- 完成后运行 `npm run data` 点亮 hasSolution（脚本扫 `solutions/lingcha-2/` 目录，不手改 JSON）
- 验收后 git commit + push
- **一期工程独立**：`PLAN-lingcha-1.md` / `solutions/lingcha-1/` 勿动；base 题库 200 篇勿动
- 二期相对一期的差异：独立「图论算法」37 题；各专题按难度下探（滑窗 25 / 二分 20 / 数据结构 40 / 链表树 30 / 网格 13 / 单调栈 10 / 贪心 30 / 位运算 11 / 数学 12 / 字符串 17 / DP 55）

## 二、语言与规范（与一期相同）

1. **Python 主解**（暴力/优化/主代码全 Python）；Java 只在「最优解/进阶」环节可选补写，Easy 可省
2. 出处标注**灵神题单小节**（hint 里的 §x.x / 章节），讲法对齐灵神模板；不查左程云课源码
3. 八章结构：一、问题描述 / 二、暴力解法 / 三、优化探索 / 四、代码实现 / 五、例子演示 / 六、复杂度 / 七、对比总结 / 八、举一反三（缺内容留标题占位）
4. Mermaid 深色规范：节点 `fill:#2b2d3a` + 描边（#f1fa8c/#8be9fd/#50fa7b/#ff5555/#ff79c6）+ `color:#f8f8f2`；subgraph `fill:#1e1f29`；禁浅色实心块；每篇 ≥1 张
5. 无 KaTeX：禁 `$$`、`\(`、`\Theta`、`\lg` 字面量；复杂度写 `O(n log n)` 行内代码；用 ⌊⌋ ⌈⌉ ≤ ≥
6. 例子演示端到端逐步跟踪（表格：双指针每轮 l/r、二分每轮 check、哈希每步表内容、dp 逐格、图 BFS 每层队列）
7. 举一反三给 leetcode.cn 真实链接；同族可互引 `solutions/lingcha-2/` 已写文件，也可链一期同题（若存在）但**必须**在二期目录另写一份，否则 hasSolution 不亮
8. **无行数限制**：Easy 精简（~230 行），Medium ~300-330 行，Hard / 重模板写透
9. 结构题（链表/树/图遍历）主解写简洁易懂的默写版（dummy、递归分治），不必照搬竞赛全局变量
10. **Worker 边界**：只创建名下 `solutions/lingcha-2/<slug>.md` 新文件；禁改现有文件、禁 npm、禁 git

## 三、验收流程（每批完成后）

```bash
# 验收（注意环境变量！）
SOL_DIR=/Users/zy/ai_web_page/algorithm_pratices_web/solutions/lingcha-2 LANG_MODE=python \
  python3 scripts/check_solutions.py <slug1> <slug2> ...
# 期望末行：「总体: 全部通过 ✅」

npm run data   # 输出 Built lingcha-2: 300 problems → ...

# 提交
git add solutions/lingcha-2/ src/data/banks/lingcha-2.json
git commit -m "Add lingcha-2 batch N: <主题> (X/300)"
git push origin main
```

验收脚本 `scripts/check_solutions.py`：查八章、KaTeX 违禁、Mermaid 深色、Python 代码块；`LANG_MODE=python` 时 Java 可选。

## 四、批次执行要点

开跑步骤以 **〇、启动清单** 为准。补充约定：

- 模式：**4 lane × 5 题 = 20 题/批**；共 **15 批 × 20 = 300**
- Task：`subagent_type=generalPurpose`，每批 fresh，不要 resume 上一批的 agent
- 任务书：精简版（必读 `solutions/MERMAID.md` + 一篇结构样例；规范内嵌任务书）
- 结构样例优先用已完成的 `solutions/lingcha-2/` 同族篇；批 1 用 `solutions/lingcha-1/video-stitching.md`
- **新题预查**：题号 ≥ 3000 或 hint 无评分的竞赛新题必查；忽略 `Create the variable named` 水印
- **避开晚间慢速期**：一期经验 22:30 后 API 极慢，早晨/白天执行
- 失败 lane 单独重跑；组装后自查 20 slug、无跨 lane 重复

## 五、任务书模板（直接改题目清单即可）

```
你在刷题站仓库 /Users/zy/ai_web_page/algorithm_pratices_web 工作。任务：为分给你的 5 道题各写一篇站点题解，落盘到 solutions/lingcha-2/<slug>.md（新文件，UTF-8，中文）。这是灵茶题单二期第 N 批（<主题>）。

## 快速上手（勿过度阅读）
- 只读两个文件：solutions/MERMAID.md（配色规范）+ solutions/lingcha-2/<一篇同族样例>.md（结构样例，看结构即可；若目录尚空则读 solutions/lingcha-1/video-stitching.md）。
- 八章结构：一、问题描述 / 二、暴力解法 / 三、优化探索 / 四、代码实现 / 五、例子演示 / 六、复杂度 / 七、对比总结 / 八、举一反三。
- 出处标注：标注灵神题单小节（题目清单给出的 §x.x），讲法对齐灵神对应模板（<本批模板要点>）。
- Mermaid 深色：节点 fill:#2b2d3a + 描边 #f1fa8c/#8be9fd/#50fa7b/#ff5555/#ff79c6 + color:#f8f8f2；subgraph fill:#1e1f29；禁浅色实心块。每篇 ≥1 张。
- 无 KaTeX：禁 $$、\( 、\Theta、\lg；复杂度写 `O(n)`；用 ⌊⌋ ⌈⌉ ≤ ≥。
- 例子演示逐步跟踪：<本批演示要求>。
- 举一反三给 leetcode.cn 真实链接，同族互引（可引用同目录已写文件名）。

## 语言与篇幅
- Python 主解（全文），Java 只在最优解环节可选补写，Easy 可省。Medium 300 行左右。
- 链表/树/图结构题：主解写简洁易懂默写版。

## 边界
- 只创建你名下 5 个 solutions/lingcha-2/<slug>.md 新文件；禁改现有文件、禁 npm、禁 git。
- 预置推导仅供参考，鼓励对拍；发现任务书推导有误以对拍为准并在交付里注明。

## 交付：逐题报告文件路径、八章齐全、灵神小节、Mermaid 自查、复杂度时间+空间。

## 题目清单（slug | #题号 题名 | 难度 | 小节 | URL |【新题必带题面/解法提示】）
...
```

## 六、批次总表（15 批 × 20 题）

| 批 | 主题 | 累计 | 状态 | 预查新题 |
|----|------|------|------|----------|
| 1 | 滑窗①：分组循环 + 原地修改 + 双指针基础 | 20/300 | ✅ | #3011 |
| 2 | 滑窗收尾 + 二分①：变长窗口 / 旋转数组 / 峰值 | 40/300 | ✅ | — |
| 3 | 二分收尾 + 数据结构①：二分答案 / 栈括号 / 枚举右 | 60/300 | ✅ | #3185 |
| 4 | 数据结构②：堆 / 前缀和 / 差分 / 单调队列 | 80/300 | ✅ | #3066, #3275 |
| 5 | 数据结构收尾 + 链表树①：Trie/计算器 + 树 DFS/BFS | 100/300 | ✅ | #3211 |
| 6 | 链表树② + 网格开头：删点/回溯 + 网格 DFS | 120/300 | ✅ | — |
| 7 | 网格收尾 + 图论①：BFS/0-1 BFS + DFS/Dijkstra/MST | 140/300 | ✅ | #3286, #3552, #3243 |
| 8 | 图论②：建模 BFS / 拓扑 / Dijkstra / 二分图 | 160/300 | ✅ | #3015, #3310, #3341, #3112, #3387 |
| 9 | 图论收尾 + 单调栈 + 贪心开头 | 180/300 | ✅ | #3216 |
| 10 | 贪心①：最值贪心 / 区间 / 配对 / 脑筋急转弯 | 200/300 | ✅ | #3191, #3075 |
| 11 | 贪心收尾 + 位运算 + 数学开头 | 220/300 | ✅ | #3226, #3171 |
| 12 | 数学收尾 + 字符串①：质数因子 + KMP/哈希 | 240/300 | ✅ | #3115, #3076 |
| 13 | 字符串收尾 + DP①：Z 函数/后缀 + 前后缀分解 | 260/300 | ✅ | #3388, #3403, #3722, #3147, #3259 |
| 14 | DP②：子序列 / LCS / LIS / 状压入门 / 博弈 | 280/300 | ✅ | #3393 |
| 15 | DP③：背包 / 状压 / 优化 DP / Hard 收尾 | 300/300 | ⬜ | #3218, #3334, #3376, #3250 |

### 批 1 · 滑窗①：分组循环 + 原地修改 + 双指针基础

- 分类：滑动窗口与双指针
- 演示要点：分组循环骨架、原地双指针、子序列双指针；例子演示逐步跟踪 l/r 或分组起止
- 启动前预查：#3011 `find-if-array-can-be-sorted` 判断一个数组是否可以变为有序

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `positions-of-large-groups` | #830 | 较大分组的位置 | Easy | 1252分 · 六、分组循环 |
| `remove-duplicates-from-sorted-array` | #26 | 删除有序数组中的重复项 | Easy | 无评分 · §3.5 原地修改 |
| `remove-element` | #27 | 移除元素 | Easy | 无评分 · §3.5 原地修改 |
| `length-of-the-longest-alphabetical-continuous-substring` | #2414 | 最长的字母序连续子字符串的长度 | Medium | 1222分 · 六、分组循环 |
| `adding-spaces-to-a-string` | #2109 | 向字符串添加空格 | Medium | 1315分 · §4.1 双指针 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `number-of-zero-filled-subarrays` | #2348 | 全 0 子数组的数目 | Medium | 1316分 · 六、分组循环 |
| `number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold` | #1343 | 大小为 K 且平均值大于等于阈值的子数组数目 | Medium | 1317分 · §1.1 基础 |
| `number-of-substrings-with-only-1s` | #1513 | 仅含 1 的子串数 | Medium | 1351分 · 六、分组循环 |
| `k-radius-subarray-averages` | #2090 | 半径为 k 的子数组平均值 | Medium | 1358分 · §1.1 基础 |
| `append-characters-to-string-to-make-subsequence` | #2486 | 追加字符以获得子序列 | Medium | 1363分 · §4.2 判断子序列 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `number-of-smooth-descent-periods-of-a-stock` | #2110 | 股票平滑下跌阶段的数目 | Medium | 1408分 · 六、分组循环 |
| `make-string-a-subsequence-using-cyclic-increments` | #2825 | 循环增长使字符串子序列等于另一个字符串 | Medium | 1415分 · §4.2 判断子序列 |
| `reduction-operations-to-make-the-array-elements-equal` | #1887 | 使数组元素相等的减少操作次数 | Medium | 1428分 · 六、分组循环 |
| `longest-mountain-in-array` | #845 | 数组中的最长山脉 | Medium | 1437分 · 六、分组循环 |
| `remove-colored-pieces-if-both-neighbors-are-the-same-color` | #2038 | 如果相邻两个颜色均相同则删除当前颜色 | Medium | 1468分 · 六、分组循环 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `count-number-of-homogenous-substrings` | #1759 | 统计同质子字符串的数目 | Medium | 1491分 · 六、分组循环 |
| `find-if-array-can-be-sorted` | #3011 | 判断一个数组是否可以变为有序 ⚠️新题 | Medium | 1497分 · 六、分组循环 |
| `minimum-length-of-string-after-deleting-similar-ends` | #1750 | 删除字符串两端相同字符后的最短长度 | Medium | 1502分 · §3.2 相向双指针 |
| `watering-plants-ii` | #2105 | 给植物浇水 II | Medium | 1507分 · §3.2 相向双指针 |
| `maximum-distance-between-a-pair-of-values` | #1855 | 下标对中的最大距离 | Medium | 1515分 · §4.1 双指针 |

### 批 2 · 滑窗收尾 + 二分①：变长窗口 / 旋转数组 / 峰值

- 分类：滑动窗口与双指针 → 二分算法
- 演示要点：变长窗口欠债计数；二分开闭区间一套坚持到底；例子演示每轮 mid/check

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `maximum-erasure-value` | #1695 | 删除子数组的最大得分 | Medium | 1529分 · §2.1 越短越合法/求最长/最大 |
| `length-of-longest-subarray-with-at-most-k-frequency` | #2958 | 最多 K 个重复元素的最长子数组 | Medium | 1535分 · §2.1 越短越合法/求最长/最大 |
| `camelcase-matching` | #1023 | 驼峰式匹配 | Medium | 1537分 · §4.2 判断子序列 |
| `first-missing-positive` | #41 | 缺失的第一个正数 | Hard | 无评分 · §3.5 原地修改 |
| `text-justification` | #68 | 文本左右对齐 | Hard | 无评分 · 六、分组循环 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `sqrtx` | #69 | x 的平方根 | Easy | 无评分 · 四、其他 |
| `count-complete-tree-nodes` | #222 | 完全二叉树的节点个数 | Easy | 无评分 · 四、其他 |
| `time-based-key-value-store` | #981 | 基于时间的键值存储 | Medium | 1146分 · §1.2 进阶 |
| `search-a-2d-matrix` | #74 | 搜索二维矩阵 | Medium | 无评分 · 四、其他 |
| `search-in-rotated-sorted-array-ii` | #81 | 搜索旋转排序数组 II | Medium | 无评分 · 四、其他 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `compare-strings-by-frequency-of-the-smallest-character` | #1170 | 比较字符串最小字母出现频次 | Medium | 1432分 · §1.2 进阶 |
| `h-index-ii` | #275 | H 指数 II | Medium | 无评分 · §2.2 求最大 |
| `find-k-pairs-with-smallest-sums` | #373 | 查找和最小的 K 对数字 | Medium | 无评分 · §2.6 第 K 小/大 |
| `heaters` | #475 | 供暖器 | Medium | 无评分 · §2.1 求最小 |
| `single-element-in-a-sorted-array` | #540 | 有序数组中的单一元素 | Medium | 无评分 · 四、其他 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `find-k-closest-elements` | #658 | 找到 K 个最接近的元素 | Medium | 无评分 · §1.2 进阶 |
| `peak-index-in-a-mountain-array` | #852 | 山脉数组的峰顶索引 | Medium | 无评分 · 四、其他 |
| `range-sum-of-sorted-subarray-sums` | #1508 | 子数组和排序后的区间和 | Medium | 无评分 · §2.6 第 K 小/大 |
| `find-a-peak-element-ii` | #1901 | 寻找峰值 II | Medium | 无评分 · 四、其他 |
| `maximum-number-of-removable-characters` | #1898 | 可移除字符的最大数目 | Medium | 1913分 · §2.2 求最大 |

### 批 3 · 二分收尾 + 数据结构①：二分答案 / 栈括号 / 枚举右

- 分类：二分算法 → 常用数据结构
- 演示要点：二分答案 check 单调性；枚举右维护左；栈模拟；预置推导仅供参考
- 启动前预查：#3185 `count-pairs-that-form-a-complete-day-ii` 构成整天的下标对数目 II

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `minimum-time-to-repair-cars` | #2594 | 修车的最少时间 | Medium | 1915分 · §2.1 求最小 |
| `maximum-value-at-a-given-index-in-a-bounded-array` | #1802 | 有界数组中指定下标处的最大值 | Medium | 1929分 · §2.2 求最大 |
| `minimum-absolute-sum-difference` | #1818 | 绝对差值和 | Medium | 1934分 · §1.2 进阶 |
| `find-minimum-in-rotated-sorted-array-ii` | #154 | 寻找旋转排序数组中的最小值 II | Hard | 无评分 · 四、其他 |
| `split-array-largest-sum` | #410 | 分割数组的最大值 | Hard | 无评分 · §2.4 最小化最大值 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `roman-to-integer` | #13 | 罗马数字转整数 | Easy | 无评分 · Part A |
| `backspace-string-compare` | #844 | 比较含退格的字符串 | Easy | 1228分 · §3.1 基础 |
| `points-that-intersect-with-cars` | #2848 | 与车相交的点 | Easy | 1230分 · §2.1 一维差分 |
| `maximum-difference-between-increasing-elements` | #2016 | 增量元素之间的最大差值 | Easy | 1246分 · §0.1 枚举右，维护左 |
| `string-to-integer-atoi` | #8 | 字符串转换整数 (atoi) | Medium | 无评分 · §3.5 表达式解析 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `basic-calculator-ii` | #227 | 基本计算器 II | Medium | 无评分 · §3.5 表达式解析 |
| `task-scheduler` | #621 | 任务调度器 | Medium | 无评分 · §5.4 重排元素 |
| `accounts-merge` | #721 | 账户合并 | Medium | 无评分 · §7.1 基础 |
| `continuous-subarray-sum` | #523 | 连续的子数组和 | Medium | 974分 · §1.2 前缀和与哈希表 |
| `count-pairs-that-form-a-complete-day-ii` | #3185 | 构成整天的下标对数目 II ⚠️新题 | Medium | 1010分 · §0.1 枚举右，维护左 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `build-an-array-with-stack-operations` | #1441 | 用栈操作构建数组 | Medium | 1180分 · §3.1 基础 |
| `minimum-add-to-make-parentheses-valid` | #921 | 使括号有效的最少添加 | Medium | 1242分 · §3.4 合法括号字符串（RBS） |
| `max-sum-of-a-pair-with-equal-sum-of-digits` | #2342 | 数位和相等数对的最大和 | Medium | 1309分 · §0.1 枚举右，维护左 |
| `max-number-of-k-sum-pairs` | #1679 | K 和数对的最大数目 | Medium | 1346分 · §0.1 枚举右，维护左 |
| `removing-stars-from-a-string` | #2390 | 从字符串中移除星号 | Medium | 1348分 · §3.1 基础 |

### 批 4 · 数据结构②：堆 / 前缀和 / 差分 / 单调队列

- 分类：常用数据结构
- 演示要点：堆基础、一维差分、二维前缀和、单调队列；设计题讲清 API
- 启动前预查：#3066 `minimum-operations-to-exceed-threshold-value-ii` 超过阈值的最少操作数 II; #3275 `k-th-nearest-obstacle-queries` 第 K 近障碍物查询

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `shifting-letters` | #848 | 字母移位 | Medium | 1353分 · §1.1 基础 |
| `minimum-consecutive-cards-to-pick-up` | #2260 | 必须拿起的最小连续卡牌数 | Medium | 1365分 · §0.1 枚举右，维护左 |
| `smallest-number-in-infinite-set` | #2336 | 无限集中的最小数字 | Medium | 1375分 · §5.1 基础 |
| `maximal-score-after-applying-k-operations` | #2530 | 执行 K 次操作后的最大分数 | Medium | 1386分 · §5.1 基础 |
| `minimum-operations-to-exceed-threshold-value-ii` | #3066 | 超过阈值的最少操作数 II ⚠️新题 | Medium | 1400分 · §5.1 基础 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `remove-stones-to-minimize-the-total` | #1962 | 移除石子使总数最小 | Medium | 1419分 · §5.1 基础 |
| `k-th-nearest-obstacle-queries` | #3275 | 第 K 近障碍物查询 ⚠️新题 | Medium | 1420分 · §5.1 基础 |
| `check-if-word-is-valid-after-substitutions` | #1003 | 检查替换后的词是否有效 | Medium | 1427分 · §3.3 邻项消除 |
| `seat-reservation-manager` | #1845 | 座位预约管理系统 | Medium | 1429分 · §5.1 基础 |
| `difference-of-number-of-distinct-values-on-diagonals` | #2711 | 对角线上不同值的数量差 | Medium | 1429分 · §0.3 遍历对角线 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `count-vowel-strings-in-ranges` | #2559 | 统计范围内的元音字符串数 | Medium | 1435分 · §1.1 基础 |
| `number-of-pairs-of-interchangeable-rectangles` | #2001 | 可互换矩形的组数 | Medium | 1436分 · §0.1 枚举右，维护左 |
| `continuous-subarrays` | #2762 | 不间断子数组 | Medium | 1438分 · §4.4 单调队列 |
| `car-pooling` | #1094 | 拼车 | Medium | 1441分 · §2.1 一维差分 |
| `design-browser-history` | #1472 | 设计浏览器历史记录 | Medium | 1454分 · §3.1 基础 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `xor-queries-of-a-subarray` | #1310 | 子数组异或查询 | Medium | 1460分 · §1.1 基础 |
| `string-without-aaa-or-bbb` | #984 | 不含 AAA 或 BBB 的字符串 | Medium | 1474分 · §5.4 重排元素 |
| `minimum-sum-of-mountain-triplets-ii` | #2909 | 元素和最小的山形三元组 II | Medium | 1479分 · §0.2 枚举中间 |
| `matrix-block-sum` | #1314 | 矩阵区域和 | Medium | 1484分 · §1.6 二维前缀和 |
| `reverse-substrings-between-each-pair-of-parentheses` | #1190 | 反转每对括号间的子串 | Medium | 1486分 · §3.4 合法括号字符串（RBS） |

### 批 5 · 数据结构收尾 + 链表树①：Trie/计算器 + 树 DFS/BFS

- 分类：常用数据结构 → 链表树与回溯
- 演示要点：结构题简洁易懂（dummy/递归）；Hard 写透；#3211 预查题面
- 启动前预查：#3211 `generate-binary-strings-without-adjacent-zeros` 生成不含相邻零的二进制字符串

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `sum-of-absolute-differences-in-a-sorted-array` | #1685 | 有序数组中差绝对值之和 | Medium | 1496分 · §1.3 距离和 |
| `longest-valid-parentheses` | #32 | 最长有效括号 | Hard | 无评分 · §3.4 合法括号字符串（RBS） |
| `word-break-ii` | #140 | 单词拆分 II | Hard | 无评分 · §6.3 字典树优化 DP |
| `word-search-ii` | #212 | 单词搜索 II | Hard | 无评分 · §6.2 进阶 |
| `basic-calculator` | #224 | 基本计算器 | Hard | 无评分 · §3.5 表达式解析 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `minimum-depth-of-binary-tree` | #111 | 二叉树的最小深度 | Easy | 无评分 · §2.2 自顶向下 DFS（先序遍历） |
| `remove-linked-list-elements` | #203 | 移除链表元素 | Easy | 无评分 · §1.2 删除节点 |
| `binary-tree-paths` | #257 | 二叉树的所有路径 | Easy | 无评分 · §2.7 回溯 |
| `sum-of-left-leaves` | #404 | 左叶子之和 | Easy | 无评分 · §2.1 遍历二叉树 |
| `find-the-duplicate-number` | #287 | 寻找重复数 | Medium | 无评分 · §1.6 快慢指针 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `all-nodes-distance-k-in-binary-tree` | #863 | 二叉树中所有距离为 K 的结点 | Medium | 无评分 · §2.13 二叉树 BFS |
| `construct-binary-tree-from-preorder-and-postorder-traversal` | #889 | 根据前序和后序遍历构造二叉树 | Medium | 1732分 · §2.10 创建二叉树 |
| `binary-search-tree-to-greater-sum-tree` | #1038 | 从二叉搜索树到更大和树 | Medium | 538分 · §2.5 有递有归 |
| `maximum-level-sum-of-a-binary-tree` | #1161 | 最大层内元素和 | Medium | 1250分 · §2.13 二叉树 BFS |
| `generate-binary-strings-without-adjacent-zeros` | #3211 | 生成不含相邻零的二进制字符串 ⚠️新题 | Medium | 1353分 · §4.7 搜索 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `count-good-nodes-in-binary-tree` | #1448 | 统计二叉树中好节点的数目 | Medium | 1360分 · §2.2 自顶向下 DFS（先序遍历） |
| `kth-largest-sum-in-a-binary-tree` | #2583 | 二叉树中的第 K 大层和 | Medium | 1374分 · §2.13 二叉树 BFS |
| `convert-bst-to-greater-tree` | #538 | 把二叉搜索树转换为累加树 | Medium | 1375分 · §2.5 有递有归 |
| `binary-tree-pruning` | #814 | 二叉树剪枝 | Medium | 1380分 · §2.4 自底向上 DFS：删点 |
| `deepest-leaves-sum` | #1302 | 层数最深叶子节点的和 | Medium | 1388分 · §2.13 二叉树 BFS |

### 批 6 · 链表树② + 网格开头：删点/回溯 + 网格 DFS

- 分类：链表树与回溯 → 网格图
- 演示要点：树题默认子树已处理完；回溯做选择→递归→撤销；网格方向数组

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `delete-leaves-with-a-given-value` | #1325 | 删除给定值的叶子节点 | Medium | 1407分 · §2.4 自底向上 DFS：删点 |
| `sum-of-nodes-with-even-valued-grandparent` | #1315 | 祖父节点值为偶数的节点和 | Medium | 1427分 · §2.2 自顶向下 DFS（先序遍历） |
| `smallest-string-starting-from-leaf` | #988 | 从叶结点开始的最小字符串 | Medium | 1429分 · §2.2 自顶向下 DFS（先序遍历） |
| `reverse-odd-levels-of-binary-tree` | #2415 | 反转二叉树的奇数层 | Medium | 1431分 · §2.13 二叉树 BFS |
| `numbers-with-same-consecutive-differences` | #967 | 连续差相同的数字 | Medium | 1433分 · §4.7 搜索 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `even-odd-tree` | #1609 | 奇偶树 | Medium | 1438分 · §2.13 二叉树 BFS |
| `find-elements-in-a-contaminated-binary-tree` | #1261 | 在受污染的二叉树中查找元素 | Medium | 1440分 · §2.16 其他 |
| `maximum-difference-between-node-and-ancestor` | #1026 | 节点与其祖先之间的最大差值 | Medium | 1446分 · §2.2 自顶向下 DFS（先序遍历） |
| `count-nodes-equal-to-average-of-subtree` | #2265 | 统计值等于子树平均值的节点数 | Medium | 1473分 · §2.3 自底向上 DFS（后序遍历） |
| `reachable-nodes-with-restrictions` | #2368 | 受限条件下可到达节点的数目 | Medium | 1477分 · §3.1 遍历 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `maximum-binary-tree-ii` | #998 | 最大二叉树 II | Medium | 1498分 · §2.10 创建二叉树 |
| `path-in-zigzag-labelled-binary-tree` | #1104 | 二叉树寻路 | Medium | 1545分 · §2.16 其他 |
| `remove-invalid-parentheses` | #301 | 删除无效的括号 | Hard | 无评分 · §4.4 组合型回溯 |
| `lfu-cache` | #460 | LFU 缓存 | Hard | 无评分 · §1.10 综合应用 |
| `maximum-score-words-formed-by-letters` | #1255 | 得分最高的单词集合 | Hard | 1882分 · §4.2 子集型回溯 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `flood-fill` | #733 | 图像渲染 | Easy | 无评分 · 一、网格图 DFS |
| `surrounded-regions` | #130 | 被围绕的区域 | Medium | 无评分 · 一、网格图 DFS |
| `pacific-atlantic-water-flow` | #417 | 太平洋大西洋水流问题 | Medium | 无评分 · 一、网格图 DFS |
| `01-matrix` | #542 | 01 矩阵 | Medium | 无评分 · 二、网格图 BFS |
| `max-area-of-island` | #695 | 岛屿的最大面积 | Medium | 无评分 · 一、网格图 DFS |

### 批 7 · 网格收尾 + 图论①：BFS/0-1 BFS + DFS/Dijkstra/MST

- 分类：网格图 → 图论算法
- 演示要点：多源 BFS、0-1 BFS；图论先建邻接表；新题 #3286/#3552/#3243 必预查
- 启动前预查：#3286 `find-a-safe-walk-through-a-grid` 穿越网格图的安全路径; #3552 `grid-teleportation-traversal` 网格传送门旅游; #3243 `shortest-distance-after-road-addition-queries-i` 新增道路查询后的最短距离 I

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `rotting-oranges` | #994 | 腐烂的橘子 | Medium | 无评分 · 二、网格图 BFS |
| `minesweeper` | #529 | 扫雷游戏 | Medium | 无评分 · 一、网格图 DFS |
| `minimum-sideway-jumps` | #1824 | 最少侧跳次数 | Medium | 无评分 · 三、网格图 0-1 BFS |
| `find-a-safe-walk-through-a-grid` | #3286 | 穿越网格图的安全路径 ⚠️新题 | Medium | 无评分 · 三、网格图 0-1 BFS |
| `find-the-safest-path-in-a-grid` | #2812 | 找出最安全路径 | Medium | 2154分 · 二、网格图 BFS |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `disconnect-path-in-a-binary-matrix-by-at-most-one-flip` | #2556 | 二进制矩阵中翻转最多一次使路径不连通 | Medium | 2369分 · 五、综合应用 |
| `grid-teleportation-traversal` | #3552 | 网格传送门旅游 ⚠️新题 | Medium | 2036分 · 三、网格图 0-1 BFS |
| `longest-increasing-path-in-a-matrix` | #329 | 矩阵中的最长递增路径 | Hard | 无评分 · 五、综合应用 |
| `find-if-path-exists-in-graph` | #1971 | 寻找图中是否存在路径 | Easy | 无评分 · §1.1 深度优先搜索（DFS） |
| `network-delay-time` | #743 | 网络延迟时间 | Medium | 无评分 · §3.1 单源最短路：Dijkstra 算法 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `is-graph-bipartite` | #785 | 判断二分图 | Medium | 1625分 · 七、二分图染色 |
| `number-of-operations-to-make-network-connected` | #1319 | 连通网络的操作次数 | Medium | 1633分 · §1.1 深度优先搜索（DFS） |
| `path-with-maximum-probability` | #1514 | 概率最大的路径 | Medium | 1846分 · §3.1 单源最短路：Dijkstra 算法 |
| `min-cost-to-connect-all-points` | #1584 | 连接所有点的最小费用 | Medium | 1858分 · 四、最小生成树 |
| `open-the-lock` | #752 | 打开转盘锁 | Medium | 1878分 · §1.3 图论建模 + BFS 最短路 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `cheapest-flights-within-k-stops` | #787 | K 站中转内最便宜的航班 | Medium | 1928分 · §3.1 单源最短路：Dijkstra 算法 |
| `all-paths-from-source-to-target` | #797 | 所有可能的路径 | Medium | 1383分 · §1.1 深度优先搜索（DFS） |
| `jump-game-iii` | #1306 | 跳跃游戏 III | Medium | 1397分 · §1.1 深度优先搜索（DFS） |
| `keys-and-rooms` | #841 | 钥匙和房间 | Medium | 1412分 · §1.1 深度优先搜索（DFS） |
| `shortest-distance-after-road-addition-queries-i` | #3243 | 新增道路查询后的最短距离 I ⚠️新题 | Medium | 1568分 · §1.2 广度优先搜索（BFS） |

### 批 8 · 图论②：建模 BFS / 拓扑 / Dijkstra / 二分图

- 分类：图论算法
- 演示要点：图论建模把状态当节点；拓扑序 DP；新题 #3015/#3310/#3341/#3112/#3387/#2998 预查
- 启动前预查：#3015 `count-the-number-of-houses-at-a-certain-distance-i` 按距离统计房屋对数目 I; #3310 `remove-methods-from-project` 移除可疑的方法; #3341 `find-minimum-time-to-reach-last-room-i` 到达最后一个房间的最少时间 I; #3112 `minimum-time-to-visit-disappearing-nodes` 访问消失节点的最少时间; #3387 `maximize-amount-after-two-days-of-conversions` 两天自由外汇交易后的最大货币数

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `minimum-genetic-mutation` | #433 | 最小基因变化 | Medium | 无评分 · §1.3 图论建模 + BFS 最短路 |
| `validate-binary-tree-nodes` | #1361 | 验证二叉树 | Medium | 无评分 · §2.1 拓扑排序 |
| `count-unreachable-pairs-of-nodes-in-an-undirected-graph` | #2316 | 统计无向图中无法互相到达点对数 | Medium | 1604分 · §1.1 深度优先搜索（DFS） |
| `get-watched-videos-by-your-friends` | #1311 | 获取你好友已观看的视频 | Medium | 1653分 · §1.2 广度优先搜索（BFS） |
| `count-the-number-of-houses-at-a-certain-distance-i` | #3015 | 按距离统计房屋对数目 I ⚠️新题 | Medium | 1658分 · §1.2 广度优先搜索（BFS） |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `find-all-possible-recipes-from-given-supplies` | #2115 | 从给定原材料中找到所有可以做出的菜 | Medium | 1679分 · §2.1 拓扑排序 |
| `minimum-score-of-a-path-between-two-cities` | #2492 | 两个城市间路径的最小分数 | Medium | 1680分 · §1.1 深度优先搜索（DFS） |
| `course-schedule-iv` | #1462 | 课程表 IV | Medium | 1693分 · §3.2 全源最短路：Floyd 算法 |
| `remove-methods-from-project` | #3310 | 移除可疑的方法 ⚠️新题 | Medium | 1711分 · §1.1 深度优先搜索（DFS） |
| `flower-planting-with-no-adjacent` | #1042 | 不邻接植花 | Medium | 1712分 · 九、其他 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `find-minimum-time-to-reach-last-room-i` | #3341 | 到达最后一个房间的最少时间 I ⚠️新题 | Medium | 1721分 · §3.1 单源最短路：Dijkstra 算法 |
| `minimum-time-to-visit-disappearing-nodes` | #3112 | 访问消失节点的最少时间 ⚠️新题 | Medium | 1757分 · §3.1 单源最短路：Dijkstra 算法 |
| `count-the-number-of-complete-components` | #2685 | 统计完全连通分量的数量 | Medium | 1769分 · §1.1 深度优先搜索（DFS） |
| `shortest-path-with-alternating-colors` | #1129 | 颜色交替的最短路径 | Medium | 1780分 · §1.2 广度优先搜索（BFS） |
| `loud-and-rich` | #851 | 喧闹和富有 | Medium | 1783分 · §2.2 在拓扑序上 DP |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `all-ancestors-of-a-node-in-a-directed-acyclic-graph` | #2192 | 有向无环图中一个节点的所有祖先 | Medium | 1788分 · §1.1 深度优先搜索（DFS） |
| `maximize-amount-after-two-days-of-conversions` | #3387 | 两天自由外汇交易后的最大货币数 ⚠️新题 | Medium | 1788分 · §1.1 深度优先搜索（DFS） |
| `possible-bipartition` | #886 | 可能的二分法 | Medium | 1795分 · 七、二分图染色 |
| `minimum-number-of-operations-to-make-x-and-y-equal` | #2998 | 使 X 和 Y 相等的最少操作次数 | Medium | 1795分 · §1.3 图论建模 + BFS 最短路 |
| `minimum-operations-to-convert-number` | #2059 | 转化数字的最小运算数 | Medium | 1850分 · §1.3 图论建模 + BFS 最短路 |

### 批 9 · 图论收尾 + 单调栈 + 贪心开头

- 分类：图论算法 → 单调栈 → 贪心与思维
- 演示要点：Floyd/单词接龙 Hard 写透；单调栈存下标；贪心先局部再全局
- 启动前预查：#3216 `lexicographically-smallest-string-after-a-swap` 交换后字典序最小的字符串

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance` | #1334 | 阈值距离内邻居最少的城市 | Medium | 1855分 · §3.2 全源最短路：Floyd 算法 |
| `word-ladder` | #127 | 单词接龙 | Hard | 无评分 · §1.3 图论建模 + BFS 最短路 |
| `bus-routes` | #815 | 公交路线 | Hard | 1964分 · §1.2 广度优先搜索（BFS） |
| `jump-game-iv` | #1345 | 跳跃游戏 IV | Hard | 1810分 · §1.3 图论建模 + BFS 最短路 |
| `minimum-number-of-flips-to-convert-binary-matrix-to-zero-matrix` | #1284 | 转化为全零矩阵的最少反转次数 | Hard | 1811分 · §1.3 图论建模 + BFS 最短路 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `smallest-subsequence-of-distinct-characters` | #1081 | 不同字符的最小子序列 | Medium | 316分 · 四、最小字典序 |
| `maximum-binary-tree` | #654 | 最大二叉树 | Medium | 无评分 · §1.2 进阶 |
| `car-fleet` | #853 | 车队 | Medium | 无评分 · §1.1 基础 |
| `minimum-cost-tree-from-leaf-values` | #1130 | 叶值的最小代价生成树 | Medium | 无评分 · §1.2 进阶 |
| `count-square-submatrices-with-all-ones` | #1277 | 统计全为 1 的正方形子矩阵 | Medium | 无评分 · 二、矩形 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `count-submatrices-with-all-ones` | #1504 | 统计全 1 子矩形 | Medium | 无评分 · 二、矩形 |
| `longest-well-performing-interval` | #1124 | 表现良好的最长时间段 | Medium | 1908分 · §1.2 进阶 |
| `largest-submatrix-with-rearrangements` | #1727 | 重新排列后的最大子矩阵 | Medium | 1927分 · 二、矩形 |
| `create-maximum-number` | #321 | 拼接最大数 | Hard | 无评分 · 四、最小字典序 |
| `jump-game-v` | #1340 | 跳跃游戏 V | Hard | 无评分 · §1.2 进阶 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `split-a-string-in-balanced-strings` | #1221 | 分割平衡字符串 | Easy | 1220分 · §1.5 划分型贪心 |
| `lexicographically-smallest-string-after-a-swap` | #3216 | 交换后字典序最小的字符串 ⚠️新题 | Easy | 1243分 · §3.1 字典序最小/最大 |
| `largest-odd-number-in-string` | #1903 | 字符串中的最大奇数 | Easy | 1249分 · §5.2 脑筋急转弯 |
| `longest-palindrome` | #409 | 最长回文串 | Easy | 1250分 · §3.2 回文串贪心 |
| `minimum-cost-of-buying-candies-with-discount` | #2144 | 打折购买糖果的最小开销 | Easy | 1261分 · §1.2 单序列配对 |

### 批 10 · 贪心①：最值贪心 / 区间 / 配对 / 脑筋急转弯

- 分类：贪心与思维
- 演示要点：排序关键字；从最小/最大开始；#3191/#3075 预查
- 启动前预查：#3191 `minimum-operations-to-make-binary-array-elements-equal-to-one-i` 使二进制数组全部等于 1 的最少操作次数 I; #3075 `maximize-happiness-of-selected-children` 幸福值最大化的选择方案

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `partition-labels` | #763 | 划分字母区间 | Medium | 1443分 · §2.5 合并区间 |
| `group-anagrams` | #49 | 字母异位词分组 | Medium | 无评分 · §5.3 等价转化 |
| `maximum-length-of-pair-chain` | #646 | 最长数对链 | Medium | 435分 · §2.1 不相交区间 |
| `maximum-bags-with-full-capacity-of-rocks` | #2279 | 装满石头的背包的最大数量 | Medium | 1249分 · §1.1 从最小/最大开始贪心 |
| `maximum-ice-cream-bars` | #1833 | 雪糕的最大数量 | Medium | 1253分 · §1.1 从最小/最大开始贪心 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `least-number-of-unique-integers-after-k-removals` | #1481 | 不同整数的最少数目 | Medium | 1284分 · §1.1 从最小/最大开始贪心 |
| `minimize-maximum-pair-sum-in-array` | #1877 | 数组中最大数对和的最小值 | Medium | 1301分 · §1.2 单序列配对 |
| `find-the-value-of-the-partition` | #2740 | 找出分区值 | Medium | 1302分 · 八、其他 |
| `reduce-array-size-to-the-half` | #1338 | 数组大小减半 | Medium | 1303分 · §1.1 从最小/最大开始贪心 |
| `minimum-operations-to-make-binary-array-elements-equal-to-one-i` | #3191 | 使二进制数组全部等于 1 的最少操作次数 I ⚠️新题 | Medium | 1312分 · §1.4 从最左/最右开始贪心 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `maximize-happiness-of-selected-children` | #3075 | 幸福值最大化的选择方案 ⚠️新题 | Medium | 1326分 · §1.1 从最小/最大开始贪心 |
| `strictly-palindromic-number` | #2396 | 严格回文的数字 | Medium | 1329分 · §5.2 脑筋急转弯 |
| `maximum-number-of-integers-to-choose-from-a-range-i` | #2554 | 从一个范围内选择最多整数 I | Medium | 1333分 · §1.1 从最小/最大开始贪心 |
| `destroying-asteroids` | #2126 | 摧毁小行星 | Medium | 1335分 · §1.1 从最小/最大开始贪心 |
| `rearrange-array-to-maximize-prefix-score` | #2587 | 重排数组以得到最大前缀分数 | Medium | 1337分 · §1.1 从最小/最大开始贪心 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `minimum-processing-time` | #2895 | 最小处理时间 | Medium | 1352分 · §1.7 交换论证法 |
| `partitioning-into-minimum-number-of-deci-binary-numbers` | #1689 | 十-二进制数的最少数目 | Medium | 1355分 · §5.2 脑筋急转弯 |
| `optimal-partition-of-string` | #2405 | 子字符串的最优划分 | Medium | 1355分 · §1.5 划分型贪心 |
| `smallest-value-of-the-rearranged-number` | #2165 | 重排数字的最小值 | Medium | 1362分 · §5.7 分类讨论 |
| `minimum-rounds-to-complete-all-tasks` | #2244 | 完成所有任务需要的最少轮数 | Medium | 1372分 · §4.1 基础 |

### 批 11 · 贪心收尾 + 位运算 + 数学开头

- 分类：贪心与思维 → 位运算 → 数学算法
- 演示要点：区间覆盖/逆向思维；XOR 性质；#3226/#3171 LogTrick 预查
- 启动前预查：#3226 `number-of-bit-changes-to-make-two-integers-equal` 使两个整数相等的位更改次数; #3171 `find-subarray-with-bitwise-or-closest-to-k` 找到按位或最接近 K 的子数组

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `maximum-value-after-insertion` | #1881 | 插入后的最大值 | Medium | 1381分 · §3.1 字典序最小/最大 |
| `maximum-matching-of-players-with-trainers` | #2410 | 运动员和训练师的最大匹配数 | Medium | 1381分 · §1.3 双序列配对 |
| `removing-minimum-and-maximum-from-array` | #2091 | 从数组中移除最大值和最小值 | Medium | 1384分 · §5.7 分类讨论 |
| `minimum-number-of-taps-to-open-to-water-a-garden` | #1326 | 灌溉花园的最少水龙头数目 | Hard | 1885分 · §2.4 区间覆盖 |
| `reaching-points` | #780 | 到达终点 | Hard | 1897分 · §5.4 逆向思维 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `single-number` | #136 | 只出现一次的数字 | Easy | 无评分 · 九、其他 |
| `check-if-bitwise-or-has-trailing-zeros` | #2980 | 检查按位或是否存在尾随零 | Easy | 1234分 · 三、与或（AND/OR）的性质 |
| `number-of-bit-changes-to-make-two-integers-equal` | #3226 | 使两个整数相等的位更改次数 ⚠️新题 | Easy | 1247分 · 一、基础题 |
| `sort-integers-by-the-number-of-1-bits` | #1356 | 根据数字二进制下 1 的数目排序 | Easy | 1258分 · 一、基础题 |
| `find-the-original-array-of-prefix-xor` | #2433 | 找出前缀异或的原始数组 | Medium | 1367分 · 二、异或（XOR）的性质 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `minimum-flips-to-make-a-or-b-equal-to-c` | #1318 | 或运算的最小翻转次数 | Medium | 1383分 · 三、与或（AND/OR）的性质 |
| `longest-subarray-with-maximum-bitwise-and` | #2419 | 按位与最大的最长子数组 | Medium | 1496分 · 三、与或（AND/OR）的性质 |
| `neighboring-bitwise-xor` | #2683 | 相邻值的按位异或 | Medium | 1518分 · 二、异或（XOR）的性质 |
| `maximum-xor-for-each-query` | #1829 | 每个查询的最大异或值 | Medium | 1523分 · 二、异或（XOR）的性质 |
| `count-triplets-that-can-form-two-arrays-of-equal-xor` | #1442 | 形成两个异或相等数组的三元组数目 | Medium | 1525分 · 二、异或（XOR）的性质 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `find-subarray-with-bitwise-or-closest-to-k` | #3171 | 找到按位或最接近 K 的子数组 ⚠️新题 | Hard | 无评分 · AND/OR LogTrick |
| `find-greatest-common-divisor-of-array` | #1979 | 找出数组的最大公约数 | Easy | 1184分 · §1.6 最大公约数（GCD） |
| `three-divisors` | #1952 | 三除数 | Easy | 1204分 · §1.5 因子 |
| `check-if-it-is-a-straight-line` | #1232 | 缀点成线 | Easy | 1247分 · §5.1 点、线 |
| `insert-delete-getrandom-o1` | #380 | O(1) 时间插入、删除和获取随机元素 | Medium | 无评分 · §6.1 随机数 |

### 批 12 · 数学收尾 + 字符串①：质数因子 + KMP/哈希

- 分类：数学算法 → 字符串
- 演示要点：KMP next 数组原理；字符串哈希注意模数；#3115/#3076 预查
- 启动前预查：#3115 `maximum-prime-difference` 质数的最大距离; #3076 `shortest-uncommon-substring-in-an-array` 数组中的最短非公共子字符串

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `the-kth-factor-of-n` | #1492 | n 的第 k 个因子 | Medium | 1232分 · §1.5 因子 |
| `maximum-prime-difference` | #3115 | 质数的最大距离 ⚠️新题 | Medium | 1294分 · §1.1 判断质数 |
| `determine-the-minimum-sum-of-a-k-avoiding-array` | #2829 | k-avoiding 数组的最小总和 | Medium | 1347分 · §7.8 其他 |
| `count-total-number-of-colored-cells` | #2579 | 统计染色格子数 | Medium | 1356分 · §7.8 其他 |
| `simplified-fractions` | #1447 | 最简分数 | Medium | 1400分 · §1.8 互质 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `find-the-minimum-possible-sum-of-a-beautiful-array` | #2834 | 找出美丽数组的最小和 | Medium | 1409分 · §7.8 其他 |
| `distinct-prime-factors-of-product-of-array` | #2521 | 数组乘积中的不同质因数数目 | Medium | 1413分 · §1.3 质因数分解 |
| `consecutive-numbers-sum` | #829 | 连续整数求和 | Hard | 1694分 · §1.5 因子 |
| `find-the-index-of-the-first-occurrence-in-a-string` | #28 | 找出字符串中第一个匹配项的下标 | Easy | 无评分 · 一、KMP（前缀的后缀） |
| `maximum-length-of-repeated-subarray` | #718 | 最长重复子数组 | Medium | 无评分 · 四、字符串哈希 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `repeated-dna-sequences` | #187 | 重复的 DNA 序列 | Medium | 无评分 · 四、字符串哈希 |
| `maximum-number-of-occurrences-of-a-substring` | #1297 | 子串的最大出现次数 | Medium | 无评分 · 四、字符串哈希 |
| `lexicographically-smallest-string-after-applying-operations` | #1625 | 执行操作后字典序最小的字符串 | Medium | 无评分 · 五、最小表示法 |
| `largest-merge-of-two-strings` | #1754 | 构造字典序最大的合并字符串 | Medium | 无评分 · 八、后缀数组/后缀自动机 |
| `form-array-by-concatenating-subarrays-of-another-array` | #1764 | 通过连接另一个数组的子数组得到一个数组 | Medium | 无评分 · 一、KMP（前缀的后缀） |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `k-divisible-elements-subarrays` | #2261 | 含最多 K 个可整除元素的子数组 | Medium | 无评分 · 四、字符串哈希 |
| `shortest-string-that-contains-three-strings` | #2800 | 包含三个字符串的最短字符串 | Medium | 无评分 · 一、KMP（前缀的后缀） |
| `shortest-and-lexicographically-smallest-beautiful-string` | #2904 | 最短且字典序最小的美丽子字符串 | Medium | 无评分 · 八、后缀数组/后缀自动机 |
| `shortest-uncommon-substring-in-an-array` | #3076 | 数组中的最短非公共子字符串 ⚠️新题 | Medium | 无评分 · 八、后缀数组/后缀自动机 |
| `repeated-string-match` | #686 | 重复叠加字符串匹配 | Medium | 2200分 · 一、KMP（前缀的后缀） |

### 批 13 · 字符串收尾 + DP①：Z 函数/后缀 + 前后缀分解

- 分类：字符串 → 动态规划
- 演示要点：重模板写透；前后缀分解先画分割点；新题 #3388/#3403/#3722/#3147/#3259 预查
- 启动前预查：#3388 `count-beautiful-splits-in-an-array` 统计数组中的美丽分割; #3403 `find-the-lexicographically-largest-string-from-the-box-i` 从盒子中找出字典序最大的字符串 I; #3722 `lexicographically-smallest-string-after-reverse` 反转后字典序最小的字符串; #3147 `taking-maximum-energy-from-the-mystic-dungeon` 从魔法师身上吸取的最大能量; #3259 `maximum-energy-boost-from-two-drinks` 超级饮料的最大强化能量

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `count-beautiful-splits-in-an-array` | #3388 | 统计数组中的美丽分割 ⚠️新题 | Medium | 2365分 · 二、Z 函数（后缀的前缀） |
| `find-the-lexicographically-largest-string-from-the-box-i` | #3403 | 从盒子中找出字典序最大的字符串 I ⚠️新题 | Medium | 无评分 · 五、最小表示法 |
| `lexicographically-smallest-string-after-reverse` | #3722 | 反转后字典序最小的字符串 ⚠️新题 | Medium | 无评分 · 四、字符串哈希 |
| `last-substring-in-lexicographical-order` | #1163 | 按字典序排在最后的子串 | Hard | 1864分 · 八、后缀数组/后缀自动机 |
| `longest-happy-prefix` | #1392 | 最长快乐前缀 | Hard | 1876分 · 一、KMP（前缀的后缀） |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `fibonacci-number` | #509 | 斐波那契数 | Easy | 无评分 · §11.6 矩阵快速幂优化 DP |
| `find-pivot-index` | #724 | 寻找数组的中心下标 | Easy | 无评分 · 专题：前后缀分解 |
| `product-of-array-except-self` | #238 | 除了自身以外数组的乘积 | Medium | 无评分 · 专题：前后缀分解 |
| `maximum-strength-of-a-group` | #2708 | 一个小组的最大实力值 | Medium | 152分 · §6.2 基础 |
| `number-of-ways-to-split-array` | #2270 | 分割数组的方案数 | Medium | 1334分 · 专题：前后缀分解 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `minimum-average-difference` | #2256 | 最小平均差 | Medium | 1395分 · 专题：前后缀分解 |
| `find-the-substring-with-maximum-cost` | #2606 | 找到最大开销的子字符串 | Medium | 1422分 · §1.3 最大子数组和（最大子段和） |
| `taking-maximum-energy-from-the-mystic-dungeon` | #3147 | 从魔法师身上吸取的最大能量 ⚠️新题 | Medium | 1460分 · §7.1 一维 DP |
| `sum-of-beauty-in-the-array` | #2012 | 数组美丽值求和 | Medium | 1468分 · 专题：前后缀分解 |
| `longest-square-streak-in-an-array` | #2501 | 数组中最长的方波 | Medium | 1480分 · §7.4 合法子序列 DP |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `maximum-energy-boost-from-two-drinks` | #3259 | 超级饮料的最大强化能量 ⚠️新题 | Medium | 1484分 · §6.2 基础 |
| `minimum-penalty-for-a-shop` | #2483 | 商店的最少代价 | Medium | 1495分 · 专题：前后缀分解 |
| `number-of-good-ways-to-split-a-string` | #1525 | 字符串的好分割数目 | Medium | 1500分 · 专题：前后缀分解 |
| `sort-integers-by-the-power-value` | #1387 | 将整数按权重排序 | Medium | 1507分 · 其他 |
| `unique-length-3-palindromic-subsequences` | #1930 | 长度为 3 的不同回文子序列 | Medium | 1533分 · 专题：前后缀分解 |

### 批 14 · DP②：子序列 / LCS / LIS / 状压入门 / 博弈

- 分类：动态规划
- 演示要点：状态定义写在注释；LCS/LIS 模板对齐灵神
- 启动前预查：#3393 `count-paths-with-the-given-xor-value` 统计异或值为给定值的路径数目

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `maximum-absolute-sum-of-any-subarray` | #1749 | 任意子数组和的绝对值的最大值 | Medium | 1542分 · §1.3 最大子数组和（最大子段和） |
| `minimum-index-of-a-valid-split` | #2780 | 合法分割的最小下标 | Medium | 1550分 · 专题：前后缀分解 |
| `count-paths-with-the-given-xor-value` | #3393 | 统计异或值为给定值的路径数目 ⚠️新题 | Medium | 1573分 · §2.1 基础 |
| `stone-game` | #877 | 石子游戏 | Medium | 1590分 · 十四、博弈 DP |
| `ways-to-make-a-fair-array` | #1664 | 生成平衡数组的方案数 | Medium | 1590分 · 专题：前后缀分解 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `longest-arithmetic-subsequence-of-given-difference` | #1218 | 最长定差子序列 | Medium | 1597分 · §7.4 合法子序列 DP |
| `interleaving-string` | #97 | 交错字符串 | Medium | 无评分 · §4.1 最长公共子序列（LCS） |
| `increasing-triplet-subsequence` | #334 | 递增的三元子序列 | Medium | 无评分 · §4.2 最长递增子序列（LIS） |
| `wiggle-subsequence` | #376 | 摆动序列 | Medium | 无评分 · §6.2 基础 |
| `integer-replacement` | #397 | 整数替换 | Medium | 无评分 · 其他 |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `can-i-win` | #464 | 我能赢吗 | Medium | 无评分 · §9.7 其他状压 DP |
| `predict-the-winner` | #486 | 预测赢家 | Medium | 无评分 · 十四、博弈 DP |
| `out-of-boundary-paths` | #576 | 出界的路径数 | Medium | 无评分 · §7.6 多维 DP |
| `shopping-offers` | #638 | 大礼包 | Medium | 无评分 · §7.6 多维 DP |
| `number-of-longest-increasing-subsequence` | #673 | 最长递增子序列的个数 | Medium | 无评分 · §4.2 最长递增子序列（LIS） |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `knight-probability-in-chessboard` | #688 | 骑士在棋盘上的概率 | Medium | 无评分 · 十五、概率 DP、期望 DP |
| `partition-to-k-equal-sum-subsets` | #698 | 划分为k个相等的子集 | Medium | 无评分 · §9.7 其他状压 DP |
| `minimum-ascii-delete-sum-for-two-strings` | #712 | 两个字符串的最小 ASCII 删除和 | Medium | 无评分 · §4.1 最长公共子序列（LCS） |
| `delete-and-earn` | #740 | 删除并获得点数 | Medium | 无评分 · §1.2 打家劫舍 |
| `rotated-digits` | #788 | 旋转数字 | Medium | 无评分 · §10.1 统计合法元素的数目 |

### 批 15 · DP③：背包 / 状压 / 优化 DP / Hard 收尾

- 分类：动态规划
- 演示要点：状压枚举子集；Hard 写透；#3218/#3334/#3376/#3250 预查
- 启动前预查：#3218 `minimum-cost-for-cutting-cake-i` 切蛋糕的最小总开销 I; #3334 `find-the-maximum-factor-score-of-array` 数组的最大因子得分; #3376 `minimum-time-to-break-locks-i` 破解锁的最少时间 I; #3250 `find-the-count-of-monotonic-pairs-i` 单调数组对的数目 I

**Lane A**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `domino-and-tromino-tiling` | #790 | 多米诺和托米诺平铺 | Medium | 无评分 · §11.6 矩阵快速幂优化 DP |
| `flip-string-to-monotone-increasing` | #926 | 将字符串翻转到单调递增 | Medium | 无评分 · 专题：前后缀分解 |
| `closest-dessert-cost` | #1774 | 最接近目标价格的甜点成本 | Medium | 无评分 · §3.1 0-1 背包 |
| `egg-drop-with-2-eggs-and-n-floors` | #1884 | 鸡蛋掉落-两枚鸡蛋 | Medium | 无评分 · §7.6 多维 DP |
| `maximum-compatibility-score-sum` | #1947 | 最大兼容性评分和 | Medium | 无评分 · §9.1 排列型状压 DP ① 相邻无关 |

**Lane B**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `number-of-people-aware-of-a-secret` | #2327 | 知道秘密的人数 | Medium | 无评分 · §11.1 前缀和优化 DP |
| `the-number-of-beautiful-subsets` | #2597 | 美丽子集的数目 | Medium | 无评分 · §7.1 一维 DP |
| `maximum-number-of-jumps-to-reach-the-last-index` | #2770 | 达到末尾下标所需的最大跳跃次数 | Medium | 无评分 · §11.4 树状数组/线段树优化 DP |
| `minimum-moves-to-spread-stones-over-grid` | #2850 | 将石头分散到网格图的最少移动次数 | Medium | 无评分 · §9.1 排列型状压 DP ① 相邻无关 |
| `apply-operations-to-make-two-strings-equal` | #2896 | 执行操作使两个字符串相等 | Medium | 无评分 · §7.1 一维 DP |

**Lane C**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `minimum-cost-for-cutting-cake-i` | #3218 | 切蛋糕的最小总开销 I ⚠️新题 | Medium | 无评分 · §7.6 多维 DP |
| `find-the-maximum-factor-score-of-array` | #3334 | 数组的最大因子得分 ⚠️新题 | Medium | 无评分 · 专题：前后缀分解 |
| `minimum-time-to-break-locks-i` | #3376 | 破解锁的最少时间 I ⚠️新题 | Medium | 无评分 · §9.1 排列型状压 DP ① 相邻无关 |
| `count-number-of-ways-to-place-houses` | #2320 | 统计放置房子的方式数 | Medium | 1608分 · §1.2 打家劫舍 |
| `number-of-paths-with-max-score` | #1301 | 最大得分的路径数目 | Hard | 1853分 · §2.2 进阶 |

**Lane D**

| slug | 题号 | 题名 | 难度 | 灵神小节 |
|------|------|------|------|----------|
| `number-of-ways-to-stay-in-the-same-place-after-some-steps` | #1269 | 停在原地的方案数 | Hard | 1854分 · §7.6 多维 DP |
| `find-the-count-of-monotonic-pairs-i` | #3250 | 单调数组对的数目 I ⚠️新题 | Hard | 1898分 · §7.6 多维 DP |
| `regular-expression-matching` | #10 | 正则表达式匹配 | Hard | 无评分 · §4.1 最长公共子序列（LCS） |
| `wildcard-matching` | #44 | 通配符匹配 | Hard | 无评分 · §4.1 最长公共子序列（LCS） |
| `palindrome-partitioning-ii` | #132 | 分割回文串 II | Hard | 无评分 · §5.2 最优划分 |


## 七、经验教训（执行后追加）

- 继承一期：slug 必须从 json 现查；新题必须预查题面；失败 lane 单独重跑；白天执行。
- 批 8 额外：#2998 虽 < 3000，竞赛味较浓，建议一并预查题面。
- 批 1 经验：4 lane 均成功（约 12 分钟）；验收 20/20 通过。Lane B 初稿曾写出禁写的 `Θ`，自查时已改成 `O(n)`——任务书里把「禁 `\Theta`」写进交付自查仍然必要。`#3011` 预置推导（按 popcount 连续段分组，非全局分桶）worker 对拍无误。
- 批 2 经验：4 lane 均成功；验收 20/20 通过。Lane D 初稿又写出 `Θ`，自查已改——继续把禁写写进任务书。二分区间各 lane 自选（左闭右开 vs 开区间 `left+1<right`）均可，只要单篇坚持一套。Hard #41/#68 分别 379/428 行写透。本批无 ≥3000 新题，经典题 worker 可凭题面提示对拍，不必预查。
- 批 3 经验：4 lane 均成功；验收 20/20 通过。`#3185` 预置推导（枚举右 + `cnt[24]`，先查后加；0 配 0、12 配 12）对拍无误。Hard #154 注意：含重复的旋转最小值只能丢右端，不能像 #81 那样两端都缩（`[0,1,1,1]` 盲丢左端会错）——worker 对拍发现后已写入正文。Easy 四篇 ~223–246 行符合精简档。
- 批 4 经验：4 lane 均成功；验收 20/20 通过。`#3066` 小根堆弹两最小推 `2x+y`（Java 必须 `long`）、`#3275` 容量 k 的大根堆（堆顶=第 k 近）预置推导对拍无误。#1094 拼车是半开 `[from,to)`，差分写 `d[to]-=num` 不要 `to+1`。设计题三篇（#2336/#1845/#1472）把 API 不变量写进正文效果好。Medium 篇幅 242–354 行。本批无 Θ 回潮。
- 批 5 经验：4 lane 均成功；验收 20/20 通过。Lane A 四道 Hard 写透（#32/#140/#212/#224 约 387–441 行）。`#3211` 回溯（末尾 0 只能拼 1）对拍无误，`a(18)=6765`（worker 自查纠正了斐波那契条数）。#111 强调单支树空边不能当 0。Easy 四篇 221–241 行符合精简档。树题从此可用本目录 `binary-tree-pruning.md` 等作样例，不必再指一期。
- 批 6 经验：4 lane 均成功；验收 20/20 通过。Lane C 三道 Hard 写透（#301/#460/#1255 约 433–456 行）。#998 沿最右路径插入、#1104 之字层 `mirror` 再 `//2` 均对拍无误。Lane D `#695` 中文站例 1 第 5 行 `(4,9)=1`，转载常漏写成面积 5——worker 已按官方写 6。Easy `flood-fill` 249 行。网格题从此可用本目录 `01-matrix.md` / `pacific-atlantic-water-flow.md` 作样例。本批无 Θ 回潮。
- 批 7 经验：4 lane 均成功；验收 20/20 通过。三道新题预置推导均对拍无误：`#3286` 0-1 BFS 用 `dist` 松弛不要布尔 visited；`#3552` 同字母第一次到达灌队首后清空列表（mn=1e6 禁止平方枚举）；`#3243` 每次加边后 BFS，`O(q(n+q))` 可过。额外坑：`#1824` 入队即标记会把例 3 算成 3（应为 2），应弹出才标记；`#787` Bellman-Ford 必须拷贝上一轮 `dist`，否则官方例 1 错成 400（应为 700）。Hard #329 记忆化 DFS 382 行。Easy #1971 233 行。图论题从此可用 `open-the-lock.md` / `network-delay-time.md` 作样例。本批无 Θ 回潮。
- 批 8 经验：4 lane 均成功；验收 20/20 通过。新题 `#3015`（每点 BFS / `O(n²)` 公式）、`#3310`（从 k 标记可疑，存在非可疑→可疑边则全不删）、`#3341`（`max(d, moveTime)+1` Dijkstra）、`#3112`（到达须严格 `< disappear`）、`#3387`（`max(d1[c]/d2[c])`）、`#2998`（数字 BFS，上界 `max(x,y)+11`）均对拍无误。**任务书两处写反，worker 以官方为准**：`#2492` 求路径分数的最小值（分量内最细边）不是最大值；`#1462` 官方 `[ai,bi]` 是先 ai 后 bi，建边 `ai→bi`。Lane A 初稿曾写出 `\Theta`，自查已改。Medium 267–323 行。本批无 Θ 残留。
- 批 9 经验：4 lane 均成功；验收 20/20 通过。Lane A 四道 Hard 写透（#127/#815/#1345/#1284 约 389–445 行）：#815 BFS 节点是线路不是站；#1345 同值列表入队后立刻清空。`#3216` 贪心「第一对同奇偶且左>右」对拍无误。**任务书两处被纠正**：`#1130` 递减栈是遇更大（含相等）才弹，不是遇更小；`#1124` 官方 `[9,9,6,0,6,6,9]→3` 不是 7（整段前缀和为负）。Hard #321 拼接最大数 450 行。Easy 五篇 209–244 行。贪心题从此可用 `split-a-string-in-balanced-strings.md` 作样例。本批无 Θ 残留。
- 批 10 经验：4 lane 均成功；验收 20/20 通过。新题 `#3191`（从左遇 0 翻 `[i,i+2]`，尾巴非 1 则 -1）、`#3075`（降序选 k 个，第 i 个贡献 `max(h-i,0)`，官方 `[1,2,3],k=2→4` 不是 5）对拍无误。**任务书细节被纠正**：`#1338` 删光 3 和 5 后剩 3 个不是 4 个；`#2126` 官方摧毁顺序含质量 9，任务书链 `10→13→18→37→58` 漏了 9；`#1689` 官方例 3 是 `"27346209830709182346"` 不是任务书的短串。`#2396` 恒 `false`（`n-2` 进制写成 `"12"`）。Medium 273–294 行。本批无 Θ 残留。
- 批 11 经验：4 lane 均成功；验收 20/20 通过。新题 `#3226`（`n & k == k` 再 popcount(n^k)）、Hard `#3171` LogTrick 原地 OR（`nums[j]|x==nums[j]` 则 break，418 行）对拍无误。Lane A 两道 Hard 写透：`#1326` 转 `right_most` 再跳跃 II（382 行）；`#780` 逆向取模 + 收尾整除（381 行），`(1,1,1,1e9)` 不能只判相等。`#1881` 官方参数名是 `n`、各位 `[1,9]` 不是任务书的 `num`/含 0。`#1829` 返回的是 k 不是最大 XOR 值。`#2419` 答案是最大值的最长连续段。Easy 七篇 222–243 行。位运算从此可用 `single-number.md` / `find-subarray-with-bitwise-or-closest-to-k.md` 作样例。本批无 Θ 残留。
- 批 12 经验：4 lane 均成功；验收 20/20 通过。新题 `#3115`（最左/最右质数下标差，`nums[i]≤100`）、`#3076`（n≤100、m≤20 枚举子串，只查其他串）对拍无误。Hard `#829` 写透（386 行）：`k|2n` 且 `(2n/k-k+1)` 为偶数保证 a 是整数，`a≥1` 由 `k(k+1)≤2n` 保证。KMP 模板 `#28` 317 行。`#2834` 与 `#2829` 同贪心但 n/target 到 1e9 必须 O(1)+mod。**任务书两处被纠正**：`#2904` 官方 `s.length≤100` 不是 1e5；`#2800` 的 merge 要双向判包含（x⊂y 与 y⊂x）。KMP/哈希从此可用 `find-the-index-of-the-first-occurrence-in-a-string.md` / `maximum-length-of-repeated-subarray.md` 作样例。本批无 Θ 残留。
- 批 13 经验：Lane A 先完成，B/C/D 首轮未拉起（旧 transcript 干扰），单独重跑后 4 lane 均成功；验收 20/20 通过。新题 `#3388`（LCP 表 `O(n²)`，两条件 OR 只计 1）、`#3403`（`numFriends==1` 返回整串，否则枚举左端长 `n-k+1`）、`#3722`（n≤1000 枚举反转前后缀）、`#3147`（倒序 `dp[i]=energy[i]+dp[i+k]`，全负取最大不是 0）、`#3259`（切饮料当小时清洗不加能量）对拍无误。Hard `#1163` 双指针最大后缀 383 行、`#1392` KMP `next[n-1]` 374 行写透。**任务书两处被纠正**：`#2606` 官方 `chars` 是字符串不是列表；`#2501` 官方未保证元素互不相同（用 set 即可）。前后缀从此可用 `product-of-array-except-self.md` / `find-pivot-index.md`，一维 DP 可用 `taking-maximum-energy-from-the-mystic-dungeon.md`。本批无 Θ 残留。
- 批 14 经验：4 lane 均一次成功；验收 20/20 通过。新题 `#3393`（`dp[i][j][x]`，值域 <16，`O(mn×16)`，模 `1e9+7`）对拍无误。`#877` 区间 DP 写透并点出偶数堆 Alice 恒胜；`#486` 强调 n 可奇数、不是恒胜。`#698` 状压/回溯剪枝 396 行。**任务书一处口述不准**：`#877` 例 `[5,3,4,5]` 总和 17，最优是 9 vs 8 不是 10 vs 8（拿两个 5 是 Bob 不优时的线）。LCS/LIS/状压/博弈从此可用 `interleaving-string.md` / `number-of-longest-increasing-subsequence.md` / `can-i-win.md` / `predict-the-winner.md`，打家劫舍可用 `delete-and-earn.md`。本批无 Θ 残留。
