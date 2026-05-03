import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PayAid V3 Suite',
  description: 'All-in-one business platform. CRM, Finance, HR, Marketing, and more.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {children}
      </body>
    </html>
  )
}
