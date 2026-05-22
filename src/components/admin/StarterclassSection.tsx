// ─── ICUNI Labs Admin — Starterclass Management Section ───
// Full Starterclass admin within Labs Ops Console.
// Uses the Starterclass Apps Script API with godmode_token.

import { useState, useEffect, useCallback } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import {
  GraduationCap, Users, CreditCard, Calendar, RefreshCw,
  Check, Mail, Search,
  Loader2, AlertCircle, ExternalLink, Send
} from 'lucide-react'

const SC_API = 'https://script.google.com/macros/s/AKfycbwYuXJjh75d8QnpHlTA1oE6xq7lS-x-pNAmimLMvp2urqqRILg5EutlnomEHV5zfmNirw/exec'

interface SCRegistration {
  registration_id: string
  user_id: string
  event_id: string
  event_type: 'taster' | 'cohort'
  amount_due: number
  currency: string
  payment_status: 'pending' | 'verifying' | 'confirmed' | 'refunded' | 'cancelled'
  payment_method?: string
  payment_reference?: string
  assigned_reference: string
  first_name: string
  last_name: string
  email: string
}

interface SCEvent {
  event_id: string
  event_type: 'taster' | 'cohort'
  name: string
  date: string
  time_gmt: string
  time_bst: string
  meet_link?: string
  capacity: number
  confirmed_count: number
  status: string
}

interface SCDashboard {
  total_registrations: number
  confirmed_payments: number
  pending_verifications: number
  revenue_ghs: number
  revenue_gbp: number
  events: SCEvent[]
  registrations: SCRegistration[]
  by_event: Record<string, { total: number; confirmed: number; pending: number }>
  by_country: Record<string, number>
}

async function scFetch<T>(godmodeToken: string, action: string, body?: Record<string, unknown>): Promise<{ status: string; data?: T; message?: string }> {
  try {
    if (body) {
      const res = await fetch(SC_API, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, godmodeToken, ...body }),
      })
      return await res.json()
    } else {
      const url = new URL(SC_API)
      url.searchParams.set('action', action)
      url.searchParams.set('godmode_token', godmodeToken)
      const res = await fetch(url.toString(), { redirect: 'follow' })
      return await res.json()
    }
  } catch (err) {
    return { status: 'error', message: String(err) }
  }
}

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    verifying: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    pending: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
    cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
    refunded: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}

// ── Stat Card ──
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  )
}

