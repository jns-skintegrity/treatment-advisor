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

The page verifies the `sora_session` cookie, rechecks revocation, and requires a verified `@skintegritypartners.com` email plus an eligible membership badge in the `users/{uid}` Firestore profile. The membership sign-in flow must recognize the `treatment-advisor` continuation and establish the `sora_session` cookie for this app's origin before deployment.

## Clinical use and privacy

The app provides educational discussion prompts only; it does not select brands, direct debridement, prescribe compression, or replace clinician judgment and local policy. Urgent concerns pause the selector and prompt assessment. Assessment values are held only in browser memory, are not submitted to a server, and are cleared on reset or page reload. Do not enter patient identifiers.
