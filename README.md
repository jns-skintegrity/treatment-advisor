# Treatment Advisor

A clinician-facing Dressing Advisor built with Next.js. It organizes wound observations into cautious dressing-class considerations and clinical review prompts. It is not a diagnostic tool, treatment order, wound staging tool, or substitute for a complete assessment or approved local protocol.

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app requires member authentication; unauthenticated users are redirected to the Skintegrity Membership site.

## Production configuration

Configure these server-side environment variables in the deployment:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: service-account JSON for the `skintegrity-membership` Firebase project. Keep it server-only and never commit it.
- `MEMBERSHIP_ORIGIN`: the exact origin for the membership site; defaults to `https://skintegrity-membership.vercel.app`.

The page verifies the `sora_session` cookie, rechecks revocation, and treats every verified `@skintegritypartners.com` account as an admin; a Firestore membership badge is not required. The membership sign-in flow posts the Firebase ID token to `/api/auth/session`; this route verifies the company email and sets the HTTP-only `sora_session` cookie for this app's origin.

## Clinical use and privacy

The app provides educational discussion prompts only; it does not select brands, direct debridement, prescribe compression, or replace clinician judgment and local policy. Urgent concerns pause the selector and prompt assessment. Assessment values are held only in browser memory, are not submitted to a server, and are cleared on reset or page reload. Do not enter patient identifiers.

The app records daily aggregate assessment-start and review-completion counters, plus a broad generated-guidance category, in the Membership Firebase project's `toolUsage` collection. It does not send assessment answers, patient identifiers, names, or case details to this collection. The Membership Admin dashboard reads these aggregates.
