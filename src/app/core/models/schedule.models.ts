// ═══════════════════════════════════════
//  Schedule Service Models
// ═══════════════════════════════════════

export interface AvailabilitySlotDto {
  slotId: number;
  providerId: string;
  providerName?: string;
  date: string;           // yyyy-MM-dd
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  isBooked: boolean;
  isBlocked: boolean;
  consultationFee: number;
  currency: string;
  status: 'Available' | 'Booked' | 'Blocked' | 'Pending';
}

export interface AddSlotRequest {
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  currency?: string;
}

export interface AddBulkSlotsRequest {
  slots: AddSlotRequest[];
}

export interface GenerateRecurringRequest {
  providerId: string;
  startDate: string;
  endDate: string;
  slotStartTime: string;
  slotEndTime: string;
  recurrence: 'Daily' | 'Weekly';
  price: number;
}

export interface UpdateSlotRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  consultationFee?: number;
}

export interface BookSlotRequest {
  patientId: string;
  paymentMethod: string;   // 'Card' | 'UPI' | 'Cash'
  notes?: string;
}

export interface BookSlotResponse {
  slotId: number;
  correlationId: string;
  status: string;          // 'PENDING'
}
