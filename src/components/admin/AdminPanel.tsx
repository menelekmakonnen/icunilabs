import { useEffect } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import AdminLogin from './AdminLogin'
import DashboardSection from './DashboardSection'
import SettingsSection from './SettingsSection'
import { ClientsSection, ProjectsSection, InvoicesSection, CareersSection, ReferralsSection, UsersSection, LogsSection, SLASection } from './AdminSections'
import { LayoutDashboard, Users, FolderOpen, FileText, Briefcase, UserCheck, Shield, Settings, Activity, Clock, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const { token, user, activeSection } = useAdminStore()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => { adminActions.validateSession() }, [])

  // Not logged in or not admin
  if (!token || !user) return <AdminLogin />

  const sidebarWidth = collapsed ? 64 : 240

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection />
      case 'clients': return <ClientsSection />
      case 'projects': return <ProjectsSection />
      case 'invoices': return <InvoicesSection />
      case 'careers': return <CareersSection />
      case 'referrals': return <ReferralsSection />
      case 'sla': return <SLASection />
      case 'users': return <UsersSection />
      case 'logs': return <LogsSection />
      case 'settings': return <SettingsSection />
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
          {NAV.map(item => {
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
            <div className="px-2 mb-2">
              <div className="text-xs text-white font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-neutral-600 truncate">{user.email}</div>
              <div className="text-[10px] text-[#ff7a00] font-bold">{user.role}</div>
            </div>
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
            <a href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">← Back to Site</a>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-7xl">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
