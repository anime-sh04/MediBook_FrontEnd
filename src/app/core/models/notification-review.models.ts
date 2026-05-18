// ═══════════════════════════════════════
//  Notification Service Models
// ═══════════════════════════════════════

export interface NotificationResponse {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;          // 'BOOKING' | 'PAYMENT' | 'REMINDER' | 'CANCELLATION' | 'FOLLOWUP'
  isRead: boolean;
  sentAt: string;
  readAt?: string;
  metadata?: Record<string, string>;
}

export interface SendNotificationRequest {
  recipientId: string;
  recipientEmail?: string;
  recipientName?: string;
  title: string;
  message: string;
  type: string;
  sendEmail?: boolean;
  channel?: 'IN_APP' | 'EMAIL';
  emailSubject?: string;
  metadata?: Record<string, string>;
}

export interface SendBulkRequest {
  recipientIds: string[];
  title: string;
  message: string;
  type: string;
  sendEmail?: boolean;
}

export interface SendEmailRequest {
  toEmail: string;
  subject: string;
  htmlBody: string;
}

export interface BulkSendResponse {
  successCount: number;
  failureCount: number;
  failedRecipients?: string[];
}

export interface UnreadCountResponse {
  recipientId: string;
  unreadCount: number;
}

export interface ApiSuccessResponse {
  message: string;
}

// ═══════════════════════════════════════
//  Review Service Models
// ═══════════════════════════════════════

export interface ReviewDto {
  reviewId: number;
  appointmentId: number;
  patientId: string;
  patientName?: string;
  providerId: string;
  rating: number;       // 1–5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddReviewRequest {
  appointmentId: number;
  patientId: string;
  providerId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string;
}

export interface AvgRatingDto {
  providerId: string;
  avgRating: number;
  reviewCount: number;
}