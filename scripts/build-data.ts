import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Bank,
  BankFile,
  Category,
  DayPlan,
  Problem,
  ProgressFile,
  ProblemProgress,
} from '../src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outIndexPath = path.join(root, 'src/data/banks-index.json');
const progressPath = path.join(root, 'src/data/progress.json');

type CategoryMeta = {
  file: string;
  id: string;
  name: string;
  order: number;
  expected: number;
};

type BankConfig = {
  id: string;
  name: string;
  description: string;
  totalCount: number;
  categories: CategoryMeta[];
};

const BANKS: BankConfig[] = [
  {
    id: 'base',
    name: '基础题库',
    description: '一线大厂高频 200 题，按标签分组、双维度评分。',
    totalCount: 200,
    categories: [
      { file: '链表.md', id: 'linked-list', name: '链表', order: 1, expected: 20 },
      { file: '滑动窗口与双指针.md', id: 'sliding-window', name: '滑动窗口与双指针', order: 2, expected: 30 },
      { file: '二叉树与递归.md', id: 'binary-tree', name: '二叉树与递归', order: 3, expected: 30 },
      { file: '栈与队列.md', id: 'stack-queue', name: '栈与队列', order: 4, expected: 20 },
      { file: '回溯.md', id: 'backtracking', name: '回溯', order: 5, expected: 15 },
      { file: '排序.md', id: 'sorting', name: '排序', order: 6, expected: 15 },
      { file: '动态规划.md', id: 'dp', name: '动态规划', order: 7, expected: 50 },
      { file: '其他.md', id: 'misc', name: '其他', order: 8, expected: 20 },
    ],
  },
  {
    id: 'lingcha-1',
    name: '灵茶一期',
    description: '灵茶题单第一档 300 题（已去重基础题库），补齐滑窗 / 二分 / 数据结构 / DP 等核心模板。',
    totalCount: 300,
    categories: [
      { file: '滑动窗口与双指针.md', id: 'sliding-window', name: '滑动窗口与双指针', order: 1, expected: 35 },
      { file: '二分算法.md', id: 'binary-search', name: '二分算法', order: 2, expected: 25 },
      { file: '常用数据结构.md', id: 'data-structure', name: '常用数据结构', order: 3, expected: 65 },
      { file: '链表树与回溯.md', id: 'linked-tree-backtrack', name: '链表树与回溯', order: 4, expected: 40 },
      { file: '网格图.md', id: 'grid', name: '网格图', order: 5, expected: 20 },
      { file: '单调栈.md', id: 'monotonic-stack', name: '单调栈', order: 6, expected: 8 },
      { file: '贪心与思维.md', id: 'greedy', name: '贪心与思维', order: 7, expected: 30 },
      { file: '位运算.md', id: 'bit', name: '位运算', order: 8, expected: 7 },
      { file: '数学算法.md', id: 'math', name: '数学算法', order: 9, expected: 10 },
      { file: '字符串.md', id: 'string', name: '字符串', order: 10, expected: 5 },
      { file: '动态规划.md', id: 'dp', name: '动态规划', order: 11, expected: 55 },
    ],
  },
  {
    id: 'lingcha-2',
    name: '灵茶二期',
    description: '灵茶题单第二档 300 题：补图论面试考点，并按难度与优先级下探各专题。',
    totalCount: 300,
    categories: [
      { file: '滑动窗口与双指针.md', id: 'sliding-window', name: '滑动窗口与双指针', order: 1, expected: 25 },
      { file: '二分算法.md', id: 'binary-search', name: '二分算法', order: 2, expected: 20 },
      { file: '常用数据结构.md', id: 'data-structure', name: '常用数据结构', order: 3, expected: 40 },
      { file: '链表树与回溯.md', id: 'linked-tree-backtrack', name: '链表树与回溯', order: 4, expected: 30 },
      { file: '网格图.md', id: 'grid', name: '网格图', order: 5, expected: 13 },
      { file: '图论算法.md', id: 'graph', name: '图论算法', order: 6, expected: 37 },
      { file: '单调栈.md', id: 'monotonic-stack', name: '单调栈', order: 7, expected: 10 },
      { file: '贪心与思维.md', id: 'greedy', name: '贪心与思维', order: 8, expected: 30 },
      { file: '位运算.md', id: 'bit', name: '位运算', order: 9, expected: 11 },
      { file: '数学算法.md', id: 'math', name: '数学算法', order: 10, expected: 12 },
      { file: '字符串.md', id: 'string', name: '字符串', order: 11, expected: 17 },
      { file: '动态规划.md', id: 'dp', name: '动态规划', order: 12, expected: 55 },
    ],
  },
];

