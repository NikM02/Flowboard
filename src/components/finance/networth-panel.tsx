"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid,
} from "recharts"
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, Archive,
  LayoutDashboard, ArrowUpRight, ArrowDownRight, Coins, Sparkles,
} from "lucide-react"
import {
  ChartTooltip, ChartGradients, ChartGlow,
  CHART_GRID_STYLES, CHART_AXIS_STYLES, CHART_CURSOR_STYLES,
} from "@/components/charts/chart-components"
import { cn } from "@/lib/shadcn-utils"
import { useFinanceStore } from "@/store/use-finance-store"
import { IncomeTab, ExpensesTab, BudgetTab, ArchiveTab } from "@/components/finance/finance-panel"
import { SipsTab, StocksTab, FundsTab } from "@/components/finance/investments-panel"

type NetworthTab = "overview" | "money" | "investments" | "archive"
type MoneyTab = "income" | "expenses" | "budget"
type HoldingTab = "sips" | "stocks" | "funds"

const COLORS = ["#0a84ff", "#34c759", "#bf5af2", "#ff9f0a", "#ff453a", "#30b0c7", "#5856d6", "#ffd60a"]

const tabs: { key: NetworthTab; label: string; icon: typeof Wallet }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "money", label: "Money", icon: Wallet },
  { key: "investments", label: "Investments", icon: TrendingUp },
  { key: "archive", label: "Archive", icon: Archive },
]

const moneyTabs: { key: MoneyTab; label: string; icon: typeof Wallet }[] = [
  { key: "income", label: "Income", icon: TrendingUp },
  { key: "expenses", label: "Expenses", icon: Wallet },
  { key: "budget", label: "Budget", icon: BarChart3 },
]

