/**
 * VercelSidebar — Vercel-inspired navigation sidebar for the Modern admin theme.
 * Uses custom SVG icons from VercelIcons.tsx. Supports collapse, search, and role-based nav.
 */
import { useState } from 'react'
import { useAdminStore, adminActions } from '../../../store/useAdminStore'
import {
  DashboardIcon, MailIcon, ClientsIcon, ReferralsIcon, InvoicesIcon,
  SLAIcon, TeamIcon, EcosystemIcon, StarterclassIcon, ProjectsIcon, CareersIcon,
  LogsIcon, SettingsIcon, SearchIcon, LogoutIcon,
  SidebarCollapseIcon, SidebarExpandIcon, ThemeIcon,
  OnboardingIcon, ICUNILogo, SunIcon, MoonIcon,
  PhoneIcon,
} from './VercelIcons'

interface NavItem {
  id: string
  label: string
  icon: React.FC<{ className?: string; size?: number }>
  section?: string  // group label
}

const NAV_ITEMS: NavItem[] = [
  // Overview
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, section: 'Overview' },
  // Operations
  { id: 'mail', label: 'Mail Hub', icon: MailIcon, section: 'Operations' },
  { id: 'clients', label: 'Clients', icon: ClientsIcon },
  { id: 'calls', label: 'Calls', icon: PhoneIcon },
  { id: 'referrals', label: 'Referrals', icon: ReferralsIcon },
  { id: 'invoices', label: 'Invoices', icon: InvoicesIcon },
  { id: 'sla', label: 'SLA Tracker', icon: SLAIcon },
  // Management
  { id: 'users', label: 'Team', icon: TeamIcon, section: 'Management' },
  { id: 'ecosystem', label: 'Ecosystem', icon: EcosystemIcon },
  { id: 'starterclass', label: 'Starterclass', icon: StarterclassIcon },
  { id: 'projects', label: 'Projects', icon: ProjectsIcon },
  // Admin
  { id: 'careers', label: 'Careers', icon: CareersIcon, section: 'Admin' },
  { id: 'logs', label: 'Logs', icon: LogsIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

interface VercelSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  onSwitchTheme: () => void
  onShowOnboarding: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export default function VercelSidebar({
  collapsed, onToggleCollapse, mobileOpen, onCloseMobile,
  onSwitchTheme, onShowOnboarding, darkMode, onToggleDarkMode,
}: VercelSidebarProps) {
  const { activeSection, user, impersonating } = useAdminStore()
  const [searchQuery, setSearchQuery] = useState('')

  // When impersonating, filter sidebar by the IMPERSONATED user's role
  const effectiveRole = impersonating ? (impersonating.role || '') : (user?.role || '')
  const role = effectiveRole
  const isElevated = ['Godmode', 'SuperAdmin'].includes(role)

  // Department scope mapping
  const DEPT_SCOPE: Record<string, string[]> = {
    'Admin': ['dashboard', 'mail', 'clients', 'calls', 'referrals', 'invoices', 'sla', 'projects', 'settings'],
    'Sales': ['dashboard', 'mail', 'clients', 'calls', 'referrals'],
    'Product': ['dashboard', 'mail', 'projects', 'sla'],
  }

  const userPerms = user?.permissions || {}

  // Filter nav items by role
  const filteredNav = NAV_ITEMS.filter(item => {
    if (role === 'Godmode') return true
    if (item.id === 'users') return isElevated
    if (item.id === 'ecosystem') return isElevated
    if (item.id === 'starterclass') return isElevated
    if (item.id === 'careers') return false
    if (item.id === 'logs') return false
    if (role === 'SuperAdmin') return true
    const deptSections = DEPT_SCOPE[role] || []
    const inScope = deptSections.includes(item.id)
    if (userPerms[item.id] === false) return false
    return inScope
  })

  // Filter by search
  const searchFiltered = searchQuery
    ? filteredNav.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredNav

  // Group items by section
  const groupedNav: { section: string; items: NavItem[] }[] = []
  let currentSection = ''
  searchFiltered.forEach(item => {
    if (item.section && item.section !== currentSection) {
      currentSection = item.section
      groupedNav.push({ section: currentSection, items: [item] })
    } else {
      if (groupedNav.length === 0) groupedNav.push({ section: '', items: [] })
      groupedNav[groupedNav.length - 1].items.push(item)
    }
  })

  const effectiveUser = impersonating || user
  const userPic = effectiveUser?.profile_pic_url || ''

  const handleNavClick = (id: string) => {
    adminActions.setSection(id)
    adminActions.setError('')
    onCloseMobile()
  }

  return (
    <aside className={`v-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Header — Logo + Project name */}
      <div className="v-sidebar-header">
        <ICUNILogo size={22} />
        {!collapsed && (
          <>
            <span className="v-project-name">ICUNI Labs</span>
            <span className="v-project-badge">Ops</span>
          </>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="v-sidebar-search">
          <div className="v-sidebar-search-wrapper">
            <SearchIcon size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="v-shortcut">Ctrl+K</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="v-nav">
        {groupedNav.map((group, gi) => (
          <div key={gi} className="v-nav-section">
            {group.section && !collapsed && (
              <div className="v-nav-section-label">{group.section}</div>
            )}
            {group.items.map(item => {
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`v-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <item.icon className="v-nav-icon" size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer — User + Actions */}
      <div className="v-sidebar-footer">
        {/* Profile button */}
        <button
          onClick={() => handleNavClick('profile')}
          className="v-user-btn"
          title="Profile"
        >
          <div className="v-user-avatar">
            {userPic ? (
              <img src={userPic} alt="" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                <circle cx="10" cy="7" r="3.5" />
                <path d="M3.5 17c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          {!collapsed && (
            <div className="v-user-info">
              <div className="v-user-name">{effectiveUser?.name || user?.name}</div>
              <div className="v-user-email">{effectiveUser?.company_email || (effectiveUser?.email?.includes('@icuni.org') ? effectiveUser.email : effectiveUser?.email)}</div>
            </div>
          )}
        </button>

        {/* Dark/Light mode toggle */}
        <button onClick={onToggleDarkMode} className="v-theme-toggle" title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
          {darkMode ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Onboarding */}
        <button onClick={onShowOnboarding} className="v-theme-toggle" title="Onboarding">
          <OnboardingIcon size={15} />
          {!collapsed && <span>Onboarding</span>}
        </button>

        {/* Switch to Classic theme */}
        <button onClick={onSwitchTheme} className="v-theme-toggle" title="Switch to Classic theme">
          <ThemeIcon size={15} />
          {!collapsed && <span>Classic View</span>}
        </button>

        {/* Logout */}
        <button
          onClick={() => { adminActions.logout(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}
          className="v-action-btn danger"
          style={{ width: '100%' }}
        >
          <LogoutIcon size={15} />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          className="v-theme-toggle"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ display: 'none' }}
          id="v-collapse-desktop"
        >
          {collapsed ? <SidebarExpandIcon size={15} /> : <SidebarCollapseIcon size={15} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Desktop collapse strip — right edge */}
      <button
        onClick={onToggleCollapse}
        className="v-collapse-strip"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: 'col-resize',
          background: 'transparent',
          border: 'none',
          padding: 0,
          zIndex: 10,
          transition: 'background 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--v-accent)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />
    </aside>
  )
}
