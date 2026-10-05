import { NextRequest, NextResponse } from 'next/server';

import {
  getMembershipLoginUrl,
  MEMBERSHIP_ORIGIN,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '../../../lib/authConfig';
import { isClinicalAccessAllowed } from '../../../lib/clinicalAccess';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '../../../lib/firebaseAdmin';

export const runtime = 'nodejs';

function getFailureRedirect(reason: string) {
  const loginUrl = getMembershipLoginUrl();
  loginUrl.searchParams.set('authError', reason);
  return NextResponse.redirect(loginUrl, 303);
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== MEMBERSHIP_ORIGIN) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let idToken: FormDataEntryValue | null;
  try {
    idToken = (await request.formData()).get('idToken');
  } catch {
    return new NextResponse('Invalid form data', { status: 400 });
  }

  if (typeof idToken !== 'string' || idToken.length === 0 || idToken.length > 12000) {
    return new NextResponse('Invalid ID token', { status: 400 });
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken, true);
    const user = await auth.getUser(decodedToken.uid);
    if (user.disabled) return getFailureRedirect('disabled');

    const memberProfile = await getFirebaseAdminFirestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    if (!memberProfile.exists) return getFailureRedirect('not-member');
    if (!isClinicalAccessAllowed(user.email, user.emailVerified, memberProfile.data() ?? {})) {
      return getFailureRedirect('not-authorized');
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });
    const response = NextResponse.redirect(new URL('/', request.url), 303);
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return getFailureRedirect('session');
  }
}
