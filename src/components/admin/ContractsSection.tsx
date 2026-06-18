import { useState, useRef } from 'react'
import { FileText, Download, Edit3, Save, Plus, X, Eye, UploadCloud, Send, Mail } from 'lucide-react'
import { adminActions } from '../../store/useAdminStore'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'

type RecipientType = 'client' | 'associate' | 'referrer' | 'staff' | 'other'
const RECIPIENT_TYPES: { id: RecipientType; label: string }[] = [
  { id: 'client', label: 'Client' },
  { id: 'associate', label: 'Growth Associate' },
  { id: 'referrer', label: 'Referrer' },
  { id: 'staff', label: 'Team / Staff' },
  { id: 'other', label: 'Other' },
]

interface ContractTemplate {
  id: string
  title: string
  description: string
  category: string
  color: string
  icon: string
  blank?: boolean
  sections: { heading: string; body: string }[]
}

// ─── Template library ────────────────────────────────────
const S = (heading: string, body: string) => ({ heading, body })

const DEFAULT_TEMPLATES: ContractTemplate[] = [
  // ── CLIENTS ──
  {
    id: 'service_agreement', title: 'Service Agreement', category: 'Clients',
    description: 'Standard service agreement for new projects', color: '#00bfff', icon: 'SA',
    sections: [
      S('PARTIES', 'This Agreement is entered into between ICUNI Labs ("Service Provider"), Accra, Ghana, and {{RECIPIENT_NAME}} ("Client"), of {{RECIPIENT_ADDRESS}}.'),
      S('SCOPE OF WORK', 'ICUNI Labs will design, develop and deliver a custom {{PROJECT_TYPE}} system as described in the project proposal provided to the Client, built specifically for the Client\'s operations and workflow.'),
      S('TIMELINE', 'The project will be completed within the timeline communicated in the proposal. ICUNI Labs will provide regular progress updates and demo sessions throughout.'),
      S('PAYMENT TERMS', 'The total project cost is {{PROJECT_COST}}, payable according to the milestone schedule in the invoice. Late payments may incur charges as outlined in the invoice terms.'),
      S('INTELLECTUAL PROPERTY', 'Upon full payment, the Client receives full ownership of the custom system built for their business. ICUNI Labs retains the right to reuse generic components, frameworks and methodologies.'),
      S('CONFIDENTIALITY', 'Both parties agree to keep confidential all proprietary information shared during this engagement. This obligation survives termination.'),
      S('WARRANTY & SUPPORT', 'ICUNI Labs provides a 30-day post-delivery support period during which bugs and critical issues are resolved at no additional cost. Extended maintenance is available separately.'),
      S('TERMINATION', 'Either party may terminate with 14 days written notice. On termination, the Client pays for all work completed up to that date.'),
    ],
  },
  {
    id: 'project_scope', title: 'Project Scope Document', category: 'Clients',
    description: 'Detailed scope and deliverables for a project', color: '#8b5cf6', icon: 'PS',
    sections: [
      S('PROJECT OVERVIEW', 'Project Title: {{PROJECT_TITLE}}\nClient: {{RECIPIENT_NAME}}\nProject Type: {{PROJECT_TYPE}}\nEstimated Cost: {{PROJECT_COST}}\nStart Date: {{START_DATE}}'),
      S('OBJECTIVES', 'The primary objective is to deliver a custom operations system that replaces the Client\'s manual processes with an automated, purpose-built solution.'),
      S('DELIVERABLES', '1. Custom-built {{PROJECT_TYPE}} system\n2. User training session\n3. Technical documentation\n4. 30-day post-launch support\n5. All source code and credentials'),
      S('OUT OF SCOPE', '- Hardware procurement\n- Third-party software licensing fees\n- Content creation and data migration (unless specified)\n- Ongoing maintenance beyond the support period'),
      S('ACCEPTANCE CRITERIA', 'Complete when: all specified features are functional, training is delivered, the system is in production, and the Client provides written acceptance.'),
    ],
  },
  {
    id: 'maintenance_agreement', title: 'Maintenance & Support Agreement', category: 'Clients',
    description: 'Ongoing support and maintenance terms', color: '#10b981', icon: 'MS',
    sections: [
      S('SERVICE OVERVIEW', 'This Agreement covers ongoing support, bug fixes and updates for {{PROJECT_TITLE}} built by ICUNI Labs for {{RECIPIENT_NAME}}.'),
      S('SUPPORT COVERAGE', 'Standard support includes bug fixes and critical issue resolution (24-hour response), security patches, minor feature adjustments, up to 4 hours/month consultation, and uptime monitoring.'),
      S('SUPPORT HOURS', 'Monday to Friday, 8:00 AM – 6:00 PM GMT. Critical failures addressed within 4 hours during business hours.'),
      S('MONTHLY FEE', 'The monthly maintenance fee is {{MONTHLY_FEE}}, payable on the 1st of each month, covering all services under Support Coverage.'),
      S('TERM & RENEWAL', 'Effective for 12 months from {{EFFECTIVE_DATE}}, auto-renewing unless either party gives 30 days written notice.'),
    ],
  },
  {
    id: 'software_handover', title: 'Software License & Handover', category: 'Clients',
    description: 'Ownership transfer and handover on completion', color: '#06b6d4', icon: 'SH',
    sections: [
      S('PARTIES', 'Between ICUNI Labs ("Developer") and {{RECIPIENT_NAME}} ("Owner") for the system {{PROJECT_TITLE}}.'),
      S('GRANT OF OWNERSHIP', 'On confirmation of full payment ({{PROJECT_COST}}), ICUNI Labs transfers to the Owner full ownership of the bespoke application, including source code, assets and all administrative credentials.'),
      S('HANDOVER ITEMS', '- Source code repository access\n- Hosting and database credentials\n- Admin accounts and documentation\n- A walkthrough/training session'),
      S('THIRD-PARTY COMPONENTS', 'Open-source and third-party components remain under their respective licenses. Any paid third-party services are the Owner\'s responsibility going forward.'),
      S('POST-HANDOVER SUPPORT', 'A 30-day warranty applies from the handover date for defects in the delivered work. Ongoing support is available under a separate Maintenance Agreement.'),
    ],
  },
  {
    id: 'payment_plan', title: 'Payment Plan Agreement', category: 'Clients',
    description: 'Installment / milestone payment terms', color: '#f59e0b', icon: 'PP',
    sections: [
      S('PARTIES & PROJECT', 'Between ICUNI Labs and {{RECIPIENT_NAME}} for {{PROJECT_TITLE}}, total value {{PROJECT_COST}}.'),
      S('SCHEDULE', 'The total is payable in instalments per the schedule agreed in the invoice. Each milestone is due on delivery of the associated stage of work.'),
      S('LATE PAYMENT', 'Payments more than 7 days late may pause work until settled. Repeated delays may, at ICUNI Labs\' discretion, lead to suspension under the Service Agreement.'),
      S('OWNERSHIP', 'Ownership and final handover occur only upon receipt of the full balance.'),
    ],
  },

  // ── GROWTH ASSOCIATES ──
  {
    id: 'associate_agreement', title: 'Growth Associate Agreement', category: 'Growth Associates',
    description: 'Role, commission and conduct for associates', color: '#ec4899', icon: 'GA',
    sections: [
      S('PARTIES', 'This Agreement is between ICUNI Labs and {{RECIPIENT_NAME}} ("Growth Associate"), engaged as {{ROLE_TITLE}} from {{EFFECTIVE_DATE}}.'),
      S('ROLE', 'The Associate will prospect, qualify and book meetings with potential clients for ICUNI Labs, following the provided call guide, CRM process and brand standards.'),
      S('COMMISSION', 'The Associate earns {{COMMISSION_RATE}} on the value of qualified deals they originate that close to a paid project, payable after the client\'s first cleared payment.'),
      S('CONDUCT', 'The Associate will represent ICUNI Labs professionally, log all activity accurately in the CRM, and never misrepresent the company\'s services or pricing.'),
      S('CONFIDENTIALITY', 'All client data, pricing, scripts and internal systems are confidential and remain ICUNI Labs property. This survives the end of the engagement.'),
      S('INDEPENDENT STATUS', 'The Associate is an independent contractor, responsible for their own taxes, and this Agreement does not create employment.'),
      S('TERMINATION', 'Either party may end this Agreement with 14 days written notice. Earned, unpaid commission on already-closed deals remains payable.'),
    ],
  },
  {
    id: 'contractor_agreement', title: 'Independent Contractor Agreement', category: 'Growth Associates',
    description: 'General contractor terms (any engagement)', color: '#8b5cf6', icon: 'IC',
    sections: [
      S('PARTIES', 'Between ICUNI Labs and {{RECIPIENT_NAME}} ("Contractor"), of {{RECIPIENT_ADDRESS}}, effective {{EFFECTIVE_DATE}}.'),
      S('SERVICES', 'The Contractor will provide services as {{ROLE_TITLE}} as agreed from time to time, exercising reasonable skill and care.'),
      S('FEES', 'The Contractor is paid {{COMMISSION_RATE}} as agreed for the work performed, invoiced on the schedule agreed between the parties.'),
      S('INDEPENDENT STATUS', 'The Contractor is not an employee, is responsible for their own taxes and equipment, and may not bind ICUNI Labs to third parties without written authority.'),
      S('IP & CONFIDENTIALITY', 'All work product created for ICUNI Labs and all confidential information belong to ICUNI Labs. The Contractor assigns all such rights to ICUNI Labs.'),
      S('TERMINATION', 'Either party may terminate with 14 days written notice; fees for completed work remain payable.'),
    ],
  },
  {
    id: 'commission_addendum', title: 'Commission Structure Addendum', category: 'Growth Associates',
    description: 'Detailed commission tiers and payout terms', color: '#10b981', icon: 'CM',
    sections: [
      S('REFERENCE', 'This Addendum supplements the agreement between ICUNI Labs and {{RECIPIENT_NAME}} and sets out commission detail.'),
      S('RATE', 'Base commission is {{COMMISSION_RATE}} of the value of each closed, paid deal the Associate originates.'),
      S('QUALIFICATION', 'A deal qualifies for commission only where the Associate is the documented originator in the CRM and the client completes their first cleared payment.'),
      S('PAYOUT', 'Commission is calculated monthly and paid within 14 days of the qualifying payment clearing. Clawback applies to refunded or charged-back deals.'),
    ],
  },

  // ── REFERRERS ──
  {
    id: 'referral_partner', title: 'Referral Partner Agreement', category: 'Referrers',
    description: 'Terms for partners who refer business', color: '#ff7a00', icon: 'RP',
    sections: [
      S('PARTIES', 'This Agreement is between ICUNI Labs and {{RECIPIENT_NAME}} ("Referrer"), of {{RECIPIENT_ADDRESS}}, effective {{EFFECTIVE_DATE}}.'),
      S('REFERRALS', 'The Referrer may introduce potential clients to ICUNI Labs. A referral is valid when the introduced party is new to ICUNI Labs and is logged through the referral process.'),
      S('REWARD', 'The Referrer earns {{COMMISSION_RATE}} of the value of any referred deal that closes to a paid project, payable after the client\'s first cleared payment.'),
      S('CONDUCT', 'The Referrer will represent ICUNI Labs honestly and will not make commitments on price, scope or timelines on ICUNI Labs\' behalf.'),
      S('NO EMPLOYMENT', 'This Agreement creates a referral relationship only — not employment, partnership or agency.'),
      S('TERM', 'Either party may end this Agreement with written notice. Rewards on deals already closed before notice remain payable.'),
    ],
  },
  {
    id: 'referral_terms', title: 'Referral Commission Terms', category: 'Referrers',
    description: 'Short-form referral reward terms', color: '#22c55e', icon: 'RC',
    sections: [
      S('REWARD', 'ICUNI Labs will pay {{RECIPIENT_NAME}} {{COMMISSION_RATE}} of the value of each successfully closed referral.'),
      S('VALID REFERRAL', 'A referral counts when the party is new to ICUNI Labs, is logged via the referral process, and signs a paid project.'),
      S('PAYMENT', 'Rewards are paid within 14 days of the referred client\'s first cleared payment, by the method agreed with the Referrer.'),
    ],
  },

  // ── TEAM / STAFF ──
  {
    id: 'offer_letter', title: 'Employment Offer Letter', category: 'Team',
    description: 'Offer of a role at ICUNI Labs', color: '#00bfff', icon: 'OL',
    sections: [
      S('OFFER', 'ICUNI Labs is pleased to offer {{RECIPIENT_NAME}} the role of {{ROLE_TITLE}}, starting {{EFFECTIVE_DATE}}.'),
      S('COMPENSATION', 'Your remuneration will be {{MONTHLY_FEE}}, reviewed periodically, paid monthly.'),
      S('RESPONSIBILITIES', 'You will perform the duties of {{ROLE_TITLE}} and such related tasks as reasonably required, to a professional standard and in line with ICUNI Labs values.'),
      S('CONFIDENTIALITY & IP', 'You agree to keep ICUNI Labs information confidential and that all work created in your role belongs to ICUNI Labs.'),
      S('ACCEPTANCE', 'Please sign below to accept this offer. We look forward to working with you.'),
    ],
  },
  {
    id: 'staff_nda_ip', title: 'Confidentiality & IP Assignment', category: 'Team',
    description: 'Staff/contractor confidentiality + IP', color: '#f59e0b', icon: 'NDA',
    sections: [
      S('PARTIES', 'Between ICUNI Labs and {{RECIPIENT_NAME}}, in connection with their engagement from {{EFFECTIVE_DATE}}.'),
      S('CONFIDENTIALITY', 'The individual will keep confidential all ICUNI Labs and client information and use it only to perform their role. This survives the engagement.'),
      S('IP ASSIGNMENT', 'All inventions, code, designs and materials created in connection with ICUNI Labs work are assigned to and owned by ICUNI Labs.'),
      S('RETURN OF MATERIALS', 'On ending the engagement, the individual will return or delete all ICUNI Labs materials and access.'),
    ],
  },

  // ── GENERAL ──
  {
    id: 'mutual_nda', title: 'Mutual Non-Disclosure Agreement', category: 'General',
    description: 'Two-way confidentiality agreement', color: '#8b5cf6', icon: 'NDA',
    sections: [
      S('PARTIES', 'This NDA is between ICUNI Labs, Accra, Ghana, and {{RECIPIENT_NAME}}, {{RECIPIENT_ADDRESS}}.'),
      S('CONFIDENTIAL INFORMATION', 'Includes all written, oral or electronic information shared by either party relating to business operations, systems, data, pricing, strategy and proprietary processes.'),
      S('OBLIGATIONS', 'Each party will use the other\'s Confidential Information only to evaluate or conduct business together, will not disclose it to third parties without written consent, and will protect it with reasonable care.'),
      S('EXCLUSIONS', 'Does not apply to information that is public, independently developed, or required to be disclosed by law.'),
      S('TERM', 'Effective for 2 years from {{EFFECTIVE_DATE}}; confidentiality obligations survive expiry.'),
      S('GOVERNING LAW', 'Governed by the laws of the Republic of Ghana.'),
    ],
  },
  {
    id: 'letter_of_intent', title: 'Letter of Intent', category: 'General',
    description: 'Non-binding statement of intent to proceed', color: '#06b6d4', icon: 'LOI',
    sections: [
      S('INTENT', 'This Letter records the intention of ICUNI Labs and {{RECIPIENT_NAME}} to work together on {{PROJECT_TITLE}}, subject to a full agreement.'),
      S('OUTLINE TERMS', 'Indicative scope: {{PROJECT_TYPE}}. Indicative value: {{PROJECT_COST}}. Indicative start: {{START_DATE}}.'),
      S('NON-BINDING', 'This Letter is non-binding except for the Confidentiality clause and does not commit either party until a definitive agreement is signed.'),
      S('NEXT STEPS', 'The parties will proceed in good faith to agree and sign a full Service Agreement.'),
    ],
  },
  {
    id: 'blank_letterhead', title: 'Blank Letterhead', category: 'General',
    description: 'ICUNI Labs letterhead — free-type your own content', color: '#64748b', icon: 'LH', blank: true,
    sections: [
      S('', 'Type your letter or custom contract here on the ICUNI Labs letterhead.\n\nDear {{RECIPIENT_NAME}},\n\n...\n\nKind regards,\nICUNI Labs'),
    ],
  },
]

