import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { lastValueFrom, type Observable } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowsClockwise,
  phosphorBank,
  phosphorCalendarBlank,
  phosphorCheck,
  phosphorCheckCircle,
  phosphorClockAfternoon,
  phosphorCoins,
  phosphorDeviceMobile,
  phosphorHourglass,
  phosphorMoney,
  phosphorPaperPlaneTilt,
  phosphorPause,
  phosphorPencilSimple,
  phosphorPlay,
  phosphorPlus,
  phosphorProhibit,
  phosphorRepeat,
  phosphorTimer,
  phosphorTrash,
  phosphorTrendDown,
  phosphorWarningCircle,
  phosphorX,
  phosphorXCircle,
} from '@ng-icons/phosphor-icons/regular';
import { AutoPaysApi, ScheduledPaymentsApi } from '../../core/api/scheduled-payments-api.service';
import type { ScheduleStatus, ScheduledPayment, ScheduledPaymentDraft } from '../../core/models/scheduled-payment.model';
import { getCategoryIcon } from '../../core/utils/expense-icons';
import { extractApiError } from '../../core/utils/http-error';
import { formatCurrency } from '../../core/utils/formatters';
import { ScheduledModalComponent } from './components/scheduled-modal/scheduled-modal.component';

type Tab = 'scheduled' | 'auto';

const STATUS_META: Record<ScheduleStatus, { label: string; icon: string }> = {
  scheduled: { label: 'Scheduled', icon: 'phosphorCalendarBlank' },
  processing: { label: 'Processing', icon: 'phosphorHourglass' },
  completed: { label: 'Completed', icon: 'phosphorCheckCircle' },
  failed: { label: 'Failed', icon: 'phosphorWarningCircle' },
  cancelled: { label: 'Cancelled', icon: 'phosphorXCircle' },
  paused: { label: 'Paused', icon: 'phosphorPause' },
};

const FREQUENCY_LABELS: Record<string, string> = {
  'one-time': 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const FILTERS: { value: ScheduleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'paused', label: 'Paused' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

@Component({
  selector: 'app-scheduled-payments',
  imports: [NgIcon, ScheduledModalComponent],
  templateUrl: './scheduled-payments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      phosphorArrowsClockwise,
      phosphorBank,
      phosphorCalendarBlank,
      phosphorCheck,
      phosphorCheckCircle,
      phosphorClockAfternoon,
      phosphorCoins,
      phosphorDeviceMobile,
      phosphorHourglass,
      phosphorMoney,
      phosphorPaperPlaneTilt,
      phosphorPause,
      phosphorPencilSimple,
      phosphorPlay,
      phosphorPlus,
      phosphorProhibit,
      phosphorRepeat,
      phosphorTimer,
      phosphorTrash,
      phosphorTrendDown,
      phosphorWarningCircle,
      phosphorX,
      phosphorXCircle,
    }),
  ],
})
export class ScheduledPaymentsComponent {
  private scheduledApi = inject(ScheduledPaymentsApi);
  private autoApi = inject(AutoPaysApi);

  readonly tab = signal<Tab>('scheduled');
  readonly statusFilter = signal<ScheduleStatus | 'all'>('all');
  readonly items = signal<ScheduledPayment[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly modalOpen = signal(false);
  readonly editing = signal<ScheduledPayment | null>(null);
  readonly submitting = signal(false);
  readonly expandedId = signal<string | null>(null);
  readonly confirmId = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);

  readonly filters = FILTERS;

  readonly isAutoPay = computed(() => this.tab() === 'auto');

  readonly filtered = computed(() => {
    const filter = this.statusFilter();
    const list = this.items();
    return filter === 'all' ? list : list.filter((item) => item.status === filter);
  });

  readonly activeCount = computed(() => this.items().filter((i) => i.status === 'scheduled').length);
  readonly pausedCount = computed(() => this.items().filter((i) => i.status === 'paused').length);
  readonly failedCount = computed(() => this.items().filter((i) => i.status === 'failed').length);
  readonly nextRun = computed(() => {
    const upcoming = this.items()
      .filter((i) => i.nextRunAt && (i.status === 'scheduled' || i.status === 'failed'))
      .sort((a, b) => new Date(a.nextRunAt as string).getTime() - new Date(b.nextRunAt as string).getTime());
    return upcoming[0] ?? null;
  });

