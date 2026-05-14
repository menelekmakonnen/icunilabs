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
  blogPosts: any[]
  portfolio: any[]

  // Detail views
  activeInvoiceHTML: string | null
  activeInvoice: any | null

  // CRM
  activeClient: any | null
  clientActivity: any[]

  // ICUNI Ecosystem
  projectRegistry: any[]
  impersonationToken: string | null

  // Email Hub
  inbox: any[]
  inboxLoading: boolean
  activeThread: any | null
  emailAliases: any[]
  emailTemplates: any[]
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

// Singleton store
let state: AdminState = {
  token: localStorage.getItem('icuni_admin_token'),
  user: null,
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
  blogPosts: [],
  portfolio: [],
  activeInvoiceHTML: null,
  activeInvoice: null,
  activeClient: null,
  clientActivity: [],
  projectRegistry: [],
  impersonationToken: null,
  inbox: [],
  inboxLoading: false,
  activeThread: null,
  emailAliases: [],
  emailTemplates: [],
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

const ALLOWED_ROLES = ['Godmode', 'SuperAdmin', 'Admin', 'Sales', 'Product']

export const adminActions = {
  setError: (error: string | null) => setState({ error }),
  setSection: (section: string) => setState({ activeSection: section, error: null }),
  setLoginMethod: (method: 'otp' | 'password' | 'pin') => setState({ loginMethod: method }),

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

  verifyOTP: async (email: string, otp: string) => {
    setState({ loading: true, error: null })
    try {
      const session = await apiPost('verifyOTP', { email, otp })
      if (!ALLOWED_ROLES.includes(session.user?.role)) {
        setState({ error: 'Access denied. Admin privileges required.', loading: false })
        return
      }
      setState({ token: session.token, user: session.user, loading: false })
      localStorage.setItem('icuni_admin_token', session.token)
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  passwordLogin: async (email: string, password: string) => {
    setState({ loading: true, error: null })
    try {
      const session = await apiPost('passwordLogin', { identifier: email, password })
      if (!ALLOWED_ROLES.includes(session.user?.role)) {
        setState({ error: 'Access denied. Admin privileges required.', loading: false })
        return
      }
      setState({ token: session.token, user: session.user, loading: false })
      localStorage.setItem('icuni_admin_token', session.token)
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  pinLogin: async (email: string, pin: string) => {
    setState({ loading: true, error: null })
    try {
      const session = await apiPost('pinLogin', { identifier: email, pin })
      if (!ALLOWED_ROLES.includes(session.user?.role)) {
        setState({ error: 'Access denied. Admin privileges required.', loading: false })
        return
      }
      setState({ token: session.token, user: session.user, loading: false })
      localStorage.setItem('icuni_admin_token', session.token)
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  validateSession: async () => {
    const { token } = state
    if (!token) return
    setState({ loading: true })
    try {
      const result = await apiPost('validateSession', { token })
      if (!ALLOWED_ROLES.includes(result.user?.role)) {
        setState({ token: null, user: null, loading: false })
        localStorage.removeItem('icuni_admin_token')
        return
      }
      setState({ user: result.user, loading: false })
    } catch {
      setState({ token: null, user: null, loading: false })
      localStorage.removeItem('icuni_admin_token')
    }
  },

  logout: () => {
    const { token } = state
    if (token) apiPost('logout', { token }).catch(() => {})
    setState({ token: null, user: null, otpSent: false, activeSection: 'dashboard' })
    localStorage.removeItem('icuni_admin_token')
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
      setState({ clients: clients || [] })
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
    } catch (err: any) { setState({ error: err.message }) }
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

  // ── Email Hub ──
  loadInbox: async (alias?: string, page?: number, query?: string) => {
    setState({ inboxLoading: true })
    try {
      const result = await apiPost('getInbox', { token: state.token, alias: alias || 'all', page: page || 0, query })
      setState({ inbox: result?.threads || [], inboxLoading: false, emailAliases: result?.aliases || state.emailAliases })
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

  updatePortfolioStatus: async (projectId: string, status: string) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('updatePortfolio', { token: state.token, project_id: projectId, status })
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

  createAdmin: async (email: string, jobTitle?: string, permissions?: Record<string, boolean>, role?: string) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('createAdmin', { token: state.token, email, job_title: jobTitle || 'Operations Assistant', permissions, role: role || 'Admin' })
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

  updateProject: async (data: any) => {
    setState({ loading: true, error: null })
    try {
      await apiPost('updateProject', { token: state.token, ...data })
      await adminActions.loadProjects()
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
      return false
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
      await Promise.all([
        adminActions.loadClients(),
        adminActions.loadProjects(),
        adminActions.loadInvoices(),
        adminActions.loadSLA(),
        adminActions.loadLogs(),
      ])
      setState({ loading: false })
    } catch {
      setState({ loading: false })
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
      const profile = await apiPost('getProfile', { token: state.token })
      // Sync store user object with latest profile data
      if (profile && state.user) {
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
      // Sync local user object immediately
      if (state.user) {
        setState({
          user: {
            ...state.user,
            name: data.name || state.user.name,
            profile_pic_url: data.profile_pic_url || state.user.profile_pic_url || '',
            cover_image_url: data.cover_image_url || state.user.cover_image_url || '',
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
    setState({ loading: true, error: null })
    try {
      await apiPost('updateClientStatus', { token: state.token, clientId, prospect_stage: prospectStage, note })
      // Refresh client list (updates pipeline view)
      await adminActions.loadClients()
      // If viewing a client detail, refresh that too
      if (state.activeClient && state.activeClient.client_id === clientId) {
        const client = await apiPost('getClient', { token: state.token, clientId })
        setState({ activeClient: client || null })
      }
      setState({ loading: false })
      return true
    } catch (err: any) {
      setState({ error: err.message, loading: false })
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
}
