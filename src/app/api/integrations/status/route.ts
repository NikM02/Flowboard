import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getEmailSettings, getCalendarTokens } from "@/lib/integrations"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const email = await getEmailSettings(user.id)
    const calendar = await getCalendarTokens(user.id)

    return NextResponse.json({
      email: email
        ? {
            configured: true,
            smtpUser: email.smtpUser,
            recipient: email.recipient,
            notifyNew: email.notifyNew,
            notifyUpdates: email.notifyUpdates,
            notifyDue: email.notifyDue,
          }
        : { configured: false },
      calendar: calendar ? { connected: true, email: calendar.email } : { connected: false },
    })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
