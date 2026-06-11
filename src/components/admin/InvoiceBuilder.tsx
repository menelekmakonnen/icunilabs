import { useState, useRef } from 'react'
import { Download, RotateCcw, Plus, FileText, User, CreditCard, Hash, Layers, Save } from 'lucide-react'
import { adminActions } from '../../store/useAdminStore'
import './invoice-builder.css'

interface Row { feature: string; systemValue: string; yourPrice: string }
interface Group { label: string; color: string; rows: Row[] }
export interface InvoiceData {
  invoiceNo: string; invoiceDate: string; dueDate: string
  billToCompany: string; billToAddress: string
  fromCompany: string; fromLocation: string; fromEmail: string
  companyTagline: string
  totalLabel: string; totalEquiv: string; totalAmount: string
  sectionTitle: string; featureGroups: Group[]
  optTitle: string; optDesc: string; optPrice: string; optNote: string
  fullValue: string; youPay: string
  discountTitle: string; discountBody: string
  discountTitle2: string; discountBody2: string
  payMobile: string; payBank: string; payAccount: string; payDue: string
  footerText: string
}

const DEFAULTS: InvoiceData = {
  invoiceNo: 'IL-2026-001', invoiceDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), dueDate: '',
  billToCompany: 'Client Company', billToAddress: 'Accra, Ghana',
  fromCompany: 'ICUNI Labs', fromLocation: 'Accra, Ghana', fromEmail: 'labs@icuni.org',
  companyTagline: 'Custom Business Operations Systems',
  totalLabel: 'TOTAL DELIVERED VALUE', totalEquiv: '', totalAmount: '$0',
  sectionTitle: 'SYSTEM FEATURES DELIVERED',
  featureGroups: [
    { label: 'BASE SYSTEM', color: '#ff6b00', rows: [
      { feature: 'Core system build', systemValue: '$0', yourPrice: '$0' },
    ]},
  ],
  optTitle: 'OPTIONAL UPGRADE', optDesc: 'Description', optPrice: '$0', optNote: 'Quoted separately',
  fullValue: '$0', youPay: '$0',
  discountTitle: 'Discount Term 1', discountBody: 'Description',
  discountTitle2: 'Discount Term 2', discountBody2: 'Description',
  payMobile: '0599 995 764', payBank: 'Stanbic Bank', payAccount: '9040013109146', payDue: '',
  footerText: 'ICUNI Labs  |  Custom Business Operations Systems  |  Accra, Ghana  |  labs@icuni.org  |  icuni.org',
}

function sumCol(groups: Group[], col: 'systemValue' | 'yourPrice') {
  let t = 0
  groups.forEach(g => g.rows.forEach(r => { const v = r[col].replace(/[^0-9.]/g, ''); if (v) t += parseFloat(v) }))
  return t
}

