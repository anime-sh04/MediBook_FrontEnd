import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ProviderService } from '../../services/provider.service';
import { ProviderProfileDto, PagedResult } from '../../core/models/provider.models';
import { LoadingComponent } from '../../components/loading/loading.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReviewService } from '../../services/review.service';
import { of, forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LoadingComponent],
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.scss']
})
export class ProvidersComponent implements OnInit {
  private providerService = inject(ProviderService);
  private fb = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);


  loading   = signal(true);
  error     = signal('');
  result    = signal<PagedResult<ProviderProfileDto> | null>(null);
  page      = signal(1);

  filterForm = this.fb.group({
    specialization: [''],
    city:           [''],
    isAvailable:    [false],
    search:         ['']
  });

  ngOnInit() {
    this.load();

    this.filterForm.get('search')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(q => {
      if (q && q.trim().length > 1) {
        this.searchProviders(q);
      } else if (!q) {
        this.load();
      }
    });
  }

  // load() {
  //   this.loading.set(true);
  //   const { specialization, city, isAvailable } = this.filterForm.value;
  //   this.providerService.getAll(
  //     specialization || undefined,
  //     city           || undefined,
  //     isAvailable    || undefined,
  //     this.page(),
  //     12
  //   ).subscribe({
  //     // next: r  => { this.result.set(r); this.loading.set(false); },
  //     next: r => {
      
  //       const calls = r.items.map(p =>
  //         this.reviewService.getAvgRating(p.providerId)
  //       );
      
  //       forkJoin(calls).subscribe(results => {
        
  //         this.result.set({
  //           ...r,
  //           items: r.items.map((p, i) => ({
  //             ...p,
  //             avgRating: results[i].avgRating ?? 0,
  //             reviewCount: results[i].reviewCount ?? 0
  //           }))
  //         });
        
  //         this.loading.set(false);
  //       });
      
  //     },
  //     error: () => { this.error.set('Failed to load providers.'); this.loading.set(false); }
  //   });
  // }

  load() {
    this.loading.set(true);
    const { specialization, city, isAvailable } = this.filterForm.value;

    this.providerService.getAll(
      specialization || undefined,
      city || undefined,
      isAvailable || undefined,
      this.page(),
      12
    ).pipe(
      switchMap(r => {
        const userCalls = r.items.map(p => this.authService.getUserById(p.userId));
        const ratingCalls = r.items.map(p => this.reviewService.getAvgRating(p.providerId));

        return forkJoin({
          users: forkJoin(userCalls),
          ratings: forkJoin(ratingCalls),
          base: of(r)   // ✅ correct
        });
      })
    ).subscribe({
      next: ({ users, ratings, base }) => {
        const r = base;

        // const items = r.items.map((p, i) => ({
        const items = r.items.map((p: ProviderProfileDto, i: number) => ({
          ...p,
          fullName: users[i]?.fullName ?? 'Unknown',
          avgRating: ratings[i]?.avgRating ?? 0,
          reviewCount: ratings[i]?.reviewCount ?? 0
        }));

        this.result.set({ ...r, items });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load providers.');
        this.loading.set(false);
      }
    });
  }

  applyFilters() { this.page.set(1); this.load(); }

  searchProviders(q: string) {
    this.loading.set(true);
    this.providerService.search(q).subscribe({
      next: items => {
        this.result.set({ items, totalCount: items.length, page: 1, pageSize: items.length, totalPages: 1 });
        this.loading.set(false);
      },
      error: () => { this.error.set('Search failed.'); this.loading.set(false); }
    });
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  pages(): number[] {
    const total = this.result()?.totalPages ?? 1;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  stars(rating: number): string {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }

  initials(name?: string): string {
    if (!name) return "?";

    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  }
}
