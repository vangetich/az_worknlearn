import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  Auth,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  ensureCloudUserProfile,
  FirebaseUser,
} from '../lib/firebase';

export type LearnerRole = 'student' | 'bootcamp_admin' | 'enterprise_user';

export interface BackendUserProfile {
  id: string;
  firebase_uid?: string;
  email: string;
  full_name: string;
  role: LearnerRole;
  is_premium: boolean;
  unlocked_modules: number[];
  created_at: string;
}

export interface AuthSessionResult {
  user: BackendUserProfile;
  token: string;
  firebaseUser: FirebaseUser | null;
  firebaseIdToken: string | null;
  authProvider: 'firebase_google' | 'firebase_email' | 'backend_session';
  progress_summary?: {
    overall_mastery_score: number;
    mastered_modules_count: number;
    in_progress_modules_count: number;
    not_started_modules_count: number;
    total_modules: number;
    total_sessions_completed: number;
  };
}

export interface SignupParams {
  email: string;
  password?: string;
  fullName: string;
  role?: LearnerRole;
}

export interface LoginParams {
  email: string;
  password?: string;
  fullName?: string;
  role?: LearnerRole;
}

const BACKEND_TOKEN_STORAGE_KEY = 'az900_backend_token';
const BACKEND_USER_STORAGE_KEY = 'az900_backend_user';

/**
 * Dedicated Authentication Service Layer linked to the existing `auth` instance
 * from `src/lib/firebase.ts`. Coordinates Firebase Auth (Google OAuth & Email/Password),
 * Cloud Firestore user profile provisioning, and Backend API JWT session exchange.
 */
class FirebaseBackendAuthService {
  public readonly authInstance: Auth;

  constructor(firebaseAuthInstance: Auth) {
    this.authInstance = firebaseAuthInstance;
  }

  /**
   * Returns the currently authenticated Firebase user from the linked `auth` instance.
   */
  public getCurrentFirebaseUser(): FirebaseUser | null {
    return this.authInstance.currentUser;
  }

