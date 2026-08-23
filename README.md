# 算法刷题进行时

一个本地使用的算法刷题网站。题库按阶段组织：

1. **基础题库**（200 题）— 一线大厂高频地基
2. **灵茶一期**（300 题）— 补齐滑窗 / 二分 / 数据结构 / DP 等核心模板
3. **灵茶二期**（300 题）— 补图论面试考点，并按难度与优先级下探各专题

核心能力：表格化刷题打卡（第 1/2/3 遍）、每题备注、AI 题解挂链、**进度保存在仓库文件里，换电脑 clone 仓库即可恢复**。

---

## 快速开始

环境要求：**Node.js ≥ 20**（建议 22）。

```bash
npm install     # 第一次使用，安装依赖
npm run dev     # 启动网站
```

启动后终端会显示地址（默认 <http://localhost:5800>），浏览器打开即可。
**日常使用就这一条命令。** 停止：`Ctrl + C`。

> 想验证生产构建：`npm run build` 然后 `npm run preview`（可选，平时不需要）。

---

## 日常使用

### 1. 刷题打卡

打开首页的题库卡片 → 左侧选分类 → 表格里勾选每题的 **第 1/2/3 遍**。

- 勾选后**自动保存**，不需要任何手动操作。
- 进度保存在 `src/data/progress.json`（dev 模式下每次勾选自动写入该文件）。
- 清浏览器缓存、换浏览器都不影响：进度以这个文件为准。

### 2. 写备注（易错点 / 思路备忘）

点击题目行尾的 **备注图标**（便签形状）→ 在展开的输入框里写 → 停止输入约半秒后自动保存。
有备注的题目图标会变琥珀色，鼠标悬停可预览。

### 3. 挂 AI 题解

遇到难题，用 AI 生成题解后挂到网站上：

1. 在题目行尾点 **剪贴板图标**（复制 AI 提示词），粘贴给任意 AI。
2. 把 AI 输出的 markdown 保存为：

   ```
   solutions/base/<slug>.md
   ```

   **slug 就是 LeetCode 链接的最后一段**。例如 #78 子集的链接是
   `https://leetcode.cn/problems/subsets/`，文件就存为 `solutions/base/subsets.md`。

3. 网页会自动检测到（dev server 监听该目录；没出现就刷新一下页面），
   表格「题解」列自动出现 **「题解」链接**，点进去看带代码高亮的排版。

> 已经会的题不用挂题解，该列显示 `—`。

### 4. 让进度跟着 git 走（换电脑恢复的关键）

进度文件就是普通文本文件，**提交它即可**：

```bash
git add src/data/progress.json
git commit -m "刷题进度更新"
```

换电脑 / 重装系统后：`git clone` 仓库 → `npm install` → `npm run dev`，进度自动恢复。

### 5. 导出 / 导入（备用功能，一般用不到）

顶栏有「导出进度」「导入进度」按钮：把进度下载成 JSON 文件，或从 JSON 文件恢复。
仅在不方便提交 git 时使用。

---

## 命令一览

| 命令 | 作用 |
|------|------|
| `npm run dev` | **日常用这个**：启动网站（自动重建题库数据 + 勾选自动落盘） |
| `npm run build` | 构建生产版本到 `dist/`（可选） |
| `npm run preview` | 预览生产构建（可选） |
| `npm run data` | 手动重新解析 `content/` 的 markdown 生成题库数据（一般不用，dev/build 前会自动跑） |
| `npm run sync:content` | 从 `algorithm-journey` 仓库重新同步题单 md（进阶，见下） |

---

## 目录结构（只需要知道这几个）

```
├── content/banks/base/     # 题单 markdown（网站数据的来源，一般不用动）
├── solutions/base/         # ★ 你的 AI 题解放这里：<slug>.md
├── src/data/progress.json     # ★ 你的刷题进度，记得 git commit
└── src/data/banks/            # 自动生成的题库数据（构建产物，别手改）
```

---

## 常见问题

**Q：勾选了但 progress.json 没变？**
确认你用的是 `npm run dev` 打开的页面（而不是 `preview` 或静态文件）。勾选时 dev 服务器才会写文件。

**Q：刷新了页面进度还在吗？**
在。进度同时写了文件和浏览器 localStorage，启动时以较新者合并。

**Q：加了题解文件但表格里没出现链接？**
先刷新页面；还不行就重启 `npm run dev`（启动时会重新扫描 `solutions/`）。

**Q：端口 5800 被占了？**
在 `vite.config.ts` 里修改 `server.port`，或临时指定：`npm run dev -- --port 5801`。

**Q：题单 md 改了想更新网站内容？**
`content/banks/base/` 里改完后重启 `npm run dev` 即可（启动时自动重新解析）。
若要从源头 `algorithm-journey` 仓库重新同步，跑 `npm run sync:content`
（会自动应用「移除会员题/剑指题」的替换规则，不会把已替换的题带回来）。

**Q：灵茶题单从哪来？**
一期、二期的题单 markdown 在 `content/banks/lingcha-1/` 和 `content/banks/lingcha-2/`。
源头是 `algorithm-journey/灵茶problems/`。若要按最新灵茶题单重抽二期，跑 `npm run generate:lingcha` 再 `npm run data`。

**Q：还想加第四阶段题库？**
在 `content/banks/` 下新建目录放 md → 在 `scripts/build-data.ts` 里注册 → 首页会自动出现新卡片。
