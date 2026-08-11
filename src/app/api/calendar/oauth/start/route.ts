import { NextResponse } from "next/server"
import { buildAuthUrl } from "@/lib/calendar"

export async function GET() {
  try {
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
