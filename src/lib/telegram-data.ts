import { createServiceClient } from "@/lib/supabase/service"

export interface UserData {
  tasks?: { id: string; title: string; description?: string; completed: boolean; priority: "high" | "medium" | "low"; dueDate: string; project?: string; reminder?: string; createdAt?: number }[]
  projects?: string[]
  habits?: { id: string; name: string; records?: { date: string; completed: boolean }[]; streak?: number }[]
  challenges?: { id: string; title: string; description: string; type: "21" | "30" | "90"; days: { day: number; date: string; completed: boolean; note: string }[]; startDate: string; endDate: string; joined: boolean; createdAt?: number }[]
  skills?: { id: string; name: string; source: "book" | "course" | "youtube" | "person"; sourceDetail: string; startDate: string; endDate: string; progress: number; completed: boolean; notes: string }[]
  incomes?: { id: string; source: "job" | "youtube" | "digital" | "website" | "freelance" | "other"; amount: number; date: string; description?: string }[]
  expenses?: { id: string; category: "food" | "transport" | "housing" | "utilities" | "entertainment" | "healthcare" | "shopping" | "education" | "other"; amount: number; date: string; description?: string }[]
  budgets?: { id: string; category: string; limit: number; month: string }[]
  sips?: { id: string; name: string; amount: number; startDate?: string; endDate?: string | null; frequency: "monthly" | "quarterly"; expectedReturn?: number; investedAmount?: number; currentValue?: number }[]
  stocks?: { id: string; name: string; ticker?: string; buyPrice: number; quantity: number; currentPrice?: number; sector?: string; invested?: number; currentValue?: number }[]
  mutualFunds?: { id: string; name: string; fundHouse?: string; nav: number; units: number; investedAmount?: number; currentValue?: number; invested?: number }[]
  futureGoals?: { id: string; title: string; category: "tasks" | "habits" | "skills" | "dopamine" | "finance"; targetValue: number; currentValue: number; period?: "monthly" | "quarterly" | "yearly"; periodKey?: string; completed?: boolean }[]
  contentItems?: { id: string; emoji?: string; title: string; description?: string; deadline: string; status: "ideas" | "scripts" | "filming" | "editing" | "published"; subtasks?: { id: string; title: string; completed: boolean }[] }[]
  northStar?: { vision: string; mission: string; identity?: string; pillars?: { title: string; icon: string }[] }
  bucketListItems?: { id: string; title: string; description?: string; expectedDate: string; timeframe?: string; completed: boolean }[]
  advanceTodos?: { id: string; title: string; completed: boolean; date: string; createdAt?: number }[]
  sleepEntries?: { id: string; date: string; bedtime: string; wakeTime: string; hours: number; quality: number; notes?: string }[]
  telegramToken?: string
  reminderLog?: string[]
}

export async function getUserIdForChatId(chatId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("telegram_connections")
    .select("user_id")
    .eq("chat_id", chatId)
    .single()
  return data?.user_id ?? null
}

export async function getUserData(userId: string): Promise<UserData | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single()
  return (data?.data as UserData) ?? null
}

export async function saveUserData(userId: string, data: UserData): Promise<boolean> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("user_data")
    .upsert(
      { user_id: userId, data: data as any, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
  return !error
}
