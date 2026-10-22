export const API_BASE_URL: string =
  (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? 'http://localhost:3001';

const TOKEN_KEY = 'jojo_token';
const SESSION_KEY = 'jojo_session_user';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Attach token if present
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach username header as backup identification
  const sessionRaw = localStorage.getItem(SESSION_KEY);
  if (sessionRaw) {
    try {
      const parsed = JSON.parse(sessionRaw) as { username?: string };
      if (parsed.username) {
        headers['x-username'] = parsed.username;
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data: unknown = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg =
      (data as { error?: string } | null)?.error ??
      `Request failed with status ${response.status.toString()}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// ── Auth APIs ─────────────────────────────────────────────────────────────
export interface SignupPayload {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  role?: string;
}

export interface AuthResponse {
  data: {
    token: string;
    user: AuthUser;
  };
}

export const authApi = {
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res;
  },

  getMe: async (): Promise<{ data: AuthUser }> => {
    return request<{ data: AuthUser }>('/api/auth/me', {
      method: 'GET',
    });
  },

  updateProfile: async (payload: Partial<AuthUser>): Promise<{ data: AuthUser }> => {
    return request<{ data: AuthUser }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};

// ── Address APIs ──────────────────────────────────────────────────────────
export interface AddressItem {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export const addressApi = {
  getAll: async (): Promise<{ data: AddressItem[] }> => {
    return request<{ data: AddressItem[] }>('/api/addresses', {
      method: 'GET',
    });
  },

  create: async (
    payload: Omit<AddressItem, 'id' | 'isDefault'>,
  ): Promise<{ data: AddressItem }> => {
    return request<{ data: AddressItem }>('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: async (
    id: string,
    payload: Partial<Omit<AddressItem, 'id'>>,
  ): Promise<{ data: AddressItem }> => {
    return request<{ data: AddressItem }>(`/api/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string): Promise<{ data: { message: string } }> => {
    return request<{ data: { message: string } }>(`/api/addresses/${id}`, {
      method: 'DELETE',
    });
  },

  setDefault: async (id: string): Promise<{ data: AddressItem }> => {
    return request<{ data: AddressItem }>(`/api/addresses/${id}/default`, {
      method: 'PUT',
    });
  },
};

// ── Measurements APIs ─────────────────────────────────────────────────────
export interface MeasurementData {
  blouse: Record<string, string>;
  chudi: Record<string, string>;
  pant: Record<string, string>;
}

export const measurementApi = {
  get: async (): Promise<{ data: MeasurementData }> => {
    return request<{ data: MeasurementData }>('/api/measurements', {
      method: 'GET',
    });
  },

  save: async (payload: MeasurementData): Promise<{ data: MeasurementData }> => {
    return request<{ data: MeasurementData }>('/api/measurements', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

// ── Order APIs ────────────────────────────────────────────────────────────
export interface OrderPayload {
  id?: string;
  orderDetails: unknown;
  address: unknown;
  paymentId?: string | null;
}

export interface OrderItem {
  id: string;
  username: string;
  orderDetails: Record<string, unknown>;
  address: Record<string, unknown>;
  paymentId: string | null;
  paymentStatus: string;
  status: string;
  placedAt: string;
}

export const orderApi = {
  create: async (payload: OrderPayload): Promise<{ data: OrderItem }> => {
    return request<{ data: OrderItem }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getUserOrders: async (username?: string): Promise<{ data: OrderItem[] }> => {
    return request<{ data: OrderItem[] }>(
      '/api/orders',
      username
        ? {
            method: 'GET',
            params: { username },
          }
        : { method: 'GET' },
    );
  },

  getById: async (id: string): Promise<{ data: OrderItem }> => {
    return request<{ data: OrderItem }>(`/api/orders/${id}`, {
      method: 'GET',
    });
  },

  getAll: async (): Promise<{ data: OrderItem[] }> => {
    return request<{ data: OrderItem[] }>('/api/orders/all', {
      method: 'GET',
    });
  },

  updateStatus: async (id: string, status: string): Promise<{ data: OrderItem }> => {
    return request<{ data: OrderItem }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ── Franchise APIs ────────────────────────────────────────────────────────
export interface FranchisePayload {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  investment: string;
  message?: string;
}

export const franchiseApi = {
  submit: async (payload: FranchisePayload): Promise<{ data: { id: string; message: string } }> => {
    return request<{ data: { id: string; message: string } }>('/api/franchise', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAll: async (): Promise<{ data: unknown[] }> => {
    return request<{ data: unknown[] }>('/api/franchise', {
      method: 'GET',
    });
  },
};

// ── Health APIs ───────────────────────────────────────────────────────────
export const healthApi = {
  check: async (): Promise<{ data: { status: string; database?: string } }> => {
    return request<{ data: { status: string; database?: string } }>('/health', {
      method: 'GET',
    });
  },
};
