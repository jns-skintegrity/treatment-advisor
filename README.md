This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Member Authentication

The app verifies its Firebase session on the server and requires an eligible `users/{uid}` profile in the `skintegrity-membership` Firestore database. Access requires a verified `@skintegritypartners.com` email and a `premium`, `wound warrior`, or `moderator` badge. The membership site posts the Firebase ID token to `https://app.skintegritypartners.com/api/auth/session`; that route checks the membership-site origin before issuing an HTTP-only session cookie.

Configure these variables in the Vercel project:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: the full service-account JSON for the `skintegrity-membership` Firebase project. Keep it server-only and out of source control.
- `MEMBERSHIP_ORIGIN`: `https://skintegrity-membership.vercel.app`.
- `CLINICAL_TOOLS_PUBLIC_ACCESS`: leave unset or set to `false` for member-only access. Set to `true` only when intentionally opening the tool to the public.

Keep the membership site's domain authorized in Firebase Authentication. Keep `CLINICAL_TOOLS_PUBLIC_ACCESS` disabled in both this project and SORA until public access is approved.
