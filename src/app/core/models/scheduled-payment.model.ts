import type { ExpenseType, PaymentMethod } from './expense.model';

export type ScheduleFrequency = 'one-time' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ScheduleStatus = 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';

export type ScheduleExecutionStatus = 'processing' | 'completed' | 'failed';

export interface ScheduleExecution {
  occurrenceAt: string;
  executedAt?: string | null;
  status: ScheduleExecutionStatus;
  expense?: string | null;
  error?: string | null;
  createdAt?: string;
}

export interface ScheduledPayment {
  _id: string;
  user: string;
  payee: string;
  description: string;
  amount: number;
  type: ExpenseType;
  category: string;
  paymentMethod: PaymentMethod;
  upiApp?: string | null;
  bankName?: string | null;
  frequency: ScheduleFrequency;
  startDate: string;
  scheduledTime: string;
  endDate?: string | null;
  maxOccurrences?: number | null;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  status: ScheduleStatus;
  isAutoPay: boolean;
  occurrenceCount: number;
  failureCount: number;
  lastExecutionStatus?: 'completed' | 'failed' | null;
  failureReason?: string | null;
  executions: ScheduleExecution[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledPaymentDraft {
  payee: string;
  description: string;
  amount: number;
  type: ExpenseType;
  category: string;
  paymentMethod: PaymentMethod;
  upiApp?: string;
  bankName?: string;
  frequency: ScheduleFrequency;
  /** `YYYY-MM-DD` */
  startDate: string;
  /** `HH:MM` 24h */
  time: string;
  /** `YYYY-MM-DD`, recurring schedules only */
  endDate?: string;
  maxOccurrences?: number;
  status?: 'scheduled' | 'paused';
}

export interface ScheduledPaymentsResponse {
  scheduledPayments: ScheduledPayment[];
}

export interface AutoPaysResponse {
  autoPays: ScheduledPayment[];
}
