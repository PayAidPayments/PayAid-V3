import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

// Load providers in a separate chunk to avoid layout chunk timeout (ChunkLoadError)
const Providers = dynamic(() => import("./providers").then((m) => ({ default: m.Providers })), {
  ssr: true,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
      <div className="animate-pulse text-sm">Loading...</div>
    </div>
  ),
});

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

