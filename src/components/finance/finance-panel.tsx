"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Wallet, TrendingUp, BarChart3, PieChart as PieChartIcon,
  Plus, Trash2, Pencil,
} from "lucide-react"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts"
import {
  ChartTooltip, ChartGradients, ChartGlow,
  CHART_GRID_STYLES, CHART_AXIS_STYLES, CHART_CURSOR_STYLES,
} from "@/components/charts/chart-components"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useFinanceStore } from "@/store/use-finance-store"
import type { ExpenseCategory, IncomeSource } from "@/types"

type FinanceTab = "overview" | "income" | "expenses" | "budget"

const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "housing", label: "Housing" },
  { value: "utilities", label: "Utilities" },
  { value: "entertainment", label: "Entertainment" },
  { value: "healthcare", label: "Healthcare" },
  { value: "shopping", label: "Shopping" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
]

const categoryColors: Record<ExpenseCategory, string> = {
  food: "#ff9f0a",
  transport: "#0a84ff",
  housing: "#5856d6",
  utilities: "#30b0c7",
  entertainment: "#bf5af2",
  healthcare: "#ff453a",
  shopping: "#ff2d55",
  education: "#34c759",
  other: "#8e8e93",
}

function CategoryChip({ category, label }: { category: ExpenseCategory | "overall"; label?: string }) {
  const color = category === "overall" ? "#0066cc" : categoryColors[category]
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ color, backgroundColor: `${color}1a` }}>
      {label || category}
    </span>
  )
}

const PIE_COLORS = ["#0a84ff", "#34c759", "#bf5af2", "#ff9f0a", "#ff453a", "#30b0c7", "#5856d6", "#ffd60a", "#ff2d55"]

const incomeSources: { value: IncomeSource; label: string }[] = [
  { value: "job", label: "Job" },
  { value: "youtube", label: "YouTube" },
  { value: "digital", label: "Digital" },
  { value: "website", label: "Website" },
  { value: "freelance", label: "Freelance" },
  { value: "other", label: "Other" },
]

const incomeColors: Record<IncomeSource, string> = {
  job: "#0a84ff",
  youtube: "#ff453a",
  digital: "#34c759",
  website: "#5856d6",
  freelance: "#ff9f0a",
  other: "#8e8e93",
}

function IncomeChip({ source }: { source: IncomeSource }) {
  const color = incomeColors[source]
  return (
    <span className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium capitalize" style={{ color, backgroundColor: `${color}1a` }}>
      {source}
    </span>
  )
}

const tabs: { key: FinanceTab; label: string; icon: typeof Wallet }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "income", label: "Income", icon: TrendingUp },
  { key: "expenses", label: "Expenses", icon: Wallet },
  { key: "budget", label: "Budget", icon: PieChartIcon },
]

// ─── Overview Tab ─────────────────────────────────────────

