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
  onSnapshot,
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
    tenantId?: boolean | string | null;
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
  if (!auth.currentUser) return;
  try {
    await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    void testConnection();
  }
});

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
      // Conflict-free cross-platform merge: preserve highest score across simultaneous mobile + laptop sessions
      const prevData = existingSnap.data();
      const prevScore = typeof prevData?.score === 'number' ? prevData.score : 0;
      const mergedScore = Math.max(prevScore, clampedScore);
      const mergedStatus: 'not_started' | 'in_progress' | 'mastered' =
        mergedScore >= 80 || prevData?.status === 'mastered' || status === 'mastered'
          ? 'mastered'
          : mergedScore > 0 || status === 'in_progress'
          ? 'in_progress'
          : 'not_started';

      await updateDoc(ref, {
        score: mergedScore,
        status: mergedStatus,
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

/**
 * Real-time cross-device Firestore listener (`onSnapshot`) for simultaneous
 * mobile + laptop study sessions by the same authenticated user.
 */
export function subscribeToCrossDeviceProgress(
  userId: string,
  onProgressUpdate: (
    records: Array<{
      moduleId: number;
      score: number;
      status: 'not_started' | 'in_progress' | 'mastered';
    }>
  ) => void
): () => void {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
  const path = 'user_progress';
  const q = query(collection(db, path), where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            moduleId: Number(data.moduleId) || 1,
            score: Number(data.score) || 0,
            status: (data.status || 'not_started') as
              | 'not_started'
              | 'in_progress'
              | 'mastered',
          };
        })
        .filter((r) => r.moduleId >= 1 && r.moduleId <= 12);
      onProgressUpdate(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );

  return unsubscribe;
}

export type CanonicalChamberRoomId =
  | 'AZ900-CONCEPTS'
  | 'AZ900-SERVICES'
  | 'AZ900-SECURITY'
  | 'AZ900-GOVERNANCE'
  | 'AZ900-WAR-ROOM'
  | 'AZ900-CLINIC';

export interface FirestoreStudyChamberCheckin {
  id: string;
  userId: string;
  roomId: CanonicalChamberRoomId;
  questionsSolved: number;
  correctCount: number;
  handoffsResolved: number;
  lastNotes: string;
}

export interface FirestoreStudyChamberHandoff {
  id: string;
  userId: string;
  fromRoomId: CanonicalChamberRoomId;
  toRoomId: CanonicalChamberRoomId;
  questionId: string;
  title: string;
  note: string;
  resolved: boolean;
}

const CANONICAL_CHAMBERS: Set<string> = new Set([
  'AZ900-CONCEPTS',
  'AZ900-SERVICES',
  'AZ900-SECURITY',
  'AZ900-GOVERNANCE',
  'AZ900-WAR-ROOM',
  'AZ900-CLINIC',
]);

export async function syncStudyChamberCheckinToFirestore(
  userId: string,
  roomId: string,
  delta: {
    solvedDelta?: number;
    correctDelta?: number;
    handoffsResolvedDelta?: number;
    lastNotes?: string;
  }
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  if (!CANONICAL_CHAMBERS.has(roomId)) return;

  const docId = `${userId}_${roomId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `study_chamber_checkins/${docId}`;
  const ref = doc(db, 'study_chamber_checkins', docId);

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      const solved = Math.max(0, Math.min(10000, delta.solvedDelta || 0));
      const correct = Math.max(0, Math.min(solved, delta.correctDelta || 0));
      const resolved = Math.max(0, Math.min(10000, delta.handoffsResolvedDelta || 0));
      const notes = (delta.lastNotes || '').slice(0, 1200);

      await setDoc(ref, {
        userId,
        roomId,
        questionsSolved: solved,
        correctCount: correct,
        handoffsResolved: resolved,
        lastNotes: notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const prev = existingSnap.data();
      const prevSolved = typeof prev?.questionsSolved === 'number' ? prev.questionsSolved : 0;
      const prevCorrect = typeof prev?.correctCount === 'number' ? prev.correctCount : 0;
      const prevResolved = typeof prev?.handoffsResolved === 'number' ? prev.handoffsResolved : 0;

      const nextSolved = Math.max(0, Math.min(10000, prevSolved + (delta.solvedDelta || 0)));
      const nextCorrect = Math.max(
        0,
        Math.min(nextSolved, prevCorrect + (delta.correctDelta || 0))
      );
      const nextResolved = Math.max(
        0,
        Math.min(10000, prevResolved + (delta.handoffsResolvedDelta || 0))
      );
      const nextNotes =
        delta.lastNotes !== undefined
          ? delta.lastNotes.slice(0, 1200)
          : String(prev?.lastNotes || '').slice(0, 1200);

      await updateDoc(ref, {
        questionsSolved: nextSolved,
        correctCount: nextCorrect,
        handoffsResolved: nextResolved,
        lastNotes: nextNotes,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveStudyChamberHandoffToFirestore(
  userId: string,
  handoff: {
    id: string;
    fromRoomId: string;
    toRoomId: string;
    questionId: string;
    title: string;
    note: string;
  }
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  if (!CANONICAL_CHAMBERS.has(handoff.fromRoomId) || !CANONICAL_CHAMBERS.has(handoff.toRoomId)) {
    return;
  }
  const safeId = `${userId}_${handoff.id}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `study_chamber_handoffs/${safeId}`;
  const ref = doc(db, 'study_chamber_handoffs', safeId);

  try {
    await setDoc(ref, {
      userId,
      fromRoomId: handoff.fromRoomId,
      toRoomId: handoff.toRoomId,
      questionId: (handoff.questionId || 'general').slice(0, 128),
      title: (handoff.title || 'Chamber Handoff').slice(0, 140),
      note: (handoff.note || '').slice(0, 600),
      resolved: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resolveStudyChamberHandoffInFirestore(
  userId: string,
  docId: string,
  resolved: boolean
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const safeId = docId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `study_chamber_handoffs/${safeId}`;
  const ref = doc(db, 'study_chamber_handoffs', safeId);

  try {
    await updateDoc(ref, {
      resolved,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToStudyChamberCheckins(
  userId: string,
  onUpdate: (checkins: Record<string, FirestoreStudyChamberCheckin>) => void
): () => void {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
  const path = 'study_chamber_checkins';
  const q = query(collection(db, path), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const map: Record<string, FirestoreStudyChamberCheckin> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const roomId = String(data.roomId || '') as CanonicalChamberRoomId;
        if (CANONICAL_CHAMBERS.has(roomId)) {
          map[roomId] = {
            id: d.id,
            userId: String(data.userId || userId),
            roomId,
            questionsSolved: Number(data.questionsSolved) || 0,
            correctCount: Number(data.correctCount) || 0,
            handoffsResolved: Number(data.handoffsResolved) || 0,
            lastNotes: String(data.lastNotes || ''),
          };
        }
      });
      onUpdate(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

