/**
 * AnalyticsSection — Comprehensive site visitor analytics dashboard.
 * All charts are vanilla Canvas/SVG — zero charting dependencies.
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { useAdminStore, adminActions, useEffectiveUser } from '../../store/useAdminStore'
import { resolveStaffName } from '../../utils/resolveStaffName'
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
/** Convert hex (#RRGGBB) or rgb() color to rgba with given alpha. */
function hexToRgba(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`)
  }
  return color
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
    const ctx = canvas.getContext('2d')
    if (!ctx) return
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
    const ctx = canvas.getContext('2d')
    if (!ctx) return
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
        try {
          ctx.lineTo(pad.left + cw, pad.top + ch)
          ctx.lineTo(pad.left, pad.top + ch)
          ctx.closePath()
          const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch)
          grad.addColorStop(0, hexToRgba(color, 0.15))
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad; ctx.fill()
        } catch { /* ignore gradient error */ }
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
    const ctx = canvas.getContext('2d')
    if (!ctx) return
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

  // Ghana reference townships for contextual labels
  const GHANA_TOWNSHIPS = [
    // Greater Accra
    { name: 'Accra CBD', lat: 5.555, lng: -0.197 },
    { name: 'Osu', lat: 5.556, lng: -0.178 },
    { name: 'Cantonments', lat: 5.573, lng: -0.175 },
    { name: 'Airport Res.', lat: 5.607, lng: -0.175 },
    { name: 'East Legon', lat: 5.635, lng: -0.160 },
    { name: 'Spintex', lat: 5.617, lng: -0.092 },
    { name: 'Tema', lat: 5.623, lng: -0.017 },
    { name: 'Madina', lat: 5.680, lng: -0.170 },
    { name: 'Kasoa', lat: 5.535, lng: -0.320 },
    { name: 'Dansoman', lat: 5.550, lng: -0.260 },
    { name: 'Achimota', lat: 5.617, lng: -0.225 },
    { name: 'Teshie', lat: 5.576, lng: -0.105 },
    { name: 'Nungua', lat: 5.583, lng: -0.075 },
    { name: 'Labone', lat: 5.563, lng: -0.182 },
    { name: 'Adenta', lat: 5.698, lng: -0.158 },
    { name: 'Dome', lat: 5.652, lng: -0.232 },
    { name: 'Haatso', lat: 5.663, lng: -0.208 },
    { name: 'Labadi', lat: 5.558, lng: -0.153 },
    { name: 'Sakumono', lat: 5.599, lng: -0.044 },
    { name: 'Ashaiman', lat: 5.691, lng: -0.040 },
    { name: 'Teshi-Nungua', lat: 5.577, lng: -0.092 },
    // Other regions
    { name: 'Kumasi', lat: 6.693, lng: -1.614 },
    { name: 'Takoradi', lat: 4.901, lng: -1.755 },
    { name: 'Cape Coast', lat: 5.109, lng: -1.247 },
    { name: 'Tamale', lat: 9.400, lng: -0.840 },
    { name: 'Sunyani', lat: 7.336, lng: -2.329 },
    { name: 'Ho', lat: 6.600, lng: 0.471 },
    { name: 'Koforidua', lat: 6.094, lng: -0.260 },
    { name: 'Wa', lat: 10.060, lng: -2.502 },
    { name: 'Bolgatanga', lat: 10.786, lng: -0.851 },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || locations.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth, h = canvas.clientHeight
    canvas.width = w * dpr; canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    // Map background
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h)

    // ── Dynamic bounds from actual data ──
    const lats = locations.map(l => l.lat).filter(v => v !== 0)
    const lngs = locations.map(l => l.lng).filter(v => v !== 0)
    if (lats.length === 0 || lngs.length === 0) return

    const dataLatMin = Math.min(...lats)
    const dataLatMax = Math.max(...lats)
    const dataLngMin = Math.min(...lngs)
    const dataLngMax = Math.max(...lngs)

    // Add 15% padding around data points (or minimum 0.02° to avoid zero-range)
    const latSpan = Math.max(dataLatMax - dataLatMin, 0.02)
    const lngSpan = Math.max(dataLngMax - dataLngMin, 0.02)
    const pad = 0.15
    const latMin = dataLatMin - latSpan * pad
    const latMax = dataLatMax + latSpan * pad
    const lngMin = dataLngMin - lngSpan * pad
    const lngMax = dataLngMax + lngSpan * pad

    // Coordinate transforms
    const toX = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * w
    const toY = (lat: number) => h - ((lat - latMin) / (latMax - latMin)) * h

    // ── Draw coast/water hint if in Greater Accra range ──
    if (latMin < 5.8 && latMax > 5.4 && lngMin < 0.1 && lngMax > -0.4) {
      ctx.strokeStyle = 'rgba(0,191,255,0.08)'; ctx.lineWidth = 1.5
      ctx.beginPath()
      const coastPoints = [
        { lat: 5.535, lng: -0.35 }, { lat: 5.540, lng: -0.25 }, { lat: 5.555, lng: -0.19 },
        { lat: 5.550, lng: -0.12 }, { lat: 5.560, lng: -0.05 }, { lat: 5.555, lng: 0.02 },
      ]
      coastPoints.forEach((p, i) => {
        const cx = toX(p.lng), cy = toY(p.lat)
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy)
      })
      ctx.stroke()
      // Water below
      ctx.fillStyle = 'rgba(0,191,255,0.015)'
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill()
    }

    // ── Reference township labels (only show those within current bounds) ──
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'
    GHANA_TOWNSHIPS.forEach(t => {
      if (t.lat < latMin || t.lat > latMax || t.lng < lngMin || t.lng > lngMax) return
      const tx = toX(t.lng), ty = toY(t.lat)
      // Don't draw if too close to a data point (avoid label overlap)
      const tooClose = locations.some(l => {
        const dx = toX(l.lng) - tx, dy = toY(l.lat) - ty
        return Math.sqrt(dx * dx + dy * dy) < 25
      })
      if (!tooClose) {
        ctx.fillText(t.name, tx, ty)
      }
    })

    // ── Plot visitor pins ──
    const maxCount = Math.max(...locations.map(l => l.count), 1)
    locations.forEach(loc => {
      const x = toX(loc.lng), y = toY(loc.lat)

      // Skip if still outside (shouldn't happen with dynamic bounds)
      if (x < -10 || x > w + 10 || y < -10 || y > h + 10) return

      const intensity = loc.count / maxCount
      const radius = 5 + intensity * 14

      // Glow
      try {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5)
        glow.addColorStop(0, `rgba(0,191,255,${0.2 + intensity * 0.3})`)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(x - radius * 2.5, y - radius * 2.5, radius * 5, radius * 5)
      } catch { /* gradient error */ }

      // Pin dot
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,191,255,${0.5 + intensity * 0.5})`
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,191,255,0.8)'; ctx.lineWidth = 1; ctx.stroke()

      // Count label
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'
      ctx.fillText(String(loc.count), x, y + 3)

      // City name below pin
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px system-ui'
      ctx.fillText(loc.city || '?', x, y + radius + 12)
    })

    // ── Zoom level indicator ──
    const kmSpan = latSpan * 111  // ~111 km per degree of latitude
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '9px system-ui'; ctx.textAlign = 'left'
    ctx.fillText(`~${Math.round(kmSpan)} km span`, 8, h - 8)

    // Hover handler
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      let found: typeof tooltip = null
      locations.forEach(loc => {
        const px = toX(loc.lng), py = toY(loc.lat)
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2)
        if (dist < 20) {
          found = { x: mx, y: my, text: `${loc.city}: ${loc.count} visit${loc.count !== 1 ? 's' : ''} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})` }
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
          background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(0,191,255,0.2)',
          borderRadius: 8, padding: '5px 12px', fontSize: 11, color: '#fff',
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
    const ctx = canvas.getContext('2d')
    if (!ctx) return
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
    try {
      const grad = ctx.createLinearGradient(0, 0, 0, 40)
      grad.addColorStop(0, hexToRgba(color, 0.15))
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad; ctx.fill()
    } catch { /* ignore gradient error */ }
  }, [values, color])

  return <canvas ref={canvasRef} className="an-kpi-sparkline" width={100} height={40} />
}


