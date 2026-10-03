const CLINICAL_EMAIL_DOMAIN = '@skintegritypartners.com';
const ALLOWED_BADGES = new Set([
  'premium',
  'woundwarrior',
  'woundwarrier',
  'woundwarriorpremium',
  'woundwarrierpremium',
  'moderator',
]);

function normalizeBadge(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, '');
}

export function isClinicalAccessAllowed(
  email: string | undefined,
  emailVerified: boolean | undefined,
  profile: Record<string, unknown>
) {
  if (!email || !emailVerified || !email.trim().toLowerCase().endsWith(CLINICAL_EMAIL_DOMAIN)) {
    return false;
  }

  const badgeValues = [
    profile.membershipTier,
    profile.membershipBadge,
    profile.badge,
    profile.role,
    ...(Array.isArray(profile.badges) ? profile.badges : []),
    ...(Array.isArray(profile.roles) ? profile.roles : []),
  ];

  return badgeValues.some(
    (value) => typeof value === 'string' && ALLOWED_BADGES.has(normalizeBadge(value))
  );
}
