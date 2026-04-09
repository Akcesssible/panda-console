'use client'

import React, { useState, useRef, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  InformationCircleIcon,
  MoreVerticalIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from '@hugeicons-pro/core-stroke-rounded'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterButton } from '@/components/ui/FilterButton'

// ── Types ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (row: any) => React.ReactNode
  className?: string
}

export interface RowAction {
  label: string
  onClick: () => void
  danger?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableProps<T = any> {
  columns: Column<T>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  keyField?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowClick?: (row: any) => void
  emptyMessage?: string
  // Card header
  cardTitle?: string
  searchValue?: string
  onSearch?: (v: string) => void
  // Row features
  selectable?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowActions?: (row: any) => RowAction[]
}

// ── Three-dot action menu ─────────────────────────────────────────────────────
function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#1d242d]"
      >
        <HugeiconsIcon icon={MoreVerticalIcon} size={16} color="currentColor" strokeWidth={1.8} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px]">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                action.danger ? 'text-red-600' : 'text-[#1d242d]'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main DataTable ─────────────────────────────────────────────────────────────
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = 'id',
  onRowClick,
  emptyMessage = 'No data found.',
  cardTitle,
  searchValue = '',
  onSearch,
  selectable = false,
  rowActions,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected = data.length > 0 && data.every(row => selected.has(String(row[keyField])))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.map(row => String(row[keyField]))))
    }
  }

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col">

      {/* ── Card header ─────────────────────────────────────────── */}
      {(cardTitle || onSearch) && (
        <div className="flex items-center px-6 py-4 border-b border-gray-100">
          {/* Left half — title */}
          <div className="flex items-center gap-1.5 w-1/2">
            <span className="text-base font-medium text-[#1d242d] tracking-[-0.5px]">{cardTitle}</span>
            <HugeiconsIcon icon={InformationCircleIcon} size={15} color="#d1d5db" strokeWidth={1.5} />
          </div>
          {/* Right half — search + filter */}
          <div className="flex items-center justify-end gap-2 w-1/2">
            {onSearch && (
              <SearchBar
                value={searchValue}
                onChange={onSearch}
                placeholder="Search"
                className="flex-1"
              />
            )}
            <FilterButton />
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {selectable && (
                <th className="py-3 pl-6 pr-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 accent-[#2B39C7] cursor-pointer"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`text-left text-sm font-semibold text-[#1d242d] py-3 px-4 ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
              {rowActions && <th className="py-3 px-4 w-12" />}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="py-14 text-center text-gray-400 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const rowId = String(row[keyField] ?? i)
                const isEven = i % 2 === 1
                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-gray-100 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${isEven ? 'bg-[#F5F7FF]' : 'bg-white'} hover:bg-[#eef0fb]`}
                  >
                    {selectable && (
                      <td className="py-3.5 pl-6 pr-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(rowId)}
                          onChange={() => toggleRow(rowId)}
                          className="w-4 h-4 rounded border-gray-300 accent-[#2B39C7] cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} className={`py-3.5 px-4 text-[#1d242d] ${col.className ?? ''}`}>
                        {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="py-3.5 px-4">
                        <RowActionsMenu actions={rowActions(row)} />
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────────────────────
export function Pagination({
  page,
  total,
  perPage = 20,
  onPageChange,
  onPerPageChange,
}: {
  page: number
  total: number
  perPage?: number
  onPageChange: (p: number) => void
  onPerPageChange?: (n: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  // Build page number list: always show up to 5 pages around current
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = []
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      {/* Left — total count */}
      <span className="text-sm text-[#1d242d]">
        Total Data: <span className="font-medium">{total.toLocaleString()}</span>
      </span>

      {/* Center — page pills */}
      <div className="flex items-center gap-1.5">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="#1d242d" strokeWidth={2} />
        </button>

        {getPages().map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
                p === page
                  ? 'border border-[#1d242d] text-[#1d242d] font-semibold bg-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#1d242d" strokeWidth={2} />
        </button>
      </div>

      {/* Right — items per page */}
      <div className="flex items-center gap-2 text-sm text-[#1d242d]">
        <select
          value={perPage}
          onChange={e => onPerPageChange?.(Number(e.target.value))}
          disabled={!onPerPageChange}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-[#1d242d] bg-white focus:outline-none focus:ring-1 focus:ring-[#2B39C7] disabled:opacity-60 cursor-pointer"
        >
          {[5, 10, 20, 50].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-gray-500">Items per page</span>
      </div>
    </div>
  )
}
