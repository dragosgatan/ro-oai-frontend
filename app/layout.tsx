import type React from 'react';

/**
 * Root layout - minimal wrapper
 *
 * The actual layout with providers is in app/[locale]/layout.tsx
 * This root layout is required by Next.js but delegates to the locale layout
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