function OverviewTab() {
  const { incomes, expenses } = useFinanceStore()

  const totalIncome = incomes.reduce((s, inc) => s + inc.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const net = totalIncome - totalExpenses

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value)
  }, [expenses])

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-[14px] border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-xs text-red-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className={cn("rounded-[14px] border p-5", net >= 0 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30")}>
          <p className="text-xs text-neutral-500">Net Cash Flow</p>
          <p className={cn("text-2xl font-bold", net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
            ₹{net.toLocaleString()}
          </p>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[14px] border border-neutral-200/50 bg-white p-5 dark:border-neutral-800/50 dark:bg-neutral-900">
            <h3 className="mb-4 font-semibold text-neutral-900 dark:text-white">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <ChartGlow id="fin-pie-glow" />
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={5}
                  cornerRadius={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} style={{ filter: "url(#fin-pie-glow)" }} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {monthlyData.length > 0 && (
            <div className="rounded-[14px] border border-neutral-200/50 bg-white p-5 dark:border-neutral-800/50 dark:bg-neutral-900">
              <h3 className="mb-4 font-semibold text-neutral-900 dark:text-white">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData}>
                  <CartesianGrid {...CHART_GRID_STYLES} />
                  <ChartGradients ids={["ov-income", "ov-expense"]} />
                  <XAxis dataKey="month" {...CHART_AXIS_STYLES} />
                  <YAxis {...CHART_AXIS_STYLES} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />} cursor={CHART_CURSOR_STYLES} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" fill="url(#ov-income)" radius={[7, 7, 2, 2]} name="Income" />
                  <Bar dataKey="expense" fill="url(#ov-expense)" radius={[7, 7, 2, 2]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {categoryData.length === 0 && monthlyData.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-neutral-200 py-16 dark:border-neutral-800">
          <Wallet className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No data yet</p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Add income or expenses to see charts</p>
        </div>
      )}
    </div>
  )
}

// ─── Income Tab ───────────────────────────────────────────

function IncomeTab() {
  const { incomes, addIncome, updateIncome, deleteIncome } = useFinanceStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ source: "job" as IncomeSource, amount: 0, date: "", description: "" })

  const totalIncome = incomes.reduce((s, inc) => s + inc.amount, 0)

  const handleCreate = () => {
    if (!form.amount || !form.date) return
    addIncome(form)
    setForm({ source: "job", amount: 0, date: "", description: "" })
    setCreateOpen(false)
  }
  const handleEdit = () => {
    if (!editId) return
    updateIncome(editId, form)
    setEditId(null)
    setForm({ source: "job", amount: 0, date: "", description: "" })
  }
  const openEdit = (inc: typeof incomes[0]) => {
    setEditId(inc.id)
    setForm({ source: inc.source, amount: inc.amount, date: inc.date, description: inc.description })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Income Sources</h3>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ source: "job", amount: 0, date: "", description: "" }); setCreateOpen(true) }} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Add Income
        </Button>
      </div>
      {incomes.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No income recorded yet</p>
      ) : (
        <div className="space-y-2">
          {incomes.map((inc) => (
            <div key={inc.id} className="flex items-center justify-between rounded-[10px] border border-neutral-200/50 bg-white p-3 dark:border-neutral-800/50 dark:bg-neutral-900">
              <div className="flex items-center gap-3 min-w-0">
                <IncomeChip source={inc.source} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{inc.description || inc.source}</p>
                  <p className="text-xs text-neutral-400">{inc.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">₹{inc.amount.toLocaleString()}</span>
                <button onClick={() => openEdit(inc)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteIncome(inc.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Total Income</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalIncome.toLocaleString()}</p>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
            <DialogDescription>Record income from a source</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as IncomeSource })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {incomeSources.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.amount || !form.date}>Add Income</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(v) => { if (!v) setEditId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Income</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as IncomeSource })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {incomeSources.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Expenses Tab ─────────────────────────────────────────

function ExpensesTab() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useFinanceStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ category: "food" as ExpenseCategory, amount: 0, date: "", description: "" })

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  const catData = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
      food: 0, transport: 0, housing: 0, utilities: 0, entertainment: 0,
      healthcare: 0, shopping: 0, education: 0, other: 0,
    }
    for (const e of expenses) map[e.category] += e.amount
    return Object.entries(map)
      .filter(([, value]) => value > 0)
      .map(([cat, value]) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        value,
        color: categoryColors[cat as ExpenseCategory],
      }))
      .sort((a, b) => b.value - a.value)
  }, [expenses])

  const handleCreate = () => {
    if (!form.amount || !form.date) return
    addExpense(form)
    setForm({ category: "food", amount: 0, date: "", description: "" })
    setCreateOpen(false)
  }
  const handleEdit = () => {
    if (!editId) return
    updateExpense(editId, form)
    setEditId(null)
    setForm({ category: "food", amount: 0, date: "", description: "" })
  }
  const openEdit = (e: typeof expenses[0]) => {
    setEditId(e.id)
    setForm({ category: e.category, amount: e.amount, date: e.date, description: e.description })
  }

  return (
    <div className="space-y-4">
      {catData.length > 0 && (
        <div className="rounded-3xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Spending Breakdown</h3>
            <span className="text-lg font-bold text-red-500">₹{totalExpenses.toLocaleString()}</span>
          </div>
          <div className="mt-3 grid gap-5 sm:grid-cols-2 sm:items-center">
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartGlow id="exp-pie-glow" />
                  <Pie
                    data={catData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="none"
                  >
                    {catData.map((d, i) => (
                      <Cell key={i} fill={d.color} style={{ filter: "url(#exp-pie-glow)" }} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {catData.map((d) => {
                const pct = totalExpenses ? Math.round((d.value / totalExpenses) * 100) : 0
                return (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                    <span className="min-w-0 flex-1 truncate text-xs capitalize text-neutral-600 dark:text-neutral-300">{d.name}</span>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">₹{d.value.toLocaleString()}</span>
                    <span className="w-10 shrink-0 text-right text-xs font-bold" style={{ color: d.color }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">All Expenses</h3>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ category: "food", amount: 0, date: "", description: "" }); setCreateOpen(true) }} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {expenses.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No expenses yet</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-[10px] border border-neutral-200/50 bg-white p-3 dark:border-neutral-800/50 dark:bg-neutral-900">
              <div className="flex items-center gap-3 min-w-0">
                <CategoryChip category={e.category} label={e.category} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{e.description || e.category}</p>
                  <p className="text-xs text-neutral-400">{e.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-red-500">₹{e.amount.toLocaleString()}</span>
                <button onClick={() => openEdit(e)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteExpense(e.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-[14px] border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-xs text-red-500">Total Expenses</p>
        <p className="text-2xl font-bold text-red-500">₹{totalExpenses.toLocaleString()}</p>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.amount || !form.date}>Add Expense</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(v) => { if (!v) setEditId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Budget Tab ───────────────────────────────────────────

function BudgetTab() {
  const { expenses, budgets, setBudget, updateBudget, deleteBudget } = useFinanceStore()
  const [form, setForm] = useState({ category: "food" as ExpenseCategory | "overall", limit: 0, month: format(new Date(), "yyyy-MM") })
  const [editId, setEditId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSetBudget = () => {
    if (!form.limit || !form.month) return
    const payload = { category: form.category, limit: form.limit, month: form.month }
    if (editId) updateBudget(editId, payload)
    else setBudget(payload)
    setEditId(null)
    setForm({ category: "food", limit: 0, month: format(new Date(), "yyyy-MM") })
    setDialogOpen(false)
  }

  const rows = useMemo(
    () =>
      budgets.map((bgt) => {
        const isOverall = bgt.category === "overall"
        const spent = expenses
          .filter((e) => (isOverall ? e.date.startsWith(bgt.month) : e.category === bgt.category && e.date.startsWith(bgt.month)))
          .reduce((s, e) => s + e.amount, 0)
        const pct = bgt.limit ? Math.round((spent / bgt.limit) * 100) : 0
        const remaining = bgt.limit - spent
        const cat = isOverall ? null : expenseCategories.find((c) => c.value === bgt.category)
        const label = isOverall ? "Overall" : cat?.label || bgt.category
        const color = isOverall ? "#0066cc" : categoryColors[bgt.category as ExpenseCategory]
        return { ...bgt, spent, pct, remaining, label, isOverall, color }
      }),
    [budgets, expenses]
  )

  const totalBudget = rows.reduce((s, r) => s + r.limit, 0)
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const totalPct = totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0

  const budgetChartData = useMemo(
    () => rows.map((r) => ({ name: r.label, limit: r.limit, spent: Math.min(r.spent, r.limit), color: r.color })),
    [rows]
  )

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-3 dark:border-neutral-800/60 dark:bg-neutral-900">
          <p className="text-[10px] font-medium text-neutral-400">Budgeted</p>
          <p className="mt-0.5 truncate text-sm font-bold text-neutral-900 dark:text-neutral-50">₹{totalBudget.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-3 dark:border-neutral-800/60 dark:bg-neutral-900">
          <p className="text-[10px] font-medium text-neutral-400">Spent</p>
          <p className="mt-0.5 truncate text-sm font-bold text-neutral-900 dark:text-neutral-50">₹{totalSpent.toLocaleString()}</p>
        </div>
        <div className={cn("rounded-2xl border p-3", totalRemaining >= 0 ? "border-neutral-200/60 bg-white dark:border-neutral-800/60 dark:bg-neutral-900" : "border-red-200/60 bg-red-50/60 dark:border-red-900/30 dark:bg-red-950/20")}>
          <p className="text-[10px] font-medium text-neutral-400">Remaining</p>
          <p className={cn("mt-0.5 truncate text-sm font-bold", totalRemaining >= 0 ? "text-neutral-900 dark:text-neutral-50" : "text-red-500")}>
            {totalRemaining >= 0 ? "" : "-"}₹{Math.abs(totalRemaining).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-3 dark:border-neutral-800/60 dark:bg-neutral-900">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-500 dark:text-neutral-400">Overall used</span>
          <span className={cn("font-bold", totalPct > 100 ? "text-red-500" : totalPct > 80 ? "text-amber-500" : "text-neutral-900 dark:text-neutral-50")}>{totalPct}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className={cn("h-full rounded-full", totalPct > 100 ? "bg-red-500" : totalPct > 80 ? "bg-amber-500" : "bg-gradient-to-r from-[#0a84ff] to-[#34c759]")}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalPct, 100)}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Colourful chart */}
      {budgetChartData.length > 0 && (
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Budget vs Spend</h3>
          <div className="mt-2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetChartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <ChartGradients ids={["bgt-limit", "bgt-spent"]} />
                <XAxis dataKey="name" {...CHART_AXIS_STYLES} />
                <YAxis {...CHART_AXIS_STYLES} />
                <Tooltip content={<ChartTooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />} cursor={CHART_CURSOR_STYLES} />
                <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{value}</span>} />
                <Bar dataKey="limit" fill="url(#bgt-limit)" radius={[7, 7, 2, 2]} barSize={14} name="Budget" />
                <Bar dataKey="spent" fill="url(#bgt-spent)" radius={[7, 7, 2, 2]} barSize={14} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Budgets ({budgets.length})</h3>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ category: "overall", limit: 0, month: format(new Date(), "yyyy-MM") }); setDialogOpen(true) }} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-400 dark:border-neutral-800">
          No budgets set yet — add one for the overall total or per category.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((bgt) => (
            <div key={bgt.id} className="group rounded-xl border border-neutral-200/50 bg-white p-2.5 dark:border-neutral-800/50 dark:bg-neutral-900">
              <div className="flex items-center gap-2">
                <CategoryChip category={bgt.category} label={bgt.label} />
                <span className="text-[10px] text-neutral-400">{bgt.month}</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className={cn("text-xs font-bold", bgt.pct > 100 ? "text-red-500" : "text-neutral-900 dark:text-neutral-50")}>
                    ₹{bgt.spent.toLocaleString()}
                    <span className="font-normal text-neutral-400"> / ₹{bgt.limit.toLocaleString()}</span>
                  </span>
                  <button onClick={() => { setEditId(bgt.id); setForm({ category: bgt.category, limit: bgt.limit, month: bgt.month }); setDialogOpen(true) }} aria-label="Edit budget" className="rounded-md p-1 text-neutral-300 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 max-sm:opacity-100 dark:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteBudget(bgt.id)} aria-label="Delete budget" className="rounded-md p-1 text-neutral-300 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 max-sm:opacity-100 dark:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: bgt.pct > 100 ? "#ff453a" : bgt.pct > 80 ? "#ff9f0a" : bgt.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(bgt.pct, 100)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span className={cn("w-14 shrink-0 text-right text-[10px] font-semibold", bgt.pct > 100 ? "text-red-500" : bgt.pct > 80 ? "text-amber-500" : "text-neutral-400")}>
                  {bgt.pct}%
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                <span className={bgt.remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                  {bgt.remaining >= 0 ? `${bgt.pct > 100 ? "Over" : "Left"} ₹${Math.abs(bgt.remaining).toLocaleString()}` : `Over by ₹${Math.abs(bgt.remaining).toLocaleString()}`}
                </span>
                <span>{bgt.pct > 100 ? "Exceeded" : bgt.pct > 80 ? "Almost there" : "On track"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Budget" : "Add Budget"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update the monthly limit for this budget." : "Create a budget for the overall total or a specific category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory | "overall" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall (all categories)</SelectItem>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly limit (₹)</Label>
              <Input type="number" value={form.limit || ""} onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleSetBudget} disabled={!form.limit || !form.month}>
              {editId ? "Save Budget" : "Add Budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main Finance Panel ───────────────────────────────────

export function FinancePanel() {
  const [tab, setTab] = useState<FinanceTab>("overview")

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
                "flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0",
                tab === t.key
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
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
          {tab === "overview" && <OverviewTab />}
          {tab === "income" && <IncomeTab />}
          {tab === "expenses" && <ExpensesTab />}
          {tab === "budget" && <BudgetTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
