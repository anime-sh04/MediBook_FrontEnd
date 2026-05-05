import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProviderService } from '../../services/provider.service';
import { ToastService } from '../../services/toast.service';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private providerService = inject(ProviderService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal(false);
  showPass = signal(false);
  error = signal('');
  accountType = signal<'patient' | 'provider'>('patient');
  providerStep = signal<1 | 2>(1);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d\s\-()]{8,20}$/)]],
    specialization: [''],
    medicalLicenseNumber: [''],
    qualification: [''],
    experienceYears: [0, [Validators.min(0)]],
    bio: [''],
    clinicName: [''],
    clinicAddress: [''],
    city: [''],
    state: [''],
    consultationFee: [500, [Validators.min(0)]]
  });

  toggleShowPass() { this.showPass.update(v => !v); }

  oauth(provider: 'google' | 'github') {
    window.location.href = this.auth.oauthLoginUrl(provider);
  }

  setType(t: 'patient' | 'provider') {
    this.accountType.set(t);
    this.providerStep.set(1);
    this.error.set('');
    this.applyProviderValidators();
  }

  nextProviderStep() {
    this.applyProviderValidators();
    const stepOne = ['fullName', 'email', 'password', 'phone', 'specialization', 'medicalLicenseNumber'];
    if (stepOne.some(name => this.form.get(name)?.invalid)) {
      stepOne.forEach(name => this.form.get(name)?.markAsTouched());
      return;
    }
    this.providerStep.set(2);
  }

  submit() {
    this.applyProviderValidators();
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    if (this.accountType() === 'provider') {
      this.submitProvider();
      return;
    }

    this.auth.register({
      fullName: this.form.value.fullName!,
      email: this.form.value.email!,
      password: this.form.value.password!,
      phone: this.form.value.phone!
    }).subscribe({
      next: () => {
        this.toast.success('Account created!', 'Please sign in to continue.');
        this.router.navigate(['/login']);
      },
      error: err => {
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private submitProvider() {
    this.auth.registerProvider({
      fullName: this.form.value.fullName!,
      email: this.form.value.email!,
      password: this.form.value.password!,
      phone: this.form.value.phone!,
      specialization: this.form.value.specialization!,
      medicalLicenseNumber: this.form.value.medicalLicenseNumber!
    }).subscribe({
      next: () => {
        this.auth.login({ email: this.form.value.email!, password: this.form.value.password! }).subscribe({
          next: () => this.registerProviderProfile(),
          error: err => {
            this.error.set(err.error?.message || 'Provider login failed after registration.');
            this.loading.set(false);
          }
        });
      },
      error: err => {
        this.error.set(err.error?.message || 'Provider account registration failed.');
        this.loading.set(false);
      }
    });
  }

  private registerProviderProfile() {
    this.providerService.registerProfile({
      specialization: this.form.value.specialization!,
      qualification: this.form.value.qualification || undefined,
      qualifications: this.form.value.qualification || undefined,
      experienceYears: Number(this.form.value.experienceYears ?? 0),
      bio: this.form.value.bio || undefined,
      clinicName: this.form.value.clinicName!,
      clinicAddress: this.form.value.clinicAddress!,
      address: this.form.value.clinicAddress!,
      city: this.form.value.city!,
      state: this.form.value.state!,
      consultationFee: Number(this.form.value.consultationFee),
      currency: 'INR'
    }).subscribe({
      next: () => this.router.navigate(['/provider-verification-pending']),
      error: err => {
        this.error.set(err.error?.message || 'Provider profile registration failed.');
        this.loading.set(false);
      }
    });
  }

  private applyProviderValidators() {
    const fields = ['specialization', 'medicalLicenseNumber', 'qualification', 'clinicName', 'clinicAddress', 'city', 'state', 'consultationFee'];
    fields.forEach(name => this.form.get(name)?.clearValidators());
    if (this.accountType() === 'provider') {
      fields.forEach(name => this.form.get(name)?.addValidators([Validators.required]));
      this.form.get('consultationFee')?.addValidators([Validators.min(0)]);
    }
    fields.forEach(name => this.form.get(name)?.updateValueAndValidity({ emitEvent: false }));
  }

  get fullName() { return this.form.get('fullName')!; }
  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get phone() { return this.form.get('phone')!; }
  get specialization() { return this.form.get('specialization')!; }
  get medicalLicenseNumber() { return this.form.get('medicalLicenseNumber')!; }
}
