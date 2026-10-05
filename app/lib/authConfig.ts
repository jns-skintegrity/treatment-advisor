export const SESSION_COOKIE_NAME = 'sora_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export const MEMBERSHIP_ORIGIN = new URL(
  process.env.MEMBERSHIP_ORIGIN ?? 'https://skintegrity-membership.vercel.app'
).origin;

export function getMembershipLoginUrl() {
  const loginUrl = new URL('/', MEMBERSHIP_ORIGIN);
  loginUrl.searchParams.set('continue', 'treatment-advisor');
  return loginUrl;
}
