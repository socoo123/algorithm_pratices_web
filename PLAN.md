# 算法刷题进行时 · 实现规划

> 一个 React 静态刷题网站。网站名为 **「算法刷题进行时」**，按「题库」组织内容，
> 第一个题库是 **Coupang 题库**（来自 `algorithm-journey/coupang_interview`，200 题），
> 架构上支持以后追加新题库（如灵茶 300 题）。
> 核心能力：正常的表格排版记录每题状态、进度持久化到仓库内 JSON（换机 clone 可恢复）、
> 每题可关联 AI 生成的题解、界面超级漂亮。

---

## 1. 需求确认（来自数据源的实际勘察）

数据源 `/Users/zy/ai_learn/algorithm-journey/coupang_interview/`：

| 文件 | 题数 | 分类 id（约定） |
|------|------|----------------|
| 链表.md | 20 | `linked-list` |
| 滑动窗口与双指针.md | 30 | `sliding-window` |
| 二叉树与递归.md | 30 | `binary-tree` |
| 栈与队列.md | 20 | `stack-queue` |
| 回溯.md | 15 | `backtracking` |
| 排序.md | 15 | `sorting` |
| 动态规划.md | 50 | `dp` |
| 其他.md | 20 | `misc` |
| README.md | — | 含 Day 1-14 计划表、评分体系说明 |

**题目行格式**（解析目标）：

```
- [ ] **[#78 子集](https://leetcode.cn/problems/subsets/)** · Medium · ★★★★★ · 🔥🔥🔥🔥🔥 · 每元素要/不要
    - [ ] 第 1 遍
    - [ ] 第 2 遍
    - [ ] 第 3 遍
```

### 1.1 题目替换（同步内容时执行，已确认无重复）

源题单含 4 道会员题 + 1 道非标准题号题，**全部移除并等量替换**（保持总数 200、分类与难度分布不变）：

| 移除 | 原因 | 替换为 | 说明 |
|------|------|--------|------|
| #340 至多 K 个不同字符的最长子串 `[会员]` | 会员题 | **#904 水果成篮** (Medium) | 同模板变长窗口（至多 2 种水果） |
| #159 至多两个不同字符的最长子串 `[会员]` | 会员题 | **#1493 删掉一个元素以后全为 1 的最长子数组** (Medium) | 变长窗口经典 |
| #252 会议室 `[会员]` | 会员题 | **#88 合并两个有序数组** (Easy) | 排序/双指针超高频 |
| #253 会议室 II `[会员]` | 会员题 | **#452 用最少数量的箭引爆气球** (Medium) | 区间排序经典（会议室姊妹题） |
| 剑指 Offer 51 数组中的逆序对 | 非标准题号 | **#493 翻转对** (Hard) | 归并求逆序对的 LC 标准题（与已有 #315 互补） |

替换后成品题单：**200 题，零会员题，全部为标准 leetcode.cn 题号**。
已验证 5 道替换题均不在现有题单中（#1004/#2024/#424/#435 等候选因已在题单被排除）。

### 1.2 解析边界情况（已实测存在）

1. ★ / 🔥 按字符个数计数（1-5）。
2. `链表.md` 已有若干 `- [x] 第 1 遍` 打卡记录 —— 首次构建必须导入为初始进度，不能丢。
3. 每个文件头部的「刷题建议」和结尾的「Coupang 高频提示」保留，展示在分类页。
4. README 的 Day 1-14 计划表解析为结构化数据，展示在题库页（次要位置，见 §6）。
5. 同步后断言：内容中不再出现 `[会员]`、每题都有 `leetcode.cn/problems/<slug>/` 链接。

排序规则：**严格保持 markdown 原有顺序**（分类按 README 表格顺序，题目按文件内出现顺序，即 Easy→Medium→Hard、同难度热度高在前），替换题插入到被替换题的原位置。

---

## 2. 技术选型