const holdingTabs: { key: HoldingTab; label: string; icon: typeof Wallet }[] = [
  { key: "sips", label: "SIPs", icon: PiggyBank },
  { key: "stocks", label: "Stocks", icon: BarChart3 },
  { key: "funds", label: "Funds", icon: Coins },
]

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n}%`
}

function SegTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string; icon: typeof Wallet }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-[10px] border border-neutral-200 bg-neutral-100 p-1 sm:w-auto">
      {items.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 py-2 text-xs font-medium transition-all sm:flex-none sm:text-sm",
              value === t.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
  delay = 0,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Wallet
  tone?: "neutral" | "blue" | "green" | "red" | "violet"
  delay?: number
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-500",
    violet: "bg-violet-50 text-violet-600",
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-[10px] border border-neutral-200/60 bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-[10px]", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] font-medium text-neutral-500">{label}</span>
      </div>
      <p className="mt-2.5 text-lg font-bold tracking-tight text-neutral-900 sm:text-2xl">{value}</p>
      {sub && <p className="text-[10px] text-neutral-400">{sub}</p>}
    </motion.div>
  )
}

function OverviewTab({ onJump }: { onJump: (tab: NetworthTab) => void }) {
  const { incomes, expenses, budgets, sips, stocks, mutualFunds } = useFinanceStore()

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
  const cash = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((cash / totalIncome) * 100) : 0

  const sipInvested = sips.reduce((s, i) => s + i.investedAmount, 0)
  const sipCurrent = sips.reduce((s, i) => s + i.currentValue, 0)
  const stockInvested = stocks.reduce((s, i) => s + i.buyPrice * i.quantity, 0)
  const stockCurrent = stocks.reduce((s, i) => s + i.currentPrice * i.quantity, 0)
  const mfInvested = mutualFunds.reduce((s, i) => s + i.investedAmount, 0)
  const mfCurrent = mutualFunds.reduce((s, i) => s + i.currentValue, 0)

  const totalInvested = sipInvested + stockInvested + mfInvested
  const totalCurrent = sipCurrent + stockCurrent + mfCurrent
  const gain = totalCurrent - totalInvested
  const gainPct = totalInvested > 0 ? Math.round((gain / totalInvested) * 100) : 0
  const netWorth = cash + totalCurrent
  const holdingCount = sips.length + stocks.length + mutualFunds.length
  const hasAny = totalIncome > 0 || totalExpense > 0 || holdingCount > 0

  const allocation = useMemo(() => {
    const items = [
      { name: "Cash", value: Math.max(cash, 0), color: "#8e8e93" },
      { name: "SIPs", value: sipCurrent, color: COLORS[0] },
      { name: "Stocks", value: stockCurrent, color: COLORS[1] },
      { name: "Mutual Funds", value: mfCurrent, color: COLORS[2] },
    ].filter((d) => d.value > 0)
    const total = items.reduce((s, d) => s + d.value, 0)
    return { items, total }
  }, [cash, sipCurrent, stockCurrent, mfCurrent])

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {}
    for (const inc of incomes) {
      const m = inc.date.slice(0, 7)
      if (!map[m]) map[m] = { income: 0, expense: 0 }
      map[m].income += inc.amount
    }
    for (const e of expenses) {
      const m = e.date.slice(0, 7)
      if (!map[m]) map[m] = { income: 0, expense: 0 }
      map[m].expense += e.amount
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month, ...data }))
  }, [incomes, expenses])

  const spending = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of expenses) map[e.category] = (map[e.category] || 0) + e.amount
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value)
  }, [expenses])

  const investedVsCurrent = useMemo(
    () =>
      [
        { name: "SIPs", invested: sipInvested, current: sipCurrent },
        { name: "Stocks", invested: stockInvested, current: stockCurrent },
        { name: "Funds", invested: mfInvested, current: mfCurrent },
      ].filter((d) => d.invested > 0 || d.current > 0),
    [sipInvested, sipCurrent, stockInvested, stockCurrent, mfInvested, mfCurrent]
  )

  const performers = useMemo(() => {
    const list: { name: string; type: string; invested: number; current: number; pct: number }[] = [
      ...sips.map((s) => ({
        name: s.name,
        type: "SIP",
        invested: s.investedAmount,
        current: s.currentValue,
        pct: s.investedAmount > 0 ? Math.round(((s.currentValue - s.investedAmount) / s.investedAmount) * 100) : 0,
      })),
      ...stocks.map((s) => {
        const invested = s.buyPrice * s.quantity
        const current = s.currentPrice * s.quantity
        return {
          name: s.ticker ? s.ticker.toUpperCase() : s.name,
          type: "Stock",
          invested,
          current,
          pct: invested > 0 ? Math.round(((current - invested) / invested) * 100) : 0,
        }
      }),
      ...mutualFunds.map((m) => ({
        name: m.name,
        type: "Fund",
        invested: m.investedAmount,
        current: m.currentValue,
        pct: m.investedAmount > 0 ? Math.round(((m.currentValue - m.investedAmount) / m.investedAmount) * 100) : 0,
      })),
    ]
    return list.sort((a, b) => b.pct - a.pct).slice(0, 4)
  }, [sips, stocks, mutualFunds])

  const activeBudgets = budgets.filter((b) => b.category === "overall" || b.limit > 0).length

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-neutral-200 py-20 text-center">
        <Wallet className="mb-4 h-12 w-12 text-neutral-300" />
        <p className="text-base font-medium text-neutral-600">Your net worth starts here</p>
        <p className="mt-1.5 max-w-sm text-sm text-neutral-400">
          Add income and expenses under Money, then track SIPs, stocks and funds under Investments. Everything rolls up into this dashboard.
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => onJump("money")} className="rounded-[10px] bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
            Add money records
          </button>
          <button onClick={() => onJump("investments")} className="rounded-[10px] border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700">
            Add investments
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Net Worth"
          value={fmt(netWorth)}
          sub={`${fmt(Math.max(cash, 0))} cash + ${fmt(totalCurrent)} invested`}
          icon={Sparkles}
          tone="violet"
        />
        <StatCard
          label="Cash Balance"
          value={fmt(cash)}
          sub={totalIncome > 0 ? `${savingsRate}% savings rate` : "Income − expenses"}
          icon={Wallet}
          tone={cash >= 0 ? "green" : "red"}
          delay={0.05}
        />
        <StatCard
          label="Investments"
          value={fmt(totalCurrent)}
          sub={`${fmt(totalInvested)} invested · ${holdingCount} holding${holdingCount === 1 ? "" : "s"}`}
          icon={TrendingUp}
          tone="blue"
          delay={0.1}
        />
        <StatCard
          label="Total P&L"
          value={`${gain >= 0 ? "+" : ""}${fmt(gain)}`}
          sub={`${fmtPct(gainPct)} overall`}
          icon={gain >= 0 ? TrendingUp : TrendingDown}
          tone={gain >= 0 ? "green" : "red"}
          delay={0.15}
        />
      </div>

      {/* Net worth composition */}
      {allocation.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-[10px] border border-neutral-200/60 bg-white p-4"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Net worth composition</h3>
            <span className="text-xs font-semibold text-neutral-900">{fmt(allocation.total)}</span>
          </div>
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
            {allocation.items.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / allocation.total) * 100}%` }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundColor: d.color }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {allocation.items.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} · {Math.round((d.value / allocation.total) * 100)}%
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cash flow + allocation */}
      <div className="grid gap-4 md:grid-cols-2">
        {monthlyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[10px] border border-neutral-200/60 bg-white p-5"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Monthly cash flow</h3>
            <p className="mt-0.5 text-[11px] text-neutral-400">Income vs expenses · last 6 months</p>
            <div className="mt-3 h-[220px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid {...CHART_GRID_STYLES} />
                  <ChartGradients ids={["nw-income", "nw-expense"]} />
                  <XAxis dataKey="month" {...CHART_AXIS_STYLES} />
                  <YAxis {...CHART_AXIS_STYLES} />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmt(Number(v))} />} cursor={CHART_CURSOR_STYLES} />
                  <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-neutral-600">{value}</span>} />
                  <Bar dataKey="income" fill="url(#nw-income)" radius={[8, 8, 2, 2]} barSize={18} name="Income" />
                  <Bar dataKey="expense" fill="url(#nw-expense)" radius={[8, 8, 2, 2]} barSize={18} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {allocation.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-[10px] border border-neutral-200/60 bg-white p-5"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Allocation</h3>
            <p className="mt-0.5 text-[11px] text-neutral-400">Where your net worth sits</p>
            <div className="mt-3 h-[220px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartGlow id="nw-pie-glow" />
                  <Pie
                    data={allocation.items}
                    cx="50%" cy="50%" innerRadius={62} outerRadius={90}
                    paddingAngle={5} cornerRadius={8} dataKey="value" stroke="none"
                  >
                    {allocation.items.map((d, i) => (
                      <Cell key={i} fill={d.color} style={{ filter: "url(#nw-pie-glow)" }} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => fmt(Number(v))} />} />
                  <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-neutral-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Portfolio + spending */}
      <div className="grid gap-4 md:grid-cols-2">
        {investedVsCurrent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[10px] border border-neutral-200/60 bg-white p-5"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Invested vs current</h3>
            <p className="mt-0.5 text-[11px] text-neutral-400">Portfolio comparison by class</p>
            <div className="mt-3 h-[220px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investedVsCurrent} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid {...CHART_GRID_STYLES} />
                  <ChartGradients ids={["nw-invested", "nw-current"]} />
                  <XAxis dataKey="name" {...CHART_AXIS_STYLES} />
                  <YAxis {...CHART_AXIS_STYLES} />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmt(Number(v))} />} cursor={CHART_CURSOR_STYLES} />
                  <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-neutral-600">{value}</span>} />
                  <Bar dataKey="invested" fill="url(#nw-invested)" radius={[8, 8, 2, 2]} barSize={18} name="Invested" />
                  <Bar dataKey="current" fill="url(#nw-current)" radius={[8, 8, 2, 2]} barSize={18} name="Current" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {spending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-[10px] border border-neutral-200/60 bg-white p-5"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Spending</h3>
            <p className="mt-0.5 text-[11px] text-neutral-400">By category · all time</p>
            <div className="mt-3 h-[220px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartGlow id="nw-spend-glow" />
                  <Pie
                    data={spending}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={4} cornerRadius={8} dataKey="value" stroke="none"
                  >
                    {spending.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ filter: "url(#nw-spend-glow)" }} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => fmt(Number(v))} />} />
                  <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-neutral-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Performers + quick summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {performers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[10px] border border-neutral-200/60 bg-white p-5"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Top performers</h3>
            </div>
            <div className="mt-3 space-y-2">
              {performers.map((h) => (
                <div key={h.name + h.type} className="flex items-center gap-3 rounded-[10px] bg-neutral-50 px-3 py-2">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-[10px] text-[10px] font-bold", h.pct >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500")}>
                    {h.pct >= 0 ? "▲" : "▼"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{h.name}</p>
                    <p className="text-[10px] text-neutral-400">{h.type} · {fmt(h.invested)}</p>
                  </div>
                  <span className={cn("flex items-center gap-0.5 text-sm font-bold", h.pct >= 0 ? "text-green-600" : "text-red-500")}>
                    {h.pct >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {fmtPct(h.pct)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-[10px] border border-neutral-200/60 bg-white p-5"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">At a glance</h3>
          <div className="mt-3 divide-y divide-neutral-100">
            {[
              { label: "Income records", value: `${incomes.length} · ${fmt(totalIncome)}` },
              { label: "Expense records", value: `${expenses.length} · ${fmt(totalExpense)}` },
              { label: "Budgets set", value: `${activeBudgets}` },
              { label: "Savings rate", value: totalIncome > 0 ? `${savingsRate}%` : "—" },
              { label: "Invested capital", value: fmt(totalInvested) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 text-sm">
                <span className="text-neutral-500">{row.label}</span>
                <span className="font-semibold text-neutral-900">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => onJump("money")} className="flex-1 rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
              Manage money
            </button>
            <button onClick={() => onJump("investments")} className="flex-1 rounded-[10px] bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800">
              Manage investments
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function NetworthPanel() {
  const [tab, setTab] = useState<NetworthTab>("overview")
  const [moneyTab, setMoneyTab] = useState<MoneyTab>("income")
  const [holdingTab, setHoldingTab] = useState<HoldingTab>("sips")

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-[10px] bg-neutral-100 p-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 py-2 text-xs font-medium transition-all sm:px-3 sm:text-sm",
                tab === t.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "overview" && <OverviewTab onJump={setTab} />}

          {tab === "money" && (
            <div className="space-y-4">
              <SegTabs items={moneyTabs} value={moneyTab} onChange={setMoneyTab} />
              {moneyTab === "income" && <IncomeTab />}
              {moneyTab === "expenses" && <ExpensesTab />}
              {moneyTab === "budget" && <BudgetTab />}
            </div>
          )}

          {tab === "investments" && (
            <div className="space-y-4">
              <SegTabs items={holdingTabs} value={holdingTab} onChange={setHoldingTab} />
              {holdingTab === "sips" && <SipsTab />}
              {holdingTab === "stocks" && <StocksTab />}
              {holdingTab === "funds" && <FundsTab />}
            </div>
          )}

          {tab === "archive" && <ArchiveTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
