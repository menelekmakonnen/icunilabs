import { useEffect } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import AdminLogin from './AdminLogin'
import DashboardSection from './DashboardSection'
import SettingsSection from './SettingsSection'
import { ProjectsSection, InvoicesSection, CareersSection, ReferralsSection, UsersSection, LogsSection, SLASection } from './AdminSections'
import CRMSection from './CRMSection'
import ProfileSection from './ProfileSection'
import ReferralPortal from '../portal/ReferralPortal'
import ClientPortal from '../portal/ClientPortal'
import { LayoutDashboard, Users, FolderOpen, FileText, Briefcase, UserCheck, Shield, Settings, Activity, Clock, LogOut, Eye, UserCircle, X, BookOpen, Globe, Mail } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import OnboardingChecklist from './OnboardingChecklist'
import EcosystemSection from './EcosystemSection'
import MailSection from './MailSection'
import VercelAdminShell from './vercel/VercelAdminShell'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'mail', label: 'Mail', icon: Mail },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'referrals', label: 'Referrals', icon: UserCheck },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'sla', label: 'SLA', icon: Clock },
  { id: 'users', label: 'Team', icon: Shield },
  { id: 'ecosystem', label: 'Ecosystem', icon: Globe },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'careers', label: 'Careers', icon: Briefcase },
  { id: 'logs', label: 'Logs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminPanel() {
  const { token, user, activeSection, actingAs, impersonating, users } = useAdminStore()
  const [collapsed, setCollapsed] = useState(false)
  const [showActAs, setShowActAs] = useState(false)
  const [showImpersonate, setShowImpersonate] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminTheme, setAdminTheme] = useState(() =>
    localStorage.getItem('icuni_admin_theme') || 'modern'
  )

  // ── Session validation — must be called before any early returns (React hook rules) ──
  useEffect(() => { adminActions.validateSession() }, [])

  // ── Modern Theme Routing ──
  // If Modern theme selected, delegate entirely to VercelAdminShell
  if (adminTheme === 'modern') {
    return <VercelAdminShell onSwitchTheme={() => {
      localStorage.setItem('icuni_admin_theme', 'classic')
      setAdminTheme('classic')
    }} />
  }

  // ── Classic Theme below — entirely unchanged ──

  // Not logged in or not admin
  if (!token || !user) return <AdminLogin />

  // ── Role Helpers ──
  const role = user.role || ''
  const isElevated = ['Godmode', 'SuperAdmin'].includes(role) // Can manage team + ecosystem
  const userPerms = user.permissions || {}

  // Department scope mapping (frontend mirror of backend DEPARTMENT_SCOPE)
  const DEPT_SCOPE: Record<string, string[]> = {
    'Admin':      ['dashboard', 'mail', 'clients', 'referrals', 'invoices', 'sla', 'projects', 'settings'],
    'Sales':      ['dashboard', 'mail', 'clients', 'referrals'],
    'Product':    ['dashboard', 'mail', 'projects', 'sla']
  }

  // Filter nav items based on role + permissions
  const filteredNav = NAV.filter(item => {
    // Godmode sees everything
    if (role === 'Godmode') return true
    // Team + Ecosystem are elevated-only
    if (item.id === 'users') return isElevated
    if (item.id === 'ecosystem') return isElevated
    // Careers + Logs are Godmode-only
    if (item.id === 'careers') return false
    if (item.id === 'logs') return false
    // SuperAdmin gets the curated menu
    if (role === 'SuperAdmin') return true
    // Check department scope first, then permission overrides
    const deptSections = DEPT_SCOPE[role] || []
    const inScope = deptSections.includes(item.id)
    // Permission toggles can override scope (admin can restrict further)
    if (userPerms[item.id] === false) return false
    return inScope
  })

  // ── Act As: render target portal ──
  if (actingAs === 'referrer') {
    return (
      <>
        <ActingAsBanner role="Referrer" />
        <ReferralPortal demoMode />
      </>
    )
  }
  if (actingAs === 'client') {
    return (
      <>
        <ActingAsBanner role="Client" />
        <ClientPortal demoMode />
      </>
    )
  }

  const sidebarWidth = collapsed ? 64 : 240

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection />
      case 'mail': return <MailSection />
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
      default: return <DashboardSection />
    }
  }

  // Close mobile sidebar when section changes
  const handleNavClick = (id: string) => {
    adminActions.setSection(id)
    adminActions.setError('')  // Clear stale errors on nav
    setMobileOpen(false)
  }

  // Profile picture helper — show impersonated user when active
  const effectiveUser = impersonating || user
  const userPic = effectiveUser?.profile_pic_url || ''

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : (
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        )}
      </button>

      {/* Fixed Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-neutral-900/80 backdrop-blur-md border-r border-neutral-800 flex z-40 transition-all duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar Content */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-4 border-b border-neutral-800 shrink-0">
            <img src="/icuni_logo.webp" alt="ICUNI" className="w-8 h-8 rounded-md object-contain shrink-0" />
            {!collapsed && <span className="font-bold text-sm text-white tracking-tight">Ops Console</span>}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {filteredNav.map(item => {
              const active = activeSection === item.id
              return (
                <motion.button key={item.id} onClick={() => handleNavClick(item.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group ${
                    active
                      ? 'bg-[#00bfff]/10 text-[#00bfff] border border-[#00bfff]/20'
                      : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50 border border-transparent'
                  }`}>
                  <motion.div
                    animate={active ? {
                      scale: [1, 1.15, 1],
                      rotate: [0, -8, 8, 0],
                    } : {}}
                    transition={active ? {
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: 'easeInOut',
                    } : {}}
                    whileHover={{
                      y: [0, -3, 0],
                      transition: { duration: 0.4, ease: 'easeOut' },
                    }}
                    whileTap={{
                      scale: 0.8,
                      rotate: -12,
                      transition: { duration: 0.15 },
                    }}
                    className="shrink-0"
                  >
                    <item.icon className={`w-[18px] h-[18px] ${active ? 'text-[#00bfff]' : 'group-hover:text-white transition-colors'}`} />
                  </motion.div>
                  {!collapsed && item.label}
                </motion.button>
              )
            })}
          </nav>

          {/* Bottom — Profile + Actions */}
          <div className="border-t border-neutral-800 p-3 space-y-2 shrink-0">
            {/* Profile button with picture */}
            <button
              onClick={() => handleNavClick('profile')}
              className={`w-full flex items-center gap-3 rounded-lg hover:bg-neutral-800/50 transition-all cursor-pointer group ${collapsed ? 'justify-center py-2' : 'px-2 py-2.5 text-left'}`}
              title="Profile"
            >
              {/* Profile picture circle */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 shrink-0 border-2 border-neutral-700 group-hover:border-[#00bfff]/40 transition-colors">
                {userPic ? (
                  <img src={userPic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00bfff]/20 to-[#ff7a00]/20">
                    <svg className="w-4 h-4 text-neutral-500" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3.5 17c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </div>
                )}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white font-medium truncate group-hover:text-[#00bfff] transition-colors">{effectiveUser?.name || user.name}</div>
                  <div className="text-[10px] text-neutral-600 truncate">{effectiveUser?.email || user.email}</div>
                </div>
              )}
            </button>

            <button onClick={() => setShowOnboarding(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-600 hover:text-[#ff7a00] hover:bg-[#ff7a00]/5 text-xs transition-all cursor-pointer border border-transparent hover:border-[#ff7a00]/20">
              <BookOpen className="w-4 h-4" />{!collapsed && 'Onboarding'}
            </button>
            <button onClick={() => { localStorage.setItem('icuni_admin_theme', 'modern'); setAdminTheme('modern') }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-600 hover:text-[#00bfff] hover:bg-[#00bfff]/5 text-xs transition-all cursor-pointer border border-transparent hover:border-[#00bfff]/20">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M14 10h4M14 14h4" /></svg>
              {!collapsed && 'Modern View'}
            </button>
            <button onClick={() => { adminActions.logout(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/5 text-xs transition-all cursor-pointer">
              <LogOut className="w-4 h-4" />{!collapsed && 'Logout'}
            </button>
          </div>
        </div>

        {/* Right-edge collapse toggle strip — hidden on mobile */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-3 shrink-0 items-center justify-center cursor-pointer hover:bg-neutral-700/30 transition-colors border-l border-neutral-800/50 group"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="w-0.5 h-8 rounded-full bg-neutral-700 group-hover:bg-[#00bfff]/50 transition-colors" />
        </button>
      </aside>

      {/* Main Content — offset by sidebar width on desktop, full width on mobile */}
      <main className="min-h-screen transition-all duration-200">
        {/* CSS-driven sidebar offset: hidden on mobile, applied on md+ */}
        <style>{`@media (min-width: 768px) { .admin-main { margin-left: ${sidebarWidth}px; } }`}</style>
        <div className="admin-main transition-all duration-200">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Spacer for hamburger on mobile */}
            <div className="w-10 md:hidden" />
            <h1 className="text-base md:text-lg font-bold text-white capitalize">{activeSection}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {isElevated && (
              <div className="relative">
                <button onClick={() => { setShowActAs(!showActAs); setShowImpersonate(false) }}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer border border-neutral-800">
                  <Eye className="w-3.5 h-3.5" />Act as...
                </button>
                {showActAs && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50">
                    {[['referrer', 'Referrer'], ['client', 'Client']].map(([key, label]) => (
                      <button key={key} onClick={() => { adminActions.setActingAs(key); setShowActAs(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer">
                        View as {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isElevated && (
              <button onClick={() => { setShowImpersonate(!showImpersonate); setShowActAs(false); if (!users.length) adminActions.loadUsers() }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer border border-neutral-800">
                <UserCircle className="w-3.5 h-3.5" />Impersonate
              </button>
            )}
            <a href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">← Back to Site</a>
          </div>
        </header>

        {/* Content */}
        <div className="p-3 md:p-6 max-w-7xl">
          {renderSection()}
        </div>
        </div>
      </main>

      {/* Impersonate Picker Modal */}
      {showImpersonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowImpersonate(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserCircle className="w-5 h-5 text-[#00bfff]" />Impersonate User</h3>
              <button onClick={() => setShowImpersonate(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-neutral-500 mb-4">View the app as this user sees it. Useful for demoing and troubleshooting.</p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {users.length === 0 ? (
                <p className="text-sm text-neutral-600 text-center py-4">Loading users...</p>
              ) : (
                users.map((u: any) => (
                  <button key={u.id} onClick={() => { adminActions.setImpersonating(u); setShowImpersonate(false); adminActions.setSection('profile') }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer group">
                    <div className="text-left">
                      <p className="text-sm text-white font-medium">{u.name}</p>
                      <p className="text-[11px] text-neutral-500">{u.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      u.role === 'Godmode' ? 'text-[#ff7a00] bg-[#ff7a00]/10' :
                      u.role === 'SuperAdmin' ? 'text-amber-400 bg-amber-400/10' :
                      u.role === 'Admin' ? 'text-[#8b5cf6] bg-[#8b5cf6]/10' :
                      u.role === 'Sales' ? 'text-emerald-400 bg-emerald-400/10' :
                      u.role === 'Product' ? 'text-cyan-400 bg-cyan-400/10' :
                      u.role === 'Referrer' ? 'text-emerald-400 bg-emerald-500/10' :
                      'text-[#00bfff] bg-[#00bfff]/10'
                    }`}>{u.role}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Impersonating Banner */}
      {impersonating && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 py-2 bg-gradient-to-r from-purple-600/90 to-[#00bfff]/90 backdrop-blur-sm">
          <UserCircle className="w-4 h-4 text-white" />
          <span className="text-sm text-white font-bold">Impersonating: {impersonating.name} ({impersonating.role})</span>
          <button onClick={() => adminActions.clearImpersonation()}
            className="ml-2 px-3 py-1 text-xs font-bold text-white bg-white/20 rounded-lg hover:bg-white/30 transition-all cursor-pointer">Exit</button>
        </div>
      )}
      {/* Onboarding Checklist */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingChecklist onClose={() => setShowOnboarding(false)} onNavigate={(section) => adminActions.setSection(section)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Floating banner for Act As mode ──
function ActingAsBanner({ role }: { role: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 py-2 bg-gradient-to-r from-[#ff7a00]/90 to-amber-500/90 backdrop-blur-sm">
      <Eye className="w-4 h-4 text-white" />
      <span className="text-sm text-white font-bold">Viewing as {role}</span>
      <button onClick={() => adminActions.clearImpersonation()}
        className="ml-2 px-3 py-1 text-xs font-bold text-white bg-white/20 rounded-lg hover:bg-white/30 transition-all cursor-pointer">Exit</button>
    </div>
  )
}
