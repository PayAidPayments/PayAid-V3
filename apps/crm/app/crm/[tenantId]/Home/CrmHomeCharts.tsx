'use client'

import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'

export type CrmHomeChartProps = {
  pipelineChartData: Array<{ name: string; value: number; fill: string }>
  monthlyLeadData: Array<{ month: string; leads: number }>
  topLeadSourcesData: Array<{
    name: string
    leadsCount: number
    conversionsCount: number
    totalValue: number
    conversionRate: number
  }>
  isDark: boolean
  /** When true, only render the pipeline chart (uniform secondary band). */
  compact?: boolean
}

export function CrmHomeCharts({
  pipelineChartData,
  monthlyLeadData,
  topLeadSourcesData,
  isDark,
  compact = false,
}: CrmHomeChartProps) {
  const pipelineCard = (
        <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-purple-900">Pipeline by Stage</CardTitle>
            <CardDescription className="text-sm">Distribution of deals across pipeline stages</CardDescription>
          </CardHeader>
          <CardContent style={{ height: '260px', overflow: 'hidden', position: 'relative', padding: '16px 16px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pipelineChartData.length > 0 ? (
              <motion.div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260 }} initial={false}>
                <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                  <PieChart>
                    <Pie
                      data={pipelineChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={(props: {
                        cx?: number
                        cy?: number
                        midAngle?: number
                        innerRadius?: number
                        outerRadius?: number
                        percent?: number
                        name?: string
                      }) => {
                        const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent, name } = props
                        const RADIAN = Math.PI / 180
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)'}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight={500}
                          >
                            {`${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          </text>
                        )
                      }}
                      labelLine={false}
                    >
                      {pipelineChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [value ?? 0, 'Deals']}
                      contentStyle={{
                        backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                        color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                        border: `1px solid ${PURPLE_PRIMARY}`,
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div className="flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height: '100%' }} initial={false}>
                <p>No pipeline data available</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
  )

  if (compact) {
    return <div className="space-y-4">{pipelineCard}</div>
  }

  return (
    <div className="space-y-4">
        {pipelineCard}

        <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Monthly Lead Creation</CardTitle>
            <CardDescription className="text-sm">Lead generation trend over time</CardDescription>
          </CardHeader>
          <CardContent style={{ height: '260px', overflow: 'hidden', position: 'relative', padding: '16px 16px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {monthlyLeadData.length > 0 ? (
              <motion.div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260 }} initial={false}>
                <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                  <AreaChart data={monthlyLeadData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PURPLE_PRIMARY} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={PURPLE_PRIMARY} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                    <XAxis dataKey="month" stroke={isDark ? '#D1D5DB' : '#666'} tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }} />
                    <YAxis stroke={isDark ? '#D1D5DB' : '#666'} tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                        color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                        border: `1px solid ${PURPLE_PRIMARY}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Area type="monotone" dataKey="leads" stroke={PURPLE_PRIMARY} fillOpacity={1} fill="url(#colorLeads)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div className="flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height: '100%' }} initial={false}>
                <p>No lead creation data available</p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-purple-900">TOP 10 Lead Sources</CardTitle>
            <CardDescription className="text-sm">Best performing lead sources</CardDescription>
          </CardHeader>
          <CardContent style={{ height: '260px', overflow: 'hidden', position: 'relative', padding: '16px' }}>
            {topLeadSourcesData.length > 0 ? (
              <motion.div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260 }} initial={false}>
                <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                  <BarChart data={topLeadSourcesData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                    <XAxis type="number" stroke={isDark ? '#D1D5DB' : '#666'} tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke={isDark ? '#D1D5DB' : '#666'}
                      width={120}
                      tick={{ fontSize: 10, fill: isDark ? '#D1D5DB' : '#666' }}
                      interval={0}
                      textAnchor="end"
                      dx={-5}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                        color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                        border: `1px solid ${PURPLE_PRIMARY}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const sortedPayload = [...payload].sort((a, b) => {
                            if (a.dataKey === 'leadsCount') return -1
                            if (b.dataKey === 'leadsCount') return 1
                            if (a.dataKey === 'conversionsCount') return -1
                            if (b.dataKey === 'conversionsCount') return 1
                            return 0
                          })
                          return (
                            <motion.div className="bg-white dark:bg-gray-800 border border-purple-600 rounded-lg p-3 shadow-lg" initial={false}>
                              <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{label}</p>
                              {sortedPayload.map((entry, index) => {
                                let entryLabel = entry.name
                                let value = entry.value
                                if (entry.dataKey === 'leadsCount') {
                                  entryLabel = 'Leads'
                                } else if (entry.dataKey === 'conversionsCount') {
                                  entryLabel = 'Conversions'
                                } else if (entry.dataKey === 'totalValue') {
                                  entryLabel = 'Total Value'
                                  value = formatINRForDisplay(value as number)
                                } else if (entry.dataKey === 'conversionRate') {
                                  entryLabel = 'Conversion Rate'
                                  value = `${Number(value).toFixed(1)}%`
                                }
                                return (
                                  <p key={index} className="text-sm" style={{ color: entry.color }}>
                                    <span className="font-medium">{entryLabel}:</span> {value}
                                  </p>
                                )
                              })}
                            </motion.div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: '12px',
                        color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                      }}
                    />
                    <Bar dataKey="leadsCount" fill={PURPLE_PRIMARY} name="Leads" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="conversionsCount" fill={GOLD_ACCENT} name="Conversions" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              <motion.div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 space-y-3" style={{ height: '100%' }} initial={false}>
                <p className="text-base font-medium">No lead source data available</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md text-center">
                  Lead sources will appear here once contacts are assigned to sources.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}

export function CrmHomeChartsSkeleton() {
  return (
    <motion.div className="space-y-4" initial={false}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-[320px] w-full rounded-xl bg-slate-200/80 dark:bg-slate-800/60 animate-pulse"
          style={{ minHeight: 320 }}
          initial={false}
        />
      ))}
    </motion.div>
  )
}
