import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getEmailSettings, type EmailSettings } from "@/lib/integrations"
import { getEmailCookie } from "@/lib/integration-cookies"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { subject, bodyHtml, category } = await req.json()
    if (!subject || !bodyHtml) {
      return NextResponse.json({ error: "Missing subject or body" }, { status: 400 })
    }

    let settings: EmailSettings | null | undefined = await getEmailCookie()

    if (!settings) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) settings = await getEmailSettings(user.id)
    }

    if (!settings || !settings.appPassword) {
      return NextResponse.json({ error: "Email not configured" }, { status: 400 })
    }

    // Enforce per-category toggles server-side
    if (category === "new" && !settings.notifyNew) return NextResponse.json({ ok: true, skipped: true })
    if (category === "update" && !settings.notifyUpdates) return NextResponse.json({ ok: true, skipped: true })
    if (category === "due" && !settings.notifyDue) return NextResponse.json({ ok: true, skipped: true })

    const ok = await sendEmail(settings, subject, bodyHtml)

    if (ok) return NextResponse.json({ ok: true })
    return NextResponse.json({ error: "Failed to send email — check your Gmail app password" }, { status: 500 })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
