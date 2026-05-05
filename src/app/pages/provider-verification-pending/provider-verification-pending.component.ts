import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-provider-verification-pending',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="container">
        <div class="empty-state">
          <div class="empty-icon">⏳</div>
          <h1>Wait for admin verification</h1>
          <p>Your provider profile was submitted and is pending admin verification.</p>
          <a routerLink="/login" class="btn btn-primary">Go to Sign In</a>
        </div>
      </div>
    </div>
  `
})
export class ProviderVerificationPendingComponent {}
