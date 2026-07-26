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

    const userId = await getUserIdForChatId(chatId)
    const data = userId ? await getUserData(userId) : null

    let reply = ""

    switch (text) {
      case "/start":
        reply = `<b>Welcome to Nexus Bot! \ud83d\ude80</b>\n\nI can send you live data and reminders.\n\n<b>Commands:</b>\n/tasks \u2014 Active tasks\n/habits \u2014 Today\u2019s habits\n/finance \u2014 Income vs expenses\n/invest \u2014 Portfolio summary\n/goals \u2014 Future goals\n/content \u2014 Content pipeline\n/bucket \u2014 Bucket list\n/today \u2014 Today\u2019s todos\n/star \u2014 North star\n\nReminders are sent automatically when tasks are due.`
        break

      case "/help":
        reply = `<b>Nexus Bot Commands</b>\n\n/tasks \u2014 View active tasks\n/habits \u2014 Today\u2019s habits\n/finance \u2014 Income vs expenses\n/invest \u2014 Portfolio summary\n/goals \u2014 Future goals\n/content \u2014 Content pipeline\n/bucket \u2014 Bucket list\n/today \u2014 Today\u2019s todos\n/star \u2014 North star\n\n\u26a0\ufe0f Open the <a href="${req.nextUrl.origin}/dashboard">Nexus Dashboard</a> to manage your data.`
        break

      case "/tasks": {
        if (!data?.tasks) {
          reply = noDataMsg("Tasks")
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
          reply = noDataMsg("Habits")
          break
        }
        const today = new Date().toISOString().split("T")[0]
        const habits = data.habits
        reply = "<b>\u2764\ufe0f Habits Today</b>\n"
        for (const h of habits.slice(0, 15)) {
          const doneToday = h.records?.some((r) => r.date === today && r.completed)
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
          reply = noDataMsg("Finance")
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
          reply = noDataMsg("Investments")
        } else {
          const gainPct = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested * 100).toFixed(1) : "0.0"
          const emoji = Number(gainPct) >= 0 ? "\ud83d\udcc8" : "\ud83d\udcc9"
          reply = `<b>\ud83d\udc8e Investments</b>\nSIPs: \u20b9${sipTotal.toLocaleString("en-IN")}/mo\nInvested: \u20b9${totalInvested.toLocaleString("en-IN")}\nCurrent: \u20b9${totalCurrent.toLocaleString("en-IN")}\n${emoji} ${Number(gainPct) >= 0 ? "+" : ""}${gainPct}%`
        }
        break
      }

      case "/goals": {
        if (!data?.futureGoals?.length) {
          reply = noDataMsg("Future Goals")
          break
        }
        const goals = data.futureGoals
        reply = "<b>\ud83c\udfaf Future Goals</b>\n\n"
        for (const g of goals.slice(0, 8)) {
          const pct = g.targetAmount > 0 ? Math.round((g.currentValue / g.targetAmount) * 100) : 0
          reply += `\ud83c\udfaf ${escapeHtml(g.title)}\n`
          reply += `   \u20b9${g.currentValue.toLocaleString("en-IN")} / \u20b9${g.targetAmount.toLocaleString("en-IN")} (${pct}%)\n`
          if (g.deadline) reply += `   \ud83d\udcc5 ${g.deadline}\n`
          reply += "\n"
        }
        if (goals.length > 8) reply += `...and ${goals.length - 8} more\n`
        break
      }

      case "/content": {
        if (!data?.contentItems?.length) {
          reply = noDataMsg("Content Pipeline")
          break
        }
        const items = data.contentItems
        const byStatus = {
          ideas: items.filter((i) => i.status === "ideas"),
          drafts: items.filter((i) => i.status === "drafts"),
          scheduled: items.filter((i) => i.status === "scheduled"),
          published: items.filter((i) => i.status === "published"),
        }
        reply = `<b>\ud83d\udcf1 Content Pipeline</b>\n`
        reply += `\ud83d\udca1 Ideas: ${byStatus.ideas.length} | \u270f\ufe0f Drafts: ${byStatus.drafts.length} | \ud83d\udcc5 Scheduled: ${byStatus.scheduled.length} | \u2705 Published: ${byStatus.published.length}\n\n`
        const active = items.filter((i) => i.status !== "published").slice(0, 8)
        for (const i of active) {
          const icon = i.status === "ideas" ? "\ud83d\udca1" : i.status === "drafts" ? "\u270f\ufe0f" : "\ud83d\udcc5"
          const subDone = i.subtasks?.filter((s) => s.completed).length ?? 0
          const subTotal = i.subtasks?.length ?? 0
          reply += `${icon} ${escapeHtml(i.title)}`
          if (i.deadline) reply += ` \u2014 ${i.deadline}`
          if (subTotal > 0) reply += ` (${subDone}/${subTotal})`
          reply += "\n"
        }
        if (active.length > 8) reply += `...and ${active.length - 8} more\n`
        break
      }

      case "/bucket": {
        if (!data?.bucketListItems?.length) {
          reply = noDataMsg("Bucket List")
          break
        }
        const items = data.bucketListItems
        const pending = items.filter((i) => !i.completed)
        const done = items.filter((i) => i.completed)
        reply = `<b>\ud83c\udfc6 Bucket List</b>\nPending: ${pending.length} | Done: ${done.length}\n\n`
        for (const i of pending.slice(0, 8)) {
          reply += `\u2b1c ${escapeHtml(i.title)}`
          if (i.expectedDate) reply += ` \u2014 ${i.expectedDate}`
          reply += "\n"
        }
        if (pending.length > 8) reply += `...and ${pending.length - 8} more\n`
        break
      }

      case "/today": {
        if (!data?.advanceTodos?.length) {
          reply = noDataMsg("Today's Todos")
          break
        }
        const today = new Date().toISOString().split("T")[0]
        const todayTodos = data.advanceTodos.filter((t) => t.date === today)
        if (todayTodos.length === 0) {
          reply = "<b>\ud83d\udcc5 Today's Todos</b>\nNo todos for today."
        } else {
          const done = todayTodos.filter((t) => t.completed).length
          reply = `<b>\ud83d\udcc5 Today's Todos</b> (${done}/${todayTodos.length})\n\n`
          for (const t of todayTodos) {
            reply += `${t.completed ? "\u2705" : "\u2b1c"} ${escapeHtml(t.title)}\n`
          }
        }
        break
      }

      case "/star": {
        const ns = data?.northStar
        if (!ns || (!ns.vision && !ns.mission && !ns.identity)) {
          reply = noDataMsg("North Star")
          break
        }
        reply = "<b>\u2b50 North Star</b>\n\n"
        if (ns.identity) reply += `<b>Identity:</b> ${escapeHtml(ns.identity)}\n`
        if (ns.vision) reply += `<b>Vision:</b> ${escapeHtml(ns.vision)}\n`
        if (ns.mission) reply += `<b>Mission:</b> ${escapeHtml(ns.mission)}\n`
        if (ns.pillars?.length) {
          reply += "\n<b>Pillars:</b>\n"
          for (const p of ns.pillars) {
            reply += `${p.icon} ${escapeHtml(p.title)}\n`
          }
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

function noDataMsg(section: string): string {
  return `<b>${section}</b>\n\nNo data available. Connect Telegram in the dashboard settings first.`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
