import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Mail, Send, Reply, ChevronLeft, Search, Users, FileText, Settings as SettingsIcon, Inbox, Filter } from 'lucide-react'

type Tab = 'inbox' | 'compose' | 'templates' | 'aliases'

const inputCls = "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#00bfff]/50 focus:outline-none transition-colors"

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  if (ms < 60000) return 'now'
  if (ms < 3600000) return Math.floor(ms / 60000) + 'm'
  if (ms < 86400000) return Math.floor(ms / 3600000) + 'h'
  return Math.floor(ms / 86400000) + 'd'
}

export default function MailSection() {
  const { inbox, inboxLoading, activeThread, emailAliases, emailTemplates, user, clients, referrers, users: teamUsers } = useAdminStore()
  const [tab, setTab] = useState<Tab>('inbox')
  const [aliasFilter, setAliasFilter] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(0)

  // Compose state
  const [compTo, setCompTo] = useState('')
  const [compSubject, setCompSubject] = useState('')
  const [compBody, setCompBody] = useState('')
  const [compFrom, setCompFrom] = useState('labs@icuni.org')
  const [compTemplate, setCompTemplate] = useState('custom')
  const [compUseTemplate, setCompUseTemplate] = useState(true)
  const [compRecipients, setCompRecipients] = useState<{email:string,name:string}[]>([])
  const [compGroup, setCompGroup] = useState<string|null>(null)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)

  // Reply state
  const [replyBody, setReplyBody] = useState('')
  const [replyFrom, setReplyFrom] = useState('labs@icuni.org')
  const [replying, setReplying] = useState(false)
  const [showReply, setShowReply] = useState(false)

  // Alias management
  const [newAlias, setNewAlias] = useState({ alias: '', name: '', visibility: 'all', owner: '', category: 'general' })

  const isGodmode = user?.role === 'Godmode'
  const sendableAliases = Array.isArray(emailAliases) ? emailAliases.filter((a: any) => typeof a === 'object' ? a.can_send : true) : []

  useEffect(() => {
    adminActions.loadInbox('all', 0)
    adminActions.loadEmailAliases()
    adminActions.loadEmailTemplates()
    if (!clients.length) adminActions.loadClients()
  }, [])

  const doSearch = () => { setPage(0); adminActions.loadInbox(aliasFilter, 0, searchQ) }
  const changePage = (p: number) => { setPage(p); adminActions.loadInbox(aliasFilter, p, searchQ) }
  const changeAlias = (a: string) => { setAliasFilter(a); setPage(0); adminActions.loadInbox(a, 0, searchQ) }

  const openThread = async (id: string) => { await adminActions.loadThread(id) }
  const closeThread = () => { adminActions.clearActiveThread(); adminActions.loadInbox(aliasFilter, page, searchQ) }

  const handleReply = async () => {
    if (!activeThread || !replyBody.trim()) return
    setReplying(true)
    const ok = await adminActions.replyToThread(activeThread.id, replyBody, replyFrom, compUseTemplate)
    setReplying(false)
    if (ok) { setReplyBody(''); setShowReply(false) }
  }

  const handleSend = async () => {
    if (!compSubject.trim() || !compBody.trim()) return
    setSending(true); setSendResult(null)
    const recipients = compGroup ? getGroupRecipients(compGroup) : compRecipients.length > 0 ? compRecipients : compTo ? [{ email: compTo, name: '' }] : []
    if (recipients.length === 0) { setSending(false); return }
    const result = await adminActions.sendBrandedEmail({ subject: compSubject, body: compBody, fromAlias: compFrom, recipients, useTemplate: compUseTemplate })
    setSendResult(result)
    setSending(false)
  }

  const loadTemplateFields = (tplId: string) => {
    setCompTemplate(tplId)
    const tpl = emailTemplates.find((t: any) => t.id === tplId)
    if (tpl && tpl.id !== 'custom') { setCompSubject(tpl.subject); setCompBody(tpl.body) }
  }

  const getGroupRecipients = (group: string): {email:string,name:string}[] => {
    if (group === 'clients') return clients.filter((c:any) => c.email && c.status !== 'deleted').map((c:any) => ({ email: c.email, name: c.name || '' }))
    if (group === 'referrers') return referrers.filter((r:any) => r.email).map((r:any) => ({ email: r.email, name: r.name || '' }))
    if (group === 'team') return teamUsers.filter((u:any) => u.email && ['Godmode','SuperAdmin','Admin','Sales','Product'].includes(u.role)).map((u:any) => ({ email: u.email, name: u.name || '' }))
    return []
  }

  const tabBtn = (id: Tab, label: string, icon: any) => (
    <button key={id} onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === id ? 'bg-[#00bfff]/10 text-[#00bfff] border border-[#00bfff]/20' : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50 border border-transparent'}`}>
      {icon}{label}
    </button>
  )

  // ── THREAD VIEW ──
  if (activeThread) {
    return (
      <div className="space-y-4">
        <button onClick={closeThread} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4" />Back to Inbox
        </button>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">{activeThread.subject}</h2>
          <div className="space-y-4">
            {(activeThread.messages || []).map((msg: any, i: number) => (
              <div key={msg.id || i} className="border border-neutral-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-neutral-400"><span className="text-white font-medium">{msg.from}</span> &rarr; {msg.to}</div>
                  <span className="text-[10px] text-neutral-600">{new Date(msg.date).toLocaleString()}</span>
                </div>
                {msg.cc && <div className="text-[10px] text-neutral-600 mb-2">CC: {msg.cc}</div>}
                <div className="text-sm text-neutral-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.body }} />
                {msg.attachments?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map((a: any, j: number) => (
                      <span key={j} className="text-[10px] px-2 py-1 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                        <FileText className="w-3 h-3 inline mr-1" />{a.name} ({Math.round(a.size/1024)}KB)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Reply */}
          <div className="mt-4 border-t border-neutral-800 pt-4">
            {!showReply ? (
              <button onClick={() => setShowReply(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#00bfff]/10 text-[#00bfff] rounded-lg text-sm font-medium hover:bg-[#00bfff]/20 transition-all cursor-pointer border border-[#00bfff]/20">
                <Reply className="w-4 h-4" />Reply
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <select value={replyFrom} onChange={e => setReplyFrom(e.target.value)} className={`${inputCls} !w-auto`}>
                    {(Array.isArray(emailAliases) ? emailAliases : []).map((a: any) => {
                      const alias = typeof a === 'string' ? a : a.alias
                      return <option key={alias} value={alias}>{alias}</option>
                    })}
                  </select>
                  <label className="flex items-center gap-2 text-xs text-neutral-500">
                    <input type="checkbox" checked={compUseTemplate} onChange={e => setCompUseTemplate(e.target.checked)} className="accent-[#00bfff]" />Branded
                  </label>
                </div>
                <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} className={`${inputCls} !min-h-[120px]`} placeholder="Type your reply..." />
                <div className="flex gap-2">
                  <button onClick={handleReply} disabled={replying || !replyBody.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-cyan-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40">
                    <Send className="w-4 h-4" />{replying ? 'Sending...' : 'Send Reply'}
                  </button>
                  <button onClick={() => setShowReply(false)} className="px-4 py-2.5 text-neutral-500 hover:text-white text-sm cursor-pointer">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN VIEW ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Mail className="w-6 h-6 text-[#00bfff]" />Mail Hub</h2>
        <div className="flex gap-2 flex-wrap">
          {tabBtn('inbox', 'Inbox', <Inbox className="w-4 h-4" />)}
          {tabBtn('compose', 'Compose', <Send className="w-4 h-4" />)}
          {tabBtn('templates', 'Templates', <FileText className="w-4 h-4" />)}
          {isGodmode && tabBtn('aliases', 'Aliases', <SettingsIcon className="w-4 h-4" />)}
        </div>
      </div>

      {/* ═══ INBOX TAB ═══ */}
      {tab === 'inbox' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select value={aliasFilter} onChange={e => changeAlias(e.target.value)} className={`${inputCls} !w-auto`}>
              <option value="all">All Aliases</option>
              {(Array.isArray(emailAliases) ? emailAliases : []).map((a: any) => {
                const alias = typeof a === 'string' ? a : a.alias
                return <option key={alias} value={alias}>{alias}</option>
              })}
            </select>
            <div className="flex-1 relative">
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
                className={inputCls} placeholder="Search emails..." />
              <button onClick={doSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"><Search className="w-4 h-4" /></button>
            </div>
          </div>

          {inboxLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-8 h-8 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-16 text-neutral-600">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No emails found.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {inbox.map((t: any) => (
                <button key={t.id} onClick={() => openThread(t.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer text-left group ${t.unread ? 'bg-[#00bfff]/5 border-[#00bfff]/10 hover:border-[#00bfff]/30' : 'bg-neutral-900/30 border-neutral-800 hover:border-neutral-700'}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.unread ? 'bg-[#00bfff]' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm truncate ${t.unread ? 'text-white font-bold' : 'text-neutral-300 font-medium'}`}>{t.from}</span>
                      <span className="text-[10px] text-neutral-600 shrink-0">{timeAgo(t.date)}</span>
                    </div>
                    <div className={`text-sm truncate ${t.unread ? 'text-white' : 'text-neutral-400'}`}>{t.subject}</div>
                    <div className="text-xs text-neutral-600 truncate mt-0.5">{t.snippet}</div>
                  </div>
                  {t.messageCount > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 shrink-0">{t.messageCount}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={() => changePage(Math.max(0, page - 1))} disabled={page === 0}
              className="text-xs text-neutral-500 hover:text-white disabled:opacity-30 cursor-pointer">Previous</button>
            <span className="text-xs text-neutral-600">Page {page + 1}</span>
            <button onClick={() => changePage(page + 1)} disabled={inbox.length < 20}
              className="text-xs text-neutral-500 hover:text-white disabled:opacity-30 cursor-pointer">Next</button>
          </div>
        </div>
      )}

      {/* ═══ COMPOSE TAB ═══ */}
      {tab === 'compose' && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4 max-w-3xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-[#00bfff]" />Compose Email</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">From</label>
              <select value={compFrom} onChange={e => setCompFrom(e.target.value)} className={inputCls}>
                {sendableAliases.map((a: any) => {
                  const alias = typeof a === 'string' ? a : a.alias
                  return <option key={alias} value={alias}>{alias}</option>
                })}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Template</label>
              <select value={compTemplate} onChange={e => loadTemplateFields(e.target.value)} className={inputCls}>
                {emailTemplates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Send To</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {['clients', 'referrers', 'team'].map(g => (
                <button key={g} onClick={() => { setCompGroup(compGroup === g ? null : g); setCompRecipients([]) }}
                  className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${compGroup === g ? 'bg-[#00bfff]/10 text-[#00bfff] border-[#00bfff]/20' : 'text-neutral-500 border-neutral-700 hover:text-white'}`}>
                  <Users className="w-3 h-3 inline mr-1" />All {g.charAt(0).toUpperCase() + g.slice(1)} {compGroup === g && `(${getGroupRecipients(g).length})`}
                </button>
              ))}
            </div>
            {!compGroup && (
              <input value={compTo} onChange={e => setCompTo(e.target.value)} className={inputCls} placeholder="recipient@example.com" />
            )}
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Subject</label>
            <input value={compSubject} onChange={e => setCompSubject(e.target.value)} className={inputCls} placeholder="Email subject..." />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Body</label>
            <textarea value={compBody} onChange={e => setCompBody(e.target.value)} className={`${inputCls} !min-h-[180px]`} placeholder="Write your message..." />
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            <input type="checkbox" checked={compUseTemplate} onChange={e => setCompUseTemplate(e.target.checked)} className="accent-[#00bfff]" />
            Use branded ICUNI template wrapper
          </label>

          {sendResult && (
            <div className={`text-sm p-3 rounded-lg border ${sendResult.sent > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {sendResult.sent} sent{sendResult.failed > 0 && `, ${sendResult.failed} failed`}
            </div>
          )}

          <button onClick={handleSend} disabled={sending || !compSubject.trim() || !compBody.trim()}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#00bfff] to-cyan-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40">
            <Send className="w-4 h-4" />{sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      )}

      {/* ═══ TEMPLATES TAB ═══ */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-[#00bfff]" />Email Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emailTemplates.map((t: any) => (
              <div key={t.id} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500">{t.category}</span>
                </div>
                <p className="text-xs text-neutral-500 mb-2 line-clamp-2">{t.subject}</p>
                <p className="text-xs text-neutral-600 line-clamp-3">{t.body}</p>
                <button onClick={() => { setTab('compose'); loadTemplateFields(t.id) }}
                  className="mt-3 text-xs text-[#00bfff] hover:text-cyan-300 cursor-pointer">Use Template &rarr;</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ALIASES TAB (Godmode) ═══ */}
      {tab === 'aliases' && isGodmode && (
        <div className="space-y-4 max-w-3xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Filter className="w-5 h-5 text-[#00bfff]" />Email Aliases</h3>
          <div className="space-y-2">
            {(Array.isArray(emailAliases) ? emailAliases : []).map((a: any) => (
              <div key={a.alias} className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900/40">
                <div>
                  <span className="text-sm font-medium text-white">{a.alias}</span>
                  <span className="text-xs text-neutral-600 ml-2">{a.name}</span>
                  {a.unregistered && <span className="text-[10px] ml-2 text-amber-400">(discovered)</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.visibility === 'private' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {a.visibility === 'private' ? `Private (${a.owner})` : 'All Users'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-500">{a.category}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Add alias */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-white">Add / Update Alias</h4>
            <div className="grid grid-cols-2 gap-3">
              <input value={newAlias.alias} onChange={e => setNewAlias({...newAlias, alias: e.target.value})} className={inputCls} placeholder="alias@icuni.org" />
              <input value={newAlias.name} onChange={e => setNewAlias({...newAlias, name: e.target.value})} className={inputCls} placeholder="Display name" />
              <select value={newAlias.visibility} onChange={e => setNewAlias({...newAlias, visibility: e.target.value})} className={inputCls}>
                <option value="all">All Users</option>
                <option value="private">Private</option>
              </select>
              {newAlias.visibility === 'private' && (
                <input value={newAlias.owner} onChange={e => setNewAlias({...newAlias, owner: e.target.value})} className={inputCls} placeholder="Owner email" />
              )}
            </div>
            <button onClick={async () => {
              if (!newAlias.alias.trim()) return
              await adminActions.updateEmailAlias(newAlias)
              setNewAlias({ alias: '', name: '', visibility: 'all', owner: '', category: 'general' })
            }} className="px-4 py-2 bg-[#00bfff] text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-cyan-500 transition-colors">
              Save Alias
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
