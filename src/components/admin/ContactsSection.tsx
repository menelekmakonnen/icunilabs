import { useEffect, useMemo, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Users, Search, Plus, X, Star, Mail, Phone, MessageCircle, Pencil, Trash2, Building2, ArrowUpRight, Save } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'

// Call-script personas — the categories we map each contact to.
const CALL_PERSONAS: { id: string; label: string; color: string }[] = [
  { id: 'receptionist', label: 'Receptionist / Gatekeeper', color: '#06b6d4' },
  { id: 'front_desk', label: 'Front Desk', color: '#00bfff' },
  { id: 'buyer_manager', label: 'Buyer / Manager', color: '#f59e0b' },
  { id: 'middle_manager', label: 'Middle Manager', color: '#8b5cf6' },
  { id: 'owner', label: 'Owner / Founder', color: '#ff7a00' },
  { id: 'mr_cooper', label: 'Decision Maker', color: '#22c55e' },
  { id: 'other', label: 'Other', color: '#64748b' },
]
function personaOf(role: string) {
  const r = String(role || '').toLowerCase().trim()
  return CALL_PERSONAS.find(p => p.id === r) || CALL_PERSONAS.find(p => p.label.toLowerCase().includes(r) && r) || null
}
function roleColor(role: string) { return personaOf(role)?.color || '#64748b' }
function roleLabel(role: string) { return personaOf(role)?.label || (role || 'Contact') }

function isPrimary(c: any) { return c.is_primary === 'true' || c.is_primary === true }

const EMPTY_FORM = { client_id: '', name: '', role: 'buyer_manager', email: '', phone: '', whatsapp: '', notes: '', is_primary: 'false' }

