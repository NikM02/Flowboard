import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { chatId, botTokenHash, botToken } = await req.json()
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

    // Store the raw token in the user's data row so server-side jobs
    // (webhook + reminder cron) can push proactive messages to the phone.
    if (botToken) {
      const { data: row } = await supabase
        .from("user_data")
        .select("data")
        .eq("user_id", user.id)
        .single()
      const prev = (row?.data as Record<string, unknown> | undefined) ?? {}
      await supabase.from("user_data").upsert(
        {
          user_id: user.id,
          data: { ...prev, telegramToken: botToken } as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    await supabase.from("telegram_connections").delete().eq("user_id", user.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
