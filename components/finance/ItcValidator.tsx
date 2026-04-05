'use client'

interface ItcValidatorProps {
  status: 'pending' | 'matched' | 'blocked' | 'claimed'
}

export function ItcValidator({ status }: ItcValidatorProps) {
  const tone =
    status === 'blocked'
      ? 'text-red-700 bg-red-50 border-red-200'
      : status === 'matched' || status === 'claimed'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : 'text-amber-700 bg-amber-50 border-amber-200'

  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <p className="text-xs font-semibold uppercase">ITC Validator</p>
      <p className="text-sm mt-1">Current status: {status}</p>
    </div>
  )
}
