import banksIndex from '../data/banks-index.json';
import baseBank from '../data/banks/base.json';
import type { BankFile, BanksIndex } from '../types';

const bankFiles: Record<string, BankFile> = {
  base: baseBank as BankFile,
};

export function getBanksIndex(): BanksIndex {
  return banksIndex as BanksIndex;
}

export function getBankFile(bankId: string): BankFile | undefined {
  return bankFiles[bankId];
}