// ═══════════════════════════════════════════════════════════
// SALES / JOB ANALYTICS COMPONENT
// ═══════════════════════════════════════════════════════════
function SalesAnalytics({ callLogs, userEmail, userName }: { callLogs: any[]; userEmail?: string; userName?: string }) {
  const logs = userEmail ? callLogs.filter((l: any) => l.caller_email === userEmail) : callLogs
  const totalCalls = logs.length
  const meetingsBooked = logs.filter((l: any) => l.outcome === 'meeting_booked').length
  const conversionRate = totalCalls > 0 ? Math.round((meetingsBooked / totalCalls) * 100) : 0
  const totalDuration = logs.reduce((s: number, l: any) => s + (l.duration_seconds || 0), 0)
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0

  // Outcome distribution
  const outcomeCounts: Record<string, number> = {}
  logs.forEach((l: any) => { const o = l.outcome || 'unknown'; outcomeCounts[o] = (outcomeCounts[o] || 0) + 1 })
  const outcomeData = Object.entries(outcomeCounts).map(([label, value]) => ({ label: label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value }))
    .sort((a, b) => b.value - a.value)
  const outcomeColors = ['#00bfff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ff7a00']

  // Path usage
  const pathCounts: Record<string, number> = {}
  logs.forEach((l: any) => { const p = l.path_loaded || 'unknown'; pathCounts[p] = (pathCounts[p] || 0) + 1 })
  const pathData = Object.entries(pathCounts).sort((a, b) => b[1] - a[1])
  const pathMax = pathData.length > 0 ? pathData[0][1] : 1
  const pathLabels: Record<string, string> = {
    wc_receptionist: 'WC Receptionist', wc_decision_maker: 'WC Decision-Maker',
    bc_front_desk: 'BC Front Desk', bc_mr_cooper: 'BC Mr Cooper', bc_owner: 'BC Owner',
  }

  // Environment type breakdown
  const envCounts: Record<string, number> = {}
  logs.forEach((l: any) => { const e = l.environment_type || 'unknown'; envCounts[e] = (envCounts[e] || 0) + 1 })
  const envData = Object.entries(envCounts).map(([label, value]) => ({
    label: label === 'white_collar' ? 'White Collar' : label === 'blue_collar' ? 'Blue Collar' : label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value
  }))

  // Checklist completion average
  const withChecklist = logs.filter((l: any) => l.talking_points_total > 0)
  const avgChecklist = withChecklist.length > 0
    ? Math.round(withChecklist.reduce((s: number, l: any) => s + ((l.talking_points_checked?.length || 0) / l.talking_points_total) * 100, 0) / withChecklist.length)
    : 0

  // Daily trend (last 14 days)
  const now = new Date()
  const dailyCalls: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const count = logs.filter((l: any) => (l.call_start || l.created_at || '').startsWith(dateStr)).length
    dailyCalls.push({ date: dateStr, count })
  }

  return (
    <div className="analytics-dash">
      {userName && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-[#8b5cf6]/5 border border-[#8b5cf6]/10">
          <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/15 flex items-center justify-center text-xs font-bold text-[#8b5cf6]">
            {(userName || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{userName}</p>
            <p className="text-[10px] text-neutral-500">{userEmail}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="an-kpi-grid">
        <div className="an-kpi">
          <div className="an-kpi-label">Total Calls</div>
          <div className="an-kpi-value">{fmtNum(totalCalls)}</div>
          <div className="an-kpi-delta neutral">All time</div>
        </div>
        <div className="an-kpi">
          <div className="an-kpi-label">Meetings Booked</div>
          <div className="an-kpi-value">{meetingsBooked}</div>
          <div className={`an-kpi-delta ${meetingsBooked > 0 ? 'up' : 'neutral'}`}>
            {conversionRate}% conversion
          </div>
        </div>
        <div className="an-kpi">
          <div className="an-kpi-label">Avg Duration</div>
          <div className="an-kpi-value">{fmtDuration(avgDuration)}</div>
          <div className="an-kpi-delta neutral">Per call</div>
        </div>
        <div className="an-kpi">
          <div className="an-kpi-label">Checklist %</div>
          <div className="an-kpi-value">{avgChecklist}%</div>
          <div className="an-kpi-delta neutral">Avg completion</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="an-charts-grid">
        {/* Outcome Breakdown */}
        <div className="an-card">
          <div className="an-card-header">
            <div className="an-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Call Outcomes
            </div>
          </div>
          {outcomeData.length > 0
            ? <DonutChart data={outcomeData} colors={outcomeColors} />
            : <div className="an-empty"><div className="an-empty-text">No call data</div></div>
          }
        </div>

        {/* Environment Types */}
        <div className="an-card">
          <div className="an-card-header">
            <div className="an-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              Prospect Types
            </div>
          </div>
          {envData.length > 0
            ? <DonutChart data={envData} colors={['#00bfff', '#ff7a00', '#10b981']} />
            : <div className="an-empty"><div className="an-empty-text">No environment data</div></div>
          }
        </div>
      </div>

      {/* Call Paths */}
      <div className="an-card">
        <div className="an-card-header">
          <div className="an-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Call Guide Paths Used
          </div>
          <span className="an-card-badge" style={{ color: '#00bfff', background: 'rgba(0,191,255,0.1)' }}>{pathData.length} paths</span>
        </div>
        {pathData.length > 0 ? (
          <div>
            {pathData.map(([path, count], i) => (
              <div key={path} className="an-bar-row">
                <div className="an-bar-label">{pathLabels[path] || path}</div>
                <div className="an-bar-track">
                  <div className="an-bar-fill" style={{
                    width: `${(count / pathMax) * 100}%`,
                    background: outcomeColors[i % outcomeColors.length],
                  }} />
                </div>
                <div className="an-bar-value">{count}</div>
              </div>
            ))}
          </div>
        ) : <div className="an-empty"><div className="an-empty-text">No path data</div></div>}
      </div>

      {/* Daily Trend */}
      {dailyCalls.some(d => d.count > 0) && (
        <div className="an-card">
          <div className="an-card-header">
            <div className="an-card-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 6-6"/></svg>
              Calls (Last 14 Days)
            </div>
          </div>
          <Sparkline values={dailyCalls.map(d => d.count)} color="#00bfff" />
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AnalyticsSection() {
  const { analyticsData, callLogs: rawCallLogs, users } = useAdminStore()
  const effectiveUser = useEffectiveUser()
  const isGodMode = effectiveUser?.role === 'Godmode' || effectiveUser?.role === 'SuperAdmin'
  const [loading, setLoading] = useState(true)
  const [datePreset, setDatePreset] = useState<DatePreset>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [selectedStaffEmail, setSelectedStaffEmail] = useState<string>('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      let filters: Record<string, any> = {}
      if (datePreset === 'custom') {
        filters = { from_date: customFrom || undefined, to_date: customTo || undefined }
      } else {
        const range = getDateRange(datePreset)
        filters = { from_date: range.from, to_date: range.to }
      }
      if (isGodMode) await adminActions.loadAnalytics(filters)
      await adminActions.loadCallLogs({ page_size: 500 })
      await adminActions.loadUsers()
    } finally {
      setLoading(false)
    }
  }, [datePreset, customFrom, customTo, isGodMode])

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
      {isGodMode && (
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
      )}

      {loading && (
        <div className="an-loading"><div className="an-loading-spinner" /></div>
      )}

      {/* ═══ NON-GODMODE: Show only job analytics ═══ */}
      {!isGodMode && !loading && (
        <SalesAnalytics callLogs={rawCallLogs || []} userEmail={effectiveUser?.email} />
      )}

      {/* ═══ GODMODE: Site analytics + team job analytics ═══ */}
      {isGodMode && !loading && (
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
                        {j.device === 'phone' ? 'Phone' : j.device === 'tablet' ? 'Tablet' : 'Desktop'} 
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

          {/* ═══ TEAM JOB ANALYTICS (GodMode) ═══ */}
          <div className="an-card" style={{ marginTop: 16 }}>
            <div className="an-card-header">
              <div className="an-card-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Team Job Analytics
              </div>
              <select
                value={selectedStaffEmail}
                onChange={e => setSelectedStaffEmail(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, color: '#fff', padding: '4px 10px', fontSize: 11,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                <option value="">All Staff</option>
                {(users || []).filter((u: any) => u.status === 'Active' && u.role === 'Sales').map((u: any) => (
                  <option key={u.email} value={u.email}>{resolveStaffName(u.email)}</option>
                ))}
              </select>
            </div>
          </div>
          <SalesAnalytics
            callLogs={rawCallLogs || []}
            userEmail={selectedStaffEmail || undefined}
            userName={selectedStaffEmail ? resolveStaffName(selectedStaffEmail) : undefined}
          />
        </>
      )}
    </div>
  )
}
