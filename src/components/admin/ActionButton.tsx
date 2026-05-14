import { useState, useCallback, type ReactNode } from 'react'

/**
 * Inline SVG spinner — no emoji, no Lucide dependency.
 * Renders a small animated ring matching the current text color.
 */
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

/**
 * ActionButton — drop-in replacement for any async button.
 * Shows a spinner while the onClick handler resolves.
 * 
 * @example
 * <ActionButton onClick={handleSave} className="...">Save</ActionButton>
 */
export function ActionButton({
  onClick,
  children,
  className = '',
  disabled = false,
  type = 'button',
  busyText,
  spinnerSize = 14,
}: {
  onClick?: (e: React.MouseEvent) => Promise<any> | void
  children: ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  busyText?: string
  spinnerSize?: number
}) {
  const [busy, setBusy] = useState(false)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    if (busy || disabled || !onClick) return
    const result = onClick(e)
    if (result && typeof (result as any).then === 'function') {
      setBusy(true)
      try { await result } finally { setBusy(false) }
    }
  }, [onClick, busy, disabled])

  const isBusy = busy
  const isDisabled = disabled || isBusy

  return (
    <button
      type={type}
      onClick={type === 'submit' ? undefined : handleClick}
      disabled={isDisabled}
      className={`${className} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {isBusy ? (
        <span className="inline-flex items-center gap-1.5">
          <Spinner size={spinnerSize} />
          {busyText || null}
        </span>
      ) : children}
    </button>
  )
}

/**
 * FormButton — for submit buttons inside <form> elements.
 * Wraps the form's onSubmit and shows spinner while resolving.
 * Use the `busy` prop to control externally.
 */
export function FormButton({
  children,
  className = '',
  busy = false,
  disabled = false,
  busyText,
  spinnerSize = 14,
}: {
  children: ReactNode
  className?: string
  busy?: boolean
  disabled?: boolean
  busyText?: string
  spinnerSize?: number
}) {
  const isDisabled = disabled || busy

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`${className} ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {busy ? (
        <span className="inline-flex items-center gap-1.5">
          <Spinner size={spinnerSize} />
          {busyText || 'Working...'}
        </span>
      ) : children}
    </button>
  )
}

/**
 * Hook for wrapping any async action with loading state.
 * Returns [handler, isBusy] tuple.
 */
export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(
  action: T
): [(...args: Parameters<T>) => Promise<ReturnType<T>>, boolean] {
  const [busy, setBusy] = useState(false)

  const wrapped = useCallback(async (...args: Parameters<T>) => {
    setBusy(true)
    try {
      return await action(...args)
    } finally {
      setBusy(false)
    }
  }, [action]) as (...args: Parameters<T>) => Promise<ReturnType<T>>

  return [wrapped, busy]
}
