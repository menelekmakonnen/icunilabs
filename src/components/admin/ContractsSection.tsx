import { useState, useRef } from 'react'
import { FileText, Download, Edit3, Save, Plus, X, ChevronDown, Eye } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'

interface ContractTemplate {
  id: string
  title: string
  description: string
  color: string
  icon: string
  sections: { heading: string; body: string }[]
}

const DEFAULT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'service_agreement',
    title: 'Service Agreement',
    description: 'Standard service agreement for new projects',
    color: '#00bfff',
    icon: '📄',
    sections: [
      { heading: 'PARTIES', body: 'This Agreement is entered into between ICUNI Labs ("Service Provider"), with offices at Accra, Ghana, and {{CLIENT_NAME}} ("Client"), with offices at {{CLIENT_ADDRESS}}.' },
      { heading: 'SCOPE OF WORK', body: 'ICUNI Labs will design, develop, and deliver a custom {{PROJECT_TYPE}} system as described in the project proposal provided to the Client. The system will be built specifically for the Client\'s business operations and workflow requirements.' },
      { heading: 'TIMELINE', body: 'The project is expected to be completed within the timeline communicated in the project proposal. ICUNI Labs will provide regular progress updates and demo sessions throughout the development period.' },
      { heading: 'PAYMENT TERMS', body: 'The total project cost is {{PROJECT_COST}}. Payment is due according to the milestone schedule outlined in the invoice. Late payments may incur additional charges as outlined in the invoice terms.' },
      { heading: 'INTELLECTUAL PROPERTY', body: 'Upon full payment, the Client will receive full ownership of the custom system built for their business. ICUNI Labs retains the right to use generic components, frameworks, and methodologies in future projects.' },
      { heading: 'CONFIDENTIALITY', body: 'Both parties agree to maintain the confidentiality of all proprietary information shared during the course of this engagement. This obligation survives termination of this Agreement.' },
      { heading: 'WARRANTY & SUPPORT', body: 'ICUNI Labs provides a 30-day post-delivery support period during which bugs and critical issues will be resolved at no additional cost. Extended maintenance and support packages are available separately.' },
      { heading: 'TERMINATION', body: 'Either party may terminate this Agreement with 14 days written notice. In case of termination, the Client is responsible for payment of all work completed up to the termination date.' },
    ],
  },
  {
    id: 'project_scope',
    title: 'Project Scope Document',
    description: 'Detailed scope and deliverables for a specific project',
    color: '#8b5cf6',
    icon: '📋',
    sections: [
      { heading: 'PROJECT OVERVIEW', body: 'Project Title: {{PROJECT_TITLE}}\nClient: {{CLIENT_NAME}}\nProject Type: {{PROJECT_TYPE}}\nEstimated Cost: {{PROJECT_COST}}\nStart Date: {{START_DATE}}' },
      { heading: 'OBJECTIVES', body: 'The primary objective of this project is to deliver a custom operations system that replaces the Client\'s current manual processes with an automated, purpose-built solution.' },
      { heading: 'DELIVERABLES', body: '1. Custom-built {{PROJECT_TYPE}} system\n2. User training session\n3. Technical documentation\n4. 30-day post-launch support\n5. All source code and credentials' },
      { heading: 'OUT OF SCOPE', body: 'The following items are not included in this project scope:\n- Hardware procurement\n- Third-party software licensing fees\n- Content creation and data migration (unless specified)\n- Ongoing maintenance beyond the support period' },
      { heading: 'ASSUMPTIONS', body: '- The Client will provide timely feedback during demo and review phases\n- The Client will designate a primary point of contact\n- Access to necessary systems and data will be provided promptly' },
      { heading: 'ACCEPTANCE CRITERIA', body: 'The project will be considered complete when:\n- All specified features are functional\n- The Client has completed the training session\n- The system has been deployed to production\n- The Client provides written acceptance' },
    ],
  },
  {
    id: 'maintenance_agreement',
    title: 'Maintenance & Support Agreement',
    description: 'Ongoing support and maintenance terms',
    color: '#10b981',
    icon: '🛠️',
    sections: [
      { heading: 'SERVICE OVERVIEW', body: 'This Maintenance & Support Agreement covers ongoing technical support, bug fixes, and system updates for {{PROJECT_TITLE}} built by ICUNI Labs for {{CLIENT_NAME}}.' },
      { heading: 'SUPPORT COVERAGE', body: 'Standard support includes:\n- Bug fixes and critical issue resolution (24-hour response)\n- Security patches and updates\n- Minor feature adjustments\n- Technical consultation (up to 4 hours/month)\n- System monitoring and uptime checks' },
      { heading: 'SUPPORT HOURS', body: 'Standard support is available Monday to Friday, 8:00 AM – 6:00 PM GMT. Critical system failures will be addressed within 4 hours during business hours.' },
      { heading: 'MONTHLY FEE', body: 'The monthly maintenance fee is {{MAINTENANCE_FEE}}. This fee is payable on the 1st of each month and covers all services listed under Support Coverage.' },
      { heading: 'EXCLUSIONS', body: 'The following are not covered under this agreement:\n- New feature development\n- Major system redesigns\n- Third-party service outages\n- Issues caused by unauthorized modifications' },
      { heading: 'TERM & RENEWAL', body: 'This agreement is effective for 12 months from the start date and will auto-renew unless either party provides 30 days written notice of termination.' },
    ],
  },
  {
    id: 'nda',
    title: 'Non-Disclosure Agreement',
    description: 'Mutual confidentiality agreement',
    color: '#f59e0b',
    icon: '🔒',
    sections: [
      { heading: 'PARTIES', body: 'This Non-Disclosure Agreement ("NDA") is entered into between ICUNI Labs, Accra, Ghana ("Disclosing Party") and {{CLIENT_NAME}}, {{CLIENT_ADDRESS}} ("Receiving Party").' },
      { heading: 'DEFINITION OF CONFIDENTIAL INFORMATION', body: 'Confidential Information includes all written, oral, or electronic information shared by either party relating to business operations, technical systems, client data, pricing, strategies, and proprietary processes.' },
      { heading: 'OBLIGATIONS', body: 'The Receiving Party agrees to:\n- Use Confidential Information solely for the purpose of evaluating or engaging in business with the Disclosing Party\n- Not disclose Confidential Information to any third party without prior written consent\n- Take reasonable measures to protect the confidentiality of the information' },
      { heading: 'EXCLUSIONS', body: 'This NDA does not apply to information that:\n- Is publicly available at the time of disclosure\n- Becomes publicly available through no fault of the Receiving Party\n- Was independently developed by the Receiving Party\n- Is required to be disclosed by law or regulation' },
      { heading: 'TERM', body: 'This NDA is effective for 2 years from the date of signing. The confidentiality obligations survive the expiration of this agreement.' },
      { heading: 'GOVERNING LAW', body: 'This Agreement shall be governed by and construed in accordance with the laws of the Republic of Ghana.' },
    ],
  },
]

