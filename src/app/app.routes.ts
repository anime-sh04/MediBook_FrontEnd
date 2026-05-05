import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'providers', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/oauth-success',
    loadComponent: () =>
      import('./components/auth/oauth-success/oauth-success.component')
        .then(m => m.OAuthSuccessComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'provider-verification-pending',
    loadComponent: () => import('./pages/provider-verification-pending/provider-verification-pending.component').then(m => m.ProviderVerificationPendingComponent)
  },

  {
    path: 'providers',
    loadComponent: () => import('./pages/providers/providers.component').then(m => m.ProvidersComponent)
  },
  {
    path: 'providers/:id',
    loadComponent: () => import('./pages/provider-detail/provider-detail.component').then(m => m.ProviderDetailComponent)
  },
  {
    path: 'providers/:id/slots',
    loadComponent: () => import('./pages/slots/slots.component').then(m => m.SlotsComponent)
  },
  {
    path: 'slots',
    canActivate: [roleGuard],
    data: { roles: ['PROVIDER', 'ADMIN'] },
    loadComponent: () => import('./pages/slots/slots.component').then(m => m.SlotsComponent)
  },
  {
    path: 'booking/:slotId',
    canActivate: [roleGuard],
    data: { roles: ['PATIENT', 'ADMIN'] },
    loadComponent: () => import('./pages/booking/booking.component').then(m => m.BookingComponent)
  },
  {
    path: 'appointments',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/appointments/appointments.component').then(m => m.AppointmentsComponent)
  },
  {
    path: 'appointments/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/appointment-detail/appointment-detail.component').then(m => m.AppointmentDetailComponent)
  },
  {
    path: 'notifications',
    canActivate: [roleGuard],
    data: { roles: ['PATIENT', 'PROVIDER', 'ADMIN'] },
    loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent)
  },
  {
    path: 'reviews',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reviews/reviews.component').then(m => m.ReviewsComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'admin/providers',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./pages/admin-providers/admin-providers.component').then(m => m.AdminProvidersComponent)
  },

  { path: '**', redirectTo: 'providers' }
];
