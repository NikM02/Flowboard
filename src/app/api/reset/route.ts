import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Permanently deletes the signed-in user's app data (the user_data row).
// The client clears local storage / stores first, then calls this so nothing
// stale is re-uploaded.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { error } = await supabase.from("user_data").delete().eq("user_id", user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
