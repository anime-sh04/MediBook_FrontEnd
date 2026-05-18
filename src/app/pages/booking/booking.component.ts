import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ScheduleService } from '../../services/schedule.service';
import { PaymentService } from '../../services/payment.service';
import { ProviderService } from '../../services/provider.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { NotificationService } from '../../services/notification.service';
import { LoadingComponent } from '../../components/loading/loading.component';

import { AvailabilitySlotDto } from '../../core/models/schedule.models';
import { ProviderProfileDto } from '../../core/models/provider.models';
import { PaymentDto } from '../../core/models/payment.models';

export type BookingStep =
  | 'loading'      // initial load
  | 'confirm'      // user reviews slot + picks payment method
  | 'booking'      // calling PUT /slots/{id}/book (202 PENDING)
  | 'polling'      // polling GET /payments/slot/{slotId}
  | 'paying'       // Razorpay modal is open
  | 'confirming'   // POST /payments/confirm in flight
  | 'success'      // booking confirmed
  | 'failed'       // payment failed / dismissed
  | 'error';       // unrecoverable error

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit, OnDestroy {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private scheduleService = inject(ScheduleService);
  private paymentService  = inject(PaymentService);
  private providerService = inject(ProviderService);
  private authService     = inject(AuthService);
  private toast           = inject(ToastService);
  private notificationService = inject(NotificationService);
  private fb              = inject(FormBuilder);

  step          = signal<BookingStep>('loading');
  statusMessage = signal('');
  errorMessage  = signal('');
  slot          = signal<AvailabilitySlotDto | null>(null);
  provider      = signal<ProviderProfileDto | null>(null);
  payment       = signal<PaymentDto | null>(null);
  correlationId = signal('');
  pollAttempt   = signal(0);

  bookingForm = this.fb.group({
    paymentMethod: ['Card', Validators.required],
    notes:         ['']
  });

  private pollSub?: Subscription;

  ngOnInit() {
    const slotId = parseInt(this.route.snapshot.paramMap.get('slotId') ?? '0');
    if (!slotId) { this.step.set('error'); this.errorMessage.set('Invalid slot.'); return; }

    this.scheduleService.getById(slotId).subscribe({
      next: slot => {
        this.slot.set(slot);
        if (slot.isBooked || slot.isBlocked) {
          this.step.set('error');
          this.errorMessage.set('This slot is no longer available.');
          return;
        }
        const currentUser = this.authService.user();
        if ((currentUser?.role ?? '').toUpperCase() === 'PROVIDER' && slot.providerId === currentUser?.providerId) {
          this.step.set('error');
          this.errorMessage.set('You cannot book your own slot');
          return;
        }
        this.loadProvider(slot.providerId);
        this.step.set('confirm');
      },
      error: () => {
        this.step.set('error');
        this.errorMessage.set('Slot not found.');
      }
    });
  }

  private loadProvider(providerId: string) {
    this.providerService.getById(providerId).subscribe({
      next: p => this.provider.set(p),
      error: () => {}
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SAGA STEP 1: PUT /slots/{id}/book → 202 Accepted + correlationId
  // ══════════════════════════════════════════════════════════════════════════
  confirmBooking() {
    if (this.bookingForm.invalid) { this.bookingForm.markAllAsTouched(); return; }

    const user   = this.authService.user();
    const slotId = this.slot()!.slotId;

    this.step.set('booking');
    this.statusMessage.set('Initiating booking...');

    this.scheduleService.bookSlot(slotId, {
      patientId:     user!.id,
      providerId: this.slot()!.providerId,
      mode: this.bookingForm.value.paymentMethod as 'Card' | 'UPI' | 'Cash',
      notes:         this.bookingForm.value.notes || undefined
    }).subscribe({
      next: bookResponse => {
        // 202 Accepted — Saga has started, payment record is being created async
        this.correlationId.set(bookResponse.correlationId);
        this.toast.info('Booking initiated', 'Waiting for payment to be ready...');
        this.startPolling(slotId);
      },
      error: err => {
        const msg = err.error?.message || 'Booking failed. Slot may no longer be available.';
        this.step.set('error');
        this.errorMessage.set(msg);
        this.toast.error('Booking failed', msg);
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SAGA STEP 2: Poll GET /payments/slot/{slotId} until razorpayOrderId exists
  // ══════════════════════════════════════════════════════════════════════════
  private startPolling(slotId: number) {
    this.step.set('polling');
    this.pollAttempt.set(0);
    this.statusMessage.set('Waiting for payment record to be created...');

    this.pollSub = this.paymentService.pollForPaymentRecord(slotId).subscribe({
      next: paymentDto => {
        this.payment.set(paymentDto);
        this.openRazorpay(paymentDto);
      },
      error: () => {
        this.step.set('failed');
        this.errorMessage.set('Payment record was not created in time. Please try again.');
        this.toast.error('Timeout', 'Payment setup timed out. Please try again.');
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SAGA STEP 3: Open Razorpay widget
  // ══════════════════════════════════════════════════════════════════════════
  private openRazorpay(paymentDto: PaymentDto) {
    this.step.set('paying');
    this.statusMessage.set('Complete your payment in the Razorpay window.');

    const user = this.authService.user();
    const prefill = {
      name:    user?.fullName,
      email:   user?.email,
      contact: user?.phone
    };

    this.paymentService.openRazorpayCheckout(paymentDto, prefill).then(
      // ★ SUCCESS: POST /payments/confirm
      (razorpayResponse) => this.confirmPayment(paymentDto, razorpayResponse),
      // ★ FAILURE / DISMISS: POST /payments/fail
      (reason) => this.handlePaymentFailure(paymentDto.paymentId, reason)
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SAGA STEP 4a (SUCCESS): POST /payments/confirm
  // ══════════════════════════════════════════════════════════════════════════
  private confirmPayment(
    paymentDto: PaymentDto,
    rzpResponse: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) {
    this.step.set('confirming');
    this.statusMessage.set('Verifying payment signature...');

    this.paymentService.confirm({
      paymentId:          paymentDto.paymentId,
      razorpayOrderId:    rzpResponse.razorpay_order_id,
      razorpayPaymentId:  rzpResponse.razorpay_payment_id,
      razorpaySignature:  rzpResponse.razorpay_signature,
      transactionId:      rzpResponse.razorpay_payment_id
    }).subscribe({
      next: () => {
        this.step.set('success');
        this.statusMessage.set('Payment confirmed! Your appointment is booked.');
        this.notifyProviderBooked();
        this.notifyPatientBooked();
        this.toast.success('Booking confirmed! 🎉', 'Your appointment has been scheduled.');
      },
      error: err => {
        const msg = err.error?.message || 'Payment confirmation failed.';
        this.step.set('failed');
        this.errorMessage.set(msg);
        this.toast.error('Confirmation failed', msg);
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SAGA STEP 4b (FAILURE): POST /payments/fail → slot rolls back
  // ══════════════════════════════════════════════════════════════════════════
  private handlePaymentFailure(paymentId: number, reason: { dismissed?: boolean }) {
    this.step.set('confirming');
    this.statusMessage.set('Cancelling payment and releasing slot...');

    const failRequest = {
      paymentId,
      reason: reason?.dismissed ? 'User dismissed payment modal' : 'Payment failed',
      razorpayOrderId: this.payment()?.razorpayOrderId
    };

    this.paymentService.fail(failRequest).subscribe({
      next: () => {
        this.step.set('failed');
        this.errorMessage.set(reason?.dismissed
          ? 'Payment was cancelled. The slot has been released.'
          : 'Payment failed. The slot has been released back to available.'
        );
        this.toast.warning('Payment cancelled', 'Slot released back to available.');
      },
      error: () => {
        this.step.set('failed');
        this.errorMessage.set('Payment was not completed.');
      }
    });
  }

  // private notifyProviderBooked() {
    // const providerId = this.slot()?.providerId;
  private notifyProviderBooked() {
    const providerUserId = this.provider()?.userId;
    if (!providerUserId) {
      console.error('Provider User ID not available for notification');
      return;
    }
    console.log('Fetching provider details for notification...', providerUserId);

    this.authService.getUserById(providerUserId).subscribe({
      next: (provider) => {
        console.log('Fetched provider details successfully:', provider);
        console.log('NOTIF PAYLOAD', {
          recipientId: provider.id,
          recipientEmail: provider.email,
          recipientName: provider.fullName,
          type: 'BOOKING',
          title: 'New Appointment Booked',
          message: 'A patient has booked an appointment with you',
          channel: 'EMAIL'
        });

        this.notificationService.send({
          recipientId: provider.id,
          recipientEmail: provider.email,
          recipientName: provider.fullName,
          type: 'BOOKING',
          title: 'New Appointment Booked',
          message: 'A patient has booked an appointment with you',
          channel: 'EMAIL'
        }).subscribe({
          next: () => console.log('Notification successfully sent via NotificationService'),
          error: (err) => console.error('Failed to send notification via NotificationService', err)
        });

      },
      error: (err) => {
        console.error('Failed to fetch provider details (getUserById) for notification', err);
      }
    });
  }

  private notifyPatientBooked() {
    const user = this.authService.user();
    if (!user) {
      console.error('Patient user details not available for notification');
      return;
    }

    const providerName = this.provider()?.fullName || 'the provider';

    console.log('Sending notification to patient...', user.id);
    this.notificationService.send({
      recipientId: user.id,
      recipientEmail: user.email,
      recipientName: user.fullName,
      type: 'BOOKING',
      title: 'Appointment Confirmed',
      message: `Your appointment with ${providerName} is confirmed.`,
      channel: 'EMAIL'
    }).subscribe({
      next: () => console.log('Patient notification successfully sent'),
      error: (err) => console.error('Failed to send patient notification via NotificationService', err)
    });
  }

  retryPayment() {
    const p = this.payment();
    if (p?.razorpayOrderId) {
      this.openRazorpay(p);
    } else {
      this.router.navigate(['/slots']);
    }
  }

  goToAppointments() {
    this.router.navigate(['/appointments']);
  }

  formatTime(t: string): string {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }
}
