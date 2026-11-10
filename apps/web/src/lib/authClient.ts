import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';
import { API_BASE_URL } from '../services/api';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  basePath: '/api/auth',
  plugins: [emailOTPClient()],
});
