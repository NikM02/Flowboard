import { NextRequest, NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"
import { getUserIdForChatId, getUserData, saveUserData } from "@/lib/telegram-data"

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

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function parseArgs(text: string): { command: string; args: string } {
  const parts = text.split(" ")
  const command = parts[0]
  const args = parts.slice(1).join(" ").trim()
  return { command, args }
}

function parseParam(args: string, key: string): string | null {
  const regex = new RegExp(`${key}:\\s*([^|]+)`, "i")
  const match = args.match(regex)
  return match ? match[1].trim() : null
}

function stripParams(args: string): string {
  return args.replace(/\w+:[^|]+/g, "").replace(/\|/g, "").trim()
}

export async function POST(req: NextRequest) {
  try {
    const body: TelegramMessage = await req.json()
    const msg = body.message
    if (!msg?.text || !msg?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(msg.chat.id)
    const rawText = msg.text.trim()
    const text = rawText.toLowerCase()
    const botToken = getBotToken()

    if (!botToken) {
      return NextResponse.json({ ok: true })
    }

    const userId = await getUserIdForChatId(chatId)
    const data = userId ? await getUserData(userId) : null

    // ─── READ COMMANDS ───────────────────────────────────────────

    const readCommand = text.split(" ")[0]

    if (readCommand === "/start" || readCommand === "/help") {
      const reply = `<b>Nexus Bot Commands</b>

<b>\ud83d\udcdd Tasks</b>
/tasks — View tasks
/addtask &lt;title&gt; | priority:high | due:2026-07-30 | project:Work
/donetask &lt;number&gt; — Mark task done
/deltask &lt;number&gt; — Delete task

<b>\u2764\ufe0f Habits</b>
/habits — View today's habits
/habitdone &lt;number&gt; — Mark habit done today

<b>\ud83d\udcb0 Finance</b>
/finance — Income vs expenses
/addexpense &lt;amount&gt; &lt;category&gt; | desc:food
/addincome &lt;amount&gt; &lt;source&gt;

<b>\ud83d\udc8e Investments</b>
/invest — Portfolio summary

<b>\ud83c\udfaf Other</b>
/goals — Future goals
/content — Content pipeline
/bucket — Bucket list
/today — Today's todos
/addtodo &lt;title&gt; — Add today's todo
/donetodo &lt;number&gt; — Mark todo done
/star — North star`

      await sendTelegramMessage(botToken, chatId, reply)
      return NextResponse.json({ ok: true })
    }

    if (!userId || !data) {
      await sendTelegramMessage(botToken, chatId, "\u26a0\ufe0f Not connected. Open the Nexus app \u2192 click Telegram icon in header \u2192 connect first.")
      return NextResponse.json({ ok: true })
    }

    let reply = ""

    switch (readCommand) {
      // ─── READ ────────────────────────────────────────────

      case "/tasks": {
        const tasks = data.tasks ?? []
        const active = tasks.filter((t) => !t.completed)
        const done = tasks.filter((t) => t.completed)
        reply = `<b>\ud83c\udfaf Tasks</b>\nActive: ${active.length} | Done: ${done.length}\n\n`
        active.slice(0, 10).forEach((t, i) => {
          const icon = t.priority === "high" ? "\ud83d\udd34" : t.priority === "medium" ? "\ud83d\udfe1" : "\ud83d\udfe2"
          reply += `${i + 1}. ${icon} ${escapeHtml(t.title)}`
          if (t.dueDate) reply += ` \u2014 ${t.dueDate}`
          if (t.project) reply += ` [${escapeHtml(t.project)}]`
          reply += "\n"
        })
        if (active.length > 10) reply += `...and ${active.length - 10} more\n`
        break
      }

      case "/habits": {
        const today = todayKey()
        const habits = data.habits ?? []
        reply = "<b>\u2764\ufe0f Habits Today</b>\n"
        habits.slice(0, 15).forEach((h, i) => {
          const doneToday = h.records?.some((r) => r.date === today && r.completed)
          const streak = h.streak || 0
          reply += `${i + 1}. ${doneToday ? "\u2705" : "\u2b1c"} ${escapeHtml(h.name)}`
          if (streak > 0) reply += ` \ud83d\udd25 ${streak}d`
          reply += "\n"
        })
        if (habits.length > 15) reply += `...and ${habits.length - 15} more\n`
        break
      }

      case "/finance": {
        const income = (data.incomes ?? []).reduce((s, i) => s + (i.amount || 0), 0)
        const expense = (data.expenses ?? []).reduce((s, e) => s + (e.amount || 0), 0)
        const net = income - expense
        if (income === 0 && expense === 0) {
          reply = "<b>\ud83d\udcb0 Finance</b>\n\nNo data yet. Use /addexpense or /addincome to start."
        } else {
          const arrow = net >= 0 ? "\u2b06\ufe0f" : "\u2b07\ufe0f"
          reply = `<b>\ud83d\udcb0 Finance</b>\nIncome: \u20b9${income.toLocaleString("en-IN")}\nExpenses: \u20b9${expense.toLocaleString("en-IN")}\n${arrow} Net: \u20b9${Math.abs(net).toLocaleString("en-IN")}`
        }
        break
      }

      case "/invest": {
        const sipTotal = (data.sips ?? []).reduce((s, i) => s + (i.amount || 0), 0)
        const stockInv = (data.stocks ?? []).reduce((s, i) => s + (i.invested || 0), 0)
        const stockCur = (data.stocks ?? []).reduce((s, i) => s + (i.currentValue || 0), 0)
        const mfInv = (data.mutualFunds ?? []).reduce((s, i) => s + (i.invested || 0), 0)
        const mfCur = (data.mutualFunds ?? []).reduce((s, i) => s + (i.currentValue || 0), 0)
        const totalInv = stockInv + mfInv + sipTotal
        const totalCur = stockCur + mfCur
        if (totalInv === 0 && sipTotal === 0) {
          reply = "<b>\ud83d\udc8e Investments</b>\n\nNo data yet."
        } else {
          const pct = totalInv > 0 ? ((totalCur - totalInv) / totalInv * 100).toFixed(1) : "0.0"
          const emoji = Number(pct) >= 0 ? "\ud83d\udcc8" : "\ud83d\udcc9"
          reply = `<b>\ud83d\udc8e Investments</b>\nSIPs: \u20b9${sipTotal.toLocaleString("en-IN")}/mo\nInvested: \u20b9${totalInv.toLocaleString("en-IN")}\nCurrent: \u20b9${totalCur.toLocaleString("en-IN")}\n${emoji} ${Number(pct) >= 0 ? "+" : ""}${pct}%`
        }
        break
      }

      case "/goals": {
        const goals = data.futureGoals ?? []
        if (!goals.length) { reply = "<b>\ud83c\udfaf Future Goals</b>\n\nNo goals yet."; break }
        reply = "<b>\ud83c\udfaf Future Goals</b>\n\n"
        goals.slice(0, 8).forEach((g) => {
          const pct = g.targetAmount > 0 ? Math.round((g.currentValue / g.targetAmount) * 100) : 0
          reply += `\ud83c\udfaf ${escapeHtml(g.title)}\n   \u20b9${g.currentValue.toLocaleString("en-IN")} / \u20b9${g.targetAmount.toLocaleString("en-IN")} (${pct}%)\n`
          if (g.deadline) reply += `   \ud83d\udcc5 ${g.deadline}\n`
          reply += "\n"
        })
        break
      }

      case "/content": {
        const items = data.contentItems ?? []
        if (!items.length) { reply = "<b>\ud83d\udcf1 Content Pipeline</b>\n\nNo content yet."; break }
        const byStatus = { ideas: items.filter((i) => i.status === "ideas").length, drafts: items.filter((i) => i.status === "drafts").length, scheduled: items.filter((i) => i.status === "scheduled").length, published: items.filter((i) => i.status === "published").length }
        reply = `<b>\ud83d\udcf1 Content Pipeline</b>\n\ud83d\udca1 ${byStatus.ideas} | \u270f\ufe0f ${byStatus.drafts} | \ud83d\udcc5 ${byStatus.scheduled} | \u2705 ${byStatus.published}\n\n`
        items.filter((i) => i.status !== "published").slice(0, 8).forEach((i) => {
          const icon = i.status === "ideas" ? "\ud83d\udca1" : i.status === "drafts" ? "\u270f\ufe0f" : "\ud83d\udcc5"
          reply += `${icon} ${escapeHtml(i.title)}`
          if (i.deadline) reply += ` \u2014 ${i.deadline}`
          reply += "\n"
        })
        break
      }

      case "/bucket": {
        const items = data.bucketListItems ?? []
        const pending = items.filter((i) => !i.completed)
        if (!pending.length) { reply = "<b>\ud83c\udfc6 Bucket List</b>\n\nAll done or empty!"; break }
        reply = `<b>\ud83c\udfc6 Bucket List</b> (${pending.length} pending)\n\n`
        pending.slice(0, 8).forEach((i) => {
          reply += `\u2b1c ${escapeHtml(i.title)}`
          if (i.expectedDate) reply += ` \u2014 ${i.expectedDate}`
          reply += "\n"
        })
        break
      }

      case "/today": {
        const today = todayKey()
        const todos = (data.advanceTodos ?? []).filter((t) => t.date === today)
        if (!todos.length) { reply = "<b>\ud83d\udcc5 Today</b>\n\nNo todos for today."; break }
        const done = todos.filter((t) => t.completed).length
        reply = `<b>\ud83d\udcc5 Today</b> (${done}/${todos.length})\n\n`
        todos.forEach((t, i) => { reply += `${i + 1}. ${t.completed ? "\u2705" : "\u2b1c"} ${escapeHtml(t.title)}\n` })
        break
      }

      case "/star": {
        const ns = data.northStar
        if (!ns || (!ns.vision && !ns.mission && !ns.identity)) { reply = "<b>\u2b50 North Star</b>\n\nNot set yet."; break }
        reply = "<b>\u2b50 North Star</b>\n\n"
        if (ns.identity) reply += `<b>Identity:</b> ${escapeHtml(ns.identity)}\n`
        if (ns.vision) reply += `<b>Vision:</b> ${escapeHtml(ns.vision)}\n`
        if (ns.mission) reply += `<b>Mission:</b> ${escapeHtml(ns.mission)}\n`
        if (ns.pillars?.length) {
          reply += "\n<b>Pillars:</b>\n"
          ns.pillars.forEach((p) => { reply += `${p.icon} ${escapeHtml(p.title)}\n` })
        }
        break
      }

      // ─── WRITE: TASKS ────────────────────────────────────

      case "/addtask": {
        const { args } = parseArgs(rawText)
        if (!args) { reply = "Usage: /addtask &lt;title&gt; | priority:high | due:2026-07-30 | project:Work"; break }
        const title = stripParams(args) || args
        const priority = parseParam(args, "priority") as "high" | "medium" | "low" || "medium"
        const dueDate = parseParam(args, "due") || ""
        const project = parseParam(args, "project") || ""
        const tasks = data.tasks ?? []
        tasks.unshift({ id: genId(), title, description: "", completed: false, priority, dueDate, project, reminder: "", createdAt: Date.now() })
        await saveUserData(userId, { ...data, tasks })
        reply = `<b>\u2705 Task added:</b> ${escapeHtml(title)}`
        if (dueDate) reply += `\n\ud83d\udcc5 Due: ${dueDate}`
        if (project) reply += `\n\ud83d\udcc2 Project: ${escapeHtml(project)}`
        break
      }

      case "/donetask": {
        const { args } = parseArgs(rawText)
        const num = parseInt(args)
        const tasks = data.tasks ?? []
        const active = tasks.filter((t) => !t.completed)
        if (!num || num < 1 || num > active.length) { reply = `Pick a number 1\u2013${active.length}. Use /tasks first.`; break }
        const task = active[num - 1]
        const idx = tasks.findIndex((t) => t.id === task.id)
        tasks[idx].completed = true
        await saveUserData(userId, { ...data, tasks })
        reply = `<b>\u2705 Done:</b> ${escapeHtml(task.title)}`
        break
      }

      case "/deltask": {
        const { args } = parseArgs(rawText)
        const num = parseInt(args)
        const tasks = data.tasks ?? []
        const active = tasks.filter((t) => !t.completed)
        if (!num || num < 1 || num > active.length) { reply = `Pick a number 1\u2013${active.length}. Use /tasks first.`; break }
        const task = active[num - 1]
        const updated = tasks.filter((t) => t.id !== task.id)
        await saveUserData(userId, { ...data, tasks: updated })
        reply = `<b>\ud83d\udccc Deleted:</b> ${escapeHtml(task.title)}`
        break
      }

      // ─── WRITE: HABITS ───────────────────────────────────

      case "/habitdone": {
        const { args } = parseArgs(rawText)
        const num = parseInt(args)
        const habits = data.habits ?? []
        if (!num || num < 1 || num > habits.length) { reply = `Pick a number 1\u2013${habits.length}. Use /habits first.`; break }
        const habit = habits[num - 1]
        const today = todayKey()
        const idx = habits.findIndex((h) => h.id === habit.id)
        if (!habits[idx].records) habits[idx].records = []
        const existing = habits[idx].records!.find((r) => r.date === today)
        if (existing) {
          existing.completed = true
        } else {
          habits[idx].records!.push({ date: today, completed: true })
        }
        await saveUserData(userId, { ...data, habits })
        reply = `<b>\u2705 Habit done:</b> ${escapeHtml(habit.name)}`
        break
      }

      // ─── WRITE: FINANCE ──────────────────────────────────

      case "/addexpense": {
        const { args } = parseArgs(rawText)
        if (!args) { reply = "Usage: /addexpense &lt;amount&gt; &lt;category&gt; | desc:note"; break }
        const desc = parseParam(args, "desc") || ""
        const cleaned = args.replace(/desc:[^|]+/g, "").replace(/\|/g, "").trim()
        const match = cleaned.match(/^(\d+(?:\.\d+)?)\s+(.+)/)
        if (!match) { reply = "Usage: /addexpense 500 food | desc:lunch"; break }
        const amount = parseFloat(match[1])
        const category = match[2]
        const expenses = data.expenses ?? []
        expenses.unshift({ id: genId(), amount, category, date: todayKey(), description: desc })
        await saveUserData(userId, { ...data, expenses })
        reply = `<b>\u2705 Expense added:</b> \u20b9${amount.toLocaleString("en-IN")} \u2014 ${escapeHtml(category)}`
        break
      }

      case "/addincome": {
        const { args } = parseArgs(rawText)
        if (!args) { reply = "Usage: /addincome &lt;amount&gt; &lt;source&gt;"; break }
        const match = args.match(/^(\d+(?:\.\d+)?)\s+(.+)/)
        if (!match) { reply = "Usage: /addincome 50000 salary"; break }
        const amount = parseFloat(match[1])
        const source = match[2]
        const incomes = data.incomes ?? []
        incomes.unshift({ id: genId(), amount, source, date: todayKey() })
        await saveUserData(userId, { ...data, incomes })
        reply = `<b>\u2705 Income added:</b> \u20b9${amount.toLocaleString("en-IN")} \u2014 ${escapeHtml(source)}`
        break
      }

      // ─── WRITE: ADVANCE TODOS ────────────────────────────

      case "/addtodo": {
        const { args } = parseArgs(rawText)
        if (!args) { reply = "Usage: /addtodo &lt;title&gt;"; break }
        const todos = data.advanceTodos ?? []
        todos.unshift({ id: genId(), title: args, completed: false, date: todayKey(), createdAt: Date.now() })
        await saveUserData(userId, { ...data, advanceTodos: todos })
        reply = `<b>\u2705 Todo added:</b> ${escapeHtml(args)}`
        break
      }

      case "/donetodo": {
        const { args } = parseArgs(rawText)
        const num = parseInt(args)
        const today = todayKey()
        const todos = data.advanceTodos ?? []
        const todayTodos = todos.filter((t) => t.date === today && !t.completed)
        if (!num || num < 1 || num > todayTodos.length) { reply = `Pick a number 1\u2013${todayTodos.length}. Use /today first.`; break }
        const todo = todayTodos[num - 1]
        const idx = todos.findIndex((t) => t.id === todo.id)
        todos[idx].completed = true
        await saveUserData(userId, { ...data, advanceTodos: todos })
        reply = `<b>\u2705 Done:</b> ${escapeHtml(todo.title)}`
        break
      }

      // ─── UNKNOWN ─────────────────────────────────────────

      default:
        reply = `\ud83e\udd14 Unknown command.\n\nType /help to see all commands.`
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
