import type {
  Lead,
  CreateLeadDTO,
  Client,
  CreateClientDTO,
  Appointment,
  CreateAppointmentDTO,
  AvailableSlot,
  Service,
  CreateServiceDTO,
  Invoice,
  CreateInvoiceDTO,
  CheckoutSessionResponse,
  SalesStatistics,
  CalendarAuthResponse,
  AuthResponse
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle unauthorized - clear token and redirect to login
    if (response.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.fetch<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Lead endpoints
  async getLeads(): Promise<Lead[]> {
    return this.fetch<Lead[]>('/lead');
  }

  async getLead(id: string): Promise<Lead> {
    return this.fetch<Lead>(`/lead/${id}`);
  }

  async createLead(data: CreateLeadDTO): Promise<Lead> {
    return this.fetch<Lead>('/lead', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: string, data: Partial<CreateLeadDTO>): Promise<Lead> {
    return this.fetch<Lead>(`/lead/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: string): Promise<void> {
    return this.fetch<void>(`/lead/${id}`, {
      method: 'DELETE',
    });
  }

  // Client endpoints
  async getClients(): Promise<Client[]> {
    return this.fetch<Client[]>('/client');
  }

  async getClient(id: string): Promise<Client> {
    return this.fetch<Client>(`/client/${id}`);
  }

  async createClient(data: CreateClientDTO): Promise<Client> {
    return this.fetch<Client>('/client', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: Partial<CreateClientDTO>): Promise<Client> {
    return this.fetch<Client>(`/client/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string): Promise<void> {
    return this.fetch<void>(`/client/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointment endpoints
  async getAppointments(): Promise<Appointment[]> {
    return this.fetch<Appointment[]>('/appointment');
  }

  async getAppointment(id: string): Promise<Appointment> {
    return this.fetch<Appointment>(`/appointment/${id}`);
  }

  async getAvailableSlots(startDate: string, endDate: string, duration?: number): Promise<AvailableSlot[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(duration && { duration: duration.toString() }),
    });
    return this.fetch<AvailableSlot[]>(`/appointment/available/slots?${params}`);
  }

  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    return this.fetch<Appointment>('/appointment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rescheduleAppointment(id: string, startAt: string, endAt: string): Promise<Appointment> {
    return this.fetch<Appointment>(`/appointment/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ startAt, endAt }),
    });
  }

  async cancelAppointment(id: string): Promise<Appointment> {
    return this.fetch<Appointment>(`/appointment/${id}/cancel`, {
      method: 'PUT',
    });
  }

  async updateAppointment(id: string, data: Partial<CreateAppointmentDTO>): Promise<Appointment> {
    return this.fetch<Appointment>(`/appointment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id: string): Promise<void> {
    return this.fetch<void>(`/appointment/${id}`, {
      method: 'DELETE',
    });
  }

  // Service endpoints
  async getServices(): Promise<Service[]> {
    return this.fetch<Service[]>('/service');
  }

  async getService(id: string): Promise<Service> {
    return this.fetch<Service>(`/service/${id}`);
  }

  async createService(data: CreateServiceDTO): Promise<Service> {
    return this.fetch<Service>('/service', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: Partial<CreateServiceDTO>): Promise<Service> {
    return this.fetch<Service>(`/service/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string): Promise<void> {
    return this.fetch<void>(`/service/${id}`, {
      method: 'DELETE',
    });
  }

  // Invoice endpoints
  async getInvoices(): Promise<Invoice[]> {
    return this.fetch<Invoice[]>('/invoice');
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.fetch<Invoice>(`/invoice/${id}`);
  }

  async getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    return this.fetch<Invoice[]>(`/invoice/client/${clientId}`);
  }

  async createInvoice(data: CreateInvoiceDTO): Promise<Invoice> {
    return this.fetch<Invoice>('/invoice', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id: string, data: Partial<CreateInvoiceDTO>): Promise<Invoice> {
    return this.fetch<Invoice>(`/invoice/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Stripe endpoints
  async createCheckoutSession(data: {
    invoiceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSessionResponse> {
    return this.fetch<CheckoutSessionResponse>('/stripe/checkout-session/from-invoice', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSalesStatistics(
    period?: string,
    startDate?: string,
    endDate?: string
  ): Promise<SalesStatistics> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString();
    return this.fetch<SalesStatistics>(`/stripe/sales-statistics${query ? `?${query}` : ''}`);
  }

  // Calendar endpoints
  async initCalendarAuth(): Promise<CalendarAuthResponse> {
    return this.fetch<CalendarAuthResponse>('/calendar/auth/init');
  }
}

export const apiClient = new ApiClient();
