import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import DataTable from './DataTable'
import { UserPlus, X } from 'lucide-react'

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
  const { projects, loading } = useAdminStore()
  useEffect(() => { adminActions.loadProjects() }, [])

  return (
    <DataTable title="Projects" subtitle="Project pipeline and step management" loading={loading} data={projects}
      columns={[
        { key: 'project_id', label: 'ID', width: '120px' },
        { key: 'title', label: 'Title', render: (v) => <span className="text-white font-medium">{v}</span> },
        { key: 'client_id', label: 'Client' },
        { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
        { key: 'step', label: 'Step', render: (v) => <span className="text-[#00bfff] font-mono font-bold">{v}</span> },
        { key: 'estimated_cost', label: 'Cost', render: (v) => v ? `GH₵${Number(v).toLocaleString()}` : '—' },
        { key: 'balance', label: 'Balance', render: (v) => v ? `GH₵${Number(v).toLocaleString()}` : '—' },
      ]}
      searchKeys={['title', 'client_id', 'project_id']}
    />
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

// ─── JOBS ────────────────────────────────────────────────
export function JobsSection() {
  const { jobs, applications, loading } = useAdminStore()
  const [tab, setTab] = useState<'listings' | 'applications'>('listings')

  useEffect(() => { adminActions.loadJobs(); adminActions.loadApplications() }, [])

  if (tab === 'applications') {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('listings')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">Listings</button>
          <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Applications</button>
        </div>
        <DataTable title="Job Applications" subtitle="All incoming applications" loading={loading} data={applications}
          columns={[
            { key: 'name', label: 'Applicant', render: (v) => <span className="text-white font-medium">{v}</span> },
            { key: 'email', label: 'Email' },
            { key: 'job_title', label: 'Position' },
            { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
            { key: 'has_cv', label: 'CV', render: (v) => v === true || v === 'TRUE' ? '✓' : '—' },
            { key: 'has_audio', label: 'Audio', render: (v) => v === true || v === 'TRUE' ? '✓' : '—' },
            { key: 'applied_at', label: 'Applied', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
          ]}
          searchKeys={['name', 'email', 'job_title']}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Listings</button>
        <button onClick={() => setTab('applications')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">Applications ({applications.length})</button>
      </div>
      <DataTable title="Job Listings" subtitle="Manage open positions" loading={loading} data={jobs}
        columns={[
          { key: 'job_id', label: 'ID', width: '100px' },
          { key: 'title', label: 'Title', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'type', label: 'Type' },
          { key: 'location', label: 'Location' },
          { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
          { key: 'deadline', label: 'Deadline' },
        ]}
        searchKeys={['title', 'type', 'location']}
      />
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
