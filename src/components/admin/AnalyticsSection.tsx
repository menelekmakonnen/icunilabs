/**
 * AnalyticsSection — Comprehensive site visitor analytics dashboard.
 * All charts are vanilla Canvas/SVG — zero charting dependencies.
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import './analytics.css'

// ── Helpers ───────────────────────────────────────────────
function fmtDuration(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m < 60 ? `${m}m ${sec}s` : `${Math.floor(m / 60)}h ${m % 60}m`
}
function fmtNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}
function pct(n: number, total: number): string {
  return total > 0 ? Math.round((n / total) * 100) + '%' : '0%'
}

// ── Date Filter Presets ───────────────────────────────────
type DatePreset = 'today' | '7d' | '30d' | '90d' | 'all' | 'custom'
function getDateRange(preset: DatePreset): { from: string | null; to: string | null } {
  const now = new Date()
  const iso = (d: Date) => d.toISOString().split('T')[0]
  switch (preset) {
    case 'today': return { from: iso(now), to: iso(now) }
    case '7d': { const d = new Date(now); d.setDate(d.getDate() - 7); return { from: iso(d), to: iso(now) } }
    case '30d': { const d = new Date(now); d.setDate(d.getDate() - 30); return { from: iso(d), to: iso(now) } }
    case '90d': { const d = new Date(now); d.setDate(d.getDate() - 90); return { from: iso(d), to: iso(now) } }
    case 'all': return { from: null, to: null }
    default: return { from: null, to: null }
  }
}

// ── Canvas Donut Chart ────────────────────────────────────
function DonutChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || total === 0) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = 160 * dpr; canvas.height = 160 * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, 160, 160)

    const cx = 80, cy = 80, r = 64, inner = 44
    let startAngle = -Math.PI / 2

    data.forEach((d, i) => {
      const slice = (d.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, r, startAngle, startAngle + slice)
      ctx.arc(cx, cy, inner, startAngle + slice, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()
      startAngle += slice
    })

    // Center text
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(total), cx, cy - 6)
    ctx.fillStyle = '#737373'
    ctx.font = '500 10px system-ui'
    ctx.fillText('SESSIONS', cx, cy + 12)
  }, [data, colors, total])

  return (
    <div className="an-donut-wrap">
      <canvas ref={canvasRef} className="an-donut-canvas" width={160} height={160} />
      <div className="an-donut-legend">
        {data.map((d, i) => (
          <div key={d.label} className="an-donut-legend-item">
            <div className="an-donut-legend-dot" style={{ background: colors[i % colors.length] }} />
            <span>{d.label}</span>
            <span className="an-donut-legend-count">{d.value}</span>
            <span className="an-donut-legend-pct">{pct(d.value, total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Canvas Trend Chart ────────────────────────────────────
function TrendChart({ data }: { data: { date: string; views: number; visitors: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth, h = canvas.clientHeight
    canvas.width = w * dpr; canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const pad = { top: 10, right: 10, bottom: 30, left: 40 }
    const cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom

    const maxViews = Math.max(...data.map(d => d.views), 1)
    const maxVisitors = Math.max(...data.map(d => d.visitors), 1)
    const maxVal = Math.max(maxViews, maxVisitors)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke()
      ctx.fillStyle = '#525252'; ctx.font = '10px system-ui'; ctx.textAlign = 'right'
      ctx.fillText(String(Math.round(maxVal - (maxVal / 4) * i)), pad.left - 6, y + 4)
    }

    // X-axis labels
    ctx.fillStyle = '#525252'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'
    const step = Math.max(1, Math.floor(data.length / 7))
    data.forEach((d, i) => {
      if (i % step === 0 || i === data.length - 1) {
        const x = pad.left + (i / (data.length - 1)) * cw
        ctx.fillText(d.date.slice(5), x, h - 6)
      }
    })

    // Draw line helper
    function drawLine(values: number[], color: string, fill: boolean) {
      ctx.beginPath()
      values.forEach((v, i) => {
        const x = pad.left + (i / (values.length - 1)) * cw
        const y = pad.top + ch - (v / maxVal) * ch
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke()

      if (fill) {
        ctx.lineTo(pad.left + cw, pad.top + ch)
        ctx.lineTo(pad.left, pad.top + ch)
        ctx.closePath()
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch)
        grad.addColorStop(0, color.replace(')', ',0.15)').replace('rgb', 'rgba'))
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad; ctx.fill()
      }
    }

    drawLine(data.map(d => d.views), 'rgb(0,191,255)', true)
    drawLine(data.map(d => d.visitors), 'rgb(139,92,246)', false)

    // Legend
    ctx.fillStyle = '#00bfff'; ctx.fillRect(pad.left, h - 18, 8, 3)
    ctx.fillStyle = '#737373'; ctx.font = '10px system-ui'; ctx.textAlign = 'left'
    ctx.fillText('Page Views', pad.left + 12, h - 14)
    ctx.fillStyle = '#8b5cf6'; ctx.fillRect(pad.left + 85, h - 18, 8, 3)
    ctx.fillText('Visitors', pad.left + 97, h - 14)
  }, [data])

  return <canvas ref={canvasRef} className="an-trend-canvas" />
}

// ── Canvas Heatmap ────────────────────────────────────────
function HeatmapCanvas({ clicks }: { clicks: { x: number; y: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || clicks.length === 0) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth, h = canvas.clientHeight
    canvas.width = w * dpr; canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    // Dark page background
    ctx.fillStyle = '#0f0f0f'
    ctx.fillRect(0, 0, w, h)

    // Page wireframe hint
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1
    ctx.strokeRect(w * 0.05, h * 0.03, w * 0.9, h * 0.08) // nav
    ctx.strokeRect(w * 0.05, h * 0.15, w * 0.9, h * 0.25) // hero
    ctx.strokeRect(w * 0.05, h * 0.45, w * 0.42, h * 0.2) // col 1
    ctx.strokeRect(w * 0.53, h * 0.45, w * 0.42, h * 0.2) // col 2
    ctx.strokeRect(w * 0.05, h * 0.7, w * 0.9, h * 0.15) // footer area

    // Draw heat points
    clicks.forEach(c => {
      const px = (c.x / 100) * w
      const py = (c.y / 100) * h
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, 20)
      gradient.addColorStop(0, 'rgba(255,60,60,0.35)')
      gradient.addColorStop(0.4, 'rgba(255,120,0,0.15)')
      gradient.addColorStop(1, 'rgba(255,120,0,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(px - 20, py - 20, 40, 40)
    })
  }, [clicks])

  return <canvas ref={canvasRef} className="an-heatmap-canvas" />
}

// ── Location Map ──────────────────────────────────────────
function LocationMap({ locations }: { locations: { city: string; lat: number; lng: number; count: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || locations.length === 0) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth, h = canvas.clientHeight
    canvas.width = w * dpr; canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    // Map background
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h)

    // Greater Accra rough boundaries: lat 5.5-5.75, lng -0.35 to 0.05
    const latMin = 5.48, latMax = 5.78, lngMin = -0.38, lngMax = 0.08

    // Draw coast line hint (southern edge of Accra)
    ctx.strokeStyle = 'rgba(0,191,255,0.1)'; ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, h * 0.82); ctx.quadraticCurveTo(w * 0.3, h * 0.78, w * 0.5, h * 0.8)
    ctx.quadraticCurveTo(w * 0.7, h * 0.83, w, h * 0.75)
    ctx.stroke()

    // Water fill below coastline
    ctx.fillStyle = 'rgba(0,191,255,0.02)'
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill()

    // District labels (approximate positions for Greater Accra)
    const districts = [
      { name: 'Accra CBD', lat: 5.555, lng: -0.197 },
      { name: 'Tema', lat: 5.623, lng: -0.017 },
      { name: 'East Legon', lat: 5.635, lng: -0.160 },
      { name: 'Airport', lat: 5.607, lng: -0.175 },
      { name: 'Osu', lat: 5.556, lng: -0.178 },
      { name: 'Spintex', lat: 5.617, lng: -0.092 },
      { name: 'Kasoa', lat: 5.535, lng: -0.320 },
      { name: 'Madina', lat: 5.680, lng: -0.170 },
    ]
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
    districts.forEach(d => {
      const x = ((d.lng - lngMin) / (lngMax - lngMin)) * w
      const y = h - ((d.lat - latMin) / (latMax - latMin)) * h
      ctx.fillText(d.name, x, y)
    })

    // Plot visitor pins
    const maxCount = Math.max(...locations.map(l => l.count), 1)
    locations.forEach(loc => {
      const x = ((loc.lng - lngMin) / (lngMax - lngMin)) * w
      const y = h - ((loc.lat - latMin) / (latMax - latMin)) * h

      // Skip if outside bounds
      if (x < 0 || x > w || y < 0 || y > h) {
        // Draw at nearest edge for out-of-Accra visitors
        return
      }

      const intensity = loc.count / maxCount
      const radius = 4 + intensity * 12

      // Glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5)
      glow.addColorStop(0, `rgba(0,191,255,${0.2 + intensity * 0.3})`)
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(x - radius * 2.5, y - radius * 2.5, radius * 5, radius * 5)

      // Pin dot
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,191,255,${0.5 + intensity * 0.5})`
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,191,255,0.8)'; ctx.lineWidth = 1; ctx.stroke()

      // Count label
      if (loc.count > 1) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(String(loc.count), x, y + 3)
      }
    })

    // Hover handler
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      let found: typeof tooltip = null
      locations.forEach(loc => {
        const x = ((loc.lng - lngMin) / (lngMax - lngMin)) * w
        const y = h - ((loc.lat - latMin) / (latMax - latMin)) * h
        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
        if (dist < 20) {
          found = { x: mx, y: my, text: `${loc.city}: ${loc.count} visits` }
        }
      })
      setTooltip(found)
    }
    canvas.addEventListener('mousemove', handleMove)
    return () => canvas.removeEventListener('mousemove', handleMove)
  }, [locations])

  return (
    <div className="an-map-wrap">
      <canvas ref={canvasRef} className="an-map-canvas" />
      {locations.length === 0 && <div className="an-map-empty">No location data yet</div>}
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x + 12, top: tooltip.y - 8,
          background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#fff',
          fontWeight: 600, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5,
        }}>{tooltip.text}</div>
      )}
    </div>
  )
}

// ── Sparkline (mini inline chart) ─────────────────────────
function Sparkline({ values, color = '#00bfff' }: { values: number[]; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || values.length < 2) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = 100 * dpr; canvas.height = 40 * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, 100, 40)

    const max = Math.max(...values, 1)
    ctx.beginPath()
    values.forEach((v, i) => {
      const x = (i / (values.length - 1)) * 100
      const y = 38 - (v / max) * 34
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke()

    // Fill
    ctx.lineTo(100, 38); ctx.lineTo(0, 38); ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, 40)
    grad.addColorStop(0, color.replace(')', ',0.15)').replace('rgb', 'rgba').replace('#', ''))
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad; ctx.fill()
  }, [values, color])

  return <canvas ref={canvasRef} className="an-kpi-sparkline" width={100} height={40} />
}


// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AnalyticsSection() {
  const { analyticsData } = useAdminStore()
  const [loading, setLoading] = useState(true)
  const [datePreset, setDatePreset] = useState<DatePreset>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedPage, setSelectedPage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    let filters: Record<string, any> = {}
    if (datePreset === 'custom') {
      filters = { from_date: customFrom || undefined, to_date: customTo || undefined }
    } else {
      const range = getDateRange(datePreset)
      filters = { from_date: range.from, to_date: range.to }
    }
    await adminActions.loadAnalytics(filters)
    setLoading(false)
  }, [datePreset, customFrom, customTo])

  useEffect(() => { loadData() }, [loadData])

  const d = analyticsData || {}
  const summary = d.summary || {}
  const trend = d.daily_trend || []
  const pagePerf = d.page_performance || []
  const devices = d.devices || {}
  const locations = d.locations || []
  const referrers = d.referrers || []
  const clickMaps = d.click_maps || {}
  const journeys = d.journeys || []
  const browsers = d.browsers || {}
  const oses = d.oses || {}

  // Build trend sparkline values
  const trendViews = trend.map((t: any) => t.views || 0)
  const trendVisitors = trend.map((t: any) => t.visitors || 0)

  // Device chart data
  const deviceData = [
    { label: 'Desktop', value: devices.desktop || 0 },
    { label: 'Phone', value: devices.phone || 0 },
    { label: 'Tablet', value: devices.tablet || 0 },
  ].filter(d => d.value > 0)
  const deviceColors = ['#00bfff', '#8b5cf6', '#ff7a00']

  // Browser chart data
  const browserData = Object.keys(browsers).map(k => ({ label: k, value: browsers[k] }))
    .sort((a, b) => b.value - a.value)
  const browserColors = ['#00bfff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#737373']

  // Referrer bar max
  const refMax = referrers.length > 0 ? referrers[0].count : 1
  const refColors = ['#00bfff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ff7a00', '#06b6d4', '#a855f7']

  // Heatmap clicks for selected page
  const selectedClicks = selectedPage && clickMaps[selectedPage]
    ? clickMaps[selectedPage].map((c: any) => ({ x: c.x, y: c.y }))
    : []

  return (
    <div className="analytics-dash">
      {/* ── Filter Bar ─────────────────────────────── */}
      <div className="an-filter-bar">
        <select value={datePreset} onChange={e => setDatePreset(e.target.value as DatePreset)}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
          <option value="custom">Custom Range</option>
        </select>
        {datePreset === 'custom' && (
          <>
            <div className="an-filter-sep" />
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <span style={{ color: '#525252', fontSize: 12 }}>to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={loadData}
            style={{
              background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.2)',
              borderRadius: 8, color: '#00bfff', padding: '6px 16px', fontSize: 12,
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,191,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,191,255,0.1)' }}
          >↻ Refresh</button>
        </div>
      </div>

      {loading && (
        <div className="an-loading"><div className="an-loading-spinner" /></div>
      )}

      {!loading && (
        <>
          {/* ── KPI Hero Cards ───────────────────────── */}
          <div className="an-kpi-grid">
            <div className="an-kpi">
              <div className="an-kpi-label">Visitors</div>
              <div className="an-kpi-value">{fmtNum(summary.total_visitors || 0)}</div>
              <div className="an-kpi-delta neutral">Unique sessions</div>
              {trendVisitors.length > 1 && <Sparkline values={trendVisitors} color="#8b5cf6" />}
            </div>
            <div className="an-kpi">
              <div className="an-kpi-label">Page Views</div>
              <div className="an-kpi-value">{fmtNum(summary.total_page_views || 0)}</div>
              <div className="an-kpi-delta neutral">Total navigations</div>
              {trendViews.length > 1 && <Sparkline values={trendViews} />}
            </div>
            <div className="an-kpi">
              <div className="an-kpi-label">Avg Session</div>
              <div className="an-kpi-value">{fmtDuration(summary.avg_session_duration || 0)}</div>
              <div className="an-kpi-delta neutral">Time on site</div>
            </div>
            <div className="an-kpi">
              <div className="an-kpi-label">Bounce Rate</div>
              <div className="an-kpi-value">{summary.bounce_rate || 0}%</div>
              <div className={`an-kpi-delta ${(summary.bounce_rate || 0) > 60 ? 'down' : 'up'}`}>
                {(summary.bounce_rate || 0) > 60 ? '↑ High' : '↓ Healthy'}
              </div>
            </div>
            <div className="an-kpi">
              <div className="an-kpi-label">Pages / Session</div>
              <div className="an-kpi-value">{summary.pages_per_session || 0}</div>
              <div className="an-kpi-delta neutral">Avg depth</div>
            </div>
          </div>

          {/* ── Daily Trend ──────────────────────────── */}
          {trend.length > 1 && (
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 6-6"/></svg>
                  Traffic Trend
                </div>
              </div>
              <TrendChart data={trend} />
            </div>
          )}

          {/* ── Charts Row: Devices + Referrers ──────── */}
          <div className="an-charts-grid">
            {/* Device Breakdown */}
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                  Devices
                </div>
              </div>
              {deviceData.length > 0
                ? <DonutChart data={deviceData} colors={deviceColors} />
                : <div className="an-empty"><div className="an-empty-text">No device data</div></div>
              }
            </div>

            {/* Referral Sources */}
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Referral Sources
                </div>
              </div>
              {referrers.length > 0 ? (
                <div>
                  {referrers.slice(0, 8).map((r: any, i: number) => (
                    <div key={r.source} className="an-bar-row">
                      <div className="an-bar-label">{r.source}</div>
                      <div className="an-bar-track">
                        <div className="an-bar-fill" style={{
                          width: `${(r.count / refMax) * 100}%`,
                          background: refColors[i % refColors.length],
                        }} />
                      </div>
                      <div className="an-bar-value">{r.count}</div>
                    </div>
                  ))}
                </div>
              ) : <div className="an-empty"><div className="an-empty-text">No referral data</div></div>}
            </div>
          </div>

          {/* ── Charts Row: Browsers + OS ────────────── */}
          <div className="an-charts-grid">
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10"/></svg>
                  Browsers
                </div>
              </div>
              {browserData.length > 0
                ? <DonutChart data={browserData} colors={browserColors} />
                : <div className="an-empty"><div className="an-empty-text">No browser data</div></div>
              }
            </div>

            {/* Location Map */}
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Visitor Locations
                </div>
                <span className="an-card-badge" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>{locations.length} areas</span>
              </div>
              <LocationMap locations={locations} />
            </div>
          </div>

          {/* ── Page Performance Table ────────────────── */}
          <div className="an-card">
            <div className="an-card-header">
              <div className="an-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Page Performance
              </div>
              <span className="an-card-badge" style={{ color: '#00bfff', background: 'rgba(0,191,255,0.1)' }}>{pagePerf.length} pages</span>
            </div>
            {pagePerf.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="an-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th className="num">Views</th>
                      <th className="num">Visitors</th>
                      <th className="num">Avg Time</th>
                      <th className="num">Scroll %</th>
                      <th>Heatmap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagePerf.slice(0, 20).map((p: any) => (
                      <tr key={p.page}>
                        <td className="page-name" title={p.page}>{p.page}</td>
                        <td className="num highlight">{p.views}</td>
                        <td className="num">{p.unique_visitors}</td>
                        <td className="num">{fmtDuration(p.avg_time || 0)}</td>
                        <td className="num">{p.avg_scroll || 0}%</td>
                        <td>
                          {clickMaps[p.page] ? (
                            <button
                              onClick={() => setSelectedPage(selectedPage === p.page ? null : p.page)}
                              style={{
                                background: selectedPage === p.page ? 'rgba(255,122,0,0.1)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${selectedPage === p.page ? 'rgba(255,122,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                                color: selectedPage === p.page ? '#ff7a00' : '#737373',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                            >{selectedPage === p.page ? 'Hide' : 'View'}</button>
                          ) : <span style={{ color: '#2a2a2a', fontSize: 10 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="an-empty"><div className="an-empty-text">No page data yet</div></div>}
          </div>

          {/* ── Click Heatmap (when page selected) ──── */}
          {selectedPage && selectedClicks.length > 0 && (
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 15l-2 5L9 9l11 4-5 2z"/></svg>
                  Click Heatmap — {selectedPage}
                </div>
                <span className="an-card-badge" style={{ color: '#ff7a00', background: 'rgba(255,122,0,0.1)' }}>{selectedClicks.length} clicks</span>
              </div>
              <div className="an-heatmap-wrap">
                <HeatmapCanvas clicks={selectedClicks} />
              </div>
            </div>
          )}

          {/* ── Visitor Journeys ──────────────────────── */}
          <div className="an-card">
            <div className="an-card-header">
              <div className="an-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Visitor Journeys
              </div>
              <span className="an-card-badge" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}>{journeys.length} sessions</span>
            </div>
            {journeys.length > 0 ? (
              <div className="an-journey-list">
                {journeys.map((j: any, i: number) => (
                  <div key={i} className="an-journey-row">
                    <div className="an-journey-meta">
                      <div className="an-journey-meta-device" style={{
                        color: j.device === 'phone' ? '#8b5cf6' : j.device === 'tablet' ? '#ff7a00' : '#00bfff'
                      }}>
                        {j.device === 'phone' ? '📱' : j.device === 'tablet' ? '📋' : '💻'} {j.device}
                      </div>
                      {j.city && <div className="an-journey-meta-city">{j.city}</div>}
                    </div>
                    <div className="an-journey-flow">
                      {(j.pages || []).map((page: string, pi: number) => (
                        <span key={pi}>
                          {pi > 0 && <span className="an-journey-arrow">→</span>}
                          <span className="an-journey-page">{page}</span>
                        </span>
                      ))}
                    </div>
                    <div className="an-journey-duration">{fmtDuration(j.duration || 0)}</div>
                  </div>
                ))}
              </div>
            ) : <div className="an-empty"><div className="an-empty-text">No journey data yet</div></div>}
          </div>

          {/* ── OS Breakdown ──────────────────────────── */}
          {Object.keys(oses).length > 0 && (
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                  Operating Systems
                </div>
              </div>
              <div>
                {Object.entries(oses as Record<string, number>)
                  .sort((a, b) => b[1] - a[1])
                  .map(([os, count], i) => {
                    const osMax = Math.max(...Object.values(oses as Record<string, number>))
                    return (
                      <div key={os} className="an-bar-row">
                        <div className="an-bar-label">{os}</div>
                        <div className="an-bar-track">
                          <div className="an-bar-fill" style={{
                            width: `${(count / osMax) * 100}%`,
                            background: browserColors[i % browserColors.length],
                          }} />
                        </div>
                        <div className="an-bar-value">{count}</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* ── Total Events Footer ──────────────────── */}
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#2a2a2a', fontSize: 11 }}>
            {d.total_events || 0} total events tracked
          </div>
        </>
      )}
    </div>
  )
}
