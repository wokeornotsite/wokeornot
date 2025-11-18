import { NextRequest, NextResponse } from 'next/server';
import { runCleanupTasks } from '@/lib/cleanup';

/**
 * Cron job endpoint to clean up expired tokens
 * 
 * This can be called by:
 * 1. Vercel Cron (add to vercel.json)
 * 2. External cron service (e.g., cron-job.org)
 * 3. Manual API call
 * 
 * To secure this endpoint, use one of:
 * - Vercel Cron secret header
 * - Authorization header with secret token
 * - IP whitelist
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const cronSecret = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (expectedSecret && cronSecret !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run cleanup tasks
    const result = await runCleanupTasks();

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cleanup cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support POST as well for flexibility
export async function POST(req: NextRequest) {
  return GET(req);
}
