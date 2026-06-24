import { useState, useRef, useEffect } from 'react'
import { resolveStaffName } from '../../utils/resolveStaffName'
import { adminActions } from '../../store/useAdminStore'
import { X, Search, Check, AlertTriangle, ExternalLink, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { personas } from '../../data/personaData'
import { ActionButton } from './ActionButton'
import './link-extractor.css'

const inputCls = 'le-field-input'

interface ExtractedData {
  name?: string
  company?: string
  email?: string
  phone?: string
  phone_alt?: string
  address?: string
  website?: string
  star_rating?: number
  review_count?: number
  opening_hours?: string
  business_category?: string
  gps_lat?: number
  gps_lng?: number
  google_maps_url?: string
  social_links?: string
  about?: string
  source?: string
  source_type?: string
  source_url?: string
}

interface DuplicateResult {
  isDuplicate: boolean
  existingClient: {
    client_id: string
    name: string
    company: string
    phone: string
    email: string
    address: string
    prospect_stage: string
    created_at: string
    added_by: string
  } | null
}

interface BulkResult {
  name: string
  address?: string
  star_rating?: number
  review_count?: number
  source?: string
}

interface Props {
  onClose: () => void
  onOpenClient?: (clientId: string) => void
}

/** SVG star for rating display */
function StarSVG({ filled = false, size = 14 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#2a2a3a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

/** Render star rating */
function StarRating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(<StarSVG key={i} filled={i <= Math.round(rating)} size={14} />)
  }
  return (
    <div className="le-rating">
      {stars}
      <span className="le-rating-value">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && <span className="le-review-count">({reviewCount.toLocaleString()} reviews)</span>}
    </div>
  )
}

/** Source type badge */
function SourceBadge({ sourceType }: { sourceType: string }) {
  const configs: Record<string, { label: string; cls: string }> = {
    google_maps: { label: 'Google Maps', cls: 'google-maps' },
    website: { label: 'Website', cls: 'website' },
    facebook: { label: 'Facebook', cls: 'facebook' },
    google_search: { label: 'Google Search', cls: 'google-search' },
  }
  const cfg = configs[sourceType] || configs.website
  return (
    <span className={`le-source-badge ${cfg.cls}`}>
      {sourceType === 'google_maps' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
      )}
      {sourceType === 'website' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
      )}
      {sourceType === 'facebook' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
      )}
      {sourceType === 'google_search' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      )}
      {cfg.label}
    </span>
  )
}

