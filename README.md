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

The app records daily aggregate assessment-start and review-completion counters, plus counts by broad generated-guidance category, in the Membership Firebase project's `toolUsage` collection. After a review is completed, it also records that completion's timestamp and broad category in `users/{verifiedUid}/toolHistory/treatment-advisor` as a newest-first `uses` list capped at five entries. The UID comes only from the server-verified session cookie. Neither storage location receives assessment answers, free text, patient identifiers, names, or case details; the per-user history contains only the timestamp and allowlisted category for each completed review.

The separate Help & Support form sends only the entered subject, category, and message to the shared top-level `supportTickets` collection. The server requires a same-origin request and a non-revoked, verified company-domain session; it derives the sender UID and email from that session and the sender name from `users/{uid}` when available. Tickets use the fixed `treatment-advisor` source, `low` urgency, and `todo` status. Assessment selections and results are never attached to support inquiries. Do not include patient identifiers, protected health information (PHI), or case details in an inquiry.
