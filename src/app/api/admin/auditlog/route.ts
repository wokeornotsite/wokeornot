import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAPI } from '@/lib/admin-auth';

/**
 * POST /api/admin/auditlog
 * Creates an audit log entry for admin actions
 * 
 * Expected body:
 * {
 *   action: string,      // e.g., 'BAN_USER', 'DELETE_REVIEW', 'APPROVE_REVIEW'
 *   targetId: string,    // ID of the affected entity
 *   targetType: string,  // e.g., 'User', 'Review', 'Content'
 *   details?: string     // Optional additional context
 * }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { action, targetId, targetType, details } = body;

    // Validate required fields
    if (!action || !targetId || !targetType) {
      return NextResponse.json(
        { error: 'Missing required fields: action, targetId, targetType' },
        { status: 400 }
      );
    }

    // Get admin user ID from session
    const adminId = auth.session.user.id;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin user ID not found in session' },
        { status: 400 }
      );
    }

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetId,
        targetType,
        details: details || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      id: auditLog.id 
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log entry' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auditlog
 * Retrieves audit log entries with pagination and filtering
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '0');
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '50'), 100);
    const action = searchParams.get('action') || '';
    const targetType = searchParams.get('targetType') || '';

    // Build where clause
    const where: any = {};
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
