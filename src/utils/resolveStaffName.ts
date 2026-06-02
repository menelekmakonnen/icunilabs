import { getAdminState } from '../store/useAdminStore'

/**
 * Resolve a staff email to a full name by looking up the users list.
 * Falls back to a title-cased version of the email prefix if no match.
 */
export function resolveStaffName(email: string): string {
  if (!email) return 'Unknown'
  const { users } = getAdminState()
  if (users && users.length > 0) {
    const lower = email.toLowerCase().trim()
    const match = users.find(
      (u: { email?: string; company_email?: string; name?: string }) =>
        (u.email?.toLowerCase().trim() === lower) ||
        (u.company_email?.toLowerCase().trim() === lower)
    )
    if (match?.name) return match.name
  }
  // Fallback: title-case the email prefix
  return email.split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}
