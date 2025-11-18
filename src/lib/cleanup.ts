import { prisma } from './prisma';

/**
 * Clean up expired password reset tokens
 * This should be called periodically (e.g., via cron job or API route)
 */
export async function cleanupExpiredTokens() {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired password reset tokens`);
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return { success: false, error };
  }
}

/**
 * Clean up expired verification tokens
 */
export async function cleanupExpiredVerificationTokens() {
  try {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired verification tokens`);
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error cleaning up expired verification tokens:', error);
    return { success: false, error };
  }
}

/**
 * Run all cleanup tasks
 */
export async function runCleanupTasks() {
  console.log('Running cleanup tasks...');
  
  const results = await Promise.allSettled([
    cleanupExpiredTokens(),
    cleanupExpiredVerificationTokens(),
  ]);

  const summary = {
    passwordResetTokens: results[0].status === 'fulfilled' ? results[0].value : { success: false },
    verificationTokens: results[1].status === 'fulfilled' ? results[1].value : { success: false },
  };

  console.log('Cleanup tasks completed:', summary);
  return summary;
}
