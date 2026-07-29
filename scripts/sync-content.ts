import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourceDir = path.join('/Users/zy/ai_learn/algorithm-journey/coupang_interview');
const targetDir = path.join(root, 'content/banks/coupang');

const FILES = [
  'README.md',
  '链表.md',
  '滑动窗口与双指针.md',
  '二叉树与递归.md',
  '栈与队列.md',
  '回溯.md',
  '动态规划.md',
  '排序.md',
  '其他.md',
];

/** Apply replacements only to the file that contains each problem line. */
const REPLACEMENTS: Array<{ file: string; includes: string; replacement: string }> = [
  {
    file: '滑动窗口与双指针.md',
    includes: '#340 至多 K 个不同字符',
    replacement:
      '- [ ] **[#904 水果成篮](https://leetcode.cn/problems/fruit-into-baskets/)** · Medium · ★★★ · 🔥🔥🔥 · 变长窗口（至多 2 种，同 340 模板）',
  },
  {
    file: '滑动窗口与双指针.md',
    includes: '#159 至多两个不同字符',
    replacement:
      '- [ ] **[#1493 删掉一个元素以后全为 1 的最长子数组](https://leetcode.cn/problems/longest-subarray-of-1s-after-deleting-one-element/)** · Medium · ★★★ · 🔥🔥🔥 · 变长窗口（含一个 0 的窗口）',
  },
  {
    file: '排序.md',
    includes: '#252 会议室',
    replacement:
      '- [ ] **[#88 合并两个有序数组](https://leetcode.cn/problems/merge-sorted-array/)** · Easy · ★★★★ · 🔥🔥🔥🔥🔥 · 逆向双指针，从尾部填充',
  },
  {
    file: '排序.md',
    includes: '#253 会议室 II',
    replacement:
      '- [ ] **[#452 用最少数量的箭引爆气球](https://leetcode.cn/problems/minimum-number-of-arrows-to-burst-balloons/)** · Medium · ★★★★ · 🔥🔥🔥🔥 · 区间按右端点排序 + 贪心',
  },
  {
    file: '排序.md',
    includes: '剑指 Offer 51',
    replacement:
      '- [ ] **[#493 翻转对](https://leetcode.cn/problems/reverse-pairs/)** · Hard · ★★★★ · 🔥🔥🔥 · 归并求逆序对扩展（2x 判定）',
  },
];

function replaceProblemLine(content: string, includes: string, replacement: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.includes(includes) && line.includes('leetcode.cn/problems/')) {
      out.push(replacement);
      i += 1;
      while (i < lines.length && /^\s+- \[( |x)\] 第 \d 遍/.test(lines[i])) i += 1;
      if (!replacement.includes('第 1 遍')) {
        out.push('    - [ ] 第 1 遍', '    - [ ] 第 2 遍', '    - [ ] 第 3 遍');
      }
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join('\n');
}

function applyReplacements(file: string, content: string): string {
  let out = content;
  for (const r of REPLACEMENTS.filter((x) => x.file === file)) {
    if (!out.includes(r.includes)) {
      if (out.includes('[会员]') && r.includes.includes('会员')) {
        throw new Error(`Expected to replace ${r.includes} in ${file}`);
      }
      continue;
    }
    out = replaceProblemLine(out, r.includes, r.replacement);
  }
  if (file !== 'README.md' && out.includes('[会员]')) {
    throw new Error(`${file} still contains [会员] after replacements`);
  }
  return out;
}

function main() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source not found: ${sourceDir}`);
  }
  fs.mkdirSync(targetDir, { recursive: true });
  for (const file of FILES) {
    const src = path.join(sourceDir, file);
    if (!fs.existsSync(src)) throw new Error(`Missing source file: ${src}`);
    let content = fs.readFileSync(src, 'utf8');
    if (file !== 'README.md') {
      content = applyReplacements(file, content);
    }
    fs.writeFileSync(path.join(targetDir, file), content, 'utf8');
  }
  console.log(`Synced ${FILES.length} files to ${targetDir}`);
}

main();