export default function StarterclassSection() {
  const { token } = useAdminStore()
  const [data, setData] = useState<SCDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'registrations' | 'events' | 'email'>('overview')
  const [filter, setFilter] = useState<'all' | 'verifying' | 'confirmed' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  // Email state
  const [emailRecipients, setEmailRecipients] = useState<'all' | 'confirmed' | 'pending' | 'custom'>('all')
  const [emailCustomTo, setEmailCustomTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    const res = await scFetch<SCDashboard>(token, 'admin_dashboard')
    if (res.status === 'success' && res.data) {
      setData(res.data)
    } else {
      setError(res.message || 'Failed to load Starterclass dashboard')
    }
    setLoading(false)
  }, [token])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const handleVerify = async (registrationId: string) => {
    if (!token) return
    setVerifyingId(registrationId)
    const res = await scFetch(token, 'admin_verify_payment', { registrationId })
    if (res.status === 'success') {
      await loadDashboard()
    } else {
      alert(res.message || 'Verification failed')
    }
    setVerifyingId(null)
  }

  const handleSendEmail = async () => {
    if (!token || !emailSubject.trim() || !emailBody.trim()) return
    setEmailSending(true)
    setEmailResult('')
    let recipients: string | string[] = emailRecipients
    if (emailRecipients === 'custom') {
      recipients = emailCustomTo.split(',').map(e => e.trim()).filter(Boolean)
    }
    const res = await scFetch(token, 'admin_send_email', {
      recipients,
      subject: emailSubject,
      body: emailBody,
    })
    setEmailSending(false)
    if (res.status === 'success') {
      setEmailResult('✓ Email sent successfully')
      setEmailSubject('')
      setEmailBody('')
    } else {
      setEmailResult(`✗ ${res.message || 'Send failed'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-neutral-400">{error}</p>
        <button onClick={loadDashboard} className="text-xs text-[#00bfff] hover:underline cursor-pointer">Retry</button>
      </div>
    )
  }

  if (!data) return null

  // Filter registrations
  const regs = data.registrations.filter(r => {
    if (filter !== 'all' && r.payment_status !== filter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return r.first_name?.toLowerCase().includes(q) || r.last_name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.assigned_reference?.toLowerCase().includes(q)
    }
    return true
  })

  const TABS = [
    { id: 'overview', label: 'Overview', icon: GraduationCap },
    { id: 'registrations', label: 'Registrations', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'email', label: 'Email', icon: Mail },
  ] as const

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Starterclass</h2>
            <p className="text-[11px] text-neutral-500">
              Manage registrations, payments, events, and communications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://starterclass.icuni.org" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-all">
            <ExternalLink className="w-3 h-3" /> View Site
          </a>
          <button onClick={loadDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-all cursor-pointer">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-neutral-800 pb-px">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all cursor-pointer ${
              tab === t.id
                ? 'text-purple-400 bg-purple-400/5 border-b-2 border-purple-400 -mb-px'
                : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Registrations" value={data.total_registrations} icon={Users} color="text-[#00bfff]" />
            <StatCard label="Confirmed" value={data.confirmed_payments} icon={Check} color="text-emerald-400" />
            <StatCard label="Pending Verification" value={data.pending_verifications} icon={CreditCard} color="text-amber-400" />
            <StatCard label="Revenue (GHS)" value={`₵${data.revenue_ghs.toLocaleString()}`} icon={CreditCard} color="text-purple-400" />
          </div>

          {/* By Event */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(data.by_event).map(([eventId, stats]) => (
              <div key={eventId} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3">{eventId}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Total</div>
                    <div className="text-lg font-bold text-white">{stats.total}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Confirmed</div>
                    <div className="text-lg font-bold text-emerald-400">{stats.confirmed}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Pending</div>
                    <div className="text-lg font-bold text-amber-400">{stats.pending}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* By Country */}
          {data.by_country && Object.keys(data.by_country).length > 0 && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-white mb-3">By Country</h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.by_country).map(([country, count]) => (
                  <div key={country} className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/50 rounded-lg">
                    <span className="text-sm text-white font-medium">{country}</span>
                    <span className="text-[10px] font-bold text-neutral-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <h4 className="text-sm font-bold text-white mb-3">Revenue</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">GHS</div>
                <div className="text-xl font-bold text-white">₵{data.revenue_ghs.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">GBP</div>
                <div className="text-xl font-bold text-white">£{data.revenue_gbp.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Registrations Tab ── */}
      {tab === 'registrations' && (
        <div>
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              {(['all', 'verifying', 'confirmed', 'pending'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filter === f ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20' : 'text-neutral-500 hover:text-white border border-neutral-800'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} {f === 'verifying' && data.pending_verifications > 0 && `(${data.pending_verifications})`}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, email, reference..."
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-neutral-800 rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-4 py-3">Name</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-4 py-3">Email</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-4 py-3">Event</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-4 py-3">Ref</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-4 py-3">Amount</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-4 py-3">Status</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {regs.map(r => (
                  <tr key={r.registration_id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{r.first_name} {r.last_name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">{r.email}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500 uppercase">{r.event_type}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-purple-400">{r.assigned_reference}</span>
                      {r.payment_reference && r.payment_reference !== r.assigned_reference && (
                        <span className="block text-[10px] text-amber-400 mt-0.5">User ref: {r.payment_reference}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300">{r.currency} {r.amount_due?.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.payment_status} /></td>
                    <td className="px-4 py-3 text-center">
                      {r.payment_status === 'verifying' && (
                        <button
                          onClick={() => handleVerify(r.registration_id)}
                          disabled={verifyingId === r.registration_id}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {verifyingId === r.registration_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {regs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">No registrations match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-neutral-600 mt-2">{regs.length} registration{regs.length !== 1 ? 's' : ''} shown</p>
        </div>
      )}

      {/* ── Events Tab ── */}
      {tab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.events.map(event => (
            <div key={event.event_id} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white">{event.name}</h4>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  event.status === 'upcoming' ? 'text-[#00bfff] bg-[#00bfff]/10' :
                  event.status === 'live' ? 'text-emerald-400 bg-emerald-400/10' :
                  event.status === 'completed' ? 'text-neutral-400 bg-neutral-400/10' :
                  'text-red-400 bg-red-400/10'
                }`}>{event.status}</span>
              </div>
              <div className="space-y-2 text-xs text-neutral-400">
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="text-white">{event.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time</span>
                  <span className="text-white">{event.time_gmt} GMT / {event.time_bst} BST</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity</span>
                  <span className="text-white">{event.confirmed_count} / {event.capacity}</span>
                </div>
                {event.meet_link && (
                  <div className="flex justify-between">
                    <span>Meet Link</span>
                    <a href={event.meet_link} target="_blank" rel="noopener noreferrer" className="text-[#00bfff] hover:underline">Open</a>
                  </div>
                )}
              </div>
              {/* Capacity bar */}
              <div className="mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-[#00bfff] rounded-full transition-all"
                  style={{ width: `${Math.min(100, (event.confirmed_count / event.capacity) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Email Tab ── */}
      {tab === 'email' && (
        <div className="max-w-2xl">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
            {/* Recipients */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Recipients</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'confirmed', 'pending', 'custom'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setEmailRecipients(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      emailRecipients === r ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20' : 'text-neutral-500 border border-neutral-800 hover:text-white'
                    }`}
                  >
                    {r === 'all' ? 'All registrants' : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              {emailRecipients === 'custom' && (
                <input
                  type="text"
                  value={emailCustomTo}
                  onChange={e => setEmailCustomTo(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="mt-2 w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
                />
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                placeholder="Your Starterclass Update"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Message</label>
              <textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                placeholder="Write your message here..."
                rows={6}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            {/* Send */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-neutral-600">
                Sent from starterclass@icuni.org
              </p>
              <button
                onClick={handleSendEmail}
                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Email
              </button>
            </div>

            {emailResult && (
              <p className={`text-sm ${emailResult.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                {emailResult}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
