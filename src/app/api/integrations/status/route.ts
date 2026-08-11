import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getEmailSettings, getCalendarTokens, type EmailSettings, type CalendarTokens } from "@/lib/integrations"
import { getEmailCookie, getCalendarCookie } from "@/lib/integration-cookies"

export async function GET() {
  try {
    let email: EmailSettings | null | undefined = await getEmailCookie()
    let calendar: CalendarTokens | null | undefined = await getCalendarCookie()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      if (!email) email = await getEmailSettings(user.id)
      if (!calendar) calendar = await getCalendarTokens(user.id)
    }

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
