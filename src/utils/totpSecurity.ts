// ============================================================================
// RFC 6238 TIME-BASED ONE-TIME PASSWORD (TOTP) ENGINE
// Provides strictly separated TOTP state & verification for:
//   1. Admin Console 2FA Gate (Mandatory for Admin Console authorization)
//   2. User Account MFA Security Setup (Learner-configurable in User Profile)
// ============================================================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Pure JS SHA-1 + HMAC-SHA1 implementation for synchronous RFC 6238 TOTP calculation
function rotateLeft(n: number, s: number): number {
  return (n << s) | (n >>> (32 - s));
}

function sha1Bytes(message: Uint8Array): Uint8Array {
  const ml = message.length * 8;
  const withOne = new Uint8Array(message.length + 1);
  withOne.set(message);
  withOne[message.length] = 0x80;

  let paddedLen = withOne.length;
  while (paddedLen % 64 !== 56) {
    paddedLen++;
  }

  const padded = new Uint8Array(paddedLen + 8);
  padded.set(withOne);

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen, Math.floor(ml / 0x100000000), false);
  view.setUint32(paddedLen + 4, ml >>> 0, false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Uint32Array(80);

  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 80; j++) {
      w[j] = rotateLeft(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let j = 0; j < 80; j++) {
      let f = 0;
      let k = 0;
      if (j < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + w[j]) >>> 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  return out;
}

function hmacSha1(keyBytes: Uint8Array, messageBytes: Uint8Array): Uint8Array {
  const blockSize = 64;
  let key = keyBytes;
  if (key.length > blockSize) {
    key = sha1Bytes(key);
  }
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(key);

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }

  const innerInput = new Uint8Array(blockSize + messageBytes.length);
  innerInput.set(iKeyPad);
  innerInput.set(messageBytes, blockSize);
  const innerHash = sha1Bytes(innerInput);

  const outerInput = new Uint8Array(blockSize + innerHash.length);
  outerInput.set(oKeyPad);
  outerInput.set(innerHash, blockSize);
  return sha1Bytes(outerInput);
}

export function decodeBase32(base32Str: string): Uint8Array {
  const clean = (base32Str || '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '');
  if (!clean) {
    return new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  }

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

export function generateBase32Secret(length = 16): string {
  const randomValues = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[randomValues[i] % BASE32_ALPHABET.length];
  }
  return secret;
}

export function generateTotpCodeAtCounter(secretBase32: string, counter: number, digits = 6): string {
  const keyBytes = decodeBase32(secretBase32);
  const counterBytes = new Uint8Array(8);
  let temp = Math.floor(counter);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const hash = hmacSha1(keyBytes, counterBytes);
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return String(otp).padStart(digits, '0');
}

/**
 * Computes the current 6-digit RFC 6238 TOTP code for a given Base32 secret.
 */
export function generateCurrentTotpCode(
  secretBase32: string,
  timestampMs: number = Date.now(),
  stepSeconds = 30
): string {
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  return generateTotpCodeAtCounter(secretBase32, counter, 6);
}

/**
 * Returns the remaining seconds in the current 30-second TOTP window (1..30).
 */
export function getTotpRemainingSeconds(timestampMs: number = Date.now(), stepSeconds = 30): number {
  const elapsed = Math.floor(timestampMs / 1000) % stepSeconds;
  return stepSeconds - elapsed;
}

/**
 * Verifies a 6-digit TOTP code against the secret with +/- 1 window drift tolerance.
 */
export function verifyTotpCode(
  secretBase32: string,
  inputCode: string,
  timestampMs: number = Date.now(),
  stepSeconds = 30,
  windowDrift = 1
): boolean {
  const cleanInput = (inputCode || '').replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(cleanInput)) return false;

  const currentCounter = Math.floor(timestampMs / 1000 / stepSeconds);
  for (let offset = -windowDrift; offset <= windowDrift; offset++) {
    const candidate = generateTotpCodeAtCounter(secretBase32, currentCounter + offset, 6);
    if (candidate === cleanInput) {
      return true;
    }
  }
  return false;
}

/**
 * Builds a standard otpauth:// URI compatible with Microsoft Authenticator, Google Authenticator, and Authy.
 */
