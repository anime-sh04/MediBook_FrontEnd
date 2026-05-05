import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-oauth-success',
  standalone: true,
  imports: [CommonModule],
  template: `<p>Logging you in...</p>`
})
export class OAuthSuccessComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      this.authService.saveTokens(accessToken, refreshToken);
      window.location.href = '/providers';
    } else {
      this.router.navigate(['/login']);
    }
  }
}