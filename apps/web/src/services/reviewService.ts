import { reviewApi, type ReviewItem, type ReviewStats } from './api';

export type { ReviewItem, ReviewStats };

export const reviewService = {
  getReviews: async (params?: {
    fabricId?: string;
    orderId?: string;
    limit?: number;
  }): Promise<{ data: ReviewItem[]; stats?: ReviewStats }> => {
    return reviewApi.getReviews(params);
  },

  getFabricReviews: async (
    fabricId: string,
  ): Promise<{ data: ReviewItem[]; stats?: ReviewStats }> => {
    return reviewApi.getReviews({ fabricId });
  },

  getUserReviews: async (): Promise<{ data: ReviewItem[] }> => {
    // Falls back to getReviews with user filter if needed
    try {
      const res = await fetch('/api/reviews/user', {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('jojo_token')
            ? { Authorization: `Bearer ${localStorage.getItem('jojo_token')}` }
            : {}),
        },
      });
      if (res.ok) {
        return (await res.json()) as { data: ReviewItem[] };
      }
    } catch {
      // ignore
    }
    return { data: [] };
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
    return reviewApi.createReview(payload);
  },

  getAdminReviews: async (): Promise<{ data: ReviewItem[] }> => {
    return reviewApi.getAdminReviews();
  },

  updateStatus: async (
    id: string,
    status: 'approved' | 'pending' | 'flagged',
  ): Promise<{ data: ReviewItem }> => {
    return reviewApi.updateStatus(id, status);
  },

  deleteReview: async (id: string): Promise<{ message: string }> => {
    return reviewApi.deleteReview(id);
  },
};
