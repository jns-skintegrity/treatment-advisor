import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { DecodedIdToken } from 'firebase-admin/auth';

import DressingAdvisor from './DressingAdvisor';
import { isClinicalAccessAllowed } from './lib/clinicalAccess';
import { getMembershipLoginUrl, SESSION_COOKIE_NAME } from './lib/authConfig';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from './lib/firebaseAdmin';

const INVALID_SESSION_CODES = new Set([
  'auth/argument-error',
  'auth/invalid-session-cookie',
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/user-disabled',
  'auth/user-not-found',
]);

function getErrorCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return error.code;
  }
  return undefined;
}

export default async function Home() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) redirect(getMembershipLoginUrl().toString());

  let decodedSession: DecodedIdToken;
  try {
    decodedSession = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    if (!INVALID_SESSION_CODES.has(String(getErrorCode(error)))) throw error;
    const loginUrl = getMembershipLoginUrl();
    loginUrl.searchParams.set('authError', 'session');
    redirect(loginUrl.toString());
  }

  const memberProfile = await getFirebaseAdminFirestore()
    .collection('users')
    .doc(decodedSession.uid)
    .get();

  if (
    !memberProfile.exists ||
    !isClinicalAccessAllowed(
      decodedSession.email,
      decodedSession.email_verified,
      memberProfile.data() ?? {}
    )
  ) {
    const loginUrl = getMembershipLoginUrl();
    loginUrl.searchParams.set('authError', 'not-authorized');
    redirect(loginUrl.toString());
  }

  return <DressingAdvisor />;
}