const PROBLEM_RE =
  /^- \[( |x)\] \*\*\[#(\d+)\s+([^\]]+?)\]\((https:\/\/leetcode\.cn\/problems\/([^/]+)\/)\)\*\* · (Easy|Medium|Hard) · (★+) · ((?:\uD83D\uDD25)+) · (.+)$/;
const ROUND_RE = /^\s+- \[( |x)\] 第 (\d) 遍$/;

function extractSection(content: string, startHeading: string, endHeadings: string[]): string {
  const startIdx = content.indexOf(startHeading);
  if (startIdx === -1) return '';
  let endIdx = content.length;
  for (const h of endHeadings) {
    const i = content.indexOf(h, startIdx + startHeading.length);
    if (i !== -1 && i < endIdx) endIdx = i;
  }
  return content.slice(startIdx + startHeading.length, endIdx).trim();
}

function parseTips(content: string): string[] {
  const section = extractSection(content, '## 面试高频提示', ['---', '## ']);
  return section
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.replace(/^-\s*/, ''));
}

function parseDayPlan(readme: string): DayPlan[] {
  const lines = readme.split('\n');
  const plans: DayPlan[] = [];
  for (const line of lines) {
    const m = line.match(/^\|\s*Day\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (m) {
      plans.push({ day: Number(m[1]), task: m[2].trim(), count: m[3].trim() });
    }
  }
  return plans;
}

function listSolutionSlugs(solutionsDir: string): Set<string> {
  const set = new Set<string>();
  if (!fs.existsSync(solutionsDir)) return set;
  for (const f of fs.readdirSync(solutionsDir)) {
    if (f.endsWith('.md')) set.add(f.replace(/\.md$/, ''));
  }
  return set;
}

function parseCategoryFile(
  bankId: string,
  contentDir: string,
  meta: CategoryMeta,
  solutionSlugs: Set<string>,
): { category: Category; problems: Problem[]; seed: Record<string, ProblemProgress> } {
  const filePath = path.join(contentDir, meta.file);
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('[会员]')) {
    throw new Error(`${meta.file} still contains [会员]`);
  }

  const intro = extractSection(content, '## 刷题建议', ['## 评分说明', '## 题目清单']);
  const interviewTips = parseTips(content);

  const category: Category = {
    id: meta.id,
    bankId,
    name: meta.name,
    order: meta.order,
    intro,
    interviewTips,
  };

  const lines = content.split('\n');
  const problems: Problem[] = [];
  const seed: Record<string, ProblemProgress> = {};
  let order = 0;
  let currentSlug: string | null = null;
  let rounds: [boolean, boolean, boolean] = [false, false, false];

  const flushRounds = () => {
    if (!currentSlug) return;
    if (rounds.some(Boolean)) {
      const key = `${bankId}/${currentSlug}`;
      seed[key] = {
        rounds: [...rounds] as [boolean, boolean, boolean],
        updatedAt: new Date(0).toISOString(),
      };
    }
    currentSlug = null;
    rounds = [false, false, false];
  };

  for (const line of lines) {
    const pm = line.match(PROBLEM_RE);
    if (pm) {
      flushRounds();
      order += 1;
      const slug = pm[5];
      currentSlug = slug;
      problems.push({
        bankId,
        slug,
        number: pm[2],
        title: pm[3].trim(),
        url: pm[4],
        difficulty: pm[6] as Problem['difficulty'],
        stars: pm[7].length,
        heat: [...pm[8]].length,
        hint: pm[9].trim(),
        categoryId: meta.id,
        order,
        hasSolution: solutionSlugs.has(slug),
      });
      continue;
    }
    const rm = line.match(ROUND_RE);
    if (rm && currentSlug) {
      const idx = Number(rm[2]) - 1;
      if (idx >= 0 && idx < 3) rounds[idx] = rm[1] === 'x';
    }
  }
  flushRounds();

  if (problems.length !== meta.expected) {
    throw new Error(`${bankId}/${meta.file}: expected ${meta.expected} problems, got ${problems.length}`);
  }

  return { category, problems, seed };
}

