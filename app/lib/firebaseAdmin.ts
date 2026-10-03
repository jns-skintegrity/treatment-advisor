import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getFirebaseAdminApp() {
  const appName = 'skintegrity-membership-admin';
  const existingApp = getApps().find((app) => app.name === appName);
  if (existingApp) return existingApp;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
  }

  const serviceAccountData: unknown = JSON.parse(serviceAccountJson);
  if (
    typeof serviceAccountData !== 'object' ||
    serviceAccountData === null ||
    !('project_id' in serviceAccountData) ||
    !('client_email' in serviceAccountData) ||
    !('private_key' in serviceAccountData) ||
    typeof serviceAccountData.project_id !== 'string' ||
    typeof serviceAccountData.client_email !== 'string' ||
    typeof serviceAccountData.private_key !== 'string'
  ) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is invalid.');
  }

  const serviceAccount: ServiceAccount = {
    projectId: serviceAccountData.project_id,
    clientEmail: serviceAccountData.client_email,
    privateKey: serviceAccountData.private_key.replace(/\\n/g, '\n'),
  };

  return initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    },
    appName
  );
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}
