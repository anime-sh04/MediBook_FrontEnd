// ═══════════════════════════════════════
//  Payment Service Models
// ═══════════════════════════════════════

export interface PaymentDto {
  paymentId: number;
  appointmentId: number;
  slotId: number;
  patientId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  mode: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessPaymentRequest {
  correlationId: string;
  slotId: number;
  patientId: string;
  providerId: string;
  amount: number;
  currency: string;
  mode: string;  // 'Card' | 'UPI' | 'Wallet' | 'Cash'
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface ProcessPaymentResponse {
  payment: PaymentDto;
  razorpayOrder?: RazorpayOrder;
}

export interface ConfirmPaymentRequest {
  paymentId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  transactionId: string;
}

export interface ConfirmPaymentResponse {
  paymentId: number;
  status: string;
  message: string;
}

export interface FailPaymentRequest {
  paymentId: number;
  reason?: string;
  razorpayOrderId?: string;
  razorpayErrorCode?: string;
  razorpayErrorDescription?: string;
}

export interface FailPaymentResponse {
  paymentId: number;
  status: string;
  message: string;
}

export interface InvoiceDto {
  paymentId: number;
  invoiceNumber: string;
  patientId: string;
  providerId: string;
  clinicName: string;
  appointmentDate: string;
  amount: number;
  currency: string;
  paidAt: string;
  razorpayPaymentId: string;
}

export interface TotalRevenueDto {
  providerId: string;
  totalRevenue: number;
  currency: string;
  paymentCount: number;
}

// Razorpay browser global types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