| 层 | 选择 | 理由 |
|----|------|------|
| 构建 | **Vite + React 18 + TypeScript** | 静态站点标配 |
| 样式 | **Tailwind CSS v4**（`@tailwindcss/vite` 插件） | 快速做出精致 UI |
| 路由 | `react-router` v7 | 页面少，轻量 |
| 题解渲染 | `react-markdown` + `remark-gfm` + **`rehype-pretty-code`（Shiki 内核）** | 代码高亮颜值最高：主题 `github-dark-default`、行号、高亮行 |
| 图标 | `lucide-react` | |
| 数据管线 | `tsx` 运行 Node 脚本，预生成 JSON | 构建期解析 markdown，运行时零解析成本 |
| 部署 | 静态产物（GitHub Pages / Vercel / 纯本地均可） | `vite build` 即得 |

**不引入后端、不引入数据库**。进度写文件通过 Vite dev server 中间件实现（见 §5）。

---

## 3. 项目结构

```
algorithm_pratices_web/
├── content/
│   └── banks/
│       └── coupang/              # 从 algorithm-journey 同步来的 9 个 md（已应用替换，纳入 git）
├── solutions/
│   └── coupang/                  # AI 生成的题解，<slug>.md 命名约定（纳入 git）
│       └── subsets.md            # 例：对应 #78 子集
├── scripts/
│   ├── sync-content.ts           # 从源仓库拷贝 md + 应用 §1.1 替换表
│   └── build-data.ts             # 解析 md → src/data/banks/coupang.json + 播种 progress.json
├── src/
│   ├── data/
│   │   ├── banks/
│   │   │   └── coupang.json      # 题库数据（构建产物，纳入 git）
│   │   ├── banks-index.json      # 题库注册表（首页「题库列表」数据源）
│   │   └── progress.json         # ★ 进度文件（纳入 git，核心资产）
│   ├── types.ts                  # Bank / Category / Problem / ProgressFile 等
│   ├── lib/
│   │   ├── progress-store.ts     # 进度读写、localStorage 合并、导入导出
│   │   └── format.ts
│   ├── hooks/
│   │   └── useProgress.ts        # 进度 Context
│   ├── components/
│   │   ├── AuroraBackground.tsx  # 全局背景
│   │   ├── SiteHeader.tsx        # 顶部标题栏：算法刷题进行时
│   │   ├── ProblemTable.tsx      # 题目表格（核心组件）
│   │   ├── RoundCheckboxes.tsx   # 第 1/2/3 遍勾选
│   │   ├── RatingDots.tsx        # ★/🔥 点阵仪表
│   │   ├── CategorySidebar.tsx   # 分类导航 + 各类进度
│   │   └── ProgressBar.tsx / ProgressRing.tsx
│   ├── pages/
│   │   ├── HomePage.tsx          # /                 题库列表（第一块：Coupang 题库）
│   │   ├── BankPage.tsx          # /bank/:bankId     分类侧栏 + 题目表格（主页面）
│   │   ├── SolutionPage.tsx      # /bank/:bankId/solution/:slug
│   │   └── NotFoundPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                 # Tailwind + 背景动画 keyframes + 表格细节样式
├── vite.config.ts                # 含 progress-saver 中间件插件
├── README.md                     # 使用教程（已随本规划写好，实现须与其保持一致）
└── PLAN.md（本文件）
```

---

## 4. 数据模型与构建管线

### 4.1 两个脚本

**`scripts/sync-content.ts`**（手动跑）：从 `algorithm-journey/coupang_interview` 拷贝 9 个 md 到 `content/banks/coupang/`，并按 §1.1 的替换表逐行替换 5 道题（替换题继承原题的位置、难度档位，★/🔥/考点按下表现成值写入）：

