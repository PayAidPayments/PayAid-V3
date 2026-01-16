'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus,
  MapPin,
  TrendingUp,
  AlertCircle,
  Building2,
  DollarSign,
  Map,
  Bell,
  RefreshCw,
  X,
  CheckCircle2
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface Competitor {
  id: string
  name: string
  website?: string
  industry?: string
  description?: string
  monitoringEnabled: boolean
  priceTrackingEnabled: boolean
  locationTrackingEnabled: boolean
  isActive: boolean
  prices?: CompetitorPrice[]
  locations?: CompetitorLocation[]
  alerts?: CompetitorAlert[]
  _count?: {
    prices: number
    locations: number
    alerts: number
  }
}

interface CompetitorPrice {
  id: string
  productName: string
  productSku?: string
  price: number
  currency: string
  source?: string
  url?: string
  lastCheckedAt: string
}

interface CompetitorLocation {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  isActive: boolean
}

interface CompetitorAlert {
  id: string
  type: string
  title: string
  message: string
  severity: string
  isRead: boolean
  metadata?: any
  createdAt: string
}

export default function CompetitorsPage() {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
    priceTrackingEnabled: false,
    locationTrackingEnabled: false,
  })
  const [priceForm, setPriceForm] = useState({
    productName: '',
    productSku: '',
    price: '',
    url: '',
  })
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
  })

  useEffect(() => {
    fetchCompetitors()
  }, [])

  const fetchCompetitors = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/competitors/track', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCompetitors(data.competitors || [])
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetitorDetails = async (competitorId: string) => {
    try {
      const res = await fetch(`/api/competitors/${competitorId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedCompetitor(data.competitor)
      }
    } catch (error) {
      console.error('Failed to fetch competitor details:', error)
    }
  }

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/competitors/track', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert('Competitor added successfully!')
        setShowAddForm(false)
        setFormData({ name: '', website: '', industry: '', description: '', priceTrackingEnabled: false, locationTrackingEnabled: false })
        await fetchCompetitors()
      }
    } catch (error) {
      console.error('Failed to add competitor:', error)
      alert('Failed to add competitor')
    }
  }

  const handleAddPrice = async (competitorId: string) => {
    try {
      const res = await fetch(`/api/competitors/${competitorId}/prices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: priceForm.productName,
          productSku: priceForm.productSku || undefined,
          price: parseFloat(priceForm.price),
          source: 'manual',
          url: priceForm.url || undefined,
        }),
      })

      if (res.ok) {
        alert('Price added successfully!')
        setPriceForm({ productName: '', productSku: '', price: '', url: '' })
        await fetchCompetitorDetails(competitorId)
      }
    } catch (error) {
      console.error('Failed to add price:', error)
      alert('Failed to add price')
    }
  }

  const handleAddLocation = async (competitorId: string) => {
    try {
      const res = await fetch(`/api/competitors/${competitorId}/locations/geocode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: locationForm.name,
          address: locationForm.address,
          city: locationForm.city,
          state: locationForm.state,
        }),
      })

      if (res.ok) {
        alert('Location added successfully!')
        setLocationForm({ name: '', address: '', city: '', state: '' })
        await fetchCompetitorDetails(competitorId)
      }
    } catch (error) {
      console.error('Failed to add location:', error)
      alert('Failed to add location')
    }
  }

  const handleMarkAlertRead = async (competitorId: string, alertId: string) => {
    try {
      const res = await fetch(`/api/competitors/${competitorId}/alerts?alertId=${alertId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.ok) {
        await fetchCompetitorDetails(competitorId)
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

  if (loading) {
    return <DashboardLoading message="Loading competitors..." />
  }

  if (selectedCompetitor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="outline"
                onClick={() => setSelectedCompetitor(null)}
                className="mb-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                ← Back to Competitors
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{selectedCompetitor.name}</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{selectedCompetitor.industry || 'No industry specified'}</p>
            </div>
            <ThemeToggle />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 dark:bg-gray-800">
              <TabsTrigger value="overview" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">Overview</TabsTrigger>
              <TabsTrigger value="prices" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">Prices</TabsTrigger>
              <TabsTrigger value="locations" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">Locations</TabsTrigger>
              <TabsTrigger value="alerts" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Competitor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedCompetitor.website ? (
                        <a href={selectedCompetitor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                          {selectedCompetitor.website}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monitoring Status</label>
                    <div className="flex gap-4 mt-2">
                      <Badge variant={selectedCompetitor.monitoringEnabled ? 'default' : 'secondary'}>
                        {selectedCompetitor.monitoringEnabled ? 'Monitoring Active' : 'Monitoring Disabled'}
                      </Badge>
                      <Badge variant={selectedCompetitor.priceTrackingEnabled ? 'default' : 'secondary'}>
                        Price Tracking {selectedCompetitor.priceTrackingEnabled ? 'ON' : 'OFF'}
                      </Badge>
                      <Badge variant={selectedCompetitor.locationTrackingEnabled ? 'default' : 'secondary'}>
                        Location Tracking {selectedCompetitor.locationTrackingEnabled ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <Card className="dark:bg-gray-700 dark:border-gray-600">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedCompetitor._count?.prices || 0}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tracked Prices</p>
                      </CardContent>
                    </Card>
                    <Card className="dark:bg-gray-700 dark:border-gray-600">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedCompetitor._count?.locations || 0}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Locations</p>
                      </CardContent>
                    </Card>
                    <Card className="dark:bg-gray-700 dark:border-gray-600">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedCompetitor._count?.alerts || 0}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prices" className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Price Tracking</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Track competitor product prices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Add New Price</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Product Name"
                        value={priceForm.productName}
                        onChange={(e) => setPriceForm({ ...priceForm, productName: e.target.value })}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                      <Input
                        placeholder="SKU (optional)"
                        value={priceForm.productSku}
                        onChange={(e) => setPriceForm({ ...priceForm, productSku: e.target.value })}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                      <Input
                        type="number"
                        placeholder="Price (₹)"
                        value={priceForm.price}
                        onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                      <Input
                        placeholder="URL (optional)"
                        value={priceForm.url}
                        onChange={(e) => setPriceForm({ ...priceForm, url: e.target.value })}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <Button
                      onClick={() => handleAddPrice(selectedCompetitor.id)}
                      className="mt-4 bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
                    >
                      Add Price
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedCompetitor.prices && selectedCompetitor.prices.length > 0 ? (
                      selectedCompetitor.prices.map((price) => (
                        <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{price.productName}</p>
                            {price.productSku && <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {price.productSku}</p>}
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last checked: {new Date(price.lastCheckedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">₹{Number(price.price).toFixed(2)}</p>
                            {price.url && (
                              <a href={price.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                View Source
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-center py-8">No prices tracked yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Location Tracking</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Track competitor locations on map</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Add New Location</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Location Name"
                        value={locationForm.name}
                        onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                      <Input
                        placeholder="Address"
                        value={locationForm.address}
                        onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                      <Input
                        placeholder="City"
                        value={locationForm.city}
                        onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                      <Input
                        placeholder="State"
                        value={locationForm.state}
                        onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <Button
                      onClick={() => handleAddLocation(selectedCompetitor.id)}
                      className="mt-4 bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
                    >
                      Add Location (Geocode)
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedCompetitor.locations && selectedCompetitor.locations.length > 0 ? (
                      <>
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Map className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">Google Maps integration</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">Map will show {selectedCompetitor.locations.length} location(s)</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {selectedCompetitor.locations.map((location) => (
                            <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{location.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{location.address}</p>
                                {location.city && location.state && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{location.city}, {location.state}</p>
                                )}
                                {location.latitude && location.longitude && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                  </p>
                                )}
                              </div>
                              <Badge variant={location.isActive ? 'default' : 'secondary'}>
                                {location.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-center py-8">No locations tracked yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Alerts & Notifications</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Automated alerts for price changes and new locations</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCompetitor.alerts && selectedCompetitor.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCompetitor.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : alert.severity === 'WARNING'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={
                                    alert.severity === 'CRITICAL'
                                      ? 'destructive'
                                      : alert.severity === 'WARNING'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {alert.type.replace('_', ' ')}
                                </Badge>
                                {!alert.isRead && (
                                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{alert.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {new Date(alert.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!alert.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAlertRead(selectedCompetitor.id, alert.id)}
                                className="ml-4"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">No alerts yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Competitor Intelligence</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track competitors, monitor prices, and analyze market position
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor
            </Button>
          </div>
        </div>

        {/* Add Competitor Form */}
        {showAddForm && (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Add New Competitor</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCompetitor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Competitor Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Industry
                  </label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.priceTrackingEnabled}
                      onChange={(e) => setFormData({ ...formData, priceTrackingEnabled: e.target.checked })}
                      className="dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable Price Tracking</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.locationTrackingEnabled}
                      onChange={(e) => setFormData({ ...formData, locationTrackingEnabled: e.target.checked })}
                      className="dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable Location Tracking</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
                  >
                    Add Competitor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Competitors List */}
        {competitors.length === 0 ? (
          <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
            <CardContent>
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Competitors Tracked</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start tracking your competitors to gain market intelligence
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Competitor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors.map((competitor) => (
              <Card
                key={competitor.id}
                className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => fetchCompetitorDetails(competitor.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-gray-100">{competitor.name}</CardTitle>
                      {competitor.industry && (
                        <CardDescription className="text-gray-600 dark:text-gray-400">{competitor.industry}</CardDescription>
                      )}
                    </div>
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {competitor.website && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <a
                          href={competitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {competitor.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        <span>{competitor._count?.prices || 0} prices</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{competitor._count?.locations || 0} locations</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Bell className="w-4 h-4" />
                        <span>{competitor._count?.alerts || 0} alerts</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Badge variant={competitor.monitoringEnabled ? 'default' : 'secondary'}>
                          {competitor.monitoringEnabled ? 'Monitoring' : 'Paused'}
                        </Badge>
                        {competitor.priceTrackingEnabled && (
                          <Badge variant="outline" className="text-xs">Price Tracking</Badge>
                        )}
                        {competitor.locationTrackingEnabled && (
                          <Badge variant="outline" className="text-xs">Location Tracking</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
