// ============================================================================
// ADMIN ROUTE PROTECTION LAYER & HARDCODED WHITELIST GUARD
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
 * Validates both email whitelist membership and admin password credentials
 * against the backend security layer (`/api/admin/verify-access`).
 */
export async function verifyAdminRouteCredentials(params: {
  email: string;
  password?: string;
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
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.authorized) {
      const msg = data.reason || data.error || data.message || 'Invalid administrator password credentials.';
      return {
        authorized: false,
        email: cleanEmail,
        message: msg,
        reason: msg,
      };
    }

    return {
      authorized: true,
      email: cleanEmail,
      message: data.message || 'Authorized via Admin Whitelist Guard.',
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
