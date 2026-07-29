import banksIndex from '../data/banks-index.json';
import coupangBank from '../data/banks/coupang.json';
import type { BankFile, BanksIndex } from '../types';

const bankFiles: Record<string, BankFile> = {
  coupang: coupangBank as BankFile,
};

export function getBanksIndex(): BanksIndex {
  return banksIndex as BanksIndex;
}

export function getBankFile(bankId: string): BankFile | undefined {
  return bankFiles[bankId];
}
