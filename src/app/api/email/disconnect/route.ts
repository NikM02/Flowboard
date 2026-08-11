import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { clearEmailSettings } from "@/lib/integrations"

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    await clearEmailSettings(user.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
