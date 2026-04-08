import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayAid Marketplace",
  description: "Install 25+ AI modules and agents for your business",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
