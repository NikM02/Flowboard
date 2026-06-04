"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Wallet, TrendingUp, BarChart3, PieChart, Activity, Archive,
  Plus, Trash2, Pencil, Download,
} from "lucide-react"
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
import type { ExpenseCategory, IncomeSource, FinanceTab } from "@/types"

const tabs: { key: FinanceTab; label: string; icon: typeof Wallet }[] = [
  { key: "expenses", label: "Income & Expenses", icon: Wallet },
  { key: "sips", label: "SIPs", icon: TrendingUp },
  { key: "stocks", label: "Stocks", icon: BarChart3 },
  { key: "funds", label: "Mutual Funds", icon: PieChart },
  { key: "networth", label: "Net Worth", icon: Activity },
  { key: "archive", label: "Archive", icon: Archive },
]

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

// ─── Income & Expenses Tab ────────────────────────────────

function ExpensesTab() {
  const { incomes, expenses, budgets, addIncome, updateIncome, deleteIncome, addExpense, updateExpense, deleteExpense, setBudget } = useFinanceStore()
  const [subTab, setSubTab] = useState<"income" | "expenses">("expenses")
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ category: "food" as ExpenseCategory, amount: 0, date: "", description: "" })
  const [incomeForm, setIncomeForm] = useState({ source: "job" as IncomeSource, amount: 0, date: "", description: "" })
  const [incomeEditId, setIncomeEditId] = useState<string | null>(null)
  const [incomeCreateOpen, setIncomeCreateOpen] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ category: "food" as ExpenseCategory, limit: 0, month: format(new Date(), "yyyy-MM") })

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalIncome = incomes.reduce((s, inc) => s + inc.amount, 0)

  // Expense CRUD
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

  // Income CRUD
  const handleIncomeCreate = () => {
    if (!incomeForm.amount || !incomeForm.date) return
    addIncome(incomeForm)
    setIncomeForm({ source: "job", amount: 0, date: "", description: "" })
    setIncomeCreateOpen(false)
  }
  const handleIncomeEdit = () => {
    if (!incomeEditId) return
    updateIncome(incomeEditId, incomeForm)
    setIncomeEditId(null)
    setIncomeForm({ source: "job", amount: 0, date: "", description: "" })
  }
  const openIncomeEdit = (inc: typeof incomes[0]) => {
    setIncomeEditId(inc.id)
    setIncomeForm({ source: inc.source, amount: inc.amount, date: inc.date, description: inc.description })
  }

  // Budget
  const handleSetBudget = () => {
    if (!budgetForm.limit || !budgetForm.month) return
    setBudget(budgetForm)
  }

  const incomeEditEntry = incomeEditId ? incomes.find((inc) => inc.id === incomeEditId) : null

  return (
    <div className="space-y-6">
      {/* Income/Expenses toggle */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {(["income", "expenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] capitalize",
              subTab === t
                ? "border-neutral-900 text-neutral-900 dark:border-neutral-50 dark:text-neutral-50"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            {t === "income" ? `Income (₹${totalIncome.toLocaleString()})` : `Expenses (₹${totalExpenses.toLocaleString()})`}
          </button>
        ))}
      </div>

      {subTab === "income" ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Income Sources</h3>
            <Button size="sm" onClick={() => { setIncomeEditId(null); setIncomeForm({ source: "job", amount: 0, date: "", description: "" }); setIncomeCreateOpen(true) }} className="gap-2">
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
                    <button onClick={() => openIncomeEdit(inc)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
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

          {/* Income total card */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <p className="text-xs text-green-600 dark:text-green-400">Total Income</p>
            <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
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
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-3">Monthly Budgets</h3>
              {budgets.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">No budgets set for this month</p>
              ) : (
                <div className="space-y-3">
                  {budgets.map((bgt) => {
                    const spent = expenses
                      .filter((e) => e.category === bgt.category && e.date.startsWith(bgt.month))
                      .reduce((s, e) => s + e.amount, 0)
                    const limit = bgt.limit
                    const pct = limit ? Math.round((spent / limit) * 100) : 0
                    const cat = expenseCategories.find((c) => c.value === bgt.category)
                    return (
                      <div key={bgt.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-neutral-600 dark:text-neutral-400">{cat?.label || bgt.category}</span>
                          <span className={cn("font-medium", pct > 100 ? "text-red-500" : "text-neutral-700 dark:text-neutral-300")}>
                            ₹{spent.toLocaleString()} / ₹{limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <motion.div
                            className={cn("absolute inset-y-0 left-0 rounded-full", pct > 100 ? "bg-red-500" : "bg-neutral-900 dark:bg-neutral-50")}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 mb-2">Set budget limit</p>
                <div className="flex flex-wrap gap-2">
                  <Select value={budgetForm.category} onValueChange={(v) => setBudgetForm({ ...budgetForm, category: v as ExpenseCategory })}>
                    <SelectTrigger aria-label="Budget category" className="h-8 flex-1 min-w-[100px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" aria-label="Budget limit" placeholder="₹" className="h-8 w-24 text-xs" value={budgetForm.limit || ""} onChange={(e) => setBudgetForm({ ...budgetForm, limit: Number(e.target.value) })} />
                  <Input type="month" aria-label="Budget month" className="h-8 flex-1 min-w-[120px] text-xs" value={budgetForm.month} onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })} />
                </div>
                <Button size="sm" className="mt-2 w-full h-8 text-xs" onClick={handleSetBudget} disabled={!budgetForm.limit || !budgetForm.month}>Set Budget</Button>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs text-neutral-500">Total Expenses</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">₹{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Expense Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                <SelectTrigger id="expense-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount (₹)</Label>
              <Input id="expense-amount" type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <Input id="expense-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input id="expense-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.amount || !form.date}>Add Expense</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editId} onOpenChange={(v) => { if (!v) setEditId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-expense-category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                <SelectTrigger id="edit-expense-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-amount">Amount (₹)</Label>
              <Input id="edit-expense-amount" type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-date">Date</Label>
              <Input id="edit-expense-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expense-description">Description</Label>
              <Input id="edit-expense-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Income Dialog */}
      <Dialog open={incomeCreateOpen} onOpenChange={setIncomeCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
            <DialogDescription>Record income from a source</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="income-source">Source</Label>
              <Select value={incomeForm.source} onValueChange={(v) => setIncomeForm({ ...incomeForm, source: v as IncomeSource })}>
                <SelectTrigger id="income-source"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {incomeSources.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-amount">Amount (₹)</Label>
              <Input id="income-amount" type="number" value={incomeForm.amount || ""} onChange={(e) => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-date">Date</Label>
              <Input id="income-date" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-description">Description</Label>
              <Input id="income-description" value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} placeholder="Optional" />
            </div>
            <Button className="w-full" onClick={handleIncomeCreate} disabled={!incomeForm.amount || !incomeForm.date}>Add Income</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Income Dialog */}
      <Dialog open={!!incomeEditId} onOpenChange={(v) => { if (!v) setIncomeEditId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-income-source">Source</Label>
              <Select value={incomeForm.source} onValueChange={(v) => setIncomeForm({ ...incomeForm, source: v as IncomeSource })}>
                <SelectTrigger id="edit-income-source"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {incomeSources.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-income-amount">Amount (₹)</Label>
              <Input id="edit-income-amount" type="number" value={incomeForm.amount || ""} onChange={(e) => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-income-date">Date</Label>
              <Input id="edit-income-date" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-income-description">Description</Label>
              <Input id="edit-income-description" value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleIncomeEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── SIPs Tab ─────────────────────────────────────────────

function SipsTab() {
  const { sips, addSIP, updateSIP, deleteSIP } = useFinanceStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", amount: 0, startDate: "", endDate: "" as string | null, frequency: "monthly" as "monthly" | "quarterly", expectedReturn: 0, investedAmount: 0, currentValue: 0 })

  const handleCreate = () => {
    if (!form.name || !form.amount || !form.startDate) return
    addSIP({ ...form, endDate: form.endDate || null })
    setForm({ name: "", amount: 0, startDate: "", endDate: "", frequency: "monthly", expectedReturn: 0, investedAmount: 0, currentValue: 0 })
    setCreateOpen(false)
  }

  const handleEdit = () => {
    if (!editId) return
    updateSIP(editId, { ...form, endDate: form.endDate || null })
    setEditId(null)
    setForm({ name: "", amount: 0, startDate: "", endDate: "", frequency: "monthly", expectedReturn: 0, investedAmount: 0, currentValue: 0 })
  }

  const openEdit = (s: typeof sips[0]) => {
    setEditId(s.id)
    setForm({ name: s.name, amount: s.amount, startDate: s.startDate, endDate: s.endDate, frequency: s.frequency, expectedReturn: s.expectedReturn, investedAmount: s.investedAmount, currentValue: s.currentValue })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Systematic Investment Plans</h3>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: "", amount: 0, startDate: "", endDate: "", frequency: "monthly", expectedReturn: 0, investedAmount: 0, currentValue: 0 }); setCreateOpen(true) }} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Add SIP
        </Button>
      </div>
      {sips.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No SIPs added yet</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sips.map((s) => {
            const gain = s.currentValue - s.investedAmount
            const gainPct = s.investedAmount ? Math.round((gain / s.investedAmount) * 100) : 0
            return (
              <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">{s.name}</h4>
                    <p className="text-xs text-neutral-500">₹{s.amount.toLocaleString()}/{s.frequency} &middot; Since {s.startDate}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteSIP(s.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-neutral-500">Invested</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">₹{s.investedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Current</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">₹{s.currentValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Gain/Loss</p>
                    <p className={cn("font-medium", gain >= 0 ? "text-green-600" : "text-red-500")}>{gain >= 0 ? "+" : ""}₹{gain.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Return</p>
                    <p className={cn("font-medium", gainPct >= 0 ? "text-green-600" : "text-red-500")}>{gainPct >= 0 ? "+" : ""}{gainPct}%</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} SIP</DialogTitle>
            <DialogDescription>Systematic Investment Plan details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="sip-name">Name</Label>
              <Input id="sip-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HDFC Mid-Cap" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sip-amount">Amount (₹)</Label>
                <Input id="sip-amount" type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sip-frequency">Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as "monthly" | "quarterly" })}>
                  <SelectTrigger id="sip-frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sip-start-date">Start date</Label>
                <Input id="sip-start-date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sip-end-date">End date (optional)</Label>
                <Input id="sip-end-date" type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sip-invested">Invested (₹)</Label>
                <Input id="sip-invested" type="number" value={form.investedAmount || ""} onChange={(e) => setForm({ ...form, investedAmount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sip-current">Current (₹)</Label>
                <Input id="sip-current" type="number" value={form.currentValue || ""} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} />
              </div>
            </div>
            <Button className="w-full" onClick={editId ? handleEdit : handleCreate} disabled={!form.name || !form.amount || !form.startDate}>
              {editId ? "Save" : "Add SIP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Stocks Tab ───────────────────────────────────────────

function StocksTab() {
  const { stocks, addStock, updateStock, deleteStock } = useFinanceStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", ticker: "", buyPrice: 0, quantity: 0, currentPrice: 0, sector: "" })

  const handleCreate = () => {
    if (!form.name || !form.ticker || !form.buyPrice || !form.quantity) return
    addStock(form)
    setForm({ name: "", ticker: "", buyPrice: 0, quantity: 0, currentPrice: 0, sector: "" })
    setCreateOpen(false)
  }

  const handleEdit = () => {
    if (!editId) return
    updateStock(editId, form)
    setEditId(null)
    setForm({ name: "", ticker: "", buyPrice: 0, quantity: 0, currentPrice: 0, sector: "" })
  }

  const openEdit = (s: typeof stocks[0]) => {
    setEditId(s.id)
    setForm({ name: s.name, ticker: s.ticker, buyPrice: s.buyPrice, quantity: s.quantity, currentPrice: s.currentPrice, sector: s.sector })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Stock Portfolio</h3>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: "", ticker: "", buyPrice: 0, quantity: 0, currentPrice: 0, sector: "" }); setCreateOpen(true) }} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Add Stock
        </Button>
      </div>
      {stocks.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No stocks added yet</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stocks.map((s) => {
            const invested = s.buyPrice * s.quantity
            const current = s.currentPrice * s.quantity
            const gain = current - invested
            const gainPct = invested ? Math.round((gain / invested) * 100) : 0
            return (
              <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">{s.name}</h4>
                    <p className="text-xs text-neutral-500">{s.ticker.toUpperCase()} &middot; {s.sector || "N/A"} &middot; {s.quantity} shares</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteStock(s.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-neutral-500">Avg Buy</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">₹{s.buyPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Current</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">₹{s.currentPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Invested</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">₹{invested.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">P&L</p>
                    <p className={cn("font-medium", gain >= 0 ? "text-green-600" : "text-red-500")}>{gain >= 0 ? "+" : ""}₹{gain.toLocaleString()} ({gainPct >= 0 ? "+" : ""}{gainPct}%)</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={createOpen || !!editId} onOpenChange={(v) => { if (!v) setEditId(null); setCreateOpen(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} Stock</DialogTitle>
            <DialogDescription>Stock holding details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stock-name">Name</Label>
                <Input id="stock-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Reliance" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-ticker">Ticker</Label>
                <Input id="stock-ticker" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="e.g. RELIANCE" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stock-buy-price">Buy Price (₹)</Label>
                <Input id="stock-buy-price" type="number" value={form.buyPrice || ""} onChange={(e) => setForm({ ...form, buyPrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-quantity">Quantity</Label>
                <Input id="stock-quantity" type="number" value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stock-current-price">Current Price (₹)</Label>
                <Input id="stock-current-price" type="number" value={form.currentPrice || ""} onChange={(e) => setForm({ ...form, currentPrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-sector">Sector</Label>
                <Input id="stock-sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="e.g. Technology" />
              </div>
            </div>
            <Button className="w-full" onClick={editId ? handleEdit : handleCreate} disabled={!form.name || !form.ticker || !form.buyPrice || !form.quantity}>
              {editId ? "Save" : "Add Stock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Mutual Funds Tab ─────────────────────────────────────

function FundsTab() {
  const { mutualFunds, addMutualFund, updateMutualFund, deleteMutualFund } = useFinanceStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", fundHouse: "", nav: 0, units: 0, investedAmount: 0, currentValue: 0 })

  const handleCreate = () => {
    if (!form.name || !form.nav || !form.units) return
    addMutualFund(form)
    setForm({ name: "", fundHouse: "", nav: 0, units: 0, investedAmount: 0, currentValue: 0 })
    setCreateOpen(false)
  }

  const handleEdit = () => {
    if (!editId) return
    updateMutualFund(editId, form)
    setEditId(null)
    setForm({ name: "", fundHouse: "", nav: 0, units: 0, investedAmount: 0, currentValue: 0 })
  }

  const openEdit = (m: typeof mutualFunds[0]) => {
    setEditId(m.id)
    setForm({ name: m.name, fundHouse: m.fundHouse, nav: m.nav, units: m.units, investedAmount: m.investedAmount, currentValue: m.currentValue })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Mutual Funds</h3>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: "", fundHouse: "", nav: 0, units: 0, investedAmount: 0, currentValue: 0 }); setCreateOpen(true) }} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Add Fund
        </Button>
      </div>
      {mutualFunds.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No mutual funds added yet</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mutualFunds.map((mf) => {
            const gain = mf.currentValue - mf.investedAmount
            const gainPct = mf.investedAmount ? Math.round((gain / mf.investedAmount) * 100) : 0
            return (
              <div key={mf.id} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">{mf.name}</h4>
                    <p className="text-xs text-neutral-500">{mf.fundHouse} &middot; {mf.units} units @ ₹{mf.nav}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(mf)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteMutualFund(mf.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-neutral-500">Invested</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">₹{mf.investedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Current</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">₹{mf.currentValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Gain/Loss</p>
                    <p className={cn("font-medium", gain >= 0 ? "text-green-600" : "text-red-500")}>{gain >= 0 ? "+" : ""}₹{gain.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Return</p>
                    <p className={cn("font-medium", gainPct >= 0 ? "text-green-600" : "text-red-500")}>{gainPct >= 0 ? "+" : ""}{gainPct}%</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={createOpen || !!editId} onOpenChange={(v) => { if (!v) { setEditId(null); setCreateOpen(false) } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} Mutual Fund</DialogTitle>
            <DialogDescription>Fund details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mf-name">Fund name</Label>
                <Input id="mf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mid-Cap Fund" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mf-house">Fund house</Label>
                <Input id="mf-house" value={form.fundHouse} onChange={(e) => setForm({ ...form, fundHouse: e.target.value })} placeholder="e.g. HDFC" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mf-nav">NAV (₹)</Label>
                <Input id="mf-nav" type="number" value={form.nav || ""} onChange={(e) => setForm({ ...form, nav: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mf-units">Units</Label>
                <Input id="mf-units" type="number" value={form.units || ""} onChange={(e) => setForm({ ...form, units: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mf-invested">Invested (₹)</Label>
                <Input id="mf-invested" type="number" value={form.investedAmount || ""} onChange={(e) => setForm({ ...form, investedAmount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mf-current">Current (₹)</Label>
                <Input id="mf-current" type="number" value={form.currentValue || ""} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} />
              </div>
            </div>
            <Button className="w-full" onClick={editId ? handleEdit : handleCreate} disabled={!form.name || !form.nav || !form.units}>
              {editId ? "Save" : "Add Fund"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Net Worth Tab ────────────────────────────────────────

function NetWorthTab() {
  const { incomes, expenses, sips, stocks, mutualFunds } = useFinanceStore()

  const totalIncome = incomes.reduce((s, inc) => s + inc.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const sipInvested = sips.reduce((s, si) => s + si.investedAmount, 0)
  const sipCurrent = sips.reduce((s, si) => s + si.currentValue, 0)
  const stockInvested = stocks.reduce((s, st) => s + st.buyPrice * st.quantity, 0)
  const stockCurrent = stocks.reduce((s, st) => s + st.currentPrice * st.quantity, 0)
  const mfInvested = mutualFunds.reduce((s, mf) => s + mf.investedAmount, 0)
  const mfCurrent = mutualFunds.reduce((s, mf) => s + mf.currentValue, 0)

  const totalInvested = sipInvested + stockInvested + mfInvested
  const totalCurrent = sipCurrent + stockCurrent + mfCurrent
  const totalGain = totalCurrent - totalInvested
  const totalGainPct = totalInvested ? Math.round((totalGain / totalInvested) * 100) : 0

  const sections = [
    { name: "SIPs", invested: sipInvested, current: sipCurrent, color: "bg-blue-500" },
    { name: "Stocks", invested: stockInvested, current: stockCurrent, color: "bg-emerald-500" },
    { name: "Mutual Funds", invested: mfInvested, current: mfCurrent, color: "bg-purple-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Income vs Expenses summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/30">
          <p className="text-xs text-green-600 dark:text-green-400">Total Income</p>
          <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-xs text-red-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500">Net Cash Flow</p>
          <p className={cn("text-2xl font-bold", totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-500")}>
            ₹{(totalIncome - totalExpenses).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500">Total Invested</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">₹{totalInvested.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500">Current Value</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">₹{totalCurrent.toLocaleString()}</p>
        </div>
        <div className={cn("rounded-2xl border p-5", totalGain >= 0 ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30")}>
          <p className="text-xs text-neutral-500">Total Gain/Loss</p>
          <p className={cn("text-2xl font-bold", totalGain >= 0 ? "text-green-600" : "text-red-500")}>
            {totalGain >= 0 ? "+" : ""}₹{totalGain.toLocaleString()} ({totalGainPct >= 0 ? "+" : ""}{totalGainPct}%)
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((sec) => {
          const gain = sec.current - sec.invested
          const pct = sec.invested ? Math.round((gain / sec.invested) * 100) : 0
          return (
            <div key={sec.name} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("h-2.5 w-2.5 rounded-full", sec.color)} />
                <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-50">{sec.name}</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Invested</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">₹{sec.invested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Current</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">₹{sec.current.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Gain/Loss</span>
                  <span className={cn("font-medium", gain >= 0 ? "text-green-600" : "text-red-500")}>
                    {gain >= 0 ? "+" : ""}₹{gain.toLocaleString()} ({pct >= 0 ? "+" : ""}{pct}%)
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-3">Allocation</h3>
        {totalInvested > 0 ? (
          <div className="space-y-3">
            {sections.map((sec) => {
              const pct = Math.round((sec.invested / totalInvested) * 100)
              return (
                <div key={sec.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600 dark:text-neutral-400">{sec.name}</span>
                    <span className="text-neutral-700 dark:text-neutral-300">{pct}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <motion.div
                      className={cn("absolute inset-y-0 left-0 rounded-full", sec.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-400 text-center py-4">No investments to show</p>
        )}
      </div>
    </div>
  )
}

// ─── Archive Tab ──────────────────────────────────────────

function ArchiveTab() {
  const { incomes, expenses, sips, stocks, mutualFunds, clearExpenses, clearIncomes, clearSIPs, clearStocks, clearMutualFunds } = useFinanceStore()
  const [subTab, setSubTab] = useState<"income" | "expenses" | "investments">("expenses")

  const handleExportExpenses = async () => {
    const data = expenses.map((e) => ({ Category: e.category, Amount: e.amount, Date: e.date, Description: e.description }))
    const XLSX = await import("xlsx")
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Expenses")
    XLSX.writeFile(wb, "expenses.xlsx")
  }

  const handleExportIncome = async () => {
    const data = incomes.map((inc) => ({ Source: inc.source, Amount: inc.amount, Date: inc.date, Description: inc.description }))
    const XLSX = await import("xlsx")
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Income")
    XLSX.writeFile(wb, "income.xlsx")
  }

  const handleExportInvestments = async () => {
    const data = [
      ...sips.map((s) => ({ Type: "SIP", Name: s.name, Invested: s.investedAmount, Current: s.currentValue })),
      ...stocks.map((s) => ({ Type: "Stock", Name: s.name, Invested: s.buyPrice * s.quantity, Current: s.currentPrice * s.quantity })),
      ...mutualFunds.map((mf) => ({ Type: "Mutual Fund", Name: mf.name, Invested: mf.investedAmount, Current: mf.currentValue })),
    ]
    const XLSX = await import("xlsx")
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Investments")
    XLSX.writeFile(wb, "investments.xlsx")
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-neutral-100/80 p-1.5 dark:bg-neutral-800/40">
        {(["income", "expenses", "investments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
              subTab === t
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "income" ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportIncome} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Export .xlsx
            </Button>
            <Button variant="outline" size="sm" onClick={clearIncomes} className="gap-2 text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          </div>
          {incomes.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">No income recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left text-xs text-neutral-500">
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((inc) => (
                    <tr key={inc.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                      <td className="py-2"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", incomeColors[inc.source])}>{inc.source}</span></td>
                      <td className="py-2 font-medium text-green-600">₹{inc.amount.toLocaleString()}</td>
                      <td className="py-2 text-neutral-500">{inc.date}</td>
                      <td className="py-2 text-neutral-500">{inc.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : subTab === "expenses" ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExpenses} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Export .xlsx
            </Button>
            <Button variant="outline" size="sm" onClick={clearExpenses} className="gap-2 text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          </div>
          {expenses.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">No expenses recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left text-xs text-neutral-500">
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                      <td className="py-2"><span className={cn("rounded px-2 py-0.5 text-xs font-medium", categoryColors[e.category])}>{e.category}</span></td>
                      <td className="py-2 font-medium text-neutral-900 dark:text-neutral-50">₹{e.amount.toLocaleString()}</td>
                      <td className="py-2 text-neutral-500">{e.date}</td>
                      <td className="py-2 text-neutral-500">{e.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportInvestments} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Export .xlsx
            </Button>
            <Button variant="outline" size="sm" onClick={() => { clearSIPs(); clearStocks(); clearMutualFunds() }} className="gap-2 text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          </div>
          {sips.length === 0 && stocks.length === 0 && mutualFunds.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">No investments recorded</p>
          ) : (
            <div className="space-y-6">
              {sips.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">SIPs ({sips.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left text-xs text-neutral-500">
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium">Amount</th>
                          <th className="pb-2 font-medium">Invested</th>
                          <th className="pb-2 font-medium">Current</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sips.map((s) => (
                          <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                            <td className="py-2 font-medium text-neutral-900 dark:text-neutral-50">{s.name}</td>
                            <td className="py-2 text-neutral-500">₹{s.amount.toLocaleString()}/{s.frequency}</td>
                            <td className="py-2 text-neutral-500">₹{s.investedAmount.toLocaleString()}</td>
                            <td className="py-2 text-neutral-500">₹{s.currentValue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {stocks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Stocks ({stocks.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left text-xs text-neutral-500">
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium">Qty</th>
                          <th className="pb-2 font-medium">Invested</th>
                          <th className="pb-2 font-medium">Current</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((s) => (
                          <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                            <td className="py-2 font-medium text-neutral-900 dark:text-neutral-50">{s.name}</td>
                            <td className="py-2 text-neutral-500">{s.quantity}</td>
                            <td className="py-2 text-neutral-500">₹{(s.buyPrice * s.quantity).toLocaleString()}</td>
                            <td className="py-2 text-neutral-500">₹{(s.currentPrice * s.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {mutualFunds.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Mutual Funds ({mutualFunds.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left text-xs text-neutral-500">
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium">Units</th>
                          <th className="pb-2 font-medium">Invested</th>
                          <th className="pb-2 font-medium">Current</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mutualFunds.map((mf) => (
                          <tr key={mf.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                            <td className="py-2 font-medium text-neutral-900 dark:text-neutral-50">{mf.name}</td>
                            <td className="py-2 text-neutral-500">{mf.units}</td>
                            <td className="py-2 text-neutral-500">₹{mf.investedAmount.toLocaleString()}</td>
                            <td className="py-2 text-neutral-500">₹{mf.currentValue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Finance Panel ───────────────────────────────────

export function FinancePanel() {
  const [tab, setTab] = useState<FinanceTab>("expenses")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Finance
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Track expenses, investments, and your net worth
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
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                tab === t.key
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
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
          {tab === "expenses" && <ExpensesTab />}
          {tab === "sips" && <SipsTab />}
          {tab === "stocks" && <StocksTab />}
          {tab === "funds" && <FundsTab />}
          {tab === "networth" && <NetWorthTab />}
          {tab === "archive" && <ArchiveTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
