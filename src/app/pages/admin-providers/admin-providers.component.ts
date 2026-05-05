import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderService } from '../../services/provider.service';
import { ProviderProfileDto, PagedResult } from '../../core/models/provider.models';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-admin-providers',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './admin-providers.component.html'
})
export class AdminProvidersComponent implements OnInit {
  private providerService = inject(ProviderService);

  loading = signal(true);
  error = signal('');
  message = signal('');
  providers = signal<PagedResult<ProviderProfileDto> | null>(null);
  pending = signal<ProviderProfileDto[]>([]);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.providerService.getAll(undefined, undefined, undefined, 1, 100).subscribe({
      next: providers => {
        this.providers.set(providers);
        this.providerService.getPendingProviders().subscribe({
          next: pending => { this.pending.set(pending.items.filter(p => !p.isVerified) ); this.loading.set(false); },
          error: () => { this.pending.set(providers.items.filter(p => !p.isVerified)); this.loading.set(false); }
        });
      },
      error: err => { this.error.set(err.error?.message || 'Failed to load providers.'); this.loading.set(false); }
    });
  }

  verify(provider: ProviderProfileDto) {
    this.providerService.verifyProvider(provider.providerId, true).subscribe({
      next: () => {
        this.message.set('Provider verified.');
        this.pending.update(items => items.filter(p => p.providerId !== provider.providerId));
        this.providers.update(result => result ? {
          ...result,
          items: result.items.map(p => p.providerId === provider.providerId ? { ...p, isVerified: true } : p)
        } : result);
      },
      error: err => this.error.set(err.error?.message || 'Failed to verify provider.')
    });
  }
}
