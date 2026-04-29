'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Contact } from '@/lib/db/schema'

interface Meta {
  categories: { source_category: string; cnt: string }[]
  subCategories: { sub_category: string; cnt: string }[]
  associations: { association: string; cnt: string }[]
  statusCounts: { email_status: string; cnt: string }[]
}

interface ApiResponse {
  data: Contact[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function Home() {
  const [data, setData] = useState<Contact[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('all')
  const [subCategory, setSubCategory] = useState('all')
  const [association, setAssociation] = useState('all')
  const [emailStatus, setEmailStatus] = useState('all')
  const [hasEmail, setHasEmail]       = useState('all')
  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(50)

  const buildParams = useCallback(() => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    p.set('pageSize', String(pageSize))
    if (search)              p.set('search', search)
    if (category !== 'all') p.set('category', category)
    if (subCategory !== 'all') p.set('subCategory', subCategory)
    if (association !== 'all') p.set('association', association)
    if (emailStatus !== 'all') p.set('emailStatus', emailStatus)
    if (hasEmail !== 'all')  p.set('hasEmail', hasEmail)
    return p
  }, [page, pageSize, search, category, subCategory, association, emailStatus, hasEmail])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts?${buildParams()}`)
      const json: ApiResponse = await res.json()
      setData(json.data)
      setTotal(json.total)
      setTotalPages(json.totalPages)
    } catch { toast.error('Failed to load contacts') }
    finally { setLoading(false) }
  }, [buildParams])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetch('/api/meta').then(r => r.json()).then(setMeta) }, [])

  const resetPage = () => setPage(1)

  const handleSearch = () => { setSearch(searchInput); resetPage() }

  const clearFilters = () => {
    setSearchInput(''); setSearch(''); setCategory('all')
    setSubCategory('all'); setAssociation('all')
    setEmailStatus('all'); setHasEmail('all'); resetPage()
  }

  const toggleStatus = async (id: number, current: string | null) => {
    const next = current === 'sent' ? 'not_sent' : 'sent'
    setUpdatingId(id)
    try {
      await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailStatus: next }),
      })
      setData(prev => prev.map(c => c.id === id ? { ...c, emailStatus: next } : c))
      toast.success(next === 'sent' ? '✅ Marked as Sent' : '⬜ Marked as Not Sent')
    } catch { toast.error('Failed to update') }
    finally { setUpdatingId(null) }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const p = buildParams(); p.delete('page'); p.delete('pageSize')
      const res = await fetch(`/api/export?${p}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `mm-contacts-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${total.toLocaleString()} records`)
    } catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  const sentCount    = meta?.statusCounts.find(s => s.email_status === 'sent')?.cnt ?? '0'
  const notSentCount = meta?.statusCounts.find(s => s.email_status === 'not_sent')?.cnt ?? '0'
  const hasFilters   = search || category !== 'all' || subCategory !== 'all' || association !== 'all' || emailStatus !== 'all' || hasEmail !== 'all'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight">MetaMorPhosis — Marketing Database</h1>
          <p className="text-xs text-gray-500">All contacts across Gold Mine · EPZ · Tourism · Odoo · Associations</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center"><div className="font-bold text-gray-900">{total.toLocaleString()}</div><div className="text-[10px] text-gray-500 uppercase tracking-wide">Filtered</div></div>
          <div className="text-center"><div className="font-bold text-green-600">{Number(sentCount).toLocaleString()}</div><div className="text-[10px] text-gray-500 uppercase tracking-wide">Sent</div></div>
          <div className="text-center"><div className="font-bold text-gray-400">{Number(notSentCount).toLocaleString()}</div><div className="text-[10px] text-gray-500 uppercase tracking-wide">Not Sent</div></div>
          <Button size="sm" onClick={exportCsv} disabled={exporting} variant="outline">
            {exporting ? 'Exporting…' : '⬇ Export CSV'}
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b bg-gray-50 px-6 py-2 flex flex-wrap gap-2 items-center shrink-0">
        <div className="flex gap-1 flex-1 min-w-[260px]">
          <Input placeholder="Search name, company, email, phone, address…" value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="bg-white text-sm h-8" />
          <Button size="sm" className="h-8 px-3" onClick={handleSearch}>Search</Button>
          {hasFilters && <Button size="sm" variant="ghost" className="h-8 px-3" onClick={clearFilters}>✕ Clear</Button>}
        </div>

