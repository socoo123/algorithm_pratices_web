import banksIndex from '../data/banks-index.json';
import type { BankFile, BanksIndex } from '../types';

const modules = import.meta.glob('../data/banks/*.json', { eager: true }) as Record<
  string,
  { default: BankFile }
>;

const bankFiles: Record<string, BankFile> = {};
for (const mod of Object.values(modules)) {
  bankFiles[mod.default.bank.id] = mod.default;
}

export function getBanksIndex(): BanksIndex {
  return banksIndex as BanksIndex;
}

export function getBankFile(bankId: string): BankFile | undefined {
  return bankFiles[bankId];
}
