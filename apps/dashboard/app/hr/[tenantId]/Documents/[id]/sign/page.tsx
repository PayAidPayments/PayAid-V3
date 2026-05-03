'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PenTool, Check } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

export default function HRDocumentSignPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const id = params?.id as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [typedName, setTypedName] = useState('')

  const { data: doc } = useQuery({
    queryKey: ['hr-document', id],
    queryFn: async () => {
      const res = await fetch(`/api/hr/documents/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!id,
  })

  const signMutation = useMutation({
    mutationFn: async (payload: { signatureData: string | object }) => {
      const res = await fetch(`/api/hr/documents/${id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Sign failed')
      }
      return res.json()
    },
    onSuccess: () => router.push(`/hr/${tenantId}/Documents`),
  })

  const handleSign = () => {
    let signatureData: string | object
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      signatureData = dataUrl
    } else {
      signatureData = { name: typedName, signedAt: new Date().toISOString() }
    }
    signMutation.mutate({ signatureData })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="E-Sign Document"
        moduleIcon={<PenTool className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Sign this document electronically"
      />
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{(doc as any)?.documentName ?? doc?.name ?? 'Document'}</CardTitle>
            <CardDescription>Draw your signature below or type your full name to sign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Signature (draw)</Label>
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="border rounded-md w-full max-w-md bg-white dark:bg-gray-900 touch-none"
                onMouseDown={(e) => {
                  const ctx = canvasRef.current?.getContext('2d')
                  if (!ctx) return
                  ctx.beginPath()
                  ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
                  const draw = (ev: MouseEvent) => {
                    ctx.lineTo(ev.offsetX, ev.offsetY)
                    ctx.stroke()
                  }
                  window.addEventListener('mousemove', draw)
                  window.addEventListener('mouseup', () => {
                    window.removeEventListener('mousemove', draw)
                  })
                }}
              />
            </div>
            <div>
              <Label>Or type your full name</Label>
              <Input
                placeholder="Full name"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Link href={`/hr/${tenantId}/Documents`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSign} disabled={signMutation.isPending}>
                <Check className="mr-2 h-4 w-4" />
                {signMutation.isPending ? 'Signing...' : 'Sign document'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
