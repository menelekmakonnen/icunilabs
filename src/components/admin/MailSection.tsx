import { useEffect, useState, useCallback } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Mail, Inbox, Send, FileText, Search, Plus, X, Sliders } from 'lucide-react'
import MailThread from './mail/MailThread'
import MailCompose from './mail/MailCompose'
import MailTemplates from './mail/MailTemplates'

type Tab = 'inbox' | 'compose' | 'templates' | 'mailboxes'

const cls = "w-full bg-neutral-900/80 border border-neutral-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#00bfff]/40 focus:ring-1 focus:ring-[#00bfff]/20 focus:outline-none transition-all backdrop-blur-sm"

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  if (ms < 60000) return 'now'
  if (ms < 3600000) return Math.floor(ms / 60000) + 'm'
  if (ms < 86400000) return Math.floor(ms / 3600000) + 'h'
  if (ms < 604800000) return Math.floor(ms / 86400000) + 'd'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function extractName(from: string) {
  const m = from.match(/^"?([^"<]+)"\s*</)
  return m ? m[1].trim() : from.split('@')[0]
}

function avatarColor(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return `hsl(${Math.abs(h) % 360}, 55%, 42%)`
}

function aliasLabel(a: any): string {
  if (typeof a === 'string') return a.split('@')[0]
  return a.name || a.alias?.split('@')[0] || 'Mailbox'
}
function aliasKey(a: any): string {
  return typeof a === 'string' ? a : a.alias || a
}

