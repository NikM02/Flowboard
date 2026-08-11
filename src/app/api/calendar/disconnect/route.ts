import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { clearCalendarTokens } from "@/lib/integrations"
import { clearCalendarCookie } from "@/lib/integration-cookies"

export async function POST() {
  try {
    clearCalendarCookie()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await clearCalendarTokens(user.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
