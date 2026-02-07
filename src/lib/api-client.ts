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
  AuthResponse,
  ContactPreference,
  InvoiceEmailDTO,
  InvoiceEmailResponse,
  SignUpDTO,
  RequestPasswordResetDTO,
  SetPasswordDTO,
  MessageResponse,
  DashboardStatistics,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Endpoints that should not trigger token refresh on 401
const NO_REFRESH_ENDPOINTS = new Set(['/auth/refresh', '/auth/signin', '/auth/signup', '/auth/request-password-reset', '/auth/set-password']);

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== 'undefined') {
      this.refreshToken = localStorage.getItem('refreshToken');
    }
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // For backward compatibility
  setToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  getToken(): string | null {
    return this.getAccessToken();
  }

  clearToken() {
    this.clearTokens();
  }

  private async refreshAccessToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const userId =
      typeof window !== 'undefined'
        ? ((): string | undefined => {
            try {
              const storedUser = localStorage.getItem('user');
              if (!storedUser) return undefined;
              const parsed = JSON.parse(storedUser) as { id?: string };
              return parsed?.id;
            } catch {
              return undefined;
            }
          })()
        : undefined;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        ...(userId ? { userId } : {}),
      }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const accessToken =
      data.accessToken ||
      data.access_token ||
      data.token ||
      data.data?.accessToken ||
      data.data?.access_token ||
      data.data?.token;
    const newRefreshToken =
      data.refreshToken || data.refresh_token || data.data?.refreshToken || data.data?.refresh_token;

    if (!accessToken) {
      this.clearTokens();
      throw new Error('Refresh response missing access token');
    }

    this.setTokens(accessToken, newRefreshToken || refreshToken);
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!token && this.getRefreshToken() && !NO_REFRESH_ENDPOINTS.has(endpoint)) {
      try {
        await this.refreshAccessToken();
        token = this.getAccessToken();
      } catch {
        token = null;
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle unauthorized - try to refresh token
    if (
      response.status === 401 &&
      !NO_REFRESH_ENDPOINTS.has(endpoint) &&
      this.getRefreshToken()
    ) {
      // If already refreshing, wait for it to complete
      if (this.isRefreshing && this.refreshPromise) {
        await this.refreshPromise;
      } else if (!this.isRefreshing) {
        // Start refreshing
        this.isRefreshing = true;
        this.refreshPromise = this.refreshAccessToken()
          .catch((error) => {
            this.clearTokens();
            throw error;
          })
          .finally(() => {
            this.isRefreshing = false;
            this.refreshPromise = null;
          });

        try {
          await this.refreshPromise;
          
          // Retry the original request with new token
          const newToken = this.getAccessToken();
          const retryHeaders = { ...headers };
          if (newToken) {
            retryHeaders['Authorization'] = `Bearer ${newToken}`;
          }
          
          // Remove any Authorization header from options.headers to prevent conflicts
          const optionsHeaders = { ...options.headers };
          if (optionsHeaders && 'Authorization' in optionsHeaders) {
            delete (optionsHeaders as Record<string, string>)['Authorization'];
          }
          
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
              ...retryHeaders,
              ...optionsHeaders,
            },
          });
        } catch (error) {
          // Refresh failed, clear tokens, redirect to login, and throw
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please log in again.');
        }
      }
    }

    if (
      response.status === 401 &&
      !NO_REFRESH_ENDPOINTS.has(endpoint) &&
      !this.getRefreshToken()
    ) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
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
  async login(username: string, password: string): Promise<AuthResponse> {
    return this.fetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.fetch<void>('/auth/signout', {
        method: 'POST',
      });
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async signUp(data: SignUpDTO): Promise<AuthResponse> {
    return this.fetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestPasswordReset(data: RequestPasswordResetDTO): Promise<MessageResponse> {
    return this.fetch<MessageResponse>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async setPassword(data: SetPasswordDTO): Promise<MessageResponse> {
    return this.fetch<MessageResponse>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify(data),
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

  private toClientPayload(
    data: CreateClientDTO | Record<string, unknown>,
    mode: 'create' | 'update' = 'create'
  ): CreateClientDTO | Partial<CreateClientDTO> {
    const input = data as Record<string, unknown>;
    const firstName = input.firstName as string | undefined;
    const lastName = input.lastName as string | undefined;
    const prefContact = input.prefContact as ContactPreference | undefined;
    const serviceCategory = input.serviceCategory as string | undefined;

    const payload: Partial<CreateClientDTO> = {};

    const assignIfDefined = <T>(
      key: keyof CreateClientDTO,
      value: T | null | undefined
    ) => {
      if (value !== undefined) {
        (payload as Record<string, unknown>)[key] = value ?? null;
      }
    };

    assignIfDefined('first_name', (input.first_name as string | undefined) ?? firstName);
    assignIfDefined('last_name', (input.last_name as string | undefined) ?? lastName);
    assignIfDefined('email', input.email as string | undefined);
    assignIfDefined('phone', input.phone as string | undefined);
    assignIfDefined('company', input.company as string | null | undefined);
    assignIfDefined(
      'pref_contact',
      (input.pref_contact as ContactPreference | undefined) ?? prefContact
    );
    assignIfDefined(
      'service_category',
      (input.service_category as string | null | undefined) ?? serviceCategory
    );
    assignIfDefined('street', input.street as string | null | undefined);
    assignIfDefined('city', input.city as string | null | undefined);
    assignIfDefined('state', input.state as string | null | undefined);
    assignIfDefined('postal', input.postal as string | null | undefined);

    if (mode === 'create') {
      if (payload.first_name === undefined) payload.first_name = '';
      if (payload.last_name === undefined) payload.last_name = '';
      if (payload.email === undefined) payload.email = '';
      if (payload.phone === undefined) payload.phone = '';
      if (payload.pref_contact === undefined) payload.pref_contact = 'email';
      if (payload.company === undefined) payload.company = null;
      if (payload.service_category === undefined) payload.service_category = null;
      if (payload.street === undefined) payload.street = null;
      if (payload.city === undefined) payload.city = null;
      if (payload.state === undefined) payload.state = null;
      if (payload.postal === undefined) payload.postal = null;
    }

    return payload as CreateClientDTO | Partial<CreateClientDTO>;
  }

  async createClient(data: CreateClientDTO): Promise<Client> {
    return this.fetch<Client>('/client', {
      method: 'POST',
      body: JSON.stringify(this.toClientPayload(data, 'create')),
    });
  }

  async updateClient(id: string, data: Partial<CreateClientDTO>): Promise<Client> {
    return this.fetch<Client>(`/client/${id}`, {
      method: 'PUT',
      body: JSON.stringify(this.toClientPayload(data, 'update')),
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

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    return this.fetch<Invoice>(`/invoice/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Email endpoints
  async sendInvoiceEmail(data: InvoiceEmailDTO): Promise<InvoiceEmailResponse> {
    return this.fetch<InvoiceEmailResponse>('/email/send-invoice', {
      method: 'POST',
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

  // Statistics endpoints
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    return this.fetch<DashboardStatistics>('/stats/dashboard');
  }
}

export const apiClient = new ApiClient();
