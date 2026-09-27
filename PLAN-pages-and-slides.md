# Pages 部署 + 灵茶题解幻灯片 · 执行手册

> 本文件是这两件事的**唯一进度源**。清空 Cursor 上下文后：读「〇、当前指针」，再读对应计划的启动清单，即可开工。不要凭聊天记录改方案。
> 最后更新：Pages 源已设为 GitHub Actions，待在网站顶栏粘贴 PAT

用户原话要的两件事：

1. 站点做成可部署到 GitHub Pages 的静态站（对齐 `~/ai_web_page` 里已上线的兄弟站），勾选学习进度后由 GitHub 提交，换浏览器 / 清缓存不丢。
2. 幻灯片（对齐 vim_study：播放、暂停、单步、倍速）。播放器只写一次，用在两处：灵茶一期 / 二期题解，以及算法导论已写的 35 章。灵茶里偏难的 Medium 和全部 Hard 再用 **5 个 agent** 分批补步骤稿。算法导论不改正文。

## 〇、当前指针（清空会话后只看这里）

| 项 | 值 |
|----|-----|
| **Pages 计划** | 代码已推送，Pages 源为 GitHub Actions。待在网站顶栏粘贴 PAT |
| **幻灯片播放器** | 未开始。下一步 = 启动清单 B1（主 agent，一次）。接到灵茶题解页和 `/clrs/:slug`，不要并行改稿 |
| **幻灯片步骤稿** | 未开始。0 / 378。播放器完成后再开第 1 批。一次触发只跑一批（5 agent × 5 题） |
| 仓库 | `https://github.com/socoo123/algorithm_pratices_web`（公开，`main`，**无分支保护**，**Pages 尚未开启**） |
| 线上目标 | `https://socoo123.github.io/algorithm_pratices_web/` |
| 进度真相 | `src/data/progress.json`（`version: 1`，键 `bankId/slug`，`rounds` 三维 + 可选 `note`） |
| 禁止 | 不把 PAT 写进仓库、不把站点改写成手写 HTML、不给 Easy / 低星 Medium 写步骤稿、不凭记忆写 slug |

触发词：

- 「执行 Pages 计划」→ 只做计划 A，做完更新本指针
- 「执行幻灯片计划」→ 只做计划 B：播放器没完成就只做播放器；完成了就跑指针里的下一批 25 题。跑完改指针，不要连跑下一批
- 只说「看计划 / 进度」→ 汇报指针，**不要改代码**

做完任一项必须改两处：文首「最后更新」、上表对应行。

---

## 一、已勘察事实（不要重新发明）

### 1.1 本站现在怎么存进度

- 勾选「第 1/2/3 遍」或写备注 → `useProgress.commit` → `localStorage['sft-progress']`，并在 **dev** 里 `POST /api/progress`。
- `/api/progress` 只存在于 `vite.config.ts` 的 dev middleware，把整份 JSON 写到 `src/data/progress.json`。`npm run build` / `vite preview` / 静态托管**写不了文件**。顶栏脏标记已经写明这一点。
- 启动时：打包进 bundle 的 `progress.json` 与 localStorage 按每题 `updatedAt` 取较新者合并（`mergeProgress`）。
- 现状规模很小（约几十条），整文件提交没有体积问题。

### 1.2 为什么不能照抄 vim_study 的「纯静态」

| 站点 | 做法 | 进度 |
|------|------|------|
| `vim_study`、`es_web` | 仓库根目录就是 HTML，Pages「Deploy from a branch / main / root」，零构建 | 只在浏览器 localStorage。清站点数据就没了。**不满足「GitHub 提交」** |
| `person_blog` | `.github/workflows/deploy.yml`：push main → build → `actions/deploy-pages`，`base=/person_blog` | 无打卡 |

本站是 Vite + React，800 篇题解、Mermaid、Shiki、客户端路由。**保持现有应用，用 person_blog 的 Actions 部署**；播放器交互学 vim_study，不把工程改成手写 HTML。

