import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** When this value changes (e.g. the active admin section), the boundary resets. */
  resetKey?: string | number
}

interface State {
  hasError: boolean
  message: string
}

/**
 * Catches render-time errors inside an admin section so a single bad record
 * (e.g. a malformed client row) shows a recoverable message instead of
 * unmounting the entire admin app — which previously looked like being
 * logged out. Resets automatically when the active section changes.
 */
export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Something went wrong rendering this section.' }
  }

  componentDidUpdate(prevProps: Props) {
    // Recover when the user navigates to a different section.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: '' })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a console trail for debugging; does not propagate to crash the app.
    console.error('[SectionErrorBoundary] section render failed:', error, info?.componentStack)
  }

  handleRetry = () => this.setState({ hasError: false, message: '' })

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-white mb-1">This section hit a snag</h2>
        <p className="text-sm text-neutral-500 max-w-sm mb-1">You're still signed in — only this panel failed to render. Try again, or switch to another section.</p>
        <p className="text-[11px] text-neutral-700 max-w-sm mb-5 font-mono break-words">{this.state.message}</p>
        <button onClick={this.handleRetry}
          className="px-4 py-2 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all">
          Try Again
        </button>
      </div>
    )
  }
}
