import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLeft,
  phosphorFilePdf,
  phosphorFileCsv,
  phosphorFileText,
  phosphorPlus,
  phosphorTrash,
  phosphorDownloadSimple,
  phosphorWarningCircle,
  phosphorCheckCircle,
  phosphorBank,
  phosphorX,
} from '@ng-icons/phosphor-icons/regular';
import { lastValueFrom } from 'rxjs';

import { ImportStore, INCOME_CATEGORY, OTHER_CATEGORY } from '../../core/stores/import.store';
import { PreferencesStore } from '../../core/stores/preferences.store';
import { ImportApi } from '../../core/api/import-api.service';
import { formatCurrency } from '../../core/utils/formatters';
import type { ImportRow, ImportSide, ConfirmPayload } from '../../core/models/import.model';
import { extractApiError } from '../../core/utils/http-error';
import { rowToEntry } from '../../core/models/import.model';
import { validateImportRow } from '../../core/utils/import-validation';

@Component({
  selector: 'app-import-preview',
  imports: [RouterLink, NgIcon],
  templateUrl: './import-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      phosphorArrowLeft,
      phosphorFilePdf,
      phosphorFileCsv,
      phosphorFileText,
      phosphorPlus,
      phosphorTrash,
      phosphorDownloadSimple,
      phosphorWarningCircle,
      phosphorCheckCircle,
      phosphorBank,
      phosphorX,
    }),
  ],
})
export class ImportPreviewComponent {
  private store = inject(ImportStore);
  private prefs = inject(PreferencesStore);
  private api = inject(ImportApi);
  private router = inject(Router);

  readonly fileName = this.store.fileName;
  readonly fileType = this.store.fileType;
  readonly bankName = this.store.bankName;
  readonly warning = this.store.warning;
  readonly rows = this.store.rows;
  readonly batchId = this.store.batchId;
  readonly hasData = this.store.hasData;
  readonly validCount = this.store.validCount;
  readonly invalidCount = this.store.invalidCount;
  readonly categories = computed(() => this.prefs.prefs().categories);

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly total = computed(() => this.rows().length);
  readonly credits = computed(
    () => this.rows().filter((r) => r.type === 'credit').reduce((s, r) => s + (r.amount || 0), 0)
  );
  readonly debits = computed(
    () => this.rows().filter((r) => r.type === 'debit').reduce((s, r) => s + (r.amount || 0), 0)
  );

  readonly fileIcon = computed(() => {
    const type = this.fileType();
    if (type === 'pdf') return 'phosphorFilePdf';
    if (type === 'csv') return 'phosphorFileCsv';
    return 'phosphorFileText';
  });

  canSubmit = computed(
    () => this.hasData() && this.validCount() > 0 && !this.submitting()
  );

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  onUpdate(id: string, field: keyof ImportRow, value: string): void {
    if (field === 'amount' || field === 'balance') {
      const num = value === '' ? null : Number(value.replace(/[^0-9.-]/g, ''));
      this.store.updateRow(id, { [field]: num } as Partial<ImportRow>);
    } else {
      this.store.updateRow(id, { [field]: value } as Partial<ImportRow>);
    }
  }

  normalizeAmount(id: string): void {
    const row = this.rows().find((r) => r.id === id);
    if (!row || row.amount === null || row.amount === undefined) return;
    this.store.updateRow(id, { amount: Math.round(row.amount * 100) / 100 });
  }

  onTypeChange(id: string, type: ImportSide): void {
    const row = this.rows().find((r) => r.id === id);
    const patch: Partial<ImportRow> = { type };
    if (type === 'credit' && row && row.category !== INCOME_CATEGORY) {
      patch.category = INCOME_CATEGORY;
    } else if (type === 'debit' && row && row.category === INCOME_CATEGORY) {
      patch.category = OTHER_CATEGORY;
    }
    this.store.updateRow(id, patch);
  }

  onCategoryChange(id: string, category: string): void {
    this.store.updateRow(id, { category });
  }

  addRow(): void {
    this.store.addRow();
  }

  removeRow(id: string): void {
    this.store.removeRow(id);
  }

  async confirm(): Promise<void> {
    this.error.set('');
    this.success.set('');
    this.submitting.set(true);

    try {
      // Re-validate every row client-side to catch obvious issues
      const all = this.rows();
      const firstInvalid = all.find((r) => validateImportRow(r).length > 0);
      if (firstInvalid) {
        this.error.set('Fix the highlighted rows before importing.');
        this.store.updateRow(firstInvalid.id, {}); // no-op to trigger recompute of errors
        return;
      }

      const entries = all.map((r) => rowToEntry(r));
      const payload: ConfirmPayload = {
        batchId: this.store.batchId(),
        entries,
      };
      const res = await lastValueFrom(this.api.confirm(payload));
      let message: string;
      if (res.duplicate) {
        message = `No new entries created (batch already imported, ${res.imported} existing).`;
      } else {
        message = `Imported ${res.imported} entr${res.imported === 1 ? 'y' : 'ies'} successfully.`;
      }
      this.store.successMessage.set(message);
      this.success.set(message);
      this.store.clear();
      await this.router.navigate(['/import']);
    } catch (err: unknown) {
      this.error.set(extractApiError(err, 'Failed to confirm the import. Please try again.'));
    } finally {
      this.submitting.set(false);
    }
  }
}
