import { prisma } from './prisma';

export type AuditAction =
  | 'BAN_USER'
  | 'UNBAN_USER'
  | 'WARN_USER'
  | 'PROMOTE_USER'
  | 'DEMOTE_USER'
  | 'DELETE_USER'
  | 'HIDE_REVIEW'
  | 'UNHIDE_REVIEW'
  | 'EDIT_REVIEW'
  | 'DELETE_REVIEW'
  | 'DELETE_CONTENT'
  | 'EDIT_CONTENT'
  | 'DELETE_FORUM_THREAD'
  | 'MAINTENANCE_PURGE_BAD_REVIEWS'
  | 'MAINTENANCE_PURGE_DUPLICATE_REVIEWS'
  | (string & {}); // allow ad-hoc strings without losing autocomplete on known ones

export type AuditTargetType = 'User' | 'Review' | 'Content' | 'ForumThread' | 'Maintenance' | (string & {});

/**
 * Server-side audit log writer. Call this inside admin API handlers so the
 * audit record lives or dies with the action itself — there is no
 * client round-trip that could silently fail.
 *
 * Throws are swallowed and logged; an audit-log write should never break the
 * underlying admin action that already succeeded.
 */
export async function writeAuditLog(params: {
  adminId: string;
  action: AuditAction;
  targetId: string;
  targetType: AuditTargetType;
  details?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetId: params.targetId,
        targetType: params.targetType,
        details: params.details ?? null,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write audit log', { action: params.action, targetId: params.targetId, err });
  }
}
