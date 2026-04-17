import { useEffect, useMemo, useState } from 'react'
import { normalizeSearchQuery, shouldRunServerSearch } from '@/lib/search/query-normalization'

type UseDebouncedSearchOptions = {
  initialInput?: string
  delayMs?: number
  minChars?: number
}

export function useDebouncedSearch(options: UseDebouncedSearchOptions = {}) {
  const {
    initialInput = '',
    delayMs = 300,
    minChars = 2,
  } = options

  const [rawInput, setRawInput] = useState(initialInput)
  const normalizedInput = useMemo(() => normalizeSearchQuery(rawInput), [rawInput])
  const [debouncedNormalizedInput, setDebouncedNormalizedInput] = useState(normalizedInput)

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      setDebouncedNormalizedInput(normalizedInput)
    }, delayMs)
    return () => globalThis.clearTimeout(timer)
  }, [normalizedInput, delayMs])

  const effectiveQuery = useMemo(
    () => (shouldRunServerSearch(debouncedNormalizedInput, minChars) ? debouncedNormalizedInput : ''),
    [debouncedNormalizedInput, minChars]
  )

  return {
    rawInput,
    setRawInput,
    normalizedInput,
    debouncedNormalizedInput,
    effectiveQuery,
    hasMeaningfulInput: normalizedInput.length > 0,
    isSearchEligible: shouldRunServerSearch(normalizedInput, minChars),
  }
}

