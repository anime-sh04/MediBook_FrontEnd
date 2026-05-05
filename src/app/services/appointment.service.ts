import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AppointmentDto, RescheduleRequest,
  UpdateStatusRequest, AppointmentCountDto
} from '../core/models/appointment.models';

const BASE = `${environment.apiUrls.appointment}/appointments`;

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private http: HttpClient) {}

  // GET /appointments/{id}
  getById(id: number): Observable<AppointmentDto> {
    return this.http.get<AppointmentDto>(`${BASE}/${id}`);
  }

  // GET /appointments/patient/{patientId}
  getByPatient(patientId: string): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${BASE}/patient/${patientId}`);
  }

  // GET /appointments/provider/{providerId}
  getByProvider(providerId: string): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${BASE}/provider/${providerId}`);
  }

  getMyProviderId() {
  return this.http.get<any>('https://medibook-provider-bnf5eze6h2eza2at.centralindia-01.azurewebsites.net/api/v1/providers/me')
    .pipe(map(p => p.providerId));
  }

  // getMyProviderId() {
  //   return this.http
  //     .get<any>(`${environment.apiUrls.provider}/provider/me`)
  //     .pipe(map(p => p.providerId));
  // }

  // GET /appointments/provider/{providerId}/date/{date}
  getByProviderAndDate(providerId: string, date: string): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${BASE}/provider/${providerId}/date/${date}`);
  }

  // GET /appointments/patient/{patientId}/upcoming
  getUpcoming(patientId: string): Observable<AppointmentDto[]> {
    return this.http.get<AppointmentDto[]>(`${BASE}/patient/${patientId}/upcoming`);
  }

  // PUT /appointments/{id}/cancel
  cancel(id: number): Observable<void> {
    return this.http.put<void>(`${BASE}/${id}/cancel`, {});
  }

  // PUT /appointments/{id}/reschedule
  reschedule(id: number, request: RescheduleRequest): Observable<AppointmentDto> {
    return this.http.put<AppointmentDto>(`${BASE}/${id}/reschedule`, request);
  }

  // POST /appointments/{id}/complete
  complete(id: number): Observable<void> {
    return this.http.put<void>(`${BASE}/${id}/complete`, {});
  }

  // PUT /appointments/{id}/status
  updateStatus(id: number, status: string): Observable<{ status: string }> {
    return this.http.put<{ status: string }>(`${BASE}/${id}/status`, { status } as UpdateStatusRequest);
  }

  // GET /appointments/provider/{providerId}/count
  getCount(providerId: string): Observable<AppointmentCountDto> {
    return this.http.get<AppointmentCountDto>(`${BASE}/provider/${providerId}/count`);
  }
}
