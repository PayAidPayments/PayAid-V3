/**
 * Productivity Module Types - Base Module
 * Shared across all industries
 */

import { z } from 'zod'

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'

export interface Task {
  id: string
  organizationId: string
  projectId?: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignedTo: string[]
  dueDate?: Date
  estimatedHours?: number
  actualHoursSpent?: number
  subtasks: Subtask[]
  attachments: string[]
  comments: Comment[]
  linkedTo?: { type: string; id: string }
  createdAt: Date
  completedAt?: Date
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Comment {
  id: string
  userId: string
  content: string
  createdAt: Date
}

export interface Project {
  id: string
  organizationId: string
  name: string
  description: string
  status: ProjectStatus
  clientId?: string
  startDate: Date
  endDate?: Date
  budgetINR?: number
  actualCostINR?: number
  tasks: Task[]
  milestones: Milestone[]
  team: string[]
  visibility: 'public' | 'team' | 'private'
  createdAt: Date
}

export interface Milestone {
  id: string
  name: string
  dueDate: Date
  completed: boolean
}

// Validation schemas
export const CreateTaskSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedTo: z.array(z.string().uuid()),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
})

export const CreateProjectSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  budgetINR: z.number().nonnegative().optional(),
  team: z.array(z.string().uuid()),
  visibility: z.enum(['public', 'team', 'private']).default('team'),
})
