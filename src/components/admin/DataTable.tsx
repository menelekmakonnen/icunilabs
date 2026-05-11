import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

interface Column {
  key: string
  label: string
  render?: (val: any, row: any) => React.ReactNode
  width?: string
}

interface DataTableProps {
  title: string
  subtitle?: string
  columns: Column[]
  data: any[]
  loading?: boolean
  searchKeys?: string[]
  onAdd?: () => void
  addLabel?: string
  renderRowActions?: (row: any) => React.ReactNode
  emptyMessage?: string
  // Selection support
  selectable?: boolean
  selectedRows?: Set<number>
  onSelectRow?: (rowIndex: number, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  /** Extra buttons rendered in the header area (next to Add button) */
  headerActions?: React.ReactNode
}

export default function DataTable({ title, subtitle, columns, data, loading, searchKeys, onAdd, addLabel, renderRowActions, emptyMessage, selectable, selectedRows, onSelectRow, onSelectAll, headerActions }: DataTableProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)
  const perPage = 15

  const filtered = data.filter(row => {
    if (!search) return true
    const keys = searchKeys || columns.map(c => c.key)
    return keys.some(k => String(row[k] || '').toLowerCase().includes(search.toLowerCase()))
  })

  const sorted = sortKey ? [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    const cmp = String(av || '').localeCompare(String(bv || ''), undefined, { numeric: true })
    return sortAsc ? cmp : -cmp
  }) : filtered

  const paged = sorted.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(sorted.length / perPage)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  const allPageSelected = selectable && selectedRows && paged.length > 0 && paged.every(row => {
    const idx = row._rowIndex || row.id || row.email
    return selectedRows.has(idx)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {headerActions}
          {onAdd && (
            <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all cursor-pointer">
              <Plus className="w-4 h-4" />{addLabel || 'Add New'}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#00bfff] transition-colors"
          placeholder={`Search ${title.toLowerCase()}...`} />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>}
      </div>

      {/* Count */}
      <div className="text-xs text-neutral-600">{sorted.length} record{sorted.length !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ''}{selectable && selectedRows && selectedRows.size > 0 ? ` · ${selectedRows.size} selected` : ''}</div>

      {loading && <div className="text-center py-8 text-neutral-500 text-sm">Loading...</div>}

      {!loading && sorted.length === 0 && (
        <div className="text-center py-12 text-neutral-600">{emptyMessage || `No ${title.toLowerCase()} found.`}</div>
      )}

      {!loading && paged.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-900/80">
                {selectable && (
                  <th className="px-3 py-3 w-[40px]">
                    <input type="checkbox" checked={!!allPageSelected}
                      onChange={e => onSelectAll?.(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#00bfff] cursor-pointer" />
                  </th>
                )}
                {columns.map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}
                    className="px-4 py-3 text-left text-xs text-neutral-500 font-bold uppercase tracking-wider cursor-pointer hover:text-neutral-300 transition-colors select-none"
                    style={{ width: col.width }}>
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </span>
                  </th>
                ))}
                {renderRowActions && <th className="px-4 py-3 text-right text-xs text-neutral-500 font-bold uppercase tracking-wider w-[100px]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paged.map((row, i) => {
                  const rowId = row._rowIndex || row.id || row.email || i
                  const isSelected = selectable && selectedRows?.has(rowId)
                  return (
                    <motion.tr key={rowId}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className={`border-t border-neutral-800/50 transition-colors ${isSelected ? 'bg-[#00bfff]/5' : 'hover:bg-neutral-800/30'}`}>
                      {selectable && (
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={!!isSelected}
                            onChange={e => onSelectRow?.(rowId, e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#00bfff] cursor-pointer" />
                        </td>
                      )}
                      {columns.map(col => (
                        <td key={col.key} className="px-4 py-3 text-neutral-300">
                          {col.render ? col.render(row[col.key], row) : (String(row[col.key] || '—'))}
                        </td>
                      ))}
                      {renderRowActions && <td className="px-4 py-3 text-right">{renderRowActions(row)}</td>}
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer">Prev</button>
          <span className="text-neutral-500">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer">Next</button>
        </div>
      )}
    </div>
  )
}
