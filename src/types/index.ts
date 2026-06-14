export type Priority = "low" | "medium" | "high"

export type Subtask = {
  id: string
  title: string
  completed: boolean
}

export type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  progress: number
  priority: Priority
  dueDate: string
  subtasks: Subtask[]
  createdAt: number
}

export type ViewMode = "card" | "list"
export type FilterStatus = "all" | "active" | "completed"
export type SortOption = "dueDate" | "progress" | "priority" | "createdAt"

export type HabitCategory = "health" | "fitness" | "mindfulness" | "learning" | "productivity" | "creative" | "social"
export type HabitIcon = "heart" | "dumbbell" | "brain" | "book" | "target" | "palette" | "users" | "sun" | "moon" | "coffee" | "music" | "code"

export type DailyRecord = {
  date: string
  completed: boolean
}

export type Habit = {
  id: string
  name: string
  description: string
  category: HabitCategory
  icon: HabitIcon
  frequency: "daily" | "weekly"
  startDate?: string
  endDate?: string
  records: DailyRecord[]
  createdAt: number
}

export type ChallengeType = "21" | "30" | "90"

export type Challenge = {
  id: string
  title: string
  description: string
  type: ChallengeType
  days: ChallengeDay[]
  startDate: string
  endDate: string
  joined: boolean
  createdAt: number
}

export type ChallengeDay = {
  day: number
  date: string
  completed: boolean
  note: string
}

export type HViewMode = "card" | "list"
export type DashboardSection = "tasks" | "habits" | "skills" | "finance" | "future"

export type DopamineEntry = {
  id: string
  date: string
  mood: number
  energy: number
  motivation: number
  focus: number
  stress: number
  sleep: number
  average: number
  createdAt: number
}

export type SkillSource = "book" | "course" | "youtube" | "person"

export type SkillEntry = {
  id: string
  name: string
  source: SkillSource
  sourceDetail: string
  startDate: string
  endDate: string
  progress: number
  completed: boolean
  notes: string
  createdAt: number
}

export type IncomeSource = "job" | "youtube" | "digital" | "website" | "freelance" | "other"

export type Income = {
  id: string
  source: IncomeSource
  amount: number
  date: string
  description: string
  createdAt: number
}

export type ExpenseCategory = "food" | "transport" | "housing" | "utilities" | "entertainment" | "healthcare" | "shopping" | "education" | "other"

export type Expense = {
  id: string
  category: ExpenseCategory
  amount: number
  date: string
  description: string
  createdAt: number
}

export type Budget = {
  id: string
  category: ExpenseCategory
  limit: number
  month: string
}

export type SIP = {
  id: string
  name: string
  amount: number
  startDate: string
  endDate: string | null
  frequency: "monthly" | "quarterly"
  expectedReturn: number
  investedAmount: number
  currentValue: number
  createdAt: number
}

export type Stock = {
  id: string
  name: string
  ticker: string
  buyPrice: number
  quantity: number
  currentPrice: number
  sector: string
  createdAt: number
}

export type MutualFund = {
  id: string
  name: string
  fundHouse: string
  nav: number
  units: number
  investedAmount: number
  currentValue: number
  createdAt: number
}

export type FinanceTab = "expenses" | "sips" | "stocks" | "funds" | "networth" | "archive"

export type GrowthPeriod = "monthly" | "quarterly" | "yearly"

export type FutureGoal = {
  id: string
  title: string
  category: "tasks" | "habits" | "skills" | "dopamine" | "finance"
  targetValue: number
  currentValue: number
  period: GrowthPeriod
  periodKey: string
  completed: boolean
  createdAt: number
}

export type GrowthCategory = "tasks" | "habits" | "skills" | "dopamine" | "finance"
