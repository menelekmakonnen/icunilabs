import { useEffect, useState, useRef, useCallback } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import DataTable from './DataTable'
import RichEditor from './RichEditor'
import LivePreview from './LivePreview'
import { UserPlus, X, Send, ArrowLeft } from 'lucide-react'
import { personas } from '../../data/personaData'
import { portfolioProjects } from '../../data/portfolioData'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'
const modalBg = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
const modalCard = 'bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl'
const btnPrimary = 'px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40'

const CLIENT_SEGMENTS = [
  { id: 'all', label: 'All Clients', color: '#ffffff' },
  ...personas.map(p => ({ id: p.id, label: p.title.replace(/^The /, ''), color: p.accentColor }))
]

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
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', buyer_profile: '' })
  const [segment, setSegment] = useState('all')

  useEffect(() => { adminActions.loadClients() }, [])

  const filtered = segment === 'all' ? clients : clients.filter((c: any) => c.buyer_profile === segment)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await adminActions.createClient(form)
    if (ok) { setShowAdd(false); setForm({ name: '', email: '', phone: '', company: '', buyer_profile: '' }) }
  }

  return (
    <div className="flex gap-6">
      {/* Left sidebar tabs */}
      <div className="w-48 flex-shrink-0 space-y-1">
        {CLIENT_SEGMENTS.map(seg => (
          <button key={seg.id} onClick={() => setSegment(seg.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
              segment === seg.id ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-500 hover:text-white hover:bg-neutral-800/30'
            }`}
            style={segment === seg.id ? { borderLeft: `3px solid ${seg.color}` } : { borderLeft: '3px solid transparent' }}>
            <div className="flex items-center justify-between">
              <span className="truncate">{seg.label}</span>
              {seg.id !== 'all' && <span className="text-xs text-neutral-600 ml-1">({clients.filter((c: any) => c.buyer_profile === seg.id).length})</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 min-w-0">
        <DataTable title="Clients" subtitle={segment === 'all' ? 'Manage your client accounts' : `Clients in the "${CLIENT_SEGMENTS.find(s => s.id === segment)?.label}" segment`} loading={loading} data={filtered}
          onAdd={() => setShowAdd(true)} addLabel="Add Client"
          columns={[
            { key: 'client_id', label: 'ID', width: '120px' },
            { key: 'name', label: 'Name', render: (v) => <span className="text-white font-medium">{v}</span> },
            { key: 'email', label: 'Email' },
            { key: 'company', label: 'Company' },
            { key: 'buyer_profile', label: 'Segment', render: (v) => {
              const seg = CLIENT_SEGMENTS.find(s => s.id === v)
              return seg ? <span style={{ color: seg.color }} className="text-xs font-medium">{seg.label}</span> : <span className="text-neutral-600 text-xs">Unassigned</span>
            }},
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
                <select value={form.buyer_profile} onChange={e => setForm({...form, buyer_profile: e.target.value})} className={inputCls}>
                  <option value="">— Select buyer profile —</option>
                  {personas.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <button type="submit" className={btnPrimary}>Create Client</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PROJECTS ────────────────────────────────────────────
// Static portfolio data mapped to admin table format — includes all rich fields
const buildPortfolioRows = () => portfolioProjects.map((p, i) => ({
  project_id: p.id,
  title: p.title,
  subtitle: p.subtitle,
  description: p.description,
  category: p.tags[0] || '',
  tags: p.tags.join(', '),
  status: 'published',
  order: i + 1,
  tier: p.tier || 'active',
  imageUrl: p.imageUrl || '',
  clientProblem: p.clientProblem || '',
  solution: p.solution || '',
  businessImpact: p.businessImpact || '',
  expertDeepDive: p.expertDeepDive || '',
  githubUrl: p.githubUrl || '',
  projectUrl: p.projectUrl || '',
  projectStatus: p.status || '',
}))

export function ProjectsSection() {
  const { projects, loading } = useAdminStore()
  const [tab, setTab] = useState<'pipeline' | 'portfolio'>('portfolio')
  const [portfolioData, setPortfolioData] = useState(buildPortfolioRows)
  const [editProject, setEditProject] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const [projectEditorTab, setProjectEditorTab] = useState<'overview' | 'content' | 'media'>('overview')

  useEffect(() => { adminActions.loadProjects() }, [])

  const openProjectEdit = (row: any) => {
    setEditProject(row)
    setEditForm({ ...row })
    setProjectEditorTab('overview')
  }

  const handleProjectSave = () => {
    if (!editForm || !editProject) return
    setPortfolioData(prev => prev.map(p => p.project_id === editProject.project_id ? { ...p, ...editForm } : p))
    setEditProject(null)
    setEditForm(null)
  }

  const updateField = (field: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }))
  }

  // Full-screen Project Editor
  if (editProject && editForm) {
    return (
      <div className="-m-6 flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between px-6 py-3 bg-neutral-900/50 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditProject(null); setEditForm(null) }} className="text-neutral-500 hover:text-white cursor-pointer transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white">{editForm.title}</h2>
              <p className="text-[10px] text-neutral-600">{editForm.project_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-600 mr-2">Auto-saves to preview</span>
            <button onClick={handleProjectSave} className={`${btnPrimary} text-xs px-4 py-1.5`}>Save Changes</button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[55%] overflow-y-auto border-r border-neutral-800 p-6 space-y-4">
            <div className="flex gap-1 mb-4">
              {(['overview', 'content', 'media'] as const).map(id => (
                <button key={id} onClick={() => setProjectEditorTab(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all capitalize ${projectEditorTab === id ? 'bg-[#00bfff]/10 text-[#00bfff] font-medium' : 'text-neutral-500 hover:text-white'}`}>
                  {id}
                </button>
              ))}
            </div>
            {projectEditorTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-neutral-500 mb-1 block">Title</label><input value={editForm.title} onChange={e => updateField('title', e.target.value)} className={inputCls} /></div>
                  <div><label className="text-xs text-neutral-500 mb-1 block">Subtitle</label><input value={editForm.subtitle} onChange={e => updateField('subtitle', e.target.value)} className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs text-neutral-500 mb-1 block">Tier</label><select value={editForm.tier} onChange={e => updateField('tier', e.target.value)} className={inputCls}><option value="flagship">Flagship</option><option value="production">Production</option><option value="active">Active</option><option value="spec">Spec</option></select></div>
                  <div><label className="text-xs text-neutral-500 mb-1 block">Visibility</label><select value={editForm.status} onChange={e => updateField('status', e.target.value)} className={inputCls}><option value="published">Published</option><option value="draft">Draft</option></select></div>
                  <div><label className="text-xs text-neutral-500 mb-1 block">Project Status</label><input value={editForm.projectStatus} onChange={e => updateField('projectStatus', e.target.value)} className={inputCls} placeholder="e.g. Production v2.1.0" /></div>
                </div>
                <div><label className="text-xs text-neutral-500 mb-1 block">Tags <span className="text-neutral-600">(comma-separated)</span></label><input value={editForm.tags} onChange={e => updateField('tags', e.target.value)} className={inputCls} /></div>
                <RichEditor label="Description" hint="Short project summary" value={editForm.description} onChange={html => updateField('description', html)} placeholder="A brief overview..." minHeight="120px" />
              </div>
            )}
            {projectEditorTab === 'content' && (
              <div className="space-y-6">
                <RichEditor label="Client Problem" hint="What challenge did the client face?" value={editForm.clientProblem} onChange={html => updateField('clientProblem', html)} placeholder="Describe the problem..." minHeight="180px" />
                <RichEditor label="Solution" hint="How we solved it" value={editForm.solution} onChange={html => updateField('solution', html)} placeholder="Describe the solution..." minHeight="180px" />
                <RichEditor label="Business Impact" hint="Measurable outcomes and ROI" value={editForm.businessImpact} onChange={html => updateField('businessImpact', html)} placeholder="Quantify the impact..." minHeight="180px" />
                <RichEditor label="Expert Deep Dive" hint="Technical architecture details" value={editForm.expertDeepDive} onChange={html => updateField('expertDeepDive', html)} placeholder="Deep technical details..." minHeight="180px" />
              </div>
            )}
            {projectEditorTab === 'media' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Cover Image URL</label>
                  <input value={editForm.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} className={inputCls} />
                  {editForm.imageUrl && <div className="mt-2 rounded-lg overflow-hidden border border-neutral-800 max-h-40"><img src={editForm.imageUrl} alt="Cover" className="w-full h-40 object-cover" onError={e => (e.currentTarget.style.display = 'none')} /></div>}
                </div>
                <div><label className="text-xs text-neutral-500 mb-1 block">Live URL</label><input value={editForm.projectUrl} onChange={e => updateField('projectUrl', e.target.value)} className={inputCls} placeholder="https://project.icuni.org" /></div>
                <div><label className="text-xs text-neutral-500 mb-1 block">GitHub URL</label><input value={editForm.githubUrl} onChange={e => updateField('githubUrl', e.target.value)} className={inputCls} placeholder="https://github.com/..." /></div>
              </div>
            )}
          </div>
          <div className="w-[45%] flex flex-col">
            <LivePreview mode="project" data={editForm as any} />
          </div>
        </div>
      </div>
    )
  }

  if (tab === 'pipeline') {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Client Pipeline</button>
          <button onClick={() => setTab('portfolio')} className="px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer">Portfolio ({portfolioData.length})</button>
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
        <button className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white font-medium">Portfolio ({portfolioData.length})</button>
      </div>
      <DataTable title="Portfolio Projects" subtitle={`${portfolioData.length} projects from the public portfolio`} loading={false} data={portfolioData}
        columns={[
          { key: 'project_id', label: 'ID', width: '140px' },
          { key: 'title', label: 'Title', render: (v) => <span className="text-white font-medium">{v}</span> },
          { key: 'subtitle', label: 'Subtitle' },
          { key: 'category', label: 'Category' },
          { key: 'tier', label: 'Tier', render: (v) => {
            const colors: Record<string, string> = { flagship: 'text-[#ff7a00]', production: 'text-emerald-400', active: 'text-[#00bfff]', spec: 'text-neutral-500' }
            return <span className={`text-xs font-bold uppercase ${colors[v] || 'text-neutral-500'}`}>{v}</span>
          }},
          { key: 'status', label: 'Visibility', render: (v) => <Badge status={v} /> },
          { key: 'order', label: '#', width: '50px' },
        ]}
        searchKeys={['title', 'subtitle', 'category', 'tags']}
        renderRowActions={(row) => (
          <div className="flex gap-3">
            <button onClick={() => openProjectEdit(row)} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">Edit</button>
            {row.projectUrl && <a href={row.projectUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-500 hover:text-white transition-colors">View</a>}
          </div>
        )}
      />
    </div>
  )
}




// ─── INVOICES ────────────────────────────────────────────
import InvoiceBuilder from './InvoiceBuilder'

type InvoiceTab = 'list' | 'builder'

export function InvoicesSection() {
  const { invoices, loading, activeInvoiceHTML, user } = useAdminStore()
  const [showPayment, setShowPayment] = useState<any>(null)
  const [payForm, setPayForm] = useState({ amount: '', method: 'MoMo', reference: '' })
  const isGodmode = user?.role?.toLowerCase() === 'godmode'
  const [invTab, setInvTab] = useState<InvoiceTab>('list')

  useEffect(() => { adminActions.loadInvoices() }, [])

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showPayment) return
    const ok = await adminActions.recordPayment({ invoice_id: showPayment.invoice_id, ...payForm, amount: Number(payForm.amount) })
    if (ok) { setShowPayment(null); setPayForm({ amount: '', method: 'MoMo', reference: '' }) }
  }

  return (
    <>
      {/* Tab switcher — only show if godmode */}
      {isGodmode && (
        <div className="flex items-center gap-1 mb-4 bg-neutral-900/50 border border-neutral-800 rounded-lg p-1 w-fit">
          {([['list', 'Invoices'], ['builder', 'Invoice Builder']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setInvTab(k)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${invTab === k ? 'bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/30' : 'text-neutral-500 hover:text-neutral-300'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {invTab === 'builder' && isGodmode ? (
        <InvoiceBuilder />
      ) : (
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
  { key: 'interview_confirmed', label: 'Interview Confirmed', desc: 'Confirm their slot with date, time, and meeting link.', color: 'text-teal-400', icon: 'C' },
  { key: 'trial_invitation', label: 'Paid Trial Invitation', desc: 'Invite to a 1-week paid working trial with briefing.', color: 'text-[#ff7a00]', icon: 'T' },
  { key: 'role_offered', label: 'Selected for the Role', desc: 'Congratulations - they got the job!', color: 'text-amber-400', icon: 'O' },
  { key: 'role_rejected', label: 'Not Selected (Final)', desc: 'Final rejection after interview stage.', color: 'text-rose-400', icon: '🚫' },
  { key: 'custom', label: 'Custom Email', desc: 'Write your own branded email from scratch.', color: 'text-violet-400', icon: '✏️' },
] as const

type CareersTab = 'listings' | 'applications' | 'emails'

const emptyListing = { title: '', type: 'Full-Time', location: '', salary_range: '', short_description: '', full_description: '', requirements: '', benefits: '', perks: '', hero_image: '', flyer_image: '', apply_email: 'jobs@icuni.org', status: 'active', deadline: '' }

// Static job listings matching the hardcoded public data in JobsPage.tsx
const STATIC_JOBS = [{
  job_id: 'ops-assistant-001',
  title: 'Operations Assistant',
  type: 'Full-Time',
  location: 'Accra, Ghana',
  salary_range: 'GH\u20B52,500 \u2013 2,950/mo + commission',
  short_description: 'Keep our client pipeline moving, coordinate referral partners, and grow with a tech company building real systems for real businesses.',
  full_description: 'We build custom operations systems for businesses across Ghana and beyond.\nWe help companies replace spreadsheets, WhatsApp chaos, and manual processes with software built for how they actually work.\nWe\u2019re growing fast and need someone sharp, organized, and persistent to keep things moving behind the scenes.\nAs Ops Assistant, you\u2019ll manage the space between building and closing \u2014 scheduling, follow-ups, pipeline tracking, payment chasing, referral coordination \u2014 you name it.\nThis is NOT a desk-and-wait role. You\u2019ll be on calls daily with business owners and decision-makers.\nYou\u2019ll send emails, update our CRM, and make sure every lead gets the attention it deserves.\nYou\u2019ll work directly with the founder and see how we acquire clients, deliver projects, and scale. Full visibility. Real impact.\nBasically \u2014 if you\u2019re the type who follows up without being reminded, loves being on top of things, and wants to grow inside a tech company building the future of business ops in Africa\u2026 we want to hear from you.',
  requirements: 'Follows up without being reminded, persistent and proactive\nStrong written and verbal communication in English\nComfortable making cold and warm calls to business owners\nHighly organized, tracks tasks in systems not from memory\nFamiliar with Google Workspace (Sheets, Docs, Gmail, Calendar)\nBased in Accra, Ghana\nAvailable to start ASAP',
  benefits: 'GH\u20B52,500 \u2013 GH\u20B52,950 monthly base (Level 1 Compensation)\nCommission on every paid project the company delivers\nUp to 10% commission on deals you directly bring in\nDirect mentorship from the founder\nReal experience inside a growing tech company\nClear growth path as the company scales',
  perks: 'Commission on every project\nReal tech industry experience\nGrowth trajectory',
  hero_image: '/ops-assistant-hero.png',
  flyer_image: '/ops-assistant-flyer.jpg',
  apply_email: 'jobs@icuni.org',
  status: 'active',
  deadline: '2026-05-18',
  _source: 'static',
}]

export function CareersSection() {
  const { jobs: apiJobs, applications, loading } = useAdminStore()
  // Merge: prefer API data, fall back to static if API returns empty
  const jobs = apiJobs.length > 0 ? apiJobs : STATIC_JOBS
  const [tab, setTab] = useState<CareersTab>('listings')
  // Listing CRUD
  const [showListingModal, setShowListingModal] = useState(false)
  const [editingListing, setEditingListing] = useState<any>(null)
  const [listingForm, setListingForm] = useState({ ...emptyListing })
  const [listingEditorTab, setListingEditorTab] = useState<'details' | 'description' | 'requirements' | 'media'>('details')
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
  const [emailEdited, setEmailEdited] = useState(false)
  const emailIframeRef = useRef<HTMLIFrameElement>(null)
  const [rowSending, setRowSending] = useState(false)
  const [rowSent, setRowSent] = useState(false)
  // Batch selection
  const [selectedApplicants, setSelectedApplicants] = useState<Set<number>>(new Set())
  const [showBatchEmail, setShowBatchEmail] = useState(false)
  const [batchTemplate, setBatchTemplate] = useState('cv_confirmation')
  const [batchPreviewHtml, setBatchPreviewHtml] = useState('')
  const [batchSending, setBatchSending] = useState(false)
  const [batchResult, setBatchResult] = useState<{ sent: number; failed: number } | null>(null)
  // Custom email fields
  const [customSubject, setCustomSubject] = useState('A Message from ICUNI Labs')
  const [customTitle, setCustomTitle] = useState('Hello from ICUNI Labs')
  const [customBody, setCustomBody] = useState('')
  const [customCtaText, setCustomCtaText] = useState('')
  const [customCtaLink, setCustomCtaLink] = useState('')
  // Dynamic extras for templates
  const [dateOptions, setDateOptions] = useState<{ date: string; time: string }[]>([{ date: '', time: '' }])
  const [confirmedDate, setConfirmedDate] = useState('')
  const [confirmedTime, setConfirmedTime] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [trialWeeklyRate, setTrialWeeklyRate] = useState('700')

  const fmtDate = (d: string) => { if (!d) return ''; try { return new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) } catch { return d } }
  const fmtTime = (t: string) => { if (!t) return ''; const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}` }

  const buildExtras = (tpl: string) => {
    if (tpl === 'interview_selected') {
      return { dateOptions: dateOptions.filter(o => o.date || o.time).map(o => [fmtDate(o.date), fmtTime(o.time)].filter(Boolean).join(' at ')) }
    }
    if (tpl === 'interview_confirmed') return { confirmedDate: fmtDate(confirmedDate), confirmedTime: fmtTime(confirmedTime), meetingLink }
    if (tpl === 'trial_invitation') return { weeklyRate: trialWeeklyRate }
    if (tpl === 'custom') return { subject: customSubject, title: customTitle, body: customBody, ctaText: customCtaText, ctaLink: customCtaLink }
    return {}
  }

  useEffect(() => { adminActions.loadJobs(); adminActions.loadApplications() }, [])

  const openCreate = () => { setEditingListing(null); setListingForm({ ...emptyListing }); setShowListingModal(true) }
  const openEdit = (row: any) => {
    setEditingListing(row)
    setListingForm({
      title: row.title || '', type: row.type || 'Full-Time', location: row.location || '',
      salary_range: row.salary_range || '', short_description: row.short_description || '',
      full_description: row.full_description || '', requirements: row.requirements || '',
      benefits: row.benefits || '', perks: row.perks || '',
      hero_image: row.hero_image || '', flyer_image: row.flyer_image || '',
      apply_email: row.apply_email || 'jobs@icuni.org',
      status: row.status || 'active', deadline: row.deadline || '',
    })
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
    setEmailRow(row); setRowTemplate('cv_confirmation'); setRowSent(false); setEmailEdited(false)
    setDateOptions([{ date: '', time: '' }]); setConfirmedDate(''); setConfirmedTime(''); setMeetingLink('')
    const preview = await adminActions.previewApplicantEmail('cv_confirmation', row.name || 'Applicant')
    if (preview) setRowPreviewHtml(preview.html)
  }
  const changeRowTemplate = async (tpl: string) => {
    setRowTemplate(tpl); setEmailEdited(false)
    const preview = await adminActions.previewApplicantEmail(tpl, emailRow?.name || 'Applicant', buildExtras(tpl))
    if (preview) setRowPreviewHtml(preview.html)
  }
  const refreshRowPreview = async () => {
    setEmailEdited(false)
    const preview = await adminActions.previewApplicantEmail(rowTemplate, emailRow?.name || 'Applicant', buildExtras(rowTemplate))
    if (preview) setRowPreviewHtml(preview.html)
  }
  const getIframeHtml = useCallback(() => {
    try {
      const doc = emailIframeRef.current?.contentDocument
      if (doc) return '<!DOCTYPE html>' + doc.documentElement.outerHTML
    } catch { /* cross-origin */ }
    return null
  }, [])
  const handleRowSend = async () => {
    if (!emailRow?.email) return
    setRowSending(true)
    // If the user edited the preview, send the modified HTML directly
    const editedHtml = emailEdited ? getIframeHtml() : null
    const result = await adminActions.sendApplicantEmail(
      rowTemplate,
      [{ email: emailRow.email, name: emailRow.name || '' }],
      buildExtras(rowTemplate),
      editedHtml || undefined,
      undefined
    )
    setRowSending(false)
    if (result) { setRowSent(true); setTimeout(() => { setEmailRow(null); setRowSent(false); setEmailEdited(false) }, 1800) }
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
  // Full-screen editor mode when editing/creating a listing
  if (tab === 'listings' && showListingModal) {

    return (
      <div className="-m-6 flex flex-col h-[calc(100vh-64px)]">
        {/* Editor top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-neutral-900/50 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowListingModal(false); setEditingListing(null) }} className="text-neutral-500 hover:text-white cursor-pointer transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-white">{editingListing ? `Editing: ${listingForm.title || 'Job Listing'}` : 'New Job Listing'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-600 mr-2">Auto-saves to preview</span>
            <button onClick={async () => { const ev = { preventDefault: () => {} } as React.FormEvent; await handleListingSave(ev as any) }}
              className={`${btnPrimary} text-xs px-4 py-1.5`}>{editingListing ? 'Save' : 'Create'}</button>
          </div>
        </div>

        {/* Split pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Editor */}
          <div className="w-[55%] overflow-y-auto border-r border-neutral-800 p-6 space-y-4">
            {/* Editor sub-tabs */}
            <div className="flex gap-1 mb-4">
              {(['details', 'description', 'requirements', 'media'] as const).map(id => (
                <button key={id} onClick={() => setListingEditorTab(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all capitalize ${listingEditorTab === id ? 'bg-[#00bfff]/10 text-[#00bfff] font-medium' : 'text-neutral-500 hover:text-white'}`}>
                  {id}
                </button>
              ))}
            </div>

            {/* Details tab */}
            {listingEditorTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Job Title *</label>
                  <input value={listingForm.title} onChange={e => setListingForm({...listingForm, title: e.target.value})} className={inputCls} placeholder="e.g. Operations Assistant" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Type</label>
                    <select value={listingForm.type} onChange={e => setListingForm({...listingForm, type: e.target.value})} className={inputCls}>
                      <option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Status</label>
                    <select value={listingForm.status} onChange={e => setListingForm({...listingForm, status: e.target.value})} className={inputCls}>
                      <option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Location</label>
                    <input value={listingForm.location} onChange={e => setListingForm({...listingForm, location: e.target.value})} className={inputCls} placeholder="Accra, Ghana" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Deadline</label>
                    <input type="date" value={listingForm.deadline} onChange={e => setListingForm({...listingForm, deadline: e.target.value})} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Salary Range</label>
                  <input value={listingForm.salary_range} onChange={e => setListingForm({...listingForm, salary_range: e.target.value})} className={inputCls} placeholder="GH\u20b52,500 \u2013 2,950/mo + commission" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Short Description (card preview)</label>
                  <textarea value={listingForm.short_description} onChange={e => setListingForm({...listingForm, short_description: e.target.value})} className={`${inputCls} resize-none`} rows={2} placeholder="Brief summary shown on the listing card" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Perks / Tags (comma-separated)</label>
                  <input value={listingForm.perks} onChange={e => setListingForm({...listingForm, perks: e.target.value})} className={inputCls} placeholder="Commission, Real tech experience, Growth" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Apply Email</label>
                  <input type="email" value={listingForm.apply_email} onChange={e => setListingForm({...listingForm, apply_email: e.target.value})} className={inputCls} placeholder="jobs@icuni.org" />
                </div>
              </div>
            )}

            {/* Description tab */}
            {listingEditorTab === 'description' && (
              <RichEditor
                label="Full Job Description"
                hint="Rich text \u2014 the full \u2018About This Role\u2019 section"
                value={listingForm.full_description}
                onChange={html => setListingForm({...listingForm, full_description: html})}
                placeholder="Describe the role, day-to-day responsibilities, team culture..."
                minHeight="400px"
              />
            )}

            {/* Requirements tab */}
            {listingEditorTab === 'requirements' && (
              <div className="space-y-6">
                <RichEditor
                  label="Requirements"
                  hint="What you need from the candidate"
                  value={listingForm.requirements}
                  onChange={html => setListingForm({...listingForm, requirements: html})}
                  placeholder="List the skills, experience, and qualities required..."
                  minHeight="250px"
                />
                <RichEditor
                  label="Benefits & Compensation"
                  hint="What the candidate gets"
                  value={listingForm.benefits}
                  onChange={html => setListingForm({...listingForm, benefits: html})}
                  placeholder="Salary details, perks, growth opportunities..."
                  minHeight="250px"
                />
              </div>
            )}

            {/* Media tab */}
            {listingEditorTab === 'media' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Hero Image</label>
                  <input value={listingForm.hero_image} onChange={e => setListingForm({...listingForm, hero_image: e.target.value})} className={inputCls} placeholder="/ops-assistant-hero.png" />
                  {listingForm.hero_image && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-neutral-800 max-h-40">
                      <img src={listingForm.hero_image} alt="Hero" className="w-full h-40 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Flyer Image</label>
                  <input value={listingForm.flyer_image} onChange={e => setListingForm({...listingForm, flyer_image: e.target.value})} className={inputCls} placeholder="/ops-assistant-flyer.jpg" />
                  {listingForm.flyer_image && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-neutral-800 max-h-40">
                      <img src={listingForm.flyer_image} alt="Flyer" className="w-full h-40 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="w-[45%] flex flex-col">
            <LivePreview mode="job" data={listingForm as any} />
          </div>
        </div>
      </div>
    )
  }

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
    </div>
  )

  // ── APPLICATIONS TAB ──
  if (tab === 'applications') return (
    <div>
      <div className="flex gap-2 mb-4">{tabBtn('listings', 'Listings')}{tabBtn('applications', 'Applications', applications.length)}{tabBtn('emails', 'Manual Emails')}</div>
      <DataTable title="Applications" subtitle="Manage applicants and send communications" loading={loading} data={applications}
        onAdd={() => setShowAddApplicant(true)} addLabel="Add Applicant"
        selectable
        selectedRows={selectedApplicants}
        onSelectRow={(rowId, selected) => {
          const next = new Set(selectedApplicants)
          selected ? next.add(rowId) : next.delete(rowId)
          setSelectedApplicants(next)
        }}
        onSelectAll={(selected) => {
          if (selected) {
            const next = new Set(selectedApplicants)
            applications.forEach((a: any) => next.add(a._rowIndex || a.email))
            setSelectedApplicants(next)
          } else {
            setSelectedApplicants(new Set())
          }
        }}
        headerActions={selectedApplicants.size > 0 ? (
          <button onClick={() => { setBatchTemplate('cv_confirmation'); setBatchResult(null); setShowBatchEmail(true);
            adminActions.previewApplicantEmail('cv_confirmation', 'Applicant').then(r => { if (r) setBatchPreviewHtml(r.html) }) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer">
            <Send className="w-4 h-4" />Send to {selectedApplicants.size} Selected
          </button>
        ) : undefined}
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

      {/* Per-Row Email Modal — Full Preview Layout */}
      {emailRow && (() => {
        const LEFT_MIN = 220, LEFT_MAX = 420, LEFT_DEFAULT = 280
        return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => !rowSending && setEmailRow(null)}>
          <div className="bg-[#0d0d0d] border border-neutral-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">Send Email to {emailRow.name}</h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">{emailRow.email}</p>
              </div>
              <button onClick={() => !rowSending && setEmailRow(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-1 min-h-0">
              <div className="flex-shrink-0 overflow-y-auto border-r border-neutral-800 p-4 space-y-3" style={{ width: `${LEFT_DEFAULT}px`, minWidth: `${LEFT_MIN}px`, maxWidth: `${LEFT_MAX}px` }}
                ref={el => {
                  if (!el) return
                  const divider = el.nextElementSibling as HTMLElement | null
                  if (!divider || divider.dataset.bound) return
                  divider.dataset.bound = '1'
                  let startX = 0, startW = 0
                  const onMove = (ev: MouseEvent) => { el.style.width = `${Math.min(LEFT_MAX, Math.max(LEFT_MIN, startW + ev.clientX - startX))}px` }
                  const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = '' }
                  divider.addEventListener('mousedown', (ev: Event) => { const e = ev as MouseEvent; startX = e.clientX; startW = el.offsetWidth; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp) })
                }}>
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-1">Template</p>
                <div className="space-y-1.5">
                  {EMAIL_TEMPLATES.map(tpl => (
                    <button key={tpl.key} type="button" onClick={() => changeRowTemplate(tpl.key)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                        rowTemplate === tpl.key ? 'bg-[#00bfff]/10 border-[#00bfff]/40' : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                      }`}>
                      <span className={`text-xs font-semibold ${rowTemplate === tpl.key ? 'text-white' : tpl.color}`}>{tpl.label}</span>
                      <p className="text-[9px] text-neutral-600 mt-0.5 leading-tight">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
                {rowTemplate === 'interview_selected' && (
                  <div className="pt-3 border-t border-neutral-800 space-y-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Date Options</p>
                    {dateOptions.map((opt, i) => (
                      <div key={i} className="flex gap-1 items-center">
                        <input type="date" value={opt.date} onChange={e => { const c = [...dateOptions]; c[i] = { ...c[i], date: e.target.value }; setDateOptions(c) }} className={`${inputCls} !py-1.5 !text-xs flex-1`} />
                        <input type="time" value={opt.time} onChange={e => { const c = [...dateOptions]; c[i] = { ...c[i], time: e.target.value }; setDateOptions(c) }} className={`${inputCls} !py-1.5 !text-xs !w-[90px]`} />
                        {dateOptions.length > 1 && <button onClick={() => setDateOptions(dateOptions.filter((_, idx) => idx !== i))} className="text-neutral-600 hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button onClick={() => setDateOptions([...dateOptions, { date: '', time: '' }])} className="text-[10px] text-[#00bfff] hover:text-white cursor-pointer">+ Add slot</button>
                      <button onClick={refreshRowPreview} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh</button>
                    </div>
                  </div>
                )}
                {rowTemplate === 'interview_confirmed' && (
                  <div className="pt-3 border-t border-neutral-800 space-y-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Confirmed Details</p>
                    <input type="date" value={confirmedDate} onChange={e => setConfirmedDate(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} />
                    <input type="time" value={confirmedTime} onChange={e => setConfirmedTime(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} />
                    <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Meeting link (optional)" />
                    <button onClick={refreshRowPreview} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
                  </div>
                )}
                {rowTemplate === 'trial_invitation' && (
                  <div className="pt-3 border-t border-neutral-800 space-y-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Trial Details</p>
                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-1">Weekly Pay (GH&#x20B5;)</label>
                      <input type="number" value={trialWeeklyRate} onChange={e => setTrialWeeklyRate(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="700" />
                    </div>
                    <p className="text-[10px] text-neutral-600">Based on GH&#x20B5;2,500-3,000/mo = GH&#x20B5;625-750/week</p>
                    <button onClick={refreshRowPreview} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
                  </div>
                )}
                {rowTemplate === 'custom' && (
                  <div className="pt-3 border-t border-neutral-800 space-y-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Custom Content</p>
                    <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Subject line" />
                    <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Heading" />
                    <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} className={`${inputCls} !py-1.5 !text-xs resize-y`} rows={4} placeholder="Email body (HTML or plain text)" />
                    <div className="space-y-1.5">
                      <input value={customCtaText} onChange={e => setCustomCtaText(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Button text (optional)" />
                      <input value={customCtaLink} onChange={e => setCustomCtaLink(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Button URL (optional)" />
                    </div>
                    <button onClick={refreshRowPreview} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
                  </div>
                )}
                <div className="pt-3 border-t border-neutral-800">
                  {rowSent ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 text-emerald-400 font-bold text-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Sent
                    </div>
                  ) : (
                    <button onClick={handleRowSend} disabled={rowSending}
                      className={`${btnPrimary} w-full flex items-center justify-center gap-2`}>
                      {rowSending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Email</>}
                    </button>
                  )}
                </div>
              </div>
              <div className="w-1 flex-shrink-0 bg-neutral-800 hover:bg-[#00bfff]/40 cursor-col-resize transition-colors" />
              <div className="flex-1 min-w-0 p-4 flex flex-col">
                {/* Editable indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-600">Click the preview to edit text directly</span>
                    {emailEdited && <span className="text-[10px] text-amber-400 font-bold">EDITED</span>}
                  </div>
                  {emailEdited && (
                    <button onClick={refreshRowPreview} className="text-[10px] text-neutral-500 hover:text-white cursor-pointer transition-colors">Reset to original</button>
                  )}
                </div>
                <div className="rounded-xl border border-neutral-800 bg-white overflow-hidden flex-1">
                  {rowPreviewHtml ? (
                    <iframe
                      ref={emailIframeRef}
                      srcDoc={rowPreviewHtml}
                      className="w-full h-full border-0"
                      title="Email Preview"
                      onLoad={() => {
                        try {
                          const doc = emailIframeRef.current?.contentDocument
                          if (doc) {
                            doc.designMode = 'on'
                            doc.addEventListener('input', () => setEmailEdited(true))
                          }
                        } catch { /* sandbox */ }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-sm bg-neutral-950">Loading preview...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Batch Email Modal */}
      {showBatchEmail && (() => {
        const BLEFT_MIN = 220, BLEFT_MAX = 420, BLEFT_DEFAULT = 280
        return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => !batchSending && setShowBatchEmail(false)}>
          <div className="bg-[#0d0d0d] border border-neutral-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">Batch Email — {selectedApplicants.size} Recipients</h3>
                <p className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-md">
                  {applications.filter((a: any) => selectedApplicants.has(a._rowIndex || a.email)).map((a: any) => a.name).join(', ')}
                </p>
              </div>
              <button onClick={() => !batchSending && setShowBatchEmail(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-1 min-h-0">
              <div className="flex-shrink-0 overflow-y-auto border-r border-neutral-800 p-4 space-y-3" style={{ width: `${BLEFT_DEFAULT}px`, minWidth: `${BLEFT_MIN}px`, maxWidth: `${BLEFT_MAX}px` }}
                ref={el => {
                  if (!el) return
                  const divider = el.nextElementSibling as HTMLElement | null
                  if (!divider || divider.dataset.bound) return
                  divider.dataset.bound = '1'
                  let startX = 0, startW = 0
                  const onMove = (ev: MouseEvent) => { el.style.width = `${Math.min(BLEFT_MAX, Math.max(BLEFT_MIN, startW + ev.clientX - startX))}px` }
                  const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = '' }
                  divider.addEventListener('mousedown', (ev: Event) => { const e = ev as MouseEvent; startX = e.clientX; startW = el.offsetWidth; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp) })
                }}>
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-1">Template</p>
                <div className="space-y-1.5">
                  {EMAIL_TEMPLATES.map(tpl => (
                    <button key={tpl.key} type="button" onClick={async () => {
                      setBatchTemplate(tpl.key)
                      const preview = await adminActions.previewApplicantEmail(tpl.key, 'Applicant', buildExtras(tpl.key))
                      if (preview) setBatchPreviewHtml(preview.html)
                    }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                        batchTemplate === tpl.key ? 'bg-[#00bfff]/10 border-[#00bfff]/40' : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                      }`}>
                      <span className={`text-xs font-semibold ${batchTemplate === tpl.key ? 'text-white' : tpl.color}`}>{tpl.label}</span>
                      <p className="text-[9px] text-neutral-600 mt-0.5 leading-tight">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
                {batchTemplate === 'custom' && (
                  <div className="pt-3 border-t border-neutral-800 space-y-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Custom Content</p>
                    <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Subject line" />
                    <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Heading" />
                    <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} className={`${inputCls} !py-1.5 !text-xs resize-y`} rows={4} placeholder="Email body (HTML or plain text)" />
                    <div className="space-y-1.5">
                      <input value={customCtaText} onChange={e => setCustomCtaText(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Button text (optional)" />
                      <input value={customCtaLink} onChange={e => setCustomCtaLink(e.target.value)} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Button URL (optional)" />
                    </div>
                    <button onClick={async () => {
                      const preview = await adminActions.previewApplicantEmail('custom', 'Applicant', buildExtras('custom'))
                      if (preview) setBatchPreviewHtml(preview.html)
                    }} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
                  </div>
                )}
                <div className="pt-3 border-t border-neutral-800">
                  {batchResult ? (
                    <div className={`flex items-center justify-center gap-2 py-2.5 font-bold text-sm ${batchResult.failed === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {batchResult.sent} sent{batchResult.failed > 0 ? `, ${batchResult.failed} failed` : ''}
                    </div>
                  ) : (
                    <button onClick={async () => {
                      const recipients = applications.filter((a: any) => selectedApplicants.has(a._rowIndex || a.email)).map((a: any) => ({ email: a.email, name: a.name || '' }))
                      if (!recipients.length) return
                      setBatchSending(true)
                      const result = await adminActions.sendApplicantEmail(batchTemplate, recipients, buildExtras(batchTemplate))
                      setBatchSending(false)
                      if (result) { setBatchResult(result); setTimeout(() => { setShowBatchEmail(false); setBatchResult(null); setSelectedApplicants(new Set()) }, 2000) }
                    }} disabled={batchSending}
                      className={`${btnPrimary} w-full flex items-center justify-center gap-2`}>
                      {batchSending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send All ({selectedApplicants.size})</>}
                    </button>
                  )}
                </div>
              </div>
              <div className="w-1 flex-shrink-0 bg-neutral-800 hover:bg-[#00bfff]/40 cursor-col-resize transition-colors" />
              <div className="flex-1 min-w-0 p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-neutral-600">Click the preview to edit text directly</span>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-white overflow-hidden flex-1">
                  {batchPreviewHtml ? (
                    <iframe
                      srcDoc={batchPreviewHtml}
                      className="w-full h-full border-0"
                      title="Batch Email Preview"
                      onLoad={(e) => {
                        try {
                          const doc = (e.target as HTMLIFrameElement).contentDocument
                          if (doc) doc.designMode = 'on'
                        } catch { /* sandbox */ }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-sm bg-neutral-950">Loading preview...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )
      })()}
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

          {/* Dynamic fields for interview templates */}
          {selectedTemplate === 'interview_selected' && (
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Date/Time Options for Applicant</label>
              <div className="space-y-2">
                {dateOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="date" value={opt.date} onChange={e => { const c = [...dateOptions]; c[i] = { ...c[i], date: e.target.value }; setDateOptions(c) }} className={inputCls} />
                    <input type="time" value={opt.time} onChange={e => { const c = [...dateOptions]; c[i] = { ...c[i], time: e.target.value }; setDateOptions(c) }} className={inputCls} />
                    {dateOptions.length > 1 && <button onClick={() => setDateOptions(dateOptions.filter((_, idx) => idx !== i))} className="text-neutral-600 hover:text-red-400 cursor-pointer p-1"><X className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setDateOptions([...dateOptions, { date: '', time: '' }])} className="text-xs text-[#00bfff] hover:text-white cursor-pointer">+ Add another option</button>
                <button onClick={loadPreview} className="text-xs text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
              </div>
            </div>
          )}
          {selectedTemplate === 'interview_confirmed' && (
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Confirmed Interview Details</label>
              <div className="space-y-2">
                <input type="date" value={confirmedDate} onChange={e => setConfirmedDate(e.target.value)} className={inputCls} />
                <input type="time" value={confirmedTime} onChange={e => setConfirmedTime(e.target.value)} className={inputCls} />
                <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className={inputCls} placeholder="Meeting link (optional — leave blank for in-person)" />
              </div>
              <button onClick={loadPreview} className="mt-2 text-xs text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
            </div>
          )}
          {selectedTemplate === 'trial_invitation' && (
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Paid Trial Week Details</label>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-neutral-600 block mb-1">Weekly Pay (GH&#x20B5;)</label>
                  <input type="number" value={trialWeeklyRate} onChange={e => setTrialWeeklyRate(e.target.value)} className={inputCls} placeholder="700" />
                </div>
                <p className="text-[10px] text-neutral-500">Monthly range GH&#x20B5;2,500-3,000 = GH&#x20B5;625-750/week. Includes full referral commission on closes.</p>
              </div>
              <button onClick={loadPreview} className="mt-2 text-xs text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
            </div>
          )}
          {selectedTemplate === 'custom' && (
            <div>
              <label className="text-xs text-neutral-500 mb-2 block">Custom Email Content</label>
              <div className="space-y-2">
                <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} className={inputCls} placeholder="Email subject line" />
                <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} className={inputCls} placeholder="Email heading / title" />
                <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} className={`${inputCls} resize-none`} rows={5} placeholder="Email body content (plain text or HTML)" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={customCtaText} onChange={e => setCustomCtaText(e.target.value)} className={inputCls} placeholder="Button text (optional)" />
                  <input value={customCtaLink} onChange={e => setCustomCtaLink(e.target.value)} className={inputCls} placeholder="Button URL (optional)" />
                </div>
              </div>
              <button onClick={loadPreview} className="mt-2 text-xs text-emerald-400 hover:text-white cursor-pointer">Refresh Preview</button>
            </div>
          )}

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
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Email Preview</h3>
            {previewSubject && <span className="text-xs text-neutral-600 truncate max-w-[250px]">Subject: {previewSubject}</span>}
          </div>
          <div className="flex-1 rounded-xl border border-neutral-800 bg-white overflow-hidden" style={{ minHeight: '900px' }}>
            {previewHtml ? (
              <iframe srcDoc={previewHtml} className="w-full h-full border-0" style={{ minHeight: '900px' }} sandbox="" title="Email Preview" />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-600 text-sm bg-neutral-950" style={{ minHeight: '900px' }}>Select a template to preview</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── REFERRALS ───────────────────────────────────────────
const PIPELINE_STAGES = ['Submitted', 'Meeting Scheduled', 'Meeting Done', 'Proposal Sent', 'Closed Won', 'Closed Lost']

const REF_EMAIL_TEMPLATES = [
  { key: 'welcome', label: 'Welcome to Program', desc: 'Welcome new referral partner to the program.', color: 'text-[#ff7a00]' },
  { key: 'stage_update', label: 'Stage Update', desc: 'Notify referrer their referral has progressed.', color: 'text-[#00bfff]' },
  { key: 'payment_sent', label: 'Payment Sent', desc: 'Confirm commission payment to referrer.', color: 'text-emerald-400' },
  { key: 'meeting_reminder', label: 'Meeting Reminder', desc: 'Remind about upcoming prospect meeting.', color: 'text-purple-400' },
  { key: 'new_material', label: 'New Material', desc: 'Notify about new portfolio/demo materials.', color: 'text-violet-400' },
  { key: 'custom', label: 'Custom Email', desc: 'Write your own branded email from scratch.', color: 'text-amber-400' },
] as const

export function ReferralsSection() {
  const { referrers, referrals, referrerMaterials, referrerNotifications, loading } = useAdminStore()
  const [tab, setTab] = useState<'referrers' | 'pipeline' | 'materials' | 'notifications' | 'emails'>('referrers')
  const [notifyTarget, setNotifyTarget] = useState<any>(null)
  const [notifyMsg, setNotifyMsg] = useState('')
  const [notifyType, setNotifyType] = useState('stage_update')
  const [matModal, setMatModal] = useState(false)
  const [matForm, setMatForm] = useState({ title: '', description: '', type: 'deck', url: '' })
  const [closeModal, setCloseModal] = useState<any>(null)
  const [dealValue, setDealValue] = useState('')

  // ── Referrer Email State ──
  const [emailRow, setEmailRow] = useState<any>(null)
  const [refTemplate, setRefTemplate] = useState('welcome')
  const [refPreviewHtml, setRefPreviewHtml] = useState('')
  const [refSending, setRefSending] = useState(false)
  const [refSent, setRefSent] = useState(false)
  const [refExtras, setRefExtras] = useState<Record<string, string>>({ amount: '', method: 'MoMo', stageName: '', prospectName: '', meetingDate: '', meetingTime: '', materialTitle: '', materialDescription: '', subject: '', title: '', body: '', ctaText: '', ctaLink: '' })
  const refIframeRef = useRef<HTMLIFrameElement>(null)

  const loadRefPreview = async (tpl: string, name?: string) => {
    const preview = await adminActions.previewReferrerEmail(tpl, name || emailRow?.name || 'Partner', refExtras)
    if (preview) setRefPreviewHtml(preview.html)
  }
  const openRefEmail = async (row: any) => {
    setEmailRow(row); setRefSent(false); setRefTemplate('welcome')
    const preview = await adminActions.previewReferrerEmail('welcome', row.name || 'Partner')
    if (preview) setRefPreviewHtml(preview.html)
  }
  const changeRefTemplate = async (tpl: string) => {
    setRefTemplate(tpl); setRefSent(false)
    await loadRefPreview(tpl)
  }
  const handleRefSend = async () => {
    if (!emailRow) return
    setRefSending(true)
    const doc = refIframeRef.current?.contentDocument
    const rawHtml = doc?.documentElement?.outerHTML || ''
    const result = await adminActions.sendReferrerEmail(refTemplate, [{ email: emailRow.email, name: emailRow.name || '' }], { ...refExtras, ...(rawHtml ? { rawHtml } : {}) })
    setRefSending(false)
    if (result) setRefSent(true)
  }

  useEffect(() => { adminActions.loadReferrals(); adminActions.loadMaterials(); adminActions.loadReferrerNotifications() }, [])

  const tabCls = (id: string) => `px-3 py-1.5 rounded-lg text-sm cursor-pointer ${tab === id ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-500 hover:text-white'}`

  // ── TAB: REFERRERS ──
  if (tab === 'referrers') {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <button className={tabCls('referrers')}>Referrers</button>
          <button onClick={() => setTab('pipeline')} className={tabCls('pipeline')}>Pipeline ({referrals.length})</button>
          <button onClick={() => setTab('materials')} className={tabCls('materials')}>Materials ({referrerMaterials.length})</button>
          <button onClick={() => setTab('notifications')} className={tabCls('notifications')}>Notifications</button>
          <button onClick={() => setTab('emails')} className={tabCls('emails')}>Emails</button>
        </div>
        <DataTable title="Referrers" subtitle="Partner referral network" loading={loading} data={referrers}
          columns={[
            { key: 'referrer_id', label: 'ID', width: '120px' },
            { key: 'name', label: 'Name', render: (v) => <span className="text-white font-medium">{v}</span> },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'is_whatsapp', label: 'WhatsApp', render: (v) => v ? <span className="text-[#25D366] text-xs font-bold">Yes</span> : <span className="text-neutral-600 text-xs">No</span> },
            { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
            { key: 'total_earned', label: 'Earned', render: (v) => v ? `GH₵${Number(v).toLocaleString()}` : 'GH₵0' },
          ]}
          searchKeys={['name', 'email']}
          renderRowActions={(row) => (
            <button onClick={() => { setTab('emails'); setTimeout(() => openRefEmail(row), 100) }}
              className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">Email</button>
          )}
        />
      </div>
    )
  }

  // ── TAB: PIPELINE ──
  if (tab === 'pipeline') {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('referrers')} className={tabCls('referrers')}>Referrers</button>
          <button className={tabCls('pipeline')}>Pipeline ({referrals.length})</button>
          <button onClick={() => setTab('materials')} className={tabCls('materials')}>Materials</button>
          <button onClick={() => setTab('notifications')} className={tabCls('notifications')}>Notifications</button>
          <button onClick={() => setTab('emails')} className={tabCls('emails')}>Emails</button>
        </div>
        <DataTable title="Referral Pipeline" subtitle="All referrals across all partners" loading={loading} data={referrals}
          columns={[
            { key: 'referral_id', label: 'ID', width: '100px' },
            { key: 'referrer_name', label: 'Referrer', render: (v) => <span className="text-white font-medium">{v}</span> },
            { key: 'client_name', label: 'Prospect' },
            { key: 'client_email', label: 'Email' },
            { key: 'stage', label: 'Stage', render: (v) => {
              const idx = Number(v) || 0
              const stage = PIPELINE_STAGES[idx] || 'Submitted'
              const colors: Record<string, string> = { 'Submitted': 'text-neutral-400', 'Meeting Scheduled': 'text-[#00bfff]', 'Meeting Done': 'text-purple-400', 'Proposal Sent': 'text-amber-400', 'Closed Won': 'text-emerald-400', 'Closed Lost': 'text-red-400' }
              return <span className={`text-xs font-bold ${colors[stage] || 'text-neutral-400'}`}>{stage}</span>
            }},
            { key: 'payout_amount', label: 'Payout', render: (v) => v ? `GH₵${Number(v).toLocaleString()}` : '—' },
          ]}
          searchKeys={['client_name', 'client_email', 'referrer_name']}
          renderRowActions={(row) => (
            <div className="flex items-center gap-2">
              {Number(row.stage || 0) < 4 && (
                <button onClick={() => adminActions.advanceReferralStage(row.referral_id, (Number(row.stage || 0)) + 1)}
                  className="text-xs text-[#00bfff] hover:text-white cursor-pointer whitespace-nowrap">Advance</button>
              )}
              {Number(row.stage || 0) < 4 && (
                <button onClick={() => setCloseModal(row)}
                  className="text-xs text-emerald-400 hover:text-white cursor-pointer">Close</button>
              )}
              <button onClick={() => setNotifyTarget(row)}
                className="text-xs text-amber-400 hover:text-white cursor-pointer">Notify</button>
            </div>
          )}
        />

        {/* Close Referral Modal */}
        {closeModal && (
          <div className={modalBg} onClick={() => setCloseModal(null)}>
            <div className={modalCard} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">Close Referral: {closeModal.client_name}</h3>
              <div className="space-y-3">
                <input value={dealValue} onChange={e => setDealValue(e.target.value)} className={inputCls} placeholder="Deal value (GH₵)" type="number" />
                <div className="flex gap-2">
                  <button onClick={async () => { await adminActions.closeReferral(closeModal.referral_id, 'won', Number(dealValue)); setCloseModal(null); setDealValue('') }}
                    className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold cursor-pointer hover:bg-emerald-500/20 transition-all">Closed Won</button>
                  <button onClick={async () => { await adminActions.closeReferral(closeModal.referral_id, 'lost'); setCloseModal(null); setDealValue('') }}
                    className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold cursor-pointer hover:bg-red-500/20 transition-all">Closed Lost</button>
                </div>
                <button onClick={() => setCloseModal(null)} className="w-full text-sm text-neutral-500 hover:text-white cursor-pointer mt-2">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Notify Modal */}
        {notifyTarget && (
          <div className={modalBg} onClick={() => setNotifyTarget(null)}>
            <div className={modalCard} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">Notify Referrer: {notifyTarget.referrer_name || notifyTarget.name}</h3>
              <div className="space-y-3">
                <select value={notifyType} onChange={e => setNotifyType(e.target.value)} className={inputCls}>
                  <option value="stage_update">Stage Update</option>
                  <option value="payment_due">Payment Due</option>
                  <option value="meeting_reminder">Meeting Reminder</option>
                  <option value="custom">Custom Message</option>
                </select>
                <textarea value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Message to referrer..." />
                <button onClick={async () => {
                  await adminActions.sendReferrerNotification(notifyTarget.referrer_id, notifyType, notifyMsg, notifyTarget.referral_id)
                  setNotifyTarget(null); setNotifyMsg('')
                }} className={btnPrimary}>Send Notification</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── TAB: MATERIALS ──
  if (tab === 'materials') {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('referrers')} className={tabCls('referrers')}>Referrers</button>
          <button onClick={() => setTab('pipeline')} className={tabCls('pipeline')}>Pipeline</button>
          <button className={tabCls('materials')}>Materials ({referrerMaterials.length})</button>
          <button onClick={() => setTab('notifications')} className={tabCls('notifications')}>Notifications</button>
          <button onClick={() => setTab('emails')} className={tabCls('emails')}>Emails</button>
        </div>
        <DataTable title="Referrer Materials" subtitle="Portfolio decks, demos, and case studies for referrers" loading={loading} data={referrerMaterials}
          onAdd={() => setMatModal(true)} addLabel="Add Material"
          columns={[
            { key: 'id', label: 'ID', width: '100px' },
            { key: 'title', label: 'Title', render: (v) => <span className="text-white font-medium">{v}</span> },
            { key: 'type', label: 'Type', render: (v) => {
              const colors: Record<string, string> = { deck: '#ff7a00', video: '#8b5cf6', 'case-study': '#00bfff', pricing: '#10b981' }
              return <span className="text-xs font-bold uppercase" style={{ color: colors[v] || '#999' }}>{v}</span>
            }},
            { key: 'url', label: 'URL', render: (v) => <a href={v} target="_blank" rel="noreferrer" className="text-[#00bfff] text-xs hover:underline truncate max-w-[200px] block">{v}</a> },
          ]}
          searchKeys={['title', 'type']}
          renderRowActions={(row) => (
            <button onClick={() => { if (confirm(`Delete "${row.title}"?`)) adminActions.deleteMaterial(row.id) }}
              className="text-xs text-red-400 hover:text-red-300 cursor-pointer">Delete</button>
          )}
        />
        {matModal && (
          <div className={modalBg} onClick={() => setMatModal(false)}>
            <div className={modalCard} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Add Material</h3>
                <button onClick={() => setMatModal(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={async e => { e.preventDefault(); const ok = await adminActions.createMaterial(matForm); if (ok) { setMatModal(false); setMatForm({ title: '', description: '', type: 'deck', url: '' }) } }} className="space-y-3">
                <input value={matForm.title} onChange={e => setMatForm({...matForm, title: e.target.value})} className={inputCls} placeholder="Material title" required />
                <textarea value={matForm.description} onChange={e => setMatForm({...matForm, description: e.target.value})} className={`${inputCls} resize-none`} rows={2} placeholder="Description" />
                <select value={matForm.type} onChange={e => setMatForm({...matForm, type: e.target.value})} className={inputCls}>
                  <option value="deck">Portfolio Deck</option>
                  <option value="video">Demo Video</option>
                  <option value="case-study">Case Study</option>
                  <option value="pricing">Pricing Overview</option>
                </select>
                <input value={matForm.url} onChange={e => setMatForm({...matForm, url: e.target.value})} className={inputCls} placeholder="URL (hosted file link)" required />
                <button type="submit" className={btnPrimary}>Create Material</button>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── TAB: NOTIFICATIONS ──
  if (tab === 'notifications') {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('referrers')} className={tabCls('referrers')}>Referrers</button>
        <button onClick={() => setTab('pipeline')} className={tabCls('pipeline')}>Pipeline</button>
        <button onClick={() => setTab('materials')} className={tabCls('materials')}>Materials</button>
        <button className={tabCls('notifications')}>Notifications</button>
        <button onClick={() => setTab('emails')} className={tabCls('emails')}>Emails</button>
      </div>
      <DataTable title="Notification Log" subtitle="All notifications sent to referrers" loading={loading} data={referrerNotifications}
        columns={[
          { key: 'timestamp', label: 'Sent', width: '150px', render: (v) => v ? new Date(v).toLocaleString() : '—' },
          { key: 'referrer_name', label: 'Referrer', render: (v) => <span className="text-white font-medium">{v || '—'}</span> },
          { key: 'type', label: 'Type', render: (v) => <span className="text-xs font-bold text-[#00bfff] uppercase">{(v || '').replace(/_/g, ' ')}</span> },
          { key: 'message', label: 'Message' },
        ]}
        searchKeys={['referrer_name', 'type', 'message']}
      />
    </div>
  )
  }

  // ── TAB: EMAILS ──
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('referrers')} className={tabCls('referrers')}>Referrers</button>
        <button onClick={() => setTab('pipeline')} className={tabCls('pipeline')}>Pipeline</button>
        <button onClick={() => setTab('materials')} className={tabCls('materials')}>Materials</button>
        <button onClick={() => setTab('notifications')} className={tabCls('notifications')}>Notifications</button>
        <button className={tabCls('emails')}>Emails</button>
      </div>

      {!emailRow ? (
        <DataTable title="Referrer Email" subtitle="Select a referrer to send a branded email" loading={loading} data={referrers}
          columns={[
            { key: 'name', label: 'Name', render: (v) => <span className="text-white font-medium">{v}</span> },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
          ]}
          searchKeys={['name', 'email']}
          renderRowActions={(row) => (
            <button onClick={() => openRefEmail(row)} className="text-xs text-[#00bfff] hover:text-white cursor-pointer">Compose</button>
          )}
        />
      ) : (
        <div className="bg-[#0d0d0d] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '80vh' }}>
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white">Email to {emailRow.name}</h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">{emailRow.email}</p>
            </div>
            <button onClick={() => setEmailRow(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex" style={{ height: 'calc(100% - 52px)' }}>
            {/* Left: template picker */}
            <div className="w-[280px] flex-shrink-0 overflow-y-auto border-r border-neutral-800 p-4 space-y-3">
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-1">Template</p>
              <div className="space-y-1.5">
                {REF_EMAIL_TEMPLATES.map(tpl => (
                  <button key={tpl.key} type="button" onClick={() => changeRefTemplate(tpl.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                      refTemplate === tpl.key ? 'bg-[#00bfff]/10 border-[#00bfff]/40' : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                    }`}>
                    <span className={`text-xs font-semibold ${refTemplate === tpl.key ? 'text-white' : tpl.color}`}>{tpl.label}</span>
                    <p className="text-[9px] text-neutral-600 mt-0.5 leading-tight">{tpl.desc}</p>
                  </button>
                ))}
              </div>

              {/* Template-specific fields */}
              {refTemplate === 'stage_update' && (
                <div className="pt-3 border-t border-neutral-800 space-y-2">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Stage Details</p>
                  <input value={refExtras.prospectName} onChange={e => setRefExtras({...refExtras, prospectName: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Prospect name" />
                  <input value={refExtras.stageName} onChange={e => setRefExtras({...refExtras, stageName: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Stage name (e.g. Meeting Scheduled)" />
                  <button onClick={() => loadRefPreview(refTemplate)} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh</button>
                </div>
              )}
              {refTemplate === 'payment_sent' && (
                <div className="pt-3 border-t border-neutral-800 space-y-2">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Payment Details</p>
                  <input value={refExtras.amount} onChange={e => setRefExtras({...refExtras, amount: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Amount (e.g. 1,000)" />
                  <select value={refExtras.method} onChange={e => setRefExtras({...refExtras, method: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`}>
                    <option>MoMo</option><option>Bank Transfer</option><option>Cash</option>
                  </select>
                  <button onClick={() => loadRefPreview(refTemplate)} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh</button>
                </div>
              )}
              {refTemplate === 'meeting_reminder' && (
                <div className="pt-3 border-t border-neutral-800 space-y-2">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Meeting Details</p>
                  <input value={refExtras.prospectName} onChange={e => setRefExtras({...refExtras, prospectName: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Prospect name" />
                  <input type="date" value={refExtras.meetingDate} onChange={e => setRefExtras({...refExtras, meetingDate: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} />
                  <input type="time" value={refExtras.meetingTime} onChange={e => setRefExtras({...refExtras, meetingTime: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} />
                  <button onClick={() => loadRefPreview(refTemplate)} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh</button>
                </div>
              )}
              {refTemplate === 'new_material' && (
                <div className="pt-3 border-t border-neutral-800 space-y-2">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Material Details</p>
                  <input value={refExtras.materialTitle} onChange={e => setRefExtras({...refExtras, materialTitle: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Material title" />
                  <textarea value={refExtras.materialDescription} onChange={e => setRefExtras({...refExtras, materialDescription: e.target.value})} className={`${inputCls} !py-1.5 !text-xs resize-none`} rows={2} placeholder="Description" />
                  <button onClick={() => loadRefPreview(refTemplate)} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh</button>
                </div>
              )}
              {refTemplate === 'custom' && (
                <div className="pt-3 border-t border-neutral-800 space-y-2">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Custom Content</p>
                  <input value={refExtras.subject} onChange={e => setRefExtras({...refExtras, subject: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Subject line" />
                  <input value={refExtras.title} onChange={e => setRefExtras({...refExtras, title: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Heading" />
                  <textarea value={refExtras.body} onChange={e => setRefExtras({...refExtras, body: e.target.value})} className={`${inputCls} !py-1.5 !text-xs resize-y`} rows={4} placeholder="Email body" />
                  <input value={refExtras.ctaText} onChange={e => setRefExtras({...refExtras, ctaText: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Button text (optional)" />
                  <input value={refExtras.ctaLink} onChange={e => setRefExtras({...refExtras, ctaLink: e.target.value})} className={`${inputCls} !py-1.5 !text-xs`} placeholder="Button URL (optional)" />
                  <button onClick={() => loadRefPreview(refTemplate)} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer">Refresh</button>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-800">
                {refSent ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 text-emerald-400 font-bold text-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Sent
                  </div>
                ) : (
                  <button onClick={handleRefSend} disabled={refSending}
                    className={`${btnPrimary} w-full flex items-center justify-center gap-2`}>
                    {refSending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Email</>}
                  </button>
                )}
              </div>
            </div>
            {/* Right: preview */}
            <div className="flex-1 min-w-0 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-neutral-600">Click the preview to edit text directly</span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-white overflow-hidden flex-1">
                {refPreviewHtml ? (
                  <iframe
                    ref={refIframeRef}
                    srcDoc={refPreviewHtml}
                    className="w-full h-full border-0"
                    title="Referrer Email Preview"
                    onLoad={() => {
                      try {
                        const doc = refIframeRef.current?.contentDocument
                        if (doc) doc.designMode = 'on'
                      } catch { /* sandbox */ }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-400 text-sm bg-neutral-950">Loading preview...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── USERS ───────────────────────────────────────────────
export function UsersSection() {
  const { users, loading, user: currentUser } = useAdminStore()
  const [showAdd, setShowAdd] = useState(false)
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Staff' })
  const [adminEmail, setAdminEmail] = useState('')
  const [adminJobTitle, setAdminJobTitle] = useState('Operations Assistant')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({})
  const [savingPerms, setSavingPerms] = useState(false)
  const [busyAddUser, setBusyAddUser] = useState(false)
  const [busyInviteAdmin, setBusyInviteAdmin] = useState(false)

  const isGodmode = currentUser?.role === 'Godmode'

  // Filter to admin/staff only — Clients and Referrers have their own pages
  const adminUsers = users.filter((u: any) => ['Godmode', 'Admin', 'Staff'].includes(u.role))

  useEffect(() => { adminActions.loadUsers() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusyAddUser(true)
    try {
      const ok = await adminActions.addUser(form)
      if (ok) { setShowAdd(false); setForm({ name: '', email: '', phone: '', role: 'Staff' }) }
    } finally { setBusyAddUser(false) }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusyInviteAdmin(true)
    try {
      const ok = await adminActions.createAdmin(adminEmail, adminJobTitle)
      if (ok) { setShowCreateAdmin(false); setAdminEmail(''); setAdminJobTitle('Operations Assistant') }
    } finally { setBusyInviteAdmin(false) }
  }

  const openPermissions = (u: any) => {
    setSelectedUser(u)
    try {
      setEditPerms(JSON.parse(u.permissions_json || '{}'))
    } catch { setEditPerms({}) }
  }

  const savePermissions = async () => {
    if (!selectedUser) return
    setSavingPerms(true)
    await adminActions.updateUserPermissions(selectedUser.id, editPerms)
    setSavingPerms(false)
    setSelectedUser(null)
  }

  const SECTION_LIST = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clients', label: 'CRM / Clients' },
    { id: 'projects', label: 'Projects' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'careers', label: 'Careers' },
    { id: 'referrals', label: 'Referrals' },
    { id: 'sla', label: 'SLA' },
    { id: 'logs', label: 'Logs' },
    { id: 'settings', label: 'Settings' },
  ]

  const roleColor = (role: string) => {
    if (role === 'Godmode') return 'text-[#ff7a00] bg-[#ff7a00]/10'
    if (role === 'Admin') return 'text-[#8b5cf6] bg-[#8b5cf6]/10'
    if (role === 'Staff') return 'text-[#00bfff] bg-[#00bfff]/10'
    if (role === 'Client') return 'text-emerald-400 bg-emerald-400/10'
    return 'text-neutral-400 bg-neutral-800'
  }

  const [editUser, setEditUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', phone: '', job_title: '', role: '', status: '' })
  const [busyEdit, setBusyEdit] = useState(false)

  const openEditUser = (u: any) => {
    setEditUser(u)
    setEditForm({
      name: u.name || '',
      phone: u.phone || '',
      job_title: u.job_title || '',
      role: u.role || 'Staff',
      status: u.status || 'Active',
    })
  }

  const handleEditUser = async () => {
    if (!editUser) return
    setBusyEdit(true)
    try {
      const ok = await adminActions.editUser(editUser.id, editForm)
      if (ok) setEditUser(null)
    } finally { setBusyEdit(false) }
  }

  return (
    <>
      <DataTable title="Team" subtitle={`${adminUsers.length} admin & staff accounts`} loading={loading} data={adminUsers}
        onAdd={() => setShowAdd(true)} addLabel="Add Staff"
        headerActions={isGodmode ? (
          <button onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-purple-600 text-white rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer">
            <UserPlus className="w-4 h-4" />Invite Admin
          </button>
        ) : undefined}
        columns={[
          { key: 'id', label: 'ID', width: '120px' },
          { key: 'name', label: 'Name', render: (v: any) => <span className="text-white font-medium">{v}</span> },
          { key: 'email', label: 'Email' },
          { key: 'job_title', label: 'Job Title', render: (v: any) => v ? <span className="text-neutral-400 text-xs">{v}</span> : <span className="text-neutral-700 text-xs">—</span> },
          { key: 'role', label: 'Role', render: (v: any) => (
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${roleColor(v)}`}>{v}</span>
          )},
          { key: 'status', label: 'Status', render: (v: any) => <Badge status={v} /> },
          { key: 'last_login', label: 'Last Login', render: (v: any) => v ? new Date(v).toLocaleDateString() : 'Never' },
        ]}
        searchKeys={['name', 'email', 'role', 'job_title']}
        renderRowActions={(row) => (
          <div className="flex gap-3">
            {isGodmode && row.role !== 'Godmode' && (
              <button onClick={() => openEditUser(row)} className="text-xs text-[#00bfff] hover:text-cyan-300 cursor-pointer transition-colors">Edit</button>
            )}
            {isGodmode && row.role === 'Admin' && (
              <button onClick={() => openPermissions(row)} className="text-xs text-[#8b5cf6] hover:text-purple-300 cursor-pointer transition-colors">Permissions</button>
            )}
            {row.role !== 'Godmode' && row.status === 'Active' ? (
              <button onClick={() => { if (confirm(`Deactivate ${row.name}?`)) adminActions.deactivateUser(row.id) }}
                className="text-xs text-red-400 hover:text-red-300 cursor-pointer">Deactivate</button>
            ) : null}
          </div>
        )}
      />

      {/* Edit User Modal — Godmode only */}
      {editUser && (
        <div className={modalBg} onClick={() => setEditUser(null)}>
          <div className={`${modalCard} !max-w-lg`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  Edit Team Member
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className={inputCls} placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={inputCls} placeholder="+233 xxx xxx" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Job Title</label>
                  <input value={editForm.job_title} onChange={e => setEditForm({...editForm, job_title: e.target.value})} className={inputCls} placeholder="Operations Assistant" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className={inputCls}>
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className={inputCls}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <button onClick={handleEditUser} disabled={busyEdit}
                className={`${btnPrimary} w-full flex items-center justify-center gap-2`}>
                {busyEdit ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Admin Modal — Godmode only, elevated access */}
      {showCreateAdmin && (
        <div className={modalBg} onClick={() => setShowCreateAdmin(false)}>
          <div className={`${modalCard} !max-w-lg`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-[#8b5cf6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0" strokeLinecap="round"/><path d="M17 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Invite Admin
              </h3>
              <button onClick={() => setShowCreateAdmin(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-[#8b5cf6]/80 leading-relaxed">
                <strong>Admin</strong> = full console access (all sections). Use this to invite someone who manages operations alongside you.
                You can restrict specific sections after creation via Permissions.
              </p>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Email Address *</label>
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className={inputCls} placeholder="their.email@example.com" required autoFocus />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Job Title</label>
                <input value={adminJobTitle} onChange={e => setAdminJobTitle(e.target.value)} className={inputCls} placeholder="Operations Assistant" />
              </div>
              <p className="text-xs text-neutral-600">A login code will be emailed. They can set their password and PIN on first login.</p>
              <button type="submit" disabled={busyInviteAdmin} className="w-full px-4 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-purple-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {busyInviteAdmin ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Sending Invite...</> : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Permission Toggle Modal */}
      {selectedUser && (
        <div className={modalBg} onClick={() => setSelectedUser(null)}>
          <div className={`${modalCard} !max-w-md`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Permissions</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 mb-5">
              {SECTION_LIST.map(sec => {
                const enabled = editPerms[sec.id] !== false
                return (
                  <div key={sec.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${enabled ? 'bg-[#8b5cf6]/5 border-[#8b5cf6]/20' : 'bg-neutral-900/50 border-neutral-800'}`}>
                    <span className={`text-sm font-medium ${enabled ? 'text-white' : 'text-neutral-600'}`}>{sec.label}</span>
                    <button onClick={() => setEditPerms(prev => ({ ...prev, [sec.id]: !enabled }))}
                      className={`relative w-10 h-5 rounded-full transition-all cursor-pointer ${enabled ? 'bg-[#8b5cf6]' : 'bg-neutral-700'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${enabled ? 'left-5.5' : 'left-0.5'}`}
                        style={enabled ? { left: '22px' } : { left: '2px' }} />
                    </button>
                  </div>
                )
              })}
            </div>
            <button onClick={savePermissions} disabled={savingPerms}
              className={`${btnPrimary} w-full flex items-center justify-center gap-2`}>
              {savingPerms ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Permissions'}
            </button>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {showAdd && (
        <div className={modalBg} onClick={() => setShowAdd(false)}>
          <div className={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#00bfff]" />Add Staff Member</h3>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-[#00bfff]/5 border border-[#00bfff]/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-[#00bfff]/80 leading-relaxed">
                <strong>Staff</strong> = limited access. They can view dashboards and manage assigned work but cannot configure system settings or invite admins.
              </p>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="Full name" required />
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} placeholder="Email" required />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} placeholder="Phone (optional)" />
              <p className="text-xs text-neutral-600">A temporary password will be emailed to the user.</p>
              <button type="submit" disabled={busyAddUser} className={`${btnPrimary} flex items-center justify-center gap-2`}>
                {busyAddUser ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Creating...</> : 'Create Staff Member'}
              </button>
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
