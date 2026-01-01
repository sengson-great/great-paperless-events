// lib/admin.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export const setUserRole = async (uid: string, role: 'admin' | 'user') => {
  const setRole = httpsCallable(functions, 'setUserRole');
  await setRole({ uid, role });
};