import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setEmailSettings } from "@/lib/integrations"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { smtpUser, appPassword, recipient, notifyNew, notifyUpdates, notifyDue } = await req.json()

    if (!smtpUser || !appPassword) {
      return NextResponse.json({ error: "Missing Gmail address or app password" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const settings = {
      smtpUser,
      appPassword,
      recipient: recipient || smtpUser,
      notifyNew: Boolean(notifyNew),
      notifyUpdates: Boolean(notifyUpdates),
      notifyDue: Boolean(notifyDue),
    }

    const testOk = await sendEmail(
      settings,
      "Nexus connected",
      "Your email notifications are now active. You'll get a mail whenever something new happens in Nexus."
    )

    const saved = await setEmailSettings(user.id, settings)

    return NextResponse.json({ ok: saved, testSent: testOk })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
