'use client'

import { useState } from 'react'
import { GripVertical, Plus, Trash2, Settings } from 'lucide-react'
import { motion, Reorder } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface PipelineStage {
  id: string
  name: string
  order: number
  probability: number
  color: string
}

interface DealPipelineCustomizerProps {
  tenantId: string
  stages: PipelineStage[]
  onStagesChange: (stages: PipelineStage[]) => void
  onSave: (stages: PipelineStage[]) => Promise<void>
}

export function DealPipelineCustomizer({
  tenantId,
  stages,
  onStagesChange,
  onSave,
}: DealPipelineCustomizerProps) {
  const [editingStage, setEditingStage] = useState<string | null>(null)

  const addStage = () => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      name: 'New Stage',
      order: stages.length,
      probability: 50,
      color: '#53328A',
    }
    onStagesChange([...stages, newStage])
    setEditingStage(newStage.id)
  }

  const updateStage = (id: string, updates: Partial<PipelineStage>) => {
    onStagesChange(stages.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const deleteStage = (id: string) => {
    onStagesChange(stages.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx })))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pipeline Stages</h3>
        <Button onClick={addStage} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Stage
        </Button>
      </div>

      <Reorder.Group
        axis="y"
        values={stages}
        onReorder={onStagesChange}
        className="space-y-2"
      >
        {stages.map((stage) => (
          <Reorder.Item
            key={stage.id}
            value={stage}
            className="p-4 border rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between cursor-move"
          >
            <div className="flex items-center gap-3 flex-1">
              <GripVertical className="w-5 h-5 text-gray-400" />
              {editingStage === stage.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={stage.name}
                    onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                    className="flex-1"
                    onBlur={() => setEditingStage(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingStage(null)
                    }}
                    autoFocus
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={stage.probability}
                    onChange={(e) => updateStage(stage.id, { probability: parseInt(e.target.value) || 0 })}
                    className="w-24"
                  />
                  <Input
                    type="color"
                    value={stage.color}
                    onChange={(e) => updateStage(stage.id, { color: e.target.value })}
                    className="w-16 h-10"
                  />
                </div>
              ) : (
                <>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stage.name}</span>
                      <Badge variant="outline">{stage.probability}%</Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editingStage !== stage.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingStage(stage.id)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteStage(stage.id)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <Button onClick={() => onSave(stages)} className="w-full">
        Save Pipeline Configuration
      </Button>
    </div>
  )
}
