import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Users, FolderOpen, FileText, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

const card = 'bg-neutral-900/50 border border-neutral-800 rounded-xl p-5'

export default function DashboardSection() {
  const s = useAdminStore()
  useEffect(() => { adminActions.loadDashboard() }, [])

  const activeProjects = s.projects.filter((p: any) => p.status === 'active').length
  const pendingInvoices = s.invoices.filter((i: any) => i.status === 'pending' || i.status === 'partial').length
  const totalRevenue = s.invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
  const breached = s.slaStatuses.filter((s: any) => s.breached).length

  const stats = [
    { label: 'Active Clients', value: s.clients.length, icon: Users, color: '#00bfff' },
    { label: 'Active Projects', value: activeProjects, icon: FolderOpen, color: '#ff7a00' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: FileText, color: '#d97706' },
    { label: 'Total Revenue', value: `GH₵${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
    { label: 'SLA Breaches', value: breached, icon: AlertTriangle, color: breached > 0 ? '#ef4444' : '#22c55e' },
    { label: 'Activity Logs', value: s.logs.length, icon: Clock, color: '#8b5cf6' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Dashboard</h2>
        <p className="text-sm text-neutral-500 mt-1">Welcome back, {s.user?.name}</p>
      </div>

      {s.loading && <div className="text-center py-8 text-neutral-500 text-sm">Loading dashboard data...</div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((st, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${card} hover:border-neutral-700 transition-colors`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${st.color}15` }}>
                <st.icon className="w-4.5 h-4.5" style={{ color: st.color }} />
              </div>
              <span className="text-xs text-neutral-500 font-medium">{st.label}</span>
            </div>
            <div className="text-2xl font-black text-white">{st.value}</div>
          </motion.div>
        ))}
      </div>

      {/* SLA Health */}
      {s.slaStatuses.length > 0 && (
        <div className={card}>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">SLA Health</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {s.slaStatuses.slice(0, 10).map((sla: any, i: number) => {
              const pct = Math.min(Math.round((sla.severity || 0) * 100), 150)
              const color = pct >= 100 ? '#ef4444' : pct >= 75 ? '#d97706' : '#22c55e'
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{sla.title}</div>
                    <div className="text-xs text-neutral-500">{sla.step_name} — {Math.round(sla.elapsed / 60)}h elapsed</div>
                  </div>
                  <div className="w-24">
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                    </div>
                    <div className="text-[10px] text-neutral-600 mt-0.5 text-right">{pct}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className={card}>
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Recent Activity</h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {s.logs.length === 0 && <p className="text-sm text-neutral-600 py-4 text-center">No recent activity</p>}
          {s.logs.slice(0, 20).map((log: any, i: number) => (
            <div key={i} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-neutral-800/30 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00bfff] shrink-0" />
              <span className="text-neutral-400 truncate flex-1">{log.user_name || 'System'}: {log.detail || log.action}</span>
              <span className="text-xs text-neutral-600 shrink-0">{log.timestamp ? new Date(log.timestamp).toLocaleDateString() : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
