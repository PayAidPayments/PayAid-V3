'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ChevronLeft, 
  Settings, 
  GripVertical, 
  Plus, 
  X, 
  Save,
  Eye,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'

interface FieldDefinition {
  id: string
  name: string
  type: string
  label?: string
  isRequired: boolean
  isUnique?: boolean
  defaultValue?: string
  options?: string[] // For dropdown/picklist
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  displayOrder: number
  sectionId: string
  column?: 'left' | 'right' | 'full'
}

interface Section {
  id: string
  name: string
  displayOrder: number
  fields: FieldDefinition[]
  isCollapsible?: boolean
  isCollapsed?: boolean
}

interface FieldLayout {
  sections: Section[]
  showLeadImage?: boolean
}

const FIELD_TYPES = [
  { value: 'single_line', label: 'Single Line' },
  { value: 'multi_line', label: 'Multi-Line' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'pick_list', label: 'Pick List' },
  { value: 'multi_select', label: 'Multi-Select' },
  { value: 'date', label: 'Date' },
  { value: 'date_time', label: 'Date/Time' },
  { value: 'number', label: 'Number' },
  { value: 'auto_number', label: 'Auto-Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'percent', label: 'Percent' },
  { value: 'long_integer', label: 'Long Integer' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
  { value: 'lookup', label: 'Lookup' },
  { value: 'formula', label: 'Formula' },
  { value: 'user', label: 'User' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'image_upload', label: 'Image Upload' },
  { value: 'rollup_summary', label: 'Rollup Summary' },
  { value: 'address', label: 'Address+' },
  { value: 'multi_select_lookup', label: 'Multi-Select Lookup' },
  { value: 'subform', label: 'Subform' },
]

const ENTITY_TYPES = [
  { value: 'lead', label: 'Leads' },
  { value: 'contact', label: 'Contacts' },
  { value: 'account', label: 'Accounts' },
  { value: 'deal', label: 'Deals' },
]

const VIEW_TYPES = [
  { value: 'CREATE', label: 'CREATE' },
  { value: 'QUICK_CREATE', label: 'QUICK CREATE' },
  { value: 'DETAIL_VIEW', label: 'DETAIL VIEW' },
]

export default function FieldConfigurationPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantId = params?.tenantId as string
  const { user } = useAuthStore()
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'owner'
  
  const [entityType, setEntityType] = useState<string>(searchParams.get('entity') || 'lead')
  const [viewType, setViewType] = useState<string>(searchParams.get('view') || 'CREATE')
  const [layout, setLayout] = useState<FieldLayout>({ sections: [] })
  const [selectedField, setSelectedField] = useState<FieldDefinition | null>(null)
  const [draggedField, setDraggedField] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      router.push(`/crm/${tenantId}/Home/`)
    }
  }, [isAdmin, tenantId, router])

  // Load layout
  useEffect(() => {
    loadLayout()
  }, [tenantId, entityType, viewType])

  const loadLayout = async () => {
    try {
      const token = useAuthStore.getState().token
      if (!token) return

      const response = await fetch(
        `/api/crm/field-layouts?module=crm&entityType=${entityType}&viewType=${viewType}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.layout) {
          setLayout(data.layout)
        } else {
          // Initialize default layout
          setLayout({
            sections: [
              {
                id: 'section-1',
                name: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Information`,
                displayOrder: 0,
                fields: [],
              },
            ],
            showLeadImage: entityType === 'lead',
          })
        }
      }
    } catch (error) {
      console.error('Error loading layout:', error)
    }
  }

  const saveLayout = async () => {
    try {
      setIsSaving(true)
      const token = useAuthStore.getState().token
      if (!token) return

      const response = await fetch('/api/crm/field-layouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          module: 'crm',
          entityType,
          viewType,
          layoutJson: layout,
        }),
      })

      if (response.ok) {
        alert('Layout saved successfully!')
      } else {
        throw new Error('Failed to save layout')
      }
    } catch (error) {
      console.error('Error saving layout:', error)
      alert('Failed to save layout')
    } finally {
      setIsSaving(false)
    }
  }

  const addField = (fieldType: string) => {
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      name: `New ${fieldType.replace('_', ' ')}`,
      type: fieldType,
      isRequired: false,
      displayOrder: 0,
      sectionId: layout.sections[0]?.id || 'section-1',
      column: 'left',
    }

    const updatedSections = [...layout.sections]
    if (updatedSections.length === 0) {
      updatedSections.push({
        id: 'section-1',
        name: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Information`,
        displayOrder: 0,
        fields: [newField],
      })
    } else {
      updatedSections[0].fields.push(newField)
    }

    setLayout({ ...layout, sections: updatedSections })
    setSelectedField(newField)
  }

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      displayOrder: layout.sections.length,
      fields: [],
    }
    setLayout({
      ...layout,
      sections: [...layout.sections, newSection],
    })
  }

  const updateField = (fieldId: string, updates: Partial<FieldDefinition>) => {
    const updatedSections = layout.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }))
    setLayout({ ...layout, sections: updatedSections })
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const deleteField = (fieldId: string) => {
    const updatedSections = layout.sections.map((section) => ({
      ...section,
      fields: section.fields.filter((field) => field.id !== fieldId),
    }))
    setLayout({ ...layout, sections: updatedSections })
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  const handleDragStart = (fieldId: string) => {
    setDraggedField(fieldId)
  }

  const handleDrop = (sectionId: string, column?: 'left' | 'right' | 'full') => {
    if (!draggedField) return

    const updatedSections = layout.sections.map((section) => {
      if (section.id === sectionId) {
        const field = section.fields.find((f) => f.id === draggedField)
        if (field) {
          const otherFields = section.fields.filter((f) => f.id !== draggedField)
          return {
            ...section,
            fields: [...otherFields, { ...field, sectionId, column }],
          }
        }
      }
      return section
    })

    setLayout({ ...layout, sections: updatedSections })
    setDraggedField(null)
  }

  if (!isAdmin) {
    return null // Will redirect
  }

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={`/crm/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-lg font-semibold text-gray-900">CRM</h2>
            <div className="flex items-center gap-2">
              <CustomSelect value={entityType} onValueChange={setEntityType} placeholder="Select entity">
                <CustomSelectTrigger className="w-40">
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <CustomSelectItem key={type.value} value={type.value}>
                      {type.label}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
              <span className="text-gray-400">Standard</span>
              <Settings className="w-4 h-4 text-gray-400" />
            </div>
            <nav className="flex items-center gap-4 text-sm">
              {VIEW_TYPES.map((view) => (
                <button
                  key={view.value}
                  onClick={() => setViewType(view.value)}
                  className={`px-3 py-1 ${
                    viewType === view.value
                      ? 'text-blue-600 font-medium border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={saveLayout} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveLayout} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save and Close'}
            </Button>
            <Button onClick={saveLayout} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <ModuleSwitcher currentModule="crm" />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Field Types */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">New Fields</h3>
            <div className="space-y-1">
              {FIELD_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => addField(type.value)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  {type.label}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={addSection}
                className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                NEW SECTION
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
              <p>Unused Fields &gt; 56</p>
              <p className="mt-2">Custom Fields Left: 235</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Lead Image Toggle */}
          {entityType === 'lead' && (
            <div className="mb-4 flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layout.showLeadImage || false}
                  onChange={(e) => setLayout({ ...layout, showLeadImage: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Lead Image</span>
              </label>
            </div>
          )}

          {/* Sections */}
          {layout.sections.map((section) => (
            <Card key={section.id} className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Input
                    value={section.name}
                    onChange={(e) => {
                      const updatedSections = layout.sections.map((s) =>
                        s.id === section.id ? { ...s, name: e.target.value } : s
                      )
                      setLayout({ ...layout, sections: updatedSections })
                    }}
                    className="font-semibold text-lg border-0 p-0 focus-visible:ring-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div
                    className="min-h-[200px] space-y-3"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(section.id, 'left')}
                  >
                    {section.fields
                      .filter((f) => f.column === 'left' || !f.column)
                      .map((field) => (
                        <FieldItem
                          key={field.id}
                          field={field}
                          onSelect={() => setSelectedField(field)}
                          onDelete={() => deleteField(field.id)}
                          onDragStart={() => handleDragStart(field.id)}
                          isSelected={selectedField?.id === field.id}
                        />
                      ))}
                    {section.fields.filter((f) => f.column === 'left' || !f.column).length === 0 && (
                      <div className="text-center text-gray-400 py-8 border-2 border-dashed rounded">
                        Drag fields here
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div
                    className="min-h-[200px] space-y-3"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(section.id, 'right')}
                  >
                    {section.fields
                      .filter((f) => f.column === 'right')
                      .map((field) => (
                        <FieldItem
                          key={field.id}
                          field={field}
                          onSelect={() => setSelectedField(field)}
                          onDelete={() => deleteField(field.id)}
                          onDragStart={() => handleDragStart(field.id)}
                          isSelected={selectedField?.id === field.id}
                        />
                      ))}
                    {section.fields.filter((f) => f.column === 'right').length === 0 && (
                      <div className="text-center text-gray-400 py-8 border-2 border-dashed rounded">
                        Drag fields here
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {layout.sections.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 mb-4">No sections yet. Add a section to get started.</p>
                <Button onClick={addSection}>Add Section</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Field Properties */}
        {selectedField && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Field Properties</h3>
            <div className="space-y-4">
              <div>
                <Label>Field Name</Label>
                <Input
                  value={selectedField.name}
                  onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Field Type</Label>
                <CustomSelect
                  value={selectedField.type}
                  onValueChange={(value) => updateField(selectedField.id, { type: value })}
                  placeholder="Select field type"
                >
                  <CustomSelectTrigger className="mt-1">
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {FIELD_TYPES.map((type) => (
                      <CustomSelectItem key={type.value} value={type.value}>
                        {type.label}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div>
                <Label>Display Label</Label>
                <Input
                  value={selectedField.label || ''}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                  className="mt-1"
                  placeholder={selectedField.name}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedField.isRequired}
                  onCheckedChange={(checked) =>
                    updateField(selectedField.id, { isRequired: checked === true })
                  }
                />
                <Label>Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedField.isUnique || false}
                  onCheckedChange={(checked) =>
                    updateField(selectedField.id, { isUnique: checked === true })
                  }
                />
                <Label>Unique</Label>
              </div>
              {(selectedField.type === 'pick_list' || selectedField.type === 'multi_select') && (
                <div>
                  <Label>Options (one per line)</Label>
                  <textarea
                    value={selectedField.options?.join('\n') || ''}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        options: e.target.value.split('\n').filter((o) => o.trim()),
                      })
                    }
                    className="mt-1 w-full p-2 border rounded"
                    rows={5}
                  />
                </div>
              )}
              <div>
                <Label>Default Value</Label>
                <Input
                  value={selectedField.defaultValue || ''}
                  onChange={(e) => updateField(selectedField.id, { defaultValue: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Column</Label>
                <CustomSelect
                  value={selectedField.column || 'left'}
                  onValueChange={(value) =>
                    updateField(selectedField.id, { column: value as 'left' | 'right' | 'full' })
                  }
                  placeholder="Select column"
                >
                  <CustomSelectTrigger className="mt-1">
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="left">Left</CustomSelectItem>
                    <CustomSelectItem value="right">Right</CustomSelectItem>
                    <CustomSelectItem value="full">Full Width</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Field Item Component
function FieldItem({
  field,
  onSelect,
  onDelete,
  onDragStart,
  isSelected,
}: {
  field: FieldDefinition
  onSelect: () => void
  onDelete: () => void
  onDragStart: () => void
  isSelected: boolean
}) {
  const fieldType = FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={`p-3 border rounded cursor-move hover:bg-gray-50 transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      } ${field.isRequired ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <div className="font-medium text-sm">{field.label || field.name}</div>
            <div className="text-xs text-gray-500">{fieldType}</div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 hover:bg-red-100 rounded"
        >
          <X className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  )
}

