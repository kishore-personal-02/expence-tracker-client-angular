import type { Expense, ExpenseType } from './expense.model';

export type ImportSource = 'pdf' | 'csv';
export type ImportSide = 'credit' | 'debit';

// A raw row exactly as returned by the backend parse endpoint.
export interface ParsedTransaction {
  id: string;
  date: string | null;
  description: string;
  reference: string | null;
  amount: number | null;
  type: ImportSide;
  balance: number | null;
  category: string;
  source: ImportSource;
  confidence: number | null;
  validationErrors: string[];
}

export interface ImportSummary {
  total: number;
  credits: number;
  debits: number;
  totalCredit: number;
  totalDebit: number;
  valid: number;
  needsReview: number;
}

export interface ParseResponse {
  fileName: string;
  size: number;
  fileType: ImportSource;
  bankName: string;
  pageCount: number | null;
  warning: string | null;
  transactions: ParsedTransaction[];
  summary: ImportSummary;
}

// The editable row held in the import store / preview page.
export interface ImportRow {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: number | null;
  balance: number | null;
  type: ImportSide;
  category: string;
  source: ImportSource;
  errors: string[];
}

export interface ImportTotals {
  expense: number;
  income: number;
  count: number;
}

export interface ConfirmEntry {
  date: string;
  description: string;
  amount: number;
  type: ImportSide;
  category: string;
  reference: string | null;
  balance: number | null;
  source: ImportSource;
}

export interface ConfirmPayload {
  batchId: string;
  entries: ConfirmEntry[];
}

export interface ConfirmResponse {
  imported: number;
  duplicate: boolean;
  expenses: Expense[];
}

export function rowToEntry(row: ImportRow): ConfirmEntry {
  return {
    date: row.date,
    description: row.description.trim(),
    amount: Number(row.amount) || 0,
    type: row.type,
    category: row.category,
    reference: row.reference.trim() || null,
    balance: row.balance,
    source: row.source,
  };
}

export function sideToExpenseType(side: ImportSide): ExpenseType {
  return side === 'credit' ? 'income' : 'expense';
}