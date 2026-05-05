import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private toast  = inject(ToastService);

  loading  = signal(false);
  showPass = signal(false);
  error    = signal('');
  accountType = signal<'patient' | 'provider'>('patient');

  toggleShowPass() { this.showPass.update(v => !v); }
  setType(t: 'patient' | 'provider') { this.accountType.set(t); }

  oauth(provider: 'google' | 'github') {
    window.location.href = this.auth.oauthLoginUrl(provider);
  }

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    this.auth.login({
      email:    this.form.value.email!,
      password: this.form.value.password!
    }).subscribe({
      next: () => {
        this.toast.success('Welcome back!', `Signed in successfully.`);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/providers';
        this.router.navigateByUrl(returnUrl);
      },
      error: err => {
        const msg = err.error?.message || 'Invalid email or password.';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
}
