'use client'

import { useState } from 'react'
import { Globe, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface Currency {
  code: string
  name: string
  rate: number
  change: number
}

interface MultiCurrencySupportProps {
  tenantId: string
}

export function MultiCurrencySupport({ tenantId }: MultiCurrencySupportProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([
    { code: 'INR', name: 'Indian Rupee', rate: 1, change: 0 },
    { code: 'USD', name: 'US Dollar', rate: 83.25, change: 0.5 },
    { code: 'EUR', name: 'Euro', rate: 90.50, change: -0.3 },
    { code: 'GBP', name: 'British Pound', rate: 105.75, change: 0.2 },
  ])

  const [baseCurrency, setBaseCurrency] = useState('INR')
  const [amount, setAmount] = useState(100000)
  const [fromCurrency, setFromCurrency] = useState('INR')
  const [toCurrency, setToCurrency] = useState('USD')

  const convertAmount = () => {
    const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1
    const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1
    return (amount * toRate) / fromRate
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-Currency Support</h2>
          <p className="text-gray-500">Manage multiple currencies and exchange rates</p>
        </div>
      </div>

      {/* Exchange Rates */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Exchange Rates (Base: {baseCurrency})
          </CardTitle>
          <CardDescription>Current exchange rates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currencies.map((currency) => (
              <div
                key={currency.code}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-sm text-gray-500">{currency.name}</div>
                  </div>
                  {currency.change !== 0 && (
                    <Badge variant={currency.change > 0 ? 'default' : 'secondary'}>
                      {currency.change > 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(currency.change)}%
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {currency.code === 'INR' ? '1.00' : currency.rate.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>

      {/* Currency Converter */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Currency Converter</CardTitle>
          <CardDescription>Convert amounts between currencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>From Currency</Label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>To Currency</Label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Converted Amount</div>
              <div className="text-3xl font-bold text-purple-600">
                {toCurrency} {convertAmount().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      {/* Multi-Currency P&L */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Multi-Currency P&L</CardTitle>
          <CardDescription>Profit & Loss by currency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currencies.filter(c => c.code !== baseCurrency).map((currency) => (
              <div key={currency.code} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{currency.code} Transactions</div>
                  <Badge variant="outline">Rate: {currency.rate}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Revenue</div>
                    <div className="font-semibold text-green-600">
                      {currency.code} 50,000
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatINRForDisplay(50000 * currency.rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Expenses</div>
                    <div className="font-semibold text-red-600">
                      {currency.code} 30,000
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatINRForDisplay(30000 * currency.rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Profit</div>
                    <div className="font-semibold text-purple-600">
                      {currency.code} 20,000
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatINRForDisplay(20000 * currency.rate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
