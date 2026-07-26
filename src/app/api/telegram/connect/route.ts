import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { chatId, botTokenHash } = await req.json()
    if (!chatId || !botTokenHash) {
      return NextResponse.json({ error: "Missing chatId or botTokenHash" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { error } = await supabase
      .from("telegram_connections")
      .upsert(
        { user_id: user.id, chat_id: chatId, bot_token_hash: botTokenHash },
        { onConflict: "user_id" }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
