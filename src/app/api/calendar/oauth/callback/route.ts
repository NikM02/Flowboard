import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exchangeCodeForTokens } from "@/lib/calendar"
import { setCalendarTokens } from "@/lib/integrations"

export async function GET(req: NextRequest) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${site}/dashboard?calendar=error`)

    const code = req.nextUrl.searchParams.get("code")
    const error = req.nextUrl.searchParams.get("error")

    if (error || !code) {
      return NextResponse.redirect(`${site}/dashboard?calendar=error`)
    }

    const tokens = await exchangeCodeForTokens(code)
    if (!tokens) {
      return NextResponse.redirect(`${site}/dashboard?calendar=error`)
    }

    await setCalendarTokens(user.id, tokens)
    return NextResponse.redirect(`${site}/dashboard?calendar=connected`)
  } catch {
    return NextResponse.redirect(`${site}/dashboard?calendar=error`)
  }
}
