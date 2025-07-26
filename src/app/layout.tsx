
"use client"; // This needs to be a client component to use useAppContext

import type { ReactNode } from 'react';
import { GeistSans } from 'geist/font/sans';
// Removed GeistMono import as it was causing module not found error
import './globals.css';
import 'react-quill/dist/quill.snow.css';
import { AppProvider, useAppContext } from '@/components/app-provider';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Toaster } from "@/components/ui/toaster";

// Metadata needs to be defined outside the component if it's client-side
// For now, we will remove it from here and it can be added to a server component if needed
// export const metadata: Metadata = {
// title: 'Matrix',
// description: 'Manage your tasks efficiently with Matrix.',
// };

function LayoutContent({ children }: { children: ReactNode }) {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    // If not logged in (e.g., on the login page), render children without SidebarLayout
    return <>{children}</>;
  }

  // If logged in, render with SidebarLayout
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Matrix</title>
        <meta name="description" content="Manage your tasks efficiently with Matrix." />
      </head>
      <body className={`${GeistSans.variable} antialiased`}>
        <AppProvider>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
