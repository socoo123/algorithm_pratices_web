import essayIndex from '../data/essays-index.json';
import type { EssayEntry, EssayIndex } from '../types';

export function getEssayIndex(): EssayIndex {
  return essayIndex as EssayIndex;
}

export function getEssays(): EssayEntry[] {
  return [...getEssayIndex().articles].sort((a, b) => a.order - b.order);
}

export function getEssay(slug: string): EssayEntry | undefined {
  return getEssayIndex().articles.find((a) => a.slug === slug);
}

export function countEssaysReady(): { ready: number; total: number } {
  const articles = getEssayIndex().articles;
  return {
    ready: articles.filter((a) => a.hasContent).length,
    total: articles.length,
  };
}