export default function InvoiceBuilder() {
  const [d, setD] = useState<InvoiceData>(DEFAULTS)
  const [generating, setGenerating] = useState(false)
  const [pageMode, setPageMode] = useState<'1-page' | '2-page'>('1-page')
  const ref = useRef<HTMLDivElement>(null)

  const u = (p: Partial<InvoiceData>) => setD(prev => ({ ...prev, ...p }))
  const uGrp = (gi: number, p: Partial<Group>) => { const gs = [...d.featureGroups]; gs[gi] = { ...gs[gi], ...p }; u({ featureGroups: gs }) }
  const uRow = (gi: number, ri: number, p: Partial<Row>) => { const gs = [...d.featureGroups]; const rs = [...gs[gi].rows]; rs[ri] = { ...rs[ri], ...p }; gs[gi] = { ...gs[gi], rows: rs }; u({ featureGroups: gs }) }
  const addRow = (gi: number) => { const gs = [...d.featureGroups]; gs[gi] = { ...gs[gi], rows: [...gs[gi].rows, { feature: 'New feature', systemValue: '$0', yourPrice: '$0' }] }; u({ featureGroups: gs }) }
  const rmRow = (gi: number, ri: number) => { const gs = [...d.featureGroups]; gs[gi] = { ...gs[gi], rows: gs[gi].rows.filter((_, i) => i !== ri) }; u({ featureGroups: gs }) }
  const addGrp = () => u({ featureGroups: [...d.featureGroups, { label: 'NEW GROUP', color: '#3b82f6', rows: [{ feature: 'Feature', systemValue: '$0', yourPrice: '$0' }] }] })
  const rmGrp = (gi: number) => u({ featureGroups: d.featureGroups.filter((_, i) => i !== gi) })

  const sysTotal = '$' + sumCol(d.featureGroups, 'systemValue').toLocaleString()
  const priceTotal = '$' + sumCol(d.featureGroups, 'yourPrice').toLocaleString()

  const downloadPDF = async () => {
    if (!ref.current) return
    setGenerating(true)
    await new Promise(r => setTimeout(r, 200))
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#fff' })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const iw = pw - 16
      const ih = iw * (canvas.height / canvas.width)
      if (ih <= ph - 16) { pdf.addImage(img, 'PNG', 8, 8, iw, ih) }
      else { let y = 0; while (y < ih) { if (y > 0) pdf.addPage(); pdf.addImage(img, 'PNG', 8, -y + 8, iw, ih); y += ph - 16 } }
      pdf.save(`${d.invoiceNo || 'invoice'}.pdf`)
    } catch (e) { console.error('PDF failed:', e) }
    setGenerating(false)
  }

  const handleSave = async () => {
    if (!ref.current) return
    setGenerating(true)
    await new Promise(r => setTimeout(r, 200))
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#fff' })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const iw = pw - 16
      const ih = iw * (canvas.height / canvas.width)
      if (ih <= ph - 16) { pdf.addImage(img, 'PNG', 8, 8, iw, ih) }
      else { let y = 0; while (y < ih) { if (y > 0) pdf.addPage(); pdf.addImage(img, 'PNG', 8, -y + 8, iw, ih); y += ph - 16 } }
      
      const pdfDataUri = pdf.output('datauristring')
      const success = await adminActions.saveInvoice({ invoiceData: d, pdfDataUri })
      if (success) {
        alert('Invoice saved successfully to the backend.')
      } else {
        alert('Failed to save invoice.')
      }
    } catch (e) { console.error('Save failed:', e) }
    setGenerating(false)
  }

  return (
    <div className="inv-page">
      <div className="inv-toolbar">
        <span className="inv-toolbar__title">Invoice Builder</span>
        <div className="inv-view-toggle" style={{ margin: '0 auto 0 16px' }}>
          <button className={`inv-view-toggle__btn${pageMode === '1-page' ? ' active' : ''}`} onClick={() => setPageMode('1-page')}>1-Page</button>
          <button className={`inv-view-toggle__btn${pageMode === '2-page' ? ' active' : ''}`} onClick={() => setPageMode('2-page')}>2-Page</button>
        </div>
        <div className="inv-toolbar__actions">
          <button className="inv-toolbar__btn" onClick={() => setD(DEFAULTS)}><RotateCcw /> Reset</button>
          <button className="inv-toolbar__btn inv-toolbar__btn--download" onClick={downloadPDF} disabled={generating}>
            <Download /> {generating ? 'Generating...' : 'Download PDF'}
          </button>
          <button className="inv-toolbar__btn" style={{ background: '#00bfff', color: '#fff', borderColor: '#00bfff' }} onClick={handleSave} disabled={generating}>
            <Save /> {generating ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>

      <div className="inv-layout">
        {/* EDITOR */}
        <div className="inv-editor">
          <div className="inv-card">
            <div className="inv-card__title"><FileText /> Invoice Details</div>
            <div className="inv-card__sub">Changes update the preview instantly.</div>
            <div className="inv-form-grid inv-form-grid--3" style={{ marginBottom: 10 }}>
              <div><label className="inv-label">Invoice #</label><input className="inv-input" value={d.invoiceNo} onChange={e => u({ invoiceNo: e.target.value })} /></div>
              <div><label className="inv-label">Date</label><input className="inv-input" value={d.invoiceDate} onChange={e => u({ invoiceDate: e.target.value })} /></div>
              <div><label className="inv-label">Due Date</label><input className="inv-input" value={d.dueDate} onChange={e => u({ dueDate: e.target.value })} /></div>
            </div>
            <div className="inv-form-grid inv-form-grid--2">
              <div><label className="inv-label">Company Name</label><input className="inv-input" value={d.fromCompany} onChange={e => u({ fromCompany: e.target.value })} /></div>
              <div><label className="inv-label">Tagline</label><input className="inv-input" value={d.companyTagline} onChange={e => u({ companyTagline: e.target.value })} /></div>
              <div><label className="inv-label">Location</label><input className="inv-input" value={d.fromLocation} onChange={e => u({ fromLocation: e.target.value })} /></div>
              <div><label className="inv-label">Email</label><input className="inv-input" value={d.fromEmail} onChange={e => u({ fromEmail: e.target.value })} /></div>
            </div>
          </div>
          <div className="inv-card">
            <div className="inv-card__title"><User /> Bill To</div>
            <div className="inv-form-grid inv-form-grid--2">
              <div style={{ gridColumn: '1 / -1' }}><label className="inv-label">Client / Company</label><input className="inv-input" value={d.billToCompany} onChange={e => u({ billToCompany: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="inv-label">Address</label><input className="inv-input" value={d.billToAddress} onChange={e => u({ billToAddress: e.target.value })} /></div>
            </div>
          </div>
          <div className="inv-card">
            <div className="inv-card__title"><Hash /> Total Value</div>
            <div className="inv-form-grid inv-form-grid--3">
              <div style={{ gridColumn: '1 / -1' }}><label className="inv-label">Banner Label</label><input className="inv-input" value={d.totalLabel} onChange={e => u({ totalLabel: e.target.value })} /></div>
              <div><label className="inv-label">Equivalent Note</label><input className="inv-input" value={d.totalEquiv} onChange={e => u({ totalEquiv: e.target.value })} /></div>
              <div><label className="inv-label">Total Amount</label><input className="inv-input" value={d.totalAmount} onChange={e => u({ totalAmount: e.target.value })} /></div>
            </div>
          </div>
          <div className="inv-card">
            <div className="inv-card__title"><Layers /> Features Delivered</div>
            <div><label className="inv-label">Section Title</label><input className="inv-input" value={d.sectionTitle} onChange={e => u({ sectionTitle: e.target.value })} style={{ marginBottom: 12 }} /></div>
            {d.featureGroups.map((g, gi) => (
              <div key={gi} style={{ marginBottom: 12, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 6 }}>
                  <input type="color" value={g.color} onChange={e => uGrp(gi, { color: e.target.value })} style={{ width: 22, height: 22, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
                  <input className="inv-input" value={g.label} onChange={e => uGrp(gi, { label: e.target.value })} style={{ flex: 1, fontWeight: 700, fontSize: '0.7rem' }} />
                  <button className="inv-remove-btn" onClick={() => rmGrp(gi)}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 5, padding: '0 4px 3px', fontSize: '0.55rem', fontWeight: 700, color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                  <div style={{ flex: 2 }}>Feature</div>
                  <div style={{ width: 70, textAlign: 'center' as const }}>Sys Value</div>
                  <div style={{ width: 70, textAlign: 'center' as const }}>Your Price</div>
                  <div style={{ width: 44 }}></div>
                </div>
                {g.rows.map((r, ri) => (
                  <div className="inv-line-row" key={ri}>
                    <input className="inv-input" style={{ flex: 2 }} value={r.feature} onChange={e => uRow(gi, ri, { feature: e.target.value })} />
                    <input className="inv-input" style={{ width: 70, textAlign: 'right' }} value={r.systemValue} onChange={e => uRow(gi, ri, { systemValue: e.target.value })} />
                    <input className="inv-input" style={{ width: 70, textAlign: 'right' }} value={r.yourPrice} onChange={e => uRow(gi, ri, { yourPrice: e.target.value })} />
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button className="inv-add-btn" onClick={() => addRow(gi)} style={{ padding: '2px 5px', border: 'none' }}>+</button>
                      <button className="inv-remove-btn" onClick={() => rmRow(gi, ri)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <button className="inv-add-btn" onClick={addGrp}><Plus size={13} /> Add Group</button>
            <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#888' }}>Auto-totals: <strong style={{ color: '#e5e5e5' }}>{sysTotal}</strong> / <strong style={{ color: '#ff7a00' }}>{priceTotal}</strong></div>
          </div>
          <div className="inv-card">
            <div className="inv-card__title"><Hash /> Optional Upgrade</div>
            <div className="inv-form-grid inv-form-grid--2">
              <div><label className="inv-label">Title</label><input className="inv-input" value={d.optTitle} onChange={e => u({ optTitle: e.target.value })} /></div>
              <div><label className="inv-label">Price</label><input className="inv-input" value={d.optPrice} onChange={e => u({ optPrice: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="inv-label">Description</label><input className="inv-input" value={d.optDesc} onChange={e => u({ optDesc: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="inv-label">Note</label><input className="inv-input" value={d.optNote} onChange={e => u({ optNote: e.target.value })} /></div>
            </div>
          </div>
          <div className="inv-card">
            <div className="inv-card__title"><CreditCard /> Investment & Payment</div>
            <div className="inv-form-grid inv-form-grid--2" style={{ marginBottom: 10 }}>
              <div><label className="inv-label">Full Delivered Value</label><input className="inv-input" value={d.fullValue} onChange={e => u({ fullValue: e.target.value })} /></div>
              <div><label className="inv-label">You Pay</label><input className="inv-input" value={d.youPay} onChange={e => u({ youPay: e.target.value })} /></div>
            </div>
            <div className="inv-sec-label">Discount Terms</div>
            <div className="inv-form-grid inv-form-grid--2" style={{ marginBottom: 10 }}>
              <div><label className="inv-label">Title 1</label><input className="inv-input" value={d.discountTitle} onChange={e => u({ discountTitle: e.target.value })} /></div>
              <div><label className="inv-label">Body 1</label><input className="inv-input" value={d.discountBody} onChange={e => u({ discountBody: e.target.value })} /></div>
              <div><label className="inv-label">Title 2</label><input className="inv-input" value={d.discountTitle2} onChange={e => u({ discountTitle2: e.target.value })} /></div>
              <div><label className="inv-label">Body 2</label><input className="inv-input" value={d.discountBody2} onChange={e => u({ discountBody2: e.target.value })} /></div>
            </div>
            <div className="inv-sec-label">Payment Details</div>
            <div className="inv-form-grid inv-form-grid--2">
              <div><label className="inv-label">Mobile Money</label><input className="inv-input" value={d.payMobile} onChange={e => u({ payMobile: e.target.value })} /></div>
              <div><label className="inv-label">Bank</label><input className="inv-input" value={d.payBank} onChange={e => u({ payBank: e.target.value })} /></div>
              <div><label className="inv-label">Account #</label><input className="inv-input" value={d.payAccount} onChange={e => u({ payAccount: e.target.value })} /></div>
              <div><label className="inv-label">Due By</label><input className="inv-input" value={d.payDue} onChange={e => u({ payDue: e.target.value })} /></div>
            </div>
          </div>
          <div className="inv-card">
            <div className="inv-card__title"><FileText /> Footer</div>
            <input className="inv-input" value={d.footerText} onChange={e => u({ footerText: e.target.value })} />
          </div>
        </div>

        {/* PREVIEW */}
        <div className="inv-preview-col">
          <div className="inv-preview-label">Live Preview</div>
          <div className="inv-canvas" ref={ref}>
            {generating && <div className="inv-loading"><div className="inv-loading__spin" /><span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>Generating PDF...</span></div>}
            <div className="inv-h">
              <div className="inv-h__top">
                <div className="inv-h__brand">
                  <img src="/icuni-logo.webp" className="inv-h__logo" alt="" />
                  <div><div className="inv-h__co">{d.fromCompany}</div><div className="inv-h__sub">{d.companyTagline}</div></div>
                </div>
                <div className="inv-h__title">INVOICE</div>
              </div>
              <div className="inv-h__meta">
                <div><div className="inv-h__ml">Invoice No</div><div className="inv-h__mv">{d.invoiceNo}</div></div>
                <div><div className="inv-h__ml">Date</div><div className="inv-h__mv">{d.invoiceDate}</div></div>
                <div><div className="inv-h__ml">Due</div><div className="inv-h__mv">{d.dueDate}</div></div>
              </div>
            </div>
            <div className="inv-bill">
              <div><div className="inv-bill__lbl">BILL TO</div><div className="inv-bill__co">{d.billToCompany}</div><div className="inv-bill__addr">{d.billToAddress}</div></div>
              <div className="inv-bill__from"><div className="inv-bill__lbl">FROM</div><div className="inv-bill__co">{d.fromCompany}</div><div className="inv-bill__addr">{d.fromLocation}  |  {d.fromEmail}</div></div>
            </div>
            <div className="inv-total">
              <span className="inv-total__lbl">{d.totalLabel}</span>
              <div className="inv-total__r"><span className="inv-total__eq">{d.totalEquiv}</span><span className="inv-total__amt">{d.totalAmount}</span></div>
            </div>

            <div className="inv-feat">
              <div className="inv-feat__title">{d.sectionTitle}</div>
              <table><thead><tr><th>Feature</th><th>System Value</th><th>Your Price</th></tr></thead>
              <tbody>
                {d.featureGroups.map((g, gi) => [
                  <tr key={`g${gi}`} className="inv-feat__grp"><td colSpan={3} style={{ color: g.color }}>{g.label}</td></tr>,
                  ...g.rows.map((r, ri) => {
                    const pl = r.yourPrice.toLowerCase()
                    const cls = pl === 'free' ? 'inv-price--free' : pl === 'included' ? 'inv-price--inc' : ''
                    return <tr key={`r${gi}-${ri}`} className="inv-feat__row"><td>{r.feature}</td><td>{r.systemValue}</td><td className={cls}>{r.yourPrice}</td></tr>
                  })
                ])}
                <tr className="inv-feat__tot"><td><strong>TOTAL</strong></td><td style={{ textAlign: 'right' }}>{sysTotal}</td><td style={{ textAlign: 'right' }}>{priceTotal}</td></tr>
              </tbody></table>
            </div>

            <div className="inv-opt">
              <div><div className="inv-opt__ttl">{d.optTitle}</div><div className="inv-opt__desc">{d.optDesc}</div></div>
              <div style={{ textAlign: 'right' }}><div className="inv-opt__price">{d.optPrice}</div><div className="inv-opt__note">{d.optNote}</div></div>
            </div>

            <div className="inv-div" />

            <div className="inv-invest">
              <div className="inv-invest__title">YOUR INVESTMENT</div>
              <div className="inv-invest__grid">
                <div className="inv-invest__col">
                  <div className="inv-invest__cl inv-invest__cl--b">FULL DELIVERED VALUE</div>
                  <div className="inv-invest__big">{d.fullValue}</div>
                  <div className="inv-invest__sl">YOU PAY</div>
                  <div className="inv-invest__sv">{d.youPay}</div>
                </div>
                <div className="inv-invest__col">
                  <div className="inv-invest__cl inv-invest__cl--o">DISCOUNT TERMS</div>
                  <div className="inv-invest__dt">{d.discountTitle}</div>
                  <div className="inv-invest__dd">{d.discountBody}</div>
                  <div className="inv-invest__dt">{d.discountTitle2}</div>
                  <div className="inv-invest__dd">{d.discountBody2}</div>
                </div>
                <div className="inv-invest__col">
                  <div className="inv-invest__cl inv-invest__cl--g">PAYMENT DETAILS</div>
                  {[['Mobile Money:', d.payMobile], ['Bank:', d.payBank], ['Account:', d.payAccount], ['Due by:', d.payDue]].map(([l, v]) => (
                    <div className="inv-invest__pr" key={l}><span className="inv-invest__pl">{l}</span><span className="inv-invest__pv">{v}</span></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="inv-spacer" />
            <div className="inv-foot">{d.footerText}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
