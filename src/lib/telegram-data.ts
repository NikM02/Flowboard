import { createServiceClient } from "@/lib/supabase/service"

interface UserData {
  tasks?: { id: string; title: string; completed: boolean; priority: string; dueDate: string; project?: string }[]
  habits?: { id: string; name: string; records?: { date: string; completed: boolean }[]; streak?: number }[]
  incomes?: { id: string; amount: number; source: string; date: string }[]
  expenses?: { id: string; amount: number; category: string; date: string; description?: string }[]
  sips?: { id: string; name: string; amount: number; status?: string }[]
  stocks?: { id: string; name: string; invested: number; currentValue: number }[]
  mutualFunds?: { id: string; name: string; invested: number; currentValue: number }[]
  futureGoals?: { id: string; title: string; targetAmount: number; currentValue: number; deadline: string }[]
  contentItems?: { id: string; title: string; status: string; deadline: string; subtasks?: { completed: boolean }[] }[]
  northStar?: { vision: string; mission: string; identity: string; pillars?: { title: string; icon: string }[] }
  bucketListItems?: { id: string; title: string; completed: boolean; expectedDate: string }[]
  advanceTodos?: { id: string; title: string; completed: boolean; date: string }[]
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
