'use client'

interface ComplianceBannerProps {
  errors: string[]
}

export function ComplianceBanner({ errors }: ComplianceBannerProps) {
  if (errors.length === 0) return null

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="text-sm font-semibold text-red-700">Compliance checks failed</p>
      <ul className="mt-1 text-xs text-red-700 space-y-1">
        {errors.map((error) => (
          <li key={error}>- {error}</li>
        ))}
      </ul>
    </div>
  )
}
