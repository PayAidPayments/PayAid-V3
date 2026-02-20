'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { Plus, X, Trash2 } from 'lucide-react'

export interface SegmentCriteria {
  field: string
  operator: string
  value: string
  logicalOperator?: 'AND' | 'OR'
}

interface SegmentBuilderProps {
  criteria: SegmentCriteria[]
  onCriteriaChange: (criteria: SegmentCriteria[]) => void
}

const AVAILABLE_FIELDS = [
  { value: 'firstName', label: 'First Name', type: 'text' },
  { value: 'lastName', label: 'Last Name', type: 'text' },
  { value: 'email', label: 'Email', type: 'text' },
  { value: 'phone', label: 'Phone', type: 'text' },
  { value: 'company', label: 'Company', type: 'text' },
  { value: 'industry', label: 'Industry', type: 'text' },
  { value: 'city', label: 'City', type: 'text' },
  { value: 'state', label: 'State', type: 'text' },
  { value: 'country', label: 'Country', type: 'text' },
  { value: 'leadSource', label: 'Lead Source', type: 'text' },
  { value: 'leadScore', label: 'Lead Score', type: 'number' },
  { value: 'createdAt', label: 'Created Date', type: 'date' },
  { value: 'lastContactedAt', label: 'Last Contacted', type: 'date' },
  { value: 'tags', label: 'Tags', type: 'text' },
]

const TEXT_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
]

const NUMBER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal' },
  { value: 'between', label: 'Between' },
]

const DATE_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
  { value: 'lastDays', label: 'Last N Days' },
  { value: 'nextDays', label: 'Next N Days' },
]

export function SegmentBuilder({ criteria, onCriteriaChange }: SegmentBuilderProps) {
  const [localCriteria, setLocalCriteria] = useState<SegmentCriteria[]>(
    criteria.length > 0 ? criteria : [{ field: '', operator: '', value: '' }]
  )

  const updateCriteria = (index: number, updates: Partial<SegmentCriteria>) => {
    const newCriteria = [...localCriteria]
    newCriteria[index] = { ...newCriteria[index], ...updates }
    setLocalCriteria(newCriteria)
    onCriteriaChange(newCriteria)
  }

  const addCriteria = () => {
    const newCriteria: SegmentCriteria[] = [
      ...localCriteria,
      { field: '', operator: '', value: '', logicalOperator: 'AND' as 'AND' | 'OR' },
    ]
    setLocalCriteria(newCriteria)
    onCriteriaChange(newCriteria)
  }

  const removeCriteria = (index: number) => {
    if (localCriteria.length > 1) {
      const newCriteria = localCriteria.filter((_, i) => i !== index)
      setLocalCriteria(newCriteria)
      onCriteriaChange(newCriteria)
    }
  }

  const getFieldType = (fieldValue: string) => {
    const field = AVAILABLE_FIELDS.find((f) => f.value === fieldValue)
    return field?.type || 'text'
  }

  const getOperators = (fieldType: string) => {
    switch (fieldType) {
      case 'number':
        return NUMBER_OPERATORS
      case 'date':
        return DATE_OPERATORS
      default:
        return TEXT_OPERATORS
    }
  }

  const renderValueInput = (criterion: SegmentCriteria, index: number) => {
    const fieldType = getFieldType(criterion.field)
    const operator = criterion.operator

    if (operator === 'isEmpty' || operator === 'isNotEmpty') {
      return null // No value needed
    }

    if (operator === 'between') {
      return (
        <div className="flex items-center gap-2">
          <Input
            type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
            placeholder="From"
            value={criterion.value.split('|')[0] || ''}
            onChange={(e) => {
              const toValue = criterion.value.split('|')[1] || ''
              updateCriteria(index, { value: `${e.target.value}|${toValue}` })
            }}
            className="flex-1"
          />
          <span className="text-gray-500">to</span>
          <Input
            type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
            placeholder="To"
            value={criterion.value.split('|')[1] || ''}
            onChange={(e) => {
              const fromValue = criterion.value.split('|')[0] || ''
              updateCriteria(index, { value: `${fromValue}|${e.target.value}` })
            }}
            className="flex-1"
          />
        </div>
      )
    }

    if (operator === 'lastDays' || operator === 'nextDays') {
      return (
        <Input
          type="number"
          placeholder="Number of days"
          value={criterion.value}
          onChange={(e) => updateCriteria(index, { value: e.target.value })}
          className="flex-1"
        />
      )
    }

    return (
      <Input
        type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
        placeholder="Enter value"
        value={criterion.value}
        onChange={(e) => updateCriteria(index, { value: e.target.value })}
        className="flex-1"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Segment Criteria</h3>
        <Button type="button" onClick={addCriteria} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>

      <div className="space-y-3">
        {localCriteria.map((criterion, index) => {
          const fieldType = getFieldType(criterion.field)
          const operators = getOperators(fieldType)

          return (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                {index > 0 && (
                  <CustomSelect
                    value={criterion.logicalOperator || 'AND'}
                    onValueChange={(value: string) =>
                      updateCriteria(index, { logicalOperator: value as 'AND' | 'OR' })
                    }
                    placeholder="AND"
                  >
                    <CustomSelectTrigger className="w-20">
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="AND">AND</CustomSelectItem>
                      <CustomSelectItem value="OR">OR</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                )}

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <CustomSelect
                    value={criterion.field}
                    onValueChange={(value: string) => {
                      updateCriteria(index, { field: value, operator: '', value: '' })
                    }}
                    placeholder="Select field"
                  >
                    <CustomSelectTrigger>
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {AVAILABLE_FIELDS.map((field) => (
                        <CustomSelectItem key={field.value} value={field.value}>
                          {field.label}
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>

                  {criterion.field && (
                    <CustomSelect
                      value={criterion.operator}
                      onValueChange={(value: string) => {
                        updateCriteria(index, { operator: value, value: '' })
                      }}
                      placeholder="Select operator"
                    >
                      <CustomSelectTrigger>
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        {operators.map((op) => (
                          <CustomSelectItem key={op.value} value={op.value}>
                            {op.label}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  )}

                  {criterion.field && criterion.operator && (
                    <div className="md:col-span-2">{renderValueInput(criterion, index)}</div>
                  )}
                </div>

                {localCriteria.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCriteria(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {localCriteria.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No criteria added yet</p>
          <Button type="button" onClick={addCriteria} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add First Condition
          </Button>
        </Card>
      )}
    </div>
  )
}

