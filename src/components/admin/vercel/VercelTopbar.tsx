/**
 * VercelTopbar — Breadcrumb top bar for the Modern admin theme.
 * Clean, thin, Vercel-inspired with breadcrumb navigation and action buttons.
 */
import { useAdminStore, adminActions } from '../../../store/useAdminStore'
import { ChevronRightIcon, EyeIcon, UserCircleIcon } from './VercelIcons'

// Map section IDs to readable labels
const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  mail: 'Mail Hub',
  clients: 'Clients',
  referrals: 'Referrals',
  invoices: 'Invoices',
  sla: 'SLA Tracker',
  users: 'Team',
  ecosystem: 'Ecosystem',
  projects: 'Projects',
  careers: 'Careers',
  logs: 'Activity Logs',
  settings: 'Settings',
  profile: 'Profile',
}

interface VercelTopbarProps {
  onShowActAs: () => void
  onShowImpersonate: () => void
  showActAs: boolean
  showImpersonate: boolean
}

export default function VercelTopbar({ onShowActAs, onShowImpersonate, showActAs, showImpersonate: _showImpersonate }: VercelTopbarProps) {
  const { activeSection, user } = useAdminStore()
  const role = user?.role || ''
  const isElevated = ['Godmode', 'SuperAdmin'].includes(role)

  const sectionLabel = SECTION_LABELS[activeSection] || activeSection

  return (
    <header className="v-topbar">
      {/* Left — Breadcrumb */}
      <div className="v-breadcrumb">
        {/* Spacer for mobile hamburger */}
        <div className="v-mobile-hamburger" style={{ width: 40 }} />
        <button
          className="v-breadcrumb-item"
          onClick={() => adminActions.setSection('dashboard')}
        >
          ICUNI Labs
        </button>
        <ChevronRightIcon className="v-breadcrumb-sep" size={12} />
        <span className="v-breadcrumb-item active">{sectionLabel}</span>
      </div>

      {/* Right — Actions */}
      <div className="v-topbar-actions">
        {isElevated && (
          <>
            <div style={{ position: 'relative' }}>
              <button onClick={onShowActAs} className="v-topbar-btn">
                <EyeIcon size={14} />
                Act as...
              </button>
              {showActAs && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 4,
                  width: 180, background: 'var(--v-surface)', border: '1px solid var(--v-border)',
                  borderRadius: 'var(--v-radius-lg)', boxShadow: 'var(--v-shadow)', zIndex: 50, overflow: 'hidden',
                }}>
                  {[['referrer', 'Referrer'], ['client', 'Client']].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { adminActions.setActingAs(key); onShowActAs() }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 16px', fontSize: 13, color: 'var(--v-text-secondary)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--v-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      View as {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onShowImpersonate} className="v-topbar-btn">
              <UserCircleIcon size={14} />
              Impersonate
            </button>
          </>
        )}
        <a href="/" className="v-topbar-link">Back to site</a>
      </div>
    </header>
  )
}