| 替换题 | 难度 | ★ | 🔥 | 核心考点 |
|--------|------|---|----|----------|
| #904 水果成篮 | Medium | ★★★ | 🔥🔥🔥 | 变长窗口（至多 2 种，同 340 模板） |
| #1493 删掉一个元素以后全为 1 的最长子数组 | Medium | ★★★ | 🔥🔥🔥 | 变长窗口（含一个 0 的窗口） |
| #88 合并两个有序数组 | Easy | ★★★★ | 🔥🔥🔥🔥🔥 | 逆向双指针，从尾部填充 |
| #452 用最少数量的箭引爆气球 | Medium | ★★★★ | 🔥🔥🔥🔥 | 区间按右端点排序 + 贪心 |
| #493 翻转对 | Hard | ★★★★ | 🔥🔥🔥 | 归并求逆序对扩展（2x 判定） |

**`scripts/build-data.ts`**（`prebuild`/`predev` 自动跑）：解析 `content/banks/coupang/*.md` → `src/data/banks/coupang.json`；扫描 `solutions/coupang/` 标记 `hasSolution`；**仅当 `progress.json` 不存在时**用 md 中已有 `[x]` 播种初始进度。

题目行正则（同步后已无会员题，格式统一）：

```ts
const PROBLEM_RE =
  /^- \[( |x)\] \*\*\[#(\d+)\s+([^\]]+?)\]\((https:\/\/leetcode\.cn\/problems\/([^/]+)\/)\)\*\* · (Easy|Medium|Hard) · (★+) · (🔥+) · (.+)$/;
const ROUND_RE = /^\s+- \[( |x)\] 第 (\d) 遍$/;
```

### 4.2 类型定义（`src/types.ts`）

```ts
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Bank {              // 题库（首页的「块」）
  id: string;                        // 'coupang'
  name: string;                      // 'Coupang 题库'
  description: string;               // '面向 Coupang 及一线大厂的高频 200 题'
  totalCount: number;                // 200
}

export interface Problem {
  bankId: string;                    // 'coupang'
  slug: string;                      // LC url slug，题库内唯一主键，如 "subsets"
  number: string;                    // "78"
  title: string;                     // "子集"
  url: string;                       // leetcode.cn 链接
  difficulty: Difficulty;
  stars: number;                     // 1-5 经典度
  heat: number;                      // 1-5 常考热度
  hint: string;                      // 核心考点
  categoryId: string;
  order: number;                     // 分类内顺序（md 出现顺序，从 1 开始）
  hasSolution: boolean;
}

export interface Category {
  id: string;                        // 'linked-list' 等（脚本内写死 中文名→id 映射）
  bankId: string;
  name: string;                      // "链表"
  order: number;                     // README 表格顺序 1-8
  intro: string;                     // 「刷题建议」区块（markdown 片段）
  coupangTips: string[];             // 「Coupang 高频提示」 bullets
}

export interface DayPlan { day: number; task: string; count: string }

export interface BankFile {          // src/data/banks/coupang.json
  bank: Bank;
  categories: Category[];
  problems: Problem[];               // 全局顺序 = 分类顺序 × 分类内顺序
  dayPlan: DayPlan[];
  generatedAt: string;
}
```

### 4.3 进度文件 `src/data/progress.json`（**纳入 git，随仓库走**）

```ts
export interface ProgressFile {
  version: 1;
  updatedAt: string;
  problems: Record<string, ProblemProgress>; // key = `${bankId}/${slug}`，只记录有进度的题
}

export interface ProblemProgress {
  rounds: [boolean, boolean, boolean];       // 第 1/2/3 遍
  note?: string;                             // 备注（易错点/思路备忘），已确认要此字段
  updatedAt: string;                         // 勾选或备注任一变更为即更新；合并时新者胜
}
```

以 `bankId/slug` 为主键：题号可能偏移，slug 稳定；加 bankId 前缀为未来多题库留路。

**校验规则**（build-data 末尾断言，失败即退出）：
- 每题库题数 = 200；各分类题数与 README 声称一致（链表 20 / 滑窗 30 / 二叉树 30 / 栈队列 20 / 回溯 15 / 排序 15 / DP 50 / 其他 20）。
- 全文无 `[会员]`；每题 url 均匹配 `leetcode.cn/problems/<slug>/`；slug 全局唯一。

---

## 5. 进度持久化方案（核心需求）

