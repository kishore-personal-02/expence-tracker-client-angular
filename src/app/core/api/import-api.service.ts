import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ConfirmPayload,
  ConfirmResponse,
  ParseResponse,
} from '../models/import.model';
import { API_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ImportApi {
  private http = inject(HttpClient);

  parse(file: File): Observable<ParseResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ParseResponse>(`${API_URL}/import/parse`, formData);
  }

  confirm(payload: ConfirmPayload): Observable<ConfirmResponse> {
    return this.http.post<ConfirmResponse>(`${API_URL}/import/confirm`, payload);
  }
}