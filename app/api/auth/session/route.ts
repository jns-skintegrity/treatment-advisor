import { NextRequest, NextResponse } from 'next/server';

import {
  getMembershipLoginUrl,
  MEMBERSHIP_ORIGIN,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '../../../lib/authConfig';
import { isCompanyAdmin } from '../../../lib/clinicalAccess';
import { getFirebaseAdminAuth } from '../../../lib/firebaseAdmin';

export const runtime = 'nodejs';

type HandoffStage =
  | 'initialize-firebase-admin'
  | 'verify-id-token'
  | 'load-user'
  | 'create-session-cookie';

function getErrorDetails(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return { message: String(error) };
  }

  const details: { name?: string; code?: string; message?: string } = {};
  if ('name' in error && typeof error.name === 'string') details.name = error.name;
  if ('code' in error && typeof error.code === 'string') details.code = error.code;
  if ('message' in error && typeof error.message === 'string') details.message = error.message;
  return details;
}

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

  let stage: HandoffStage = 'initialize-firebase-admin';
  try {
    const auth = getFirebaseAdminAuth();
    stage = 'verify-id-token';
    const decodedToken = await auth.verifyIdToken(idToken, true);
    stage = 'load-user';
    const user = await auth.getUser(decodedToken.uid);
    if (user.disabled) return getFailureRedirect('disabled');

    const isAdmin = isCompanyAdmin(user.email, user.emailVerified);
    if (!isAdmin) {
      return getFailureRedirect('not-authorized');
    }

    stage = 'create-session-cookie';
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
  } catch (error) {
    console.error('Treatment Advisor session handoff failed', {
      stage,
      ...getErrorDetails(error),
    });
    return getFailureRedirect(`session-${stage}`);
  }
}
