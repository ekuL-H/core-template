import prisma from './prisma'

export async function logActivity(userId: string, eventType: string, description: string, relatedId?: string) {
  try {
    await prisma.activityLog.create({
      data: { userId, eventType, description, relatedId }
    })
  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}