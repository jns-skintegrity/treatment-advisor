export const SESSION_COOKIE_NAME = 'sora_session';

const MEMBERSHIP_ORIGIN = new URL(
  process.env.MEMBERSHIP_ORIGIN ?? 'https://skintegrity-membership.vercel.app'
).origin;

export function getMembershipLoginUrl() {
  const loginUrl = new URL('/', MEMBERSHIP_ORIGIN);
  loginUrl.searchParams.set('continue', 'treatment-advisor');
  return loginUrl;
}
