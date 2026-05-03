'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import type { LogoConfig } from '@/lib/logo/vector-engine'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'

type LockupType = 'combination-horizontal' | 'stacked' | 'wordmark' | 'emblem'

interface LogoDetail {
  id: string
  businessName: string
  industry?: string
  style?: string
  logoType?: 'VECTOR' | 'AI_IMAGE'
  status: string
  createdAt: string
  variations: Array<{
    id: string
    imageUrl: string
    thumbnailUrl?: string
    isSelected: boolean
    svgData?: string
    layoutConfig?: Partial<LogoConfig> | null
  }>
}

export default function LogoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const tenantId = params.tenantId as string
  const [activeLockup, setActiveLockup] = useState<LockupType>('combination-horizontal')

  const { data, isLoading, refetch } = useQuery<LogoDetail>({
    queryKey: ['logo-detail', id],
    queryFn: async () => {
      const response = await apiRequest(`/api/logos/${id}`)
      if (!response.ok) throw new Error('Failed to fetch logo detail')
      return response.json()
    },
  })

  const setWorkspaceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/logos/${id}/set-workspace`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to set workspace logo')
      return response.json()
    },
  })

  const saveBrandKitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/logos/${id}/save-brand-kit`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to save to brand kit')
      return response.json()
    },
  })

  const selectVariationMutation = useMutation({
    mutationFn: async (variationId: string) => {
      const response = await apiRequest(`/api/logos/${id}/variations/${variationId}/select`, { method: 'PUT' })
      if (!response.ok) throw new Error('Failed to select variation')
      return response.json()
    },
    onSuccess: async () => {
      await refetch()
    },
  })

  const selectedVariation = useMemo(() => data?.variations.find((v) => v.isSelected) || data?.variations[0], [data])

  const previewConfig: Partial<LogoConfig> = useMemo(() => {
    const fromLayout = (selectedVariation?.layoutConfig || {}) as Partial<LogoConfig>
    return {
      text: fromLayout.text || data?.businessName || '',
      fontFamily: fromLayout.fontFamily || 'Inter',
      fontSize: fromLayout.fontSize || 56,
      color: fromLayout.color || '#111827',
      iconStyle: fromLayout.iconStyle || 'circle-monogram',
      iconColor: fromLayout.iconColor || fromLayout.color || '#111827',
      layout: {
        align: fromLayout.layout?.align || 'center',
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      },
    }
  }, [selectedVariation, data])

  if (isLoading) return <PageLoading message="Loading logo detail..." fullScreen={false} />
  if (!data) return <div className="text-sm text-red-600">Unable to load logo detail.</div>

  const downloadLockup = (lockup: LockupType) => {
    const svg = createLockupPreview(previewConfig, lockup)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const safeName = data.businessName.trim().toLowerCase().replace(/[^\w-]+/g, '-') || 'logo'
    anchor.href = url
    anchor.download = `${safeName}-${lockup}.svg`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const downloadAllLockups = () => {
    ;(['combination-horizontal', 'stacked', 'wordmark', 'emblem'] as const).forEach((lockup) => {
      downloadLockup(lockup)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.businessName}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {data.industry ? `${data.industry} • ` : ''}{data.style || 'vector brand identity'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/ai-studio/${tenantId}/Logos`}>
            <Button variant="outline">Back to Logos</Button>
          </Link>
          <Button
            onClick={async () => {
              await setWorkspaceMutation.mutateAsync()
              await refetch()
            }}
            disabled={setWorkspaceMutation.isPending}
          >
            {setWorkspaceMutation.isPending ? 'Setting...' : 'Set as Workspace Logo'}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await saveBrandKitMutation.mutateAsync()
            }}
            disabled={saveBrandKitMutation.isPending}
          >
            {saveBrandKitMutation.isPending ? 'Saving...' : 'Save as Brand-Kit Variant'}
          </Button>
        </div>
      </div>

      {(setWorkspaceMutation.isError || saveBrandKitMutation.isError) && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(setWorkspaceMutation.error || saveBrandKitMutation.error)}
        </div>
      )}
      {selectVariationMutation.isError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(selectVariationMutation.error)}
        </div>
      )}
      {(setWorkspaceMutation.isSuccess || saveBrandKitMutation.isSuccess) && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {setWorkspaceMutation.isSuccess
            ? 'Workspace logo updated.'
            : 'Saved into brand-kit logo library.'}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Selected Variation</CardTitle>
          <CardDescription>Current active logo variation for this brand identity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded border bg-white p-4 min-h-[220px] flex items-center justify-center">
            {selectedVariation?.svgData ? (
              <div dangerouslySetInnerHTML={{ __html: selectedVariation.svgData }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedVariation?.thumbnailUrl || selectedVariation?.imageUrl}
                alt={data.businessName}
                className="max-h-[220px] object-contain"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lockup Gallery</CardTitle>
          <CardDescription>Preview all standard brand lockups from the saved vector configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadLockup(activeLockup)}>
              Export Selected Lockup (SVG)
            </Button>
            <Button size="sm" variant="outline" onClick={downloadAllLockups}>
              Export All Lockups (SVG)
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {(['combination-horizontal', 'stacked', 'wordmark', 'emblem'] as const).map((lockup) => (
              <button
                key={lockup}
                type="button"
                onClick={() => setActiveLockup(lockup)}
                className={`rounded border bg-slate-50 p-2 text-left ${
                  activeLockup === lockup ? 'border-indigo-400 ring-1 ring-indigo-300' : 'border-slate-200'
                }`}
              >
                <div
                  className="h-28 rounded border bg-white flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: createLockupPreview(previewConfig, lockup),
                  }}
                />
                <p className="mt-2 text-xs text-slate-700">
                  {lockup === 'combination-horizontal'
                    ? 'Horizontal'
                    : lockup === 'stacked'
                    ? 'Stacked'
                    : lockup === 'wordmark'
                    ? 'Wordmark'
                    : 'Emblem'}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variation History</CardTitle>
          <CardDescription>Saved versions for this logo concept.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.variations.map((variation, index) => (
              <div key={variation.id} className="rounded border border-slate-200 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">
                    Variation {index + 1} {variation.isSelected ? '(Selected)' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {getLockupLabel(variation.layoutConfig)}
                    </span>
                    {!variation.isSelected && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={selectVariationMutation.isPending}
                        onClick={() => selectVariationMutation.mutate(variation.id)}
                      >
                        {selectVariationMutation.isPending ? 'Selecting...' : 'Set Active'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getLockupLabel(layoutConfig?: Partial<LogoConfig> | null): string {
  const lockup = layoutConfig?.layout?.lockupType || 'combination-horizontal'
  if (lockup === 'stacked') return 'Stacked'
  if (lockup === 'wordmark') return 'Wordmark'
  if (lockup === 'emblem') return 'Emblem'
  return 'Horizontal'
}

function createLockupPreview(base: Partial<LogoConfig>, lockup: LockupType): string {
  const width = 500
  const height = 220
  const text = (base.text || 'Brand').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fontFamily = base.fontFamily || 'Inter'
  const fontSize = Math.max(20, Math.min(44, base.fontSize || 40))
  const color = base.color || '#111827'
  const iconColor = base.iconColor || color
  const monogram = text.charAt(0).toUpperCase() || 'B'
  const hasIcon = (base.iconStyle || 'circle-monogram') !== 'none' && lockup !== 'wordmark'

  const iconSvg = hasIcon
    ? `<g transform="translate(${lockup === 'stacked' || lockup === 'emblem' ? 250 : 126}, ${lockup === 'stacked' ? 78 : lockup === 'emblem' ? 82 : 110})">
         <circle cx="0" cy="0" r="38" fill="${iconColor}" opacity="0.12" />
         <circle cx="0" cy="0" r="32" fill="none" stroke="${iconColor}" stroke-width="3" />
         <text x="0" y="2" text-anchor="middle" dominant-baseline="middle" fill="${iconColor}" style="font-family: '${fontFamily}'; font-size: 24px; font-weight: 700;">${monogram}</text>
       </g>`
    : ''

  const textX = lockup === 'stacked' || lockup === 'emblem' ? 250 : hasIcon ? 184 : 120
  const textY = lockup === 'stacked' ? 162 : lockup === 'emblem' ? 170 : 114
  const textAnchor = lockup === 'stacked' || lockup === 'emblem' ? 'middle' : 'start'
  const textSize = lockup === 'emblem' ? Math.max(18, Math.round(fontSize * 0.72)) : fontSize

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${lockup === 'emblem' ? `<circle cx="250" cy="108" r="72" fill="${iconColor}" opacity="0.08" />` : ''}
      ${iconSvg}
      <text x="${textX}" y="${textY}" text-anchor="${textAnchor}" dominant-baseline="middle" fill="${color}"
        style="font-family: '${fontFamily}', sans-serif; font-size: ${textSize}px; font-weight: ${lockup === 'emblem' ? 600 : 500};">
        ${text}
      </text>
    </svg>
  `
}

