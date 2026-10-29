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
  trackingNumber?: string;
  courier?: string;
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

  updateStatus: async (
    id: string,
    status?: string,
    trackingNumber?: string,
    courier?: string,
  ): Promise<{ data: OrderItem }> => {
    return request<{ data: OrderItem }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingNumber, courier }),
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

// ── Pricing APIs ──────────────────────────────────────────────────────────
export interface AccessoryItem {
  id: string;
  label: string;
  price: number;
  active: boolean;
  category?: string;
  description?: string;
}

export interface CustomFabricPayload {
  name: string;
  tone: 'warm' | 'cool' | 'neutral';
  hex: string;
  material: string;
  pricePerMeter: number;
  description: string;
  width?: string;
  care?: string;
}

export interface CustomFabricItem extends CustomFabricPayload {
  id: string;
}

export interface PricingData {
  fabricPrices: Record<string, number>;
  accessories: AccessoryItem[];
  customFabrics?: CustomFabricItem[];
  updatedAt?: string;
}

export const pricingApi = {
  get: async (): Promise<{ data: PricingData }> => {
    return request<{ data: PricingData }>('/api/pricing', {
      method: 'GET',
    });
  },

  addFabric: async (
    fabric: CustomFabricPayload,
  ): Promise<{ message: string; data: CustomFabricItem }> => {
    return request<{ message: string; data: CustomFabricItem }>('/api/pricing/fabrics/new', {
      method: 'POST',
      body: JSON.stringify(fabric),
    });
  },

  updateFabricPrices: async (payload: {
    fabricId?: string;
    pricePerMeter?: number;
    fabricPrices?: Record<string, number>;
  }): Promise<{ message: string; data: { fabricPrices: Record<string, number> } }> => {
    return request<{ message: string; data: { fabricPrices: Record<string, number> } }>(
      '/api/pricing/fabrics',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  },

  updateAccessories: async (
    accessories: AccessoryItem[],
  ): Promise<{ message: string; data: { accessories: AccessoryItem[] } }> => {
    return request<{ message: string; data: { accessories: AccessoryItem[] } }>(
      '/api/pricing/accessories',
      {
        method: 'PUT',
        body: JSON.stringify({ accessories }),
      },
    );
  },

  reset: async (): Promise<{ message: string; data: PricingData }> => {
    return request<{ message: string; data: PricingData }>('/api/pricing/reset', {
      method: 'POST',
    });
  },
};

// ── Failed Payments & Cron APIs ───────────────────────────────────────────
export interface CronRunStats {
  timestamp: string;
  scannedCount: number;
  expiredPendingCount: number;
  totalFailedOrders: number;
  durationMs: number;
  message: string;
}

export interface CronStatusData {
  active: boolean;
  intervalMinutes: number;
  isRunning: boolean;
  lastRun: CronRunStats | null;
  history: CronRunStats[];
  counts: {
    failed: number;
    pending: number;
  };
}

export const cronApi = {
  getStatus: async (): Promise<{ data: CronStatusData }> => {
    return request<{ data: CronStatusData }>('/api/cron/failed-payments/status', {
      method: 'GET',
    });
  },

  runJob: async (): Promise<{ message: string; data: CronRunStats }> => {
    return request<{ message: string; data: CronRunStats }>('/api/cron/failed-payments/run', {
      method: 'POST',
    });
  },

  getFailedOrders: async (): Promise<{ data: OrderItem[] }> => {
    return request<{ data: OrderItem[] }>('/api/cron/failed-orders', {
      method: 'GET',
    });
  },

  recordFailure: async (payload: {
    id?: string;
    orderDetails?: unknown;
    address?: unknown;
    reason?: string;
    errorCode?: string;
  }): Promise<{ message: string; data: unknown }> => {
    return request<{ message: string; data: unknown }>('/api/cron/record-failure', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// ── User Management APIs ──────────────────────────────────────────────────
export interface RegisteredUser {
  _id: string;
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const userApi = {
  getAll: async (): Promise<{ data: RegisteredUser[] }> => {
    return request<{ data: RegisteredUser[] }>('/api/auth/users');
  },
  deleteUser: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/api/auth/users/${id}`, { method: 'DELETE' });
  },
  updateRole: async (payload: {
    email?: string;
    userId?: string;
    role: 'user' | 'staff' | 'admin';
  }): Promise<{ data: RegisteredUser; message: string }> => {
    return request<{ data: RegisteredUser; message: string }>('/api/auth/role', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

// ── Review APIs ───────────────────────────────────────────────────────────
export interface ReviewItem {
  _id: string;
  username: string;
  userId?: string;
  orderId?: string;
  fabricId?: string;
  fabricName?: string;
  garment?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'flagged';
  createdAt: string;
}

export interface ReviewStats {
  count: number;
  average: number;
}

export const reviewApi = {
  getReviews: async (params?: {
    fabricId?: string;
    orderId?: string;
    limit?: number;
  }): Promise<{ data: ReviewItem[]; stats?: ReviewStats }> => {
    return request<{ data: ReviewItem[]; stats?: ReviewStats }>(
      '/api/reviews',
      params ? { params } : {},
    );
  },

  getAdminReviews: async (): Promise<{ data: ReviewItem[] }> => {
    return request<{ data: ReviewItem[] }>('/api/reviews/admin');
  },
  createReview: async (payload: {
    username: string;
    userId?: string;
    orderId?: string;
    fabricId?: string;
    fabricName?: string;
    garment?: string;
    rating: number;
    title: string;
    comment: string;
  }): Promise<{ data: ReviewItem }> => {
    return request<{ data: ReviewItem }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateStatus: async (
    id: string,
    status: 'approved' | 'pending' | 'flagged',
  ): Promise<{ data: ReviewItem }> => {
    return request<{ data: ReviewItem }>(`/api/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  deleteReview: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/api/reviews/${id}`, { method: 'DELETE' });
  },
};
