import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { ArrowLeft, Plus, FileText, Check, DollarSign } from 'lucide-react'
import InvoiceBuilder from './InvoiceBuilder'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'
const btnPrimary = 'px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40 whitespace-nowrap'

const PROJECT_TYPES = ['Website', 'Web App', 'Mobile App', 'CRM', 'Operations System', 'Inventory System', 'POS System', 'Custom Software', 'Automation', 'Other']

export default function NewProjectSection() {
  const { clients } = useAdminStore()
  const [step, setStep] = useState<'details' | 'invoice'>('details')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    title: '',
    type: 'Website',
    description: '',
    estimated_cost: '',
    est_completion: '',
  })

  useEffect(() => { adminActions.loadClients() }, [])

  const selectedClient = (clients || []).find((c: any) => c.client_id === form.client_id)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id || !form.title) return
    setBusy(true)
    const result = await adminActions.createProject({
      client_id: form.client_id,
      title: form.title,
      type: form.type,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      description: form.description || undefined,
      est_completion: form.est_completion || undefined,
    })
    setBusy(false)
    if (result) setCreated(true)
  }

  // ── SUCCESS STATE ──
  if (created) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Project Created!</h2>
        <p className="text-sm text-neutral-500 mb-6">
          {form.title} for {selectedClient?.name || 'client'} has been created.
        </p>
        <div className="flex gap-3">
          <button onClick={() => { setCreated(false); setForm({ client_id: '', title: '', type: 'Website', description: '', estimated_cost: '', est_completion: '' }); setStep('details') }}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white border border-neutral-700 rounded-lg cursor-pointer transition-colors">
            Create Another
          </button>
          <button onClick={() => setStep('invoice')}
            className={btnPrimary + ' flex items-center gap-2'}>
            <DollarSign className="w-4 h-4" /> Generate Invoice
          </button>
        </div>
      </div>
    )
  }

  // ── INVOICE BUILDER (pre-populated) ──
  if (step === 'invoice') {
    return (
      <div className="-m-3 sm:-m-6">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-neutral-800 bg-neutral-950/80">
          <button onClick={() => setStep('details')} className="text-neutral-500 hover:text-white cursor-pointer transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">Invoice for {form.title || 'New Project'}</h2>
            <p className="text-[10px] text-neutral-600">
              Client: {selectedClient?.name || 'Select a client first'}
            </p>
          </div>
        </div>
        <InvoiceBuilder />
      </div>
    )
  }

  // ── PROJECT DETAILS FORM ──
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">New Project</h2>
        <p className="text-xs text-neutral-500">Create a new client project — linked to your CRM and invoice system</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Client Selector */}
        <div className="p-5 rounded-xl bg-neutral-900/30 border border-neutral-800">
          <label className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-3 block">Client</label>
          <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className={inputCls} required>
            <option value="">— Select a client —</option>
            {(clients || []).filter((c: any) => c.status !== 'deleted').map((c: any) => (
              <option key={c.client_id} value={c.client_id}>
                {c.name}{c.company ? ` — ${c.company}` : ''}
              </option>
            ))}
          </select>
          {selectedClient && (
            <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
              <span>{selectedClient.email}</span>
              {selectedClient.phone && <span>{selectedClient.phone}</span>}
              {selectedClient.company && <span className="text-neutral-600">{selectedClient.company}</span>}
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="p-5 rounded-xl bg-neutral-900/30 border border-neutral-800">
          <label className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-3 block">Project Details</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Project Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls}
                placeholder="e.g. Business Operations System" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls}>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Estimated Cost (GH₵)</label>
                <input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} className={inputCls}
                  placeholder="e.g. 8000" />
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls + ' min-h-[80px]'}
                placeholder="Brief project description and scope..." />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Estimated Completion</label>
              <input type="date" value={form.est_completion} onChange={e => setForm({ ...form, est_completion: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-700">
            Project will appear in the client's profile and SLA tracker
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('invoice')}
              className="px-4 py-2.5 text-sm text-neutral-400 hover:text-white border border-neutral-700 rounded-lg cursor-pointer transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4" /> Skip to Invoice
            </button>
            <button type="submit" disabled={busy || !form.client_id || !form.title} className={btnPrimary + ' flex items-center gap-2'}>
              <Plus className="w-4 h-4" /> {busy ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
