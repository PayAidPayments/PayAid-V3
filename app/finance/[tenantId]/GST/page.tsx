'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function FinanceGSTPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">GST Reports</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Indian GST compliance reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">GSTR-1</CardTitle>
            <CardDescription className="dark:text-gray-400">Sales Register - Outward Supplies</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Detailed report of all outward supplies (sales) made during the month. Required for
              monthly GST filing.
            </p>
            <Link href={`/finance/${tenantId}/GST/GSTR-1`}>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">View GSTR-1</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">GSTR-3B</CardTitle>
            <CardDescription className="dark:text-gray-400">Summary Return - Monthly GST Filing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Monthly summary return showing outward supplies, inward supplies, input tax credit,
              and net GST payable.
            </p>
            <Link href={`/finance/${tenantId}/GST/GSTR-3B`}>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">View GSTR-3B</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">GST Filing Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>GSTR-1:</strong> File by 11th of the following month. Contains details of all
              outward supplies (sales invoices).
            </p>
            <p>
              <strong>GSTR-3B:</strong> File by 20th of the following month. Contains summary of
              outward supplies, inward supplies, and net GST payable.
            </p>
            <p>
              <strong>Filing Portal:</strong> Visit{' '}
              <a
                href="https://www.gst.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                www.gst.gov.in
              </a>{' '}
              to file your returns.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
