import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  NotificationResponse, SendNotificationRequest,
  SendBulkRequest, SendEmailRequest,
  BulkSendResponse, UnreadCountResponse, ApiSuccessResponse
} from '../core/models/notification-review.models';

const BASE = `${environment.apiUrls.notification}/notifications`;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _unreadCount = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this._unreadCount.asObservable();

  constructor(private http: HttpClient) {}

  // POST /notifications/send
  send(request: SendNotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(`${BASE}/send`, request);
  }

  // POST /notifications/bulk (admin)
  sendBulk(request: SendBulkRequest): Observable<BulkSendResponse> {
    return this.http.post<BulkSendResponse>(`${BASE}/bulk`, request);
  }

  // POST /notifications/email
  sendEmail(request: SendEmailRequest): Observable<ApiSuccessResponse> {
    return this.http.post<ApiSuccessResponse>(`${BASE}/email`, request);
  }

  // GET /notifications/recipient/{recipientId}?page=&pageSize=
  getByRecipient(
    recipientId: string,
    page = 1,
    pageSize = 20
  ): Observable<NotificationResponse[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<NotificationResponse[]>(`${BASE}/recipient/${recipientId}`, { params });
  }

  // GET /notifications/unread/{recipientId}
  getUnreadCount(recipientId: string): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${BASE}/unread/${recipientId}`).pipe(
      tap(res => this._unreadCount.next(res.unreadCount))
    );
  }

  // GET /notifications/all (admin)
  getAll(page = 1, pageSize = 50): Observable<NotificationResponse[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<NotificationResponse[]>(`${BASE}/all`, { params });
  }

  // PUT /notifications/{id}/read
  markAsRead(id: string): Observable<ApiSuccessResponse> {
    return this.http.put<ApiSuccessResponse>(`${BASE}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this._unreadCount.getValue();
        if (current > 0) this._unreadCount.next(current - 1);
      })
    );
  }

  // PUT /notifications/recipient/{recipientId}/read-all
  markAllRead(recipientId: string): Observable<ApiSuccessResponse> {
    return this.http.put<ApiSuccessResponse>(`${BASE}/recipient/${recipientId}/read-all`, {}).pipe(
      tap(() => this._unreadCount.next(0))
    );
  }

  // DELETE /notifications/{id}
  delete(id: string): Observable<ApiSuccessResponse> {
    return this.http.delete<ApiSuccessResponse>(`${BASE}/${id}`);
  }
}
