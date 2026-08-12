import clrsIndex from '../data/clrs-index.json';
import type { ClrsChapter, ClrsIndex, ClrsPart } from '../types';

export function getClrsIndex(): ClrsIndex {
  return clrsIndex as ClrsIndex;
}

export function getClrsParts(): ClrsPart[] {
  return [...getClrsIndex().parts].sort((a, b) => a.order - b.order);
}

export function getClrsChapters(): ClrsChapter[] {
  return getClrsIndex().chapters;
}

export function getClrsChapter(slug: string): ClrsChapter | undefined {
  return getClrsChapters().find((c) => c.slug === slug);
}

export function getClrsPart(partId: string): ClrsPart | undefined {
  return getClrsParts().find((p) => p.id === partId);
}

export function getClrsChaptersByPart(partId: string): ClrsChapter[] {
  return getClrsChapters().filter((c) => c.partId === partId);
}

export function countClrsReady(): { ready: number; total: number } {
  const chapters = getClrsChapters();
  return {
    ready: chapters.filter((c) => c.hasContent).length,
    total: chapters.length,
  };
}