  private flashTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const tab = this.tab();
      void this.load(tab);
    });
  }

  private currentApi(): ScheduledPaymentsApi | AutoPaysApi {
    return this.tab() === 'auto' ? this.autoApi : this.scheduledApi;
  }

  private async load(tab: Tab): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const list =
        tab === 'auto'
          ? (await lastValueFrom(this.autoApi.list())).autoPays
          : (await lastValueFrom(this.scheduledApi.list())).scheduledPayments;
      if (this.tab() !== tab) return;
      this.items.set(list);
    } catch (err) {
      if (this.tab() === tab) this.error.set(extractApiError(err, 'Failed to load payments'));
    } finally {
      if (this.tab() === tab) this.loading.set(false);
    }
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
  }

  setFilter(value: ScheduleStatus | 'all'): void {
    this.statusFilter.set(value);
  }

  openCreate(): void {
    this.editing.set(null);
    this.modalOpen.set(true);
    this.error.set('');
  }

  openEdit(item: ScheduledPayment): void {
    this.editing.set(item);
    this.modalOpen.set(true);
    this.error.set('');
  }

  closeModal(): void {
    this.editing.set(null);
    this.modalOpen.set(false);
  }

  async handleSubmit(draft: ScheduledPaymentDraft): Promise<void> {
    const editing = this.editing();
    this.submitting.set(true);
    this.error.set('');
    try {
      const api = this.currentApi();
      if (editing) {
        await lastValueFrom(api.update(editing._id, draft));
        this.flash('Schedule updated');
      } else {
        await lastValueFrom(api.create(draft));
        this.flash(this.isAutoPay() ? 'Auto pay created' : 'Scheduled payment created');
      }
      this.closeModal();
      await this.load(this.tab());
    } catch (err) {
      this.error.set(extractApiError(err, editing ? 'Failed to update payment' : 'Failed to create payment'));
    } finally {
      this.submitting.set(false);
    }
  }

  private async runAction(
    item: ScheduledPayment,
    operation: Observable<ScheduledPayment>,
    message: string,
    options: { reloadOnError?: boolean; removeOnSuccess?: boolean } = {},
  ): Promise<void> {
    this.busyId.set(item._id);
    this.error.set('');
    try {
      const updated = await lastValueFrom(operation);
      if (options.removeOnSuccess) {
        this.items.update((prev) => prev.filter((entry) => entry._id !== item._id));
      } else {
        this.items.update((prev) => prev.map((entry) => (entry._id === updated._id ? updated : entry)));
      }
      this.confirmId.set(null);
      this.flash(message);
    } catch (err) {
      this.error.set(extractApiError(err, 'Something went wrong'));
      if (options.reloadOnError) await this.load(this.tab());
    } finally {
      this.busyId.set(null);
    }
  }

  pause(item: ScheduledPayment): void {
    void this.runAction(item, this.currentApi().pause(item._id), 'Payment paused');
  }

  resume(item: ScheduledPayment): void {
    void this.runAction(item, this.currentApi().resume(item._id), 'Payment resumed');
  }

  runNow(item: ScheduledPayment): void {
    void this.runAction(item, this.currentApi().run(item._id), 'Payment executed', { reloadOnError: true });
  }

  cancel(item: ScheduledPayment): void {
    if (this.confirmId() !== item._id) {
      this.confirmId.set(item._id);
      return;
    }
    void this.runAction(item, this.currentApi().cancel(item._id), 'Payment cancelled');
  }

  remove(item: ScheduledPayment): void {
    if (this.confirmId() !== item._id) {
      this.confirmId.set(item._id);
      return;
    }
    void this.runAction(item, this.currentApi().remove(item._id) as unknown as Observable<ScheduledPayment>, 'Payment deleted', {
      removeOnSuccess: true,
    });
  }

  toggleExpand(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  private flash(message: string): void {
    this.notice.set(message);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.notice.set(''), 3500);
  }

  statusMeta(item: ScheduledPayment): { label: string; icon: string } {
    return STATUS_META[item.status] ?? { label: item.status, icon: 'phosphorCalendarBlank' };
  }

  frequencyLabel(item: ScheduledPayment): string {
    return FREQUENCY_LABELS[item.frequency] ?? item.frequency;
  }

  paymentLabel(item: ScheduledPayment): string {
    if (item.paymentMethod === 'upi' && item.upiApp) return `UPI · ${item.upiApp}`;
    return item.paymentMethod === 'cash' ? 'Cash' : item.paymentMethod === 'upi' ? 'UPI' : 'Bank';
  }

  canEdit(item: ScheduledPayment): boolean {
    return ['scheduled', 'paused', 'failed'].includes(item.status);
  }

  canRun(item: ScheduledPayment): boolean {
    return ['scheduled', 'paused', 'failed'].includes(item.status);
  }

  canCancel(item: ScheduledPayment): boolean {
    return item.status !== 'completed' && item.status !== 'cancelled' && item.status !== 'processing';
  }

  isConfirming(id: string): boolean {
    return this.confirmId() === id;
  }

  isBusy(id: string): boolean {
    return this.busyId() === id;
  }

  categoryIcon(category: string): string {
    return getCategoryIcon(category);
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '—';
    return dateTimeFormatter.format(new Date(value));
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    return dateFormatter.format(new Date(value));
  }

  scheduleWindow(item: ScheduledPayment): string {
    const start = `${this.frequencyLabel(item)} · from ${this.formatDate(item.startDate)} at ${item.scheduledTime}`;
    if (item.endDate) return `${start} · until ${this.formatDate(item.endDate)}`;
    if (item.maxOccurrences) return `${start} · ${item.occurrenceCount}/${item.maxOccurrences} runs`;
    return start;
  }
}