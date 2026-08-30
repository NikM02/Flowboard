import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { savePushSubscription, removePushSubscription, loadPushSubscriptions } from "@/lib/push"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const { subscription } = await req.json()
    const endpoint = subscription?.endpoint
    const keys = subscription?.keys
    if (!endpoint || !keys) {
      return NextResponse.json({ error: "Missing subscription" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await savePushSubscription(supabase as unknown as SupabaseClient, user.id, { endpoint, keys })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    await removePushSubscription(supabase as unknown as SupabaseClient, user.id, endpoint)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const subs = await loadPushSubscriptions(supabase as unknown as SupabaseClient, user.id)
    return NextResponse.json({ ok: true, count: subs.length })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}