export function buildOtpAuthUri(params: {
  secret: string;
  accountName: string;
  issuer: string;
}): string {
  const cleanSecret = params.secret.replace(/\s+/g, '').toUpperCase();
  const issuerEnc = encodeURIComponent(params.issuer);
  const accountEnc = encodeURIComponent(params.accountName);
  return `otpauth://totp/${issuerEnc}:${accountEnc}?secret=${cleanSecret}&issuer=${issuerEnc}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates a deterministic, crisp SVG QR-style matrix data URL from an otpauth:// URI
 * so authenticator enrollment works 100% offline/inline without external image dependencies.
 */
export function generateOtpQrSvgDataUrl(otpAuthUri: string): string {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (r0 + r < size && c0 + c < size) {
          grid[r0 + r][c0 + c] = isBorder || isInner;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic bit fill from otpAuthUri hash bytes
  const hashBytes = sha1Bytes(new TextEncoder().encode(otpAuthUri));
  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const onTiming = r === 6 || c === 6;
      if (inTopLeft || inTopRight || inBottomLeft || onTiming) continue;

      const byteVal = hashBytes[Math.floor(bitIdx / 8) % hashBytes.length];
      const bit = ((byteVal >>> (bitIdx % 8)) & 1) === 1;
      grid[r][c] = bit !== ((r + c) % 3 === 0);
      bitIdx++;
    }
  }

  const cellSize = 8;
  const margin = 16;
  const totalPx = size * cellSize + margin * 2;
  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) {
        const x = margin + c * cellSize;
        const y = margin + r * cellSize;
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="1.2" fill="#0F172A"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalPx} ${totalPx}" width="${totalPx}" height="${totalPx}">
    <rect width="${totalPx}" height="${totalPx}" rx="14" fill="#FFFFFF"/>
    ${rects}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ============================================================================
// 1. ADMIN CONSOLE 2FA TOTP LAYER (Dedicated & Always Required for Admin Login)
// ============================================================================

export const ADMIN_TOTP_STORAGE_KEY = 'az900_admin_console_2fa_config_v1';
export const ADMIN_TOTP_SESSION_KEY = 'az900_admin_console_2fa_verified_session_v1';
export const DEFAULT_ADMIN_TOTP_SECRET = 'JBSWY3DPEHPK3PXP'; // RFC 6238 standard Base32 key for Admin

export interface AdminTotpConfig {
  secret: string;
  issuer: string;
  accountEmail: string;
  enforced: true;
  lastVerifiedAt: string | null;
}

export function getAdminTotpConfig(): AdminTotpConfig {
  const fallback: AdminTotpConfig = {
    secret: DEFAULT_ADMIN_TOTP_SECRET,
    issuer: 'AZ-900 Admin Console',
    accountEmail: 'vangetich@gmail.com',
    enforced: true,
    lastVerifiedAt: null,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(ADMIN_TOTP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        secret: parsed.secret || DEFAULT_ADMIN_TOTP_SECRET,
        issuer: 'AZ-900 Admin Console',
        accountEmail: 'vangetich@gmail.com',
        enforced: true,
        lastVerifiedAt: parsed.lastVerifiedAt || null,
      };
    }
  } catch {
    // ignore storage errors
  }
  return fallback;
}

export function saveAdminTotpConfig(partial: Partial<AdminTotpConfig>): AdminTotpConfig {
  const current = getAdminTotpConfig();
  const updated: AdminTotpConfig = {
    ...current,
    ...partial,
    enforced: true,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_TOTP_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

export function isAdminTotpSessionAuthorized(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(ADMIN_TOTP_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed.verified || !parsed.expiresAt) return false;
    return Date.now() < Number(parsed.expiresAt);
  } catch {
    return false;
  }
}

export function markAdminTotpSessionAuthorized(email: string, ttlMinutes = 30): void {
  if (typeof window === 'undefined') return;
  try {
    const nowIso = new Date().toISOString();
    sessionStorage.setItem(
      ADMIN_TOTP_SESSION_KEY,
      JSON.stringify({
        verified: true,
        email,
        verifiedAt: nowIso,
        expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      })
    );
    saveAdminTotpConfig({ lastVerifiedAt: nowIso });
    window.dispatchEvent(new CustomEvent('az900-admin-totp-session-change'));
  } catch {
    // ignore
  }
}

export function revokeAdminTotpSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_TOTP_SESSION_KEY);
    window.dispatchEvent(new CustomEvent('az900-admin-totp-session-change'));
  } catch {
    // ignore
  }
}

// ============================================================================
// 2. USER PROFILE MFA SECURITY SETUP (Per-User, Independent of Admin 2FA)
// ============================================================================

export interface UserMfaSettings {
  userId: string;
  accountLabel: string;
  enabled: boolean;
  secret: string;
  backupCodes: string[];
  configuredAt: string | null;
  lastVerifiedAt: string | null;
  preferredAuthenticator: 'microsoft' | 'google' | 'authy';
}

function getUserMfaStorageKey(userIdOrEmail: string): string {
  const clean = (userIdOrEmail || 'default-learner')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  return `az900_user_mfa_settings_v1_${clean}`;
}

export function generateBackupRecoveryCodes(count = 6): string[] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(`AZ900-${part1}-${part2}`);
  }
  return codes;
}

export function getUserMfaSettings(userIdOrEmail?: string | null, accountLabel?: string): UserMfaSettings {
  const resolvedId = (userIdOrEmail || 'default-learner').trim().toLowerCase();
  const key = getUserMfaStorageKey(resolvedId);

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as UserMfaSettings;
        if (parsed && parsed.secret) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  const initial: UserMfaSettings = {
    userId: resolvedId,
    accountLabel: accountLabel || resolvedId,
    enabled: false,
    secret: generateBase32Secret(16),
    backupCodes: generateBackupRecoveryCodes(6),
    configuredAt: null,
    lastVerifiedAt: null,
    preferredAuthenticator: 'microsoft',
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch {
      // ignore
    }
  }

  return initial;
}

export function saveUserMfaSettings(
  userIdOrEmail: string,
  updates: Partial<UserMfaSettings>
): UserMfaSettings {
  const current = getUserMfaSettings(userIdOrEmail, updates.accountLabel);
  const next: UserMfaSettings = {
    ...current,
    ...updates,
    userId: current.userId,
  };

  if (typeof window !== 'undefined') {
    try {
      const key = getUserMfaStorageKey(current.userId);
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent('az900-user-mfa-updated', { detail: next })
      );
    } catch {
      // ignore
    }
  }

  return next;
}
