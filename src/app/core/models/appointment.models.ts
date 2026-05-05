// ═══════════════════════════════════════
//  Appointment Service Models
// ═══════════════════════════════════════

export interface AppointmentDto {
  appointmentId: number;
  slotId: number;
  patientId: string;
  patientName?: string;
  providerId: string;
  providerName?: string;
  clinicName?: string;
  appointmentDate: string;   // yyyy-MM-dd
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';
  notes?: string;
  amount?: number;
  consultationFee: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface RescheduleRequest {
  newSlotId: number;
  reason?: string;
}

export interface UpdateStatusRequest {
  status: string;
}

export interface AppointmentCountDto {
  providerId: string;
  count: number;
}
