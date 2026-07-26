import { NextRequest, NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(req: NextRequest) {
  try {
    const { botToken, chatId, message } = await req.json()

    if (!botToken || !chatId || !message) {
      return NextResponse.json({ error: "Missing botToken, chatId, or message" }, { status: 400 })
    }

    const ok = await sendTelegramMessage(botToken, chatId, message)

    if (ok) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
