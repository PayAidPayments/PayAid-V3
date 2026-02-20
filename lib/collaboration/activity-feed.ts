import { prisma } from '@/lib/db/prisma'

export interface ActivityFeedItem {
  id: string
  type: string
  entityType: string
  entityId: string
  userId: string
  userName: string
  userImage: string | null
  description: string
  metadata: Record<string, any>
  createdAt: Date
}

/**
 * Get activity feed for an entity
 */
export async function getActivityFeed(
  entityType: 'deal' | 'contact' | 'task' | 'project' | 'all',
  entityId: string | null,
  tenantId: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<ActivityFeedItem[]> {
  const activities = await prisma.activityFeed.findMany({
    where: {
      tenantId,
      ...(entityType !== 'all' && { entityType }),
      ...(entityId && { entityId }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  })

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    entityType: activity.entityType,
    entityId: activity.entityId,
    userId: activity.userId,
    userName: activity.user?.name || 'System',
    userImage: activity.user?.avatar || null,
    description: activity.description,
    metadata: (activity.metadata as Record<string, any>) || {},
    createdAt: activity.createdAt,
  }))
}

/**
 * Create activity feed entry
 */
export async function createActivityFeedEntry(
  data: {
    tenantId: string
    type: string
    entityType: string
    entityId: string
    userId: string
    description: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await prisma.activityFeed.create({
    data: {
      tenantId: data.tenantId,
      type: data.type,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      description: data.description,
      metadata: data.metadata || {},
    },
  })
}