### 1.3 GitHub Pages 不能自己 commit

静态页面没有服务器。勾选后「GitHub 给我提交」的唯一做法：浏览器拿用户自己的令牌，调用 GitHub Contents API，更新 `main` 上的 `src/data/progress.json`。`main` 无分支保护，这个 PUT 能直接成功。

进度提交**不要**触发整站重建（800 篇题解构建很重）。站点运行时去拉 raw 文件，所以勾选后其它设备刷新就能看到，不必等 Pages 重新部署。

---

## 二、计划 A · 静态站 + 勾选即提交

### 方案（已定，不要换成别的）

```
勾选 / 改备注
  → 立刻写 localStorage（界面马上变）
  → dev：仍 POST /api/progress 写本地文件（现在这套留下，本地刷题不变）
  → Pages：若已保存 PAT，防抖约 2 秒后
        GET contents API 拿当前 sha
        与远端按 updatedAt 合并
        PUT 同一路径，commit message「刷题进度更新」
  → 打开页面 / 窗口重新聚焦：
        fetch raw.githubusercontent.com/.../main/src/data/progress.json?t=时间戳
        与本地合并（沿用 mergeProgress）
```

未粘贴令牌时：Pages 上只记 localStorage，顶栏提示「进度只在这台浏览器，粘贴令牌后才会提交到 GitHub」。不要静默失败。

令牌：

- 用户在顶栏自己粘贴一次。存 `localStorage`，键名 `sft-github-token`。
- **任何文件、日志、报错文案都不许带上令牌。**
- 推荐 Fine-grained PAT：只授权 `socoo123/algorithm_pratices_web`，Contents 读+写。设置页写清这三步，并给「清除令牌」。
- 用 `Authorization: Bearer <token>` 调 `https://api.github.com`。先 GET 校验，失败就提示，不要 commit。

接口（写死，避免下次猜）：

- 仓库：`socoo123/algorithm_pratices_web`，分支 `main`，路径 `src/data/progress.json`
- GET/PUT `https://api.github.com/repos/socoo123/algorithm_pratices_web/contents/src/data/progress.json`
- PUT body：`message`、`content`（UTF-8 JSON 的 base64）、`sha`（GET 到的）、`branch: "main"`
- Header：`Accept: application/vnd.github+json`，`X-GitHub-Api-Version: 2022-11-28`
- 409（sha 过期）：重新 GET、合并、再 PUT 一次。第二次仍失败就停，顶栏报错，不要循环。
- 读取给没带令牌的启动合并用：`https://raw.githubusercontent.com/socoo123/algorithm_pratices_web/main/src/data/progress.json`

构建与路由：

- 生产 `base` 为 `/algorithm_pratices_web/`。`npm run dev` 仍是 `http://localhost:5800/`，**不要**给本地加上这个前缀。
- `BrowserRouter` 的 `basename` 用 `import.meta.env.BASE_URL`（去掉末尾斜杠；根路径时为空）。
- 构建产物里放一份 `404.html`（内容与 `index.html` 相同），否则 Pages 上刷新 `/bank/...` 会 404。
- 站内链接、资源都走 Vite `base`，不要手写死 `/`。

Workflow（新建 `.github/workflows/pages.yml`，对齐 person_blog，包管理器改 npm）：

- `on.push.branches: [main]`，并且 `paths-ignore: ['src/data/progress.json']`。只改进度的 commit 不重建站点；进度和代码在同一次 push 里仍会构建。
- `permissions: contents: read, pages: write, id-token: write`
- Node 22，`npm ci`，`npm run build`，`actions/upload-pages-artifact` 的 `path: dist`，`actions/deploy-pages`
- 构建环境变量让 Vite 使用上面的 `base`（例如 `GITHUB_PAGES=true`）。读 `vite.config.ts` 现有写法再接，不要另起一套配置文件。

