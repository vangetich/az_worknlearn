import {
  getAdminTotpConfig,
  verifyTotpCode,
  markAdminTotpSessionAuthorized,
} from './totpSecurity';

// ============================================================================
// ADMIN ROUTE PROTECTION LAYER & HARDCODED WHITELIST GUARD + 2FA TOTP GATE
// Restricts access to Admin DB, User Accounts, Password Resets, Cloud Sync,
// M-Pesa Daraja Management, and Curriculum Readiness features.
// ============================================================================

export const ADMIN_EMAIL_WHITELIST: readonly string[] = [
  'vangetich@gmail.com',
] as const;

export const PRIMARY_ADMIN_EMAIL = 'vangetich@gmail.com';

/**
 * Checks whether an email address matches the hardcoded administrative whitelist.
 */
export function isWhitelistedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAIL_WHITELIST.some((allowed) => allowed.toLowerCase() === normalized);
}


/**
 * Validates email whitelist membership, admin password credentials, and
 * the mandatory Time-Based One-Time Password (TOTP) 2FA code against
 * the Admin Route Protection Layer (`/api/admin/verify-access`).
 */
export async function verifyAdminRouteCredentials(params: {
  email: string;
  password?: string;
  totpCode?: string;
}): Promise<{
  authorized: boolean;
  email: string;
  message: string;
  reason?: string;
  user?: any;
  token?: string;
}> {
  const cleanEmail = (params.email || '').trim().toLowerCase();

  if (!isWhitelistedAdminEmail(cleanEmail)) {
    const msg = `Access Denied: "${cleanEmail || 'anonymous'}" is not in the authorized administrator whitelist.`;
    return {
      authorized: false,
      email: cleanEmail,
      message: msg,
      reason: msg,
    };
  }

  const cleanTotp = (params.totpCode || '').replace(/\s+/g, '').trim();
  const adminTotpConfig = getAdminTotpConfig();

  if (!cleanTotp || !/^\d{6}$/.test(cleanTotp)) {
    const msg =
      'Admin 2FA Required: Please enter the 6-digit Time-Based One-Time Password (TOTP) from your authenticator to authorize Admin Console access.';
    return {
      authorized: false,
      email: cleanEmail,
      message: msg,
      reason: msg,
    };
  }

  const isTotpValid = verifyTotpCode(adminTotpConfig.secret, cleanTotp);
  if (!isTotpValid) {
    const msg =
      'Invalid or expired 6-digit Admin TOTP code. Please verify your authenticator clock (30-second window) and try again.';
    return {
      authorized: false,
      email: cleanEmail,
      message: msg,
      reason: msg,
    };
  }

  try {
    const res = await fetch('/api/admin/verify-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': cleanEmail,
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: params.password,
        totpCode: cleanTotp,
        totpSecret: adminTotpConfig.secret,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.authorized) {
      const msg =
        data.reason ||
        data.error ||
        data.message ||
        'Invalid administrator password or 2FA TOTP credentials.';
      return {
        authorized: false,
        email: cleanEmail,
        message: msg,
        reason: msg,
      };
    }

    markAdminTotpSessionAuthorized(cleanEmail, 30);

    return {
      authorized: true,
      email: cleanEmail,
      message: data.message || 'Authorized via Admin Whitelist Guard + 2FA TOTP Verification.',
      user: data.user,
      token: data.token,
    };
  } catch (err: any) {
    const msg = err.message || 'Failed to verify administrator credentials with server.';
    return {
      authorized: false,
      email: cleanEmail,
      message: msg,
      reason: msg,
    };
  }
}

