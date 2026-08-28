# 灵茶一期题解工程 · 批次规划与执行手册

> 本文件是主会话的持久化上下文。清理会话后读此文件即可继续执行。
> 最后更新：批 5 完成后（hasSolution 75/300）

## 一、工程总览

- 目标：为 `src/data/banks/lingcha-1.json`（灵茶题单一期 300 题）补齐全部题解
- 落盘位置：`solutions/lingcha-1/<slug>.md`（UTF-8 中文）
- 完成后运行 `npm run data` 点亮 hasSolution，验收后 git commit + push
- base 题库 200 篇已全部完成（另一工程，勿动）

## 二、语言与规范（与 base 工程不同！）

1. **Python 主解**（暴力/优化/主代码全 Python）；Java 只在「最优解/进阶」环节可选补写，Easy 可省
2. 出处标注**灵神题单小节**（hint 里的 §x.x / 章节），讲法对齐灵神模板（分组循环、红蓝染色二分、枚举右维护左等）；不查左程云课源码
3. 八章结构：一、问题描述 / 二、暴力解法 / 三、优化探索 / 四、代码实现 / 五、例子演示 / 六、复杂度 / 七、对比总结 / 八、举一反三（缺内容留标题占位）
4. Mermaid 深色规范：节点 `fill:#2b2d3a` + 描边（#f1fa8c/#8be9fd/#50fa7b/#ff5555/#ff79c6）+ `color:#f8f8f2`；subgraph `fill:#1e1f29`；禁浅色实心块；每篇 ≥1 张
5. 无 KaTeX：禁 `$$`、`\(`、`\Theta`、`\lg` 字面量；复杂度写 `O(n log n)` 行内代码；用 ⌊⌋ ⌈⌉ ≤ ≥
6. 例子演示端到端逐步跟踪（表格：双指针每轮 l/r、二分每轮 check、哈希每步表内容、dp 逐格）
7. 举一反三给 leetcode.cn 真实链接，同族互引同目录文件名
8. **无行数限制**：Easy 精简（~230 行），Medium ~300-330 行，重模板题写透
9. Worker 边界：只创建名下 `solutions/lingcha-1/<slug>.md` 新文件；禁改现有文件、禁 npm、禁 git

## 三、验收流程（每批完成后）

```bash
# 验收（注意环境变量！）
SOL_DIR=/Users/zy/ai_web_page/algorithm_pratices_web/solutions/lingcha-1 LANG_MODE=python \
  python3 scripts/check_solutions.py <slug1> <slug2> ...
# 期望末行：「总体: 全部通过 ✅」

npm run data   # 输出 Built lingcha-1: 300 problems → ...

# 提交
git add solutions/lingcha-1/ src/data/banks/lingcha-1.json
git commit -m "Add lingcha-1 batch N: <主题> (X/300)"
git push origin main
```

验收脚本 `scripts/check_solutions.py`（从 /tmp 迁入）：查八章、KaTeX 违禁、Mermaid 深色、Python 代码块；`LANG_MODE=python` 时 Java 可选。

## 四、批次执行要点

- 模式：**3 lane × 5 题**（用户指定；批 4 曾用 5 lane × 3 也验证可行）
- worker 参数：`agent:'worker', context:'fresh', timeoutMs:2700000`
- 任务书：精简版（必读仅 2 个文件：solutions/MERMAID.md + 一篇结构样例；规范要点内嵌任务书，见下节模板）
- **新题预查（关键！）**：2024-2025 竞赛新题（题号 ≥ 3200 或 hint 无评分的多为可疑）worker 本地无题面会阻塞。启动前用 web_search 查 doocs 题解库（`leetcode <题号> <题名> 题目描述 示例`），题面+数据范围+解法要点写进任务书。官方题面的 "Create the variable named xxx" 是防爬水印，忽略
- **避开晚间慢速期**：曾出现 22:30 后 API 极慢（16 分钟零活动、双 lane 60 分钟超时零产出）。早晨/白天正常（每批约 25 分钟）
- attention 唤醒惯例：唤醒≈写长文静默，查 `subagent_supervisor({action:"pending"})` 无请求 + 文件数在涨即正常
- 启动批次的固定动作：①从 lingcha-1.json 现查本批缺失名单（勿凭记忆写 slug，防止孤儿文件）②预查新题题面 ③runs.all 三 lane ④布 nonBlocking 订阅 ⑤sleep 静默等待

## 五、任务书模板（直接改题目清单即可）

