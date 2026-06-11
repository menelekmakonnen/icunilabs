/**
 * Admin Store — Reactive state for the Super Admin dashboard.
 * Uses the same pub/sub pattern as usePortalStore.ts.
 * Only Godmode/AssistantGodmode roles can access.
 */

import { useSyncExternalStore } from 'react'

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

export interface AdminUser {
  name: string
  email: string
  company_email?: string
  role: string
  job_title?: string
  permissions?: Record<string, boolean>
  profile_pic_url?: string
  cover_image_url?: string
}

interface AdminState {
  // Auth
  token: string | null
  user: AdminUser | null
  loading: boolean
  error: string | null
  otpSent: boolean
  loginMethod: 'otp' | 'password' | 'pin'

  // Active section
  activeSection: string

  // Data caches
  users: any[]
  clients: any[]
  projects: any[]
  invoices: any[]
  jobs: any[]
  applications: any[]
  referrers: any[]
  referrals: any[]
  referrerMaterials: any[]
  referrerNotifications: any[]
  actingAs: string | null  // 'client' | 'referrer' | 'staff' | null
  impersonating: any | null  // specific user object or null
  logs: any[]
  slaStatuses: any[]
  slaCosts: any[]
  slaConfig: any
  callFollowUpSLA: any[]
  slaNotifications: any[]
  blogPosts: any[]
  portfolio: any[]

  // Detail views
  activeInvoiceHTML: string | null
  activeInvoice: any | null

  // CRM
  activeClient: any | null
  clientActivity: any[]

  // Call Logs
  callLogs: any[]
  callAnalytics: any | null
  competitorIntel: any[]

  // Meetings
  meetings: any[]

  // ICUNI Ecosystem
  projectRegistry: any[]
  impersonationToken: string | null

  // Email Hub
  inbox: any[]
  inboxLoading: boolean
  activeThread: any | null
  emailAliases: any[]
  emailTemplates: any[]
  // Floating Call Bubble
  floatingCall: { client: any; callStartTime: number; paused: boolean; callGuideState?: any } | null
  // Analytics
  analyticsData: any | null
  // Cache timestamps (ms)
  _cache: Record<string, number>
}

async function apiPost(action: string, payload: Record<string, any> = {}): Promise<any> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...payload }),
  })
  const text = await res.text()
  const data = JSON.parse(text)
  if (data.status && data.status >= 400) throw new Error(data.message || 'Request failed')
  return data.data
}

// ─── STAGE PERSISTENCE (localStorage fallback) ───────────────
// Short-lived overrides (30s) to bridge the gap between an optimistic
// UI update and the next server fetch. Never fights the server long-term.
const STAGE_KEY = 'icuni_stage_overrides'
function getStageOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    const now = Date.now()
    const clean: Record<string, string> = {}
    for (const [k, v] of Object.entries(data)) {
      const entry = v as { stage: string; ts: number }
      if (now - entry.ts < 30000) clean[k] = entry.stage // 30s TTL
    }
    return clean
  } catch { /* ignored */ return {} }
}
function saveStageOverride(clientId: string, stage: string) {
  try {
    const raw = localStorage.getItem(STAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data[clientId] = { stage, ts: Date.now() }
    localStorage.setItem(STAGE_KEY, JSON.stringify(data))
  } catch { /* non-critical */ }
}
function removeStageOverride(clientId: string) {
  try {
    const raw = localStorage.getItem(STAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    delete data[clientId]
    localStorage.setItem(STAGE_KEY, JSON.stringify(data))
  } catch { /* non-critical */ }
}

// ─── OPTIMISTIC SESSION CACHE ─────────────────────────────
// Cache user data alongside the token so returning users see the dashboard instantly
// while the background validation confirms the session is still valid.
function getCachedUser(): any {
  try {
    const raw = localStorage.getItem('icuni_admin_user')
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}
function setCachedUser(user: any) {
  try {
    if (user) localStorage.setItem('icuni_admin_user', JSON.stringify(user))
    else localStorage.removeItem('icuni_admin_user')
  } catch { /* non-critical */ }
}

// ─── TOKEN PERSISTENCE (7-day expiry) ─────────────────────
// The token is stored alongside a timestamp; stored auth older than
// 7 days is cleared on restore so stale sessions don't linger forever.
const ADMIN_TOKEN_KEY = 'icuni_admin_token'
const ADMIN_TOKEN_TS_KEY = 'icuni_admin_token_ts'
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function storeToken(token: string) {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token)
    localStorage.setItem(ADMIN_TOKEN_TS_KEY, String(Date.now()))
  } catch { /* non-critical */ }
}
function clearStoredToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_TOKEN_TS_KEY)
  } catch { /* non-critical */ }
}
function isStoredTokenExpired(): boolean {
  try {
    const ts = Number(localStorage.getItem(ADMIN_TOKEN_TS_KEY) || 0)
    if (!ts) {
      // Legacy token stored before timestamps existed — stamp it now so it
      // expires 7 days from today instead of forcing an immediate re-login.
      if (localStorage.getItem(ADMIN_TOKEN_KEY)) localStorage.setItem(ADMIN_TOKEN_TS_KEY, String(Date.now()))
      return false
    }
    return Date.now() - ts > TOKEN_MAX_AGE_MS
  } catch { return false }
}
function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) return null
    if (isStoredTokenExpired()) {
      clearStoredToken()
      setCachedUser(null)
      return null
    }
    return token
  } catch { return null }
}

