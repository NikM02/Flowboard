import { create } from "zustand"
import type { Expense, Budget, SIP, Stock, MutualFund, ExpenseCategory, Income, IncomeSource } from "@/types"
import { generateId } from "@/lib/utils"

type FinanceStore = {
  incomes: Income[]
  expenses: Expense[]
  budgets: Budget[]
  sips: SIP[]
  stocks: Stock[]
  mutualFunds: MutualFund[]

  addIncome: (data: { source: IncomeSource; amount: number; date: string; description: string }) => void
  updateIncome: (id: string, data: Partial<Income>) => void
  deleteIncome: (id: string) => void

  addExpense: (data: { category: ExpenseCategory; amount: number; date: string; description: string }) => void
  updateExpense: (id: string, data: Partial<Expense>) => void
  deleteExpense: (id: string) => void

  setBudget: (data: { category: ExpenseCategory; limit: number; month: string }) => void
  deleteBudget: (id: string) => void

  addSIP: (data: { name: string; amount: number; startDate: string; endDate: string | null; frequency: "monthly" | "quarterly"; expectedReturn: number; investedAmount: number; currentValue: number }) => void
  updateSIP: (id: string, data: Partial<SIP>) => void
  deleteSIP: (id: string) => void

  addStock: (data: { name: string; ticker: string; buyPrice: number; quantity: number; currentPrice: number; sector: string }) => void
  updateStock: (id: string, data: Partial<Stock>) => void
  deleteStock: (id: string) => void

  addMutualFund: (data: { name: string; fundHouse: string; nav: number; units: number; investedAmount: number; currentValue: number }) => void
  updateMutualFund: (id: string, data: Partial<MutualFund>) => void
  deleteMutualFund: (id: string) => void

  clearExpenses: () => void
  clearIncomes: () => void
  clearSIPs: () => void
  clearStocks: () => void
  clearMutualFunds: () => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  incomes: [],
  expenses: [],
  budgets: [],
  sips: [],
  stocks: [],
  mutualFunds: [],

  addIncome: (data) => {
    const entry: Income = { id: generateId(), ...data, createdAt: Date.now() }
    set((s) => ({ incomes: [entry, ...s.incomes] }))
  },
  updateIncome: (id, data) => {
    set((s) => ({ incomes: s.incomes.map((inc) => (inc.id === id ? { ...inc, ...data } : inc)) }))
  },
  deleteIncome: (id) => {
    set((s) => ({ incomes: s.incomes.filter((inc) => inc.id !== id) }))
  },

  addExpense: (data) => {
    const entry: Expense = { id: generateId(), ...data, createdAt: Date.now() }
    set((s) => ({ expenses: [entry, ...s.expenses] }))
  },
  updateExpense: (id, data) => {
    set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)) }))
  },
  deleteExpense: (id) => {
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
  },

  setBudget: (data) => {
    set((s) => {
      const idx = s.budgets.findIndex((b) => b.category === data.category && b.month === data.month)
      if (idx >= 0) {
        const updated = s.budgets.map((b, i) => (i === idx ? { ...b, limit: data.limit } : b))
        return { budgets: updated }
      }
      return { budgets: [...s.budgets, { id: generateId(), ...data }] }
    })
  },
  deleteBudget: (id) => {
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }))
  },

  addSIP: (data) => {
    const entry: SIP = { id: generateId(), ...data, createdAt: Date.now() }
    set((s) => ({ sips: [entry, ...s.sips] }))
  },
  updateSIP: (id, data) => {
    set((s) => ({ sips: s.sips.map((si) => (si.id === id ? { ...si, ...data } : si)) }))
  },
  deleteSIP: (id) => {
    set((s) => ({ sips: s.sips.filter((si) => si.id !== id) }))
  },

  addStock: (data) => {
    const entry: Stock = { id: generateId(), ...data, createdAt: Date.now() }
    set((s) => ({ stocks: [entry, ...s.stocks] }))
  },
  updateStock: (id, data) => {
    set((s) => ({ stocks: s.stocks.map((st) => (st.id === id ? { ...st, ...data } : st)) }))
  },
  deleteStock: (id) => {
    set((s) => ({ stocks: s.stocks.filter((st) => st.id !== id) }))
  },

  addMutualFund: (data) => {
    const entry: MutualFund = { id: generateId(), ...data, createdAt: Date.now() }
    set((s) => ({ mutualFunds: [entry, ...s.mutualFunds] }))
  },
  updateMutualFund: (id, data) => {
    set((s) => ({ mutualFunds: s.mutualFunds.map((mf) => (mf.id === id ? { ...mf, ...data } : mf)) }))
  },
  deleteMutualFund: (id) => {
    set((s) => ({ mutualFunds: s.mutualFunds.filter((mf) => mf.id !== id) }))
  },

  clearExpenses: () => set({ expenses: [] }),
  clearIncomes: () => set({ incomes: [] }),
  clearSIPs: () => set({ sips: [] }),
  clearStocks: () => set({ stocks: [] }),
  clearMutualFunds: () => set({ mutualFunds: [] }),
}))
