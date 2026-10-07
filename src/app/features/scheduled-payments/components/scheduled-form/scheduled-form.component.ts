import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type {
  ScheduleFrequency,
  ScheduledPayment,
  ScheduledPaymentDraft,
} from '../../../../core/models/scheduled-payment.model';
import { PreferencesStore } from '../../../../core/stores/preferences.store';
import { getCategoryIcon } from '../../../../core/utils/expense-icons';

const FREQUENCIES: { value: ScheduleFrequency; label: string }[] = [
  { value: 'one-time', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toInputDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const date = new Date(dateStr);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

@Component({
  selector: 'app-scheduled-form',
  imports: [NgIcon],
  templateUrl: './scheduled-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledFormComponent implements OnInit {
  private prefs = inject(PreferencesStore);

  readonly initialPayment = input<ScheduledPayment | null>(null);
  readonly isAutoPay = input(false);
  readonly submitting = input(false);
  readonly submitted = output<ScheduledPaymentDraft>();

  readonly type = signal<'expense' | 'income'>('expense');
  readonly payee = signal('');
  readonly description = signal('');
  readonly amount = signal('');
  readonly category = signal('');
  readonly paymentMethod = signal<'cash' | 'upi' | 'bank'>('cash');
  readonly upiApp = signal('');
  readonly frequency = signal<ScheduleFrequency>('one-time');
  readonly startDate = signal('');
  readonly time = signal('09:00');
  readonly endDate = signal('');
  readonly maxOccurrences = signal('');
  readonly paused = signal(false);
  readonly error = signal('');

  readonly frequencies = FREQUENCIES;
  readonly quickAmounts = QUICK_AMOUNTS;

  readonly isIncome = computed(() => this.type() === 'income');
  readonly isRecurring = computed(() => this.frequency() !== 'one-time');
  readonly invalid = computed(() => Boolean(this.error()));
  readonly categories = computed(() => this.prefs.prefs().categories);
  readonly upiApps = computed(() => this.prefs.prefs().upiApps);

  ngOnInit(): void {
    const initial = this.initialPayment();
    this.type.set(initial?.type ?? 'expense');
    this.payee.set(initial?.payee ?? '');
    this.description.set(initial?.description ?? '');
    this.amount.set(initial ? String(initial.amount) : '');
    this.category.set(initial?.category ?? this.categories()[0] ?? 'Food');
    this.paymentMethod.set(initial?.paymentMethod ?? 'cash');
    this.upiApp.set(initial?.upiApp ?? this.upiApps()[0] ?? 'GPay');
    this.frequency.set(initial?.frequency ?? 'one-time');
    this.startDate.set(toInputDate(initial?.startDate));
    this.time.set(initial?.scheduledTime ?? '09:00');
    this.endDate.set(initial?.endDate ? toInputDate(initial.endDate) : '');
    this.maxOccurrences.set(initial?.maxOccurrences != null ? String(initial.maxOccurrences) : '');
    this.paused.set(initial?.status === 'paused');
  }

  getCategoryIcon(category: string): string {
    return getCategoryIcon(category);
  }

  isQuickAmountActive(amt: number): boolean {
    return Number(this.amount()) === amt;
  }

  quickPick(amt: number): void {
    this.amount.set(String(amt));
  }

  setFrequency(value: string): void {
    this.frequency.set(value as ScheduleFrequency);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.error.set('');

    if (!this.payee().trim()) {
      this.error.set('Add who this payment is for');
      return;
    }
    if (!this.description().trim()) {
      this.error.set('Add a short description');
      return;
    }
    if (!this.amount() || Number(this.amount()) <= 0) {
      this.error.set('Amount must be greater than zero');
      return;
    }
    if (!this.startDate()) {
      this.error.set('Pick a start date');
      return;
    }
    if (!TIME_PATTERN.test(this.time())) {
      this.error.set('Time must be a valid HH:MM value');
      return;
    }
    if (this.isRecurring() && this.endDate() && this.endDate() < this.startDate()) {
      this.error.set('End date cannot be before the start date');
      return;
    }
    if (this.isRecurring() && this.maxOccurrences()) {
      const max = Number(this.maxOccurrences());
      if (!Number.isInteger(max) || max < 1) {
        this.error.set('Maximum occurrences must be a whole number of at least 1');
        return;
      }
    }

    const isIncome = this.isIncome();
    const draft: ScheduledPaymentDraft = {
      payee: this.payee().trim(),
      description: this.description().trim(),
      amount: Number(this.amount()),
      type: this.type(),
      category: isIncome ? 'Income' : this.category(),
      paymentMethod: isIncome ? 'bank' : this.paymentMethod(),
      frequency: this.frequency(),
      startDate: this.startDate(),
      time: this.time(),
      status: this.paused() ? 'paused' : 'scheduled',
      ...(!isIncome && this.paymentMethod() === 'upi' ? { upiApp: this.upiApp() } : {}),
      ...(this.isRecurring() && this.endDate() ? { endDate: this.endDate() } : {}),
      ...(this.isRecurring() && this.maxOccurrences()
        ? { maxOccurrences: Number(this.maxOccurrences()) }
        : {}),
    };

    this.submitted.emit(draft);
  }
}