        <Select value={category} onValueChange={(v: string | null) => { setCategory(v ?? 'all'); setSubCategory('all'); setAssociation('all'); resetPage() }}>
          <SelectTrigger className="w-[170px] bg-white h-8 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {meta?.categories.map(c => <SelectItem key={c.source_category} value={c.source_category}>{c.source_category} ({Number(c.cnt).toLocaleString()})</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={subCategory} onValueChange={(v: string | null) => { setSubCategory(v ?? 'all'); resetPage() }}>
          <SelectTrigger className="w-[200px] bg-white h-8 text-sm"><SelectValue placeholder="Sub-Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sub-Categories</SelectItem>
            {meta?.subCategories.map(c => <SelectItem key={c.sub_category} value={c.sub_category}>{c.sub_category} ({Number(c.cnt).toLocaleString()})</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={association} onValueChange={(v: string | null) => { setAssociation(v ?? 'all'); resetPage() }}>
          <SelectTrigger className="w-[160px] bg-white h-8 text-sm"><SelectValue placeholder="Association" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Associations</SelectItem>
            {meta?.associations.map(a => <SelectItem key={a.association} value={a.association}>{a.association} ({Number(a.cnt).toLocaleString()})</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={emailStatus} onValueChange={(v: string | null) => { setEmailStatus(v ?? 'all'); resetPage() }}>
          <SelectTrigger className="w-[130px] bg-white h-8 text-sm"><SelectValue placeholder="Email Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_sent">Not Sent</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={hasEmail} onValueChange={(v: string | null) => { setHasEmail(v ?? 'all'); resetPage() }}>
          <SelectTrigger className="w-[130px] bg-white h-8 text-sm"><SelectValue placeholder="Has Email?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Records</SelectItem>
            <SelectItem value="yes">Has Email</SelectItem>
            <SelectItem value="no">No Email</SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(pageSize)} onValueChange={(v: string | null) => { setPageSize(Number(v ?? 50)); resetPage() }}>
          <SelectTrigger className="w-[100px] bg-white h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[25, 50, 100, 200].map(n => <SelectItem key={n} value={String(n)}>{n}/page</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow className="border-b shadow-sm">
              <TableHead className="w-12 text-xs">#</TableHead>
              <TableHead className="min-w-[150px] text-xs">Name</TableHead>
              <TableHead className="min-w-[190px] text-xs">Company</TableHead>
              <TableHead className="min-w-[140px] text-xs">Designation</TableHead>
              <TableHead className="min-w-[190px] text-xs">Email</TableHead>
              <TableHead className="min-w-[120px] text-xs">Phone</TableHead>
              <TableHead className="min-w-[100px] text-xs">Association</TableHead>
              <TableHead className="min-w-[120px] text-xs">Category</TableHead>
              <TableHead className="min-w-[180px] text-xs">Address</TableHead>
              <TableHead className="w-[110px] text-xs text-center">Email Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-24 text-gray-400 text-sm">Loading…</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-24 text-gray-400 text-sm">No records found</TableCell></TableRow>
            ) : data.map((row, i) => (
              <TableRow key={row.id} className="hover:bg-gray-50 text-sm">
                <TableCell className="text-gray-400 text-xs py-2">{(page-1)*pageSize+i+1}</TableCell>
                <TableCell className="py-2 font-medium">{row.name || <span className="text-gray-300">—</span>}</TableCell>
                <TableCell className="py-2">{row.company || <span className="text-gray-300">—</span>}</TableCell>
                <TableCell className="py-2 text-xs text-gray-600">{row.designation || <span className="text-gray-300">—</span>}</TableCell>
                <TableCell className="py-2 text-xs">
                  {row.email
                    ? <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline">{row.email}</a>
                    : <span className="text-gray-300">—</span>}
                </TableCell>
                <TableCell className="py-2 text-xs text-gray-700">{row.phone || <span className="text-gray-300">—</span>}</TableCell>
                <TableCell className="py-2">
                  {row.association ? <Badge variant="outline" className="text-xs py-0">{row.association}</Badge> : <span className="text-gray-300 text-xs">—</span>}
                </TableCell>
                <TableCell className="py-2 text-xs text-gray-500">{row.subCategory || row.sourceCategory || '—'}</TableCell>
                <TableCell className="py-2 text-xs text-gray-500 max-w-[180px] truncate" title={row.address ?? ''}>{row.address || <span className="text-gray-300">—</span>}</TableCell>
                <TableCell className="py-2 text-center">
                  <button
                    onClick={() => toggleStatus(row.id, row.emailStatus)}
                    disabled={updatingId === row.id}
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-all cursor-pointer whitespace-nowrap ${
                      row.emailStatus === 'sent'
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                    } disabled:opacity-40`}
                  >
                    {updatingId === row.id ? '…' : row.emailStatus === 'sent' ? '✅ Sent' : '⬜ Not Sent'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="border-t bg-white px-6 py-2 flex items-center justify-between shrink-0">
        <p className="text-xs text-gray-500">
          Showing {((page-1)*pageSize+1).toLocaleString()}–{Math.min(page*pageSize, total).toLocaleString()} of {total.toLocaleString()} records
        </p>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPage(1)} disabled={page===1}>«</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>‹</Button>
          <span className="text-xs text-gray-500 px-2 flex items-center">Page {page} / {totalPages.toLocaleString()}</span>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page>=totalPages}>›</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setPage(totalPages)} disabled={page>=totalPages}>»</Button>
        </div>
      </div>
    </div>
  )
}
