import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AvailabilitySlotDto, AddSlotRequest, AddBulkSlotsRequest,
  GenerateRecurringRequest, UpdateSlotRequest,
  BookSlotRequest, BookSlotResponse
} from '../core/models/schedule.models';

const BASE = `${environment.apiUrls.schedule}/slots`;

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  constructor(private http: HttpClient) {}

  // POST /slots — add single slot
  addSlot(request: AddSlotRequest): Observable<AvailabilitySlotDto> {
    return this.http.post<AvailabilitySlotDto>(BASE, request);
  }

  // POST /slots/bulk
  addBulk(request: AddBulkSlotsRequest): Observable<AvailabilitySlotDto[]> {
    return this.http.post<AvailabilitySlotDto[]>(`${BASE}/bulk`, request);
  }

  // POST /slots/generate-recurring
  generateRecurring(request: GenerateRecurringRequest): Observable<AvailabilitySlotDto[]> {
    return this.http.post<AvailabilitySlotDto[]>(`${BASE}/generate-recurring`, request);
  }

  // GET /slots/provider/{providerId}
  getByProvider(providerId: string): Observable<AvailabilitySlotDto[]> {
    return this.http.get<AvailabilitySlotDto[]>(`${BASE}/provider/${providerId}`);
  }

  // GET /slots/available?providerId=&date=
  getAvailable(providerId: string, date: string): Observable<AvailabilitySlotDto[]> {
    const params = new HttpParams()
      .set('providerId', providerId)
      .set('date', date);
    return this.http.get<AvailabilitySlotDto[]>(`${BASE}/available`, { params });
  }

  // GET /slots/{id}
  getById(id: number): Observable<AvailabilitySlotDto> {
    return this.http.get<AvailabilitySlotDto>(`${BASE}/${id}`);
  }

  // PUT /slots/{id}
  updateSlot(id: number, request: UpdateSlotRequest): Observable<AvailabilitySlotDto> {
    return this.http.put<AvailabilitySlotDto>(`${BASE}/${id}`, request);
  }

  // POST /slots/{id}/block
  blockSlot(id: number): Observable<void> {
    return this.http.put<void>(`${BASE}/${id}/block`, {});
  }

  // POST /slots/{id}/unblock
  unblockSlot(id: number): Observable<void> {
    return this.http.put<void>(`${BASE}/${id}/unblock`, {});
  }

  // ★ SAGA ENTRY POINT — PUT /slots/{id}/book
  // Returns 202 Accepted with correlationId + PENDING status
  bookSlot(id: number, request: BookSlotRequest): Observable<BookSlotResponse> {
    return this.http.put<BookSlotResponse>(`${BASE}/${id}/book`, request);
  }

  // PUT /slots/{id}/unbook
  unbookSlot(id: number): Observable<void> {
    return this.http.put<void>(`${BASE}/${id}/unbook`, {});
  }

  // DELETE /slots/{id}
  deleteSlot(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
