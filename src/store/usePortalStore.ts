/**
 * Portal State — lightweight reactive store without Zustand dependency.
 * Uses a simple pub/sub pattern compatible with React's useSyncExternalStore.
 */

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

export interface PortalUser {
  name: string
  email: string
  role: string
}

export interface PortalProject {
  project_id: string
  client_id: string
  title: string
  description: string
  status: string
  step: number
  type: string
  estimated_cost: number
  total_paid: number
  balance: number
  start_date: string
  est_completion: string
  client_name?: string
  step_info?: { name: string; owner: string }
  invoices?: any[]
  payments?: any[]
}

interface PortalState {
  token: string | null
  user: PortalUser | null
  projects: PortalProject[]
  activeProject: PortalProject | null
  loading: boolean
  error: string | null
  otpSent: boolean
}

async function apiPost(action: string, payload: Record<string, any> = {}): Promise<any> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...payload }),
  })
  const text = await res.text()
  const data = JSON.parse(text)
  if (!data.success) throw new Error(data.message || data.error || 'Request failed')
  return data.data
}

// Singleton store
let state: PortalState = {
  token: localStorage.getItem('icuni_portal_token'),
  user: null,
  projects: [],
  activeProject: null,
  loading: false,
  error: null,
  otpSent: false,
}

const listeners = new Set<() => void>()

function setState(partial: Partial<PortalState>) {
  state = { ...state, ...partial }
  listeners.forEach(l => l())
}

export function getPortalState() { return state }
export function subscribePortal(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

// Hook for React
import { useSyncExternalStore } from 'react'
export function usePortalStore() {
  return useSyncExternalStore(subscribePortal, getPortalState)
}

// Actions
export const portalActions = {
  setError: (error: string | null) => setState({ error }),

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
      setState({ token: session.token, user: session.user, loading: false })
      localStorage.setItem('icuni_portal_token', session.token)
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  validateExistingToken: async () => {
    const { token } = state
    if (!token) return
    setState({ loading: true })
    try {
      const result = await apiPost('validateSession', { token })
      setState({ user: result.user, loading: false })
    } catch {
      setState({ token: null, user: null, loading: false })
      localStorage.removeItem('icuni_portal_token')
    }
  },

  loadProjects: async () => {
    const { token } = state
    if (!token) return
    setState({ loading: true })
    try {
      const projects = await apiPost('getProjects', { token })
      setState({ projects: projects || [], loading: false })
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('expired')) {
        setState({ token: null, user: null, projects: [] })
        localStorage.removeItem('icuni_portal_token')
      }
      setState({ error: err.message, loading: false })
    }
  },

  loadProjectDetail: async (projectId: string) => {
    const { token } = state
    if (!token) return
    setState({ loading: true })
    try {
      const project = await apiPost('getProject', { token, projectId })
      setState({ activeProject: project, loading: false })
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  requestBuild: async (title: string, description: string, type?: string) => {
    const { token } = state
    if (!token) return
    setState({ loading: true })
    try {
      await apiPost('requestBuild', { token, title, description, type: type || 'custom' })
      setState({ loading: false })
    } catch (err: any) {
      setState({ error: err.message, loading: false })
    }
  },

  logout: () => {
    const { token } = state
    if (token) apiPost('logout', { token }).catch(() => {})
    setState({ token: null, user: null, projects: [], activeProject: null, otpSent: false })
    localStorage.removeItem('icuni_portal_token')
    window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate'));
  },
}
