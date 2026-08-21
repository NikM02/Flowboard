const TELEGRAM_API = "https://api.telegram.org"

export type InlineButton = { text: string; url?: string; callback_data?: string }
export type InlineKeyboard = InlineButton[][]

type ReplyMarkup =
  | InlineKeyboard
  | { force_reply: boolean; input_field_placeholder?: string }
  | { [key: string]: unknown }

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: "HTML" | "Markdown" = "HTML",
  replyMarkup?: ReplyMarkup
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    })
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

export async function answerCallbackQuery(botToken: string, callbackQueryId: string, text?: string): Promise<boolean> {
  try {
    await fetch(`${TELEGRAM_API}/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, ...(text ? { text } : {}) }),
    })
    return true
  } catch {
    return false
  }
}

export async function editMessageText(
  botToken: string,
  chatId: string,
  messageId: number,
  text: string
): Promise<boolean> {
  try {
    await fetch(`${TELEGRAM_API}/bot${botToken}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
      }),
    })
    return true
  } catch {
    return false
  }
}

export async function setBotCommands(botToken: string): Promise<boolean> {
  try {
    const commands = [
      { command: "menu", description: "Open any page of the app" },
      { command: "tasks", description: "View active tasks" },
      { command: "addtask", description: "Create a task (guided)" },
      { command: "habits", description: "Today's habits" },
      { command: "addhabit", description: "Create a habit" },
      { command: "finance", description: "Income vs expenses" },
      { command: "addexpense", description: "Log an expense (guided)" },
      { command: "addincome", description: "Log income (guided)" },
      { command: "invest", description: "Portfolio summary" },
      { command: "goals", description: "Future goals" },
      { command: "content", description: "Content pipeline" },
      { command: "bucket", description: "Bucket list" },
      { command: "skills", description: "Skill progress" },
      { command: "today", description: "Today's todos" },
      { command: "help", description: "All commands" },
    ]
    await fetch(`${TELEGRAM_API}/bot${botToken}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands }),
    })
    return true
  } catch {
    return false
  }
}

export async function verifyBotToken(
  botToken: string
): Promise<{ valid: boolean; botName?: string }> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/getMe`)
    const data = await res.json()
    if (data.ok) {
      return { valid: true, botName: data.result.first_name }
    }
    return { valid: false }
  } catch {
    return { valid: false }
  }
}

export async function setWebhook(
  botToken: string,
  webhookUrl: string
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    })
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

export async function deleteWebhook(botToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/deleteWebhook`)
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

export function formatTaskMessage(title: string, description: string, dueDate?: string): string {
  let msg = `<b>\u26a0\ufe0f Reminder: ${escapeHtml(title)}</b>\n`
  if (description) msg += `${escapeHtml(description)}\n`
  if (dueDate) msg += `\ud83d\udcc5 Due: ${dueDate}`
  return msg
}

export function formatDueSoonMessage(title: string): string {
  return `<b>\ud83d\udd3a Due soon: ${escapeHtml(title)}</b>\nDue in less than an hour!`
}

export function formatTaskSummary(tasks: { title: string; completed: boolean; priority: string; dueDate: string }[]): string {
  if (tasks.length === 0) return "<b>\ud83c\udfaf Tasks</b>\nNo tasks yet."
  const active = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)
  let msg = `<b>\ud83c\udfaf Tasks</b>\n`
  msg += `Active: ${active.length} | Done: ${done.length}\n\n`
  for (const t of active.slice(0, 10)) {
    const icon = t.priority === "high" ? "\ud83d\udd34" : t.priority === "medium" ? "\ud83d\udfe1" : "\ud83d\udfe2"
    msg += `${icon} ${escapeHtml(t.title)}`
    if (t.dueDate) msg += ` \u2014 ${t.dueDate}`
    msg += "\n"
  }
  if (active.length > 10) msg += `...and ${active.length - 10} more\n`
  return msg
}

export function formatHabitSummary(habits: { name: string; done: boolean; streak: number }[]): string {
  if (habits.length === 0) return "<b>\u2764\ufe0f Habits</b>\nNo habits yet."
  let msg = "<b>\u2764\ufe0f Habits Today</b>\n"
  for (const h of habits) {
    msg += `${h.done ? "\u2705" : "\u2b1c"} ${escapeHtml(h.name)}`
    if (h.streak > 0) msg += ` \ud83d\udd25 ${h.streak}d`
    msg += "\n"
  }
  return msg
}

export function formatFinanceSummary(income: number, expense: number, net: number): string {
  const arrow = net >= 0 ? "\u2b06\ufe0f" : "\u2b07\ufe0f"
  return `<b>\ud83d\udcb0 Finance</b>\nIncome: \u20b9${income.toLocaleString("en-IN")}\nExpenses: \u20b9${expense.toLocaleString("en-IN")}\n${arrow} Net: \u20b9${Math.abs(net).toLocaleString("en-IN")}`
}

export function formatInvestmentSummary(totalInvested: number, totalCurrent: number, gainPct: number): string {
  const emoji = gainPct >= 0 ? "\ud83d\udcc8" : "\ud83d\udcc9"
  return `<b>\ud83d\udc8e Investments</b>\nInvested: \u20b9${totalInvested.toLocaleString("en-IN")}\nCurrent: \u20b9${totalCurrent.toLocaleString("en-IN")}\n${emoji} ${gainPct >= 0 ? "+" : ""}${gainPct}%`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