// ── Local storage persistence for edited templates ──
const STORAGE_KEY = 'icuni_contract_templates'
function loadTemplates(): ContractTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_TEMPLATES
}
function saveTemplates(templates: ContractTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export default function ContractsSection() {
  const [templates, setTemplates] = useState<ContractTemplate[]>(loadTemplates)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editSections, setEditSections] = useState<{ heading: string; body: string }[]>([])
  const [generating, setGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  // Client fields for template variables
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectType, setProjectType] = useState('')
  const [projectCost, setProjectCost] = useState('')
  const [startDate, setStartDate] = useState('')
  const [maintenanceFee, setMaintenanceFee] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)

  const active = templates.find(t => t.id === activeTemplate)

  const replaceVars = (text: string) => {
    return text
      .replace(/\{\{CLIENT_NAME\}\}/g, clientName || '[Client Name]')
      .replace(/\{\{CLIENT_ADDRESS\}\}/g, clientAddress || '[Client Address]')
      .replace(/\{\{PROJECT_TITLE\}\}/g, projectTitle || '[Project Title]')
      .replace(/\{\{PROJECT_TYPE\}\}/g, projectType || '[Project Type]')
      .replace(/\{\{PROJECT_COST\}\}/g, projectCost || '[Project Cost]')
      .replace(/\{\{START_DATE\}\}/g, startDate || '[Start Date]')
      .replace(/\{\{MAINTENANCE_FEE\}\}/g, maintenanceFee || '[Monthly Fee]')
  }

  const openTemplate = (id: string) => {
    setActiveTemplate(id)
    setEditing(false)
    setPreviewMode(false)
    const t = templates.find(t => t.id === id)
    if (t) setEditSections(JSON.parse(JSON.stringify(t.sections)))
  }

  const startEditing = () => {
    if (!active) return
    setEditSections(JSON.parse(JSON.stringify(active.sections)))
    setEditing(true)
  }

  const saveEdits = () => {
    if (!active) return
    const updated = templates.map(t =>
      t.id === active.id ? { ...t, sections: editSections } : t
    )
    setTemplates(updated)
    saveTemplates(updated)
    setEditing(false)
  }

  const resetTemplate = (id: string) => {
    const orig = DEFAULT_TEMPLATES.find(t => t.id === id)
    if (!orig) return
    const updated = templates.map(t => t.id === id ? { ...orig } : t)
    setTemplates(updated)
    saveTemplates(updated)
    if (active?.id === id) setEditSections(JSON.parse(JSON.stringify(orig.sections)))
  }

  const addSection = () => {
    setEditSections(prev => [...prev, { heading: 'NEW SECTION', body: 'Enter content here...' }])
  }

  const removeSection = (i: number) => {
    setEditSections(prev => prev.filter((_, idx) => idx !== i))
  }

  const updateSection = (i: number, field: 'heading' | 'body', value: string) => {
    setEditSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const downloadPDF = async () => {
    if (!previewRef.current) return
    setGenerating(true)
    await new Promise(r => setTimeout(r, 200))
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const iw = pw - 20
      const ih = iw * (canvas.height / canvas.width)
      if (ih <= ph - 20) { pdf.addImage(img, 'PNG', 10, 10, iw, ih) }
      else { let y = 0; while (y < ih) { if (y > 0) pdf.addPage(); pdf.addImage(img, 'PNG', 10, -y + 10, iw, ih); y += ph - 20 } }
      pdf.save(`${active?.title?.replace(/\s+/g, '_') || 'contract'}.pdf`)
    } catch (e) { console.error('PDF failed:', e) }
    setGenerating(false)
  }

  // ── TEMPLATE EDITOR VIEW ──
  if (active) {
    const sections = editing ? editSections : active.sections
    return (
      <div className="-m-3 sm:-m-6 flex flex-col h-[calc(100vh-64px)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 bg-neutral-900/50 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTemplate(null)} className="text-neutral-500 hover:text-white cursor-pointer transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 className="text-sm font-bold text-white">{active.icon} {active.title}</h2>
              <p className="text-[10px] text-neutral-600">{active.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="text-xs text-neutral-500 hover:text-white cursor-pointer px-3 py-1.5">Cancel</button>
                <button onClick={saveEdits} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-xs font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all">
                  <Save className="w-3.5 h-3.5" /> Save Template
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setPreviewMode(!previewMode)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-neutral-700 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition-colors">
                  <Eye className="w-3.5 h-3.5" /> {previewMode ? 'Editor' : 'Preview'}
                </button>
                <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-neutral-700 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => resetTemplate(active.id)} className="text-xs text-neutral-600 hover:text-amber-400 cursor-pointer px-2 py-1.5 transition-colors">Reset</button>
                <button onClick={downloadPDF} disabled={generating} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#ff7a00] to-[#e06800] text-white rounded-lg text-xs font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(255,122,0,0.3)] transition-all disabled:opacity-40">
                  <Download className="w-3.5 h-3.5" /> {generating ? 'Generating...' : 'Download PDF'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Left: Editor / Variable Filler */}
          <div className="w-full sm:w-[45%] overflow-y-auto sm:border-r border-neutral-800 p-4 sm:p-6 space-y-4">
            {editing ? (
              <>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">Edit Template Sections</p>
                {editSections.map((sec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <input value={sec.heading} onChange={e => updateSection(i, 'heading', e.target.value)}
                        className={inputCls + ' text-xs font-bold uppercase'} />
                      <button onClick={() => removeSection(i)} className="text-neutral-600 hover:text-red-400 cursor-pointer ml-2"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <textarea value={sec.body} onChange={e => updateSection(i, 'body', e.target.value)}
                      className={inputCls + ' text-xs min-h-[80px]'} />
                  </div>
                ))}
                <button onClick={addSection} className="w-full py-2 border border-dashed border-neutral-700 rounded-lg text-xs text-neutral-500 hover:text-[#00bfff] hover:border-[#00bfff]/30 cursor-pointer transition-colors">
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Section
                </button>
                <p className="text-[10px] text-neutral-700 mt-2">
                  Variables: <code className="text-[#ff7a00]">{'{{CLIENT_NAME}}'}</code>, <code className="text-[#ff7a00]">{'{{CLIENT_ADDRESS}}'}</code>,
                  <code className="text-[#ff7a00]">{'{{PROJECT_TITLE}}'}</code>, <code className="text-[#ff7a00]">{'{{PROJECT_TYPE}}'}</code>,
                  <code className="text-[#ff7a00]">{'{{PROJECT_COST}}'}</code>, <code className="text-[#ff7a00]">{'{{START_DATE}}'}</code>,
                  <code className="text-[#ff7a00]">{'{{MAINTENANCE_FEE}}'}</code>
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">Fill Client & Project Details</p>
                <p className="text-[10px] text-neutral-600 mb-3">These values replace template variables in the preview and PDF.</p>
                <div className="space-y-3">
                  <div><label className="text-xs text-neutral-500 mb-1 block">Client Name</label><input value={clientName} onChange={e => setClientName(e.target.value)} className={inputCls} placeholder="e.g. Kwame Mensah" /></div>
                  <div><label className="text-xs text-neutral-500 mb-1 block">Client Address</label><input value={clientAddress} onChange={e => setClientAddress(e.target.value)} className={inputCls} placeholder="e.g. Accra, Ghana" /></div>
                  <div><label className="text-xs text-neutral-500 mb-1 block">Project Title</label><input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} className={inputCls} placeholder="e.g. Business Operations System" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-neutral-500 mb-1 block">Project Type</label><input value={projectType} onChange={e => setProjectType(e.target.value)} className={inputCls} placeholder="e.g. CRM + Inventory" /></div>
                    <div><label className="text-xs text-neutral-500 mb-1 block">Project Cost</label><input value={projectCost} onChange={e => setProjectCost(e.target.value)} className={inputCls} placeholder="e.g. GH₵8,000" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-neutral-500 mb-1 block">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
                    <div><label className="text-xs text-neutral-500 mb-1 block">Monthly Fee</label><input value={maintenanceFee} onChange={e => setMaintenanceFee(e.target.value)} className={inputCls} placeholder="e.g. GH₵500/mo" /></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Preview */}
          <div className="hidden sm:flex w-[55%] flex-col overflow-y-auto bg-neutral-950/50 p-6">
            <div ref={previewRef} style={{ background: '#fff', color: '#1a1a2e', padding: '48px 40px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', lineHeight: 1.6, minHeight: '800px' }}>
              {/* Contract Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '2px solid #1a1a2e', paddingBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>ICUNI Labs</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Custom Business Operations Systems</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{active.title}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Date: {startDate ? new Date(startDate + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              {sections.map((sec, i) => (
                <div key={i} style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: active.color, letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase' }}>
                    {i + 1}. {replaceVars(sec.heading)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {replaceVars(sec.body)}
                  </div>
                </div>
              ))}

              {/* Signature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #1a1a2e', height: '40px', marginBottom: '6px' }} />
                  <div style={{ fontSize: '9px', color: '#64748b' }}>ICUNI Labs Representative</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Menelek Makonnen, Director</div>
                </div>
                <div style={{ width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #1a1a2e', height: '40px', marginBottom: '6px' }} />
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Client Representative</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>{clientName || '[Client Name]'}</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '8px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                ICUNI Labs &nbsp;|&nbsp; Custom Business Operations Systems &nbsp;|&nbsp; Accra, Ghana &nbsp;|&nbsp; labs@icuni.org &nbsp;|&nbsp; icuni.org
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── TEMPLATE LIST ──
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Contracts</h2>
        <p className="text-xs text-neutral-500">Editable contract templates — fill in client details and download as PDF</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map(t => (
          <button key={t.id} onClick={() => openTemplate(t.id)}
            className="group text-left p-5 rounded-xl bg-neutral-900/30 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all hover:bg-neutral-900/50">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-[#00bfff] transition-colors">{t.title}</h3>
                <p className="text-[10px] text-neutral-600">{t.sections.length} sections</p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-700 group-hover:text-neutral-500 -rotate-90 transition-colors" />
            </div>
            <p className="text-xs text-neutral-500">{t.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <FileText className="w-3 h-3 text-neutral-700" />
              <span className="text-[10px] text-neutral-700">Click to customize & download</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