export default function ContactsSection() {
  const { clients } = useAdminStore()
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    const list = await adminActions.loadContacts()
    setContacts(Array.isArray(list) ? list : [])
    setLoading(false)
  }
  useEffect(() => { adminActions.loadClients(); load() }, [])

  const clientMap = useMemo(() => {
    const m: Record<string, any> = {}
    ;(clients || []).forEach((c: any) => { m[c.client_id] = c })
    return m
  }, [clients])

  const enriched = useMemo(() => contacts.map(c => {
    const cl = clientMap[c.client_id] || {}
    return { ...c, _company: cl.company || cl.name || 'Unassigned', _clientName: cl.name || '', _client: cl }
  }), [contacts, clientMap])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return enriched.filter(c => {
      if (roleFilter && String(c.role || '').toLowerCase() !== roleFilter) return false
      if (!q) return true
      return [c.name, c._company, c.role, c.email, c.phone].some(v => String(v ?? '').toLowerCase().includes(q))
    })
  }, [enriched, search, roleFilter])

  // Group by company
  const groups = useMemo(() => {
    const map: Record<string, any[]> = {}
    filtered.forEach(c => { (map[c._company] = map[c._company] || []).push(c) })
    return Object.keys(map).sort((a, b) => a.localeCompare(b)).map(company => ({
      company,
      client: map[company][0]?._client,
      contacts: map[company].sort((a, b) => (isPrimary(b) ? 1 : 0) - (isPrimary(a) ? 1 : 0)),
    }))
  }, [filtered])

  const stats = useMemo(() => ({
    contacts: enriched.length,
    companies: new Set(enriched.map(c => c._company)).size,
    primaries: enriched.filter(isPrimary).length,
  }), [enriched])

  const openClient = (client: any) => {
    if (client?.client_id) { adminActions.setActiveClientOptimistic(client); adminActions.setSection('clients') }
  }

  const handleAdd = async () => {
    if (!form.client_id || !form.name.trim()) return
    setBusy(true)
    await adminActions.addContact({ ...form, role: form.role || 'other' })
    setShowAdd(false); setForm(EMPTY_FORM)
    await load()
    setBusy(false)
  }
  const startEdit = (c: any) => { setEditingId(c.contact_id); setEditForm({ name: c.name || '', role: c.role || 'other', email: c.email || '', phone: c.phone || '', whatsapp: c.whatsapp || '', notes: c.notes || '', is_primary: isPrimary(c) ? 'true' : 'false' }) }
  const saveEdit = async () => {
    if (!editingId) return
    setBusy(true)
    await adminActions.updateContact(editingId, editForm)
    setEditingId(null)
    await load()
    setBusy(false)
  }
  const remove = async (c: any) => {
    if (!confirm(`Delete contact "${c.name}"?`)) return
    setBusy(true)
    await adminActions.deleteContact(c.contact_id)
    await load()
    setBusy(false)
  }
  const togglePrimary = async (c: any) => {
    setBusy(true)
    await adminActions.updateContact(c.contact_id, { is_primary: isPrimary(c) ? 'false' : 'true' })
    await load()
    setBusy(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00bfff]/10 border border-[#00bfff]/20 flex items-center justify-center"><Users className="w-5 h-5 text-[#00bfff]" /></div>
          <div>
            <h2 className="text-lg font-bold text-white">Contacts</h2>
            <p className="text-[11px] text-neutral-500">Every contact across all companies, mapped to call-script roles.</p>
          </div>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setShowAdd(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-xs font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all w-fit">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[{ label: 'Contacts', value: stats.contacts, color: '#00bfff' }, { label: 'Companies', value: stats.companies, color: '#8b5cf6' }, { label: 'Primary', value: stats.primaries, color: '#22c55e' }].map((s, i) => (
          <div key={i} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + role filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts, companies, roles…" className={inputCls + ' pl-9'} />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button onClick={() => setRoleFilter('')} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${roleFilter === '' ? 'bg-neutral-700 text-white' : 'bg-neutral-900/60 text-neutral-500 hover:text-white border border-neutral-800'}`}>All</button>
          {CALL_PERSONAS.map(p => (
            <button key={p.id} onClick={() => setRoleFilter(roleFilter === p.id ? '' : p.id)} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all border" style={roleFilter === p.id ? { background: `${p.color}20`, color: p.color, borderColor: `${p.color}40` } : { color: '#737373', borderColor: '#262626' }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Groups */}
      {loading ? (
        <p className="text-sm text-neutral-600 text-center py-12">Loading contacts…</p>
      ) : groups.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
          <p className="text-sm text-neutral-600">{search || roleFilter ? 'No contacts match your filters' : 'No contacts yet — add one to get started'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(group => (
            <div key={group.company}>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                <h3 className="text-sm font-bold text-white">{group.company}</h3>
                <span className="text-[10px] text-neutral-600">{group.contacts.length}</span>
                {group.client?.client_id && (
                  <button onClick={() => openClient(group.client)} className="ml-auto text-[10px] text-[#00bfff] hover:text-white cursor-pointer flex items-center gap-0.5 transition-colors">Open client <ArrowUpRight className="w-3 h-3" /></button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {group.contacts.map(c => editingId === c.contact_id ? (
                  <div key={c.contact_id} className="bg-neutral-900/60 border border-[#00bfff]/30 rounded-xl p-3 space-y-2">
                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputCls + ' text-xs'} placeholder="Name" />
                    <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className={inputCls + ' text-xs'}>
                      {CALL_PERSONAS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputCls + ' text-xs'} placeholder="Email" />
                    <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={inputCls + ' text-xs'} placeholder="Phone" />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer">Cancel</button>
                      <button onClick={saveEdit} disabled={busy} className="flex-1 py-1.5 bg-[#00bfff]/15 text-[#00bfff] rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"><Save className="w-3 h-3" /> Save</button>
                    </div>
                  </div>
                ) : (
                  <div key={c.contact_id} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3 hover:border-neutral-700 transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isPrimary(c) && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                          <p className="text-sm font-bold text-white truncate">{c.name || 'Unnamed'}</p>
                        </div>
                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ color: roleColor(c.role), background: `${roleColor(c.role)}15`, border: `1px solid ${roleColor(c.role)}30` }}>{roleLabel(c.role)}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => togglePrimary(c)} title="Toggle primary" className="text-neutral-600 hover:text-amber-400 cursor-pointer"><Star className={`w-3.5 h-3.5 ${isPrimary(c) ? 'fill-amber-400 text-amber-400' : ''}`} /></button>
                        <button onClick={() => startEdit(c)} title="Edit" className="text-neutral-600 hover:text-[#00bfff] cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(c)} title="Delete" className="text-neutral-600 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {c.notes && <p className="text-[11px] text-neutral-500 mt-1.5 line-clamp-2">{c.notes}</p>}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {c.email && <a href={`mailto:${c.email}`} title={c.email} className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 transition-colors"><Mail className="w-3.5 h-3.5" /></a>}
                      {c.phone && <a href={`tel:${c.phone}`} title={c.phone} className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"><Phone className="w-3.5 h-3.5" /></a>}
                      {(c.whatsapp || c.phone) && <a href={`https://wa.me/${String(c.whatsapp || c.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"><MessageCircle className="w-3.5 h-3.5" /></a>}
                      <button onClick={() => openClient(c._client)} title="Open client in CRM" className="ml-auto text-[10px] text-neutral-500 hover:text-[#00bfff] cursor-pointer flex items-center gap-0.5 transition-colors">CRM <ArrowUpRight className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Contact</h3>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Company / Client *</label>
                <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className={inputCls}>
                  <option value="">— Select company —</option>
                  {(clients || []).filter((c: any) => (c.status || '').toLowerCase() !== 'deleted').sort((a: any, b: any) => String(a.company || a.name).localeCompare(String(b.company || b.name))).map((c: any) => (
                    <option key={c.client_id} value={c.client_id}>{c.company || c.name}{c.company && c.name ? ` — ${c.name}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-neutral-500 mb-1 block">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Contact name" /></div>
                <div><label className="text-xs text-neutral-500 mb-1 block">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls}>{CALL_PERSONAS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
                </div>
                <div><label className="text-xs text-neutral-500 mb-1 block">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="name@company.com" /></div>
                <div><label className="text-xs text-neutral-500 mb-1 block">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="Phone" /></div>
              </div>
              <div><label className="text-xs text-neutral-500 mb-1 block">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls + ' min-h-[60px]'} placeholder="Anything useful about this contact…" /></div>
              <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer"><input type="checkbox" checked={form.is_primary === 'true'} onChange={e => setForm({ ...form, is_primary: e.target.checked ? 'true' : 'false' })} /> Primary contact for this company</label>
              <button onClick={handleAdd} disabled={busy || !form.client_id || !form.name.trim()} className="w-full py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer disabled:opacity-40 transition-all">{busy ? 'Adding…' : 'Add Contact'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
