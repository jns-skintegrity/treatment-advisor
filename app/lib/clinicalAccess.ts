const CLINICAL_EMAIL_DOMAIN = '@skintegritypartners.com';

export function isCompanyAdmin(email: string | undefined, emailVerified: boolean | undefined) {
  return Boolean(email && emailVerified && email.trim().toLowerCase().endsWith(CLINICAL_EMAIL_DOMAIN));
}
