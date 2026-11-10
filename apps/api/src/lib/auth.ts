import mongoose from 'mongoose';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { emailOTP } from 'better-auth/plugins';
import { emailService } from '../services/email.service.js';

function buildBetterAuth() {
  const client = mongoose.connection.getClient();
  const db = client.db();

  const googleClientId = process.env['GOOGLE_CLIENT_ID']?.trim() ?? '';
  const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET']?.trim() ?? '';

  const secret =
    process.env['BETTER_AUTH_SECRET'] ??
    process.env['JWT_SECRET'] ??
    'customization-atelier-better-auth-secret-key-2026';

  const port = process.env['PORT'] ?? '3001';
  const baseURL = process.env['BETTER_AUTH_URL'] ?? `http://localhost:${port}`;

  const trustedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env['CLIENT_URL'] ?? '',
  ].filter(Boolean);

  return betterAuth({
    database: mongodbAdapter(db, { transaction: false }),
    basePath: '/api/auth',
    secret,
    baseURL,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    ...(googleClientId && googleClientSecret
      ? {
          socialProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          },
        }
      : {}),
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        async sendVerificationOTP({ email, otp, type }) {
          const purpose =
            type === 'forget-password'
              ? 'forget-password'
              : type === 'sign-in'
                ? 'sign-in'
                : 'email-verification';
          await emailService.sendOtpEmail(email, otp, purpose);
        },
      }),
    ],
  });
}

export type BetterAuthInstance = ReturnType<typeof buildBetterAuth>;

let cachedAuth: BetterAuthInstance | null = null;

export function getAuth(): BetterAuthInstance {
  if (!cachedAuth) {
    cachedAuth = buildBetterAuth();
  }
  return cachedAuth;
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env['GOOGLE_CLIENT_ID']?.trim() && process.env['GOOGLE_CLIENT_SECRET']?.trim(),
  );
}
