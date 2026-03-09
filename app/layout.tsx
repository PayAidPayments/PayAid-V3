import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProvidersLoader } from "./ProvidersLoader";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// Force dynamic rendering app-wide to avoid Vercel 45m timeout during "Generating static pages"
// (1085+ routes would otherwise be pre-rendered at build time.)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "PayAid V3 - Business Operating System",
  description: "All-in-one business operating system for Indian startups and SMBs",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // FORCE light mode immediately - runs before any rendering
                try {
                  // Remove dark class immediately
                  if (document.documentElement) {
                    document.documentElement.classList.remove('dark');
                  }
                  // Force light mode in localStorage
                  localStorage.setItem('theme', 'light');
                } catch(e) {
                  // If localStorage fails, still remove dark class
                  if (document.documentElement) {
                    document.documentElement.classList.remove('dark');
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ProvidersLoader>{children}</ProvidersLoader>
      </body>
    </html>
  );
}

