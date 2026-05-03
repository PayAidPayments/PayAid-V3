'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencySelector } from '@/components/currency/CurrencySelector'
import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay'
import { SUPPORTED_CURRENCIES } from '@/lib/currency/converter'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { useTenant } from '@/lib/hooks/use-api'

export default function CurrencySettingsPage() {
  const queryClient = useQueryClient()
  const { data: tenantData } = useTenant()
  const [defaultCurrency, setDefaultCurrency] = useState('INR')
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['INR'])

  useEffect(() => {
    if (tenantData) {
      setDefaultCurrency(tenantData.defaultCurrency || 'INR')
      setSupportedCurrencies(tenantData.supportedCurrencies || ['INR'])
    }
  }, [tenantData])

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates', defaultCurrency],
    queryFn: async () => {
      const res = await fetch(`/api/currencies/rates?base=${defaultCurrency}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return null
      return res.json()
    },
  })

  const updateRatesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/currencies/rates', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          baseCurrency: defaultCurrency,
          targetCurrencies: supportedCurrencies.filter(c => c !== defaultCurrency),
        }),
      })
      if (!res.ok) throw new Error('Failed to update rates')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] })
    },
  })

  const updateTenantSettings = useMutation({
    mutationFn: async (settings: { defaultCurrency: string; supportedCurrencies: string[] }) => {
      const res = await fetch('/api/settings/tenant', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          defaultCurrency: settings.defaultCurrency,
          supportedCurrencies: settings.supportedCurrencies,
        }),
      })
      if (!res.ok) throw new Error('Failed to update settings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
    },
  })

  const handleSave = () => {
    updateTenantSettings.mutate({
      defaultCurrency,
      supportedCurrencies,
    })
  }

  const toggleCurrency = (currencyCode: string) => {
    if (supportedCurrencies.includes(currencyCode)) {
      if (currencyCode === defaultCurrency) {
        alert('Cannot remove default currency. Change default currency first.')
        return
      }
      setSupportedCurrencies(supportedCurrencies.filter(c => c !== currencyCode))
    } else {
      setSupportedCurrencies([...supportedCurrencies, currencyCode])
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Currency Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure default currency and supported currencies for your organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Currency</CardTitle>
          <CardDescription>
            This currency will be used as the base currency for all invoices and reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defaultCurrency">Default Currency</Label>
            <CurrencySelector
              value={defaultCurrency}
              onChange={setDefaultCurrency}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Changing default currency will affect all new invoices. Existing invoices will keep their original currency.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported Currencies</CardTitle>
          <CardDescription>
            Select which currencies your organization accepts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto border rounded-lg p-4">
            {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
              <label
                key={currency.code}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={supportedCurrencies.includes(currency.code)}
                  onChange={() => toggleCurrency(currency.code)}
                  disabled={currency.code === defaultCurrency}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">
                  {currency.symbol} {currency.code}
                </span>
                {currency.code === defaultCurrency && (
                  <span className="text-xs text-blue-600">(Default)</span>
                )}
              </label>
            ))}
          </div>
          <Button onClick={handleSave} disabled={updateTenantSettings.isPending}>
            {updateTenantSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exchange Rates</CardTitle>
              <CardDescription>
                Current exchange rates for {defaultCurrency}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateRatesMutation.mutate()}
              disabled={updateRatesMutation.isPending || ratesLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updateRatesMutation.isPending ? 'animate-spin' : ''}`} />
              Update Rates
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ratesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading exchange rates...</div>
          ) : exchangeRates?.rates ? (
            <div className="space-y-2">
              {Object.entries(exchangeRates.rates).map(([currency, rate]: [string, any]) => (
                <div key={currency} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">{currency}</span>
                  <span className="text-gray-600">
                    1 {defaultCurrency} = {rate.toFixed(4)} {currency}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No exchange rates available. Click "Update Rates" to fetch current rates.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