function mergeSeed(existing: ProgressFile | null, seed: Record<string, ProblemProgress>): ProgressFile {
  const problems = { ...(existing?.problems ?? {}) };
  for (const [key, value] of Object.entries(seed)) {
    if (!problems[key]) problems[key] = value;
  }
  return {
    version: 1,
    updatedAt: existing?.updatedAt ?? new Date().toISOString(),
    problems,
  };
}

function stableBankJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { generatedAt?: string };
    delete parsed.generatedAt;
    return JSON.stringify(parsed);
  } catch {
    return '';
  }
}

function buildBank(cfg: BankConfig): { bank: Bank; seed: Record<string, ProblemProgress> } {
  const contentDir = path.join(root, 'content/banks', cfg.id);
  const solutionsDir = path.join(root, 'solutions', cfg.id);
  const outBankPath = path.join(root, 'src/data/banks', `${cfg.id}.json`);

  if (!fs.existsSync(contentDir)) {
    throw new Error(`Missing content dir: ${contentDir}`);
  }

  const readme = fs.readFileSync(path.join(contentDir, 'README.md'), 'utf8');
  const dayPlan = parseDayPlan(readme);
  const solutionSlugs = listSolutionSlugs(solutionsDir);

  const categories: Category[] = [];
  const allProblems: Problem[] = [];
  const allSeed: Record<string, ProblemProgress> = {};

  for (const meta of cfg.categories) {
    const { category, problems, seed } = parseCategoryFile(cfg.id, contentDir, meta, solutionSlugs);
    categories.push(category);
    allProblems.push(...problems);
    Object.assign(allSeed, seed);
  }

  const slugs = new Set<string>();
  for (const p of allProblems) {
    if (slugs.has(p.slug)) throw new Error(`${cfg.id}: duplicate slug ${p.slug}`);
    slugs.add(p.slug);
    if (!p.url.match(/^https:\/\/leetcode\.cn\/problems\/[^/]+\/$/)) {
      throw new Error(`${cfg.id}: bad url for ${p.slug}`);
    }
  }

  if (allProblems.length !== cfg.totalCount) {
    throw new Error(`${cfg.id}: expected ${cfg.totalCount} problems, got ${allProblems.length}`);
  }

  const bank: Bank = {
    id: cfg.id,
    name: cfg.name,
    description: cfg.description,
    totalCount: cfg.totalCount,
  };

  const bankFile: BankFile = {
    bank,
    categories: categories.sort((a, b) => a.order - b.order),
    problems: allProblems,
    dayPlan,
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outBankPath), { recursive: true });
  const nextBank = `${JSON.stringify(bankFile, null, 2)}\n`;
  const prevBank = fs.existsSync(outBankPath) ? fs.readFileSync(outBankPath, 'utf8') : '';
  if (stableBankJson(prevBank) !== stableBankJson(nextBank)) {
    fs.writeFileSync(outBankPath, nextBank, 'utf8');
  }

  console.log(`Built ${cfg.id}: ${allProblems.length} problems → ${outBankPath}`);
  return { bank, seed: allSeed };
}

function main() {
  const banks: Bank[] = [];
  const allSeed: Record<string, ProblemProgress> = {};

  for (const cfg of BANKS) {
    const { bank, seed } = buildBank(cfg);
    banks.push(bank);
    Object.assign(allSeed, seed);
  }

  const nextIndex = `${JSON.stringify({ banks }, null, 2)}\n`;
  const prevIndex = fs.existsSync(outIndexPath) ? fs.readFileSync(outIndexPath, 'utf8') : '';
  if (prevIndex !== nextIndex) {
    fs.writeFileSync(outIndexPath, nextIndex, 'utf8');
  }

  if (fs.existsSync(progressPath)) {
    JSON.parse(fs.readFileSync(progressPath, 'utf8')) as ProgressFile;
  } else {
    const seeded = mergeSeed(null, allSeed);
    fs.writeFileSync(progressPath, `${JSON.stringify(seeded, null, 2)}\n`, 'utf8');
    console.log(`Seeded progress.json with ${Object.keys(allSeed).length} entries from markdown`);
  }
}

main();
