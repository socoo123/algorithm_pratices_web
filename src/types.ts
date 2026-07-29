export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Bank {
  id: string;
  name: string;
  description: string;
  totalCount: number;
}

export interface Problem {
  bankId: string;
  slug: string;
  number: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  stars: number;
  heat: number;
  hint: string;
  categoryId: string;
  order: number;
  hasSolution: boolean;
}

export interface Category {
  id: string;
  bankId: string;
  name: string;
  order: number;
  intro: string;
  coupangTips: string[];
}

export interface DayPlan {
  day: number;
  task: string;
  count: string;
}

export interface BankFile {
  bank: Bank;
  categories: Category[];
  problems: Problem[];
  dayPlan: DayPlan[];
  generatedAt: string;
}

export interface BanksIndex {
  banks: Bank[];
}

export interface ProgressFile {
  version: 1;
  updatedAt: string;
  problems: Record<string, ProblemProgress>;
}

export interface ProblemProgress {
  rounds: [boolean, boolean, boolean];
  note?: string;
  updatedAt: string;
}

export function progressKey(bankId: string, slug: string): string {
  return `${bankId}/${slug}`;
}
