"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, LayoutDashboard,
  Plus, Trash2, Pencil, Download, ArrowUpRight, ArrowDownRight, Sparkles, Coins,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useFinanceStore } from "@/store/use-finance-store"
import { PlanTracker } from "@/components/finance/plan-tracker"
import {
  PlanFields, PlanDraft, draftFromPlan, draftToPlan, emptyPlanDraft,
} from "@/components/finance/plan-fields"
import { toggleLatestPaid } from "@/lib/investment-plan"
import type { SIP, Stock, MutualFund } from "@/types"

type InvestmentTab = "dashboard" | "sips" | "stocks" | "funds" | "archive"

const tabs: { key: InvestmentTab; label: string; icon: typeof TrendingUp }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "sips", label: "SIPs", icon: PiggyBank },
  { key: "stocks", label: "Stocks", icon: BarChart3 },
  { key: "funds", label: "Mutual Funds", icon: Wallet },
  { key: "archive", label: "Archive", icon: Download },
]

const COLORS = ["#525252", "#404040", "#737373", "#a3a3a3", "#171717", "#d4d4d4"]
const SECTORS = ["Technology", "Banking / Financial", "Energy", "Automobile", "Pharma", "Consumer", "Infrastructure", "Metals", "FMCG", "IT Services"]
const FUND_HOUSES = ["HDFC", "SBI", "ICICI Prudential", "Nippon India", "Kotak", "Axis", "UTI", "Aditya Birla", "Motilal Oswal", "Tata", "Parag Parikh", "Mirae"]

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n}%`
}

function AssetCardHeader({ label, icon: Icon, action }: { label: string; icon: typeof Wallet; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <Icon className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
        </div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{label}</h3>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ icon: Icon, title, onAdd }: { icon: typeof Wallet; title: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-14 dark:border-neutral-800">
      <Icon className="mb-3 h-9 w-9 text-neutral-300 dark:text-neutral-600" />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{title}</p>
      <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={onAdd}><Plus className="h-3.5 w-3.5" /> Add first</Button>
    </div>
  )
}

// ─── Dashboard (visual overview) ──────────────────────────

function DashboardTab() {
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
  const assetCount = sips.length + stocks.length + mutualFunds.length

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

  const holdings = useMemo(() => {
    const list: { name: string; type: string; invested: number; current: number; pct: number }[] = [
      ...sips.map((s) => ({ name: s.name, type: "SIP", invested: s.investedAmount, current: s.currentValue, pct: s.investedAmount > 0 ? Math.round(((s.currentValue - s.investedAmount) / s.investedAmount) * 100) : 0 })),
      ...stocks.map((s) => { const invested = s.buyPrice * s.quantity; const current = s.currentPrice * s.quantity; return { name: s.ticker ? s.ticker.toUpperCase() : s.name, type: "Stock", invested, current, pct: invested > 0 ? Math.round(((current - invested) / invested) * 100) : 0 } }),
      ...mutualFunds.map((m) => ({ name: m.name, type: "Fund", invested: m.investedAmount, current: m.currentValue, pct: m.investedAmount > 0 ? Math.round(((m.currentValue - m.investedAmount) / m.investedAmount) * 100) : 0 })),
    ]
    return list.sort((a, b) => b.pct - a.pct)
  }, [sips, stocks, mutualFunds])

  const leaders = holdings.slice(0, 3)
  const laggards = [...holdings].reverse().slice(0, 3)

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-20 text-center dark:border-neutral-800">
        <Wallet className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        <p className="text-base font-medium text-neutral-500 dark:text-neutral-400">No investments yet</p>
        <p className="mt-1.5 max-w-xs text-sm text-neutral-400 dark:text-neutral-500">Add SIPs, stocks, or mutual funds and your portfolio visuals will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Wallet className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </div>
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Invested</span>
          </div>
          <p className="mt-2.5 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl">{fmt(totalInvested)}</p>
          <p className="text-[10px] text-neutral-400">{assetCount} active holding{assetCount === 1 ? "" : "s"}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Current Value</span>
          </div>
          <p className="mt-2.5 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl">{fmt(totalCurrent)}</p>
          <p className="text-[10px] text-neutral-400">Your money today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl border p-4",
            totalGain >= 0
              ? "border-green-200/60 bg-gradient-to-br from-green-50 to-emerald-50/30 dark:border-green-900/30 dark:from-green-950/20 dark:to-emerald-950/10"
              : "border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50/30 dark:border-red-900/30 dark:from-red-950/20 dark:to-rose-950/10"
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", totalGain >= 0 ? "bg-green-100 dark:bg-green-950/40" : "bg-red-100 dark:bg-red-950/40")}>
              {totalGain >= 0 ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
            </div>
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Total P&L</span>
          </div>
          <p className={cn("mt-2.5 text-lg font-bold tracking-tight sm:text-2xl", totalGain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
            {totalGain >= 0 ? "+" : ""}{fmt(totalGain)}
          </p>
          <p className={cn("text-[10px] font-semibold", totalGain >= 0 ? "text-green-600/70" : "text-red-500/70")}>{fmtPct(totalGainPct)} overall</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Return %</span>
          </div>
          <p className={cn("mt-2.5 text-lg font-bold tracking-tight sm:text-2xl", totalGainPct >= 0 ? "text-neutral-900 dark:text-neutral-50" : "text-red-500")}>{fmtPct(totalGainPct)}</p>
          <p className="text-[10px] text-neutral-400">Across portfolio</p>
        </motion.div>
      </div>

      {/* Allocation stack bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Allocation by class</h3>
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          {allocationData.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / totalInvested) * 100}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ backgroundColor: d.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {allocationData.map((d) => (
            <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name} · {Math.round((d.value / totalInvested) * 100)}%
            </span>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Allocation</h3>
          <p className="mt-0.5 text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Where your money is</p>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartGlow id="inv-pie-glow" />
                <Pie
                  data={allocationData}
                  cx="50%" cy="50%" innerRadius={62} outerRadius={90}
                  paddingAngle={5} cornerRadius={8} dataKey="value" stroke="none"
                >
                  {allocationData.map((d, i) => (
                    <Cell key={i} fill={d.color} style={{ filter: "url(#inv-pie-glow)" }} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => fmt(Number(v))} />} />
                <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Invested vs Current</h3>
          <p className="mt-0.5 text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Portfolio comparison</p>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <ChartGradients ids={["inv-invested", "inv-current"]} />
                <XAxis dataKey="name" {...CHART_AXIS_STYLES} />
                <YAxis {...CHART_AXIS_STYLES} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt(Number(v))} />} cursor={CHART_CURSOR_STYLES} />
                <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{value}</span>} />
                <Bar dataKey="invested" fill="url(#inv-invested)" radius={[8, 8, 2, 2]} barSize={18} name="Invested" />
                <Bar dataKey="current" fill="url(#inv-current)" radius={[8, 8, 2, 2]} barSize={18} name="Current" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Leaders & laggards */}
      {holdings.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Top Performers</h3>
            </div>
            <div className="mt-3 space-y-2">
              {leaders.map((h) => (
                <div key={h.name + h.type} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold", h.pct >= 0 ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400" : "bg-red-100 text-red-500 dark:bg-red-950/40 dark:text-red-400")}>
                    {h.pct >= 0 ? "▲" : "▼"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{h.name}</p>
                    <p className="text-[10px] text-neutral-400">{h.type} · {fmt(h.invested)}</p>
                  </div>
                  <span className={cn("flex items-center gap-0.5 text-sm font-bold", h.pct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                    {h.pct >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {fmtPct(h.pct)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Needs Attention</h3>
            </div>
            <div className="mt-3 space-y-2">
              {laggards.map((h) => (
                <div key={h.name + h.type + h.pct} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold", h.pct >= 0 ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400" : "bg-red-100 text-red-500 dark:bg-red-950/40 dark:text-red-400")}>
                    {h.pct >= 0 ? "▲" : "▼"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{h.name}</p>
                    <p className="text-[10px] text-neutral-400">{h.type} · {fmt(h.invested)}</p>
                  </div>
                  <span className={cn("flex items-center gap-0.5 text-sm font-bold", h.pct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                    {h.pct >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {fmtPct(h.pct)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Per-class breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "SIPs", invested: sipInvested, current: sipCurrent, color: COLORS[0], icon: PiggyBank },
          { label: "Stocks", invested: stockInvested, current: stockCurrent, color: COLORS[1], icon: BarChart3 },
          { label: "Mutual Funds", invested: mfInvested, current: mfCurrent, color: COLORS[2], icon: Wallet },
        ].filter((s) => s.invested > 0).map((sec, i) => {
          const gain = sec.current - sec.invested
          const pct = sec.invested > 0 ? Math.round((gain / sec.invested) * 100) : 0
          const Icon = sec.icon
          const max = Math.max(sec.invested, sec.current) || 1
          return (
            <motion.div
              key={sec.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${sec.color}15` }}>
                  <Icon className="h-4 w-4" style={{ color: sec.color }} />
                </div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{sec.label}</span>
                <span className={cn("ml-auto text-xs font-bold", gain >= 0 ? "text-green-600" : "text-red-500")}>{fmtPct(pct)}</span>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Invested</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{fmt(sec.invested)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Current</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{fmt(sec.current)}</span>
                </div>
                <div className="mt-2 flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(sec.invested / max) * 100}%` }} transition={{ delay: 0.55 + i * 0.05, duration: 0.5 }} className="h-full rounded-full" style={{ backgroundColor: sec.color }} />
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
  const [planDraft, setPlanDraft] = useState<PlanDraft>(emptyPlanDraft)

  const reset = () => {
    setForm({ name: "", amount: 0, startDate: "", endDate: "", frequency: "monthly", expectedReturn: 0, investedAmount: 0, currentValue: 0 })
    setPlanDraft(emptyPlanDraft)
  }
  const openCreate = () => { reset(); setEditId(null); setDialogOpen(true) }
  const openEdit = (s: typeof sips[0]) => {
    setEditId(s.id)
    setForm({ name: s.name, amount: s.amount, startDate: s.startDate, endDate: s.endDate, frequency: s.frequency, expectedReturn: s.expectedReturn, investedAmount: s.investedAmount, currentValue: s.currentValue })
    setPlanDraft(draftFromPlan(s.plan))
    setDialogOpen(true)
  }
  const handleSave = () => {
    if (!form.name || !form.amount) return
    const plan = draftToPlan(planDraft, editId ? (sips.find((x) => x.id === editId)?.plan?.paid ?? []) : [])
    if (editId) updateSIP(editId, { ...form, endDate: form.endDate || null, plan })
    else addSIP({ ...form, endDate: form.endDate || null, plan })
    setDialogOpen(false); setEditId(null); reset()
  }

  return (
    <div className="space-y-4">
      <AssetCardHeader
        label={`SIPs (${sips.length})`}
        icon={PiggyBank}
        action={<Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add SIP</Button>}
      />

      {sips.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No SIPs yet" onAdd={openCreate} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sips.map((s, i) => {
            const gain = s.currentValue - s.investedAmount
            const pct = s.investedAmount > 0 ? Math.round((gain / s.investedAmount) * 100) : 0
            const monthsElapsed = s.startDate ? Math.max(0, Math.floor((Date.now() - new Date(s.startDate).getTime()) / 2592000000)) : 0
            const expected = s.investedAmount * Math.pow(1 + (s.expectedReturn || 0) / 100 / 12, monthsElapsed)
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-900 dark:shadow-none"
              >
                <div className={cn("absolute inset-x-0 top-0 h-0.5", pct >= 0 ? "bg-gradient-to-r from-green-400/60 to-transparent" : "bg-gradient-to-r from-red-400/60 to-transparent")} />
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{s.name}</h4>
                    <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{fmt(s.amount)}/{s.frequency} · Since {s.startDate || "—"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} aria-label="Edit" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteSIP(s.id)} aria-label="Delete" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-red-950/60 dark:hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
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
                {s.expectedReturn > 0 && monthsElapsed > 0 && (
                  <p className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">
                    Projected at {s.expectedReturn}% p.a. · {fmt(expected)}
                  </p>
                )}
                <PlanTracker
                  plan={s.plan}
                  label="SIP installments"
                  onEdit={() => openEdit(s)}
                  onToggleLatest={() => updateSIP(s.id, { plan: toggleLatestPaid(s.plan) })}
                />
              </motion.div>
            )
          })}
        </div>
      )}

      <SipForm open={dialogOpen} editId={editId} form={form} setForm={setForm} planDraft={planDraft} setPlanDraft={setPlanDraft} onClose={() => setDialogOpen(false)} onSave={handleSave} />
    </div>
  )
}

