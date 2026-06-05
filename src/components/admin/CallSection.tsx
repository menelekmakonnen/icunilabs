import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { resolveStaffName } from '../../utils/resolveStaffName'
import { useAdminStore, adminActions, useEffectiveUser } from '../../store/useAdminStore'
import { Phone, TrendingUp, Users, Clock, Target, BarChart3, ChevronDown, Download, Calendar, Filter, FileText, Pencil, ArrowRight, Bell, X, AlertTriangle, MessageSquareText } from 'lucide-react'
import CallGuide from './CallGuide'
import '../admin/crm.css'

const PATH_LABELS: Record<string, string> = {
  wc_receptionist: 'WC Receptionist',
  wc_decision_maker: 'WC Decision-Maker',
  bc_front_desk: 'BC Front Desk',
  bc_mr_cooper: 'BC Mr Cooper',
  bc_owner: 'BC Owner',
}

const OUTCOME_LABELS: Record<string, string> = {
  meeting_booked: 'Meeting Booked',
  callback_scheduled: 'Callback Scheduled',
  interested_will_revert: 'Interested',
  no_interest: 'No Interest',
  needs_follow_up: 'Follow-Up',
}

function fmtDuration(sec: number) {
  if (!sec) return '0:00'
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtDate(d: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return d }
}

type DateFilter = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'this_year' | 'all' | 'custom'

