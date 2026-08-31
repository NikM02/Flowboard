import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// "Erase all data". Instead of deleting the row (which makes other devices
// think "no cloud data" and re-upload their own stale local copy), we write a
// tombstone: empty collections + a clearedAt timestamp. On hydration every
// device sees clearedAt is newer than its local backup and drops local state,
// so the wipe propagates smoothly across all devices instead of resurrecting.
const EMPTY: Record<string, unknown> = {
  tasks: [],
  projects: [],
  sleepEntries: [],
  habits: [],
  challenges: [],
  dopamine: [],
  skills: [],
  incomes: [],
  expenses: [],
  budgets: [],
  sips: [],
  stocks: [],
  mutualFunds: [],
  futureGoals: [],
  contentItems: [],
  northStar: { vision: "", mission: "", identity: "", pillars: [] },
  bucketListItems: [],
  advanceTodos: [],
  notifications: [],
  colorTheme: "dark",
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: user.id,
      data: { ...EMPTY, clearedAt: Date.now() } as unknown as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
