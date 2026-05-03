'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Merge, Scissors, Archive, FileCheck } from 'lucide-react'

export default function PDFToolsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  const base = tenantId ? `/pdf/${tenantId}/Tools` : '/pdf'
  const tools = [
    { name: 'PDF Reader', desc: 'View and annotate PDFs', href: `${base}#reader`, icon: FileText },
    { name: 'PDF Editor', desc: 'Edit text and forms', href: `${base}#editor`, icon: FileCheck },
    { name: 'Merge PDFs', desc: 'Combine multiple PDFs', href: `${base}#merge`, icon: Merge },
    { name: 'Split PDF', desc: 'Extract or split pages', href: `${base}#split`, icon: Scissors },
    { name: 'Compress PDF', desc: 'Reduce file size', href: `${base}#compress`, icon: Archive },
    { name: 'Convert', desc: 'To/from other formats', href: `${base}#convert`, icon: FileText },
  ]

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF Tools</CardTitle>
          <CardDescription>Merge, split, convert, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((t) => {
              const Icon = t.icon
              return (
                <Link
                  key={t.name}
                  href={t.href}
                  className="p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3"
                >
                  <Icon className="h-8 w-8 text-purple-600 shrink-0" />
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.desc}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
