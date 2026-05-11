import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import DataTable from './DataTable'
import { UserPlus, X, Send } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'
const modalBg = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
const modalCard = 'bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl'
const btnPrimary = 'px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40'

// ─── Status Badge ────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    partial: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    received: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    open: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    inactive: 'bg-red-500/15 text-red-400 border-red-500/20',
    Inactive: 'bg-red-500/15 text-red-400 border-red-500/20',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
    interview: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    offered: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    completed: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  }
  const cls = colors[status] || 'bg-neutral-800 text-neutral-400 border-neutral-700'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{status}</span>
}

// ─── CLIENTS ─────────────────────────────────────────────
export function ClientsSection() {
  const { clients, loading } = useAdminStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })

  useEffect(() => { adminActions.loadClients() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await adminActions.createClient(form)
    if (ok) { setShowAdd(false); setForm({ name: '', email: '', phone: '', company: '' }) }
  }

  return (
    <>
      <DataTable title="Clients" subtitle="Manage your client accounts" loading={loading} data={clients}
        onAdd={() => setShowAdd(true)} addLabel="Add Client"
        columns={[
          { key: 'client_id', label: 'ID', width: '120px' },
          { key: 'name', label: 'Name', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'email', label: 'Email' },
          { key: 'company', label: 'Company' },
          { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
          { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
        ]}
        searchKeys={['name', 'email', 'company']}
      />
      {showAdd && (
        <div className={modalBg} onClick={() => setShowAdd(false)}>
          <div className={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Client</h3>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="Full name" required />
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} placeholder="Email" required />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} placeholder="Phone" />
              <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className={inputCls} placeholder="Company" />
              <button type="submit" className={btnPrimary}>Create Client</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// ─── PROJECTS ────────────────────────────────────────────
export function ProjectsSection() {
  const { projects, portfolio, loading } = useAdminStore()
  const [tab, setTab] = useState<'pipeline' | 'portfolio'>('portfolio')

  useEffect(() => { adminActions.loadProjects(); adminActions.loadPortfolio() }, [])

  if (tab === 'pipeline') {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Client Pipeline</button>
          <button onClick={() => setTab('portfolio')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">Portfolio ({portfolio.length})</button>
        </div>
        <DataTable title="Client Projects" subtitle="Active project pipeline and step management" loading={loading} data={projects}
          columns={[
            { key: 'project_id', label: 'ID', width: '120px' },
            { key: 'title', label: 'Title', render: (v) => <span className="text-white font-medium">{v}</span> },
            { key: 'client_name', label: 'Client' },
            { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
            { key: 'step', label: 'Step', render: (v) => <span className="text-[#00bfff] font-mono font-bold">{v}</span> },
            { key: 'estimated_cost', label: 'Cost', render: (v) => v ? `GH₵${Number(v).toLocaleString()}` : '—' },
            { key: 'balance', label: 'Balance', render: (v) => v ? `GH₵${Number(v).toLocaleString()}` : '—' },
          ]}
          searchKeys={['title', 'client_name', 'project_id']}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('pipeline')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">Client Pipeline ({projects.length})</button>
        <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Portfolio</button>
      </div>
      <DataTable title="Portfolio Projects" subtitle="Manage which projects appear on the public site" loading={loading} data={portfolio}
        columns={[
          { key: 'project_id', label: 'ID', width: '100px' },
          { key: 'title', label: 'Title', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'client_name', label: 'Client' },
          { key: 'category', label: 'Category' },
          { key: 'technologies', label: 'Tech' },
          { key: 'status', label: 'Visibility', render: (v) => <Badge status={v} /> },
          { key: 'order', label: 'Order' },
        ]}
        searchKeys={['title', 'client_name', 'category']}
        renderRowActions={(row) => (
          <div className="flex gap-2">
            {row.status === 'published' ? (
              <button onClick={() => adminActions.updatePortfolioStatus(row.project_id, 'draft')}
                className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer">Hide</button>
            ) : (
              <button onClick={() => adminActions.updatePortfolioStatus(row.project_id, 'published')}
                className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer">Publish</button>
            )}
          </div>
        )}
      />
    </div>
  )
}

// ─── INVOICES ────────────────────────────────────────────
export function InvoicesSection() {
  const { invoices, loading, activeInvoiceHTML } = useAdminStore()
  const [showPayment, setShowPayment] = useState<any>(null)
  const [payForm, setPayForm] = useState({ amount: '', method: 'MoMo', reference: '' })

  useEffect(() => { adminActions.loadInvoices() }, [])

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showPayment) return
    const ok = await adminActions.recordPayment({ invoice_id: showPayment.invoice_id, ...payForm, amount: Number(payForm.amount) })
    if (ok) { setShowPayment(null); setPayForm({ amount: '', method: 'MoMo', reference: '' }) }
  }

  return (
    <>
      <DataTable title="Invoices" subtitle="Invoice management and payment tracking" loading={loading} data={invoices}
        columns={[
          { key: 'invoice_id', label: 'Invoice', width: '140px', render: (v) => <span className="text-[#ff7a00] font-mono font-medium">{v}</span> },
          { key: 'client_name', label: 'Client', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'total', label: 'Total', render: (v) => <span className="font-bold text-white">GH₵{Number(v || 0).toLocaleString()}</span> },
          { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
          { key: 'due_date', label: 'Due', render: (v) => v || '—' },
          { key: 'pdf_url', label: 'PDF', render: (v) => v ? <a href={v} target="_blank" rel="noreferrer" className="text-[#00bfff] hover:underline text-xs">View</a> : '—' },
        ]}
        searchKeys={['invoice_id', 'client_name']}
        renderRowActions={(row) => (
          <div className="flex gap-2">
            {row.status !== 'paid' && (
              <button onClick={() => { setShowPayment(row); setPayForm({ amount: String(row.balance || row.total || ''), method: 'MoMo', reference: '' }) }}
                className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer">Record Payment</button>
            )}
          </div>
        )}
      />
      {showPayment && (
        <div className={modalBg} onClick={() => setShowPayment(null)}>
          <div className={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Record Payment — {showPayment.invoice_id}</h3>
              <button onClick={() => setShowPayment(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePay} className="space-y-3">
              <input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} className={inputCls} placeholder="Amount (GH₵)" required />
              <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})} className={inputCls}>
                <option>MoMo</option><option>Bank Transfer</option><option>Cash</option><option>Card</option>
              </select>
              <input value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})} className={inputCls} placeholder="Reference (optional)" />
              <button type="submit" className={btnPrimary}>Record Payment</button>
            </form>
          </div>
        </div>
      )}
      {activeInvoiceHTML && (
        <div className={modalBg} onClick={() => adminActions.setError(null)}>
          <div className="bg-white rounded-xl p-4 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: activeInvoiceHTML }} />
        </div>
      )}
    </>
  )
}

// ─── CAREERS ─────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  { key: 'cv_confirmation', label: 'Thank You for Application', desc: 'Confirm receipt of their application materials.', color: 'text-blue-400', icon: '📄' },
  { key: 'interview_selected', label: 'Selected for Interview', desc: 'Invite them with date/time options to choose from.', color: 'text-emerald-400', icon: '✅' },
  { key: 'not_selected', label: 'Not Selected (Next Step)', desc: 'They did not make it past the application stage.', color: 'text-red-400', icon: '❌' },
  { key: 'interview_thanks', label: 'Interview Thank You', desc: 'Thank them for attending the interview today.', color: 'text-sky-400', icon: '🤝' },
  { key: 'interview_confirmed', label: 'Interview Confirmed', desc: 'Confirm their slot with date, time, and meeting link.', color: 'text-teal-400', icon: '📅' },
  { key: 'role_offered', label: 'Selected for the Role', desc: 'Congratulations — they got the job!', color: 'text-amber-400', icon: '🏆' },
  { key: 'role_rejected', label: 'Not Selected (Final)', desc: 'Final rejection after interview stage.', color: 'text-rose-400', icon: '🚫' },
] as const