目标：**勾选状态写入仓库内的文件，任何机器 clone 后都能恢复**。

### 5.1 运行时数据流

```
启动加载：
  bundled progress.json（import 进 bundle）──┐
                                            ├─► 逐 key 合并（比 updatedAt，新者胜）─► 内存 store
  localStorage['sft-progress'] ──────────────┘

每次勾选：
  1. 更新内存 store → UI 即时响应
  2. 写 localStorage（即时、兜底）
  3. fetch('POST /api/progress', 全量 progress) —— 仅 dev 模式存在该端点
```

### 5.2 dev 模式：自动写文件（主要使用场景）

`vite.config.ts` 内写一个约 30 行的插件：

```ts
// 伪代码
function progressSaver(): Plugin {
  return {
    name: 'progress-saver',
    configureServer(server) {
      server.middlewares.use('/api/progress', (req, res) => {
        if (req.method !== 'POST') return res.end('only POST');
        // 读 body → JSON.parse → 校验 version 字段
        // → 写 src/data/progress.json（JSON.stringify(data, null, 2)）
        // → res.end('ok')
      });
    },
  };
}
```

平时 `npm run dev` 使用（已确认：**本地 dev 是唯一主要使用场景**），每次勾选或编辑备注即时落盘到 `src/data/progress.json`，`git commit` 即带走进度。

### 5.3 兜底：导出 / 导入（一般用不到）

本地 dev 已覆盖主流程，此能力仅作保险（比如网页端口异常、或未来想静态部署）：

- **导出进度**：把当前合并后的进度下载为 `progress.json`，手动替换仓库文件并 commit。
- **导入进度**：文件选择器读入 JSON，校验后并入 store。
- 顶栏显示「有 N 条未导出的改动」提示（对比 localStorage 与 bundled 的差异）。

### 5.4 合并策略

逐 key：两边都有记录时取 `updatedAt` 较新者；只有一边有则取之。简单、无冲突、可重复执行。

---

## 6. 页面与排版设计（已按要求重设计：正常的表格为主）

### 6.1 信息架构

只有 3 类页面，以**表格为绝对主体**，不搞花哨的多视图：

| 路径 | 页面 | 内容 |
|------|------|------|
| `/` | 首页 | 大标题「算法刷题进行时」+ 题库卡片列表。**第一块卡片：Coupang 题库**（200 题、总进度条、进入按钮）。未来新题库直接加卡片。 |
| `/bank/coupang` | 题库页（主战场） | 左侧分类导航 + 右侧一张**正常的大表格**。顶部条显示该题库总进度。 |
| `/bank/coupang/solution/:slug` | 题解页 | 渲染对应 md，代码高亮，顶部「返回题库」「去 LC 做题」。 |

### 6.2 题库页布局（核心页面）

```
┌──────────────────────────────────────────────────────────┐
│ 顶栏：算法刷题进行时  ·  Coupang 题库        [导出/导入进度] │
├──────────────┬───────────────────────────────────────────┤
│ 左侧分类导航  │  分类标题 + 进度 (8/20)                      │
│              │  ┌──────────────────────────────────────┐ │
│ ▸ 链表  8/20 │  │ 一张正常的表格（sticky 表头）           │ │
│ ▸ 滑动窗口    │  │ 状态 | # | 题目 | 难度 | 经典 | 热度   │ │
│ ▸ 二叉树      │  │      |   |      |      |      | 考点  │ │
│ ▸ 栈与队列    │  │      |   |      |      |      | 题解  │ │
│ ▸ 回溯        │  │  ...行...                            │ │
│ ▸ 排序        │  └──────────────────────────────────────┘ │
│ ▸ 动态规划    │  ▾ 刷题建议 / Coupang 高频提示（可折叠）     │
│ ▸ 其他        │  ▾ Day 1-14 计划（可折叠，次要信息）         │
└──────────────┴───────────────────────────────────────────┘
```

- **左侧分类导航**：8 个分类，每项显示名称 + `已完成/总数` 迷你进度条；当前分类高亮；完成度 100% 时名称前出现绿色对勾。
- **表格列定义**（一张干净、正常、信息密度高的表）：

