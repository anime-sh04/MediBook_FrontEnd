import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ReviewDto } from '../../core/models/notification-review.models';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private authService   = inject(AuthService);
  private toast         = inject(ToastService);
  private route         = inject(ActivatedRoute);
  private fb            = inject(FormBuilder);

  loading            = signal(true);
  submitting         = signal(false);
  error              = signal('');
  reviews            = signal<ReviewDto[]>([]);
  myReviews          = signal<ReviewDto[]>([]);
  editingId          = signal<number | null>(null);
  deletingId         = signal<number | null>(null);
  hoveredStar        = signal(0);
  preAppointmentId   = signal<number | null>(null);
  preProviderId      = signal<string>('');

  addForm = this.fb.group({
    providerId:    ['', Validators.required],
    appointmentId: [0, [Validators.required, Validators.min(1)]],
    rating:        [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment:       ['']
  });

  editForm = this.fb.group({
    rating:  [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['']
  });

  ngOnInit() {
    const aptId  = this.route.snapshot.queryParamMap.get('appointmentId');
    const provId = this.route.snapshot.queryParamMap.get('providerId') ?? '';
    if (aptId)  this.preAppointmentId.set(parseInt(aptId));
    if (provId) this.preProviderId.set(provId);

    if (aptId && provId) {
      this.addForm.patchValue({ appointmentId: parseInt(aptId), providerId: provId });
    }

    this.loadMyReviews();
  }

  loadMyReviews() {
    const userId = this.authService.user()?.id;
    if (!userId) return;

    this.reviewService.getByPatient(userId).subscribe({
      next:  r => { this.myReviews.set(r); this.loading.set(false); },
      error: () => { this.error.set('Failed to load reviews.'); this.loading.set(false); }
    });
  }

  submitReview() {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    const user = this.authService.user();
    if (!user) return;

    this.submitting.set(true);
    this.reviewService.addReview({
      appointmentId: this.addForm.value.appointmentId!,
      patientId:     user.id,
      providerId:    this.addForm.value.providerId!,
      rating:        this.addForm.value.rating!,
      comment:       this.addForm.value.comment || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Review submitted!', 'Thank you for your feedback.');
        this.addForm.reset();
        this.loadMyReviews();
        this.submitting.set(false);
      },
      error: err => {
        this.toast.error('Failed', err.error?.message || 'Could not submit review.');
        this.submitting.set(false);
      }
    });
  }

  startEdit(r: ReviewDto) {
    this.editingId.set(r.reviewId);
    this.editForm.patchValue({ rating: r.rating, comment: r.comment });
  }

  cancelEdit() { this.editingId.set(null); }

  saveEdit(reviewId: number) {
    if (this.editForm.invalid) return;
    this.reviewService.updateReview(reviewId, {
      rating:  this.editForm.value.rating!,
      comment: this.editForm.value.comment || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Review updated');
        this.editingId.set(null);
        this.loadMyReviews();
      },
      error: err => this.toast.error('Update failed', err.error?.message)
    });
  }

  deleteReview(id: number) {
    if (!confirm('Delete this review?')) return;
    this.deletingId.set(id);
    this.reviewService.deleteReview(id).subscribe({
      next: () => {
        this.toast.success('Review deleted');
        this.myReviews.update(r => r.filter(x => x.reviewId !== id));
        this.deletingId.set(null);
      },
      error: () => { this.deletingId.set(null); }
    });
  }

  setRating(n: number, form: 'add' | 'edit') {
    if (form === 'add') this.addForm.patchValue({ rating: n });
    else                this.editForm.patchValue({ rating: n });
  }

  setHoveredStar(n: number) { this.hoveredStar.set(n); }

  starsArray = [1, 2, 3, 4, 5];

  isStarFilled(star: number, rating: number): boolean {
    return star <= rating;
  }
}
