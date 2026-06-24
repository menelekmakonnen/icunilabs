import { useEffect, useMemo, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { ChevronLeft, ChevronRight, RefreshCw, Calendar as CalIcon, X, Phone, Video, MapPin, Clock, ExternalLink } from 'lucide-react'
import MeetingDatePrompt from './MeetingDatePrompt'

type CalView = 'month' | 'week' | 'day'

const STAGE_COLORS: Record<string, string> = {
  booked: '#00bfff', confirmed: '#8b5cf6', prep: '#a855f7',
  on_day: '#ff7a00', post_meeting: '#f59e0b', qualified: '#22c55e',
}
const STAGE_LABELS: Record<string, string> = {
  booked: 'Booked', confirmed: 'Confirmed', prep: 'Prep', on_day: 'On-Day',
  post_meeting: 'Post-Meeting', qualified: 'Qualified',
}
const OUTCOME_LABELS: Record<string, string> = {
  callback_scheduled: 'Callback', needs_follow_up: 'Follow-Up', meeting_booked: 'Meeting',
}
const CALENDAR_OUTCOMES = ['callback_scheduled', 'needs_follow_up', 'meeting_booked']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function startOfWeek(d: Date): Date { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0, 0, 0, 0); return x }
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1) }
function toDateKey(d: any): string {
  if (!d) return ''
  try {
    const clean = String(d).split(' at ')[0].split('T')[0].trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
    const parsed = new Date(d)
    if (!isNaN(parsed.getTime())) return ymd(parsed)
  } catch { /* ignored */ }
  return ''
}
function normTime(t: any): string {
  if (!t) return ''
  const s = String(t).trim()
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5)
  if (s.includes('T') || s.includes('1899') || s.includes('GMT')) {
    try { const d = new Date(s); if (!isNaN(d.getTime())) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` } catch { /* ignored */ }
  }
  return ''
}
function fmtTime12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':'); const hr = parseInt(h)
  if (isNaN(hr)) return t
  return `${hr % 12 || 12}:${m || '00'} ${hr >= 12 ? 'PM' : 'AM'}`
}

interface CalItem {
  id: string
  type: 'meeting' | 'callback'
  dateKey: string
  time: string
  title: string
  company: string
  clientId: string
  color: string
  badge: string
  raw: any
}

export default function CalendarSection() {
  const { callLogs, meetings, clients } = useAdminStore()
  const [view, setView] = useState<CalView>(() => { try { return (localStorage.getItem('icuni_cal_view') as CalView) || 'month' } catch { return 'month' } })
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const [selected, setSelected] = useState<CalItem | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { try { localStorage.setItem('icuni_cal_view', view) } catch { /* ignored */ } }, [view])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      adminActions.loadCallLogs({ page_size: 500 }),
      adminActions.loadMeetings(),
      adminActions.loadClients(),
    ]).finally(() => setLoading(false))
  }, [])

  const clientMap = useMemo(() => {
    const m: Record<string, any> = {}
    ;(clients || []).forEach((c: any) => { m[c.client_id] = c })
    return m
  }, [clients])

  // Accurate item set: all meetings (incl. call-derived) + scheduled callbacks
  const items = useMemo(() => {
    const out: CalItem[] = []
    const formalClientIds = new Set((meetings || []).map((m: any) => m.client_id))

    ;(meetings || []).forEach((m: any) => {
      if (m.stage === 'cancelled' || m.stage === 'regressed') return
      const dk = toDateKey(m.date)
      if (!dk) return
      const c = clientMap[m.client_id] || {}
      out.push({
        id: `mtg-${m.meeting_id}`, type: 'meeting', dateKey: dk, time: normTime(m.time),
        title: m.client_name || c.name || 'Meeting', company: m.client_company || c.company || '',
        clientId: m.client_id || '', color: STAGE_COLORS[m.stage] || '#00bfff',
        badge: STAGE_LABELS[m.stage] || 'Meeting', raw: m,
      })
    })

    ;(callLogs || []).forEach((l: any) => {
      if (!CALENDAR_OUTCOMES.includes(l.outcome)) return
      if (!l.next_action_date) return
      // skip meeting_booked that already has a formal meeting row
      if (l.outcome === 'meeting_booked' && formalClientIds.has(l.client_id)) return
      const dk = toDateKey(l.next_action_date)
      if (!dk) return
      const c = clientMap[l.client_id] || {}
      const isMtg = l.outcome === 'meeting_booked'
      const timePart = String(l.next_action_date).split(' at ')[1]
      out.push({
        id: `cb-${l.call_id}`, type: isMtg ? 'meeting' : 'callback', dateKey: dk,
        time: timePart ? timePart.trim().slice(0, 5) : '',
        title: c.name || l.client_name || 'Unknown', company: c.company || l.client_company || '',
        clientId: l.client_id || '', color: isMtg ? '#00bfff' : '#f59e0b',
        badge: isMtg ? 'Meeting (call)' : OUTCOME_LABELS[l.outcome] || 'Callback', raw: l,
      })
    })
    return out
  }, [meetings, callLogs, clientMap])

  const itemsByDay = useMemo(() => {
    const map: Record<string, CalItem[]> = {}
    items.forEach(it => { (map[it.dateKey] = map[it.dateKey] || []).push(it) })
    Object.keys(map).forEach(k => map[k].sort((a, b) => (a.time || '99').localeCompare(b.time || '99')))
    return map
  }, [items])

  const range = useMemo(() => {
    if (view === 'day') return { from: cursor, to: cursor }
    if (view === 'week') { const s = startOfWeek(cursor); return { from: s, to: addDays(s, 6) } }
    const gridStart = startOfWeek(startOfMonth(cursor))
    return { from: gridStart, to: addDays(gridStart, 41) }
  }, [view, cursor])

  const go = (dir: number) => {
    if (view === 'day') setCursor(c => addDays(c, dir))
    else if (view === 'week') setCursor(c => addDays(c, dir * 7))
    else setCursor(c => new Date(c.getFullYear(), c.getMonth() + dir, 1))
  }
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setCursor(d) }

  const title = useMemo(() => {
    if (view === 'day') return cursor.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (view === 'week') { const s = startOfWeek(cursor); const e = addDays(s, 6); return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` }
    return cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }, [view, cursor])

  const doSync = async () => { setSyncing(true); try { await adminActions.syncCalendar(); await adminActions.loadMeetings() } finally { setSyncing(false) } }

  const openItem = (it: CalItem) => {
    if (it.type === 'meeting') { adminActions.setSection('meetings'); return }
    const c = (clients || []).find((x: any) => x.client_id === it.clientId)
    if (c) adminActions.setActiveClientOptimistic(c)
    adminActions.setSection('clients')
  }

  const todayKey = ymd(new Date())
  const monthDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(range.from, i)), [range.from])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(range.from, i)), [range.from])

  return (
    <div className="space-y-4">
      <MeetingDatePrompt />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
            <CalIcon className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Calendar</h2>
            <p className="text-[11px] text-neutral-500">All meetings &amp; scheduled calls — {loading ? 'loading…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-neutral-900/60 border border-neutral-800 rounded-lg overflow-hidden">
            {(['month', 'week', 'day'] as CalView[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-bold capitalize cursor-pointer transition-all ${view === v ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' : 'text-neutral-500 hover:text-white'}`}>{v}</button>
            ))}
          </div>
          <button onClick={doSync} disabled={syncing} title="Push upcoming meetings to Google Calendar" className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs font-bold text-neutral-300 hover:text-white cursor-pointer transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Sync Google'}
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => go(-1)} className="p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white cursor-pointer transition-all">Today</button>
          <button onClick={() => go(1)} className="p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-all"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#00bfff' }} /> Meeting</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> Callback</span>
        </div>
      </div>

      {/* MONTH */}
      {view === 'month' && (
        <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-neutral-800">
            {WEEKDAYS.map(d => <div key={d} className="px-2 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              const dk = ymd(day)
              const inMonth = day.getMonth() === cursor.getMonth()
              const dayItems = itemsByDay[dk] || []
              const isToday = dk === todayKey
              return (
                <div key={i} className={`min-h-[96px] border-b border-r border-neutral-800/60 p-1.5 ${inMonth ? '' : 'bg-neutral-950/40'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#8b5cf6] text-white' : inMonth ? 'text-neutral-300' : 'text-neutral-700'}`}>{day.getDate()}</span>
                  </div>
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map(it => (
                      <button key={it.id} onClick={() => setSelected(it)} className="w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity" style={{ background: `${it.color}22`, color: it.color }}>
                        {it.time ? fmtTime12(it.time).replace(':00', '') + ' ' : ''}{it.title}
                      </button>
                    ))}
                    {dayItems.length > 3 && <button onClick={() => { setView('day'); setCursor(new Date(day)) }} className="text-[9px] text-neutral-500 hover:text-white cursor-pointer px-1.5">+{dayItems.length - 3} more</button>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* WEEK */}
      {view === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const dk = ymd(day); const dayItems = itemsByDay[dk] || []; const isToday = dk === todayKey
            return (
              <div key={i} className={`bg-neutral-950/40 border rounded-xl p-2 min-h-[150px] ${isToday ? 'border-[#8b5cf6]/40' : 'border-neutral-800'}`}>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">{WEEKDAYS[day.getDay()]}</span>
                  <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#8b5cf6] text-white' : 'text-neutral-300'}`}>{day.getDate()}</span>
                </div>
                <div className="space-y-1">
                  {dayItems.length === 0 && <p className="text-[9px] text-neutral-700 text-center py-2">—</p>}
                  {dayItems.map(it => (
                    <button key={it.id} onClick={() => setSelected(it)} className="w-full text-left px-1.5 py-1 rounded text-[10px] cursor-pointer hover:opacity-80 transition-opacity border-l-2" style={{ background: `${it.color}15`, borderColor: it.color }}>
                      <div className="font-bold truncate text-white">{it.title}</div>
                      <div className="text-[9px]" style={{ color: it.color }}>{it.time ? fmtTime12(it.time) : 'All day'} · {it.badge}</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DAY */}
      {view === 'day' && (
        <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-3 sm:p-4">
          {(() => {
            const dayItems = itemsByDay[ymd(cursor)] || []
            if (dayItems.length === 0) return <p className="text-sm text-neutral-600 text-center py-12">Nothing scheduled.</p>
            return (
              <div className="space-y-2">
                {dayItems.map(it => (
                  <button key={it.id} onClick={() => setSelected(it)} className="w-full flex items-center gap-3 text-left px-3 py-3 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all">
                    <div className="w-16 shrink-0 text-right"><div className="text-xs font-bold text-white">{it.time ? fmtTime12(it.time) : 'All day'}</div></div>
                    <div className="w-1 self-stretch rounded-full" style={{ background: it.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">{it.title}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{it.company || ''}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0" style={{ background: `${it.color}18`, color: it.color }}>{it.badge}</span>
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-neutral-800 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${selected.color}18`, color: selected.color }}>{selected.badge}</span>
                <h3 className="text-base font-bold text-white mt-2 truncate">{selected.title}</h3>
                {selected.company && <p className="text-xs text-neutral-500 truncate">{selected.company}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white cursor-pointer shrink-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-neutral-300"><CalIcon className="w-4 h-4 text-neutral-500" /> {new Date(selected.dateKey + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              {selected.time && <div className="flex items-center gap-2 text-neutral-300"><Clock className="w-4 h-4 text-neutral-500" /> {fmtTime12(selected.time)}</div>}
              {selected.type === 'meeting' && selected.raw?.type && (
                <div className="flex items-center gap-2 text-neutral-300">{selected.raw.type === 'online' ? <Video className="w-4 h-4 text-neutral-500" /> : <MapPin className="w-4 h-4 text-neutral-500" />} {selected.raw.type === 'online' ? 'Online' : 'In-Person'}</div>
              )}
              {selected.raw?.location_or_link && (
                String(selected.raw.location_or_link).startsWith('http')
                  ? <a href={selected.raw.location_or_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#00bfff] hover:underline break-all"><ExternalLink className="w-4 h-4 shrink-0" /> {selected.raw.location_or_link}</a>
                  : <div className="flex items-center gap-2 text-neutral-300"><MapPin className="w-4 h-4 text-neutral-500" /> {selected.raw.location_or_link}</div>
              )}
              {selected.type === 'callback' && selected.raw?.next_action_notes && <p className="text-xs text-neutral-400 bg-neutral-900/50 rounded-lg p-2.5">{selected.raw.next_action_notes}</p>}
            </div>
            <div className="p-3 border-t border-neutral-800">
              <button onClick={() => { openItem(selected); setSelected(null) }} className="w-full py-2 text-xs font-bold text-[#8b5cf6] hover:text-white bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5">
                {selected.type === 'meeting' ? <><CalIcon className="w-3.5 h-3.5" /> Open in Meetings</> : <><Phone className="w-3.5 h-3.5" /> Open Client</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