type CareersTab = 'listings' | 'applications' | 'emails'

const emptyListing = { title: '', type: 'Full-Time', location: '', salary_range: '', short_description: '', status: 'active', deadline: '' }

export function CareersSection() {
  const { jobs, applications, loading } = useAdminStore()
  const [tab, setTab] = useState<CareersTab>('listings')
  // Listing CRUD
  const [showListingModal, setShowListingModal] = useState(false)
  const [editingListing, setEditingListing] = useState<any>(null)
  const [listingForm, setListingForm] = useState({ ...emptyListing })
  // Manual Emails
  const [recipients, setRecipients] = useState([{ email: '', name: '' }])
  const [selectedTemplate, setSelectedTemplate] = useState('cv_confirmation')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)
  const [showAddApplicant, setShowAddApplicant] = useState(false)
  const [applicantForm, setApplicantForm] = useState({ name: '', email: '', phone: '', job_title: '', note: '' })
  const [emailRow, setEmailRow] = useState<any>(null)
  const [rowTemplate, setRowTemplate] = useState('cv_confirmation')
  const [rowPreviewHtml, setRowPreviewHtml] = useState('')
  const [rowSending, setRowSending] = useState(false)
  const [rowSent, setRowSent] = useState(false)
  // Dynamic extras for templates
  const [dateOptions, setDateOptions] = useState([''])
  const [confirmedDate, setConfirmedDate] = useState('')
  const [confirmedTime, setConfirmedTime] = useState('')
  const [meetingLink, setMeetingLink] = useState('')

  const buildExtras = (tpl: string) => {
    if (tpl === 'interview_selected') return { dateOptions: dateOptions.filter(d => d.trim()) }
    if (tpl === 'interview_confirmed') return { confirmedDate, confirmedTime, meetingLink }
    return {}
  }

  useEffect(() => { adminActions.loadJobs(); adminActions.loadApplications() }, [])

  const openCreate = () => { setEditingListing(null); setListingForm({ ...emptyListing }); setShowListingModal(true) }
  const openEdit = (row: any) => {
    setEditingListing(row)
    setListingForm({ title: row.title || '', type: row.type || 'Full-Time', location: row.location || '', salary_range: row.salary_range || '', short_description: row.short_description || '', status: row.status || 'active', deadline: row.deadline || '' })
    setShowListingModal(true)
  }
  const handleListingSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = editingListing
      ? await adminActions.updateJobListing({ job_id: editingListing.job_id, ...listingForm })
      : await adminActions.createJobListing(listingForm)
    if (ok) { setShowListingModal(false); setEditingListing(null) }
  }

  const handleAddApplicant = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await adminActions.createApplication(applicantForm)
    if (ok) { setShowAddApplicant(false); setApplicantForm({ name: '', email: '', phone: '', job_title: '', note: '' }) }
  }

  const openRowEmail = async (row: any) => {
    setEmailRow(row); setRowTemplate('cv_confirmation'); setRowSent(false)
    setDateOptions(['']); setConfirmedDate(''); setConfirmedTime(''); setMeetingLink('')
    const preview = await adminActions.previewApplicantEmail('cv_confirmation', row.name || 'Applicant')
    if (preview) setRowPreviewHtml(preview.html)
  }
  const changeRowTemplate = async (tpl: string) => {
    setRowTemplate(tpl)
    const preview = await adminActions.previewApplicantEmail(tpl, emailRow?.name || 'Applicant', buildExtras(tpl))
    if (preview) setRowPreviewHtml(preview.html)
  }
  const refreshRowPreview = async () => {
    const preview = await adminActions.previewApplicantEmail(rowTemplate, emailRow?.name || 'Applicant', buildExtras(rowTemplate))
    if (preview) setRowPreviewHtml(preview.html)
  }
  const handleRowSend = async () => {
    if (!emailRow?.email) return
    setRowSending(true)
    const result = await adminActions.sendApplicantEmail(rowTemplate, [{ email: emailRow.email, name: emailRow.name || '' }], buildExtras(rowTemplate))
    setRowSending(false)
    if (result) { setRowSent(true); setTimeout(() => { setEmailRow(null); setRowSent(false) }, 1800) }
  }

  const addRecipient = () => setRecipients([...recipients, { email: '', name: '' }])
  const removeRecipient = (i: number) => setRecipients(recipients.filter((_, idx) => idx !== i))
  const updateRecipient = (i: number, field: 'email' | 'name', val: string) => {
    const copy = [...recipients]; copy[i] = { ...copy[i], [field]: val }; setRecipients(copy)
  }

  const loadPreview = async () => {
    const name = recipients[0]?.name || 'Applicant'
    const result = await adminActions.previewApplicantEmail(selectedTemplate, name, buildExtras(selectedTemplate))
    if (result) { setPreviewHtml(result.html); setPreviewSubject(result.subject) }
  }
  useEffect(() => { if (tab === 'emails') loadPreview() }, [selectedTemplate, tab])

  const handleSendEmails = async () => {
    const valid = recipients.filter(r => r.email.trim())
    if (!valid.length) return
    setSending(true); setSendResult(null)
    const result = await adminActions.sendApplicantEmail(selectedTemplate, valid, buildExtras(selectedTemplate))
    setSending(false)
    if (result) setSendResult(result)
  }

  const tabBtn = (id: CareersTab, label: string, count?: number) => (
    <button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${tab === id ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-500 hover:text-white'}`}>
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  )

  // ── LISTINGS TAB ──
  if (tab === 'listings') return (
    <div>
      <div className="flex gap-2 mb-4">{tabBtn('listings', 'Listings')}{tabBtn('applications', 'Applications', applications.length)}{tabBtn('emails', 'Manual Emails')}</div>
      <DataTable title="Career Listings" subtitle="Manage open positions" loading={loading} data={jobs}
        onAdd={openCreate} addLabel="Add Listing"
        columns={[
          { key: 'job_id', label: 'ID', width: '100px' },
          { key: 'title', label: 'Title', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'type', label: 'Type' },
          { key: 'location', label: 'Location' },
          { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
          { key: 'deadline', label: 'Deadline' },
        ]}
        searchKeys={['title', 'type', 'location']}
        renderRowActions={(row) => (
          <div className="flex gap-3">
            <button onClick={() => openEdit(row)} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">Edit</button>
            <button onClick={() => adminActions.updateJobListing({ job_id: row.job_id, status: row.status === 'active' ? 'inactive' : 'active' })}
              className={`text-xs cursor-pointer transition-colors ${row.status === 'active' ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}>
              {row.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}
      />
      {showListingModal && (
        <div className={modalBg} onClick={() => setShowListingModal(false)}>
          <div className={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editingListing ? 'Edit Listing' : 'New Listing'}</h3>
              <button onClick={() => setShowListingModal(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleListingSave} className="space-y-3">
              <input value={listingForm.title} onChange={e => setListingForm({...listingForm, title: e.target.value})} className={inputCls} placeholder="Job title" required />
              <div className="grid grid-cols-2 gap-3">
                <select value={listingForm.type} onChange={e => setListingForm({...listingForm, type: e.target.value})} className={inputCls}>
                  <option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Internship</option>
                </select>
                <select value={listingForm.status} onChange={e => setListingForm({...listingForm, status: e.target.value})} className={inputCls}>
                  <option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option>
                </select>
              </div>
              <input value={listingForm.location} onChange={e => setListingForm({...listingForm, location: e.target.value})} className={inputCls} placeholder="Location" />
              <input value={listingForm.salary_range} onChange={e => setListingForm({...listingForm, salary_range: e.target.value})} className={inputCls} placeholder="Salary range (optional)" />
              <input type="date" value={listingForm.deadline} onChange={e => setListingForm({...listingForm, deadline: e.target.value})} className={inputCls} />
              <textarea value={listingForm.short_description} onChange={e => setListingForm({...listingForm, short_description: e.target.value})} className={`${inputCls} resize-none`} rows={3} placeholder="Short description" />
              <button type="submit" className={btnPrimary}>{editingListing ? 'Save Changes' : 'Create Listing'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  // ── APPLICATIONS TAB ──
  if (tab === 'applications') return (
    <div>
      <div className="flex gap-2 mb-4">{tabBtn('listings', 'Listings')}{tabBtn('applications', 'Applications', applications.length)}{tabBtn('emails', 'Manual Emails')}</div>
      <DataTable title="Applications" subtitle="Manage applicants and send communications" loading={loading} data={applications}
        onAdd={() => setShowAddApplicant(true)} addLabel="Add Applicant"
        columns={[
          { key: 'name', label: 'Applicant', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'email', label: 'Email' },
          { key: 'job_title', label: 'Position' },
          { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
          { key: 'has_cv', label: 'CV', render: (v) => v === true || v === 'TRUE' || v === 'Yes' ? '✓' : '—' },
          { key: 'has_audio', label: 'Audio', render: (v) => v === true || v === 'TRUE' || v === 'Yes' ? '✓' : '—' },
          { key: 'applied_at', label: 'Applied', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
        ]}
        searchKeys={['name', 'email', 'job_title']}
        renderRowActions={(row) => (
          <div className="flex gap-3">
            <button onClick={() => openRowEmail(row)} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">Email</button>
            <button onClick={() => { if (confirm(`Delete application from ${row.name}?`)) adminActions.deleteApplication(row._rowIndex) }}
              className="text-xs text-red-400 hover:text-red-300 cursor-pointer transition-colors">Delete</button>
          </div>
        )}
      />

      {/* Add Applicant Modal */}
      {showAddApplicant && (
        <div className={modalBg} onClick={() => setShowAddApplicant(false)}>
          <div className={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Applicant</h3>
              <button onClick={() => setShowAddApplicant(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddApplicant} className="space-y-3">
              <input value={applicantForm.name} onChange={e => setApplicantForm({...applicantForm, name: e.target.value})} className={inputCls} placeholder="Full name" required />
              <input type="email" value={applicantForm.email} onChange={e => setApplicantForm({...applicantForm, email: e.target.value})} className={inputCls} placeholder="Email" required />
              <input value={applicantForm.phone} onChange={e => setApplicantForm({...applicantForm, phone: e.target.value})} className={inputCls} placeholder="Phone (optional)" />
              <input value={applicantForm.job_title} onChange={e => setApplicantForm({...applicantForm, job_title: e.target.value})} className={inputCls} placeholder="Position applied for (optional)" />
              <textarea value={applicantForm.note} onChange={e => setApplicantForm({...applicantForm, note: e.target.value})} className={`${inputCls} resize-none`} rows={2} placeholder="Notes (optional)" />
              <button type="submit" className={btnPrimary}>Add Applicant</button>
            </form>
          </div>
        </div>
      )}

      {/* Per-Row Email Modal with Preview */}
      {emailRow && (
        <div className={modalBg} onClick={() => !rowSending && setEmailRow(null)}>
          <div className={`${modalCard} !max-w-3xl`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Send Email to {emailRow.name}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{emailRow.email}</p>
              </div>
              <button onClick={() => !rowSending && setEmailRow(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid md:grid-cols-[280px_1fr] gap-4">
              {/* Template selector */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {EMAIL_TEMPLATES.map(tpl => (
                  <button key={tpl.key} type="button" onClick={() => changeRowTemplate(tpl.key)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer text-xs ${
                      rowTemplate === tpl.key ? 'bg-[#00bfff]/10 border-[#00bfff]/40' : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span>{tpl.icon}</span>
                      <span className={`font-semibold ${rowTemplate === tpl.key ? 'text-white' : tpl.color}`}>{tpl.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              {/* Dynamic fields for interview templates */}
              {rowTemplate === 'interview_selected' && (
                <div className="space-y-2 mt-3">
                  <label className="text-xs text-neutral-500">Date/Time Options</label>
                  {dateOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={opt} onChange={e => { const c = [...dateOptions]; c[i] = e.target.value; setDateOptions(c) }} className={`${inputCls} text-xs`} placeholder={`e.g. Mon 19 May, 10:00 AM`} />
                      {dateOptions.length > 1 && <button onClick={() => setDateOptions(dateOptions.filter((_, idx) => idx !== i))} className="text-neutral-600 hover:text-red-400 cursor-pointer p-1"><X className="w-3 h-3" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setDateOptions([...dateOptions, ''])} className="text-[10px] text-[#00bfff] hover:text-white cursor-pointer">+ Add option</button>
                  <button onClick={refreshRowPreview} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer ml-3">Refresh Preview</button>
                </div>
              )}
              {rowTemplate === 'interview_confirmed' && (
                <div className="space-y-2 mt-3">
                  <label className="text-xs text-neutral-500">Confirmed Details</label>
                  <input value={confirmedDate} onChange={e => setConfirmedDate(e.target.value)} className={`${inputCls} text-xs`} placeholder="Date (e.g. Monday, 19 May 2026)" />
                  <input value={confirmedTime} onChange={e => setConfirmedTime(e.target.value)} className={`${inputCls} text-xs`} placeholder="Time (e.g. 10:00 AM GMT)" />
                  <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className={`${inputCls} text-xs`} placeholder="Meeting link (optional)" />
                  <button onClick={refreshRowPreview} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
                </div>
              )}
              {/* Preview */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 overflow-hidden" style={{ height: '400px' }}>
                {rowPreviewHtml ? (
                  <iframe srcDoc={rowPreviewHtml} className="w-full h-full border-0" sandbox="" title="Email Preview" />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-600 text-sm">Loading preview...</div>
                )}
              </div>
            </div>
            {/* Send */}
            <div className="mt-4">
              {rowSent ? (
                <div className="flex items-center justify-center gap-2 py-2.5 text-emerald-400 font-bold text-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Email Sent Successfully
                </div>
              ) : (
                <button onClick={handleRowSend} disabled={rowSending}
                  className={`${btnPrimary} w-full flex items-center justify-center gap-2`}>
                  {rowSending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Email</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── MANUAL EMAILS TAB ──
  return (
    <div>
      <div className="flex gap-2 mb-4">{tabBtn('listings', 'Listings')}{tabBtn('applications', 'Applications', applications.length)}{tabBtn('emails', 'Manual Emails')}</div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* Left: compose */}
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Manual Emails</h2>
            <p className="text-sm text-neutral-500">Compose and send templated emails to applicants</p>
          </div>

          {/* Recipients */}
          <div>
            <label className="text-xs text-neutral-500 mb-2 block">Recipients</label>
            <div className="space-y-2">
              {recipients.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={r.name} onChange={e => updateRecipient(i, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                  <input type="email" value={r.email} onChange={e => updateRecipient(i, 'email', e.target.value)} className={inputCls} placeholder="email@example.com" />
                  {recipients.length > 1 && (
                    <button onClick={() => removeRecipient(i)} className="text-neutral-600 hover:text-red-400 cursor-pointer p-1"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addRecipient} className="mt-2 text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">+ Add another recipient</button>
          </div>

          {/* Template selector */}
          <div>
            <label className="text-xs text-neutral-500 mb-2 block">Email Template</label>
            <div className="grid grid-cols-1 gap-2">
              {EMAIL_TEMPLATES.map(tpl => (
                <button key={tpl.key} type="button" onClick={() => setSelectedTemplate(tpl.key)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedTemplate === tpl.key
                      ? 'bg-[#00bfff]/10 border-[#00bfff]/40 shadow-[0_0_12px_rgba(0,191,255,0.15)]'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{tpl.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${selectedTemplate === tpl.key ? 'text-white' : tpl.color}`}>{tpl.label}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{tpl.desc}</div>
                    </div>
                    {selectedTemplate === tpl.key && <div className="w-4 h-4 rounded-full bg-[#00bfff] flex items-center justify-center flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Send */}
          {sendResult ? (
            <div className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm ${sendResult.failed === 0 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              {sendResult.sent} sent{sendResult.failed > 0 ? `, ${sendResult.failed} failed` : ''}
            </div>
          ) : (
            <button onClick={handleSendEmails} disabled={sending || !recipients.some(r => r.email.trim())}
              className={`${btnPrimary} w-full flex items-center justify-center gap-2`}>
              {sending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send to {recipients.filter(r => r.email.trim()).length} recipient{recipients.filter(r => r.email.trim()).length !== 1 ? 's' : ''}</>}
            </button>
          )}
        </div>

        {/* Right: preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Email Preview</h3>
            {previewSubject && <span className="text-xs text-neutral-600 truncate max-w-[250px]">Subject: {previewSubject}</span>}
          </div>

          {/* Dynamic fields for interview templates */}
          {selectedTemplate === 'interview_selected' && (
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Date/Time Options for Applicant</label>
              <div className="space-y-2">
                {dateOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={opt} onChange={e => { const c = [...dateOptions]; c[i] = e.target.value; setDateOptions(c) }} className={inputCls} placeholder={`e.g. Mon 19 May, 10:00 AM`} />
                    {dateOptions.length > 1 && <button onClick={() => setDateOptions(dateOptions.filter((_, idx) => idx !== i))} className="text-neutral-600 hover:text-red-400 cursor-pointer p-1"><X className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setDateOptions([...dateOptions, ''])} className="text-xs text-[#00bfff] hover:text-white cursor-pointer">+ Add another option</button>
                <button onClick={loadPreview} className="text-xs text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
              </div>
            </div>
          )}
          {selectedTemplate === 'interview_confirmed' && (
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Confirmed Interview Details</label>
              <div className="space-y-2">
                <input value={confirmedDate} onChange={e => setConfirmedDate(e.target.value)} className={inputCls} placeholder="Date (e.g. Monday, 19 May 2026)" />
                <input value={confirmedTime} onChange={e => setConfirmedTime(e.target.value)} className={inputCls} placeholder="Time (e.g. 10:00 AM GMT)" />
                <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className={inputCls} placeholder="Meeting link (optional — leave blank for in-person)" />
              </div>
              <button onClick={loadPreview} className="mt-2 text-xs text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
            </div>
          )}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden" style={{ height: '600px' }}>
            {previewHtml ? (
              <iframe srcDoc={previewHtml} className="w-full h-full border-0" sandbox="" title="Email Preview" />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-600 text-sm">Select a template to preview</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── REFERRALS ───────────────────────────────────────────
export function ReferralsSection() {
  const { referrers, referrals, loading } = useAdminStore()
  const [tab, setTab] = useState<'referrers' | 'referrals'>('referrers')

  useEffect(() => { adminActions.loadReferrals() }, [])

  if (tab === 'referrals') {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('referrers')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">Referrers</button>
          <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Referrals</button>
        </div>
        <DataTable title="Referrals" subtitle="Referral submissions and pipeline" loading={loading} data={referrals}
          columns={[
            { key: 'referral_id', label: 'ID', width: '120px' },
            { key: 'client_name', label: 'Referred Client', render: (v) => <span className="text-white font-medium">{v}</span> },
            { key: 'client_email', label: 'Email' },
            { key: 'business_type', label: 'Business' },
            { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
            { key: 'payout_amount', label: 'Payout', render: (v) => v ? `GH₵${Number(v).toLocaleString()}` : '—' },
          ]}
          searchKeys={['client_name', 'client_email']}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Referrers</button>
        <button onClick={() => setTab('referrals')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">Referrals ({referrals.length})</button>
      </div>
      <DataTable title="Referrers" subtitle="Partner referral network" loading={loading} data={referrers}
        columns={[
          { key: 'referrer_id', label: 'ID', width: '120px' },
          { key: 'name', label: 'Name', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
          { key: 'total_earned', label: 'Earned', render: (v) => v ? `GH₵${Number(v).toLocaleString()}` : 'GH₵0' },
        ]}
        searchKeys={['name', 'email']}
      />
    </div>
  )
}

// ─── USERS ───────────────────────────────────────────────
export function UsersSection() {
  const { users, loading } = useAdminStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Staff' })

  useEffect(() => { adminActions.loadUsers() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await adminActions.addUser(form)
    if (ok) { setShowAdd(false); setForm({ name: '', email: '', phone: '', role: 'Staff' }) }
  }

  return (
    <>
      <DataTable title="Users" subtitle="System users and access control" loading={loading} data={users}
        onAdd={() => setShowAdd(true)} addLabel="Add User"
        columns={[
          { key: 'id', label: 'ID', width: '120px' },
          { key: 'name', label: 'Name', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role', render: (v) => {
            const c = v === 'Godmode' ? 'text-[#ff7a00]' : v === 'AssistantGodmode' ? 'text-purple-400' : v === 'Staff' ? 'text-[#00bfff]' : 'text-neutral-400'
            return <span className={`font-bold ${c}`}>{v}</span>
          }},
          { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
          { key: 'last_login', label: 'Last Login', render: (v) => v ? new Date(v).toLocaleDateString() : 'Never' },
        ]}
        searchKeys={['name', 'email', 'role']}
        renderRowActions={(row) => (
          row.role !== 'Godmode' && row.status === 'Active' ? (
            <button onClick={() => { if (confirm(`Deactivate ${row.name}?`)) adminActions.deactivateUser(row.id) }}
              className="text-xs text-red-400 hover:text-red-300 cursor-pointer">Deactivate</button>
          ) : null
        )}
      />
      {showAdd && (
        <div className={modalBg} onClick={() => setShowAdd(false)}>
          <div className={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#00bfff]" />Add User</h3>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="Full name" required />
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} placeholder="Email" required />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} placeholder="Phone (optional)" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className={inputCls}>
                <option>Staff</option><option>Client</option><option>Referrer</option><option>AssistantGodmode</option><option>Godmode</option>
              </select>
              <p className="text-xs text-neutral-600">A temporary password will be emailed to the user.</p>
              <button type="submit" className={btnPrimary}>Create User</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// ─── LOGS ────────────────────────────────────────────────
export function LogsSection() {
  const { logs, loading } = useAdminStore()
  useEffect(() => { adminActions.loadLogs() }, [])

  return (
    <DataTable title="Activity Logs" subtitle="System-wide audit trail" loading={loading} data={logs}
      columns={[
        { key: 'timestamp', label: 'Time', width: '150px', render: (v) => v ? new Date(v).toLocaleString() : '—' },
        { key: 'user_name', label: 'User', render: (v) => <span className="text-white font-medium">{v || 'System'}</span> },
        { key: 'action', label: 'Action', render: (v) => <span className="font-mono text-xs text-[#00bfff]">{v}</span> },
        { key: 'detail', label: 'Details' },
      ]}
      searchKeys={['user_name', 'action', 'detail']}
    />
  )
}

// ─── SLA ─────────────────────────────────────────────────
export function SLASection() {
  const { slaStatuses, slaCosts, loading } = useAdminStore()
  const [tab, setTab] = useState<'status' | 'costs'>('status')

  useEffect(() => { adminActions.loadSLA(); adminActions.loadSlaCosts() }, [])

  if (tab === 'costs') {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('status')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">SLA Status</button>
          <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Costs</button>
        </div>
        <DataTable title="SLA Costs" subtitle="Financial impact of SLA breaches" loading={loading} data={slaCosts}
          columns={[
            { key: 'project_id', label: 'Project', width: '120px' },
            { key: 'step', label: 'Step' },
            { key: 'overdue_minutes', label: 'Overdue', render: (v) => `${Math.round(v / 60)}h` },
            { key: 'total_cost', label: 'Cost', render: (v) => <span className="text-red-400 font-bold">GH₵{Number(v || 0).toFixed(2)}</span> },
            { key: 'breach_date', label: 'Breach Date' },
          ]}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">SLA Status</button>
        <button onClick={() => setTab('costs')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">Costs ({slaCosts.length})</button>
      </div>
      <DataTable title="SLA Status" subtitle="Real-time project SLA monitoring" loading={loading} data={slaStatuses}
        columns={[
          { key: 'title', label: 'Project', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'step_name', label: 'Step' },
          { key: 'elapsed', label: 'Elapsed', render: (v) => `${Math.round(v / 60)}h` },
          { key: 'deadline', label: 'Deadline', render: (v) => `${Math.round(v / 60)}h` },
          { key: 'breached', label: 'Status', render: (v) => v ? <Badge status="breached" /> : <Badge status="active" /> },
        ]}
        searchKeys={['title', 'step_name']}
        renderRowActions={(row) => (
          !row.snoozed ? (
            <button onClick={() => adminActions.snoozeSla(row.project_id, 60)}
              className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer">Snooze 1h</button>
          ) : <span className="text-xs text-neutral-600">Snoozed</span>
        )}
      />
    </div>
  )
}
