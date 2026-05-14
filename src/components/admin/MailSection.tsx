import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Mail, Inbox, Send, FileText, Settings, Search, Filter } from 'lucide-react'
import MailThread from './mail/MailThread'
import MailCompose from './mail/MailCompose'
import MailTemplates from './mail/MailTemplates'

type Tab = 'inbox' | 'compose' | 'templates' | 'aliases'

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
  const m = from.match(/^"?([^"<]+)"?\s*</)
  return m ? m[1].trim() : from.split('@')[0]
}

function avatarColor(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return `hsl(${Math.abs(h) % 360}, 55%, 42%)`
}

export default function MailSection() {
  const { inbox, inboxLoading, activeThread, emailAliases, user } = useAdminStore()
  const [tab, setTab] = useState<Tab>('inbox')
  const [aliasFilter, setAliasFilter] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(0)
  const [newAlias, setNewAlias] = useState({ alias: '', name: '', visibility: 'all', owner: '', category: 'general' })

  const isGodmode = user?.role === 'Godmode'
  const aliases = Array.isArray(emailAliases) ? emailAliases : []

  useEffect(() => {
    adminActions.loadInbox('all', 0)
    adminActions.loadEmailAliases()
    adminActions.loadEmailTemplates()
  }, [])

  const doSearch = () => { setPage(0); adminActions.loadInbox(aliasFilter, 0, searchQ) }
  const changePage = (p: number) => { setPage(p); adminActions.loadInbox(aliasFilter, p, searchQ) }
  const changeAlias = (a: string) => { setAliasFilter(a); setPage(0); adminActions.loadInbox(a, 0, searchQ) }
  const openThread = async (id: string) => { await adminActions.loadThread(id) }
  const closeThread = () => { adminActions.clearActiveThread(); adminActions.loadInbox(aliasFilter, page, searchQ) }

  const tabs: { id: Tab; label: string; icon: any; godmode?: boolean }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'aliases', label: 'Aliases', icon: Settings, godmode: true },
  ]

  // Thread view
  if (activeThread) return <MailThread thread={activeThread} aliases={aliases} onClose={closeThread} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00bfff]/20 to-[#0060ff]/10 border border-[#00bfff]/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#00bfff]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mail Hub</h2>
            <p className="text-xs text-neutral-500">Centralized ICUNI email management</p>
          </div>
        </div>
        <div className="flex rounded-xl bg-neutral-900/60 border border-neutral-800/50 p-1 gap-0.5">
          {tabs.filter(t => !t.godmode || isGodmode).map(t => {
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
          {/* Toolbar */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
              <select value={aliasFilter} onChange={e => changeAlias(e.target.value)} className={`${cls} !pl-9 !w-auto !min-w-[180px]`}>
                <option value="all">All Mailboxes</option>
                {aliases.map((a: any) => <option key={a.alias || a} value={a.alias || a}>{a.name || a.alias} ({a.alias})</option>)}
              </select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
                className={`${cls} !pl-10`} placeholder="Search emails..." />
            </div>
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
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 transition-transform group-hover:scale-105" style={{ background: avatarColor(t.from) }}>
                      {initial}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm truncate ${t.unread ? 'text-white font-semibold' : 'text-neutral-300'}`}>{name}</span>
                        {t.unread && <span className="w-2 h-2 rounded-full bg-[#00bfff] shrink-0" />}
                        <span className="text-[10px] text-neutral-600 ml-auto shrink-0">{timeAgo(t.date)}</span>
                      </div>
                      <div className={`text-sm truncate ${t.unread ? 'text-neutral-200 font-medium' : 'text-neutral-500'}`}>{t.subject}</div>
                      <div className="text-xs text-neutral-600 truncate mt-0.5">{t.snippet}</div>
                    </div>
                    {/* Meta */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {t.messageCount > 1 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800/60 text-neutral-500 font-medium">{t.messageCount}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => changePage(Math.max(0, page - 1))} disabled={page === 0} className="text-xs text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-neutral-800/50 transition-all">Previous</button>
            <span className="text-[11px] text-neutral-600 font-medium">Page {page + 1}</span>
            <button onClick={() => changePage(page + 1)} disabled={inbox.length < 20} className="text-xs text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-neutral-800/50 transition-all">Next</button>
          </div>
        </div>
      )}

      {/* COMPOSE */}
      {tab === 'compose' && <MailCompose />}

      {/* TEMPLATES */}
      {tab === 'templates' && <MailTemplates onUseTemplate={() => { setTab('compose') }} />}

      {/* ALIASES */}
      {tab === 'aliases' && isGodmode && (
        <div className="space-y-5 max-w-3xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Filter className="w-5 h-5 text-[#00bfff]" />Email Aliases</h3>
          <div className="space-y-1.5">{aliases.map((a: any) => (
            <div key={a.alias} className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-neutral-800/40 bg-neutral-900/30 hover:bg-neutral-900/60 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: avatarColor(a.alias) }}>
                  {(a.name || a.alias).charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-medium text-white">{a.alias}</span>
                  <span className="text-xs text-neutral-600 ml-2">{a.name}</span>
                  {a.unregistered && <span className="text-[10px] ml-2 text-amber-400 font-medium">(auto-discovered)</span>}
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${a.visibility === 'private' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : a.visibility?.startsWith('role:') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {a.visibility === 'private' ? `Private (${a.owner})` : a.visibility?.startsWith('role:') ? a.visibility.replace('role:', '') + ' Only' : 'All Users'}
              </span>
            </div>
          ))}</div>
          <div className="bg-neutral-900/60 border border-neutral-800/40 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white">Add / Update Alias</h4>
            <div className="grid grid-cols-2 gap-3">
              <input value={newAlias.alias} onChange={e => setNewAlias({ ...newAlias, alias: e.target.value })} className={cls} placeholder="alias@icuni.org" />
              <input value={newAlias.name} onChange={e => setNewAlias({ ...newAlias, name: e.target.value })} className={cls} placeholder="Display name" />
              <select value={newAlias.visibility} onChange={e => setNewAlias({ ...newAlias, visibility: e.target.value })} className={cls}>
                <option value="all">All Users</option><option value="private">Private</option><option value="role:Godmode">Godmode Only</option>
              </select>
              {newAlias.visibility === 'private' && <input value={newAlias.owner} onChange={e => setNewAlias({ ...newAlias, owner: e.target.value })} className={cls} placeholder="Owner email" />}
            </div>
            <button onClick={async () => { if (!newAlias.alias.trim()) return; await adminActions.updateEmailAlias(newAlias); setNewAlias({ alias: '', name: '', visibility: 'all', owner: '', category: 'general' }); adminActions.loadEmailAliases(true) }}
              className="px-5 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,128,255,0.25)] transition-all">Save Alias</button>
          </div>
        </div>
      )}
    </div>
  )
}