用户要做的一次手工（写进 README，agent 做不了）：

1. 仓库 Settings → Pages → Source 选 **GitHub Actions**（现在 `has_pages: false`）。
2. 建 Fine-grained PAT，在网站顶栏粘贴。

### 启动清单 A（按顺序，做完打勾并改指针）

1. ✅ 读本文件指针。确认 `gh api repos/socoo123/algorithm_pratices_web` 仍是 `default_branch=main`、无保护。变了就先改本方案再写代码。
2. ✅ `vite.config.ts`：生产 base、404.html 拷贝。本地 `npm run dev` 路径不变。
3. ✅ `src/App.tsx`：`basename`。全站 `<Link>` / `navigate` 不用改（它们相对 basename）。错误页里手写的 `<a href="/">` 要改成带 base。
4. ✅ 新模块（建议 `src/lib/github-progress.ts`）：GET/PUT、base64、sha 冲突重试一次、raw 拉取。`progress-store.ts` / `useProgress.tsx` 接上：dev 仍走 `/api/progress`；`import.meta.env.DEV === false` 才走 GitHub。防抖 2 秒，把连续勾选并成一次 commit。
5. ✅ `SiteHeader.tsx`：令牌输入、清除、校验结果、未连接提示。脏标记文案改成：dev 仍说「未写入 progress.json」；Pages 上说「未提交到 GitHub」或「已提交」。
6. ✅ `.github/workflows/pages.yml` + README「部署」一节（地址、Pages 开关、PAT 三步、进度不会随勾选去重建整站）。
7. ✅ 验收（下面第六节 A）。通过后把指针改成「Pages 计划：代码完成，待用户打开 Pages 并粘贴 PAT」。**不要主动 git commit**，除非用户这轮说了提交。

### 明确不做

- 不把 PAT 放进 GitHub Actions secrets 来代替浏览器提交（那只能在 CI 里写，页面勾选碰不到）。
- 不改用 localStorage 当成最终方案。
- 不为进度提交去重建 800 篇题解。
- 不改题解、题库 JSON、CLRS、随笔。

---

## 三、计划 B · 灵茶难题幻灯片

两段，不要并成一步。

1. **播放器**：主 agent 写一次。所有灵茶题解都能按八章翻页；有「幻灯片步骤」表时，例子按那张表逐步讲。
2. **步骤稿**：只给入选题写。**5 个 agent 并行**，每批 25 题。Easy、低星 Medium、基础题库不写。

### 入选（现查 JSON，禁止手抄）

题单「经典度 ★」由灵神难度分映射，星越高通常越难（见 `content/banks/lingcha-1/README.md`）。

- `difficulty == "Hard"`：两期全部
- `difficulty == "Medium"` 且 `stars >= 4`（★★★★、★★★★★）
- 其余不写步骤稿

勘察时的数量（开工时用下面脚本重算，对不上就以脚本为准）：一期 236（Hard 30 + Medium 高星 206），二期 142（Hard 30 + Medium 高星 112），合计 **378**。378 ÷ 25 = 15 批余 3，最后一批不足 25 就少发 agent，不要凑 Easy。

若以后改口只要 Medium ★★★★★ + Hard：把脚本里的 `4` 改成 `5`，已写过 `### 幻灯片步骤` 的文件保留，不要删。

排序（脚本已含）：先全部 Hard（星高的在前，一期先于二期），再 Medium 五星，再 Medium 四星。这样停在半路时，最难的已经有步骤稿。