export default function LinkExtractor({ onClose, onOpenClient }: Props) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<'idle' | 'processing' | 'preview' | 'error' | 'manual'>('idle')
  const [extracted, setExtracted] = useState<ExtractedData>({})
  const [editData, setEditData] = useState<Record<string, string>>({})
  const [dupResult, setDupResult] = useState<DuplicateResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [, setBusySave] = useState(false)
  const [buyerProfile, setBuyerProfile] = useState('')

  // Bulk mode state
  const [bulkQuery, setBulkQuery] = useState('')
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set())
  const [bulkPhase, setBulkPhase] = useState<'idle' | 'searching' | 'results' | 'saving'>('idle')
  const [bulkMsg, setBulkMsg] = useState('')
  const [, setBusyBulkSave] = useState(false)
  const [bulkSaveProgress, setBulkSaveProgress] = useState(0)

  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'single' && phase === 'idle') urlRef.current?.focus()
  }, [mode, phase])

  // ── Single URL Extraction ──
  const handleExtract = async () => {
    const trimmed = url.trim()
    if (!trimmed) return

    setPhase('processing')
    setDupResult(null)
    setErrorMsg('')

    try {
      const result = await adminActions.extractFromUrl(trimmed)

      if (!result || !result.success) {
        setErrorMsg(result?.message || "Couldn't extract details from this link.")
        setExtracted(result?.extracted || {})
        setPhase('error')
        return
      }

      const data = result.extracted || {}
      setExtracted(data)

      // Pre-fill editable form
      setEditData({
        name: data.name || '',
        company: data.company || data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        website: data.website || '',
        opening_hours: data.opening_hours || '',
        business_category: data.business_category || '',
        about: data.about || '',
      })

      // Run dedup check
      if (data.phone || data.name) {
        const dupCheck = await adminActions.checkDuplicate({
          phone: data.phone,
          name: data.name,
          company: data.company || data.name,
        })
        if (dupCheck) setDupResult(dupCheck)
      }

      setPhase('preview')
    } catch {
      setErrorMsg("Couldn't extract details. The page may be down or structured differently.")
      setPhase('error')
    }
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleExtract() }
  }

  // Auto-extract on paste
  const handlePaste = () => {
    // Small delay to let the paste populate the input value
    setTimeout(() => {
      if (url.trim() || urlRef.current?.value.trim()) {
        setUrl(urlRef.current?.value || url)
        // Trigger extraction after a beat
        setTimeout(handleExtract, 100)
      }
    }, 50)
  }

  // ── Save Prospect ──
  const handleSave = async () => {
    if (!editData.name && !editData.company && !editData.email) return

    setBusySave(true)
    try {
      const payload: Record<string, any> = {
        name: editData.name || editData.company || '',
        company: editData.company || editData.name || '',
        email: editData.email || '',
        phone: editData.phone || '',
        address: editData.address || '',
        website: editData.website || '',
        industry: editData.business_category || '',
        source: extracted.source || 'Link Extraction',
        prospect_stage: 'prospect',
        buyer_profile: buyerProfile || '',
      }

      // Add extended fields
      if (extracted.star_rating) payload.star_rating = extracted.star_rating
      if (extracted.review_count) payload.review_count = extracted.review_count
      if (extracted.opening_hours || editData.opening_hours) payload.opening_hours = editData.opening_hours || extracted.opening_hours
      if (extracted.gps_lat) payload.gps_lat = extracted.gps_lat
      if (extracted.gps_lng) payload.gps_lng = extracted.gps_lng
      if (extracted.google_maps_url) payload.google_maps_url = extracted.google_maps_url
      if (extracted.social_links) payload.social_links = extracted.social_links
      if (editData.about) payload.notes = editData.about
      if (extracted.source_url) payload.extraction_source = extracted.source_url

      const ok = await adminActions.createClient(payload)
      if (ok) {
        // Reset and show success, then close or allow next
        setPhase('idle')
        setUrl('')
        setExtracted({})
        setEditData({})
        setDupResult(null)
        setBuyerProfile('')
        onClose()
      }
    } finally {
      setBusySave(false)
    }
  }

  // ── Manual Entry Fallback ──
  const showManualForm = () => {
    setPhase('manual')
    setEditData({
      name: extracted.name || '',
      company: extracted.company || extracted.name || '',
      email: extracted.email || '',
      phone: extracted.phone || '',
      address: extracted.address || '',
      website: extracted.website || '',
      opening_hours: '',
      business_category: '',
      about: '',
    })
  }

  // ── Bulk Search ──
  const handleBulkSearch = async () => {
    if (!bulkQuery.trim()) return
    setBulkPhase('searching')
    setBulkMsg('')

    try {
      const result = await adminActions.bulkSearch(bulkQuery.trim())
      if (!result || !result.success) {
        setBulkMsg(result?.message || 'No results found.')
        setBulkPhase('idle')
        return
      }

      setBulkResults(result.results || [])
      setBulkSelected(new Set((result.results || []).map((_: BulkResult, i: number) => i)))
      setBulkPhase('results')
      setBulkMsg(result.message || '')
    } catch {
      setBulkMsg('Search failed. Try a different query.')
      setBulkPhase('idle')
    }
  }

  const toggleBulkItem = (idx: number) => {
    setBulkSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleBulkSave = async () => {
    const toSave = bulkResults.filter((_, i) => bulkSelected.has(i))
    if (toSave.length === 0) return

    setBusyBulkSave(true)
    setBulkPhase('saving')
    setBulkSaveProgress(0)

    let saved = 0
    for (let i = 0; i < toSave.length; i++) {
      const item = toSave[i]
      try {
        await adminActions.createClient({
          name: item.name,
          company: item.name,
          address: item.address || '',
          source: 'Google Maps',
          prospect_stage: 'prospect',
          star_rating: item.star_rating || undefined,
          review_count: item.review_count || undefined,
        })
        saved++
      } catch { /* continue saving rest */ }
      setBulkSaveProgress(Math.round(((i + 1) / toSave.length) * 100))
    }

    setBusyBulkSave(false)
    setBulkMsg(`Saved ${saved} of ${toSave.length} prospects.`)
    setBulkPhase('idle')
    setBulkResults([])
    setBulkSelected(new Set())

    if (saved > 0) {
      // Give the user a moment to see the success message, then close
      setTimeout(() => onClose(), 1500)
    }
  }

  // ── RENDER ──
  return (
    <div className="le-overlay" onClick={onClose}>
      <motion.div
        className="le-container"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="le-header">
          <div>
            <h2>Search and Add</h2>
            <p className="le-header-sub">Paste a link or search Google Maps to add prospects instantly</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white cursor-pointer transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="le-mode-tabs">
          <button className={`le-mode-tab ${mode === 'single' ? 'active' : ''}`} onClick={() => setMode('single')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Paste Link
          </button>
          <button className={`le-mode-tab ${mode === 'bulk' ? 'active' : ''}`} onClick={() => setMode('bulk')}>
            <Search className="w-3.5 h-3.5" />
            Search and Add
          </button>
        </div>

        {/* Body */}
        <div className="le-body">
          <AnimatePresence mode="wait">
            {mode === 'single' ? (
              <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* ═══ IDLE — URL Input ═══ */}
                {phase === 'idle' && (
                  <div>
                    <div className="le-url-input-wrap">
                      <input
                        ref={urlRef}
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={handleUrlKeyDown}
                        onPaste={handlePaste}
                        className="le-url-input"
                        placeholder="Paste a Google Maps, website, or Facebook business link..."
                        autoFocus
                      />
                      <svg className="le-url-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                    <div className="le-actions" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <button className="le-btn secondary" onClick={onClose}>Cancel</button>
                      <button className="le-btn primary" onClick={handleExtract} disabled={!url.trim()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        Extract
                      </button>
                    </div>
                  </div>
                )}

                {/* ═══ PROCESSING ═══ */}
                {phase === 'processing' && (
                  <div className="le-processing">
                    <div className="le-processing-ring" />
                    <p className="le-processing-text">Extracting business details...</p>
                    <p className="le-processing-url">{url}</p>
                  </div>
                )}

                {/* ═══ PREVIEW — Extracted Data ═══ */}
                {phase === 'preview' && (
                  <div className="le-preview">
                    <div className="le-preview-header">
                      <h3 className="le-preview-name">{editData.name || editData.company || 'Unnamed Business'}</h3>
                      {extracted.source_type && <SourceBadge sourceType={extracted.source_type} />}
                    </div>

                    {/* Star Rating */}
                    {extracted.star_rating && (
                      <div style={{ marginBottom: 16 }}>
                        <StarRating rating={extracted.star_rating} reviewCount={extracted.review_count} />
                      </div>
                    )}

                    {/* GPS Badge */}
                    {extracted.gps_lat && extracted.gps_lng && (
                      <a
                        href={`https://www.google.com/maps?q=${extracted.gps_lat},${extracted.gps_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="le-gps-badge"
                        style={{ marginBottom: 16, display: 'inline-flex' }}
                      >
                        <MapPin className="w-3 h-3" />
                        {extracted.gps_lat.toFixed(4)}, {extracted.gps_lng.toFixed(4)}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    )}

                    {/* Editable Fields */}
                    <div className="le-fields">
                      <div className="le-field">
                        <label className="le-field-label">Business Name</label>
                        <input value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})}
                          className={`${inputCls} ${!editData.name ? 'empty' : ''}`} placeholder="Enter business name" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Phone</label>
                        <input value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})}
                          className={`${inputCls} ${!editData.phone ? 'empty' : ''}`} placeholder="Enter phone number" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Email</label>
                        <input type="email" value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})}
                          className={inputCls} placeholder="Enter email (optional)" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Website</label>
                        <input value={editData.website || ''} onChange={e => setEditData({...editData, website: e.target.value})}
                          className={inputCls} placeholder="Enter website (optional)" />
                      </div>
                      <div className="le-field full">
                        <label className="le-field-label">Address</label>
                        <input value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})}
                          className={`${inputCls} ${!editData.address ? 'empty' : ''}`} placeholder="Enter full address" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Business Category</label>
                        <input value={editData.business_category || ''} onChange={e => setEditData({...editData, business_category: e.target.value})}
                          className={inputCls} placeholder="e.g. Print Shop" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Opening Hours</label>
                        <input value={editData.opening_hours || ''} onChange={e => setEditData({...editData, opening_hours: e.target.value})}
                          className={inputCls} placeholder="e.g. Mon-Fri 8am-5pm" />
                      </div>
                    </div>

                    {/* Buyer Profile Selector */}
                    <div style={{ marginTop: 16 }}>
                      <p className="le-field-label" style={{ marginBottom: 8 }}>Buyer Profile (optional)</p>
                      <div className="le-persona-grid">
                        {personas.map(p => (
                          <button
                            key={p.id}
                            className={`le-persona-btn ${buyerProfile === p.id ? 'active' : ''}`}
                            onClick={() => setBuyerProfile(buyerProfile === p.id ? '' : p.id)}
                          >
                            {p.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duplicate Warning */}
                    {dupResult?.isDuplicate && dupResult.existingClient && (
                      <div className="le-duplicate">
                        <div className="le-duplicate-icon">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="le-duplicate-text">
                          <h4>Already in CRM</h4>
                          <p>
                            <strong>{dupResult.existingClient.name}</strong>
                            {dupResult.existingClient.company && ` — ${dupResult.existingClient.company}`}
                            {dupResult.existingClient.phone && ` · ${dupResult.existingClient.phone}`}
                            <br />
                            Stage: {dupResult.existingClient.prospect_stage?.replace(/_/g, ' ') || 'Unknown'}
                            {dupResult.existingClient.added_by && ` · Added by ${resolveStaffName(dupResult.existingClient.added_by)}`}
                          </p>
                          {onOpenClient && (
                            <button
                              className="le-duplicate-btn"
                              onClick={() => {
                                onOpenClient(dupResult.existingClient!.client_id)
                                onClose()
                              }}
                            >
                              <ExternalLink className="w-3 h-3" /> Open Existing Record
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="le-actions">
                      <button className="le-btn secondary" onClick={() => { setPhase('idle'); setUrl(''); setDupResult(null) }}>
                        Start Over
                      </button>
                      <ActionButton
                        onClick={handleSave}
                        busyText="Saving..."
                        disabled={dupResult?.isDuplicate || (!editData.name && !editData.company && !editData.email)}
                        className="le-btn primary"
                      >
                        <Check className="w-4 h-4" /> Save as Prospect
                      </ActionButton>
                    </div>
                  </div>
                )}

                {/* ═══ ERROR STATE ═══ */}
                {phase === 'error' && (
                  <div>
                    <div className="le-error">
                      <div className="le-error-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </div>
                      <p className="le-error-text">{errorMsg}</p>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="le-btn secondary" onClick={() => { setPhase('idle'); setUrl('') }}>
                          Try Different Link
                        </button>
                        <button className="le-btn primary" onClick={showManualForm}>
                          Add Manually
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ MANUAL ENTRY FALLBACK ═══ */}
                {phase === 'manual' && (
                  <div className="le-preview">
                    <div className="le-preview-header">
                      <h3 className="le-preview-name" style={{ fontSize: 16 }}>Manual Entry</h3>
                      <span className="le-source-badge website" style={{ fontSize: 9 }}>Manual</span>
                    </div>
                    <div className="le-fields">
                      <div className="le-field">
                        <label className="le-field-label">Business Name *</label>
                        <input value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})}
                          className={inputCls} placeholder="Business name" autoFocus />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Phone</label>
                        <input value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})}
                          className={inputCls} placeholder="Phone number" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Email</label>
                        <input type="email" value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})}
                          className={inputCls} placeholder="Email" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Website</label>
                        <input value={editData.website || ''} onChange={e => setEditData({...editData, website: e.target.value})}
                          className={inputCls} placeholder="Website URL" />
                      </div>
                      <div className="le-field full">
                        <label className="le-field-label">Address</label>
                        <input value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})}
                          className={inputCls} placeholder="Full address" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Industry / Category</label>
                        <input value={editData.business_category || ''} onChange={e => setEditData({...editData, business_category: e.target.value})}
                          className={inputCls} placeholder="e.g. Print Shop" />
                      </div>
                      <div className="le-field">
                        <label className="le-field-label">Source</label>
                        <input value={editData.about || ''} onChange={e => setEditData({...editData, about: e.target.value})}
                          className={inputCls} placeholder="e.g. Google Maps, Referral" />
                      </div>
                    </div>

                    {/* Buyer Profile */}
                    <div style={{ marginTop: 16 }}>
                      <p className="le-field-label" style={{ marginBottom: 8 }}>Buyer Profile (optional)</p>
                      <div className="le-persona-grid">
                        {personas.map(p => (
                          <button key={p.id} className={`le-persona-btn ${buyerProfile === p.id ? 'active' : ''}`}
                            onClick={() => setBuyerProfile(buyerProfile === p.id ? '' : p.id)}>
                            {p.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="le-actions">
                      <button className="le-btn secondary" onClick={() => { setPhase('idle'); setUrl('') }}>Back</button>
                      <ActionButton onClick={handleSave} busyText="Saving..."
                        disabled={!editData.name && !editData.company && !editData.email}
                        className="le-btn primary">
                        <Check className="w-4 h-4" /> Save as Prospect
                      </ActionButton>
                    </div>
                  </div>
                )}

              </motion.div>
            ) : (
              /* ═══════ BULK SEARCH MODE ═══════ */
              <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Search Input */}
                <div className="le-url-input-wrap">
                  <input
                    value={bulkQuery}
                    onChange={e => setBulkQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleBulkSearch() }}
                    className="le-url-input"
                    placeholder="e.g. print shops in Accra New Town"
                    autoFocus
                  />
                  <Search className="le-url-icon" style={{ width: 18, height: 18 }} />
                </div>

                {/* Search Button */}
                {bulkPhase === 'idle' && (
                  <div>
                    {bulkMsg && <p style={{ fontSize: 12, color: bulkMsg.includes('Saved') ? '#10b981' : '#64748b', marginBottom: 12, textAlign: 'center' }}>{bulkMsg}</p>}
                    <div className="le-actions" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                      <button className="le-btn secondary" onClick={onClose}>Cancel</button>
                      <button className="le-btn primary" onClick={handleBulkSearch} disabled={!bulkQuery.trim()}>
                        <Search className="w-4 h-4" /> Search Google Maps
                      </button>
                    </div>
                    <p style={{ fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 12 }}>
                      Results capped at 20 businesses per search
                    </p>
                  </div>
                )}

                {/* Searching */}
                {bulkPhase === 'searching' && (
                  <div className="le-processing">
                    <div className="le-processing-ring" />
                    <p className="le-processing-text">Searching Google Maps...</p>
                    <p className="le-processing-url">{bulkQuery}</p>
                  </div>
                )}

                {/* Results List */}
                {bulkPhase === 'results' && (
                  <div>
                    {bulkMsg && <p style={{ fontSize: 12, color: '#10b981', marginBottom: 12 }}>{bulkMsg}</p>}
                    <div className="le-bulk-list">
                      {bulkResults.map((item, idx) => (
                        <div
                          key={idx}
                          className={`le-bulk-item ${bulkSelected.has(idx) ? 'selected' : ''}`}
                          onClick={() => toggleBulkItem(idx)}
                        >
                          <div className={`le-bulk-checkbox ${bulkSelected.has(idx) ? 'checked' : ''}`}>
                            {bulkSelected.has(idx) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="le-bulk-info">
                            <p className="le-bulk-name">{item.name}</p>
                            {item.address && <p className="le-bulk-meta">{item.address}</p>}
                          </div>
                          {item.star_rating && item.star_rating > 0 && (
                            <div className="le-bulk-rating">
                              <StarSVG filled size={12} />
                              <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>{item.star_rating.toFixed(1)}</span>
                              {item.review_count !== undefined && item.review_count > 0 && (
                                <span style={{ fontSize: 10, color: '#64748b' }}>({item.review_count})</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="le-bulk-actions">
                      <div className="le-bulk-count">
                        {bulkSelected.size} of {bulkResults.length} selected
                        <button
                          onClick={() => {
                            if (bulkSelected.size === bulkResults.length) setBulkSelected(new Set())
                            else setBulkSelected(new Set(bulkResults.map((_, i) => i)))
                          }}
                          style={{ marginLeft: 8, fontSize: 11, color: '#00bfff', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {bulkSelected.size === bulkResults.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="le-btn secondary" onClick={() => { setBulkPhase('idle'); setBulkResults([]) }}>
                          Back
                        </button>
                        <ActionButton
                          onClick={handleBulkSave}
                          busyText={`Saving... ${bulkSaveProgress}%`}
                          disabled={bulkSelected.size === 0}
                          className="le-btn primary"
                        >
                          <Check className="w-4 h-4" /> Save {bulkSelected.size} Prospects
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                )}

                {/* Saving Progress */}
                {bulkPhase === 'saving' && (
                  <div className="le-processing">
                    <div className="le-processing-ring" />
                    <p className="le-processing-text">Saving prospects... {bulkSaveProgress}%</p>
                    <div style={{ width: '60%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${bulkSaveProgress}%`, height: '100%', background: 'linear-gradient(90deg, #00bfff, #10b981)', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
