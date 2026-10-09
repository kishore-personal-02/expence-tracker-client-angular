import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, type ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowCounterClockwise,
  phosphorBank,
  phosphorFileCsv,
  phosphorFilePdf,
  phosphorFileText,
  phosphorFolderOpen,
} from '@ng-icons/phosphor-icons/regular';
import { lastValueFrom } from 'rxjs';

import { ImportApi } from '../../core/api/import-api.service';
import { ImportStore } from '../../core/stores/import.store';
import { extractApiError } from '../../core/utils/http-error';
import { formatCurrency } from '../../core/utils/formatters';

@Component({
  selector: 'app-import',
  imports: [NgIcon],
  templateUrl: './import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      phosphorArrowCounterClockwise,
      phosphorBank,
      phosphorFileCsv,
      phosphorFilePdf,
      phosphorFileText,
      phosphorFolderOpen,
    }),
  ],
})
export class ImportComponent {
  private readonly router = inject(Router);
  private readonly store = inject(ImportStore);
  private readonly importApi = inject(ImportApi);

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly parsing = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly totals = computed(() => {
    const rows = this.store.rows();
    let expense = 0;
    let income = 0;
    for (const r of rows) {
      const amt = r.amount || 0;
      if (r.type === 'credit') income += amt;
      else expense += amt;
    }
    return { expense, income, count: rows.length };
  });

  readonly selectedCount = computed(() => this.store.rows().length);
  readonly fileName = this.store.fileName;
  readonly bankName = this.store.bankName;
  readonly warning = this.store.warning;

  async handleFile(file: File | undefined): Promise<void> {
    if (!file) return;
    this.error.set('');
    this.success.set('');
    this.parsing.set(true);
    try {
      const data = await lastValueFrom(this.importApi.parse(file));
      this.store.load(data);
      await this.router.navigate(['/import/preview']);
    } catch (err) {
      this.error.set(extractApiError(err, 'Failed to parse the file. Please try another file.'));
    } finally {
      this.parsing.set(false);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.handleFile(input.files?.[0]);
  }

  onChooseClick(): void {
    this.fileInput()?.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.handleFile(file);
  }

  reset(): void {
    this.store.clear();
    this.error.set('');
    this.success.set('');
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }
\r\n  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }\r\n\r\n  readonly storeHasData = this.store.hasData;

}\r\n\r\n  readonly storeHasData = this.store.hasData;\r\n
}