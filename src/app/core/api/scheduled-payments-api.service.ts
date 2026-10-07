import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { MessageResponse } from '../models/auth.model';
import type {
  AutoPaysResponse,
  ScheduledPayment,
  ScheduledPaymentDraft,
  ScheduledPaymentsResponse,
} from '../models/scheduled-payment.model';
import { API_URL } from './api.config';

abstract class ScheduleApi {
  protected abstract readonly basePath: string;
  protected abstract readonly listKey: 'scheduledPayments' | 'autoPays';

  protected http = inject(HttpClient);

  list(): Observable<ScheduledPaymentsResponse | AutoPaysResponse> {
    return this.http.get<ScheduledPaymentsResponse | AutoPaysResponse>(`${API_URL}${this.basePath}`);
  }

  get(id: string): Observable<ScheduledPayment> {
    return this.http.get<ScheduledPayment>(`${API_URL}${this.basePath}/${id}`);
  }

  create(draft: ScheduledPaymentDraft): Observable<ScheduledPayment> {
    return this.http.post<ScheduledPayment>(`${API_URL}${this.basePath}`, draft);
  }

  update(id: string, draft: ScheduledPaymentDraft): Observable<ScheduledPayment> {
    return this.http.put<ScheduledPayment>(`${API_URL}${this.basePath}/${id}`, draft);
  }

  pause(id: string): Observable<ScheduledPayment> {
    return this.http.post<ScheduledPayment>(`${API_URL}${this.basePath}/${id}/pause`, {});
  }

  resume(id: string): Observable<ScheduledPayment> {
    return this.http.post<ScheduledPayment>(`${API_URL}${this.basePath}/${id}/resume`, {});
  }

  cancel(id: string): Observable<ScheduledPayment> {
    return this.http.post<ScheduledPayment>(`${API_URL}${this.basePath}/${id}/cancel`, {});
  }

  run(id: string): Observable<ScheduledPayment> {
    return this.http.post<ScheduledPayment>(`${API_URL}${this.basePath}/${id}/run`, {});
  }

  remove(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${API_URL}${this.basePath}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ScheduledPaymentsApi extends ScheduleApi {
  protected override readonly basePath = '/scheduled-payments';
  protected override readonly listKey = 'scheduledPayments';

  override list(): Observable<ScheduledPaymentsResponse> {
    return this.http.get<ScheduledPaymentsResponse>(`${API_URL}${this.basePath}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AutoPaysApi extends ScheduleApi {
  protected override readonly basePath = '/auto-pays';
  protected override readonly listKey = 'autoPays';

  override list(): Observable<AutoPaysResponse> {
    return this.http.get<AutoPaysResponse>(`${API_URL}${this.basePath}`);
  }
}