// Singleton store
let state: AdminState = {
  token: getStoredToken(),
  user: getCachedUser(),
  loading: false,
  error: null,
  otpSent: false,
  loginMethod: 'otp',
  activeSection: 'dashboard',
  users: [],
  clients: [],
  projects: [],
  invoices: [],
  jobs: [],
  applications: [],
  referrers: [],
  referrals: [],
  referrerMaterials: [],
  referrerNotifications: [],
  actingAs: null,
  impersonating: null,
  logs: [],
  slaStatuses: [],
  slaCosts: [],
  slaConfig: null,
  callFollowUpSLA: [],
  slaNotifications: [],
  blogPosts: [],
  portfolio: [],
  activeInvoiceHTML: null,
  activeInvoice: null,
  activeClient: null,
  clientActivity: [],
  callLogs: [],
  callAnalytics: null,
  competitorIntel: [],
  meetings: [],
  projectRegistry: [],
  impersonationToken: null,
  inbox: [],
  inboxLoading: false,
  activeThread: null,
  emailAliases: [],
  emailTemplates: [],
  floatingCall: null,
  analyticsData: null,
  _cache: {},
}

const listeners = new Set<() => void>()

function setState(partial: Partial<AdminState>) {
  state = { ...state, ...partial }
  listeners.forEach(l => l())
}

