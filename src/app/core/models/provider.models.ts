// ═══════════════════════════════════════
//  Provider Service Models
// ═══════════════════════════════════════

export interface ProviderProfileDto {
  providerId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  clinicName: string;
  address: string;
  city: string;
  state: string;
  consultationFee: number;
  currency: string;
  isAvailable: boolean;
  isVerified: boolean;
  avgRating: number;
  reviewCount: number;
  bio?: string;
  qualifications?: string;
  createdAt: string;
}

export interface RegisterProviderProfileRequest {
  specialization: string;
  qualification?: string;
  qualifications?: string;
  experienceYears?: number;
  bio?: string;
  clinicName: string;
  clinicAddress?: string;
  address?: string;
  city: string;
  state: string;
  consultationFee: number;
  currency?: string;
}

export interface ProviderSearchQuery {
  specialization?: string;
  city?: string;
  isAvailable?: boolean;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SetAvailabilityRequest {
  isAvailable: boolean;
}

export interface UpdateRatingRequest {
  newAvgRating: number;
}