| 列 | 宽度倾向 | 内容 |
|----|---------|------|
| 状态 | 窄 | 3 个 mini checkbox 横排（第 1/2/3 遍），hover 出 tooltip |
| # | 窄 | 题号，等宽字体 |
| 题目 | 中 | 中文标题加粗，点击新窗口打开 leetcode.cn |
| 难度 | 窄 | Easy=绿 / Medium=橙 / Hard=红 彩色 pill |
| 经典度 | 窄 | 5 圆点仪表（靛蓝） |
| 热度 | 窄 | 5 圆点仪表（橙红） |
| 核心考点 | 宽（弹性） | hint 文本 |
| 备注 | 窄 | sticky-note 图标；点击在**行内展开**一个整宽编辑区（textarea，防抖 500ms 自动保存）；有备注时图标琥珀色高亮、hover 预览摘要 |
| 题解 | 窄 | `hasSolution` → 「题解」链接；否则灰色 `—`；末尾一个 clipboard 小图标「复制 AI 提示词」 |

- **表格交互**：
  - 第 1 遍勾上 → 整行进入完成态（标题变暗、行首出现 2px 绿色完成条），后两遍可继续勾。
  - 备注与勾选走同一条持久化管道（localStorage + dev 落盘 + 导出导入），存入 `progress.json` 的 `note` 字段。
  - 行 hover 微高亮；表头 sticky；顶部小筛选条：全部/未完成/已完成 + 难度筛选 + 搜索（标题/题号/考点）。**默认排序永远为 md 原顺序**。
  - 「刷题建议」「Coupang 高频提示」「Day 1-14 计划」做成表格下方的折叠区，默认收起，不抢表格的戏。

### 6.3 视觉设计（超级漂亮的方向）

整体 **深色 Aurora 主题**，精致而不喧闹：

- **背景**：近黑深蓝底 `#070b14`；3-4 个大尺寸径向渐变光斑（indigo / cyan / violet，低透明度 + `blur(80px)`）以 20-30s keyframes 缓慢漂移；叠加 1px/40px 细网格（3% 白）与极淡噪点（SVG feTurbulence，opacity 0.03）；`prefers-reduced-motion` 时关闭动画。
- **容器**：表格卡片与侧栏用玻璃拟态 `bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl`；表格表头 `bg-white/5` 与行分隔线 `border-white/5`，保证深色下可读性。
- **字体**：UI 用系统中文栈；题号/数字/代码用 `JetBrains Mono`（等宽对齐题号列很提气质）。
- **色彩语义**：难度绿/橙/红；完成态 emerald；评级靛蓝（★）与橙红（🔥）；主强调色 indigo→cyan 渐变（用于 Logo 字、总进度条、主要按钮）。
- **微交互**：勾选时 checkbox 缩放弹跳 + 行背景渐变过渡；侧栏 hover 项右移 2px；首页题库卡片 hover 上浮 + 光晕加深；总进度条用渐变 + 微光。
- 首页 Hero：超大字「算法刷题进行时」（渐变文字），副标题一行说明，下方题库卡片网格。

---

## 7. 题解系统

- **约定**：`solutions/<bankId>/<slug>.md`（如 `solutions/coupang/subsets.md`），slug 与 LC url 一致。
- 文件顶部可选 frontmatter（`---\ntitle: 子集\n---`），没有也能渲染。
- 构建脚本扫描对应目录写入 `hasSolution`；题解页通过 `import.meta.glob('/solutions/**/*.md', { as: 'raw', eager: true })` 打进 bundle，按 `bankId/slug` 查找渲染。**新增题解不需要改任何代码**。
- 渲染：`react-markdown` + `remark-gfm` + **`rehype-pretty-code`（Shiki 内核，已确认选用）**：主题 `github-dark-default`，开启行号；自定义 pre 组件加「复制代码」按钮与语言标签。Shiki 按需加载语言（java / python / typescript / cpp / go / rust / bash / json / markdown）。
- 「已经会了就不挂题解」= 不创建文件，表格自动显示 `—`。
- 表格「复制 AI 提示词」按钮：复制
  `请详解 LeetCode #78 子集（https://leetcode.cn/problems/subsets/）：给出思路推导、Java 代码、复杂度分析，输出为 markdown。`，
  生成后存为 `solutions/coupang/subsets.md`，重跑 `build-data`（dev server 监听 solutions 目录自动重生成），表格「题解」列自动点亮。

