"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3,
  Plus, Trash2, Pencil, Download,
} from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import {
  ChartTooltip, ChartGradients, ChartGlow,
  CHART_GRID_STYLES, CHART_AXIS_STYLES, CHART_CURSOR_STYLES,
} from "@/components/charts/chart-components"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useFinanceStore } from "@/store/use-finance-store"

type InvestmentTab = "overview" | "sips" | "stocks" | "funds" | "archive"

const tabs: { key: InvestmentTab; label: string; icon: typeof TrendingUp }[] = [
  { key: "overview", label: "Overview", icon: TrendingUp },
  { key: "sips", label: "SIPs", icon: PiggyBank },
  { key: "stocks", label: "Stocks", icon: BarChart3 },
  { key: "funds", label: "Mutual Funds", icon: Wallet },
  { key: "archive", label: "Archive", icon: Download },
]

const COLORS = ["#3b82f6", "#10b981", "#a855f7", "#f97316", "#ef4444", "#06b6d4"]

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n}%`
}

// ─── Overview ─────────────────────────────────────────────

function OverviewTab() {
  const { sips, stocks, mutualFunds } = useFinanceStore()

  const sipInvested = sips.reduce((s, i) => s + i.investedAmount, 0)
  const sipCurrent = sips.reduce((s, i) => s + i.currentValue, 0)
  const stockInvested = stocks.reduce((s, i) => s + i.buyPrice * i.quantity, 0)
  const stockCurrent = stocks.reduce((s, i) => s + i.currentPrice * i.quantity, 0)
  const mfInvested = mutualFunds.reduce((s, i) => s + i.investedAmount, 0)
  const mfCurrent = mutualFunds.reduce((s, i) => s + i.currentValue, 0)

  const totalInvested = sipInvested + stockInvested + mfInvested
  const totalCurrent = sipCurrent + stockCurrent + mfCurrent
  const totalGain = totalCurrent - totalInvested
  const totalGainPct = totalInvested > 0 ? Math.round((totalGain / totalInvested) * 100) : 0

  const hasData = totalInvested > 0

  const allocationData = useMemo(() =>
    [
      { name: "SIPs", value: sipInvested, color: COLORS[0] },
      { name: "Stocks", value: stockInvested, color: COLORS[1] },
      { name: "Mutual Funds", value: mfInvested, color: COLORS[2] },
    ].filter((d) => d.value > 0),
    [sipInvested, stockInvested, mfInvested]
  )

  const barData = useMemo(() =>
    [
      { name: "SIPs", invested: sipInvested, current: sipCurrent },
      { name: "Stocks", invested: stockInvested, current: stockCurrent },
      { name: "MFs", invested: mfInvested, current: mfCurrent },
    ].filter((d) => d.invested > 0 || d.current > 0),
    [sipInvested, sipCurrent, stockInvested, stockCurrent, mfInvested, mfCurrent]
  )

  const sectorData = useMemo(() =>
    [
      { label: "SIPs", invested: sipInvested, current: sipCurrent, color: COLORS[0], icon: PiggyBank },
      { label: "Stocks", invested: stockInvested, current: stockCurrent, color: COLORS[1], icon: BarChart3 },
      { label: "Mutual Funds", invested: mfInvested, current: mfCurrent, color: COLORS[2], icon: Wallet },
    ].filter((s) => s.invested > 0),
    [sipInvested, sipCurrent, stockInvested, stockCurrent, mfInvested, mfCurrent]
  )

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800">
        <Wallet className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        <p className="text-base font-medium text-neutral-500 dark:text-neutral-400">No investments yet</p>
        <p className="mt-1.5 text-sm text-neutral-400 dark:text-neutral-500">Add SIPs, stocks, or mutual funds to see your portfolio</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Hero stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <Wallet className="h-4.5 w-4.5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Invested</span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{fmt(totalInvested)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Current Value</span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{fmt(totalCurrent)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-3xl border p-5",
            totalGain >= 0
              ? "border-green-200/60 bg-gradient-to-br from-green-50 to-emerald-50/30 dark:border-green-900/30 dark:from-green-950/20 dark:to-emerald-950/10"
              : "border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50/30 dark:border-red-900/30 dark:from-red-950/20 dark:to-rose-950/10"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", totalGain >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
              {totalGain >= 0 ? <TrendingUp className="h-4.5 w-4.5 text-green-600 dark:text-green-400" /> : <TrendingDown className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />}
            </div>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Gain/Loss</span>
          </div>
          <p className={cn("mt-3 text-2xl font-bold tracking-tight", totalGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
            {totalGain >= 0 ? "+" : ""}{fmt(totalGain)}
          </p>
          <p className={cn("mt-0.5 text-sm font-medium", totalGain >= 0 ? "text-green-600/70" : "text-red-500/70")}>
            {fmtPct(totalGainPct)}
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Allocation donut */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card-modern glass rounded-3xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Allocation</h3>
          <p className="mt-0.5 text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Where your money is</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartGlow id="inv-pie-glow" />
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  cornerRadius={8}
                  dataKey="value"
                  stroke="none"
                >
                  {allocationData.map((d, i) => (
                    <Cell key={i} fill={d.color} style={{ filter: "url(#inv-pie-glow)" }} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => fmt(Number(v))} />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Invested vs Current bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className="card-modern glass rounded-3xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Invested vs Current</h3>
          <p className="mt-0.5 text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Portfolio comparison</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <ChartGradients ids={["inv-invested", "inv-current"]} />
                <XAxis dataKey="name" {...CHART_AXIS_STYLES} />
                <YAxis {...CHART_AXIS_STYLES} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt(Number(v))} />} cursor={CHART_CURSOR_STYLES} />
                <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{value}</span>} />
                <Bar dataKey="invested" fill="url(#inv-invested)" radius={[8, 8, 2, 2]} barSize={20} name="Invested" />
                <Bar dataKey="current" fill="url(#inv-current)" radius={[8, 8, 2, 2]} barSize={20} name="Current" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Sector breakdown cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {sectorData.map((sec, i) => {
          const gain = sec.current - sec.invested
          const pct = sec.invested > 0 ? Math.round((gain / sec.invested) * 100) : 0
          const Icon = sec.icon
          return (
            <motion.div
              key={sec.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="rounded-3xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${sec.color}15` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: sec.color }} />
                </div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{sec.label}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Invested</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{fmt(sec.invested)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Current</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{fmt(sec.current)}</span>
                </div>
                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2 flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Gain/Loss</span>
                  <span className={cn("font-semibold", gain >= 0 ? "text-green-600" : "text-red-500")}>
                    {gain >= 0 ? "+" : ""}{fmt(gain)} ({fmtPct(pct)})
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SIPs ─────────────────────────────────────────────────

function SipsTab() {
  const { sips, addSIP, updateSIP, deleteSIP } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", amount: 0, startDate: "", endDate: "" as string | null, frequency: "monthly" as "monthly" | "quarterly", expectedReturn: 0, investedAmount: 0, currentValue: 0 })

  const reset = () => setForm({ name: "", amount: 0, startDate: "", endDate: "", frequency: "monthly", expectedReturn: 0, investedAmount: 0, currentValue: 0 })

  const openCreate = () => { reset(); setEditId(null); setDialogOpen(true) }
  const openEdit = (s: typeof sips[0]) => {
    setEditId(s.id)
    setForm({ name: s.name, amount: s.amount, startDate: s.startDate, endDate: s.endDate, frequency: s.frequency, expectedReturn: s.expectedReturn, investedAmount: s.investedAmount, currentValue: s.currentValue })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.amount) return
    if (editId) updateSIP(editId, { ...form, endDate: form.endDate || null })
    else addSIP({ ...form, endDate: form.endDate || null })
    setDialogOpen(false); setEditId(null); reset()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">SIPs ({sips.length})</h3>
        <Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add SIP</Button>
      </div>

      {sips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-14 dark:border-neutral-800">
          <PiggyBank className="mb-3 h-9 w-9 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No SIPs yet</p>
          <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add first SIP</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sips.map((s, i) => {
            const gain = s.currentValue - s.investedAmount
            const pct = s.investedAmount > 0 ? Math.round((gain / s.investedAmount) * 100) : 0
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{s.name}</h4>
                    <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{fmt(s.amount)}/{s.frequency} &middot; Since {s.startDate}</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteSIP(s.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-neutral-50 py-2 dark:bg-neutral-800/50">
                    <p className="text-[10px] text-neutral-400">Invested</p>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">{fmt(s.investedAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 py-2 dark:bg-neutral-800/50">
                    <p className="text-[10px] text-neutral-400">Current</p>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">{fmt(s.currentValue)}</p>
                  </div>
                  <div className={cn("rounded-xl py-2", gain >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20")}>
                    <p className="text-[10px] text-neutral-400">Return</p>
                    <p className={cn("text-xs font-semibold", gain >= 0 ? "text-green-600" : "text-red-500")}>{fmtPct(pct)}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setDialogOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{editId ? "Edit" : "Add"} SIP</h3>
              <div className="mt-5 space-y-3">
                <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Name</Label><Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HDFC Mid-Cap" autoFocus /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Amount (₹)</Label><Input className="mt-1.5" type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Frequency</Label><Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as "monthly" | "quarterly" })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Start</Label><Input className="mt-1.5" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">End (opt.)</Label><Input className="mt-1.5" type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Invested (₹)</Label><Input className="mt-1.5" type="number" value={form.investedAmount || ""} onChange={(e) => setForm({ ...form, investedAmount: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Current (₹)</Label><Input className="mt-1.5" type="number" value={form.currentValue || ""} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} /></div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={!form.name || !form.amount} onClick={handleSave}>{editId ? "Save" : "Add SIP"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Stocks ───────────────────────────────────────────────

function StocksTab() {
  const { stocks, addStock, updateStock, deleteStock } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", ticker: "", buyPrice: 0, quantity: 0, currentPrice: 0, sector: "" })

  const reset = () => setForm({ name: "", ticker: "", buyPrice: 0, quantity: 0, currentPrice: 0, sector: "" })
  const openCreate = () => { reset(); setEditId(null); setDialogOpen(true) }
  const openEdit = (s: typeof stocks[0]) => {
    setEditId(s.id)
    setForm({ name: s.name, ticker: s.ticker, buyPrice: s.buyPrice, quantity: s.quantity, currentPrice: s.currentPrice, sector: s.sector })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.ticker || !form.buyPrice || !form.quantity) return
    if (editId) updateStock(editId, form)
    else addStock(form)
    setDialogOpen(false); setEditId(null); reset()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Stocks ({stocks.length})</h3>
        <Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Stock</Button>
      </div>

      {stocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-14 dark:border-neutral-800">
          <BarChart3 className="mb-3 h-9 w-9 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No stocks yet</p>
          <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add first stock</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {stocks.map((s, i) => {
            const invested = s.buyPrice * s.quantity
            const current = s.currentPrice * s.quantity
            const gain = current - invested
            const pct = invested > 0 ? Math.round((gain / invested) * 100) : 0
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{s.name}</h4>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{s.ticker.toUpperCase()}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{s.sector || "N/A"} &middot; {s.quantity} shares</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteStock(s.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-neutral-50 py-2 dark:bg-neutral-800/50">
                    <p className="text-[10px] text-neutral-400">Invested</p>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">{fmt(invested)}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 py-2 dark:bg-neutral-800/50">
                    <p className="text-[10px] text-neutral-400">Current</p>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">{fmt(current)}</p>
                  </div>
                  <div className={cn("rounded-xl py-2", gain >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20")}>
                    <p className="text-[10px] text-neutral-400">P&L</p>
                    <p className={cn("text-xs font-semibold", gain >= 0 ? "text-green-600" : "text-red-500")}>{fmtPct(pct)}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {dialogOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setDialogOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{editId ? "Edit" : "Add"} Stock</h3>
              <div className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Name</Label><Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reliance" autoFocus /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Ticker</Label><Input className="mt-1.5" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="RELIANCE" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Buy Price (₹)</Label><Input className="mt-1.5" type="number" value={form.buyPrice || ""} onChange={(e) => setForm({ ...form, buyPrice: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Quantity</Label><Input className="mt-1.5" type="number" value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Current Price (₹)</Label><Input className="mt-1.5" type="number" value={form.currentPrice || ""} onChange={(e) => setForm({ ...form, currentPrice: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Sector</Label><Input className="mt-1.5" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Technology" /></div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={!form.name || !form.ticker || !form.buyPrice || !form.quantity} onClick={handleSave}>{editId ? "Save" : "Add Stock"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Mutual Funds ─────────────────────────────────────────

function FundsTab() {
  const { mutualFunds, addMutualFund, updateMutualFund, deleteMutualFund } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", fundHouse: "", nav: 0, units: 0, investedAmount: 0, currentValue: 0 })

  const reset = () => setForm({ name: "", fundHouse: "", nav: 0, units: 0, investedAmount: 0, currentValue: 0 })
  const openCreate = () => { reset(); setEditId(null); setDialogOpen(true) }
  const openEdit = (m: typeof mutualFunds[0]) => {
    setEditId(m.id)
    setForm({ name: m.name, fundHouse: m.fundHouse, nav: m.nav, units: m.units, investedAmount: m.investedAmount, currentValue: m.currentValue })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.nav || !form.units) return
    if (editId) updateMutualFund(editId, form)
    else addMutualFund(form)
    setDialogOpen(false); setEditId(null); reset()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Mutual Funds ({mutualFunds.length})</h3>
        <Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Fund</Button>
      </div>

      {mutualFunds.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-14 dark:border-neutral-800">
          <Wallet className="mb-3 h-9 w-9 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No mutual funds yet</p>
          <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add first fund</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {mutualFunds.map((mf, i) => {
            const gain = mf.currentValue - mf.investedAmount
            const pct = mf.investedAmount > 0 ? Math.round((gain / mf.investedAmount) * 100) : 0
            return (
              <motion.div
                key={mf.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{mf.name}</h4>
                    <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{mf.fundHouse} &middot; {mf.units} units @ ₹{mf.nav}</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => openEdit(mf)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteMutualFund(mf.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-neutral-50 py-2 dark:bg-neutral-800/50">
                    <p className="text-[10px] text-neutral-400">Invested</p>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">{fmt(mf.investedAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 py-2 dark:bg-neutral-800/50">
                    <p className="text-[10px] text-neutral-400">Current</p>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">{fmt(mf.currentValue)}</p>
                  </div>
                  <div className={cn("rounded-xl py-2", gain >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20")}>
                    <p className="text-[10px] text-neutral-400">Return</p>
                    <p className={cn("text-xs font-semibold", gain >= 0 ? "text-green-600" : "text-red-500")}>{fmtPct(pct)}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {dialogOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setDialogOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{editId ? "Edit" : "Add"} Mutual Fund</h3>
              <div className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Fund Name</Label><Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mid-Cap Fund" autoFocus /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Fund House</Label><Input className="mt-1.5" value={form.fundHouse} onChange={(e) => setForm({ ...form, fundHouse: e.target.value })} placeholder="HDFC" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">NAV (₹)</Label><Input className="mt-1.5" type="number" value={form.nav || ""} onChange={(e) => setForm({ ...form, nav: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Units</Label><Input className="mt-1.5" type="number" value={form.units || ""} onChange={(e) => setForm({ ...form, units: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Invested (₹)</Label><Input className="mt-1.5" type="number" value={form.investedAmount || ""} onChange={(e) => setForm({ ...form, investedAmount: Number(e.target.value) })} /></div>
                  <div><Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Current (₹)</Label><Input className="mt-1.5" type="number" value={form.currentValue || ""} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} /></div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={!form.name || !form.nav || !form.units} onClick={handleSave}>{editId ? "Save" : "Add Fund"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Archive ──────────────────────────────────────────────

function ArchiveTab() {
  const { sips, stocks, mutualFunds, clearSIPs, clearStocks, clearMutualFunds } = useFinanceStore()

  const handleExport = async () => {
    const data = [
      ...sips.map((s) => ({ Type: "SIP", Name: s.name, Amount: s.amount, Invested: s.investedAmount, Current: s.currentValue })),
      ...stocks.map((s) => ({ Type: "Stock", Name: s.name, Invested: s.buyPrice * s.quantity, Current: s.currentPrice * s.quantity })),
      ...mutualFunds.map((mf) => ({ Type: "MF", Name: mf.name, Invested: mf.investedAmount, Current: mf.currentValue })),
    ]
    const XLSX = await import("xlsx")
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Investments")
    XLSX.writeFile(wb, "investments.xlsx")
  }

  const hasData = sips.length > 0 || stocks.length > 0 || mutualFunds.length > 0

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2"><Download className="h-3.5 w-3.5" /> Export</Button>
        <Button variant="outline" size="sm" onClick={() => { clearSIPs(); clearStocks(); clearMutualFunds() }} className="gap-2 text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /> Clear All</Button>
      </div>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-16 dark:border-neutral-800">
          <Download className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No investments to archive</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900 space-y-4">
          {sips.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">SIPs ({sips.length})</h4>
              <div className="space-y-1.5">
                {sips.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{s.name}</span>
                    <span className="text-xs text-neutral-500">{fmt(s.investedAmount)} &rarr; {fmt(s.currentValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stocks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">Stocks ({stocks.length})</h4>
              <div className="space-y-1.5">
                {stocks.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{s.name} <span className="text-[10px] text-neutral-400">{s.ticker.toUpperCase()}</span></span>
                    <span className="text-xs text-neutral-500">{fmt(s.buyPrice * s.quantity)} &rarr; {fmt(s.currentPrice * s.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mutualFunds.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">Mutual Funds ({mutualFunds.length})</h4>
              <div className="space-y-1.5">
                {mutualFunds.map((mf) => (
                  <div key={mf.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{mf.name}</span>
                    <span className="text-xs text-neutral-500">{fmt(mf.investedAmount)} &rarr; {fmt(mf.currentValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────

export function InvestmentsPanel() {
  const [tab, setTab] = useState<InvestmentTab>("overview")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Investments</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Track SIPs, stocks, mutual funds, and portfolio performance</p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0",
                tab === t.key ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" /> {t.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === "overview" && <OverviewTab />}
          {tab === "sips" && <SipsTab />}
          {tab === "stocks" && <StocksTab />}
          {tab === "funds" && <FundsTab />}
          {tab === "archive" && <ArchiveTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
