import { prisma } from '@/lib/prisma';

export async function createNotification({
  userId,
  type,
  message,
  link,
}: {
  userId: string;
  type: string;
  message: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: { userId, type, message, link },
    });
  } catch (error) {
    // Notifications are non-critical — never let this break calling code
    console.error('Failed to create notification:', error);
  }
}
