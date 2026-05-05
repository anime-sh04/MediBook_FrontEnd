import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, filter, take, throwError, timeout, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PaymentDto, ProcessPaymentRequest, ProcessPaymentResponse,
  ConfirmPaymentRequest, ConfirmPaymentResponse,
  FailPaymentRequest, FailPaymentResponse,
  InvoiceDto, TotalRevenueDto,
  RazorpayOptions, RazorpaySuccessResponse
} from '../core/models/payment.models';

const BASE = `${environment.apiUrls.payment}/payments`;

// Declare Razorpay global loaded from CDN
declare const Razorpay: new (options: RazorpayOptions) => { open(): void };

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  // POST /payments/process
  process(request: ProcessPaymentRequest): Observable<ProcessPaymentResponse> {
    return this.http.post<ProcessPaymentResponse>(`${BASE}/process`, request);
  }

  // POST /payments/confirm  ★ SAGA SUCCESS PATH
  confirm(request: ConfirmPaymentRequest): Observable<ConfirmPaymentResponse> {
    return this.http.post<ConfirmPaymentResponse>(`${BASE}/confirm`, request);
  }

  // POST /payments/fail  ★ SAGA FAILURE / COMPENSATION PATH
  fail(request: FailPaymentRequest): Observable<FailPaymentResponse> {
    return this.http.post<FailPaymentResponse>(`${BASE}/fail`, request);
  }

  // GET /payments/slot/{slotId} — called after bookSlot to poll for Razorpay orderId
  getBySlot(slotId: number): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(`${BASE}/slot/${slotId}`);
  }

  // GET /payments/appointment/{appointmentId}
  getByAppointment(appointmentId: number): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(`${BASE}/appointment/${appointmentId}`);
  }

  // GET /payments/patient/{patientId}
  getByPatient(patientId: string): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(`${BASE}/patient/${patientId}`);
  }

  // GET /payments/history
  getHistory(): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(`${BASE}/history`);
  }

  // GET /payments/{paymentId}/status
  getStatus(paymentId: number): Observable<{ paymentId: number; status: string }> {
    return this.http.get<{ paymentId: number; status: string }>(`${BASE}/${paymentId}/status`);
  }

  // PUT /payments/{paymentId}/status (admin override)
  updateStatus(paymentId: number, status: string): Observable<PaymentDto> {
    return this.http.put<PaymentDto>(`${BASE}/${paymentId}/status`, { status });
  }

  // GET /payments/{paymentId}/invoice
  getInvoice(paymentId: number): Observable<InvoiceDto> {
    return this.http.get<InvoiceDto>(`${BASE}/${paymentId}/invoice`);
  }

  // GET /payments/revenue/{providerId}
  getRevenue(providerId: string): Observable<TotalRevenueDto> {
    return this.http.get<TotalRevenueDto>(`${BASE}/revenue/${providerId}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SAGA Polling — Poll GET /payments/slot/{slotId} until payment record
  //  is created by the PaymentRequestedConsumer background service.
  //  Emits the first PaymentDto where razorpayOrderId is non-null.
  // ══════════════════════════════════════════════════════════════════════════
  pollForPaymentRecord(slotId: number): Observable<PaymentDto> {
    const { paymentIntervalMs, paymentMaxAttempts } = environment.polling;
    return interval(paymentIntervalMs).pipe(
      switchMap(() => this.getBySlot(slotId)),
      filter(payment => !!payment && !!payment.razorpayOrderId),
      take(1),
      timeout(paymentIntervalMs * paymentMaxAttempts),
      catchError(err => throwError(() =>
        new Error('Payment record not created in time. Please try again.')
      ))
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Open Razorpay Checkout Widget
  //  Returns a Promise that resolves on success or rejects on dismiss/failure.
  // ══════════════════════════════════════════════════════════════════════════
  openRazorpayCheckout(
    payment: PaymentDto,
    prefill?: { name?: string; email?: string; contact?: string }
  ): Promise<RazorpaySuccessResponse> {
    return new Promise((resolve, reject) => {
      const options: RazorpayOptions = {
        key:         environment.razorpay.keyId,
        amount:      payment.amount * 100,   // Razorpay expects paise
        currency:    payment.currency || 'INR',
        name:        environment.razorpay.name,
        description: environment.razorpay.description,
        order_id:    payment.razorpayOrderId!,
        handler:     (response: RazorpaySuccessResponse) => resolve(response),
        prefill,
        theme:       environment.razorpay.theme,
        modal: {
          ondismiss: () =>
            reject({ dismissed: true, paymentId: payment.paymentId })
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    });
  }
}
