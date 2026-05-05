import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProviderService } from '../../services/provider.service';
import { ProviderProfileDto } from '../../core/models/provider.models';
import { ToastService } from '../../services/toast.service';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  authService     = inject(AuthService);
  private providerService = inject(ProviderService);
  private toast   = inject(ToastService);
  private fb      = inject(FormBuilder);

  savingProfile   = signal(false);
  savingPassword  = signal(false);
  savingAvailability = signal(false);
  profileError    = signal('');
  passwordError   = signal('');
  providerProfile = signal<ProviderProfileDto | null>(null);
  showCurrentPass = signal(false);
  showNewPass     = signal(false);

  toggleCurrentPass() { this.showCurrentPass.update(v => !v); }
  toggleNewPass()     { this.showNewPass.update(v => !v); }

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone:    ['']
  });

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword:     ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.profileForm.patchValue({
        fullName: user.fullName,
        phone:    user.phone
      });

      if ((user.role ?? '').toUpperCase() === 'PROVIDER') {
        this.providerService.getMyProfile().subscribe({
          next: profile => this.providerProfile.set(profile),
          error: () => this.providerProfile.set(null)
        });
      }
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.savingProfile.set(true);
    this.profileError.set('');

    this.authService.updateProfile({
      fullName: this.profileForm.value.fullName!,
      phone:    this.profileForm.value.phone    || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Profile updated!');
        this.savingProfile.set(false);
      },
      error: err => {
        this.profileError.set(err.error?.message || 'Failed to update profile.');
        this.savingProfile.set(false);
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPassword.set(true);
    this.passwordError.set('');

    this.authService.changePassword({
      currentPassword: this.passwordForm.value.currentPassword!,
      newPassword:     this.passwordForm.value.newPassword!
    }).subscribe({
      next: () => {
        this.toast.success('Password changed!');
        this.passwordForm.reset();
        this.savingPassword.set(false);
      },
      error: err => {
        this.passwordError.set(err.error?.message || 'Failed to change password.');
        this.savingPassword.set(false);
      }
    });
  }

  toggleAvailability(event: Event) {
    const input = event.target as HTMLInputElement;
    const provider = this.providerProfile();
    if (!provider) return;

    const previous = provider.isAvailable;
    const next = input.checked;
    this.providerProfile.set({ ...provider, isAvailable: next });
    this.savingAvailability.set(true);

    this.providerService.setAvailability(provider.providerId, next).subscribe({
      next: updated => {
        this.providerProfile.set(updated);
        this.toast.success('Availability updated.');
        this.savingAvailability.set(false);
      },
      error: err => {
        this.providerProfile.set({ ...provider, isAvailable: previous });
        this.profileError.set(err.error?.message || 'Failed to update availability.');
        this.savingAvailability.set(false);
      }
    });
  }
}
