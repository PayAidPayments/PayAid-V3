'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { Upload, Plus, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { format } from 'date-fns'
import { useRef, useState } from 'react'

interface Device {
  id: string
  name: string
  deviceType: string
  location: string | null
  status: string
  lastSyncAt: string | null
  lastRecordCount: number | null
}

interface BiometricDevicesCardProps {
  tenantId: string
}

export function BiometricDevicesCard({ tenantId }: BiometricDevicesCardProps) {
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importDeviceId, setImportDeviceId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('FACIAL_RECOGNITION')
  const [newLocation, setNewLocation] = useState('')

  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ['hr-biometric-devices', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/biometric-devices', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch devices')
      return res.json()
    },
  })

  const addDeviceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/hr/biometric-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newName.trim(), deviceType: newType, location: newLocation.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to add device')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-biometric-devices', tenantId] })
      setShowAdd(false)
      setNewName('')
      setNewLocation('')
    },
  })

  const importMutation = useMutation({
    mutationFn: async ({ file, deviceId }: { file: File; deviceId?: string }) => {
      const form = new FormData()
      form.append('file', file)
      if (deviceId) form.append('deviceId', deviceId)
      const res = await fetch('/api/hr/attendance/biometric-import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Import failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-biometric-devices', tenantId] })
      setImportDeviceId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importMutation.mutate({ file, deviceId: importDeviceId ?? undefined })
  }

  const openImport = (deviceId?: string) => {
    setImportDeviceId(deviceId ?? null)
    fileInputRef.current?.click()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading devices...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Biometric Devices</CardTitle>
            <CardDescription>Register devices and import attendance (Excel/CSV: employeeCode, date, checkInTime, checkOutTime)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="mr-2 h-4 w-4" />
              Add device
            </Button>
            <Button size="sm" variant="outline" onClick={() => openImport()}>
              <Upload className="mr-2 h-4 w-4" />
              Import attendance
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg">
            <div>
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Main Gate" className="w-40" />
            </div>
            <div>
              <Label>Type</Label>
              <CustomSelect value={newType} onValueChange={setNewType} placeholder="Select type">
                <CustomSelectTrigger className="w-44" />
                <CustomSelectContent>
                  <CustomSelectItem value="FACIAL_RECOGNITION">Facial</CustomSelectItem>
                  <CustomSelectItem value="FINGERPRINT">Fingerprint</CustomSelectItem>
                  <CustomSelectItem value="CARD">Card</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. Bangalore Office" className="w-40" />
            </div>
            <Button size="sm" onClick={() => addDeviceMutation.mutate()} disabled={!newName.trim() || addDeviceMutation.isPending}>
              {addDeviceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No devices registered. Use &quot;Import attendance&quot; to upload a biometric export file (Excel/CSV). Add devices to track which machine the import came from.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Records</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{device.deviceType.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell>{device.location || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={device.status === 'ACTIVE' ? 'default' : 'secondary'}>{device.status}</Badge>
                  </TableCell>
                  <TableCell>{device.lastSyncAt ? format(new Date(device.lastSyncAt), 'PPp') : '—'}</TableCell>
                  <TableCell>{device.lastRecordCount ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openImport(device.id)} disabled={importMutation.isPending}>
                      {importMutation.isPending && importDeviceId === device.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
