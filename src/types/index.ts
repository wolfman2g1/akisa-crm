// API Types based on the API documentation

export type ContactPreference = 'email' | 'phone' | 'sms';

export type LeadStatus = 'lead' | 'contacted' | 'scheduled' | 'converted' | 'lost';

export type AppointmentStatus = 'tentative' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'past_due' | 'cancelled';

export type PaymentStatus = 'requires_payment' | 'pending' | 'paid' | 'refunded' | 'failed';

export type UserRole = 'admin' | 'provider' | 'client';

// Lead Types
export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: string | null;
  pref_contact: ContactPreference;
  service_category?: string | null;
  source?: string | null;
  convertedClientId?: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadDTO {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: string | null;
  pref_contact: ContactPreference;
  service_category?: string | null;
  source?: string | null;
  status?: LeadStatus;
  message?: string | null;
}

// Client Types
export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: string | null;
  pref_contact: ContactPreference;
  service_category?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal?: string | null;
  stripeCustomerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDTO {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: string | null;
  pref_contact: ContactPreference;
  service_category?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal?: string | null;
  stripeCustomerId?: string | null;
}

// Appointment Types
export interface Appointment {
  id: string;
  clientId?: string | null;
  leadId?: string | null;
  serviceId?: string | null;
  startAt: string;
  endAt: string;
  startTime?: string;
  endTime?: string;
  status: AppointmentStatus;
  notes?: string | null;
  client?: Client | null;
  lead?: Lead | null;
  service?: Service | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDTO {
  clientId?: string;
  leadId?: string;
  serviceId?: string;
  startAt: string;
  endAt: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  start?: string;
  end?: string;
  available?: boolean;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  service?: string;
  description?: string | null;
  durationMinutes: number;
  price: number | string;
  priceId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDTO {
  service: string;
  description?: string | null;
  price?: number | null;
  priceId?: string | null;
}

// Invoice Types
export interface InvoiceLineItem {
  id: string;
  serviceId?: string | null;
  serviceName: string;
  description?: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  subtotal: string;
  tax?: string | null;
  total: string;
  amount: string;
  paidAmount: string;
  notes?: string | null;
  lineItems: InvoiceLineItem[];
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDTO {
  invoiceNumber?: string;
  clientId: string;
  issueDate?: string;
  dueDate?: string | null;
  currency?: string;
  notes?: string;
  lineItems: {
    serviceId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  tax?: string | number | null;
}

// Email Types
export interface InvoiceEmailDTO {
  clientId: string;
  invoiceDetails: {
    invoiceNumber: string;
    amount: string;
  };
}

export interface InvoiceEmailResponse {
  message: string;
}

// Stripe Types
export interface CreateCheckoutSessionDTO {
  customerId: string;
  lineItems: {
    priceId: string;
    quantity: number;
  }[];
  successUrl: string;
  cancelUrl: string;
  invoiceId?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// Calendar Types
export interface CalendarAuthResponse {
  authUrl: string;
}

// Sales Statistics Types
export interface SalesStatistics {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalTransactions: number;
  invoiceRevenue: number;
  totalInvoices: number;
  averageTransactionValue: number;
  byCurrency: Record<string, { amount: number; count: number }>;
}

// User/Auth Types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  username?: string;
  reset?: boolean;
}

export interface AuthResponse {
  user: (Partial<User> & {
    access_token?: string;
    refresh_token?: string;
  });
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    token?: string;
  };
}

// Sign Up DTO (matches backend validation)
export interface SignUpDTO {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
}

// Password Reset / Set types
export interface RequestPasswordResetDTO {
  email: string;
}

export interface SetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}