export function getAdminState() { return state }
export function subscribeAdmin(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useAdminStore() {
  return useSyncExternalStore(subscribeAdmin, getAdminState)
}

/** Returns the impersonated user when active, otherwise the logged-in user.
 *  Use for data scoping (whose calls/clients to show) and UI visibility (role-based views).
 *  For write permissions and destructive actions, use `useAdminStore().user` instead. */
export function useEffectiveUser() {
  const { user, impersonating } = useAdminStore()
  return impersonating || user
}

const ALLOWED_ROLES = ['Godmode', 'SuperAdmin', 'Admin', 'Sales', 'Product']

export const adminActions = {
  setError: (error: string | null) => setState({ error }),
  setSection: (section: string) => setState({ activeSection: section, error: null }),
  setLoginMethod: (method: 'otp' | 'password' | 'pin') => setState({ loginMethod: method }),

  // ── Floating Call Bubble ──
  minimiseCall: (client: any, callStartTime: number, callGuideState?: any) =>
    setState({ floatingCall: { client, callStartTime, paused: false, callGuideState } }),
  pauseCall: () => {
    if (state.floatingCall) setState({ floatingCall: { ...state.floatingCall, paused: true } })
  },
  resumeCall: () => {
    if (state.floatingCall) setState({ floatingCall: { ...state.floatingCall, paused: false } })
  },
  endCall: () => setState({ floatingCall: null }),

  // ── Auth ──
  sendOTP: async (email: string) => {
    setState({ loading: true, error: null, otpSent: false })
    try {
      await apiPost('sendOTP', { email })
      setState({ otpSent: true, loading: false })
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  verifyOTP: async (email: string, otp: string, rememberMe?: boolean) => {
    setState({ loading: true, error: null })
    try {
      const session = await apiPost('verifyOTP', { email, otp, rememberMe })
      if (!ALLOWED_ROLES.includes(session.user?.role)) {
        setState({ error: 'Access denied. Admin privileges required.', loading: false })
        return
      }
      setState({ token: session.token, user: session.user, loading: false })
      storeToken(session.token)
      setCachedUser(session.user)
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  passwordLogin: async (email: string, password: string, rememberMe?: boolean) => {
    setState({ loading: true, error: null })
    try {
      const session = await apiPost('passwordLogin', { identifier: email, password, rememberMe })
      if (!ALLOWED_ROLES.includes(session.user?.role)) {
        setState({ error: 'Access denied. Admin privileges required.', loading: false })
        return
      }
      setState({ token: session.token, user: session.user, loading: false })
      storeToken(session.token)
      setCachedUser(session.user)
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  pinLogin: async (email: string, pin: string, rememberMe?: boolean) => {
    setState({ loading: true, error: null })
    try {
      const session = await apiPost('pinLogin', { identifier: email, pin, rememberMe })
      if (!ALLOWED_ROLES.includes(session.user?.role)) {
        setState({ error: 'Access denied. Admin privileges required.', loading: false })
        return
      }
      setState({ token: session.token, user: session.user, loading: false })
      storeToken(session.token)
      setCachedUser(session.user)
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  validateSession: async () => {
    const { token } = state
    if (!token) return
    // Hard-expire stored sessions older than 7 days regardless of server state
    if (isStoredTokenExpired()) {
      setState({ token: null, user: null, loading: false })
      clearStoredToken()
      setCachedUser(null)
      return
    }
    // Don't set loading:true — allow optimistic rendering with cached user data
    try {
      const result = await apiPost('validateSession', { token })
      if (!ALLOWED_ROLES.includes(result.user?.role)) {
        setState({ token: null, user: null, loading: false })
        clearStoredToken()
        setCachedUser(null)
        return
      }
      // Merge over cached user — validateSession returns a slim session object
      // (no permissions/job_title/profile_pic_url). A raw overwrite wiped
      // permission-based nav filtering on every page refresh.
      const cached = getCachedUser() || {}
      const merged = { ...cached, ...result.user }
      // Deep merge permissions specifically
      if (cached.permissions && result.user?.permissions) {
        merged.permissions = { ...cached.permissions, ...result.user.permissions }
      } else if (cached.permissions && !result.user?.permissions) {
        merged.permissions = cached.permissions
      }
      setState({ user: merged, loading: false })
      setCachedUser(merged)
    } catch {
      setState({ token: null, user: null, loading: false })
      clearStoredToken()
      setCachedUser(null)
    }
  },

  logout: () => {
    const { token, impersonationToken } = state
    // End any active impersonation session server-side before logging out
    if (token && impersonationToken) apiPost('endImpersonation', { token, impersonationToken }).catch(() => {})
    if (token) apiPost('logout', { token }).catch(() => {})
    setState({
      token: null, user: null, otpSent: false, activeSection: 'dashboard',
      impersonating: null, impersonationToken: null, actingAs: null, floatingCall: null,
    })
    clearStoredToken()
    setCachedUser(null)
  },

  // ── Password & PIN ──
  setPassword: async (newPassword: string) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('setPassword', { token: state.token, new_password: newPassword })
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  setPin: async (pin: string) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('setPin', { token: state.token, pin })
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  // ── Data Loading ──
  loadUsers: async () => {
    try {
      const users = await apiPost('getUsers', { token: state.token })
      setState({ users: users || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadClients: async () => {
    try {
      const clients = await apiPost('getClients', { token: state.token })
      const raw = clients || []

      // Debug: log prospect_stage values from server
      if (raw.length > 0) {
        const stageSample = raw.slice(0, 8).map((c: any) => `${(c.name||'?').substring(0,12)}=${c.prospect_stage || '(empty)'}`)
        console.log('[CRM] Server stages:', stageSample.join(', '))
      }

      // Apply very recent (<30s) localStorage overrides to bridge optimistic gap.
      // After 30s, server data is always trusted as ground truth.
      const overrides = getStageOverrides()
      const overrideCount = Object.keys(overrides).length
      const merged = overrideCount > 0
        ? raw.map((c: any) => overrides[c.client_id]
            ? { ...c, prospect_stage: overrides[c.client_id] }
            : c)
        : raw
      if (overrideCount > 0) console.log('[CRM] Applied', overrideCount, 'recent overrides')

      setState({ clients: merged })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadProjects: async () => {
    try {
      const projects = await apiPost('getProjects', { token: state.token })
      setState({ projects: projects || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadInvoices: async () => {
    try {
      const invoices = await apiPost('getInvoices', { token: state.token })
      setState({ invoices: invoices || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadJobs: async () => {
    try {
      const jobs = await apiPost('getJobListings', { token: state.token })
      setState({ jobs: jobs || [] })
    } catch (err: any) {
      console.warn('[Careers] Failed to load live job listings — static fallback will be shown:', err)
      setState({ error: err.message })
    }
  },

  loadApplications: async () => {
    try {
      const apps = await apiPost('getJobApplications', { token: state.token })
      setState({ applications: apps || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadReferrals: async () => {
    try {
      const [referrers, referrals] = await Promise.all([
        apiPost('getReferrers', { token: state.token }).catch(() => []),
        apiPost('getReferrals', { token: state.token }).catch(() => []),
      ])
      setState({ referrers: referrers || [], referrals: referrals || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  // ── Referrer Materials CRUD ──
  loadMaterials: async () => {
    try {
      const materials = await apiPost('getReferrerMaterials', { token: state.token })
      setState({ referrerMaterials: materials || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  createMaterial: async (data: Record<string, any>): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('createReferrerMaterial', { token: state.token, ...data })
      await adminActions.loadMaterials()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  updateMaterial: async (data: Record<string, any>): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('updateReferrerMaterial', { token: state.token, ...data })
      await adminActions.loadMaterials()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  deleteMaterial: async (materialId: string): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('deleteReferrerMaterial', { token: state.token, materialId })
      await adminActions.loadMaterials()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  // ── Referral Pipeline Management ──
  advanceReferralStage: async (referralId: string, newStage: number): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('advanceReferralStage', { token: state.token, referralId, newStage })
      await adminActions.loadReferrals()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  closeReferral: async (referralId: string, outcome: 'won' | 'lost', dealValue?: number): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('closeReferral', { token: state.token, referralId, outcome, dealValue })
      await adminActions.loadReferrals()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  confirmPayout: async (referralId: string): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('confirmReferralPayout', { token: state.token, referralId })
      await adminActions.loadReferrals()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  // ── Referrer Notifications ──
  sendReferrerNotification: async (referrerId: string, type: string, message: string, referralId?: string): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('sendReferrerNotification', { token: state.token, referrerId, type, message, referralId })
      await adminActions.loadReferrerNotifications()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  loadReferrerNotifications: async () => {
    try {
      const notifications = await apiPost('getReferrerNotifications', { token: state.token })
      setState({ referrerNotifications: notifications || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  // ── Act As / Impersonate ──
  setActingAs: (role: string | null) => {
    setState({ actingAs: role, impersonating: null })
  },

  setImpersonating: (user: any) => {
    setState({ impersonating: user, actingAs: null })
  },

  clearImpersonation: () => {
    setState({ actingAs: null, impersonating: null, impersonationToken: null })
  },

  /** Returns impersonated user when active, otherwise the logged-in user */
  getEffectiveUser: (): AdminUser | null => {
    return state.impersonating || state.user
  },

  // ── Server-side Impersonation ──
  impersonateUser: async (targetUserId: string) => {
    try {
      const result = await apiPost('impersonateUser', { token: state.token, targetUserId })
      if (result?.targetUser) {
        setState({
          impersonating: result.targetUser,
          impersonationToken: result.impersonationToken,
          actingAs: null
        })
        return result
      }
      return null
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  endImpersonation: async () => {
    try {
      await apiPost('endImpersonation', { token: state.token, impersonationToken: state.impersonationToken })
    } catch { /* best effort */ }
    setState({ impersonating: null, impersonationToken: null, actingAs: null })
  },

  // ── ICUNI Project Registry ──
  loadProjectRegistry: async () => {
    try {
      const registry = await apiPost('getProjectRegistry', { token: state.token })
      setState({ projectRegistry: registry || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  updateProjectFeature: async (projectId: string, featureKey: string, enabled: boolean) => {
    try {
      await apiPost('updateProjectFeature', { token: state.token, projectId, featureKey, enabled })
      await adminActions.loadProjectRegistry()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  addProject: async (data: Record<string, any>) => {
    try {
      await apiPost('addProject', { token: state.token, ...data })
      await adminActions.loadProjectRegistry()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  // ── Godmode Central Ops Ecosystem Controllers ──
  godmodeGetEcosystemOverview: async () => {
    try {
      return await apiPost('godmodeGetEcosystemOverview', { token: state.token })
    } catch (err: any) {
      setState({ error: err.message })
      throw err
    }
  },

  godmodeToggleSiteStatus: async (siteKey: string, status: 'active' | 'maintenance') => {
    try {
      await apiPost('godmodeToggleSiteStatus', { token: state.token, siteKey, status })
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  godmodeManageConnect: async (subAction: string, payload: Record<string, any> = {}) => {
    try {
      return await apiPost('godmodeManageConnect', { token: state.token, subAction, ...payload })
    } catch (err: any) {
      setState({ error: err.message })
      throw err
    }
  },

  godmodeManageGroup: async (subAction: string, payload: Record<string, any> = {}) => {
    try {
      return await apiPost('godmodeManageGroup', { token: state.token, subAction, ...payload })
    } catch (err: any) {
      setState({ error: err.message })
      throw err
    }
  },

  godmodeManageStarterclass: async (subAction: string, payload: Record<string, any> = {}) => {
    try {
      return await apiPost('godmodeManageStarterclass', { token: state.token, subAction, ...payload })
    } catch (err: any) {
      setState({ error: err.message })
      throw err
    }
  },


  // ── Email Hub ──
  loadInbox: async (alias?: string, page?: number, query?: string, folder?: 'inbox' | 'sent' | 'all') => {
    setState({ inboxLoading: true })
    try {
      const result = await apiPost('getInbox', { token: state.token, alias: alias || 'all', page: page || 0, query, folder: folder || 'all' })
      const newAliases = Array.isArray(result?.aliases) && result.aliases.length > 0 ? result.aliases : state.emailAliases
      setState({ inbox: result?.threads || [], inboxLoading: false, emailAliases: newAliases })
      return result
    } catch (err: any) {
      setState({ error: err.message, inboxLoading: false })
      return null
    }
  },

  clearActiveThread: () => { setState({ activeThread: null }) },

  loadThread: async (threadId: string) => {
    try {
      const result = await apiPost('getThread', { token: state.token, threadId })
      setState({ activeThread: result })
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  replyToThread: async (threadId: string, body: string, fromAlias?: string, useTemplate?: boolean) => {
    try {
      await apiPost('replyToThread', { token: state.token, threadId, body, fromAlias, useTemplate })
      // Reload thread to show new reply
      await adminActions.loadThread(threadId)
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  sendBrandedEmail: async (data: { to?: string; subject: string; body: string; fromAlias?: string; recipients?: any[]; useTemplate?: boolean; templateOpts?: any; recipientName?: string }) => {
    try {
      const result = await apiPost('sendBrandedEmail', { token: state.token, ...data })
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  importEmailAsApplication: async (data: { threadId: string; messageId?: string; name: string; email: string; phone?: string; jobTitle?: string; coverLetterOverride?: string }) => {
    try {
      const result = await apiPost('importEmailAsApplication', { token: state.token, ...data })
      // Reload applications list so careers page shows the new entry
      adminActions.loadApplications()
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  loadEmailAliases: async (force?: boolean) => {
    const now = Date.now()
    if (!force && state._cache?.aliases && now - state._cache.aliases < 120000 && state.emailAliases.length) return state.emailAliases
    try {
      const result = await apiPost('getEmailAliases', { token: state.token })
      setState({ emailAliases: result || [], _cache: { ...state._cache, aliases: now } })
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  updateEmailAlias: async (data: Record<string, any>) => {
    try {
      await apiPost('updateEmailAlias', { token: state.token, ...data })
      await adminActions.loadEmailAliases()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  deleteEmailAlias: async (alias: string) => {
    try {
      await apiPost('deleteEmailAlias', { token: state.token, alias })
      await adminActions.loadEmailAliases()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  assignMailbox: async (userEmail: string, mailbox: string) => {
    try {
      await apiPost('assignMailbox', { token: state.token, userEmail, mailbox })
      // Force-reload aliases so changes appear immediately
      await adminActions.loadEmailAliases(true)
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  removeMailbox: async (userEmail: string, mailbox: string) => {
    try {
      await apiPost('removeMailbox', { token: state.token, userEmail, mailbox })
      // Force-reload aliases so changes appear immediately
      await adminActions.loadEmailAliases(true)
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  getUserMailboxes: async (userEmail?: string) => {
    try {
      return await apiPost('getUserMailboxes', { token: state.token, userEmail })
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  loadEmailTemplates: async (force?: boolean) => {
    const now = Date.now()
    if (!force && state._cache?.templates && now - state._cache.templates < 300000 && state.emailTemplates.length) return state.emailTemplates
    try {
      const result = await apiPost('getEmailTemplates', { token: state.token })
      setState({ emailTemplates: result || [], _cache: { ...state._cache, templates: now } })
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  saveEmailTemplate: async (data: Record<string, any>) => {
    try {
      const result = await apiPost('saveEmailTemplate', { token: state.token, ...data })
      await adminActions.loadEmailTemplates()
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  deleteEmailTemplate: async (id: string) => {
    try {
      const result = await apiPost('deleteEmailTemplate', { token: state.token, id })
      await adminActions.loadEmailTemplates()
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  previewBrandedEmail: async (data: { templateId?: string; subject?: string; body?: string; recipientName?: string; opts?: any; extras?: any }) => {
    try {
      return await apiPost('previewBrandedEmail', { token: state.token, ...data })
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  loadSLA: async () => {
    try {
      const result = await apiPost('getSlaStatus', { token: state.token })
      setState({ slaStatuses: result?.statuses || [], slaConfig: result?.config || null })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadSlaCosts: async () => {
    try {
      const costs = await apiPost('getSlaCosts', { token: state.token })
      setState({ slaCosts: costs || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadCallFollowUpSLA: async () => {
    try {
      const slas = await apiPost('getCallFollowUpSLA', { token: state.token })
      setState({ callFollowUpSLA: slas || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  postponeFollowUp: async (slaId: string, postponeUntil: string) => {
    try {
      await apiPost('postponeFollowUp', { token: state.token, sla_id: slaId, postpone_until: postponeUntil })
      await adminActions.loadCallFollowUpSLA()
    } catch (err: any) { setState({ error: err.message }) }
  },

  completeFollowUp: async (slaId: string) => {
    try {
      await apiPost('completeFollowUp', { token: state.token, sla_id: slaId })
      await adminActions.loadCallFollowUpSLA()
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadSlaNotifications: async () => {
    try {
      const notifs = await apiPost('getSlaNotifications', { token: state.token })
      setState({ slaNotifications: notifs || [] })
    } catch { /* silent */ }
  },

  dismissSlaNotification: async (logId: string) => {
    try {
      await apiPost('dismissSlaNotification', { token: state.token, log_id: logId })
      await adminActions.loadSlaNotifications()
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadLogs: async () => {
    try {
      const logs = await apiPost('getLogs', { token: state.token })
      setState({ logs: logs || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadBlogPosts: async () => {
    try {
      const posts = await apiPost('getBlogPosts', { token: state.token })
      setState({ blogPosts: posts || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadPortfolio: async () => {
    try {
      const portfolio = await apiPost('getPortfolio', { token: state.token })
      setState({ portfolio: portfolio || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  updatePortfolio: async (projectId: string, data: Record<string, any>) => {
    setState({ loading: true, error: null })
    try {
      // Backend expects a flat payload: { token, project_id, ...updatable fields }
      await apiPost('updatePortfolio', { token: state.token, project_id: projectId, ...data })
      await adminActions.loadPortfolio()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  // ── CRUD Actions ──
  addUser: async (data: any) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('addUser', { token: state.token, ...data })
      await adminActions.loadUsers()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  deactivateUser: async (userId: string) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('deactivateUser', { token: state.token, userId })
      await adminActions.loadUsers()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  editUser: async (userId: string, data: Record<string, any>): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('editUser', { token: state.token, userId, ...data })
      await adminActions.loadUsers()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  createAdmin: async (email: string, jobTitle?: string, permissions?: Record<string, boolean>, role?: string, companyEmail?: string) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('createAdmin', { token: state.token, email, job_title: jobTitle || 'Operations Assistant', permissions, role: role || 'Admin', company_email: companyEmail || '' })
      await adminActions.loadUsers()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  updateUserPermissions: async (userId: string, permissions: Record<string, boolean>) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('updateUserPermissions', { token: state.token, userId, permissions })
      await adminActions.loadUsers()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  createClient: async (data: any) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('addClient', { token: state.token, ...data })
      await adminActions.loadClients()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  addHistoricProject: async (data: any) => {
    setState({ loading: true, error: null })
    try {
      const result = await apiPost('addHistoricProject', { token: state.token, ...data })
      await adminActions.loadClients()
      setState({ loading: false })
      return result
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return null
    }
  },

  createProject: async (data: any) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('createProject', { token: state.token, ...data })
      await adminActions.loadProjects()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  /** Advance a client project to its next delivery step.
   *  Backend handles invoice generation, step emails, and SLA reset. */
  advanceProjectStep: async (projectId: string, nextStep?: number): Promise<{ step: number; stepName: string } | null> => {
    setState({ loading: true, error: null })
    try {
      const result = await apiPost('advanceStep', {
        token: state.token,
        projectId,
        ...(nextStep !== undefined ? { nextStep } : {}),
      })
      await adminActions.loadProjects()
      setState({ loading: false })
      return result
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return null
    }
  },

  recordPayment: async (data: any) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('recordPayment', { token: state.token, ...data })
      await adminActions.loadInvoices()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  viewInvoiceHTML: async (invoiceId: string) => {
    try {
      const result = await apiPost('getInvoiceHTML', { token: state.token, invoiceId })
      setState({ activeInvoiceHTML: result?.html || null, activeInvoice: result?.invoice || null })
    } catch (err: any) { setState({ error: err.message }) }
  },

  closeInvoiceHTML: () => setState({ activeInvoiceHTML: null }),

  saveInvoice: async (data: Record<string, any>) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('saveInvoice', { token: state.token, ...data })
      await adminActions.loadInvoices()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  saveContract: async (data: Record<string, any>) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('saveContract', { token: state.token, ...data })
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  snoozeSla: async (projectId: string, minutes: number) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('snoozeSla', { token: state.token, projectId, minutes })
      await adminActions.loadSLA()
      setState({ loading: false })
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  // ── Applicant Email ──
  sendApplicantEmail: async (template: string, recipients: { email: string; name: string }[], extras?: Record<string, any>, rawHtml?: string, rawSubject?: string): Promise<{ sent: number; failed: number; errors: string[] } | null> => {
    setState({ loading: true, error: null })
    try {
      const result = await apiPost('sendApplicantEmail', {
        token: state.token,
        template,
        recipients,
        extras: extras || {},
        ...(rawHtml ? { rawHtml, rawSubject } : {}),
      })
      await adminActions.loadApplications()
      setState({ loading: false })
      return result
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return null
    }
  },

  previewApplicantEmail: async (template: string, applicantName?: string, extras?: Record<string, any>): Promise<{ html: string; subject: string; newStatus: string | null } | null> => {
    try {
      return await apiPost('previewApplicantEmail', {
        token: state.token,
        template,
        applicantName: applicantName || 'Applicant',
        extras: extras || {},
      })
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  // ── Career Listing CRUD ──
  deleteApplication: async (rowIndex: number): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('deleteApplication', { token: state.token, rowIndex })
      await adminActions.loadApplications()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  createApplication: async (data: Record<string, any>): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('createApplication', { token: state.token, ...data })
      await adminActions.loadApplications()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  createJobListing: async (data: Record<string, any>): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('createJobListing', { token: state.token, ...data })
      await adminActions.loadJobs()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  updateJobListing: async (data: Record<string, any>): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('updateJobListing', { token: state.token, ...data })
      await adminActions.loadJobs()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  // ── Dashboard summary load ──
  loadDashboard: async () => {
    setState({ loading: true })
    try {
      const dashboard = await apiPost('getDashboard', { token: state.token })
      if (dashboard) {
        setState({
          clients: dashboard.clients || [],
          projects: dashboard.projects || [],
          invoices: dashboard.invoices || [],
          slaStatuses: dashboard.slaStatuses || [],
          logs: dashboard.logs || [],
          loading: false,
        })
      } else {
        setState({ loading: false })
      }
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  // ── Referrer Email System ──
  sendReferrerEmail: async (template: string, recipients: { email: string; name: string }[], extras?: Record<string, any>): Promise<{ sent: number; failed: number } | null> => {
    setState({ loading: true, error: null })
    try {
      const result = await apiPost('sendReferrerEmail', {
        token: state.token,
        template,
        recipients,
        extras: extras || {},
      })
      setState({ loading: false })
      return result
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return null
    }
  },

  previewReferrerEmail: async (template: string, name?: string, extras?: Record<string, any>): Promise<{ html: string; subject: string } | null> => {
    try {
      return await apiPost('previewReferrerEmail', {
        token: state.token,
        template,
        name: name || 'Partner',
        extras: extras || {},
      })
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  // ── Profile Management ──
  getProfile: async (): Promise<any> => {
    try {
      const params: any = { token: state.token }
      // When impersonating, fetch the impersonated user's profile
      if (state.impersonating?.email) {
        params.targetEmail = state.impersonating.email
      }
      const profile = await apiPost('getProfile', params)
      // Only sync store user object when NOT impersonating
      if (profile && state.user && !state.impersonating) {
        setState({
          user: {
            ...state.user,
            name: profile.name || state.user.name,
            profile_pic_url: profile.profile_pic_url || '',
            cover_image_url: profile.cover_image_url || '',
          }
        })
      }
      return profile
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  updateProfile: async (data: Record<string, any>): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('updateProfile', { token: state.token, ...data })
      // Sync local user object immediately with ALL provided fields
      const cur = state.user  // use current state reference
      if (cur) {
        setState({
          user: {
            ...cur,
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.profile_pic_url !== undefined ? { profile_pic_url: data.profile_pic_url } : {}),
            ...(data.cover_image_url !== undefined ? { cover_image_url: data.cover_image_url } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.contact_details !== undefined ? { contact_details: data.contact_details } : {}),
          },
          loading: false,
        })
      } else {
        setState({ loading: false })
      }
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  uploadProfileImage: async (base64: string, fileName: string, type: 'profile' | 'cover'): Promise<{ url: string } | null> => {
    try {
      const result = await apiPost('uploadProfileImage', { token: state.token, base64, fileName, type })
      return result
    } catch (err: any) {
      console.error('Upload failed:', err.message)
      return null
    }
  },

  // ── Call Log Actions ──
  saveCallLog: async (data: Record<string, any>): Promise<any> => {
    setState({ loading: true, error: null })
    try {
      const result = await apiPost('saveCallLog', { token: state.token, ...data })
      // Refresh clients to reflect any pipeline auto-advance
      await adminActions.loadClients()
      setState({ loading: false })
      return result
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return null
    }
  },

  loadCallLogs: async (filters?: Record<string, any>) => {
    try {
      const result = await apiPost('getCallLogs', { token: state.token, ...(filters || {}) })
      const logs = result?.logs || result || []
      // Only update global store when loading unfiltered data (no client_id/caller_email filter)
      const isFiltered = filters && (filters.client_id || filters.caller_email)
      if (!isFiltered && Array.isArray(logs) && (logs.length > 0 || state.callLogs.length === 0)) {
        setState({ callLogs: logs })
      }
      return result
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadCallAnalytics: async () => {
    try {
      const analytics = await apiPost('getCallAnalytics', { token: state.token })
      setState({ callAnalytics: analytics || null })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadCompetitorIntel: async () => {
    try {
      const intel = await apiPost('getCompetitorIntel', { token: state.token })
      setState({ competitorIntel: intel?.aggregated || [] })
    } catch (err: any) { setState({ error: err.message }) }
  },

  loadAnalytics: async (filters?: Record<string, any>) => {
    try {
      const result = await apiPost('getAnalytics', { token: state.token, ...(filters || {}) })
      setState({ analyticsData: result || null })
      return result
    } catch (err: any) { setState({ error: err.message }) }
  },

  // ── CRM Actions ──
  getClient: async (clientId: string) => {
    setState({ loading: true, error: null })
    try {
      const client = await apiPost('getClient', { token: state.token, clientId })
      setState({ activeClient: client || null, loading: false })
      return client
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return null
    }
  },

  setActiveClientOptimistic: (client: any) => {
    setState({ activeClient: client, loading: false })
  },

  clearActiveClient: () => setState({ activeClient: null, clientActivity: [] }),
  clearError: () => setState({ error: null }),

  getClientActivity: async (clientId: string) => {
    try {
      const activity = await apiPost('getClientActivity', { token: state.token, clientId })
      setState({ clientActivity: activity || [] })
      return activity
    } catch (err: any) {
      setState({ error: err.message })
      return []
    }
  },

  addClientNote: async (clientId: string, content: string): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('addClientNote', { token: state.token, clientId, content })
      // Refresh client + activity
      await adminActions.getClient(clientId)
      await adminActions.getClientActivity(clientId)
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  updateClientTags: async (clientId: string, tags: string[]): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('updateClientTags', { token: state.token, clientId, tags })
      await adminActions.getClient(clientId)
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  updateClient: async (clientId: string, data: Record<string, any>): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('updateClient', { token: state.token, clientId, ...data })
      await adminActions.getClient(clientId)
      await adminActions.loadClients()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  deleteClient: async (clientId: string): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('deleteClient', { token: state.token, clientId })
      adminActions.clearActiveClient()
      await adminActions.loadClients()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  updateClientStatus: async (clientId: string, prospectStage: string, note?: string): Promise<boolean> => {
    setState({ error: null })
    try {
      // Optimistic update — move client in pipeline immediately
      const optimisticClients = state.clients.map((c: any) =>
        c.client_id === clientId ? { ...c, prospect_stage: prospectStage } : c
      )
      setState({ clients: optimisticClients })
      if (state.activeClient && state.activeClient.client_id === clientId) {
        setState({ activeClient: { ...state.activeClient, prospect_stage: prospectStage } })
      }
      // Persist to localStorage as fallback against GAS cache staleness
      saveStageOverride(clientId, prospectStage)

      // Fire API call (don't block on loadClients afterward)
      await apiPost('updateClientStatus', { token: state.token, clientId, prospect_stage: prospectStage, note })

      // Background refresh — non-blocking. We trust the optimistic + localStorage path.
      adminActions.loadClients().catch(() => {})
      return true
    } catch (err: any) {
      // On failure, reload to revert optimistic update
      removeStageOverride(clientId)
      await adminActions.loadClients().catch(() => {})
      setState({ error: err.message })
      return false
    }
  },

  previewClientEmail: async (template: string, clientName?: string, extras?: Record<string, any>) => {
    try {
      const result = await apiPost('previewClientEmail', { token: state.token, template, clientName, extras })
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  sendClientEmail: async (template: string, email: string, clientName?: string, extras?: Record<string, any>, rawHtml?: string, rawSubject?: string): Promise<boolean> => {
    setState({ loading: true, error: null })
    try {
      await apiPost('sendClientEmail', { token: state.token, template, email, clientName, extras, rawHtml, rawSubject })
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
    }
  },

  // ── Link Extraction ──
  extractFromUrl: async (url: string): Promise<any> => {
    try {
      const result = await apiPost('extractFromUrl', { token: state.token, url })
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  checkDuplicate: async (data: { phone?: string; name?: string; company?: string }): Promise<any> => {
    try {
      return await apiPost('checkDuplicate', { token: state.token, ...data })
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  bulkSearch: async (query: string): Promise<any> => {
    try {
      return await apiPost('bulkSearch', { token: state.token, query })
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  // ── Meetings ──
  loadMeetings: async () => {
    try {
      const result = await apiPost('getMeetings', { token: state.token })
      setState({ meetings: result?.meetings || [] })
      return result?.meetings || []
    } catch (err: any) { setState({ error: err.message }); return [] }
  },

  createMeeting: async (data: Record<string, any>) => {
    setState({ loading: true, error: null })
    try {
      const result = await apiPost('createMeeting', { token: state.token, ...data })
      await adminActions.loadMeetings()
      setState({ loading: false })
      return result
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return null
    }
  },

  updateMeeting: async (meeting_id: string, data: Record<string, any>) => {
    try {
      await apiPost('updateMeeting', { token: state.token, meeting_id, ...data })
      await adminActions.loadMeetings()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  deleteMeeting: async (meeting_id: string) => {
    try {
      await apiPost('deleteMeeting', { token: state.token, meeting_id })
      await adminActions.loadMeetings()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  sendMeetingConfirmation: async (meeting_id: string, data?: Record<string, any>, template_id?: string) => {
    try {
      await apiPost('sendMeetingConfirmation', { token: state.token, meeting_id, template_id, ...data })
      await adminActions.loadMeetings()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  qualifyMeeting: async (meeting_id: string, result: string, notes?: string) => {
    try {
      await apiPost('qualifyMeeting', { token: state.token, meeting_id, result, notes })
      await adminActions.loadMeetings()
      await adminActions.loadClients()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  regressMeeting: async (meeting_id: string, target_stage: string) => {
    try {
      await apiPost('regressMeeting', { token: state.token, meeting_id, target_stage })
      await adminActions.loadMeetings()
      await adminActions.loadClients()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  cancelMeeting: async (meeting_id: string, reason?: string) => {
    try {
      await apiPost('cancelMeeting', { token: state.token, meeting_id, reason })
      await adminActions.loadMeetings()
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  // ── Calendar Integration ──
  createCalendarEvent: async (data: Record<string, any>) => {
    try {
      return await apiPost('createCalendarEvent', { token: state.token, ...data })
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  confirmCalendarEvent: async (data: Record<string, any>) => {
    try {
      return await apiPost('confirmCalendarEvent', { token: state.token, ...data })
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  getAvailableSlots: async (type: string = 'online') => {
    try {
      const result = await apiPost('getAvailableSlots', { token: state.token, type })
      return result?.slots || []
    } catch (err: any) {
      setState({ error: err.message })
      return []
    }
  },

  deleteCalendarEvent: async (eventId: string) => {
    try {
      await apiPost('deleteCalendarEvent', { token: state.token, event_id: eventId })
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  // ── Client Contacts ──
  loadContacts: async (client_id?: string) => {
    try {
      const result = await apiPost('getContacts', { token: state.token, client_id })
      return result?.contacts || []
    } catch (err: any) {
      setState({ error: err.message })
      return []
    }
  },

  addContact: async (data: Record<string, any>) => {
    try {
      const result = await apiPost('addContact', { token: state.token, ...data })
      return result
    } catch (err: any) {
      setState({ error: err.message })
      return null
    }
  },

  updateContact: async (contact_id: string, data: Record<string, any>) => {
    try {
      await apiPost('updateContact', { token: state.token, contact_id, ...data })
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },

  deleteContact: async (contact_id: string) => {
    try {
      await apiPost('deleteContact', { token: state.token, contact_id })
      return true
    } catch (err: any) {
      setState({ error: err.message })
      return false
    }
  },
}
