import { NextRequest, NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"
import { getUserIdForChatId, getUserData } from "@/lib/telegram-data"

interface TelegramMessage {
  message?: {
    chat: { id: number }
    text?: string
    from?: { first_name: string }
  }
}

function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || ""
}

export async function POST(req: NextRequest) {
  try {
    const body: TelegramMessage = await req.json()
    const msg = body.message
    if (!msg?.text || !msg?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(msg.chat.id)
    const text = msg.text.trim().toLowerCase()
    const botToken = getBotToken()

    if (!botToken) {
      return NextResponse.json({ ok: true })
    }

    // Look up which user owns this chat
    const userId = await getUserIdForChatId(chatId)
    const data = userId ? await getUserData(userId) : null

    let reply = ""

    switch (text) {
      case "/start":
        reply = `<b>Welcome to Nexus Bot! \ud83d\ude80</b>\n\nI can send you live data and reminders.\n\n<b>Commands:</b>\n/tasks \u2014 Active tasks\n/habits \u2014 Today\u2019s habits\n/finance \u2014 Income vs expenses\n/invest \u2014 Portfolio summary\n\nReminders are sent automatically when tasks are due.`
        break

      case "/help":
        reply = `<b>Nexus Bot Commands</b>\n\n/tasks \u2014 View active tasks\n/habits \u2014 Today\u2019s habits\n/finance \u2014 Income vs expenses\n/invest \u2014 Portfolio summary\n\n\u26a0\ufe0f Open the <a href="${req.nextUrl.origin}/dashboard">Nexus Dashboard</a> to manage your data.`
        break

      case "/tasks": {
        if (!data?.tasks) {
          reply = `<b>\ud83c\udfaf Tasks</b>\n\nNo data available. Connect Telegram in the dashboard settings first.`
          break
        }
        const tasks = data.tasks
        const active = tasks.filter((t) => !t.completed)
        const done = tasks.filter((t) => t.completed)
        reply = `<b>\ud83c\udfaf Tasks</b>\nActive: ${active.length} | Done: ${done.length}\n\n`
        for (const t of active.slice(0, 10)) {
          const icon = t.priority === "high" ? "\ud83d\udd34" : t.priority === "medium" ? "\ud83d\udfe1" : "\ud83d\udfe2"
          reply += `${icon} ${escapeHtml(t.title)}`
          if (t.dueDate) reply += ` \u2014 ${t.dueDate}`
          if (t.project) reply += ` [${escapeHtml(t.project)}]`
          reply += "\n"
        }
        if (active.length > 10) reply += `...and ${active.length - 10} more\n`
        break
      }

      case "/habits": {
        if (!data?.habits) {
          reply = `<b>\u2764\ufe0f Habits</b>\n\nNo data available. Connect Telegram in the dashboard settings first.`
          break
        }
        const today = new Date().toISOString().split("T")[0]
        const habits = data.habits
        reply = "<b>\u2764\ufe0f Habits Today</b>\n"
        for (const h of habits.slice(0, 15)) {
          const doneToday = h.completedDates?.includes(today)
          const streak = h.streak || 0
          reply += `${doneToday ? "\u2705" : "\u2b1c"} ${escapeHtml(h.name)}`
          if (streak > 0) reply += ` \ud83d\udd25 ${streak}d`
          reply += "\n"
        }
        if (habits.length > 15) reply += `...and ${habits.length - 15} more\n`
        break
      }

      case "/finance": {
        const income = data?.incomes?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0
        const expense = data?.expenses?.reduce((s, e) => s + (e.amount || 0), 0) ?? 0
        const net = income - expense
        if (income === 0 && expense === 0) {
          reply = `<b>\ud83d\udcb0 Finance</b>\n\nNo data available. Connect Telegram in the dashboard settings first.`
        } else {
          const arrow = net >= 0 ? "\u2b06\ufe0f" : "\u2b07\ufe0f"
          reply = `<b>\ud83d\udcb0 Finance</b>\nIncome: \u20b9${income.toLocaleString("en-IN")}\nExpenses: \u20b9${expense.toLocaleString("en-IN")}\n${arrow} Net: \u20b9${Math.abs(net).toLocaleString("en-IN")}`
        }
        break
      }

      case "/invest": {
        const sipTotal = data?.sips?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0
        const stockInvested = data?.stocks?.reduce((s, i) => s + (i.invested || 0), 0) ?? 0
        const stockCurrent = data?.stocks?.reduce((s, i) => s + (i.currentValue || 0), 0) ?? 0
        const mfInvested = data?.mutualFunds?.reduce((s, i) => s + (i.invested || 0), 0) ?? 0
        const mfCurrent = data?.mutualFunds?.reduce((s, i) => s + (i.currentValue || 0), 0) ?? 0
        const totalInvested = stockInvested + mfInvested + sipTotal
        const totalCurrent = stockCurrent + mfCurrent
        if (totalInvested === 0 && sipTotal === 0) {
          reply = `<b>\ud83d\udc8e Investments</b>\n\nNo data available. Connect Telegram in the dashboard settings first.`
        } else {
          const gainPct = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested * 100).toFixed(1) : "0.0"
          const emoji = Number(gainPct) >= 0 ? "\ud83d\udcc8" : "\ud83d\udcc9"
          reply = `<b>\ud83d\udc8e Investments</b>\nSIPs: \u20b9${sipTotal.toLocaleString("en-IN")}/mo\nInvested: \u20b9${totalInvested.toLocaleString("en-IN")}\nCurrent: \u20b9${totalCurrent.toLocaleString("en-IN")}\n${emoji} ${Number(gainPct) >= 0 ? "+" : ""}${gainPct}%`
        }
        break
      }

      default:
        reply = `\ud83e\udd14 Unknown command: ${escapeHtml(text)}\n\nType /help to see available commands.`
    }

    if (reply) {
      await sendTelegramMessage(botToken, chatId, reply)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  const botToken = getBotToken()
  if (!botToken) {
    return NextResponse.json({ configured: false })
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const data = await res.json()
    return NextResponse.json({
      configured: true,
      webhook: data.result?.url || null,
      pending: data.result?.pending_update_count || 0,
    })
  } catch {
    return NextResponse.json({ configured: false })
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
