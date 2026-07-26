import { NextRequest, NextResponse } from "next/server"
import { verifyBotToken } from "@/lib/telegram"

export async function POST(req: NextRequest) {
  try {
    const { botToken } = await req.json()
    if (!botToken) {
      return NextResponse.json({ error: "Missing botToken" }, { status: 400 })
    }
    const result = await verifyBotToken(botToken)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
