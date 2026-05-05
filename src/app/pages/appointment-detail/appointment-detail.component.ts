import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentService } from '../../services/appointment.service';
import { PaymentService } from '../../services/payment.service';
import { AppointmentDto } from '../../core/models/appointment.models';
import { PaymentDto, InvoiceDto } from '../../core/models/payment.models';
import { LoadingComponent } from '../../components/loading/loading.component';
import { AuthService } from '@services/auth.service';
import { ProviderService } from '@services/provider.service';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent],
  templateUrl: './appointment-detail.component.html',
  styleUrls: ['./appointment-detail.component.scss']
})
export class AppointmentDetailComponent implements OnInit {
  private route              = inject(ActivatedRoute);
  private appointmentService = inject(AppointmentService);
  private paymentService     = inject(PaymentService);
  private providerService = inject(ProviderService);
  private authService = inject(AuthService);

  loading     = signal(true);
  error       = signal('');
  appointment = signal<AppointmentDto | null>(null);
  payment     = signal<PaymentDto | null>(null);
  invoice     = signal<InvoiceDto | null>(null);

  ngOnInit() {
    const id = parseInt(this.route.snapshot.paramMap.get('id') ?? '0');
  
    this.appointmentService.getById(id).subscribe({
      next: appt => {
      
        // 🔥 Step 1: get provider + payment in parallel
        forkJoin({
          provider: this.providerService.getById(appt.providerId),
          payment: this.paymentService.getByAppointment(id).pipe(
            catchError(() => of(null))
          )
        }).subscribe(({ provider, payment }) => {
        
          // 🔥 Step 2: get provider name using userId
          this.authService.getUserById(provider.userId).subscribe(user => {
          
            // 🔥 Step 3: set enriched appointment
            this.appointment.set({
              ...appt,
              providerName: user.fullName,
              clinicName: provider.clinicName
            });
          
            this.payment.set(payment);
          
            // 🔥 Step 4: invoice logic
            if (payment?.status === 'Paid') {
              this.paymentService.getInvoice(payment.paymentId)
                .pipe(catchError(() => of(null)))
                .subscribe(inv => {
                  this.invoice.set(inv);
                  this.loading.set(false);
                });
            } else {
              this.loading.set(false);
            }
          
          });
        
        });
      
      },
      error: () => {
        this.error.set('Appointment not found.');
        this.loading.set(false);
      }
    });
  }

  formatTime(t: string): string {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  statusClass(s: string) {
    const map: Record<string,string> = {
      Scheduled: 'badge-primary', Completed: 'badge-success',
      Cancelled: 'badge-danger',  'No-Show': 'badge-secondary',
      Paid: 'badge-success', Failed: 'badge-danger', Pending: 'badge-pending'
    };
    return map[s] ?? 'badge-secondary';
  }
}
