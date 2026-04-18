import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientRoot } from "./ClientRoot";

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
        <link rel="dns-prefetch" href="https://unpkg.com" />
        <link rel="dns-prefetch" href="https://prod.spline.design" />
        {/* Early TLS + socket for Spline hero (viewer on unpkg, scene on spline.design) */}
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://prod.spline.design" crossOrigin="anonymous" />
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
      <body className="font-sans">
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}

