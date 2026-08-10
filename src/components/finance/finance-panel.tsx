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
  food: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  transport: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  housing: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  utilities: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  entertainment: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  healthcare: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  shopping: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  education: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  other: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
}

const PIE_COLORS = ["#f97316", "#3b82f6", "#a855f7", "#06b6d4", "#ec4899", "#ef4444", "#10b981", "#6366f1", "#737373"]

const incomeSources: { value: IncomeSource; label: string }[] = [
  { value: "job", label: "Job" },
  { value: "youtube", label: "YouTube" },
  { value: "digital", label: "Digital" },
  { value: "website", label: "Website" },
  { value: "freelance", label: "Freelance" },
  { value: "other", label: "Other" },
]

const incomeColors: Record<IncomeSource, string> = {
  job: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  youtube: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  digital: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  website: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  freelance: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  other: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
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
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/30">
          <p className="text-xs text-green-600 dark:text-green-400">Total Income</p>
          <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-xs text-red-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className={cn("rounded-2xl border p-5", net >= 0 ? "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30")}>
          <p className="text-xs text-neutral-500">Net Cash Flow</p>
          <p className={cn("text-2xl font-bold", net >= 0 ? "text-green-600" : "text-red-500")}>
            ₹{net.toLocaleString()}
          </p>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card-modern glass rounded-2xl p-5">
            <h3 className="mb-4 font-semibold text-neutral-900 dark:text-neutral-50">Expense Breakdown</h3>
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
            <div className="card-modern glass rounded-2xl p-5">
              <h3 className="mb-4 font-semibold text-neutral-900 dark:text-neutral-50">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData}>
                  <ChartGradients ids={["fin-income", "fin-expense"]} />
                  <CartesianGrid {...CHART_GRID_STYLES} />
                  <XAxis dataKey="month" {...CHART_AXIS_STYLES} />
                  <YAxis {...CHART_AXIS_STYLES} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />} cursor={CHART_CURSOR_STYLES} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" fill="url(#fin-income)" radius={[7, 7, 2, 2]} name="Income" />
                  <Bar dataKey="expense" fill="url(#fin-expense)" radius={[7, 7, 2, 2]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {categoryData.length === 0 && monthlyData.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-16 dark:border-neutral-800">
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
            <div key={inc.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("shrink-0 rounded-lg px-2 py-1 text-xs font-medium", incomeColors[inc.source])}>
                  {inc.source}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{inc.description || inc.source}</p>
                  <p className="text-xs text-neutral-400">{inc.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-green-600">₹{inc.amount.toLocaleString()}</span>
                <button onClick={() => openEdit(inc)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteIncome(inc.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
        <p className="text-xs text-green-600 dark:text-green-400">Total Income</p>
        <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
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
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("shrink-0 rounded-lg px-2 py-1 text-xs font-medium", categoryColors[e.category])}>
                  {e.category}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{e.description || e.category}</p>
                  <p className="text-xs text-neutral-400">{e.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">₹{e.amount.toLocaleString()}</span>
                <button onClick={() => openEdit(e)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteExpense(e.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-xs text-neutral-500">Total Expenses</p>
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">₹{totalExpenses.toLocaleString()}</p>
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
  const { expenses, budgets, setBudget, deleteBudget } = useFinanceStore()
  const [form, setForm] = useState({ category: "food" as ExpenseCategory, limit: 0, month: format(new Date(), "yyyy-MM") })

  const handleSetBudget = () => {
    if (!form.limit || !form.month) return
    setBudget(form)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Monthly Budgets</h3>
      {budgets.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No budgets set</p>
      ) : (
        <div className="space-y-3">
          {budgets.map((bgt) => {
            const spent = expenses
              .filter((e) => e.category === bgt.category && e.date.startsWith(bgt.month))
              .reduce((s, e) => s + e.amount, 0)
            const pct = bgt.limit ? Math.round((spent / bgt.limit) * 100) : 0
            const cat = expenseCategories.find((c) => c.value === bgt.category)
            return (
              <div key={bgt.id} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-lg px-2 py-1 text-xs font-medium", categoryColors[bgt.category])}>
                      {cat?.label || bgt.category}
                    </span>
                    <span className="text-xs text-neutral-400">{bgt.month}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", pct > 100 ? "text-red-500" : "text-neutral-900 dark:text-neutral-50")}>
                      ₹{spent.toLocaleString()} / ₹{bgt.limit.toLocaleString()}
                    </span>
                    <button onClick={() => deleteBudget(bgt.id)} className="rounded-lg p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <motion.div
                    className={cn("absolute inset-y-0 left-0 rounded-full", pct > 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-green-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-neutral-400">{pct}% used</p>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-xs text-neutral-500 mb-2">Set budget limit</p>
        <div className="flex flex-wrap gap-2">
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
            <SelectTrigger className="h-8 flex-1 min-w-[100px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {expenseCategories.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="₹" className="h-8 w-24 text-xs" value={form.limit || ""} onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })} />
          <Input type="month" className="h-8 flex-1 min-w-[120px] text-xs" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
        </div>
        <Button size="sm" className="mt-2 w-full h-8 text-xs" onClick={handleSetBudget} disabled={!form.limit || !form.month}>Set Budget</Button>
      </div>
    </div>
  )
}

// ─── Main Finance Panel ───────────────────────────────────

export function FinancePanel() {
  const [tab, setTab] = useState<FinanceTab>("overview")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Finance
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Track income, expenses, and monthly budgets
        </p>
      </div>

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