export default function MailSection() {
  const { inbox, inboxLoading, activeThread, emailAliases, user, impersonating } = useAdminStore()
  const [tab, setTab] = useState<Tab>('inbox')
  const [activeMailboxes, setActiveMailboxes] = useState<string[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(0)
  const [impersonatedBoxes, setImpersonatedBoxes] = useState<string[] | null>(null)

  // Effective user = impersonated user when active
  const effectiveUser = impersonating || user
  const isImpersonating = !!impersonating

  const isGodmode = user?.role === 'Godmode'  // Use REAL user for admin permissions
  const isSuperAdmin = user?.role === 'SuperAdmin'
  const canManage = (isGodmode || isSuperAdmin) && !isImpersonating
  const allAliases = Array.isArray(emailAliases) ? emailAliases : []

  // Default mailbox = effective user's company email (prefer company_email, then check for @icuni.org primary)
  const companyEmail = effectiveUser?.company_email
    || (effectiveUser?.email?.includes('@icuni.org') ? effectiveUser.email : '')

  // When impersonating, fetch the impersonated user's accessible mailboxes
  useEffect(() => {
    if (isImpersonating && impersonating?.email) {
      (async () => {
        const assigned = await adminActions.getUserMailboxes(impersonating.email)
        const assignedAliases = Array.isArray(assigned) ? assigned.map((m: any) => m.alias) : []
        // Accessible = company_email + assigned mailboxes
        const accessible = new Set<string>()
        if (impersonating.company_email) accessible.add(impersonating.company_email)
        assignedAliases.forEach((a: string) => accessible.add(a))
        setImpersonatedBoxes(Array.from(accessible))
      })()
    } else {
      setImpersonatedBoxes(null)
    }
  }, [impersonating?.email])

  // Filter aliases: when impersonating, only show mailboxes the impersonated user can access
  const aliases = isImpersonating && impersonatedBoxes
    ? allAliases.filter((a: any) => impersonatedBoxes.includes(aliasKey(a)))
    : allAliases

  useEffect(() => {
    adminActions.loadEmailAliases()
    adminActions.loadEmailTemplates()
  }, [])

  // Set default active mailbox to company email once aliases load
  useEffect(() => {
    if (activeMailboxes.length === 0 && aliases.length > 0) {
      const def = companyEmail || aliasKey(aliases[0])
      setActiveMailboxes([def])
      adminActions.loadInbox(def, 0)
    }
  }, [aliases, companyEmail])

  // Reset active mailboxes when impersonation changes
  useEffect(() => {
    setActiveMailboxes([])
    setPage(0)
  }, [impersonating?.email])

  const toggleMailbox = (alias: string) => {
    setActiveMailboxes(prev => {
      const next = prev.includes(alias) ? prev.filter(a => a !== alias) : [...prev, alias]
      if (next.length === 0) return prev // must have at least one
      setPage(0)
      adminActions.loadInbox(next.length === aliases.length ? 'all' : next.join(','), 0, searchQ)
      return next
    })
  }

  const currentFilter = activeMailboxes.length === aliases.length ? 'all' : activeMailboxes.join(',')

  const doSearch = () => { setPage(0); adminActions.loadInbox(currentFilter, 0, searchQ) }
  const changePage = (p: number) => { setPage(p); adminActions.loadInbox(currentFilter, p, searchQ) }
  const openThread = async (id: string) => { await adminActions.loadThread(id) }
  const closeThread = () => { adminActions.clearActiveThread(); adminActions.loadInbox(currentFilter, page, searchQ) }

  const tabs: { id: Tab; label: string; icon: any; access?: boolean }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'mailboxes', label: 'Mailboxes', icon: Sliders, access: canManage },
  ]

  // Thread view
  if (activeThread) return <MailThread thread={activeThread} aliases={aliases} onClose={closeThread} />

  return (
    <div className="space-y-6">
      {/* Impersonation Notice */}
      {isImpersonating && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-2">
          <Mail className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-sm text-purple-300">Viewing <strong>{impersonating.name}</strong>'s mailbox (read-only)</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00bfff]/20 to-[#0060ff]/10 border border-[#00bfff]/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#00bfff]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mail Hub</h2>
            <p className="text-xs text-neutral-500">{companyEmail || effectiveUser?.email}</p>
          </div>
        </div>
        <div className="flex rounded-xl bg-neutral-900/60 border border-neutral-800/50 p-1 gap-0.5">
          {tabs.filter(t => t.access === undefined || t.access).map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === t.id ? 'bg-[#00bfff]/10 text-[#00bfff] shadow-[0_0_10px_rgba(0,191,255,0.08)]' : 'text-neutral-500 hover:text-white'}`}>
                <Icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* INBOX */}
      {tab === 'inbox' && (
        <div className="space-y-4">
          {/* Mailbox toggle buttons */}
          <div className="flex gap-2 flex-wrap items-center">
            {aliases.map((a: any) => {
              const key = aliasKey(a)
              const active = activeMailboxes.includes(key)
              return (
                <button key={key} onClick={() => toggleMailbox(key)}
                  className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border cursor-pointer transition-all font-medium ${active
                    ? 'bg-[#00bfff]/10 text-[#00bfff] border-[#00bfff]/30 shadow-[0_0_10px_rgba(0,191,255,0.08)]'
                    : 'text-neutral-600 border-neutral-800/50 hover:text-neutral-400 hover:border-neutral-700'}`}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: avatarColor(key) }}>
                    {aliasLabel(a).charAt(0).toUpperCase()}
                  </div>
                  {aliasLabel(a)}
                  {active && <X className="w-3 h-3 opacity-60" />}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
              className={`${cls} !pl-10`} placeholder="Search emails..." />
          </div>

          {/* Thread list */}
          {inboxLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-[#00bfff]/30 border-t-[#00bfff] rounded-full animate-spin" />
              <span className="text-xs text-neutral-600">Loading inbox...</span>
            </div>
          ) : inbox.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-full bg-neutral-900/60 flex items-center justify-center"><Inbox className="w-8 h-8 text-neutral-700" /></div>
              <p className="text-sm text-neutral-600">No emails found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {inbox.map((t: any) => {
                const name = extractName(t.from)
                const initial = name.charAt(0).toUpperCase()
                return (
                  <button key={t.id} onClick={() => openThread(t.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all cursor-pointer text-left group ${t.unread ? 'bg-[#00bfff]/[0.03] border-[#00bfff]/10 hover:bg-[#00bfff]/[0.06]' : 'bg-transparent border-transparent hover:bg-neutral-900/50 hover:border-neutral-800/50'}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 transition-transform group-hover:scale-105" style={{ background: avatarColor(t.from) }}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm truncate ${t.unread ? 'text-white font-semibold' : 'text-neutral-300'}`}>{name}</span>
                        {t.unread && <span className="w-2 h-2 rounded-full bg-[#00bfff] shrink-0" />}
                        <span className="text-[10px] text-neutral-600 ml-auto shrink-0">{timeAgo(t.date)}</span>
                      </div>
                      <div className={`text-sm truncate ${t.unread ? 'text-neutral-200 font-medium' : 'text-neutral-500'}`}>{t.subject}</div>
                      <div className="text-xs text-neutral-600 truncate mt-0.5">{t.snippet}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {t.messageCount > 1 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800/60 text-neutral-500 font-medium">{t.messageCount}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => changePage(Math.max(0, page - 1))} disabled={page === 0} className="text-xs text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-neutral-800/50 transition-all">Previous</button>
            <span className="text-[11px] text-neutral-600 font-medium">Page {page + 1}</span>
            <button onClick={() => changePage(page + 1)} disabled={inbox.length < 20} className="text-xs text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-neutral-800/50 transition-all">Next</button>
          </div>
        </div>
      )}

      {tab === 'compose' && <MailCompose />}
      {tab === 'templates' && <MailTemplates onUseTemplate={() => { setTab('compose') }} />}

      {/* MAILBOXES MANAGEMENT */}
      {tab === 'mailboxes' && canManage && <MailboxManager aliases={aliases} />}
    </div>
  )
}

// ─── Mailbox Manager (subtab) ────────────────────────────
function MailboxManager({ aliases }: { aliases: any[] }) {
  const { users } = useAdminStore()
  const [selUser, setSelUser] = useState('')
  const [userBoxes, setUserBoxes] = useState<any[]>([])
  const [newBox, setNewBox] = useState('')
  const [loading, setLoading] = useState(false)

  const loadBoxes = useCallback(async (email: string) => {
    if (!email) return
    setLoading(true)
    const r = await adminActions.getUserMailboxes(email)
    setUserBoxes(Array.isArray(r) ? r : [])
    setLoading(false)
  }, [])

  const handleAssign = async () => {
    if (!selUser || !newBox) return
    await adminActions.assignMailbox(selUser, newBox)
    setNewBox('')
    loadBoxes(selUser)
  }

  const handleRemove = async (mb: string) => {
    if (!selUser) return
    await adminActions.removeMailbox(selUser, mb)
    loadBoxes(selUser)
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Sliders className="w-5 h-5 text-[#00bfff]" />Mailbox Assignments
      </h3>
      <p className="text-sm text-neutral-500">Assign or remove mailbox access for team members. Each user's company email is always accessible by default.</p>

      <div>
        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Select Team Member</label>
        <select value={selUser} onChange={e => { setSelUser(e.target.value); loadBoxes(e.target.value) }} className={cls}>
          <option value="">Choose a user...</option>
          {users.filter((u: any) => u.status === 'Active').map((u: any) => (
            <option key={u.id || u.email} value={u.email}>{u.name} ({u.email}){u.company_email ? ` — ${u.company_email}` : ''}</option>
          ))}
        </select>
      </div>

      {selUser && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="text-sm font-semibold text-white">Assigned Mailboxes</div>
          {loading ? (
            <div className="text-xs text-neutral-600">Loading...</div>
          ) : userBoxes.length === 0 ? (
            <div className="text-xs text-neutral-600">No additional mailboxes assigned. Only their company email is accessible.</div>
          ) : (
            <div className="space-y-1.5">
              {userBoxes.map((mb: any) => (
                <div key={mb.alias} className="flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-800/40 bg-neutral-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: avatarColor(mb.alias) }}>
                      {(mb.name || mb.alias).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{mb.alias}</span>
                      <span className="text-xs text-neutral-600 ml-2">{mb.name}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(mb.alias)} className="text-xs text-red-400/70 hover:text-red-400 cursor-pointer px-2 py-1 rounded hover:bg-red-500/10 transition-all">Remove</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Add Mailbox</label>
              <select value={newBox} onChange={e => setNewBox(e.target.value)} className={cls}>
                <option value="">Select mailbox...</option>
                {aliases.filter((a: any) => !userBoxes.find((b: any) => b.alias === aliasKey(a))).map((a: any) => (
                  <option key={aliasKey(a)} value={aliasKey(a)}>{aliasLabel(a)} ({aliasKey(a)})</option>
                ))}
              </select>
            </div>
            <button onClick={handleAssign} disabled={!newBox}
              className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,128,255,0.25)] disabled:opacity-40 transition-all">
              <Plus className="w-4 h-4" />Assign
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
