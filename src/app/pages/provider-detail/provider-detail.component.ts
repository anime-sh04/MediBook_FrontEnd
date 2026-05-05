import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { ReviewService } from '../../services/review.service';
import { ProviderProfileDto } from '../../core/models/provider.models';
import { ReviewDto, AvgRatingDto } from '../../core/models/notification-review.models';
import { LoadingComponent } from '../../components/loading/loading.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent],
  templateUrl: './provider-detail.component.html',
  styleUrls: ['./provider-detail.component.scss']
})
export class ProviderDetailComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private providerService = inject(ProviderService);
  private reviewService   = inject(ReviewService);

  loading  = signal(true);
  error    = signal('');
  provider = signal<ProviderProfileDto | null>(null);
  reviews  = signal<ReviewDto[]>([]);
  avgRating = signal<AvgRatingDto | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    forkJoin({
      provider:  this.providerService.getById(id),
      reviews:   this.reviewService.getByProvider(id).pipe(catchError(() => of([]))),
      avgRating: this.reviewService.getAvgRating(id).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ provider, reviews, avgRating }) => {
        this.provider.set(provider);
        this.reviews.set(reviews);
        this.avgRating.set(avgRating);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Provider not found.');
        this.loading.set(false);
      }
    });
  }

  stars(n: number): string {
    return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  }

  // initials(name: string): string {
  //   return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  // }
  initials(name?: string): string {
    if (!name) return "?";

    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  }

  bookSlot() {
    this.router.navigate(['/providers', this.provider()!.providerId, 'slots']);
  }
}
