import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  readonly notifService = inject(NotificationService);
  readonly router = inject(Router);

  menuOpen = signal(false);
  profileOpen = signal(false);
  role = computed(() => (this.authService.user()?.role ?? 'GUEST').toUpperCase());

  isPatient = computed(() => this.role() === 'PATIENT');
  isProvider = computed(() => this.role() === 'PROVIDER');
  isAdmin = computed(() => this.role() === 'ADMIN');

  toggleMenu() { this.menuOpen.update(v => !v); }
  toggleProfile() { this.profileOpen.update(v => !v); }
  closeAll() { this.menuOpen.set(false); this.profileOpen.set(false); }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearTokens();
        this.router.navigate(['/login']);
      }
    });
  }

}
