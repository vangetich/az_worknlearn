import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/auth and ../lib/firebase before importing authService
vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn().mockReturnValue(() => {}),
}));

vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
  ensureCloudUserProfile: vi.fn().mockResolvedValue(undefined),
}));

import { FirebaseBackendAuthService } from './authService';

describe('Firebase & PostgreSQL Authentication Service (authService)', () => {
  const mockFetch = vi.fn();
  let storageMap: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    storageMap = {};
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storageMap[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        storageMap[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete storageMap[key];
      }),
    });
  });

  it('registers a new learner via POST /api/auth/signup and persists session in localStorage', async () => {
    const fakeAuth: any = { currentUser: null };
    const service = new FirebaseBackendAuthService(fakeAuth);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: 'usr-signup-99',
          email: 'scholar@az900.ke',
          full_name: 'Nairobi Scholar',
          role: 'student',
          is_premium: false,
          unlocked_modules: [1, 2, 3, 4],
        },
        token: 'sess-token-99',
      }),
    });

    const result = await service.signup({
      email: 'Scholar@AZ900.ke ',
      fullName: 'Nairobi Scholar',
      role: 'student',
    });

    expect(result.user.id).toBe('usr-signup-99');
    expect(result.user.email).toBe('scholar@az900.ke');
    expect(service.getStoredBackendToken()).toBe('sess-token-99');
    expect(service.getStoredBackendUser()?.full_name).toBe('Nairobi Scholar');
  });

  it('logs in an existing learner via POST /api/auth/login and builds Bearer auth headers', async () => {
    const fakeAuth: any = {
      currentUser: {
        uid: 'fb-uid-1234',
        getIdToken: vi.fn().mockResolvedValue('firebase-jwt-token-xyz'),
      },
    };
    const service = new FirebaseBackendAuthService(fakeAuth);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: 'fb-uid-1234',
          email: 'architect@az900.ke',
          full_name: 'Cloud Architect',
          role: 'enterprise_user',
          is_premium: true,
          unlocked_modules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        },
        token: 'backend-sess-1234',
      }),
    });

    const loginRes = await service.login({
      email: 'architect@az900.ke',
      role: 'enterprise_user',
    });

    expect(loginRes.user.role).toBe('enterprise_user');
    expect(loginRes.user.is_premium).toBe(true);

    const headers = await service.getAuthHeaders();
    expect(headers['Authorization']).toBe('Bearer firebase-jwt-token-xyz');
    expect(headers['x-user-id']).toBe('fb-uid-1234');
    expect(headers['x-firebase-uid']).toBe('fb-uid-1234');
  });

  it('clears persisted user and token state upon logout', async () => {
    const fakeAuth: any = { currentUser: null };
    const service = new FirebaseBackendAuthService(fakeAuth);

    storageMap['az900_backend_token'] = 'active-token';
    storageMap['az900_backend_user'] = JSON.stringify({
      id: 'usr-1',
      email: 'test@az900.ke',
      full_name: 'Test User',
      role: 'student',
    });

    expect(service.getStoredBackendUser()).not.toBeNull();

    await service.logout();

    expect(service.getStoredBackendToken()).toBe('');
    expect(service.getStoredBackendUser()).toBeNull();
  });
});
