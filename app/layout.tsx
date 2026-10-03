import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Dressing Advisor | Skintegrity',
  description:
    'A clinician-facing wound assessment and dressing consideration aid. Verify decisions against patient-specific assessment and local protocols.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