const STORAGE_KEY = 'icuni_contract_templates_v2'
function loadTemplates(): ContractTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ContractTemplate[]
      // Merge in any new default templates not present in saved copy
      const ids = new Set(parsed.map(t => t.id))
      const merged = [...parsed, ...DEFAULT_TEMPLATES.filter(t => !ids.has(t.id))]
      return merged
    }
  } catch { /* ignored */ }
  return DEFAULT_TEMPLATES
}
function persistTemplates(templates: ContractTemplate[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)) } catch { /* ignored */ }
}

const CATEGORY_ORDER = ['Clients', 'Growth Associates', 'Referrers', 'Team', 'General']

export default function ContractsSection() {
  const [templates, setTemplates] = useState<ContractTemplate[]>(loadTemplates)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editSections, setEditSections] = useState<{ heading: string; body: string }[]>([])
  const [busy, setBusy] = useState<'' | 'pdf' | 'save' | 'email'>('')
  const [previewMode, setPreviewMode] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // Recipient + variable fields
  const [recipientType, setRecipientType] = useState<RecipientType>('client')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectType, setProjectType] = useState('')
  const [projectCost, setProjectCost] = useState('')
  const [startDate, setStartDate] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [commissionRate, setCommissionRate] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)

  const active = templates.find(t => t.id === activeTemplate)

  const replaceVars = (text: string) => {
    const name = recipientName || '[Name]'
    const addr = recipientAddress || '[Address]'
    return text
      .replace(/\{\{(RECIPIENT_NAME|CLIENT_NAME|ASSOCIATE_NAME|REFERRER_NAME|STAFF_NAME)\}\}/g, name)
      .replace(/\{\{(RECIPIENT_ADDRESS|CLIENT_ADDRESS)\}\}/g, addr)
      .replace(/\{\{PROJECT_TITLE\}\}/g, projectTitle || '[Project Title]')
      .replace(/\{\{PROJECT_TYPE\}\}/g, projectType || '[Project Type]')
      .replace(/\{\{PROJECT_COST\}\}/g, projectCost || '[Project Cost]')
      .replace(/\{\{START_DATE\}\}/g, startDate || '[Start Date]')
      .replace(/\{\{(MONTHLY_FEE|MAINTENANCE_FEE)\}\}/g, monthlyFee || '[Monthly Fee]')
      .replace(/\{\{ROLE_TITLE\}\}/g, roleTitle || '[Role]')
      .replace(/\{\{COMMISSION_RATE\}\}/g, commissionRate || '[Commission]')
      .replace(/\{\{EFFECTIVE_DATE\}\}/g, effectiveDate || '[Effective Date]')
  }

  const openTemplate = (id: string) => {
    setActiveTemplate(id); setEditing(false); setPreviewMode(false); setShowEmail(false); setStatus(null)
    const t = templates.find(t => t.id === id)
    if (t) setEditSections(JSON.parse(JSON.stringify(t.sections)))
  }
  const startEditing = () => { if (active) { setEditSections(JSON.parse(JSON.stringify(active.sections))); setEditing(true) } }
  const saveEdits = () => {
    if (!active) return
    const updated = templates.map(t => t.id === active.id ? { ...t, sections: editSections } : t)
    setTemplates(updated); persistTemplates(updated); setEditing(false)
  }
  const resetTemplate = (id: string) => {
    const orig = DEFAULT_TEMPLATES.find(t => t.id === id)
    if (!orig) return
    const updated = templates.map(t => t.id === id ? { ...orig } : t)
    setTemplates(updated); persistTemplates(updated)
    if (active?.id === id) setEditSections(JSON.parse(JSON.stringify(orig.sections)))
  }
  const addSection = () => setEditSections(prev => [...prev, { heading: 'NEW SECTION', body: 'Enter content here...' }])
  const removeSection = (i: number) => setEditSections(prev => prev.filter((_, idx) => idx !== i))
  const updateSection = (i: number, field: 'heading' | 'body', value: string) =>
    setEditSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))

  // Build a jsPDF from the live preview
  const buildPdf = async () => {
    if (!previewRef.current) return null
    await new Promise(r => setTimeout(r, 150))
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
    return pdf
  }

  const recipient = () => ({ type: recipientType, name: recipientName, email: recipientEmail, address: recipientAddress })
  const contractData = () => ({
    title: active?.title || 'Contract',
    sections: editing ? editSections : (active?.sections || []),
    vars: { recipientName, recipientAddress, projectTitle, projectType, projectCost, startDate, monthlyFee, roleTitle, commissionRate, effectiveDate },
  })

  const downloadPDF = async () => {
    setBusy('pdf'); setStatus(null)
    try {
      const pdf = await buildPdf()
      if (pdf) pdf.save(`${active?.title?.replace(/\s+/g, '_') || 'contract'}.pdf`)
    } catch (e) { console.error(e); setStatus({ kind: 'err', text: 'PDF generation failed. Please try again.' }) }
    setBusy('')
  }

  const saveToFolder = async () => {
    if (!active) return
    if (!recipientName.trim()) { setStatus({ kind: 'err', text: 'Add a recipient name so the contract can be filed against them.' }); return }
    setBusy('save'); setStatus(null)
    try {
      const pdf = await buildPdf()
      const pdfDataUri = pdf?.output('datauristring')
      const ok = await adminActions.saveContract({ contractData: contractData(), pdfDataUri, recipient: recipient() })
      setStatus(ok ? { kind: 'ok', text: `Saved to ${recipientName}'s folder.` } : { kind: 'err', text: 'Failed to save contract.' })
    } catch (e) { console.error(e); setStatus({ kind: 'err', text: 'Failed to save the contract.' }) }
    setBusy('')
  }

  const sendEmail = async () => {
    if (!active) return
    if (!recipientEmail.trim()) { setStatus({ kind: 'err', text: 'A recipient email is required to send.' }); return }
    setBusy('email'); setStatus(null)
    try {
      const pdf = await buildPdf()
      const pdfDataUri = pdf?.output('datauristring')
      const res = await adminActions.sendContract({ contractData: contractData(), pdfDataUri, recipient: recipient(), message: emailMsg })
      if (res && res.email_sent !== false) {
        setStatus({ kind: 'ok', text: `Emailed to ${recipientEmail} and saved to their folder.` })
        setShowEmail(false); setEmailMsg('')
      } else {
        setStatus({ kind: 'err', text: 'Email failed' + (res?.email_error ? ': ' + res.email_error : '') + '.' })
      }
    } catch (e) { console.error(e); setStatus({ kind: 'err', text: 'Failed to send the contract.' }) }
    setBusy('')
  }

  // ── EDITOR / PREVIEW VIEW ──
  if (active) {
    const sections = editing ? editSections : active.sections
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    return (
      <div className="-m-3 sm:-m-6 flex flex-col h-[calc(100vh-64px)]">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 bg-neutral-900/50 border-b border-neutral-800 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setActiveTemplate(null)} className="text-neutral-500 hover:text-white cursor-pointer transition-colors shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{active.icon} {active.title}</h2>
              <p className="text-[10px] text-neutral-600">{active.category} · {active.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="text-xs text-neutral-500 hover:text-white cursor-pointer px-3 py-1.5">Cancel</button>
                <button onClick={saveEdits} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-xs font-bold cursor-pointer transition-all"><Save className="w-3.5 h-3.5" /> Save Template</button>
              </>
            ) : (
              <>
                <button onClick={() => setPreviewMode(!previewMode)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-neutral-700 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition-colors sm:hidden"><Eye className="w-3.5 h-3.5" /> {previewMode ? 'Form' : 'Preview'}</button>
                <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-neutral-700 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition-colors"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => resetTemplate(active.id)} className="text-xs text-neutral-600 hover:text-amber-400 cursor-pointer px-2 py-1.5 transition-colors">Reset</button>
                <button onClick={downloadPDF} disabled={!!busy} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#ff7a00] to-[#e06800] text-white rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-40"><Download className="w-3.5 h-3.5" /> {busy === 'pdf' ? 'Generating…' : 'Download PDF'}</button>
                <button onClick={() => setShowEmail(true)} disabled={!!busy} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-40"><Mail className="w-3.5 h-3.5" /> Email PDF</button>
                <button onClick={saveToFolder} disabled={!!busy} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-40"><UploadCloud className="w-3.5 h-3.5" /> {busy === 'save' ? 'Saving…' : 'Save to Folder'}</button>
              </>
            )}
          </div>
        </div>

        {status && (
          <div className={`px-4 sm:px-6 py-2 text-xs font-medium ${status.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{status.text}</div>
        )}

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Left: form / editor */}
          <div className={`w-full sm:w-[45%] overflow-y-auto sm:border-r border-neutral-800 p-4 sm:p-6 space-y-4 ${previewMode ? 'hidden sm:block' : ''}`}>
            {editing ? (
              <>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">Edit Template</p>
                {editSections.map((sec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <input value={sec.heading} onChange={e => updateSection(i, 'heading', e.target.value)} className={inputCls + ' text-xs font-bold uppercase'} placeholder="Section heading (leave blank for free text)" />
                      <button onClick={() => removeSection(i)} className="text-neutral-600 hover:text-red-400 cursor-pointer ml-2"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <textarea value={sec.body} onChange={e => updateSection(i, 'body', e.target.value)} className={inputCls + ' text-xs min-h-[120px]'} />
                  </div>
                ))}
                <button onClick={addSection} className="w-full py-2 border border-dashed border-neutral-700 rounded-lg text-xs text-neutral-500 hover:text-[#00bfff] cursor-pointer transition-colors"><Plus className="w-3.5 h-3.5 inline mr-1" /> Add Section</button>
                <p className="text-[10px] text-neutral-700">Variables: {'{{RECIPIENT_NAME}}'}, {'{{RECIPIENT_ADDRESS}}'}, {'{{PROJECT_TITLE}}'}, {'{{PROJECT_TYPE}}'}, {'{{PROJECT_COST}}'}, {'{{START_DATE}}'}, {'{{MONTHLY_FEE}}'}, {'{{ROLE_TITLE}}'}, {'{{COMMISSION_RATE}}'}, {'{{EFFECTIVE_DATE}}'}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Recipient</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-neutral-500 mb-1 block">Type</label>
                    <select value={recipientType} onChange={e => setRecipientType(e.target.value as RecipientType)} className={inputCls}>
                      {RECIPIENT_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-neutral-500 mb-1 block">Name</label><input value={recipientName} onChange={e => setRecipientName(e.target.value)} className={inputCls} placeholder="e.g. Kwame Mensah" /></div>
                  <div><label className="text-xs text-neutral-500 mb-1 block">Email</label><input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className={inputCls} placeholder="name@example.com" /></div>
                  <div><label className="text-xs text-neutral-500 mb-1 block">Address</label><input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} className={inputCls} placeholder="Accra, Ghana" /></div>
                </div>

                {!active.blank && (
                  <>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider pt-2">Details (optional)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-neutral-500 mb-1 block">Project Title</label><input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} className={inputCls} placeholder="Operations System" /></div>
                      <div><label className="text-xs text-neutral-500 mb-1 block">Project Type</label><input value={projectType} onChange={e => setProjectType(e.target.value)} className={inputCls} placeholder="CRM + Inventory" /></div>
                      <div><label className="text-xs text-neutral-500 mb-1 block">Project Cost</label><input value={projectCost} onChange={e => setProjectCost(e.target.value)} className={inputCls} placeholder="GH₵8,000" /></div>
                      <div><label className="text-xs text-neutral-500 mb-1 block">Monthly Fee</label><input value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} className={inputCls} placeholder="GH₵500/mo" /></div>
                      <div><label className="text-xs text-neutral-500 mb-1 block">Role Title</label><input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} className={inputCls} placeholder="Growth Associate" /></div>
                      <div><label className="text-xs text-neutral-500 mb-1 block">Commission</label><input value={commissionRate} onChange={e => setCommissionRate(e.target.value)} className={inputCls} placeholder="10%" /></div>
                      <div><label className="text-xs text-neutral-500 mb-1 block">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
                      <div><label className="text-xs text-neutral-500 mb-1 block">Effective Date</label><input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className={inputCls} /></div>
                    </div>
                  </>
                )}
                {active.blank && (
                  <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider pt-2 mb-1">Letter Content</p>
                    <textarea value={editSections[0]?.body || active.sections[0]?.body || ''}
                      onChange={e => { const next = [{ heading: '', body: e.target.value }]; setEditSections(next) }}
                      onFocus={() => { if (editSections.length === 0) setEditSections(JSON.parse(JSON.stringify(active.sections))) }}
                      className={inputCls + ' min-h-[300px] font-mono text-xs leading-relaxed'} placeholder="Type your letter on the ICUNI Labs letterhead…" />
                    <p className="text-[10px] text-neutral-700 mt-1">Free-type anything — it renders on the letterhead. You can still use {'{{RECIPIENT_NAME}}'} etc.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: live preview (the PDF source) */}
          <div className={`w-full sm:w-[55%] flex-col overflow-y-auto bg-neutral-950/50 p-4 sm:p-6 ${previewMode ? 'flex' : 'hidden sm:flex'}`}>
            <div ref={previewRef} style={{ background: '#fff', color: '#1a1a2e', padding: '48px 40px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', lineHeight: 1.6, minHeight: '900px' }}>
              {/* Letterhead */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '2px solid #1a1a2e', paddingBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>ICUNI Labs</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Custom Business Operations Systems</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{active.blank ? '' : active.title}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{today}</div>
                </div>
              </div>

              {active.blank ? (
                <div style={{ fontSize: '12px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.8, minHeight: '520px' }}>
                  {replaceVars((editing ? editSections[0]?.body : (editSections[0]?.body ?? active.sections[0]?.body)) || '')}
                </div>
              ) : (
                sections.map((sec, i) => (
                  <div key={i} style={{ marginBottom: '18px' }}>
                    {sec.heading && (
                      <div style={{ fontSize: '10px', fontWeight: 800, color: active.color, letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase' }}>{i + 1}. {replaceVars(sec.heading)}</div>
                    )}
                    <div style={{ fontSize: '11px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{replaceVars(sec.body)}</div>
                  </div>
                ))
              )}

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #1a1a2e', height: '40px', marginBottom: '6px' }} />
                  <div style={{ fontSize: '9px', color: '#64748b' }}>For ICUNI Labs</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Menelek Makonnen, Director</div>
                </div>
                <div style={{ width: '45%' }}>
                  <div style={{ borderBottom: '1px solid #1a1a2e', height: '40px', marginBottom: '6px' }} />
                  <div style={{ fontSize: '9px', color: '#64748b' }}>{RECIPIENT_TYPES.find(r => r.id === recipientType)?.label || 'Recipient'}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>{recipientName || '[Name]'}</div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '36px', textAlign: 'center', fontSize: '8px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                ICUNI Labs &nbsp;|&nbsp; Custom Business Operations Systems &nbsp;|&nbsp; Accra, Ghana &nbsp;|&nbsp; hello@icuni.org &nbsp;|&nbsp; labs.icuni.org
              </div>
            </div>
          </div>
        </div>

        {/* Email modal */}
        {showEmail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEmail(false)}>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2"><Mail className="w-4 h-4 text-[#8b5cf6]" /> Email this contract</h3>
                <button onClick={() => setShowEmail(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-neutral-500 mb-3">Sends the PDF as an attachment and files a copy in {recipientName || 'the recipient'}'s folder.</p>
              <div className="space-y-3">
                <div><label className="text-xs text-neutral-500 mb-1 block">To</label><input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className={inputCls} placeholder="name@example.com" /></div>
                <div><label className="text-xs text-neutral-500 mb-1 block">Personal note <span className="text-neutral-600">(optional)</span></label><textarea value={emailMsg} onChange={e => setEmailMsg(e.target.value)} className={inputCls + ' min-h-[90px]'} placeholder="Hi — as discussed, here's the agreement…" /></div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowEmail(false)} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-neutral-800 text-neutral-300 cursor-pointer hover:bg-neutral-700 transition-all">Cancel</button>
                <button onClick={sendEmail} disabled={busy === 'email' || !recipientEmail.trim()} className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5" /> {busy === 'email' ? 'Sending…' : 'Send PDF'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── TEMPLATE LIST (grouped by category) ──
  const byCategory = CATEGORY_ORDER.map(cat => ({ cat, items: templates.filter(t => t.category === cat) })).filter(g => g.items.length > 0)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Contracts</h2>
        <p className="text-xs text-neutral-500">ICUNI Labs contract templates — fill in the recipient, then download, email, or file the PDF to their folder.</p>
      </div>
      <div className="space-y-6">
        {byCategory.map(group => (
          <div key={group.cat}>
            <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider mb-2">{group.cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map(t => (
                <button key={t.id} onClick={() => openTemplate(t.id)}
                  className="group text-left p-4 rounded-xl bg-neutral-900/30 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all hover:bg-neutral-900/50">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-lg">{t.icon}</span>
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-[#00bfff] transition-colors flex-1">{t.title}</h3>
                  </div>
                  <p className="text-[11px] text-neutral-500 line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <FileText className="w-3 h-3 text-neutral-700" />
                    <span className="text-[10px] text-neutral-700">{t.blank ? 'Free-type letterhead' : `${t.sections.length} sections`}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
