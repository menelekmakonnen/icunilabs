import { useEffect, useState } from 'react'
import { adminActions } from '../../store/useAdminStore'
import { X, Mail, Phone, Trash2, UserPlus, Users, Pencil, Star, Save } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'
const modalBg = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
const modalCard = 'bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl'

const AVATAR_COLORS = ['#00bfff','#8b5cf6','#ff7a00','#10b981','#ef4444','#f59e0b','#ec4899','#06b6d4']
function getAvatarColor(name: string) { let h = 0; for (let i = 0; i < (name||'').length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] }
function getInitials(name: string) { const clean = (name || '').replace(/[^a-zA-Z\s]/g, '').trim(); if (!clean) return '\u2022'; return clean.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) }

const ROLE_COLORS: Record<string, string> = { 'CEO': '#ff7a00', 'CTO': '#8b5cf6', 'CFO': '#10b981', 'COO': '#00bfff', 'Manager': '#f59e0b', 'Director': '#ec4899', 'Owner': '#ff7a00', 'Assistant': '#06b6d4', 'Accountant': '#10b981' }
function getRoleColor(role: string) {
  const key = Object.keys(ROLE_COLORS).find(k => role?.toLowerCase().includes(k.toLowerCase()))
  return key ? ROLE_COLORS[key] : '#64748b'
}

export interface ContactsTabProps {
  clientId: string
  contactsList: any[]
  setContactsList: (v: any[]) => void
  contactsLoading: boolean
  setContactsLoading: (v: boolean) => void
  showAddContact: boolean
  setShowAddContact: (v: boolean) => void
  contactForm: { name: string; role: string; email: string; phone: string; notes: string }
  setContactForm: (v: { name: string; role: string; email: string; phone: string; notes: string }) => void
  busyContactSave: boolean
  setBusyContactSave: (v: boolean) => void
}

