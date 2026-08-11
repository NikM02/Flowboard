import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { clearEmailSettings } from "@/lib/integrations"
import { clearEmailCookie } from "@/lib/integration-cookies"

export async function POST() {
  try {
    clearEmailCookie()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await clearEmailSettings(user.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
