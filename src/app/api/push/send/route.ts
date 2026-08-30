import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendWebPushToUser, loadPushSubscriptions } from "@/lib/push"

// Client-facing endpoint: deliver an OS push notification to every device the
// current user has subscribed from (installed PWA). Fire-and-forget so banners
// appear even when the app/ui is backgrounded.
export async function POST(req: NextRequest) {
  try {
    const { title, body, href, tag } = await req.json()
    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const service = createServiceClient()
    const sent = await sendWebPushToUser(user.id, { title, body, href, tag }, () =>
      loadPushSubscriptions(service, user.id)
    )

    return NextResponse.json({ ok: true, delivered: sent })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}