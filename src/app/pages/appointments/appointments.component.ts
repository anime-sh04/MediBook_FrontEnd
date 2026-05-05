import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { AppointmentDto } from '../../core/models/appointment.models';
import { LoadingComponent } from '../../components/loading/loading.component';
import { ProviderService } from '../../services/provider.service';
import { forkJoin } from 'rxjs';
// import { effect } from '@angular/core';

type Tab = 'upcoming' | 'history';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent {
  private appointmentService = inject(AppointmentService);
  authService                = inject(AuthService);
  private notificationService = inject(NotificationService);
  private toast              = inject(ToastService);
  private providerService     = inject(ProviderService);

  loading      = signal(true);
  error        = signal('');
  all          = signal<AppointmentDto[]>([]);
  activeTab    = signal<Tab>('upcoming');
  cancellingId = signal<number | null>(null);
  completingId = signal<number | null>(null);

  private lastUserId: string | null = null;

  private _initEffect = effect(() => {
    const user = this.authService.user();

    if (!user || !user.id) return;

    // ✅ prevent duplicate calls properly
    if (this.lastUserId === user.id) return;

    this.lastUserId = user.id;

    const role = (user.role ?? '').toUpperCase();

    console.log("User ready:", user);

    if (role === 'PROVIDER') {
      this.loadProviderAppointments();
    } else {
      this.loadPatientAppointments(user.id);
    }
  });


  loadProviderAppointments() {
    this.appointmentService.getMyProviderId().subscribe({
      next: (providerId) => {

        forkJoin({
          appts: this.appointmentService.getByProvider(providerId),
          provider: this.providerService.getById(providerId)
        }).subscribe(({ appts, provider }) => {

          this.all.set(
            appts.map(a => ({
              ...a,
              consultationFee: provider.consultationFee
            }))
          );

          this.loading.set(false);
        });

      }
    });
  }

  loadPatientAppointments(userId: string) {
    this.appointmentService.getByPatient(userId).subscribe(appts => {
    
      const calls = appts.map(a =>
        this.providerService.getById(a.providerId)
      );
    
      forkJoin(calls).subscribe(providers => {
      
        this.all.set(
          appts.map((a, i) => ({
            ...a,
            consultationFee: providers[i].consultationFee
          }))
        );
      
        this.loading.set(false);
      });
    });
  }

  setTab(t: Tab) { this.activeTab.set(t); }

  get upcoming() {
    const now = new Date().toISOString().split('T')[0];
    return this.all().filter(a =>
      a.appointmentDate >= now && a.status !== 'Cancelled' && a.status !== 'Completed'
    ).sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
  }

  get history() {
    const now = new Date().toISOString().split('T')[0];
    return this.all().filter(a =>
      a.status === 'Cancelled' || a.status === 'Completed' 
    ).sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));
  }

  isProvider(): boolean { return (this.authService.user()?.role ?? '').toUpperCase() === 'PROVIDER'; }

  displayPerson(a: AppointmentDto): string {
    return this.isProvider() ? (a.patientName || a.patientId) : (a.providerName || 'Provider');
  }

  complete(a: AppointmentDto) {
    this.completingId.set(a.appointmentId);
    this.appointmentService.complete(a.appointmentId).subscribe({
      next: () => {
        this.all.update(list => list.map(item =>
          item.appointmentId === a.appointmentId ? { ...item, status: 'Completed' as const } : item
        ));
        this.notificationService.send({
          recipientId: a.patientId,
          type: 'APPOINTMENT',
          title: 'Appointment Completed',
          message: 'Your appointment has been completed. You can leave a review.',
          channel: 'EMAIL'
        }).subscribe({ error: () => {} });
        this.toast.success('Appointment completed');
        this.completingId.set(null);
      },
      error: err => {
        this.toast.error('Complete failed', err.error?.message || 'Could not complete appointment.');
        this.completingId.set(null);
      }
    });
  }

  cancel(id: number) {
    if (!confirm('Cancel this appointment?')) return;
    this.cancellingId.set(id);
    this.appointmentService.cancel(id).subscribe({
      next: () => {
        this.all.update(list => list.map(a =>
          a.appointmentId === id ? { ...a, status: 'Cancelled' as const } : a
        ));
        this.toast.success('Appointment cancelled');
        this.cancellingId.set(null);
      },
      error: err => {
        this.toast.error('Cancel failed', err.error?.message || 'Could not cancel.');
        this.cancellingId.set(null);
      }
    });
  }

  statusClass(status: string): string {
    const map: Record<string,string> = {
      Scheduled: 'badge-primary', Completed: 'badge-success',
      Cancelled: 'badge-danger',  'No-Show': 'badge-secondary'
    };
    return map[status] ?? 'badge-secondary';
  }

  formatTime(t: string): string {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  }
}
