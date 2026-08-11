import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildAuthUrl } from "@/lib/calendar"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Google Calendar is not configured yet — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: buildAuthUrl() })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