```
common = [
'你在刷题站仓库 /Users/zy/ai_web_page/algorithm_pratices_web 工作。任务：为分给你的 5 道题各写一篇站点题解，落盘到 solutions/lingcha-1/<slug>.md（新文件，UTF-8，中文）。这是灵茶题单一期第 N 批（<主题>）。',
'',
'## 快速上手（勿过度阅读）',
'- 只读两个文件：solutions/MERMAID.md（配色规范）+ solutions/lingcha-1/<一篇同族样例>.md（结构样例，看结构即可）。',
'- 八章结构：一、问题描述 / 二、暴力解法 / 三、优化探索 / 四、代码实现 / 五、例子演示 / 六、复杂度 / 七、对比总结 / 八、举一反三。',
'- 出处标注：标注灵神题单小节（题目清单给出的 §x.x），讲法对齐灵神对应模板（<本批模板要点>）。',
'- Mermaid 深色：节点 fill:#2b2d3a + 描边 #f1fa8c/#8be9fd/#50fa7b/#ff5555/#ff79c6 + color:#f8f8f2；subgraph fill:#1e1f29；禁浅色实心块。每篇 ≥1 张。',
'- 无 KaTeX：禁 $$、\\( 、\\Theta、\\lg；复杂度写 `O(n)`；用 ⌊⌋ ⌈⌉ ≤ ≥。',
'- 例子演示逐步跟踪：<本批演示要求>。',
'- 举一反三给 leetcode.cn 真实链接，同族互引（可引用同目录已写文件名）。',
'',
'## 语言与篇幅',
'- Python 主解（全文），Java 只在最优解环节可选补写，Easy 可省。Medium 300 行左右。',
'',
'## 边界',
'- 只创建你名下 5 个 solutions/lingcha-1/<slug>.md 新文件；禁改现有文件、禁 npm、禁 git。',
'',
'## 交付：逐题报告文件路径、八章齐全、灵神小节、Mermaid 自查、复杂度时间+空间。'
].join('\n');
// + lanes.{a,b,c} 题目清单（slug | #题号 题名 | 难度 | 小节 | URL |【题面/解法提示，新题必带】）
// runs.all: 3 × {agent:'worker', context:'fresh', timeoutMs:2700000, task: common + 清单}
```

## 六、批次进度（22 批规划）

| 批 | 主题 | 状态 |
|----|------|------|
| 1 | 滑窗①分组循环+基础 | ✅ 15 |
| 2 | 滑窗②双指针/相向+补写 | ✅ 15（累计 30）|
| 3 | 滑窗③收尾+二分①求最小 | ✅ 15（累计 45；滑窗 35/35 全亮）|
| 4 | 二分②收尾（5 lane × 3）| ✅ 15（累计 60；二分 25/25 全亮）|
| 5 | 数据结构①枚举右+前缀和 | ✅ 15（累计 75）|
| **6** | **数据结构②A2：差分 5 + 括号 RBS/表达式/邻项消除/对顶栈 8 + §1.5/#3412 + Part A 罗马数字（约 16-17 题，3 lane）** | ⬜ 下一批 |
| 7 | 数据结构③B：堆/对顶堆/懒删除/反悔堆 + 单调队列（§4.x/§5.x 约 14）| ⬜ |
| 8 | 数据结构④B：Trie + 并查集 7 + 离线（§6.x/§7.x 约 11）| ⬜ |
| 9 | 数据结构⑤B：BIT/线段树/Lazy/ST 表/逆序对 + 收尾（§8.x 约 8）| ⬜ |
| 10-12 | 链表 12 + 二叉树 25 + 回溯 3（每批约 13-14）| ⬜ |
| 13-14 | 网格图 20 + 单调栈 8 | ⬜ |
| 15-17 | 贪心 30 + 位运算 7 + 数学 10 | ⬜ |
| 18 | 字符串 5（KMP/Manacher/后缀数组/哈希/子序列自动机，重模板写透）| ⬜ |
| 19-22 | DP 55（入门背包 / 子序列区间 / 状压 / 优化 DP，每批 13-15）| ⬜ |

批次 6 待办细节：新题预查 #3709（design-exam-scores-tracker）、#3170（删除星号字典序）、#3412（镜像分数）、#3914（非递减累计值）、#995H/#1526H/#1106H/#2296H 为老 Hard 无需查。

## 七、经验教训存档

1. 批 2 曾因 worker 缺新题题面阻塞 + 晚间 API 慢全超时 → 启动前预查题面、白天执行
2. 批 3 worker 曾用随机对拍发现任务书预置推导错误（#3649 正确判据是绝对值比例 ≤ 2 与符号无关）——鼓励 worker 对拍，预置推导仅供参考要标注
3. 孤儿文件教训：任务书 slug 必须从 lingcha-1.json 现查，不得凭印象（base 工程批 8 曾产生 15 个孤儿后删除）
4. #452 minimum-number-of-arrows-to-burst-balloons 与 base 重叠：lingcha-1 需要 solutions/lingcha-1/ 下同名文件才点亮 hasSolution，可 cp base 版（尚未做，放入收尾批处理）
