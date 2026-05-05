import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ProviderProfileDto, RegisterProviderProfileRequest,
  PagedResult, SetAvailabilityRequest, UpdateRatingRequest
} from '../core/models/provider.models';
import { UserDto } from '../core/models/auth.models';

const BASE = `${environment.apiUrls.provider}/providers`;
const AUTH_BASE = `${environment.apiUrls.auth}/auth`;

@Injectable({ providedIn: 'root' })
export class ProviderService {
  constructor(private http: HttpClient) {}

  // GET /providers — list with filters
  getAll(
    specialization?: string,
    city?: string,
    isAvailable?: boolean,
    page = 1,
    pageSize = 20,
    isVerified?: boolean
  ): Observable<PagedResult<ProviderProfileDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (specialization) params = params.set('specialization', specialization);
    if (city)           params = params.set('city', city);
    if (isAvailable !== undefined) params = params.set('isAvailable', isAvailable.toString());
    if (isVerified !== undefined) params = params.set('isVerified', isVerified.toString());
    // return this.http.get<PagedResult<ProviderProfileDto>>(BASE, { params }).pipe(
    //   switchMap(result => this.enrichProviders(result.items ?? []).pipe(
    //     map(items => ({ ...result, items }))
    //   ))
    return this.http.get<PagedResult<ProviderProfileDto>>(BASE, { params });
    // );
  }

  // GET /providers/search?q=
  search(q: string): Observable<ProviderProfileDto[]> {
    return this.http.get<ProviderProfileDto[]>(`${BASE}/search`, {
      params: new HttpParams().set('q', q)
    }).pipe(switchMap(items => this.enrichProviders(items)));
  }

  // GET /providers/specialization/{specialization}
  getBySpecialization(specialization: string): Observable<ProviderProfileDto[]> {
    return this.http.get<ProviderProfileDto[]>(`${BASE}/specialization/${encodeURIComponent(specialization)}`).pipe(
      switchMap(items => this.enrichProviders(items))
    );
  }

  // GET /providers/{id}
  getById(id: string): Observable<ProviderProfileDto> {
    return this.http.get<ProviderProfileDto>(`${BASE}/${id}`).pipe(switchMap(p => this.enrichProvider(p)));
  }

  // GET /providers/me
  getMyProfile(): Observable<ProviderProfileDto> {
    return this.http.get<ProviderProfileDto>(`${BASE}/me`).pipe(switchMap(p => this.enrichProvider(p)));
  }

  // POST /providers/register
  registerProfile(request: RegisterProviderProfileRequest): Observable<ProviderProfileDto> {
    return this.http.post<ProviderProfileDto>(`${BASE}/register`, request);
  }

  // PUT /providers/me
  updateMyProfile(request: RegisterProviderProfileRequest): Observable<ProviderProfileDto> {
    return this.http.put<ProviderProfileDto>(`${BASE}/me`, request);
  }

  // PUT /providers/{id}/availability
  setAvailability(id: string, isAvailable: boolean): Observable<ProviderProfileDto> {
    return this.http.put<ProviderProfileDto>(
      `${BASE}/${id}/availability`,
      { isAvailable } as SetAvailabilityRequest
    ).pipe(switchMap(p => this.enrichProvider(p)));
  }

  getPendingProviders(page = 1, pageSize = 50): Observable<PagedResult<ProviderProfileDto>> {
    return this.getAll(undefined, undefined, undefined, page, pageSize, false);
  }

  // POST /providers/{id}/verify (admin)
  verifyProvider(id: string, isVerified = true): Observable<ProviderProfileDto> {
    return this.http.put<ProviderProfileDto>(`${BASE}/${id}/verify`, null, {
      params: new HttpParams().set('isVerified', isVerified.toString())
    }).pipe(switchMap(p => this.enrichProvider(p)));
  }

  // PUT /providers/{id}/rating (service-to-service / admin)
  updateRating(id: string, newAvgRating: number): Observable<void> {
    return this.http.put<void>(`${BASE}/${id}/rating`, { newAvgRating } as UpdateRatingRequest);
  }

  // DELETE /providers/{id} (admin)
  deleteProvider(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  private enrichProviders(providers: ProviderProfileDto[]): Observable<ProviderProfileDto[]> {
    if (!providers.length) return of([]);
    return forkJoin(providers.map(provider => this.enrichProvider(provider)));
  }

  private enrichProvider(provider: any): Observable<ProviderProfileDto> {
    const mapped = this.mapProvider(provider);
    if (!mapped.userId) return of(mapped);

    return this.http.get<UserDto>(`${AUTH_BASE}/users/${mapped.userId}`).pipe(
      map(user => ({
        ...mapped,
        fullName: user.fullName,
        email: user.email,
        phone: user?.phone ?? ''
      })),
      catchError(() => of(mapped))
    );
  }

  private mapProvider(provider: any): ProviderProfileDto {
    return {
      ...provider,
      fullName: provider.fullName ?? provider.userFullName ?? provider.name ?? provider.user?.fullName ?? '',
      email: provider.email ?? provider.userEmail ?? provider.user?.email ?? '',
      phone: provider.phone ?? provider.userPhone ?? provider.user?.phone ?? ''
    };
  }
}