```bash
python3 - << 'PY'
import json
from pathlib import Path
root = Path("/Users/zy/ai_web_page/algorithm_pratices_web")
rows = []
for bid in ("lingcha-1", "lingcha-2"):
    for p in json.loads((root/f"src/data/banks/{bid}.json").read_text())["problems"]:
        if p["difficulty"] == "Hard" or (p["difficulty"] == "Medium" and p["stars"] >= 4):
            text = (root/f"solutions/{bid}/{p['slug']}.md").read_text(encoding="utf-8")
            rows.append((0 if p["difficulty"]=="Hard" else 1, -p["stars"], 0 if bid=="lingcha-1" else 1, p["order"], bid, p["slug"], p["number"], "DONE" if "### 幻灯片步骤" in text else "todo"))
rows.sort()
todo = [r for r in rows if r[-1]=="todo"]
print("selected", len(rows), "done", len(rows)-len(todo), "todo", len(todo))
chunk = todo[:25]
print("this batch", len(chunk))
for i, r in enumerate(chunk):
    print(f"{'ABCDE'[i//5]} {r[4]}/{r[5]} #{r[6]}")
PY
```

`DONE` 的判断字符串就是 `### 幻灯片步骤`。agent 必须原样使用这个标题，否则下一批会重做。

### 播放器（B1–B4，主 agent）

按钮出现在两处：灵茶一期 / 二期题解页，以及算法导论正文页 `/clrs/:slug`（`content/clrs/*.md` 现有 35 章，`hasContent` 全为 true）。基础题库和随笔没有。算法导论只复用同一播放器，按该章已有的 `##` 翻页；有表格就逐行。不追加 `### 幻灯片步骤`，不改 `content/clrs/**`，不为此开 agent。

- 按行首 `## ` 切页。文首到第一个 `##` 并进第一页。不多补空页。
- 播放优先用文内 `### 幻灯片步骤` 表：一行一步。列固定为 `step | 画面 | 解说`。一步的画面用 Markdown 渲染（短句、行内代码），解说单独一行，像 vim 播放器底下的解说。同一节可以有多张这种表（示例 1/2/3），按出现顺序接成一条。
- 还没有步骤稿的题：退回「五、例子演示」里已有的 GFM 表，表头常驻，一次高亮一行。没有表就整节当一页。
- 操作对齐 vim_study：空格播放/暂停，← → 单步（先走行再翻页），回到开头，0.5× / 1× / 2×（1× ≈ 2.5 秒一步）。底部「第 i / n 页」。Esc 回长文。`?deck=1` 刷新仍在。
- 沿用 `MarkdownArticle`。宽表横向滚动，不删列。

### 步骤稿（每批，5 agent）

播放器验收通过之后才开第一批。一次「执行幻灯片计划」只跑脚本打印的这一批。

一条消息里并行 **5 个** `generalPurpose` Task（fresh，不要 resume）。Lane A–E 各 5 题，任务书用下面模板，slug 用脚本当场输出，五个清单不得重复。某 lane 零产出就只重跑该 lane。

agent 只改自己的 `solutions/<bank>/<slug>.md`，而且**只追加**，不重写八章：

- 插在「五、例子演示」最后一张表现有内容之后、「## 六、」之前。
- 已有 `### 幻灯片步骤` 的文件不要再改。
- 步骤从该篇已有例子表来，一行一步，不要新编一个和正文矛盾的例子。多示例就多张表，每张表前用一句话标明示例。
- 解说是一句人话，说明这一行走到了哪、为什么。画面格保持短。
- 八章标题、深色 Mermaid、无 KaTeX 都还在。不改代码块里的算法。

任务书模板：

```
你在 /Users/zy/ai_web_page/algorithm_pratices_web。只改下面 5 个文件，每个只在「五、例子演示」末尾、「## 六、」之前追加幻灯片步骤，不要改其它章节。

标题必须是一行：### 幻灯片步骤
接着 GFM 表，列名就是 step、画面、解说。一行一步，一步一句解说。材料用该篇已有的例子表，不要另编数据。多个示例就重复「### 幻灯片步骤」，每张表前写清是示例几。文件里已有这个标题就不要动。

不要动八章标题，不要引入 $$、\(、\Theta、\lg。不要 git，不要改别的 slug。

题目：
- solutions/lingcha-1/<slug>.md
- ...
```

