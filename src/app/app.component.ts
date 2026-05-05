import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-toast></app-toast>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 64px);
    }
  `]
})
export class AppComponent implements OnInit {
  private authService  = inject(AuthService);
  private notifService = inject(NotificationService);

  ngOnInit() {
    // On app start, refresh user data and unread count if logged in
    if (this.authService.isLoggedIn()) {
      const userId = this.authService.user()?.id;

      // Refresh profile silently
      this.authService.getMe().subscribe({ error: () => {} });

      // Load unread notification count
      if (userId) {
        this.notifService.getUnreadCount(userId).subscribe({ error: () => {} });
      }
    }
  }
}
