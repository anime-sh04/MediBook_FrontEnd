import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { NotificationResponse } from '../../core/models/notification-review.models';
import { LoadingComponent } from '../../components/loading/loading.component';
import { interval, Subscription, startWith, switchMap } from 'rxjs';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notifService   = inject(NotificationService);
  private authService    = inject(AuthService);
  private toast          = inject(ToastService);

  loading        = signal(true);
  error          = signal('');
  notifications  = signal<NotificationResponse[]>([]);
  markingAllRead = signal(false);
  deletingId     = signal<string | null>(null);

  private pollSub?: Subscription;

  ngOnInit() {
    const userId = this.authService.user()?.id;
    if (!userId) return;

    this.load(userId);

    this.pollSub = interval(30_000).pipe(
      startWith(0),
      switchMap(() =>
        this.notifService.getUnreadCount(userId).pipe(catchError(() => of(null)))
      )
    ).subscribe();
  }

  load(userId: string) {
    this.loading.set(true);
    this.notifService.getByRecipient(userId, 1, 50).subscribe({
      next: n  => { this.notifications.set(n); this.loading.set(false); },
      error: () => { this.error.set('Failed to load notifications.'); this.loading.set(false); }
    });
  }

  markRead(n: NotificationResponse) {
    if (n.isRead) return;
    this.notifService.markAsRead(n.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(x => x.id === n.id ? { ...x, isRead: true } : x)
        );
      }
    });
  }

  markAllRead() {
    const userId = this.authService.user()?.id;
    if (!userId) return;
    this.markingAllRead.set(true);
    this.notifService.markAllRead(userId).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.markingAllRead.set(false);
        this.toast.success('All notifications marked as read');
      },
      error: () => { this.markingAllRead.set(false); }
    });
  }

  deleteNotif(n: NotificationResponse) {
    this.deletingId.set(n.id);
    this.notifService.delete(n.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.filter(x => x.id !== n.id)
        );
        this.deletingId.set(null);
      },
      error: () => { this.deletingId.set(null); }
    });
  }

  get unread(): number {
    return this.notifications().filter(n => !n.isRead).length;
  }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      BOOKING: '📅', PAYMENT: '💳', REMINDER: '⏰', SYSTEM: '⚙️', CANCELLATION: '❌', FOLLOWUP: '📞',
      Appointment: '📅', Payment: '💳', Reminder: '⏰', System: '⚙️'
    };
    return icons[type?.toUpperCase()] || icons[type] || '🔔';
  }

  typeClass(type: string): string {
    const classes: Record<string, string> = {
      BOOKING: 'type-appt', PAYMENT: 'type-pay', REMINDER: 'type-reminder', SYSTEM: 'type-sys', CANCELLATION: 'type-sys', FOLLOWUP: 'type-sys',
      Appointment: 'type-appt', Payment: 'type-pay', Reminder: 'type-reminder', System: 'type-sys'
    };
    return classes[type?.toUpperCase()] || classes[type] || '';
  }

  ngOnDestroy() { this.pollSub?.unsubscribe(); }
}