function SipForm({ open, editId, form, setForm, planDraft, setPlanDraft, onClose, onSave }: {
  open: boolean; editId: string | null
  form: { name: string; amount: number; startDate: string; endDate: string | null; frequency: "monthly" | "quarterly"; expectedReturn: number; investedAmount: number; currentValue: number }
  setForm: (f: typeof form) => void
  planDraft: PlanDraft; setPlanDraft: (d: PlanDraft) => void
  onClose: () => void; onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/30">
              <PiggyBank className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">{editId ? "Edit SIP" : "New SIP"}</DialogTitle>
              <DialogDescription>Your recurring investment plan</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="sip-name">Fund / Plan name *</Label>
            <Input id="sip-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HDFC Mid-Cap Opportunities" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sip-amount">Amount (₹) *</Label>
              <Input id="sip-amount" type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="5000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sip-freq">Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as "monthly" | "quarterly" })}>
                <SelectTrigger id="sip-freq"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sip-start">Start date</Label>
              <Input id="sip-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sip-end">End date (optional)</Label>
              <Input id="sip-end" type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sip-invested">Invested so far (₹)</Label>
              <Input id="sip-invested" type="number" value={form.investedAmount || ""} onChange={(e) => setForm({ ...form, investedAmount: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sip-current">Current value (₹)</Label>
              <Input id="sip-current" type="number" value={form.currentValue || ""} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sip-return">Expected return (% p.a.)</Label>
            <Input id="sip-return" type="number" value={form.expectedReturn || ""} onChange={(e) => setForm({ ...form, expectedReturn: Number(e.target.value) })} placeholder="12" />
            <p className="text-[11px] text-neutral-400">Used for the projection shown on your card</p>
          </div>
          <PlanFields draft={planDraft} onChange={setPlanDraft} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!form.name || !form.amount} onClick={onSave}>{editId ? "Save Changes" : "Add SIP"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stocks ───────────────────────────────────────────────

function StocksTab() {
  const { stocks, addStock, updateStock, deleteStock } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", ticker: "", buyPrice: 0, quantity: 0, currentPrice: 0, sector: "", startDate: "", endDate: "", paid: false })
  const [planDraft, setPlanDraft] = useState<PlanDraft>(emptyPlanDraft)

  const reset = () => {
    setForm({ name: "", ticker: "", buyPrice: 0, quantity: 0, currentPrice: 0, sector: "", startDate: "", endDate: "", paid: false })
    setPlanDraft(emptyPlanDraft)
  }
  const openCreate = () => { reset(); setEditId(null); setDialogOpen(true) }
  const openEdit = (s: typeof stocks[0]) => {
    setEditId(s.id)
    setForm({ name: s.name, ticker: s.ticker, buyPrice: s.buyPrice, quantity: s.quantity, currentPrice: s.currentPrice, sector: s.sector, startDate: s.startDate, endDate: s.endDate, paid: s.paid })
    setPlanDraft(draftFromPlan(s.plan))
    setDialogOpen(true)
  }
  const handleSave = () => {
    if (!form.name || !form.ticker || !form.buyPrice || !form.quantity) return
    const plan = draftToPlan(planDraft, editId ? (stocks.find((x) => x.id === editId)?.plan?.paid ?? []) : [])
    if (editId) updateStock(editId, { ...form, plan })
    else addStock({ ...form, plan })
    setDialogOpen(false); setEditId(null); reset()
  }

  return (
    <div className="space-y-4">
      <AssetCardHeader
        label={`Stocks (${stocks.length})`}
        icon={BarChart3}
        action={<Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Stock</Button>}
      />

      {stocks.length === 0 ? (
        <EmptyState icon={BarChart3} title="No stocks yet" onAdd={openCreate} />
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
                className="group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-900 dark:shadow-none"
              >
                <div className={cn("absolute inset-x-0 top-0 h-0.5", pct >= 0 ? "bg-gradient-to-r from-green-400/60 to-transparent" : "bg-gradient-to-r from-red-400/60 to-transparent")} />
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold", pct >= 0 ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400" : "bg-red-100 text-red-500 dark:bg-red-950/40 dark:text-red-400")}>
                      {s.ticker ? s.ticker.slice(0, 4).toUpperCase() : "—"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{s.name}</h4>
                      <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{s.ticker.toUpperCase()} · {s.quantity} shares</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(s)} aria-label="Edit" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteStock(s.id)} aria-label="Delete" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-red-950/60 dark:hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
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

                <PlanTracker
                  plan={s.plan}
                  label="Installments"
                  onEdit={() => openEdit(s)}
                  onToggleLatest={() => updateStock(s.id, { plan: toggleLatestPaid(s.plan) })}
                />
                {!s.plan && s.sector && (
                  <p className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">{s.sector}</p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <StockForm open={dialogOpen} editId={editId} form={form} setForm={setForm} planDraft={planDraft} setPlanDraft={setPlanDraft} onClose={() => setDialogOpen(false)} onSave={handleSave} />
    </div>
  )
}

function StockForm({ open, editId, form, setForm, planDraft, setPlanDraft, onClose, onSave }: {
  open: boolean; editId: string | null
  form: { name: string; ticker: string; buyPrice: number; quantity: number; currentPrice: number; sector: string; startDate: string; endDate: string; paid: boolean }
  setForm: (f: typeof form) => void
  planDraft: PlanDraft; setPlanDraft: (d: PlanDraft) => void
  onClose: () => void; onSave: () => void
}) {
  const invested = form.buyPrice * form.quantity
  const gainPct = invested > 0 ? Math.round(((form.currentPrice * form.quantity - invested) / invested) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">{editId ? "Edit Stock" : "New Stock"}</DialogTitle>
              <DialogDescription>Track an equity position</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!editId && form.buyPrice > 0 && form.quantity > 0 && (
            <div className={cn("rounded-xl px-4 py-2.5 text-xs font-semibold", gainPct >= 0 ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400")}>
              Current live P&L estimate: {fmtPct(gainPct)} ({fmt(invested)} → {fmt(form.currentPrice * form.quantity)})
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-name">Company *</Label>
              <Input id="st-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reliance Industries" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-ticker">Ticker *</Label>
              <Input id="st-ticker" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="RELIANCE" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-buy">Buy price (₹) *</Label>
              <Input id="st-buy" type="number" value={form.buyPrice || ""} onChange={(e) => setForm({ ...form, buyPrice: Number(e.target.value) })} placeholder="1240.50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-qty">Quantity *</Label>
              <Input id="st-qty" type="number" value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} placeholder="10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-cur">Current price (₹)</Label>
              <Input id="st-cur" type="number" value={form.currentPrice || ""} onChange={(e) => setForm({ ...form, currentPrice: Number(e.target.value) })} placeholder="1280.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-sector">Sector</Label>
              <Input id="st-sector" list="sector-suggestions" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Technology" />
              <datalist id="sector-suggestions">{SECTORS.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Investment timeline</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="st-start" className="text-[11px] text-neutral-400">Start date</Label>
                <Input id="st-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="st-end" className="text-[11px] text-neutral-400">Closure date</Label>
                <Input id="st-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400">A progress bar tracks start → closure. When the closure date arrives, the card shows a green check if marked paid, red X if not.</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Settled / Paid</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Mark as paid once the investment is settled</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.paid}
              onClick={() => setForm({ ...form, paid: !form.paid })}
              className={cn("relative h-6 w-11 rounded-full transition-colors", form.paid ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700")}
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", form.paid ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
          <PlanFields draft={planDraft} onChange={setPlanDraft} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!form.name || !form.ticker || !form.buyPrice || !form.quantity} onClick={onSave}>{editId ? "Save Changes" : "Add Stock"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Mutual Funds ─────────────────────────────────────────

function FundsTab() {
  const { mutualFunds, addMutualFund, updateMutualFund, deleteMutualFund } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", fundHouse: "", nav: 0, units: 0, investedAmount: 0, currentValue: 0 })
  const [planDraft, setPlanDraft] = useState<PlanDraft>(emptyPlanDraft)

  const reset = () => {
    setForm({ name: "", fundHouse: "", nav: 0, units: 0, investedAmount: 0, currentValue: 0 })
    setPlanDraft(emptyPlanDraft)
  }
  const openCreate = () => { reset(); setEditId(null); setDialogOpen(true) }
  const openEdit = (m: typeof mutualFunds[0]) => {
    setEditId(m.id)
    setForm({ name: m.name, fundHouse: m.fundHouse, nav: m.nav, units: m.units, investedAmount: m.investedAmount, currentValue: m.currentValue })
    setPlanDraft(draftFromPlan(m.plan))
    setDialogOpen(true)
  }
  const handleSave = () => {
    if (!form.name || !form.nav || !form.units) return
    const plan = draftToPlan(planDraft, editId ? (mutualFunds.find((x) => x.id === editId)?.plan?.paid ?? []) : [])
    if (editId) updateMutualFund(editId, { ...form, plan })
    else addMutualFund({ ...form, plan })
    setDialogOpen(false); setEditId(null); reset()
  }

  return (
    <div className="space-y-4">
      <AssetCardHeader
        label={`Mutual Funds (${mutualFunds.length})`}
        icon={Wallet}
        action={<Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Fund</Button>}
      />

      {mutualFunds.length === 0 ? (
        <EmptyState icon={Wallet} title="No mutual funds yet" onAdd={openCreate} />
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
                className="group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-900 dark:shadow-none"
              >
                <div className={cn("absolute inset-x-0 top-0 h-0.5", pct >= 0 ? "bg-gradient-to-r from-green-400/60 to-transparent" : "bg-gradient-to-r from-red-400/60 to-transparent")} />
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{mf.name}</h4>
                    <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{mf.fundHouse} · {mf.units} units @ ₹{mf.nav.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(mf)} aria-label="Edit" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteMutualFund(mf.id)} aria-label="Delete" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-red-950/60 dark:hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
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
                <PlanTracker
                  plan={mf.plan}
                  label="Installments"
                  onEdit={() => openEdit(mf)}
                  onToggleLatest={() => updateMutualFund(mf.id, { plan: toggleLatestPaid(mf.plan) })}
                />
              </motion.div>
            )
          })}
        </div>
      )}

      <FundForm open={dialogOpen} editId={editId} form={form} setForm={setForm} planDraft={planDraft} setPlanDraft={setPlanDraft} onClose={() => setDialogOpen(false)} onSave={handleSave} />
    </div>
  )
}

function FundForm({ open, editId, form, setForm, planDraft, setPlanDraft, onClose, onSave }: {
  open: boolean; editId: string | null
  form: { name: string; fundHouse: string; nav: number; units: number; investedAmount: number; currentValue: number }
  setForm: (f: typeof form) => void
  planDraft: PlanDraft; setPlanDraft: (d: PlanDraft) => void
  onClose: () => void; onSave: () => void
}) {
  const implied = form.nav * form.units

  const applyImplied = () => {
    if (!editId && implied > 0 && form.investedAmount === 0) {
      setForm({ ...form, investedAmount: implied, currentValue: implied })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">{editId ? "Edit Fund" : "New Mutual Fund"}</DialogTitle>
              <DialogDescription>Track a fund holding</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mf-name">Fund name *</Label>
              <Input id="mf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mid-Cap Opportunities" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mf-house">Fund house</Label>
              <Input id="mf-house" list="fund-house-suggestions" value={form.fundHouse} onChange={(e) => setForm({ ...form, fundHouse: e.target.value })} placeholder="HDFC" />
              <datalist id="fund-house-suggestions">{FUND_HOUSES.map((h) => <option key={h} value={h} />)}</datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mf-nav">NAV (₹) *</Label>
              <Input id="mf-nav" type="number" value={form.nav || ""} onChange={(e) => { setForm({ ...form, nav: Number(e.target.value) }); applyImplied() }} placeholder="42.35" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mf-units">Units *</Label>
              <Input id="mf-units" type="number" value={form.units || ""} onChange={(e) => { setForm({ ...form, units: Number(e.target.value) }); applyImplied() }} placeholder="250.5" />
            </div>
          </div>
          {!editId && implied > 0 && (
            <p className="rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
              Value at current NAV: <span className="font-semibold">{fmt(implied)}</span> — filled in below automatically.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mf-invested">Invested (₹)</Label>
              <Input id="mf-invested" type="number" value={form.investedAmount || ""} onChange={(e) => setForm({ ...form, investedAmount: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mf-current">Current (₹)</Label>
              <Input id="mf-current" type="number" value={form.currentValue || ""} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} />
            </div>
          </div>
          <PlanFields draft={planDraft} onChange={setPlanDraft} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!form.name || !form.nav || !form.units} onClick={onSave}>{editId ? "Save Changes" : "Add Fund"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
        <div className="space-y-4 rounded-3xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
          {sips.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">SIPs ({sips.length})</h4>
              <div className="space-y-1.5">
                {sips.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{s.name}</span>
                    <span className="text-xs text-neutral-500">{fmt(s.investedAmount)} → {fmt(s.currentValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stocks.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Stocks ({stocks.length})</h4>
              <div className="space-y-1.5">
                {stocks.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{s.name} <span className="text-[10px] text-neutral-400">{s.ticker.toUpperCase()}</span></span>
                    <span className="text-xs text-neutral-500">{fmt(s.buyPrice * s.quantity)} → {fmt(s.currentPrice * s.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mutualFunds.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Mutual Funds ({mutualFunds.length})</h4>
              <div className="space-y-1.5">
                {mutualFunds.map((mf) => (
                  <div key={mf.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{mf.name}</span>
                    <span className="text-xs text-neutral-500">{fmt(mf.investedAmount)} → {fmt(mf.currentValue)}</span>
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
  const [tab, setTab] = useState<InvestmentTab>("dashboard")

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:px-3 sm:text-sm",
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
          {tab === "dashboard" && <DashboardTab />}
          {tab === "sips" && <SipsTab />}
          {tab === "stocks" && <StocksTab />}
          {tab === "funds" && <FundsTab />}
          {tab === "archive" && <ArchiveTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}