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
import { LayoutDashboard, Users, FolderOpen, FileText, Briefcase, UserCheck, Shield, Settings, Activity, Clock, LogOut, ChevronLeft, ChevronRight, Eye, UserCircle, X } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'careers', label: 'Careers', icon: Briefcase },
  { id: 'referrals', label: 'Referrals', icon: UserCheck },
  { id: 'sla', label: 'SLA', icon: Clock },
  { id: 'users', label: 'Users', icon: Shield },
  { id: 'logs', label: 'Logs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminPanel() {
  const { token, user, activeSection, actingAs, impersonating, users } = useAdminStore()
  const [collapsed, setCollapsed] = useState(false)
  const [showActAs, setShowActAs] = useState(false)
  const [showImpersonate, setShowImpersonate] = useState(false)

  useEffect(() => { adminActions.validateSession() }, [])

  // Not logged in or not admin
  if (!token || !user) return <AdminLogin />

  const isGodmode = user.role === 'Godmode'
  const isAdmin = user.role === 'Admin'
  const userPerms = user.permissions || {}

  // Filter nav items based on permissions (Godmode sees everything)
  const filteredNav = NAV.filter(item => {
    // Godmode always sees all
    if (isGodmode) return true
    // Users section is Godmode-only
    if (item.id === 'users') return false
    // For Admin, check permission toggles (default: enabled)
    if (isAdmin) {
      return userPerms[item.id] !== false
    }
    return true
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
      default: return <DashboardSection />
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Fixed Sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen bg-neutral-900/50 border-r border-neutral-800 flex flex-col z-30 transition-all duration-200"
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-neutral-800 shrink-0">
          <img src="/icuni_logo.png" alt="ICUNI" className="w-8 h-8 rounded-md object-contain shrink-0" />
          {!collapsed && <span className="font-bold text-sm text-white tracking-tight">Ops Console</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {filteredNav.map(item => {
            const active = activeSection === item.id
            return (
              <motion.button key={item.id} onClick={() => adminActions.setSection(item.id)}
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

        {/* Bottom */}
        <div className="border-t border-neutral-800 p-3 space-y-2 shrink-0">
          {!collapsed && (
            <button
              onClick={() => adminActions.setSection('profile')}
              className="w-full text-left px-2 mb-2 rounded-lg hover:bg-neutral-800/50 py-2 transition-all cursor-pointer group"
            >
              <div className="text-xs text-white font-medium truncate group-hover:text-[#00bfff] transition-colors">{user.name}</div>
              <div className="text-[10px] text-neutral-600 truncate">{user.email}</div>
              <div className="text-[10px] text-[#ff7a00] font-bold">{user.role}</div>
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => adminActions.setSection('profile')}
              className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-neutral-800/50 transition-all cursor-pointer mb-2"
              title="Profile"
            >
              <svg className="w-5 h-5 text-neutral-500 hover:text-[#00bfff]" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3.5 17c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </button>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800/50 text-xs transition-all cursor-pointer">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" />Collapse</>}
          </button>
          <button onClick={() => { adminActions.logout(); window.location.hash = '' }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/5 text-xs transition-all cursor-pointer">
            <LogOut className="w-4 h-4" />{!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content — offset by sidebar width */}
      <main className="min-h-screen transition-all duration-200" style={{ marginLeft: sidebarWidth }}>
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white capitalize">{activeSection}</h1>
          </div>
          <div className="flex items-center gap-3">
            {isGodmode && (
              <div className="relative">
                <button onClick={() => { setShowActAs(!showActAs); setShowImpersonate(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer border border-neutral-800">
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
            {isGodmode && (
              <button onClick={() => { setShowImpersonate(!showImpersonate); setShowActAs(false); if (!users.length) adminActions.loadUsers() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer border border-neutral-800">
                <UserCircle className="w-3.5 h-3.5" />Impersonate
              </button>
            )}
            <a href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">← Back to Site</a>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-7xl">
          {renderSection()}
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
                  <button key={u.id} onClick={() => { adminActions.setImpersonating(u); setShowImpersonate(false) }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer group">
                    <div className="text-left">
                      <p className="text-sm text-white font-medium">{u.name}</p>
                      <p className="text-[11px] text-neutral-500">{u.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      u.role === 'Godmode' ? 'text-[#ff7a00] bg-[#ff7a00]/10' : u.role === 'Referrer' ? 'text-emerald-400 bg-emerald-500/10' : 'text-[#00bfff] bg-[#00bfff]/10'
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