export default function ContactsTab({
  clientId, contactsList, setContactsList, contactsLoading, setContactsLoading,
  showAddContact, setShowAddContact, contactForm, setContactForm,
  busyContactSave, setBusyContactSave,
}: ContactsTabProps) {
  // ── Edit state ──
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', role: '', email: '', phone: '', notes: '' })
  const [busyEdit, setBusyEdit] = useState(false)

  // Load contacts when tab mounts or client changes
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setContactsLoading(true)
      const list = await adminActions.loadContacts(clientId)
      if (!cancelled) { setContactsList(list || []); setContactsLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [clientId, setContactsList, setContactsLoading])

  const reload = async () => {
    const list = await adminActions.loadContacts(clientId)
    setContactsList(list || [])
  }

  const handleAddContact = async () => {
    if (!contactForm.name.trim()) return
    setBusyContactSave(true)
    const result = await adminActions.addContact({
      client_id: clientId,
      name: contactForm.name,
      role: contactForm.role,
      email: contactForm.email,
      phone: contactForm.phone,
      notes: contactForm.notes,
    })
    setBusyContactSave(false)
    if (result) {
      setShowAddContact(false)
      setContactForm({ name: '', role: '', email: '', phone: '', notes: '' })
      await reload()
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Delete this contact?')) return
    await adminActions.deleteContact(contactId)
    await reload()
  }

  const startEdit = (contact: any) => {
    setEditingId(contact.contact_id || contact.id)
    setEditForm({
      name: contact.name || '',
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
    })
  }

  const cancelEdit = () => { setEditingId(null) }

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name.trim()) return
    setBusyEdit(true)
    await adminActions.updateContact(editingId, {
      name: editForm.name,
      role: editForm.role,
      email: editForm.email,
      phone: editForm.phone,
      notes: editForm.notes,
    })
    setBusyEdit(false)
    setEditingId(null)
    await reload()
  }

  const handleTogglePrimary = async (contact: any) => {
    const id = contact.contact_id || contact.id
    const newVal = contact.is_primary === 'true' || contact.is_primary === true ? 'false' : 'true'
    await adminActions.updateContact(id, { is_primary: newVal })
    await reload()
  }

  return (
    <div className="crm-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00bfff]" />
          <h3 className="text-sm font-bold text-white">Contacts</h3>
          <span className="text-[10px] text-neutral-600 ml-1">{contactsList.length} people</span>
        </div>
        <button onClick={() => setShowAddContact(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00bfff]/10 border border-[#00bfff]/20 text-[#00bfff] rounded-lg text-xs font-bold cursor-pointer hover:bg-[#00bfff]/20 transition-all">
          <UserPlus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </div>

      {/* Loading */}
      {contactsLoading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin w-5 h-5 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
        </div>
      )}

      {/* Empty State */}
      {!contactsLoading && contactsList.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 font-medium mb-1">No contacts yet</p>
          <p className="text-xs text-neutral-600 mb-4">Add key people at this company — decision-makers, gatekeepers, champions.</p>
          <button onClick={() => setShowAddContact(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00bfff]/10 border border-[#00bfff]/20 text-[#00bfff] rounded-lg text-xs font-bold cursor-pointer hover:bg-[#00bfff]/20 transition-all">
            <UserPlus className="w-3.5 h-3.5" /> Add First Contact
          </button>
        </div>
      )}

      {/* Contacts List */}
      {!contactsLoading && contactsList.length > 0 && (
        <div className="space-y-2">
          {contactsList.map((contact: any) => {
            const cId = contact.contact_id || contact.id
            const isPrimary = contact.is_primary === 'true' || contact.is_primary === true
            const isEditing = editingId === cId

            if (isEditing) {
              return (
                <div key={cId} className="p-3 rounded-xl border border-[#00bfff]/30 bg-neutral-900/60 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500 mb-0.5 block">Name *</label>
                      <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className={inputCls} autoFocus />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 mb-0.5 block">Role</label>
                      <input value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500 mb-0.5 block">Email</label>
                      <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 mb-0.5 block">Phone</label>
                      <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 mb-0.5 block">Notes</label>
                    <input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className={inputCls} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEdit} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-white cursor-pointer transition-colors">Cancel</button>
                    <button onClick={handleSaveEdit} disabled={!editForm.name.trim() || busyEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00bfff]/10 border border-[#00bfff]/20 text-[#00bfff] rounded-lg text-xs font-bold cursor-pointer hover:bg-[#00bfff]/20 transition-all disabled:opacity-40">
                      {busyEdit ? <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg> : <Save className="w-3.5 h-3.5" />} Save
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={cId} className="flex items-start gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/60 transition-all group">
                {/* Avatar + Primary Star */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: getAvatarColor(contact.name || '') }}>
                    {getInitials(contact.name || '')}
                  </div>
                  {isPrimary && (
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 absolute -top-1 -right-1" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white truncate">{contact.name}</span>
                    {isPrimary && <span className="text-[8px] text-amber-400 font-bold uppercase tracking-wider">Primary</span>}
                    {contact.role && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ color: getRoleColor(contact.role), background: getRoleColor(contact.role) + '15', border: `1px solid ${getRoleColor(contact.role)}30` }}>
                        {contact.role}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
                    {contact.email && <a href={`mailto:${contact.email}`} className="text-xs text-[#00bfff] hover:underline truncate flex items-center gap-1"><Mail className="w-3 h-3 shrink-0" />{contact.email}</a>}
                    {contact.phone && <a href={`tel:${contact.phone}`} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" />{contact.phone}</a>}
                  </div>
                  {contact.notes && <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed truncate">{contact.notes}</p>}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                  <button onClick={() => handleTogglePrimary(contact)} className={`cursor-pointer transition-colors ${isPrimary ? 'text-amber-400' : 'text-neutral-700 hover:text-amber-400'}`} title={isPrimary ? 'Remove primary' : 'Set as primary'}>
                    <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-amber-400' : ''}`} />
                  </button>
                  <button onClick={() => startEdit(contact)} className="text-neutral-700 hover:text-[#00bfff] cursor-pointer transition-colors" title="Edit contact">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteContact(cId)} className="text-neutral-700 hover:text-red-400 cursor-pointer transition-colors" title="Delete contact">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className={modalBg} onClick={() => setShowAddContact(false)}>
          <div className={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#00bfff]" /> Add Contact</h3>
              <button onClick={() => setShowAddContact(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Name *</label>
                <input value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className={inputCls} placeholder="e.g. Kwame Asante" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Role / Title</label>
                  <input value={contactForm.role} onChange={e => setContactForm({...contactForm, role: e.target.value})} className={inputCls} placeholder="e.g. CEO, Manager" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Phone</label>
                  <input value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className={inputCls} placeholder="+233 xxx xxx" />
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Email</label>
                <input type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className={inputCls} placeholder="name@company.com" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Notes</label>
                <textarea value={contactForm.notes} onChange={e => setContactForm({...contactForm, notes: e.target.value})} className={`${inputCls} resize-none`} rows={2} placeholder="Decision-maker, gatekeeper, etc." />
              </div>
              <button onClick={handleAddContact} disabled={!contactForm.name.trim() || busyContactSave} className="w-full px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {busyContactSave ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Saving...</> : <><UserPlus className="w-4 h-4" />Add Contact</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