主 agent 等 5 个都回来后：用脚本再数 `done`，抽 2 篇看表头和步数是否对得上原文例子，确认没改「## 一、」到「## 四、」和「## 六、」之后。然后把指针改成 `done/378`，下一批仍由脚本决定。不主动 commit。

### 明确不做

- 不做代码光标动画，不为每题写 vim 那种快照 JSON。
- 不改 Easy、Medium ★≤3、基础题库、随笔的正文。算法导论 35 章只挂播放器，不改 `content/clrs/**`。
- 不重跑全库 `check_solutions.py`，不动 `PLAN-lingcha-1.md` / `PLAN-lingcha-2.md`。
- 一次触发不连跑多批。

---

## 四、建议顺序

先 A 后 B。B 里先播放器，再步骤稿。用户只说其中一个触发词，就只做那一个。

---

## 五、动手时的文件边界

计划 A 允许改：`vite.config.ts`、`src/App.tsx`、`src/lib/progress-store.ts`、`src/hooks/useProgress.tsx`、`src/components/SiteHeader.tsx`、新建 `src/lib/github-progress.ts`、新建 `.github/workflows/pages.yml`、`README.md`、本文件指针。不改 `solutions/**`。

计划 B 播放器允许改：`src/pages/SolutionPage.tsx`、`src/pages/ClrsArticlePage.tsx`、新建幻灯片组件与切分函数、必要样式、本文件指针。此阶段不改 `solutions/**` 和 `content/clrs/**`。

计划 B 步骤稿：每个 agent 只追加自己那 5 个 `solutions/lingcha-1|2/<slug>.md`。主 agent 只改本文件指针。

都不要改：`content/**`、`src/data/banks/*.json`、`PLAN-lingcha-1.md`、`PLAN-lingcha-2.md`。

---

## 六、验收

### A

- `npm run dev`：勾选仍写入本地 `src/data/progress.json`；地址仍是 localhost，无 `/algorithm_pratices_web` 前缀。
- `GITHUB_PAGES=true npm run build`（或计划里最终采用的 env）：`dist/index.html` 资源前缀是 `/algorithm_pratices_web/`，且存在 `dist/404.html`。
- 本地用假令牌单测 PUT 体：message、branch、sha、content 能解码回同一 JSON。不要对真实仓库发测试 commit，除非用户点头。
- 浏览器：首页、某个分类、某篇题解、直接刷新题解 URL、返回首页。桌面宽度即可；顶栏令牌框在窄屏不挡勾选。
- 未粘贴令牌时勾选：勾选留在 localStorage，有可见提示，网络面板里没有发往 `api.github.com` 的 PUT。

### B 播放器

- `solutions/lingcha-1/jump-game-vi.md`（Medium、五星，在入选名单里）能翻八章，例子表能逐行走。再抽脚本里的第一篇 Hard 走一遍。
- 一篇还没有步骤稿的灵茶题不报错，退回例子表或整页。Easy 的灵茶题也有「幻灯片」按钮，但没有专写步骤稿。基础题库题解没有这个按钮。
- 算法导论打开 `/clrs/06-heapsort`：有「幻灯片」按钮，能按该章 `##` 翻页，Esc 回长文。章节 markdown 与改前一致。
- ← → 空格 倍速 回到开头、Esc、刷新 `?deck=1` 可用。退出后长文、Mermaid、代码块与改前一致。

### B 每一批步骤稿

- 脚本里本批 25 个 slug 都变成 `DONE`，没有跨 lane 重复文件。
- 抽 2 篇：`### 幻灯片步骤` 在「## 六、」之前；步数与该篇原例子表数据行一致；「## 一、」至「## 四、」未被改写。
- 浏览器打开其中一篇：幻灯片播的是步骤稿里的解说，而不是只闪表格。