  /**
   * Retrieves a fresh Firebase ID Token (JWT) from the linked `auth` instance if signed in.
   */
  public async getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
    const currentUser = this.authInstance.currentUser;
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch (err) {
      console.warn('Could not refresh Firebase ID token:', err);
      return null;
    }
  }

  /**
   * Builds authorization headers linking Firebase ID token / UID and Backend session token.
   */
  public async getAuthHeaders(fallbackUserId?: string): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const firebaseToken = await this.getFirebaseIdToken();
    const storedBackendToken = this.getStoredBackendToken();
    const effectiveBearer = firebaseToken || storedBackendToken;

    if (effectiveBearer) {
      headers['Authorization'] = `Bearer ${effectiveBearer}`;
    }

    const activeUid =
      this.authInstance.currentUser?.uid ||
      this.getStoredBackendUser()?.id ||
      fallbackUserId;

    if (activeUid) {
      headers['x-user-id'] = activeUid;
    }

    if (this.authInstance.currentUser?.uid) {
      headers['x-firebase-uid'] = this.authInstance.currentUser.uid;
    }

    return headers;
  }

  /**
   * Registers a new learner using Firebase Auth (when password is provided)
   * and synchronizes the account with `POST /api/auth/signup`.
   */
  public async signup(params: SignupParams): Promise<AuthSessionResult> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.fullName.trim() || cleanEmail.split('@')[0] || 'AZ-900 Learner';
    const role: LearnerRole = params.role || 'student';

    let fbUser: FirebaseUser | null = this.authInstance.currentUser;
    let fbIdToken: string | null = null;
    let providerType: AuthSessionResult['authProvider'] = 'backend_session';

    if (params.password && params.password.trim().length >= 6) {
      try {
        const cred = await createUserWithEmailAndPassword(
          this.authInstance,
          cleanEmail,
          params.password.trim()
        );
        fbUser = cred.user;
        await updateProfile(fbUser, { displayName: cleanName });
        await ensureCloudUserProfile(fbUser, cleanName);
        fbIdToken = await fbUser.getIdToken();
        providerType = 'firebase_email';
      } catch (fbErr: any) {
        // If email already exists in Firebase Auth, attempt sign-in with the provided password
        if (fbErr?.code === 'auth/email-already-in-use') {
          try {
            const signInCred = await signInWithEmailAndPassword(
              this.authInstance,
              cleanEmail,
              params.password.trim()
            );
            fbUser = signInCred.user;
            await ensureCloudUserProfile(fbUser, cleanName);
            fbIdToken = await fbUser.getIdToken();
            providerType = 'firebase_email';
          } catch {
            // Fall through to backend signup exchange if password mismatch or provider disabled
          }
        }
      }
    } else if (fbUser) {
      await ensureCloudUserProfile(fbUser, cleanName);
      fbIdToken = await this.getFirebaseIdToken();
      providerType = 'firebase_google';
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (fbIdToken) {
      headers['Authorization'] = `Bearer ${fbIdToken}`;
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        uid: fbUser?.uid,
        firebase_uid: fbUser?.uid,
        email: cleanEmail,
        full_name: cleanName,
        role,
        firebase_token: fbIdToken,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to register learner on backend.');
    }

    const sessionToken = fbIdToken || data.token;
    this.persistSession(sessionToken, data.user);

    return {
      user: data.user,
      token: sessionToken,
      firebaseUser: fbUser,
      firebaseIdToken: fbIdToken,
      authProvider: providerType,
      progress_summary: data.progress_summary,
    };
  }

  /**
   * Authenticates an existing learner with Firebase Auth and `POST /api/auth/login`.
   */
  public async login(params: LoginParams): Promise<AuthSessionResult> {
    const cleanEmail = params.email.trim().toLowerCase();
    const role: LearnerRole = params.role || 'student';

    let fbUser: FirebaseUser | null = this.authInstance.currentUser;
    let fbIdToken: string | null = null;
    let providerType: AuthSessionResult['authProvider'] = 'backend_session';

    if (params.password && params.password.trim().length >= 6) {
      try {
        const cred = await signInWithEmailAndPassword(
          this.authInstance,
          cleanEmail,
          params.password.trim()
        );
        fbUser = cred.user;
        await ensureCloudUserProfile(fbUser, params.fullName);
        fbIdToken = await fbUser.getIdToken();
        providerType = 'firebase_email';
      } catch {
        // Fallback to backend session login if Email/Password provider is not enabled in Firebase console
      }
    } else if (fbUser && fbUser.email?.toLowerCase() === cleanEmail) {
      fbIdToken = await this.getFirebaseIdToken();
      providerType = 'firebase_google';
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (fbIdToken) {
      headers['Authorization'] = `Bearer ${fbIdToken}`;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        uid: fbUser?.uid,
        firebase_uid: fbUser?.uid,
        email: cleanEmail,
        full_name: params.fullName || fbUser?.displayName || cleanEmail.split('@')[0],
        role,
        firebase_token: fbIdToken,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to authenticate learner with backend.');
    }

    const sessionToken = fbIdToken || data.token;
    this.persistSession(sessionToken, data.user);

    return {
      user: data.user,
      token: sessionToken,
      firebaseUser: fbUser,
      firebaseIdToken: fbIdToken,
      authProvider: providerType,
      progress_summary: data.progress_summary,
    };
  }

  /**
   * Authenticates the learner via Google OAuth Popup on the linked `auth` instance,
   * provisions their Firestore profile, and links their session with `POST /api/auth/login`.
   */
  public async loginWithGoogle(role: LearnerRole = 'student'): Promise<AuthSessionResult> {
    const result = await signInWithPopup(this.authInstance, googleProvider);
    const fbUser = result.user;

    await ensureCloudUserProfile(fbUser);
    const fbIdToken = await fbUser.getIdToken();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fbIdToken}`,
      },
      body: JSON.stringify({
        uid: fbUser.uid,
        firebase_uid: fbUser.uid,
        email: fbUser.email || 'learner@az900.studio',
        full_name: fbUser.displayName || 'AZ-900 Cloud Learner',
        role,
        firebase_token: fbIdToken,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to synchronize Google account with backend.');
    }

    const sessionToken = fbIdToken || data.token;
    this.persistSession(sessionToken, data.user);

    return {
      user: data.user,
      token: sessionToken,
      firebaseUser: fbUser,
      firebaseIdToken: fbIdToken,
      authProvider: 'firebase_google',
      progress_summary: data.progress_summary,
    };
  }

  /**
   * Signs out from the linked Firebase `auth` instance and clears the backend session.
   */
  public async logout(): Promise<void> {
    try {
      await signOut(this.authInstance);
    } finally {
      this.clearPersistedSession();
    }
  }

  /**
   * Subscribes to real-time authentication state changes on the linked `auth` instance.
   */
  public subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(this.authInstance, callback);
  }

  public getStoredBackendToken(): string {
    try {
      return localStorage.getItem(BACKEND_TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  public getStoredBackendUser(): BackendUserProfile | null {
    try {
      const raw = localStorage.getItem(BACKEND_USER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BackendUserProfile) : null;
    } catch {
      return null;
    }
  }

  private persistSession(token: string, user: BackendUserProfile): void {
    try {
      if (token) localStorage.setItem(BACKEND_TOKEN_STORAGE_KEY, token);
      if (user) localStorage.setItem(BACKEND_USER_STORAGE_KEY, JSON.stringify(user));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('az900-auth-session-change', { detail: { user, token } })
        );
      }
    } catch {
      // ignore storage errors
    }
  }

  private clearPersistedSession(): void {
    try {
      localStorage.removeItem(BACKEND_TOKEN_STORAGE_KEY);
      localStorage.removeItem(BACKEND_USER_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('az900-auth-session-change', { detail: { user: null, token: null } })
        );
      }
    } catch {
      // ignore storage errors
    }
  }
}

// Export singleton bound directly to the existing `auth` instance in `src/lib/firebase.ts`
export const authService = new FirebaseBackendAuthService(auth);