---

## 8. 实施步骤（给实现模型的任务拆分）

1. **M1 脚手架**：Vite react-ts → 装 Tailwind v4 / react-router / lucide-react / react-markdown 全家。
2. **M2 数据管线**：`sync-content.ts`（拷贝 + §1.1 五处替换）→ `types.ts` + `build-data.ts`（解析、§4 校验断言、`[x]` 播种）→ 生成 `banks/coupang.json` / `banks-index.json` / `progress.json`。
3. **M3 进度系统**：`progress-store.ts`（加载/合并/localStorage/导入导出）+ `useProgress` Context + vite 写文件插件。
4. **M4 UI**：AuroraBackground → SiteHeader → 首页（题库卡片）→ 题库页（侧栏 + ProblemTable + 筛选 + 复制提示词 + 备注行内编辑 + 折叠区）→ 题解页（Shiki 高亮）。
5. **M5 收尾**：`npm run build` 验证；核对根目录 `README.md`（已随规划写好）与实际命令/行为一致，有出入则同步更新 README。

**验收标准**：
- `coupang.json` 恰好 200 题；无 `[会员]`；无剑指题号；8 个分类题数与源 README 一致；链表分类能看到从 md 导入的初始 `[x]` 进度。
- dev 模式勾选/写备注后 `src/data/progress.json` 文件内容更新；清空 localStorage 刷新页面进度与备注仍在（来自文件）。
- 在 `solutions/coupang/` 放一个 md，对应题目「题解」列出现链接且页面 Shiki 高亮（行号 + 主题）正常。
- 首页第一块是「Coupang 题库」卡片；整站深色 Aurora 背景渲染正常。
- `README.md` 中的每条命令可直接执行且行为与描述一致。

---

## 9. 已确认的决策（用户已拍板）

1. **使用场景 = 纯本地**：`npm install && npm run dev` 是唯一主要使用方式，进度经 Vite 中间件自动落盘；导出/导入仅作保险。**README.md 使用教程已随本规划提前写好**（见根目录），实现须与其保持一致。
2. **代码高亮 = Shiki**：经 `rehype-pretty-code` 接入（主题 `github-dark-default`、行号、复制按钮）。
3. **备注字段 = 要**：`progress.json` 的 `ProblemProgress.note`，表格行内展开编辑，随进度一起持久化/导出。
4. **下一个题库 = 灵茶第一期 300 题**（源：`algorithm-journey/灵茶problems/第一期刷题计划-300题.md`），**先刷完 Coupang 再做**。架构已按多题库预留（`content/banks/`、`bankId`、`banks-index.json`）；届时只需：新写该 md 格式的解析规则 → `content/banks/lingcha-300/` → 注册进 banks-index → 首页自动出现第二块卡片。**本期不实现**。

---

## 10. 备选方案记录（已排除）

| 方案 | 排除理由 |
|------|----------|
| 运行时 fetch 原始 md 前台解析 | 慢且脆；表格化需要结构化数据，预生成 JSON 更稳 |
| 进度只存 localStorage | 不满足「换机器 clone 可恢复」的核心需求 |
| 引入 Express 小后端写文件 | 过度设计；Vite 中间件 30 行搞定，静态部署时本来就没后端 |
| 会员题保留并标 VIP 徽标 | 用户明确要求移除会员题，已等量替换 |
| Dashboard 多视图（环形图/日历热力图等） | 用户要求「正常的表格就行」，收敛为首页题库卡片 + 题库表格页 |
