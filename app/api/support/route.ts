import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';

import { SESSION_COOKIE_NAME } from '../../lib/authConfig';
import { isCompanyAdmin } from '../../lib/clinicalAccess';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '../../lib/firebaseAdmin';

export const runtime = 'nodejs';

const MAX_REQUEST_BYTES = 20_000;
const ALLOWED_KEYS = new Set(['subject', 'category', 'message']);
const INVALID_SESSION_CODES = new Set([
  'auth/argument-error',
  'auth/invalid-session-cookie',
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/user-disabled',
  'auth/user-not-found',
]);

function getErrorCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) return error.code;
  return undefined;
}

async function readBodyWithinLimit(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) return { text: '', tooLarge: false, invalidEncoding: false };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { text: '', tooLarge: true, invalidEncoding: false };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), tooLarge: false, invalidEncoding: false };
  } catch {
    return { text: '', tooLarge: false, invalidEncoding: true };
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return new NextResponse('Forbidden: same-origin requests only', { status: 403 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return new NextResponse('Unauthorized', { status: 401 });

  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      return new NextResponse('Malformed Content-Length', { status: 400 });
    }
    if (Number(contentLength) > MAX_REQUEST_BYTES) {
      return new NextResponse('Support inquiry payload too large', { status: 413 });
    }
  }

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return new NextResponse('Content-Type must be application/json', { status: 415 });
  }

  const bodyResult = await readBodyWithinLimit(request);
  if (bodyResult.tooLarge) return new NextResponse('Support inquiry payload too large', { status: 413 });
  if (bodyResult.invalidEncoding) return new NextResponse('Malformed request encoding', { status: 400 });

  let body: unknown;
  try {
    body = JSON.parse(bodyResult.text);
  } catch {
    return new NextResponse('Malformed JSON', { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== ALLOWED_KEYS.size ||
    Object.keys(body).some((key) => !ALLOWED_KEYS.has(key))
  ) {
    return new NextResponse('Request must contain only subject, category, and message', { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (
    typeof input.subject !== 'string' ||
    typeof input.category !== 'string' ||
    typeof input.message !== 'string'
  ) {
    return new NextResponse('Subject, category, and message must be text', { status: 400 });
  }

  const subject = input.subject.trim();
  const category = input.category;
  const message = input.message.trim();
  if (
    subject.length < 5 ||
    subject.length > 120 ||
    message.length < 10 ||
    message.length > 4000 ||
    (category !== 'clinical' && category !== 'app_support')
  ) {
    return new NextResponse(
      'Invalid inquiry: subject must be 5–120 characters, message 10–4000 characters, and category clinical or app_support',
      { status: 400 }
    );
  }

  try {
    const decodedSession = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    if (!isCompanyAdmin(decodedSession.email, decodedSession.email_verified)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    if (!decodedSession.email || !decodedSession.uid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const db = getFirebaseAdminFirestore();
    const userSnapshot = await db.collection('users').doc(decodedSession.uid).get();
    const fullName = userSnapshot.get('fullName');
    const senderName =
      typeof fullName === 'string' && fullName.trim()
        ? fullName.trim()
        : decodedSession.email;

    await db.collection('supportTickets').add({
      userId: decodedSession.uid,
      senderEmail: decodedSession.email,
      senderName,
      source: 'treatment-advisor',
      subject,
      category,
      urgency: 'low',
      message,
      createdAt: Timestamp.now(),
      status: 'todo',
      replies: [],
    });
    return new NextResponse(null, { status: 201 });
  } catch (error) {
    if (INVALID_SESSION_CODES.has(String(getErrorCode(error)))) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.error('Could not create Treatment Advisor support inquiry', {
      code: getErrorCode(error),
    });
    return new NextResponse('Support inquiry could not be submitted', { status: 500 });
  }
}