export default function CallSection() {
  const { callLogs: rawCallLogs, clients } = useAdminStore()
  const effectiveUser = useEffectiveUser()
  const isSalesOnly = effectiveUser?.role === 'Sales'

  // Sales associates only see their own calls; everyone else sees all
  const callLogs = useMemo(() => {
    if (!rawCallLogs) return []
    if (isSalesOnly && effectiveUser?.email) {
      return rawCallLogs.filter((l: any) => l.caller_email === effectiveUser.email)
    }
    return rawCallLogs
  }, [rawCallLogs, isSalesOnly, effectiveUser?.email])
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'transcripts' | 'upcoming'>('overview')
  const [dateFilter, setDateFilter] = useState<DateFilter>('this_week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [outcomeFilter, setOutcomeFilter] = useState<string | null>(null)
  
  // Call Picker State
  const [showCallPicker, setShowCallPicker] = useState(false)
  const [callGuideClient, setCallGuideClient] = useState<any>(null)
  const callPickerRef = useRef<HTMLDivElement>(null)
  
  // Toast & Countdown State
  const [toasts, setToasts] = useState<{ id: string; clientName: string; date: string; clientId: string }[]>([])
  const dismissedToasts = useRef(new Set<string>())
  const [_tick, setTick] = useState(0)

  useEffect(() => {
    adminActions.loadCallLogs({ page_size: 500 })
    adminActions.loadCompetitorIntel()
    adminActions.loadClients()
  }, [])

  // Live ticker for countdown timers
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Upcoming Calls (includes overdue backlog) ──
  const upcomingCalls = useMemo(() => {
    const now = Date.now()
    const clientMap: Record<string, any> = {}
    ;(clients || []).forEach((c: any) => { clientMap[c.client_id] = c })
    
    // Collect all next_action_date entries with actionable outcomes, deduplicated by client_id (keep nearest)
    const byClient: Record<string, any> = {}
    ;(callLogs || []).forEach((log: any) => {
      if (!log.next_action_date || !log.client_id) return
      if (!['callback_scheduled', 'needs_follow_up', 'meeting_booked'].includes(log.outcome)) return
      const d = new Date(log.next_action_date).getTime()
      if (isNaN(d)) return
      // Keep the most recent (closest to now) entry per client
      if (!byClient[log.client_id] || Math.abs(d - now) < Math.abs(new Date(byClient[log.client_id].next_action_date).getTime() - now)) {
        byClient[log.client_id] = log
      }
    })

    return Object.values(byClient)
      .map((log: any) => {
        const client = clientMap[log.client_id] || {}
        const actionTime = new Date(log.next_action_date).getTime()
        const diff = actionTime - now
        const isOverdue = actionTime < now
        return { ...log, client, diff, isOverdue, clientName: client.name || client.company || log.client_name || 'Unknown' }
      })
      // Sort: overdue first (most overdue at top), then future by soonest
      .sort((a: any, b: any) => {
        if (a.isOverdue && !b.isOverdue) return -1
        if (!a.isOverdue && b.isOverdue) return 1
        if (a.isOverdue && b.isOverdue) return new Date(a.next_action_date).getTime() - new Date(b.next_action_date).getTime()
        return a.diff - b.diff
      })
  }, [callLogs, clients, _tick])

  // ── Toast Notifications (fire when ≤ 15min away) ──
  const dismissToast = useCallback((id: string) => {
    dismissedToasts.current.add(id)
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const now = Date.now()
    const newToasts: typeof toasts = []
    upcomingCalls.forEach((call: any) => {
      const diff = new Date(call.next_action_date).getTime() - now
      if (diff > 0 && diff <= 15 * 60 * 1000 && !dismissedToasts.current.has(call.call_id)) {
        newToasts.push({ id: call.call_id, clientName: call.clientName, date: call.next_action_date, clientId: call.client_id })
      }
    })
    if (newToasts.length > 0) {
      setToasts(prev => {
        const ids = new Set(prev.map(t => t.id))
        const fresh = newToasts.filter(t => !ids.has(t.id))
        return fresh.length > 0 ? [...prev, ...fresh] : prev
      })
    }
  }, [upcomingCalls])

  // Auto-dismiss toasts after 30s
  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map(t => setTimeout(() => dismissToast(t.id), 30000))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismissToast])

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (callPickerRef.current && !callPickerRef.current.contains(e.target as Node)) {
        setShowCallPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEditClient = (clientId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const client = clients?.find((c: any) => c.client_id === clientId)
    if (client) {
      if (adminActions.setActiveClientOptimistic) adminActions.setActiveClientOptimistic(client)
      if (adminActions.setSection) adminActions.setSection('clients')
    }
  }

  // ── Date Filtering Logic ──
  const filteredLogs = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let start: Date | null = null
    let end: Date | null = null

    switch (dateFilter) {
      case 'today':
        start = todayStart
        end = new Date(todayStart.getTime() + 86400000)
        break
      case 'yesterday':
        start = new Date(todayStart.getTime() - 86400000)
        end = todayStart
        break
      case 'this_week': {
        const day = now.getDay() || 7 // Mon=1, Sun=7
        start = new Date(todayStart.getTime() - (day - 1) * 86400000)
        end = new Date(start.getTime() + 7 * 86400000)
        break
      }
      case 'last_week': {
        const day = now.getDay() || 7
        const thisWeekStart = new Date(todayStart.getTime() - (day - 1) * 86400000)
        start = new Date(thisWeekStart.getTime() - 7 * 86400000)
        end = thisWeekStart
        break
      }
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear() + 1, 0, 1)
        break
      case 'custom':
        if (customStart) start = new Date(customStart)
        if (customEnd) {
          end = new Date(customEnd)
          end.setDate(end.getDate() + 1) // include end day
        }
        break
    }

    if (!start && !end) {
      if (outcomeFilter) return callLogs.filter((log: any) => log.outcome === outcomeFilter)
      return callLogs
    }

    return callLogs.filter(log => {
      const d = new Date(log.call_start)
      if (start && d < start) return false
      if (end && d >= end) return false
      if (outcomeFilter && log.outcome !== outcomeFilter) return false
      return true
    })
  }, [callLogs, dateFilter, customStart, customEnd, outcomeFilter])

  // Filtered transcripts (matching the active date filter)
  const filteredTranscripts = useMemo(() => {
    return filteredLogs.filter((l: any) => l.transcript && String(l.transcript).trim())
  }, [filteredLogs])

  // All transcripts across all time (ignores date filter)
  const allTranscripts = useMemo(() => {
    return (callLogs || []).filter((l: any) => l.transcript && String(l.transcript).trim())
  }, [callLogs])

  // ── Client-Side Analytics ──
  const analytics = useMemo(() => {
    let totalDuration = 0
    let meetings = 0
    const paths: Record<string, number> = {}
    const pathMeetings: Record<string, number> = {}
    const outcomes: Record<string, number> = {}
    const callers: Record<string, { calls: number; meetings: number; name: string }> = {}

    filteredLogs.forEach(log => {
      totalDuration += Number(log.duration_seconds || 0)
      if (log.outcome === 'meeting_booked') meetings++

      // Outcomes
      const out = log.outcome || 'unknown'
      outcomes[out] = (outcomes[out] || 0) + 1

      // Paths
      const p = log.path_loaded || 'unknown'
      paths[p] = (paths[p] || 0) + 1
      if (log.outcome === 'meeting_booked') {
        pathMeetings[p] = (pathMeetings[p] || 0) + 1
      }

      // Callers
      const caller = log.caller_email || 'unknown'
      if (!callers[caller]) {
        callers[caller] = { calls: 0, meetings: 0, name: log.caller_name || caller }
      }
      callers[caller].calls++
      if (log.outcome === 'meeting_booked') callers[caller].meetings++
    })

    const avgDuration = filteredLogs.length ? Math.round(totalDuration / filteredLogs.length) : 0

    // Conversion by Path
    const conversionByPath = Object.keys(paths).map(p => ({
      path: p,
      calls: paths[p],
      meetings: pathMeetings[p] || 0,
      rate: paths[p] ? Math.round(((pathMeetings[p] || 0) / paths[p]) * 100) : 0
    })).sort((a, b) => b.rate - a.rate)

    // Leaderboard
    const leaderboard = Object.values(callers).map(c => ({
      ...c,
      conversionRate: c.calls ? Math.round((c.meetings / c.calls) * 100) : 0
    })).sort((a, b) => b.meetings - a.meetings || b.calls - a.calls)

    // Daily attempt/conversation targets (computed from today's calls in all logs)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayLogs = callLogs.filter((l: any) => {
      try { return new Date(l.call_start) >= todayStart } catch { return false }
    })
    let todayAttempts = 0, todayConversations = 0
    todayLogs.forEach((l: any) => {
      const dur = Number(l.duration_seconds || 0)
      if (l.call_type === 'conversation' || (!l.call_type && dur > 180)) todayConversations++
      else todayAttempts++
    })

    return {
      calls: filteredLogs.length,
      avgDuration,
      meetings,
      pathCounts: paths,
      conversionByPath,
      outcomeCounts: outcomes,
      callerLeaderboard: leaderboard,
      todayAttempts,
      todayConversations
    }
  }, [filteredLogs, callLogs])

  // ── Actionable Follow-ups ──
  const actionableLogs = useMemo(() => {
    return callLogs
      .filter((log: any) => ['needs_follow_up', 'callback_scheduled', 'interested_will_revert'].includes(log.outcome))
      .sort((a: any, b: any) => new Date(b.call_start).getTime() - new Date(a.call_start).getTime())
  }, [callLogs])

  // ── CSV Export ──
  const handleExport = () => {
    if (!filteredLogs.length) return
    
    const headers = ['Date', 'Client', 'Caller', 'Path', 'Outcome', 'Duration (s)', 'Notes', 'Pipeline Auto-Advanced', 'Points Checked', 'Total Points']
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        let ptsChecked = 0
        try { ptsChecked = JSON.parse(log.talking_points_checked || '[]').length } catch { /* ignored */ }
        
        return [
          `"${new Date(log.call_start).toISOString()}"`,
          `"${(log.client_name || '').replace(/"/g, '""')}"`,
          `"${(log.caller_name || log.caller_email || '').replace(/"/g, '""')}"`,
          `"${(PATH_LABELS[log.path_loaded] || log.path_loaded || '').replace(/"/g, '""')}"`,
          `"${(OUTCOME_LABELS[log.outcome] || log.outcome || '').replace(/"/g, '""')}"`,
          log.duration_seconds || 0,
          `"${(log.call_notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${(log.pipeline_auto_advanced || '').replace(/"/g, '""')}"`,
          ptsChecked,
          log.talking_points_total || 0
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `icuni_call_report_${dateFilter}_${new Date().getTime()}.csv`
    link.click()
  }

  return (
    <div className="crm-fade-in p-3 sm:p-6 h-full flex flex-col">
      {/* Header & Filters */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Phone className="w-6 h-6 text-[#00bfff]" /> Call Dashboard
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Advanced analytics and call activity monitoring.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-neutral-900/50 p-2 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:pr-4 sm:border-r sm:border-neutral-800">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <select 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value as DateFilter)}
              className="bg-transparent text-sm text-white font-medium outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm sm:pr-4 sm:border-r sm:border-neutral-800">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded outline-none border border-neutral-700" />
              <span className="text-neutral-500">to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded outline-none border border-neutral-700" />
            </div>
          )}

          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors border border-neutral-700">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </button>
          
          <div className="relative sm:border-l sm:border-neutral-800 sm:pl-4 sm:ml-1" ref={callPickerRef}>
            <button
              onClick={() => setShowCallPicker(!showCallPicker)}
              className="mob-icon-btn flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs sm:text-sm font-bold cursor-pointer hover:bg-emerald-500/15 hover:border-emerald-400/40 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span className="mob-label">Start Call</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-60 hidden sm:block" />
            </button>
            {showCallPicker && (
              <div className="absolute top-full right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-h-72 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-50 py-1"
                style={{ scrollbarWidth: 'thin' }}>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Select a contact</p>
                {(!clients || clients.length === 0) && (
                  <p className="px-3 py-4 text-xs text-neutral-500 text-center">No contacts yet</p>
                )}
                {(clients || []).map((cl: any) => (
                  <button key={cl.client_id}
                    onClick={() => { setCallGuideClient(cl); setShowCallPicker(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer hover:bg-neutral-800/70 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(cl.name || cl.company || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{cl.name || cl.company || 'Unnamed'}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{cl.company || 'No company'} • {cl.phone || 'No phone'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 mb-4 sm:mb-6 border-b border-neutral-800 overflow-x-auto scrollbar-hide">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'logs', label: `Call Logs (${filteredLogs.length})`, icon: FileText },
          { id: 'transcripts', label: `Transcripts (${filteredTranscripts.length})`, icon: MessageSquareText },
          { id: 'upcoming', label: `Callbacks (${upcomingCalls.length})`, icon: Bell }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? 'border-[#00bfff] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="crm-fade-in space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Calls', value: analytics.calls, icon: Phone, color: '#00bfff' },
                { label: 'Avg Duration', value: fmtDuration(analytics.avgDuration), icon: Clock, color: '#f59e0b' },
                { label: 'Meetings Booked', value: analytics.meetings, icon: Target, color: '#10b981' },
                { label: 'Overall Conversion', value: `${analytics.calls ? Math.round((analytics.meetings / analytics.calls) * 100) : 0}%`, icon: TrendingUp, color: '#8b5cf6' },
              ].map((m, i) => (
                <div key={i} className="crm-metric">
                  <div className="flex items-center gap-2 mb-2">
                    <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">{m.label}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Daily Targets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{
                label: 'Attempts Today', value: analytics.todayAttempts || 0,
                min: 25, max: 30, color: '#00bfff'
              }, {
                label: 'Conversations Today', value: analytics.todayConversations || 0,
                min: 15, max: 18, color: '#10b981'
              }].map((t, i) => {
                const pct = Math.min((t.value / t.min) * 100, 100)
                const status = t.value >= t.min ? 'text-emerald-400' : t.value >= t.min * 0.7 ? 'text-amber-400' : 'text-red-400'
                return (
                  <div key={i} className="crm-metric">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">{t.label}</p>
                      <span className={`text-xs font-bold ${status}`}>{t.value} / {t.min}–{t.max}</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${t.color}, ${t.color}cc)` }} />
                    </div>
                    {t.value >= t.min && <p className="text-[10px] text-emerald-400/80 mt-1">✓ Target reached</p>}
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Leaderboard */}
              <div className="crm-metric">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-[#8b5cf6]" />
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Associate Leaderboard</p>
                </div>
                {analytics.callerLeaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.callerLeaderboard.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-800/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-neutral-300/20 text-neutral-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'text-neutral-600'}`}>{i + 1}</span>
                          <span className="text-sm text-white font-medium">{resolveStaffName(c.name)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-neutral-500"><span className="text-white">{c.calls}</span> calls</span>
                          <span className="text-emerald-400 font-bold">{c.meetings} mtgs</span>
                          <span className="text-[#00bfff] font-bold">{c.conversionRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-neutral-600 text-sm">No caller data in this period.</p>}
              </div>

              {/* Path Conversions */}
              <div className="crm-metric">
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-4">Path Performance</p>
                {analytics.conversionByPath.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.conversionByPath.map((data, i) => {
                      const maxCalls = Math.max(...analytics.conversionByPath.map(d => d.calls))
                      return (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-300 font-medium">{PATH_LABELS[data.path] || data.path}</span>
                            <div className="flex gap-3">
                              <span className="text-neutral-500">{data.meetings}/{data.calls}</span>
                              <span className={`font-bold ${data.rate > 20 ? 'text-emerald-400' : data.rate > 10 ? 'text-amber-400' : 'text-neutral-400'}`}>{data.rate}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#00bfff] to-[#0099cc]" style={{ width: `${(data.calls / maxCalls) * 100}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="text-neutral-600 text-sm">No path data in this period.</p>}
              </div>
            </div>

            {/* Outcome Distribution */}
            <div className="crm-metric">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Outcome Distribution</p>
                {outcomeFilter && (
                  <button onClick={() => setOutcomeFilter(null)} className="text-[10px] text-[#00bfff] hover:text-white cursor-pointer transition-colors font-bold flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear filter
                  </button>
                )}
              </div>
              {Object.keys(analytics.outcomeCounts).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(analytics.outcomeCounts).sort((a, b) => b[1] - a[1]).map(([outcome, count]) => (
                    <button
                      key={outcome}
                      onClick={() => { setOutcomeFilter(outcomeFilter === outcome ? null : outcome); setActiveTab('logs') }}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                        outcomeFilter === outcome
                          ? 'bg-[#00bfff]/10 border-[#00bfff]/40 shadow-[0_0_12px_rgba(0,191,255,0.1)]'
                          : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80'
                      }`}
                    >
                      <p className="text-xl font-bold text-white mb-1">{count}</p>
                      <p className="text-[10px] text-neutral-500 uppercase">{OUTCOME_LABELS[outcome] || outcome}</p>
                    </button>
                  ))}
                </div>
              ) : <p className="text-neutral-600 text-sm">No outcomes recorded in this period.</p>}
            </div>

            {/* Action Board */}
            <div className="crm-metric border-l-2 border-l-[#00bfff]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#00bfff]" />
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Follow-up Action Board</p>
                </div>
                <span className="text-xs bg-[#00bfff]/10 text-[#00bfff] px-2 py-0.5 rounded font-bold">{actionableLogs.length} Pending</span>
              </div>
              
              {actionableLogs.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {actionableLogs.map((log: any) => (
                    <div key={log.call_id} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 hover:border-neutral-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span 
                          className="text-sm font-bold text-white hover:text-[#00bfff] cursor-pointer transition-colors"
                          onClick={(e) => {
                            if (log.client_id) handleEditClient(log.client_id, e)
                          }}
                        >
                          {log.client_name || 'Unknown Prospect'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${log.outcome === 'callback_scheduled' ? 'bg-amber-500/10 text-amber-500' : log.outcome === 'needs_follow_up' ? 'bg-[#00bfff]/10 text-[#00bfff]' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {(OUTCOME_LABELS[log.outcome] || log.outcome).replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <p className="text-xs text-neutral-400 mb-2 line-clamp-2">{log.call_notes || <span className="italic">No notes</span>}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/50">
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                          <Calendar className="w-3 h-3" />
                          {log.next_action_date ? <span className="text-[#00bfff]">{fmtDate(log.next_action_date)}</span> : <span>{fmtDate(log.call_start)}</span>}
                        </div>
                        <button 
                          onClick={(e) => {
                            if (log.client_id) handleEditClient(log.client_id, e)
                          }}
                          className="text-[10px] text-white hover:text-[#00bfff] flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded transition-colors"
                        >
                          Open Client <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-neutral-500">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-neutral-700" />
                  </div>
                  <p className="text-sm">No pending follow-ups!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="crm-fade-in space-y-4">
            {upcomingCalls.length === 0 ? (
              <div className="crm-metric text-center py-12">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-neutral-700" />
                </div>
                <p className="text-neutral-500 text-sm">No upcoming calls or callbacks scheduled.</p>
                <p className="text-neutral-700 text-xs mt-1">Schedule follow-ups during calls to see them here.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcomingCalls.map((call: any) => {
                    const diff = new Date(call.next_action_date).getTime() - Date.now()
                    const isPast = diff <= 0
                    const isUrgent = diff > 0 && diff <= 15 * 60 * 1000
                    const isSoon = diff > 0 && diff <= 60 * 60 * 1000
                    const isToday = diff > 0 && diff <= 24 * 60 * 60 * 1000

                    // Format countdown
                    let countdown = ''
                    if (isPast) countdown = 'OVERDUE'
                    else {
                      const s = Math.floor(diff / 1000)
                      const m = Math.floor(s / 60)
                      const h = Math.floor(m / 60)
                      const d = Math.floor(h / 24)
                      if (d > 0) countdown = `${d}d ${h % 24}h`
                      else if (h > 0) countdown = `${h}h ${m % 60}m`
                      else countdown = `${m}m ${s % 60}s`
                    }

                    const urgency = isPast ? 'now' : isUrgent ? 'urgent' : isSoon ? 'soon' : isToday ? 'today' : 'later'

                    return (
                      <div key={call.call_id} className={`crm-metric border-l-2 ${
                        urgency === 'now' || urgency === 'urgent' ? 'border-l-red-500' :
                        urgency === 'soon' ? 'border-l-amber-500' :
                        urgency === 'today' ? 'border-l-emerald-500' : 'border-l-neutral-700'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span 
                            className="text-sm font-bold text-white hover:text-[#00bfff] cursor-pointer transition-colors truncate max-w-[160px]"
                            onClick={() => call.client_id && handleEditClient(call.client_id)}
                          >
                            {call.clientName}
                          </span>
                          <span className={`crm-countdown-pill ${urgency}`}>
                            <Clock className="w-3 h-3" /> {countdown}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider inline-block mb-2 ${
                          call.outcome === 'callback_scheduled' ? 'bg-amber-500/10 text-amber-500' :
                          call.outcome === 'meeting_booked' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-[#00bfff]/10 text-[#00bfff]'
                        }`}>
                          {OUTCOME_LABELS[call.outcome] || call.outcome}
                        </span>

                        {call.next_action_notes && (
                          <p className="text-xs text-neutral-400 line-clamp-2 mb-2">"{call.next_action_notes}"</p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/50">
                          <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(call.next_action_date)}
                          </div>
                          <button
                            onClick={() => call.client && setCallGuideClient(call.client)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-emerald-500/15 transition-all"
                          >
                            <Phone className="w-3 h-3" /> Call
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="crm-fade-in crm-metric">
            {outcomeFilter && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-neutral-800/50">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Filtered by:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00bfff]/10 text-[#00bfff] text-[10px] font-bold uppercase">
                  {OUTCOME_LABELS[outcomeFilter] || outcomeFilter}
                </span>
                <button onClick={() => setOutcomeFilter(null)} className="text-neutral-600 hover:text-white cursor-pointer transition-colors ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {filteredLogs.length > 0 ? (
              <div className="space-y-0">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLog === log.call_id
                  let ptsChecked = 0
                  try { ptsChecked = JSON.parse(log.talking_points_checked || '[]').length } catch { /* ignored */ }

                  return (
                    <div key={log.call_id} className="border-b border-neutral-800/50 last:border-0">
                      <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-neutral-900/30 px-2 rounded-lg transition-colors" onClick={() => setExpandedLog(isExpanded ? null : log.call_id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-neutral-400" />
                          </div>
                          <div>
                            <span 
                              className="text-sm text-white font-medium block hover:text-[#00bfff] transition-colors truncate max-w-[200px] sm:max-w-xs" 
                              onClick={(e) => {
                                if (log.client_id) handleEditClient(log.client_id, e)
                              }}
                            >
                              {log.client_name || 'Unknown Prospect'}
                            </span>
                            <span className="text-[10px] text-neutral-500">{log.contact_name || log.caller_name || log.caller_email} {log.contact_phone ? `• ${log.contact_phone}` : ''} • {fmtDate(log.call_start)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-neutral-500 hidden sm:block">{PATH_LABELS[log.path_loaded] || log.path_loaded}</span>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${log.outcome === 'meeting_booked' ? 'bg-emerald-500/15 text-emerald-400' : log.outcome === 'no_interest' ? 'bg-red-500/15 text-red-400' : 'bg-neutral-800 text-neutral-400'}`}>
                            {OUTCOME_LABELS[log.outcome] || log.outcome}
                          </span>
                          {log.call_type && (
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${log.call_type === 'conversation' ? 'bg-[#8b5cf6]/15 text-[#8b5cf6]' : 'bg-neutral-700/50 text-neutral-500'}`}>
                              {log.call_type === 'conversation' ? '💬 Conversation' : '📞 Attempt'}
                            </span>
                          )}
                          <span className="text-neutral-400 font-mono hidden sm:block">{fmtDuration(Number(log.duration_seconds || 0))}</span>
                          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="pb-4 pt-2 pl-4 sm:pl-12 pr-4 text-sm text-neutral-400 space-y-4 bg-neutral-900/10">
                          {/* ── Call Metadata Bar ── */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {log.contact_name && (
                              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2"><p className="text-[9px] text-neutral-600 uppercase tracking-wider">Contact Name</p><p className="text-xs text-white font-medium mt-0.5">{log.contact_name}</p></div>
                            )}
                            {log.contact_phone && (
                              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2"><p className="text-[9px] text-neutral-600 uppercase tracking-wider">Phone</p><p className="text-xs text-white font-medium mt-0.5">{log.contact_phone}</p></div>
                            )}
                            {log.environment_type && (
                              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2"><p className="text-[9px] text-neutral-600 uppercase tracking-wider">Call Type</p><p className="text-xs text-white font-medium mt-0.5 capitalize">{log.environment_type.replace(/_/g, ' ')}</p></div>
                            )}
                            {log.self_image_confirmed && (
                              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2"><p className="text-[9px] text-neutral-600 uppercase tracking-wider">Self-Image</p><p className={`text-xs font-bold mt-0.5 ${log.self_image_confirmed === 'professional' ? 'text-[#8b5cf6]' : 'text-[#f59e0b]'}`}>{log.self_image_confirmed === 'professional' ? 'Professional' : 'Trader'}</p></div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Call Notes</p>
                              <p className="bg-neutral-900/50 p-3 rounded border border-neutral-800 text-white whitespace-pre-wrap">{log.call_notes || <span className="italic text-neutral-600">No notes recorded</span>}</p>
                            </div>
                            {log.transcript && (
                              <div>
                                <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                                  Call Transcript
                                </p>
                                <div className="bg-neutral-900/50 p-3 rounded border border-neutral-800 max-h-48 overflow-y-auto">
                                  <pre className="text-[11px] text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">{log.transcript}</pre>
                                </div>
                              </div>
                            )}
                            <div className="space-y-3">
                              {log.next_action && (
                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded">
                                  <p className="text-[10px] text-emerald-500/80 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1">
                                    <ArrowRight className="w-3 h-3" /> Next Action
                                  </p>
                                  <p className="text-white text-sm font-medium">{log.next_action.replace(/_/g, ' ')}</p>
                                  {log.next_action_date && <p className="text-xs text-neutral-400 mt-0.5">Date: {fmtDate(log.next_action_date)}</p>}
                                  {log.next_action_notes && <p className="text-xs text-neutral-500 mt-1 italic">"{log.next_action_notes}"</p>}
                                </div>
                              )}
                              
                              <div>
                                <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Talking Points Coverage</p>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#00bfff]" style={{ width: `${log.talking_points_total ? (ptsChecked / log.talking_points_total) * 100 : 0}%` }} />
                                  </div>
                                  <span className="font-bold text-white">{ptsChecked}/{log.talking_points_total || 0}</span>
                                </div>
                              </div>
                              {log.pipeline_auto_advanced && (
                                <div>
                                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Pipeline Action</p>
                                  <p className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 w-max px-2 py-1 rounded">
                                    <Target className="w-3.5 h-3.5" /> Auto-advanced to {log.pipeline_auto_advanced}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── Data Captured ── */}
                          {(() => {
                            let dc: Record<string, any> = {}
                            try { const raw = log.data_capture || log.data_capture_json; dc = typeof raw === 'string' ? JSON.parse(raw) : (raw || {}) } catch { /* ignored */ }
                            const entries = Object.entries(dc).filter(([, v]) => v)
                            if (entries.length === 0) return null
                            return (
                              <div>
                                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">Data Captured During Call</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {entries.map(([k, v]) => (
                                    <div key={k} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2.5">
                                      <p className="text-[9px] text-neutral-600 uppercase tracking-wider">{k.replace(/_/g, ' ')}</p>
                                      <p className="text-xs text-white mt-0.5 font-medium">{String(v)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          {/* ── Outcome Details ── */}
                          {(() => {
                            let od: Record<string, any> = {}
                            try { const raw = log.outcome_details || log.outcome_details_json; od = typeof raw === 'string' ? JSON.parse(raw) : (raw || {}) } catch { /* ignored */ }
                            if (!od.date && !od.notes && !od.time) return null
                            return (
                              <div>
                                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">Outcome Details</p>
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
                                  {od.date && <p className="text-xs text-white"><span className="text-neutral-600 mr-1">Date:</span>{od.date}{od.time ? ` at ${od.time}` : ''}</p>}
                                  {od.notes && <p className="text-xs text-neutral-300 mt-1"><span className="text-neutral-600 mr-1">Notes:</span>{od.notes}</p>}
                                </div>
                              </div>
                            )
                          })()}

                          {/* ── Cost/Pain Math ── */}
                          {(() => {
                            let cm: Record<string, any> = {}
                            try { cm = typeof log.cost_math === 'string' ? JSON.parse(log.cost_math) : (log.cost_math || {}) } catch { /* ignored */ }
                            if (!cm.monthly && !cm.annual && !cm.monthlyTimeHours) return null
                            return (
                              <div>
                                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5 text-[#ff7a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                  Pain Point Math
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {cm.monthly > 0 && (
                                    <div className="bg-[#ff7a00]/5 border border-[#ff7a00]/15 rounded-lg p-2.5">
                                      <p className="text-[9px] text-neutral-600 uppercase">Monthly Cost</p>
                                      <p className="text-sm text-[#ff7a00] font-bold mt-0.5">GH₵{Number(cm.monthly).toLocaleString()}</p>
                                    </div>
                                  )}
                                  {cm.annual > 0 && (
                                    <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-2.5">
                                      <p className="text-[9px] text-neutral-600 uppercase">Annual Cost</p>
                                      <p className="text-sm text-red-400 font-bold mt-0.5">GH₵{Number(cm.annual).toLocaleString()}</p>
                                    </div>
                                  )}
                                  {cm.monthlyTimeHours > 0 && (
                                    <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5">
                                      <p className="text-[9px] text-neutral-600 uppercase">Monthly Hours Lost</p>
                                      <p className="text-sm text-amber-400 font-bold mt-0.5">{cm.monthlyTimeHours}h</p>
                                    </div>
                                  )}
                                  {cm.annualTimeHours > 0 && (
                                    <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5">
                                      <p className="text-[9px] text-neutral-600 uppercase">Annual Hours Lost</p>
                                      <p className="text-sm text-amber-400 font-bold mt-0.5">{cm.annualTimeHours}h</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })()}

                          {/* ── Transcript ── */}
                          {log.transcript && (
                            <div>
                              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                Call Transcript
                              </p>
                              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-[inherit] leading-relaxed m-0">{log.transcript}</pre>
                              </div>
                            </div>
                          )}

                          {/* ── Actions ── */}
                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/50">
                            {log.client_id && (
                              <button onClick={(e) => handleEditClient(log.client_id, e)} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#00bfff] transition-colors py-1 px-2 rounded hover:bg-neutral-800">
                                <Pencil className="w-3.5 h-3.5" /> View Client
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-500">
                <Filter className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No call logs found for this date range.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcripts' && (
          <div className="crm-fade-in space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquareText className="w-4 h-4 text-[#8b5cf6]" />
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Call Transcripts</p>
            </div>
            {(() => {
              const logsWithTranscript = filteredTranscripts
              if (logsWithTranscript.length === 0) {
                const totalTranscriptsCount = allTranscripts.length
                return (
                  <div className="text-center py-12">
                    <MessageSquareText className="w-8 h-8 text-neutral-700 mx-auto mb-3 opacity-60" />
                    <p className="text-neutral-500 text-sm font-semibold">No transcripts recorded in this period.</p>
                    {totalTranscriptsCount > 0 ? (
                      <div className="mt-2 space-y-3">
                        <p className="text-neutral-500 text-xs">
                          There {totalTranscriptsCount === 1 ? 'is 1 transcript' : `are ${totalTranscriptsCount} transcripts`} saved in other periods.
                        </p>
                        <button
                          onClick={() => setDateFilter('all')}
                          className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md hover:shadow-lg transition-all"
                        >
                          Show All Transcripts
                        </button>
                      </div>
                    ) : (
                      <p className="text-neutral-600 text-xs mt-1">Transcripts are saved automatically from call recordings.</p>
                    )}
                  </div>
                )
              }
              return logsWithTranscript.map((log: any) => (
                <div key={log.call_id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-[#8b5cf6]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{log.client_name || 'Unknown'}</p>
                        <p className="text-[10px] text-neutral-500">
                          {log.client_company ? log.client_company + ' · ' : ''}
                          {log.call_start ? new Date(log.call_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          {log.call_start ? ' at ' + new Date(log.call_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.call_type && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${log.call_type === 'conversation' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                          {log.call_type === 'conversation' ? '💬 Conversation' : '📞 Attempt'}
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-600">by {resolveStaffName(log.caller_email || '')}</span>
                    </div>
                  </div>
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
                    <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-[inherit] leading-relaxed m-0">{log.transcript}</pre>
                  </div>
                </div>
              ))
            })()}
          </div>
        )}
      </div>
      
      {/* Call Guide Overlay */}
      {callGuideClient && (
        <CallGuide client={callGuideClient} onClose={() => setCallGuideClient(null)} />
      )}

      {/* Toast Notification Stack */}
      {toasts.length > 0 && (
        <div className="crm-toast-stack">
          {toasts.map(toast => {
            const diff = new Date(toast.date).getTime() - Date.now()
            const m = Math.max(0, Math.floor(diff / 60000))
            const s = Math.max(0, Math.floor((diff % 60000) / 1000))
            const isUrgent = diff <= 5 * 60 * 1000
            return (
              <div key={toast.id} className={`crm-toast ${isUrgent ? 'urgent' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{toast.clientName}</p>
                  <p className="text-[10px] text-amber-400 font-bold">
                    {diff <= 0 ? 'NOW — Call overdue!' : `In ${m}m ${s}s`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      const cl = clients?.find((c: any) => c.client_id === toast.clientId)
                      if (cl) { setCallGuideClient(cl); dismissToast(toast.id) }
                    }}
                    className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-emerald-500/25 transition-all"
                  >
                    <Phone className="w-3 h-3 inline mr-1" />Call
                  </button>
                  <button onClick={() => dismissToast(toast.id)} className="text-neutral-600 hover:text-white cursor-pointer transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
