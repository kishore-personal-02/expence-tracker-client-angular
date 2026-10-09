import { Injectable, computed, signal } from '@angular/core';
import type {
  ImportRow,
  ImportSource,
  ParseResponse,
  ParsedTransaction,
} from '../models/import.model';
import { withRowErrors } from '../utils/import-validation';

export const INCOME_CATEGORY = 'Income';
export const OTHER_CATEGORY = 'Other';

function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `row_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function toRow(txn: ParsedTransaction): ImportRow {
  return withRowErrors({
    id: txn.id || newId(),
    date: toDateInput(txn.date),
    description: txn.description || '',
    reference: txn.reference || '',
    amount: txn.amount,
    balance: txn.balance,
    type: txn.type,
    category: txn.category || (txn.type === 'credit' ? INCOME_CATEGORY : OTHER_CATEGORY),
    source: txn.source,
    errors: [],
  });
}

/**
 * Holds the parsed-but-unconfirmed import between the upload page and the
 * preview page. Nothing here touches the database; entries are only created
 * after the user confirms on the preview page.
 */
@Injectable({ providedIn: 'root' })
export class ImportStore {
  readonly fileName = signal('');
  readonly fileType = signal<ImportSource | null>(null);
  readonly bankName = signal('');
  readonly pageCount = signal<number | null>(null);
  readonly warning = signal('');
  readonly rows = signal<ImportRow[]>([]);
  readonly batchId = signal('');
  readonly successMessage = signal('');

  readonly hasData = computed(() => this.rows().length > 0);
  readonly invalidCount = computed(() => this.rows().filter((r) => r.errors.length).length);
  readonly validCount = computed(() => this.rows().length - this.invalidCount());

  load(response: ParseResponse): void {
    this.fileName.set(response.fileName);
    this.fileType.set(response.fileType);
    this.bankName.set(response.bankName || '');
    this.pageCount.set(response.pageCount ?? null);
    this.warning.set(response.warning || '');
    this.rows.set(response.transactions.map(toRow));
    this.batchId.set(newId());
  }

  clear(): void {
    this.fileName.set('');
    this.fileType.set(null);
    this.bankName.set('');
    this.pageCount.set(null);
    this.warning.set('');
    this.rows.set([]);
    this.batchId.set('');
  }

  updateRow(id: string, patch: Partial<ImportRow>): void {
    this.rows.update((rows) =>
      rows.map((row) => (row.id === id ? withRowErrors({ ...row, ...patch }) : row))
    );
  }

  addRow(): string {
    const id = newId();
    const row: ImportRow = {
      id,
      date: '',
      description: '',
      reference: '',
      amount: null,
      balance: null,
      type: 'debit',
      category: OTHER_CATEGORY,
      source: this.fileType() || 'csv',
      errors: [],
    };
    this.rows.update((rows) => [...rows, withRowErrors(row)]);
    return id;
  }

  removeRow(id: string): void {
    this.rows.update((rows) => rows.filter((row) => row.id !== id));
  }
}