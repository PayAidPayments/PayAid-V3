import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
// Auto-initialize AI Influencer Marketing module on server startup
import '@/lib/ai-influencer/auto-init';
// Auto-initialize background job processors on server startup
import '@/lib/jobs/auto-init';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

