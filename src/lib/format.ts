import type { Difficulty } from '../types';

export function difficultyClass(d: Difficulty): string {
  switch (d) {
    case 'Easy':
      return 'bg-dracula-green/15 text-dracula-green ring-dracula-green/30';
    case 'Medium':
      return 'bg-dracula-orange/15 text-dracula-orange ring-dracula-orange/30';
    case 'Hard':
      return 'bg-dracula-red/15 text-dracula-red ring-dracula-red/30';
  }
}

export function aiPrompt(number: string, title: string, url: string): string {
  return `请详解 LeetCode #${number} ${title}（${url}）：给出思路推导、Java 代码、复杂度分析，输出为 markdown。`;
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
