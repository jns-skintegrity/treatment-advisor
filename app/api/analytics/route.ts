import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

import { SESSION_COOKIE_NAME } from '../../lib/authConfig';
import { isCompanyAdmin } from '../../lib/clinicalAccess';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '../../lib/firebaseAdmin';

export const runtime = 'nodejs';

const VALID_EVENTS = new Set(['started', 'completed']);
const VALID_CATEGORIES = new Set([
  'urgent_review',
  'dressing_guidance',
  'clinical_review',
  'no_guidance',
]);

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 256) return new NextResponse('Analytics payload too large', { status: 413 });

  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  if (typeof body !== 'object' || body === null || !('event' in body)) {
    return new NextResponse('Invalid analytics event', { status: 400 });
  }

  if (Object.keys(body).some((key) => key !== 'event' && key !== 'category')) {
    return new NextResponse('Unexpected analytics data', { status: 400 });
  }

  const event = body.event;
  const category = 'category' in body ? body.category : undefined;
  if (
    typeof event !== 'string' ||
    !VALID_EVENTS.has(event) ||
    (category !== undefined &&
      (typeof category !== 'string' || !VALID_CATEGORIES.has(category))) ||
    (event === 'started' && category !== undefined) ||
    (event === 'completed' && category === undefined)
  ) {
    return new NextResponse('Invalid analytics event', { status: 400 });
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decodedSession = await auth.verifySessionCookie(sessionCookie, true);
    if (!isCompanyAdmin(decodedSession.email, decodedSession.email_verified)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const date = new Date().toISOString().slice(0, 10);
    const documentId = `treatment_advisor_${date}`;
    const update: Record<string, FirebaseFirestore.FieldValue | string> = {
      tool: 'treatment-advisor',
      date,
      [event]: FieldValue.increment(1),
    };
    if (category) update[`categories.${category}`] = FieldValue.increment(1);

    await getFirebaseAdminFirestore().collection('toolUsage').doc(documentId).set(update, { merge: true });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Could not record Treatment Advisor usage event', error);
    return new NextResponse('Usage event could not be recorded', { status: 500 });
  }
}
