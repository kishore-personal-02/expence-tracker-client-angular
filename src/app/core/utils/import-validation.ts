import type { ImportRow } from '../models/import.model';

/**
 * Client-side mirror of the server validator (paymentValidator.js). Keeping
 * them in sync gives instant feedback; the backend still re-validates on
 * confirm and remains the source of truth.
 */
export function validateImportRow(row: ImportRow): string[] {
  const errors: string[] = [];

  if (!row.date || Number.isNaN(new Date(row.date).getTime())) {
    errors.push('Invalid or missing date');
  }

  const description = row.description.trim();
  if (!description) {
    errors.push('Description is required');
  } else if (description.length > 200) {
    errors.push('Description cannot exceed 200 characters');
  }

  const amount = Number(row.amount);
  if (row.amount === null || row.amount === undefined || Number.isNaN(amount)) {
    errors.push('Amount is missing');
  } else if (amount <= 0) {
    errors.push('Amount must be greater than zero');
  }

  if (row.type !== 'credit' && row.type !== 'debit') {
    errors.push('Transaction type must be credit or debit');
  }

  if (!row.category.trim()) {
    errors.push('Category is required');
  }

  return errors;
}

export function withRowErrors(row: ImportRow): ImportRow {
  return { ...row, errors: validateImportRow(row) };
}