import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await ensureCloudUserProfile(user);
  return user;
}

export async function signOutCloudUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };

export async function ensureCloudUserProfile(
  user: FirebaseUser,
  fullNameOverride?: string
): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const safeEmail = (user.email || 'learner@az900.studio').slice(0, 254);
    const safeName = (
      fullNameOverride ||
      user.displayName ||
      safeEmail.split('@')[0] ||
      'AZ-900 Learner'
    ).slice(0, 120);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: safeEmail,
        fullName: safeName,
        role: 'student',
        isPremium: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (fullNameOverride && fullNameOverride.trim().length > 0) {
      await updateDoc(userRef, {
        fullName: safeName,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function syncModuleProgressToFirestore(
  userId: string,
  moduleId: number,
  score: number,
  status: 'not_started' | 'in_progress' | 'mastered'
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const docId = `${userId}_mod_${moduleId}`;
  const path = `user_progress/${docId}`;
  const ref = doc(db, 'user_progress', docId);
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const clampedMod = Math.max(1, Math.min(12, Math.round(moduleId)));

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        userId,
        moduleId: clampedMod,
        score: clampedScore,
        status,
        lastAttempted: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        score: clampedScore,
        status,
        lastAttempted: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function recordQuizSessionToFirestore(
  userId: string,
  questionsAnswered: number,
  correctCount: number
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const sessionId = `${userId}_sess_${Date.now()}`;
  const path = `quiz_sessions/${sessionId}`;
  const ref = doc(db, 'quiz_sessions', sessionId);
  const clampedTotal = Math.max(1, Math.min(200, Math.round(questionsAnswered)));
  const clampedCorrect = Math.max(0, Math.min(clampedTotal, Math.round(correctCount)));

  try {
    await setDoc(ref, {
      userId,
      questionsAnswered: clampedTotal,
      correctCount: clampedCorrect,
      completedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function recordPendingPaymentToFirestore(
  userId: string,
  gateway: 'mpesa' | 'stripe',
  amount: number,
  currency: 'KES' | 'USD',
  checkoutRequestId: string
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const safeTxId = checkoutRequestId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  const path = `payment_transactions/${safeTxId}`;
  const ref = doc(db, 'payment_transactions', safeTxId);

  try {
    await setDoc(ref, {
      userId,
      gateway,
      amount: Math.max(1, Math.min(1000000, Math.round(amount))),
      currency,
      checkoutRequestId: checkoutRequestId.slice(0, 128),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchUserProgressFromFirestore(userId: string) {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return [];
  const path = 'user_progress';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
