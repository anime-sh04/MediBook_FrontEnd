import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ReviewDto, AddReviewRequest, UpdateReviewRequest, AvgRatingDto
} from '../core/models/notification-review.models';

const BASE = `${environment.apiUrls.review}/reviews`;

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  // POST /reviews
  addReview(request: AddReviewRequest): Observable<ReviewDto> {
    return this.http.post<ReviewDto>(BASE, request);
  }

  // GET /reviews/provider/{providerId}
  getByProvider(providerId: string): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${BASE}/provider/${providerId}`);
  }

  // GET /reviews/patient/{patientId}
  getByPatient(patientId: string): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(`${BASE}/patient/${patientId}`);
  }

  // GET /reviews/appointment/{appointmentId}
  getByAppointment(appointmentId: number): Observable<ReviewDto> {
    return this.http.get<ReviewDto>(`${BASE}/appointment/${appointmentId}`);
  }

  // GET /reviews (admin)
  getAll(): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(BASE);
  }

  // PUT /reviews/{reviewId}
  updateReview(reviewId: number, request: UpdateReviewRequest): Observable<ReviewDto> {
    return this.http.put<ReviewDto>(`${BASE}/${reviewId}`, request);
  }

  // DELETE /reviews/{reviewId}
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${reviewId}`);
  }

  // GET /reviews/provider/{providerId}/avg-rating
  getAvgRating(providerId: string): Observable<AvgRatingDto> {
    return this.http.get<AvgRatingDto>(`${BASE}/provider/${providerId}/avg-rating`);
  }

  // GET /reviews/provider/{providerId}/count
  getCount(providerId: string): Observable<number> {
    return this.http.get<number>(`${BASE}/provider/${providerId}/count`);
  }
}
