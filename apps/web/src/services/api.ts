export const API_BASE_URL: string =
  (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? 'http://localhost:3001';

const TOKEN_KEY = 'jojo_token';
const SESSION_KEY = 'jojo_session_user';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined> | undefined;
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

  // Attach username & email headers as backup identification
  const sessionRaw = localStorage.getItem(SESSION_KEY);
  if (sessionRaw) {
    try {
      const parsed = JSON.parse(sessionRaw) as { username?: string; email?: string; role?: string };
      if (parsed.username) {
        headers['x-username'] = parsed.username;
      }
      if (parsed.email) {
        headers['x-email'] = parsed.email;
      }
      if (parsed.role === 'admin' || parsed.username === 'admin') {
        headers['x-admin'] = 'true';
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...fetchOptions,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data: unknown = isJson ? await response.json() : null;

  // Auto-capture refreshed JWT from server if provided
  const freshToken = response.headers.get('x-fresh-token');
  if (freshToken) {
    localStorage.setItem(TOKEN_KEY, freshToken);
  }

  if (!response.ok) {
    // If unauthorized and not on login endpoint, remove stale token so fallback kicks in
    if (response.status === 401 && !url.includes('/api/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
    }
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
  referralCode?: string | undefined;
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
  role?: string | undefined;
  emailVerified?: boolean | undefined;
  authProvider?: 'local' | 'google' | undefined;
  avatarUrl?: string | undefined;
  referralCode?: string | undefined;
  referredBy?: string | undefined;
  referralCount?: number | undefined;
  loyaltyCredits?: number | undefined;
}

export interface AuthResponse {
  data: {
    token: string;
    user: AuthUser;
    message?: string | undefined;
  };
}

export interface SignupResponse {
  data: {
    requiresOtp?: boolean | undefined;
    email?: string | undefined;
    emailSent?: boolean | undefined;
    devOtp?: string | undefined;
    message?: string | undefined;
    token?: string | undefined;
    user?: AuthUser | undefined;
  };
}

export interface OtpActionResponse {
  data: {
    email?: string | undefined;
    emailSent?: boolean | undefined;
    devOtp?: string | undefined;
    message: string;
  };
}

export const authApi = {
  getAuthStatus: async (): Promise<{
    data: { googleEnabled: boolean; smtpConfigured: boolean };
  }> => {
    return request('/api/auth/status', { method: 'GET' });
  },

  signup: async (payload: SignupPayload): Promise<SignupResponse> => {
    return request<SignupResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verifyOtp: async (payload: { email: string; otp: string }): Promise<AuthResponse> => {
    const res = await request<AuthResponse>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res;
  },

  resendOtp: async (payload: {
    email: string;
    type?: 'email-verification' | 'forget-password';
  }): Promise<OtpActionResponse> => {
    return request<OtpActionResponse>('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  forgotPassword: async (email: string): Promise<OtpActionResponse> => {
    return request<OtpActionResponse>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (payload: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ data: { message: string } }> => {
    return request<{ data: { message: string } }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  changePassword: async (payload: {
    currentPassword?: string;
    newPassword: string;
  }): Promise<{ data: { message: string } }> => {
    return request<{ data: { message: string } }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getBetterSession: async (): Promise<AuthResponse> => {
    const res = await request<AuthResponse>('/api/auth/better-session', {
      method: 'GET',
    });
    if (res.data.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res;
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

  updateProfile: async (
    payload: Partial<AuthUser>,
  ): Promise<{ data: AuthUser & { token?: string } }> => {
    const res = await request<{ data: AuthUser & { token?: string } }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.data.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res;
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
  statusHistory?: Array<{ status: string; timestamp: string | Date; note?: string }>;
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
    note?: string,
  ): Promise<{ data: OrderItem }> => {
    return request<{ data: OrderItem }>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, trackingNumber, courier, note }),
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
  garments?: unknown[];
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

  updateGarments: async (
    garments: unknown[],
  ): Promise<{ message: string; data: { garments: unknown[] } }> => {
    return request<{ message: string; data: { garments: unknown[] } }>('/api/pricing/garments', {
      method: 'PUT',
      body: JSON.stringify({ garments }),
    });
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
export interface AdminNote {
  note: string;
  addedAt: string;
}

export type CustomerFlag = 'none' | 'VIP' | 'Needs Attention' | 'Blocked';

export interface RegisteredUser {
  _id: string;
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  role: string;
  adminNotes?: AdminNote[];
  flag?: CustomerFlag;
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
  addNote: async (
    userId: string,
    note: string,
  ): Promise<{ data: RegisteredUser; message: string }> => {
    return request<{ data: RegisteredUser; message: string }>(`/api/auth/users/${userId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },
  updateFlag: async (
    userId: string,
    flag: CustomerFlag | null,
  ): Promise<{ data: RegisteredUser; message: string }> => {
    return request<{ data: RegisteredUser; message: string }>(`/api/auth/users/${userId}/flag`, {
      method: 'PATCH',
      body: JSON.stringify({ flag }),
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

// ── Wishlist APIs ─────────────────────────────────────────────────────────
export interface WishlistItem {
  fabricId: string;
  fabricName: string;
  tone: string;
  hex: string;
  pricePerMeter: number;
  addedAt?: string | Date;
}

export interface WishlistData {
  userId: string;
  items: WishlistItem[];
  updatedAt?: string;
}

export const wishlistApi = {
  getWishlist: async (): Promise<{ data: WishlistData }> => {
    return request<{ data: WishlistData }>('/api/wishlist', {
      method: 'GET',
    });
  },

  addItem: async (payload: {
    fabricId: string;
    fabricName: string;
    tone?: string;
    hex?: string;
    pricePerMeter?: number;
  }): Promise<{ data: WishlistData }> => {
    return request<{ data: WishlistData }>('/api/wishlist/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  removeItem: async (fabricId: string): Promise<{ data: WishlistData }> => {
    return request<{ data: WishlistData }>(`/api/wishlist/${fabricId}`, {
      method: 'DELETE',
    });
  },
};

// ── Analytics APIs ────────────────────────────────────────────────────────
export interface DailyOrderStat {
  date: string;
  displayDate: string;
  count: number;
  revenue: number;
}

export interface FabricRevenueStat {
  fabricName: string;
  revenue: number;
  ordersCount: number;
}

export interface GarmentStat {
  garment: string;
  count: number;
  revenue: number;
}

export interface CityStat {
  city: string;
  count: number;
  revenue: number;
}

export interface SalesStats {
  ordersPerDay: DailyOrderStat[];
  revenueByFabric: FabricRevenueStat[];
  topGarments: GarmentStat[];
  ordersByCity: CityStat[];
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export const analyticsApi = {
  getSalesStats: async (): Promise<{ data: SalesStats }> => {
    return request<{ data: SalesStats }>('/api/analytics/sales');
  },
};

// ── Corporate Inquiry APIs ────────────────────────────────────────────────
export type CorporateInquiryStatus = 'New' | 'In Progress' | 'Quoted' | 'Closed';

export interface CorporateInquiryItem {
  _id: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  garmentType: string;
  estimatedQuantity: number;
  deliveryCity: string;
  targetDate: string;
  specialRequirements?: string;
  status: CorporateInquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCorporateInquiryPayload {
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  garmentType: string;
  estimatedQuantity: number;
  deliveryCity: string;
  targetDate: string;
  specialRequirements?: string;
}

export const corporateInquiryApi = {
  submit: async (
    payload: CreateCorporateInquiryPayload,
  ): Promise<{ success: boolean; data: CorporateInquiryItem; message: string }> => {
    return request<{ success: boolean; data: CorporateInquiryItem; message: string }>(
      '/api/corporate-inquiry',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },
  getAll: async (): Promise<{ data: CorporateInquiryItem[] }> => {
    return request<{ data: CorporateInquiryItem[] }>('/api/corporate-inquiry');
  },
  updateStatus: async (
    id: string,
    status: CorporateInquiryStatus,
  ): Promise<{ data: CorporateInquiryItem; message: string }> => {
    return request<{ data: CorporateInquiryItem; message: string }>(
      `/api/corporate-inquiry/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
  },
};

export interface MoodBoardItem {
  _id?: string;
  id?: string;
  imageUrl: string;
  caption: string;
  fabricName: string;
  garmentType: string;
  priceRange: string;
  fabricId?: string | undefined;
  garmentId?: string | undefined;
  active: boolean;
  createdAt?: string | Date;
}

export const moodboardApi = {
  getItems: async (all = false): Promise<{ data: MoodBoardItem[] }> => {
    return request<{ data: MoodBoardItem[] }>('/api/moodboard', {
      params: all ? { all: 'true' } : undefined,
    });
  },
  createItem: async (
    payload: Omit<MoodBoardItem, '_id' | 'id' | 'createdAt'>,
  ): Promise<{ data: MoodBoardItem; message: string }> => {
    return request<{ data: MoodBoardItem; message: string }>('/api/moodboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateItem: async (
    id: string,
    payload: Partial<MoodBoardItem>,
  ): Promise<{ data: MoodBoardItem; message: string }> => {
    return request<{ data: MoodBoardItem; message: string }>(`/api/moodboard/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteItem: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/api/moodboard/${id}`, {
      method: 'DELETE',
    });
  },
};

export interface ReferralStats {
  referralCode: string;
  referralCount: number;
  loyaltyCredits: number;
  referredBy?: string | null;
}

export const referralApi = {
  getCode: async (): Promise<{ data: { referralCode: string } }> => {
    return request<{ data: { referralCode: string } }>('/api/referral/code');
  },

  applyCode: async (
    referralCode: string,
  ): Promise<{ data: { message: string; referrerUsername?: string } }> => {
    return request<{ data: { message: string; referrerUsername?: string } }>(
      '/api/referral/apply',
      {
        method: 'POST',
        body: JSON.stringify({ referralCode }),
      },
    );
  },

  getStats: async (): Promise<{ data: ReferralStats }> => {
    return request<{ data: ReferralStats }>('/api/referral/stats');
  },
};
