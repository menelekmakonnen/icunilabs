/**
 * VercelAdminShell — The main layout wrapper for the "Modern" admin theme.
 * Wraps existing section components with Vercel-inspired chrome.
 * Does NOT modify any existing section — just provides new sidebar, topbar, and CSS context.
 */
import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAdminStore, adminActions } from '../../../store/useAdminStore'
import VercelSidebar from './VercelSidebar'
import VercelTopbar from './VercelTopbar'
import { MenuIcon, CloseIcon, UserCircleIcon, EyeIcon } from './VercelIcons'
import './vercel-admin.css'

// Import existing section components — zero modification
import AdminLogin from '../AdminLogin'
import DashboardSection from '../DashboardSection'
import MailSection from '../MailSection'
import CallSection from '../CallSection'
import CRMSection from '../CRMSection'
import { ProjectsSection, InvoicesSection, CareersSection, ReferralsSection, UsersSection, LogsSection, SLASection } from '../AdminSections'
import ProfileSection from '../ProfileSection'
import SettingsSection from '../SettingsSection'
import EcosystemSection from '../EcosystemSection'
import StarterclassSection from '../StarterclassSection'
import OnboardingChecklist from '../OnboardingChecklist'
import ReferralPortal from '../../portal/ReferralPortal'
import ClientPortal from '../../portal/ClientPortal'

interface VercelAdminShellProps {
  onSwitchTheme: () => void
}

export default function VercelAdminShell({ onSwitchTheme }: VercelAdminShellProps) {
  const { token, user, activeSection, actingAs, impersonating, users } = useAdminStore()

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('v_sidebar_collapsed') === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showActAs, setShowActAs] = useState(false)
  const [showImpersonate, setShowImpersonate] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('v_modern_dark') === 'true'
  })

  // Persist sidebar collapse
  useEffect(() => {
    localStorage.setItem('v_sidebar_collapsed', String(collapsed))
  }, [collapsed])

  // Persist dark mode
  useEffect(() => {
    localStorage.setItem('v_modern_dark', String(darkMode))
  }, [darkMode])

  // Validate session
  useEffect(() => { adminActions.validateSession() }, [])

  // If not logged in, show login within Modern theme wrapper
  if (!token || !user) {
    return (
      <div className={`vercel-theme ${darkMode ? 'v-dark' : ''}`}>
        <AdminLogin />
      </div>
    )
  }

  // Act As mode — render target portal with banner
  if (actingAs === 'referrer') {
    return (
      <div className={`vercel-theme ${darkMode ? 'v-dark' : ''}`}>
        <div className="v-banner v-banner-actas">
          <EyeIcon size={16} />
          <span>Viewing as Referrer</span>
          <button onClick={() => adminActions.clearImpersonation()}>Exit</button>
        </div>
        <ReferralPortal demoMode />
      </div>
    )
  }
  if (actingAs === 'client') {
    return (
      <div className={`vercel-theme ${darkMode ? 'v-dark' : ''}`}>
        <div className="v-banner v-banner-actas">
          <EyeIcon size={16} />
          <span>Viewing as Client</span>
          <button onClick={() => adminActions.clearImpersonation()}>Exit</button>
        </div>
        <ClientPortal demoMode />
      </div>
    )
  }

  const sidebarWidth = collapsed ? 60 : 240

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection />
      case 'mail': return <MailSection />
      case 'calls': return <CallSection />
      case 'clients': return <CRMSection />
      case 'projects': return <ProjectsSection />
      case 'invoices': return <InvoicesSection />
      case 'careers': return <CareersSection />
      case 'referrals': return <ReferralsSection />
      case 'sla': return <SLASection />
      case 'users': return <UsersSection />
      case 'logs': return <LogsSection />
      case 'settings': return <SettingsSection />
      case 'profile': return <ProfileSection />
      case 'ecosystem': return <EcosystemSection />
      case 'starterclass': return <StarterclassSection />
      default: return <DashboardSection />
    }
  }

  return (
    <div className={`vercel-theme ${darkMode ? 'v-dark' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="v-mobile-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 39, cursor: 'pointer',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <button
        className="v-mobile-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: 8, left: 8, zIndex: 50,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--v-radius)', background: 'var(--v-surface)',
          border: '1px solid var(--v-border)', cursor: 'pointer',
          color: 'var(--v-text-secondary)',
        }}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
      </button>

      {/* Sidebar */}
      <VercelSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onSwitchTheme={onSwitchTheme}
        onShowOnboarding={() => setShowOnboarding(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main content */}
      <main
        className="v-main"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {/* CSS override for mobile */}
        <style>{`@media (max-width: 768px) { .v-main { margin-left: 0 !important; } }`}</style>

        {/* Top bar */}
        <VercelTopbar
          onShowActAs={() => { setShowActAs(!showActAs); setShowImpersonate(false) }}
          onShowImpersonate={() => {
            setShowImpersonate(!showImpersonate)
            setShowActAs(false)
            if (!users.length) adminActions.loadUsers()
          }}
          showActAs={showActAs}
          showImpersonate={showImpersonate}
        />

        {/* Content */}
        <div className="v-content">
          {renderSection()}
        </div>
      </main>

      {/* Impersonate Picker Modal */}
      {showImpersonate && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowImpersonate(false)}
        >
          <div
            style={{
              background: 'var(--v-surface)', border: '1px solid var(--v-border)',
              borderRadius: 12, width: '100%', maxWidth: 420, padding: 24,
              boxShadow: 'var(--v-shadow)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--v-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCircleIcon size={20} />
                Impersonate User
              </h3>
              <button
                onClick={() => setShowImpersonate(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v-text-tertiary)', padding: 4 }}
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--v-text-tertiary)', marginBottom: 16 }}>
              View the app as this user sees it. Useful for demoing and troubleshooting.
            </p>
            <div style={{ maxHeight: 256, overflowY: 'auto' }}>
              {users.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--v-text-tertiary)', textAlign: 'center', padding: 16 }}>Loading users...</p>
              ) : (
                users.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => { adminActions.setImpersonating(u); setShowImpersonate(false); adminActions.setSection('profile') }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 12, borderRadius: 'var(--v-radius)', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left', transition: 'background 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--v-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--v-text)' }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--v-text-tertiary)' }}>{u.email}</p>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5,
                      padding: '2px 8px', borderRadius: 99,
                      color: u.role === 'Godmode' ? '#f5a623' : u.role === 'SuperAdmin' ? '#d97706' : 'var(--v-accent)',
                      background: u.role === 'Godmode' ? 'rgba(245,166,35,0.1)' : u.role === 'SuperAdmin' ? 'rgba(217,119,6,0.1)' : 'var(--v-accent-light)',
                    }}>{u.role}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Impersonating Banner */}
      {impersonating && (
        <div className="v-banner v-banner-impersonate">
          <UserCircleIcon size={16} />
          <span>Impersonating: {impersonating.name} ({impersonating.role})</span>
          <button onClick={() => adminActions.clearImpersonation()}>Exit</button>
        </div>
      )}

      {/* Onboarding Checklist */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingChecklist
            onClose={() => setShowOnboarding(false)}
            onNavigate={(section: string) => adminActions.setSection(section)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
