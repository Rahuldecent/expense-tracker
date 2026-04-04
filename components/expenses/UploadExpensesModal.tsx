'use client'

import { useRef, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CATEGORIES } from '@/types'

interface PreviewRow {
  amount: number
  type: 'debit' | 'credit'
  category: string
  merchant: string
  description: string
  date: string
  bankName: string
  referenceNo: string
}

interface UploadExpensesModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Stage = 'pick' | 'preview' | 'done'

export default function UploadExpensesModal({ isOpen, onClose, onSuccess }: UploadExpensesModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('pick')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [result, setResult] = useState({ inserted: 0, skipped: 0 })

  const reset = () => {
    setStage('pick')
    setFile(null)
    setError('')
    setPreview([])
    setTotalRows(0)
    setSkipped(0)
    setResult({ inserted: 0, skipped: 0 })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) selectFile(dropped)
  }

  const selectFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('Only CSV (.csv) and Excel (.xlsx, .xls) files are supported.')
      return
    }
    setFile(f)
    setError('')
  }

  const handlePreview = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('preview', 'true')
      const res = await fetch('/api/expenses/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data.preview)
      setTotalRows(data.total)
      setSkipped(data.skipped)
      setStage('preview')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/expenses/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult({ inserted: data.inserted, skipped: data.skipped })
      setStage('done')
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const title =
    stage === 'pick' ? 'Upload Expenses' :
    stage === 'preview' ? `Preview — ${totalRows} valid rows` :
    'Import Complete'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Stage: Pick file ───────────────────────────────────── */}
      {stage === 'pick' && (
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all
              ${dragging ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/30 hover:border-violet-600/60 hover:bg-slate-800/50'}`}
          >
            <span className="text-5xl">{file ? '📄' : '☁️'}</span>
            {file ? (
              <>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </>
            ) : (
              <>
                <p className="text-white font-medium">Drag & drop your file here</p>
                <p className="text-slate-400 text-sm">or click to browse</p>
                <p className="text-slate-600 text-xs mt-1">Supports CSV, XLSX, XLS</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f) }}
            />
          </div>

          {/* Column guide */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected columns (flexible naming)</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
              <span><span className="text-violet-400">date</span> — Transaction date</span>
              <span><span className="text-violet-400">amount</span> — Transaction amount</span>
              <span><span className="text-violet-400">type</span> — debit / credit (or dr/cr)</span>
              <span><span className="text-violet-400">merchant</span> or narration / payee</span>
              <span><span className="text-violet-400">category</span> — optional, auto-detected</span>
              <span><span className="text-violet-400">description</span> / remarks — optional</span>
              <span><span className="text-violet-400">bank</span> — Bank name (optional)</span>
              <span><span className="text-violet-400">reference</span> / utr — optional</span>
            </div>
          </div>

          {/* Download sample */}
          <a
            href="data:text/csv;charset=utf-8,date,amount,type,merchant,category,description,bank,reference%0A2024-04-01,500,debit,Zomato,Food %26 Dining,Dinner,-,%0A2024-04-02,50000,credit,Salary,Others,Monthly salary,HDFC,REF123"
            download="sample-expenses.csv"
            className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            ⬇ Download sample CSV template
          </a>

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={handleClose}>Cancel</Button>
            <Button className="flex-1" disabled={!file} loading={loading} onClick={handlePreview}>
              Preview Import
            </Button>
          </div>
        </div>
      )}

      {/* ── Stage: Preview ─────────────────────────────────────── */}
      {stage === 'preview' && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
              <p className="text-emerald-400 font-bold text-xl">{totalRows}</p>
              <p className="text-slate-400">Valid rows</p>
            </div>
            <div className="flex-1 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
              <p className="text-amber-400 font-bold text-xl">{skipped}</p>
              <p className="text-slate-400">Skipped / invalid</p>
            </div>
          </div>

          <p className="text-xs text-slate-500">Showing first {preview.length} of {totalRows} rows</p>

          <div className="overflow-x-auto rounded-xl border border-slate-700/50 max-h-72">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-700/50">
                <tr>
                  {['Date', 'Merchant', 'Category', 'Type', 'Amount'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                      {formatDate(row.date, 'dd MMM yyyy')}
                    </td>
                    <td className="px-3 py-2 text-slate-300 max-w-[140px] truncate">
                      {row.merchant || row.description || '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300">
                        {row.category || 'Others'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${row.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className={`px-3 py-2 font-semibold whitespace-nowrap
                      ${row.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.type === 'credit' ? '+' : '-'}{formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setStage('pick')}>← Back</Button>
            <Button className="flex-1" loading={loading} onClick={handleImport}>
              Import {totalRows} Expense{totalRows !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* ── Stage: Done ────────────────────────────────────────── */}
      {stage === 'done' && (
        <div className="text-center space-y-5 py-4">
          <div className="text-6xl">✅</div>
          <div>
            <p className="text-white text-xl font-bold">Import Successful!</p>
            <p className="text-slate-400 text-sm mt-1">
              <span className="text-emerald-400 font-semibold">{result.inserted}</span> expenses imported
              {result.skipped > 0 && (
                <>, <span className="text-amber-400 font-semibold">{result.skipped}</span> skipped</>
              )}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => { reset() }}>Upload Another</Button>
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
