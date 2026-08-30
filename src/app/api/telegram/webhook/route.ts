import { NextRequest, NextResponse } from "next/server"
import {
  sendTelegramMessage,
  answerCallbackQuery,
  editMessageText,
  setBotCommands,
  type InlineKeyboard,
} from "@/lib/telegram"
import { getUserIdForChatId, getUserData, saveUserData } from "@/lib/telegram-data"
import { createServiceClient } from "@/lib/supabase/service"

type UserData = NonNullable<Awaited<ReturnType<typeof getUserData>>>

interface TelegramMessage {
  message?: {
    chat: { id: number }
    text?: string
    from?: { first_name: string }
    reply_to_message?: { text?: string }
  }
  callback_query?: {
    id: string
    data?: string
    message?: { chat: { id: number }; message_id: number }
  }
}

const EXPENSE_CATEGORIES = ["food", "transport", "housing", "utilities", "entertainment", "healthcare", "shopping", "education", "other"]
const INCOME_SOURCES = ["job", "youtube", "digital", "website", "freelance", "other"]
const MARK = "\u2063" // invisible separator — hides step markers inside prompts

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

function monthKey(): string {
  return todayKey().slice(0, 7)
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function inr(n: number): string {
  return `₹${(n || 0).toLocaleString("en-IN")}`
}

function appUrl(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "")
}

function menuKeyboard(req: NextRequest): InlineKeyboard {
  const base = appUrl(req)
  const b = (text: string, path: string) => ({ text, url: `${base}${path}` })
  return [
    [b("📋 Dashboard", "/dashboard"), b("✅ Tasks", "/tasks")],
    [b("❤️ Health", "/habits"), b("⭐ North Star", "/north-star"), b("🔮 Future Self", "/future")],
    [b("💰 Finance", "/finance"), b("📈 Investments", "/investments")],
    [b("🎓 Skills", "/skills"), b("🏆 Bucket List", "/skills/bucket-list"), b("📱 Content Hub", "/content-hub")],
  ]
}

function pick<T>(list: T[], raw: string): T | null {
  const n = parseInt(raw)
  if (!n || n < 1 || n > list.length) return null
  return list[n - 1]
}

function needNum(count: number, listCmd: string): string {
  return `Pick a number 1–${count}. Use ${listCmd} first.`
}

// ════════════════════════════════════════════════════════════════
// WIZARD ENGINE — guided, tap-friendly input flows
// ════════════════════════════════════════════════════════════════

type WizOption = { label: string; value: string }

type WizStep = {
  key: string
  question: string
  placeholder?: string
  mode?: "text" | "buttons"
  options?: WizOption[][] // rows × options for button steps
  optional?: boolean
  validate?: (v: string) => string | null // returns error text or null if OK
  format?: (v: string) => string // pretty value for summaries
}

type WizDef = {
  emoji: string
  title: string
  steps: WizStep[]
  build: (c: Record<string, string>) => Partial<UserData>
  summary: (c: Record<string, string>) => string
}

const vNonEmpty: WizStep["validate"] = (v) => (v.trim() ? null : "Please send some text.")
const vAmount: WizStep["validate"] = (v) => {
  const n = parseFloat(v.replace(/[₹,\s]/g, ""))
  if (isNaN(n) || n <= 0) return "Send a number greater than 0, e.g. 500"
  return null
}
const vPositive = vAmount
const vDate: WizStep["validate"] = (v) =>
  (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v).getTime()) ? null : "Use the YYYY-MM-DD format, e.g. 2026-09-01")
const vTime: WizStep["validate"] = (v) =>
  (/^([01]?\d|2[0-3]):[0-5]\d$/.test(v) ? null : "Use HH:mm (24h), e.g. 23:00")

function num(v: string): number {
  return parseFloat(v.replace(/[₹,\s]/g, ""))
}

const optRow = (...values: string[]): WizOption[][] =>
  values.map((value) => [{ label: value.charAt(0).toUpperCase() + value.slice(1), value }])

const WIZARDS: Record<string, WizDef> = {
  task: {
    emoji: "📝",
    title: "New Task",
    steps: [
      { key: "title", question: "What needs to be done?", placeholder: "e.g. Buy groceries", validate: vNonEmpty },
      {
        key: "priority",
        question: "How urgent is it?",
        mode: "buttons",
        options: [[
          { label: "🔴 High", value: "high" },
          { label: "🟡 Medium", value: "medium" },
          { label: "🟢 Low", value: "low" },
        ]],
      },
      { key: "dueDate", question: "📅 Due date?", placeholder: "YYYY-MM-DD — or skip", mode: "text", optional: true, validate: vDate },
      { key: "project", question: "📂 Project?", placeholder: "Project name — or skip", mode: "text", optional: true },
    ],
    build: (c) => ({
      tasks: [
        {
          id: genId(),
          title: c.title,
          description: "",
          completed: false,
          priority: (c.priority || "medium") as "high" | "medium" | "low",
          dueDate: c.dueDate || "",
          project: c.project || "",
          reminder: "",
          createdAt: Date.now(),
        },
      ],
    }),
    summary: (c) =>
      `<b>${escapeHtml(c.title)}</b>\nPriority: ${c.priority}\n${c.dueDate ? `📅 ${c.dueDate}\n` : ""}${c.project ? `📂 ${escapeHtml(c.project)}` : ""}`,
  },

  expense: {
    emoji: "💸",
    title: "Log Expense",
    steps: [
      { key: "amount", question: "How much did you spend?", placeholder: "e.g. 250", validate: vAmount },
      {
        key: "category",
        question: "Pick a category:",
        mode: "buttons",
        options: [
          EXPENSE_CATEGORIES.slice(0, 3).map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
          EXPENSE_CATEGORIES.slice(3, 6).map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
          EXPENSE_CATEGORIES.slice(6).map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
        ],
      },
      { key: "description", question: "Any note?", placeholder: "e.g. lunch with team — or skip", mode: "text", optional: true },
    ],
    build: (c) => ({
      expenses: [
        { id: genId(), amount: num(c.amount), category: c.category as any, date: todayKey(), description: c.description || "" },
      ],
    }),
    summary: (c) => `<b>${inr(num(c.amount))}</b> — ${c.category}${c.description ? `\n📝 ${escapeHtml(c.description)}` : ""}`,
  },

  income: {
    emoji: "💵",
    title: "Log Income",
    steps: [
      { key: "amount", question: "How much came in?", placeholder: "e.g. 50000", validate: vAmount },
      {
        key: "source",
        question: "Where from?",
        mode: "buttons",
        options: [
          INCOME_SOURCES.slice(0, 3).map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
          INCOME_SOURCES.slice(3).map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
        ],
      },
      { key: "description", question: "Any note?", placeholder: "e.g. July salary — or skip", mode: "text", optional: true },
    ],
    build: (c) => ({
      incomes: [{ id: genId(), amount: num(c.amount), source: c.source as any, date: todayKey(), description: c.description || "" }],
    }),
    summary: (c) => `<b>${inr(num(c.amount))}</b> from ${c.source}${c.description ? `\n📝 ${escapeHtml(c.description)}` : ""}`,
  },

  habit: {
    emoji: "❤️",
    title: "New Habit",
    steps: [{ key: "name", question: "What habit do you want to build?", placeholder: "e.g. Morning run", validate: vNonEmpty }],
    build: (c) => ({ habits: [{ id: genId(), name: c.name, records: [], streak: 0 }] }),
    summary: (c) => `<b>${escapeHtml(c.name)}</b>`,
  },

  goal: {
    emoji: "🔮",
    title: "New Goal",
    steps: [
      { key: "title", question: "What's the goal?", placeholder: "e.g. Read books", validate: vNonEmpty },
      { key: "targetValue", question: "🎯 Target value?", placeholder: "e.g. 24", validate: vPositive },
      { key: "currentValue", question: "📊 Current progress value?", placeholder: "e.g. 5 — or 0", mode: "text", optional: true, validate: (v) => (isNaN(parseFloat(v)) ? "Send a number (0 is fine)." : null) },
    ],
    build: (c) => ({
      futureGoals: [
        {
          id: genId(),
          title: c.title,
          category: "tasks" as const,
          targetValue: num(c.targetValue),
          currentValue: c.currentValue ? num(c.currentValue) : 0,
          period: "monthly" as const,
          periodKey: monthKey(),
          completed: false,
        },
      ],
    }),
    summary: (c) => `<b>${escapeHtml(c.title)}</b>\n${c.currentValue || 0}/${num(c.targetValue)} progress`,
  },

  bucket: {
    emoji: "🏆",
    title: "Bucket List Item",
    steps: [
      { key: "title", question: "What do you want to experience?", placeholder: "e.g. Skydiving in Dubai", validate: vNonEmpty },
      { key: "expectedDate", question: "📅 Target date?", placeholder: "YYYY-MM-DD — or skip", mode: "text", optional: true, validate: vDate },
    ],
    build: (c) => ({
      bucketListItems: [{ id: genId(), title: c.title, description: "", expectedDate: c.expectedDate || "", timeframe: "", completed: false }],
    }),
    summary: (c) => `<b>${escapeHtml(c.title)}</b>${c.expectedDate ? `\n📅 ${c.expectedDate}` : ""}`,
  },

  content: {
    emoji: "📱",
    title: "Content Idea",
    steps: [{ key: "title", question: "What's the idea?", placeholder: "e.g. My morning routine video", validate: vNonEmpty }],
    build: (c) => ({
      contentItems: [{ id: genId(), emoji: "💡", title: c.title, description: "", deadline: "", status: "ideas" as const, subtasks: [] }],
    }),
    summary: (c) => `<b>${escapeHtml(c.title)}</b> — added to 💡 Ideas`,
  },

  sip: {
    emoji: "🔁",
    title: "New SIP",
    steps: [
      { key: "name", question: "SIP name?", placeholder: "e.g. Nifty Index Fund", validate: vNonEmpty },
      { key: "amount", question: "💰 Amount per installment?", placeholder: "e.g. 5000", validate: vAmount },
      {
        key: "frequency",
        question: "How often?",
        mode: "buttons",
        options: [[{ label: "Monthly", value: "monthly" }, { label: "Quarterly", value: "quarterly" }]],
      },
    ],
    build: (c) => ({
      sips: [{ id: genId(), name: c.name, amount: num(c.amount), frequency: c.frequency as any, startDate: todayKey(), endDate: null, expectedReturn: 0, investedAmount: 0, currentValue: 0 }],
    }),
    summary: (c) => `<b>${escapeHtml(c.name)}</b>\n${inr(num(c.amount))}/${c.frequency}`,
  },

  stock: {
    emoji: "📊",
    title: "Add Stock",
    steps: [
      { key: "name", question: "Stock name?", placeholder: "e.g. RELIANCE", validate: vNonEmpty },
      { key: "quantity", question: "How many units/shares?", placeholder: "e.g. 10", validate: vPositive },
      { key: "buyPrice", question: "💰 Buy price per share?", placeholder: "e.g. 2500", validate: vPositive },
      { key: "currentPrice", question: "📈 Current price?", placeholder: "e.g. 2600 — or same as buy", mode: "text", optional: true, validate: (v) => (isNaN(parseFloat(v)) ? "Send a number." : null) },
    ],
    build: (c) => ({
      stocks: [{
        id: genId(),
        name: c.name,
        ticker: c.name.toUpperCase().replace(/\s+/g, "").slice(0, 8),
        quantity: num(c.quantity),
        buyPrice: num(c.buyPrice),
        currentPrice: c.currentPrice ? num(c.currentPrice) : num(c.buyPrice),
        sector: "",
      }],
    }),
    summary: (c) => `<b>${escapeHtml(c.name)}</b> ×${c.quantity} @ ₹${c.buyPrice}\nValue: ${inr(num(c.quantity) * (c.currentPrice ? num(c.currentPrice) : num(c.buyPrice)))}`,
  },

  fund: {
    emoji: "🏦",
    title: "Add Mutual Fund",
    steps: [
      { key: "name", question: "Fund name?", placeholder: "e.g. PPFAS Flexi Cap", validate: vNonEmpty },
      { key: "units", question: "How many units?", placeholder: "e.g. 100", validate: vPositive },
      { key: "nav", question: "💵 NAV (price per unit)?", placeholder: "e.g. 85.5", validate: vPositive },
    ],
    build: (c) => ({
      mutualFunds: [{ id: genId(), name: c.name, fundHouse: "", nav: num(c.nav), units: num(c.units), investedAmount: num(c.nav) * num(c.units), currentValue: num(c.nav) * num(c.units) }],
    }),
    summary: (c) => `<b>${escapeHtml(c.name)}</b>\n${c.units} units @ ₹${c.nav} = ${inr(num(c.nav) * num(c.units))}`,
  },

  challenge: {
    emoji: "🏅",
    title: "Start Challenge",
    steps: [
      { key: "title", question: "Challenge name?", placeholder: "e.g. No sugar", validate: vNonEmpty },
      {
        key: "type",
        question: "How long?",
        mode: "buttons",
        options: [[{ label: "21 days", value: "21" }, { label: "30 days", value: "30" }, { label: "90 days", value: "90" }]],
      },
    ],
    build: (c) => {
      const start = new Date()
      const total = parseInt(c.type)
      const days = Array.from({ length: total }, (_, i) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        return { day: i + 1, date: d.toISOString().slice(0, 10), completed: false, note: "" }
      })
      const end = new Date(start)
      end.setDate(end.getDate() + total - 1)
      return {
        challenges: [{
          id: genId(),
          title: c.title,
          description: "",
          type: c.type as any,
          days,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          joined: true,
          createdAt: Date.now(),
        }],
      }
    },
    summary: (c) => `<b>${escapeHtml(c.title)}</b> — ${c.type} days 🔥`,
  },

  budget: {
    emoji: "🧮",
    title: "Set Budget",
    steps: [
      {
        key: "category",
        question: "Which category?",
        mode: "buttons",
        options: [
          EXPENSE_CATEGORIES.slice(0, 3).map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
          EXPENSE_CATEGORIES.slice(3, 6).map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
          EXPENSE_CATEGORIES.slice(6).map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
        ],
      },
      { key: "limit", question: "💰 Monthly limit?", placeholder: "e.g. 5000", validate: vAmount },
    ],
    build: () => ({}), // handled specially below
    summary: (c) => `<b>${c.category}</b> — ${inr(num(c.limit))}/month`,
  },

  sleeplog: {
    emoji: "🌙",
    title: "Log Sleep",
    steps: [
      { key: "bedtime", question: "😴 When did you go to bed?", placeholder: "HH:mm — e.g. 23:00", validate: vTime },
      { key: "wakeTime", question: "⏰ When did you wake up?", placeholder: "HH:mm — e.g. 06:30", validate: vTime },
      {
        key: "quality",
        question: "Rate the quality:",
        mode: "buttons",
        options: [[
          { label: "★☆☆☆☆", value: "1" },
          { label: "★★☆☆☆", value: "2" },
          { label: "★★★☆☆", value: "3" },
          { label: "★★★★☆", value: "4" },
          { label: "★★★★★", value: "5" },
        ]],
      },
    ],
    build: (c) => {
      const [bh, bm] = c.bedtime.split(":").map(Number)
      const [wh, wm] = c.wakeTime.split(":").map(Number)
      let minutes = wh * 60 + wm - (bh * 60 + bm)
      if (minutes < 0) minutes += 24 * 60
      const hours = Math.round((minutes / 60) * 10) / 10
      return { sleepEntries: [{ id: genId(), date: todayKey(), bedtime: c.bedtime, wakeTime: c.wakeTime, hours, quality: parseInt(c.quality) || 3, notes: "" }] }
    },
    summary: (c) => `<b>${c.bedtime} → ${c.wakeTime}</b> · quality ${"★".repeat(parseInt(c.quality))}`,
  },
}

// ── wizard persistence (isolated rows the app sync never touches) ──

type WizardState = { type: string; step: number; collected: Record<string, string> }
const wizRowId = (chatId: string) => `__tgwiz_${chatId}`

async function getWizard(chatId: string): Promise<WizardState | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from("user_data").select("data").eq("user_id", wizRowId(chatId)).single()
  return (data?.data as WizardState | undefined) ?? null
}

async function saveWizard(chatId: string, ws: WizardState | null): Promise<void> {
  const supabase = createServiceClient()
  if (!ws) {
    await supabase.from("user_data").delete().eq("user_id", wizRowId(chatId))
    return
  }
  await supabase.from("user_data").upsert(
    { user_id: wizRowId(chatId), data: ws as any, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )
}

// ── prompt rendering ─────────────────────────────────────────────

function renderPrompt(def: WizDef, stepIdx: number, collected: Record<string, string>): string {
  const step = def.steps[stepIdx]
  const dots = def.steps.map((_, i) => (i < stepIdx ? "●" : i === stepIdx ? "◉" : "○")).join("")
  let msg = `${def.emoji} <b>${def.title}</b>\n<code>${dots}</code>  Step ${stepIdx + 1} of ${def.steps.length}\n\n`
  const doneLines = def.steps
    .slice(0, stepIdx)
    .map((s) => {
      const val = collected[s.key] ?? ""
      const shown = s.format ? s.format(val) : val.length > 24 ? val.slice(0, 24) + "…" : val
      return `✅ <i>${escapeHtml(s.question.replace(/[?]/g, ""))}: <b>${escapeHtml(shown)}</b></i>`
    })
  if (doneLines.length) msg += doneLines.join("\n") + "\n\n"
  msg += `<b>${escapeHtml(step.question)}</b>`
  return msg
}

function forceReplyMarkup(step: WizStep) {
  return { force_reply: true, input_field_placeholder: step.placeholder || "Type here…" }
}

function buttonMarkup(type: string, stepIdx: number, step: WizStep): InlineKeyboard {
  const rows = (step.options ?? []).map((row) =>
    row.map((o) => ({ text: o.label, callback_data: `c·${type}·${stepIdx}·${o.value}` }))
  )
  if (step.optional) rows.push([{ text: "⏭ Skip", callback_data: `c·${type}·${stepIdx}·__skip__` }])
  return rows
}

async function sendStep(
  botToken: string,
  chatId: string,
  type: string,
  stepIdx: number,
  collected: Record<string, string>,
  errorNote?: string
): Promise<void> {
  const def = WIZARDS[type]
  if (!def) return
  const step = def.steps[stepIdx]
  let text = renderPrompt(def, stepIdx, collected)
  if (errorNote) text = `⚠️ ${errorNote}\n\n${text}`
  text += `${MARK}w·${type}·${stepIdx}`

  await sendTelegramMessage(botToken, chatId, text, "HTML", step.mode === "buttons" ? buttonMarkup(type, stepIdx, step) : forceReplyMarkup(step))
}

async function finishWizard(botToken: string, chatId: string, userId: string, req: NextRequest, ws: WizardState): Promise<void> {
  const def = WIZARDS[ws.type]
  if (!def) return
  let update = def.build(ws.collected)

  // Budget replaces existing entry for same category+month
  if (ws.type === "budget") {
    const data = await getUserData(userId)
    const budgets = (data?.budgets ?? []).filter((b) => !(b.category === ws.collected.category && b.month === monthKey()))
    budgets.push({ id: genId(), category: ws.collected.category, limit: num(ws.collected.limit), month: monthKey() })
    update = { budgets }
  }
  if (ws.type === "habit") {
    const data = await getUserData(userId)
    update = { habits: [...(data?.habits ?? []), { id: genId(), name: ws.collected.name, records: [], streak: 0 }] as any }
  }

  const fresh = await getUserData(userId)
  await saveUserData(userId, { ...(fresh ?? {}), ...update } as UserData)
  await saveWizard(chatId, null)

  const openPaths: Record<string, string> = {
    task: "/tasks",
    expense: "/finance",
    income: "/finance",
    budget: "/finance",
    habit: "/habits",
    challenge: "/habits",
    goal: "/future",
    content: "/content-hub",
    sip: "/investments",
    stock: "/investments",
    fund: "/investments",
    bucket: "/skills/bucket-list",
  }
  const path = openPaths[ws.type]
  const keyboard: InlineKeyboard = path ? [[{ text: `Open in Vault ↗`, url: `${appUrl(req)}${path}` }]] : []

  await sendTelegramMessage(
    botToken,
    chatId,
    `🎉 <b>Saved!</b>\n\n${def.summary(ws.collected)}`,
    "HTML",
    keyboard
  )
}

async function advance(
  botToken: string,
  chatId: string,
  userId: string,
  req: NextRequest,
  type: string,
  stepIdx: number,
  collected: Record<string, string>
): Promise<void> {
  const def = WIZARDS[type]
  if (!def) return
  if (stepIdx + 1 >= def.steps.length) {
    await finishWizard(botToken, chatId, userId, req, { type, step: stepIdx, collected })
    return
  }
  await saveWizard(chatId, { type, step: stepIdx + 1, collected })
  await sendStep(botToken, chatId, type, stepIdx + 1, collected)
}

async function startWizard(botToken: string, chatId: string, userId: string, req: NextRequest, type: string): Promise<void> {
  const def = WIZARDS[type]
  if (!def) return
  await saveWizard(chatId, { type, step: 0, collected: {} })
  await sendTelegramMessage(botToken, chatId, `${def.emoji} <b>${def.title}</b>\nI'll ask a few quick questions.`)
  await sendStep(botToken, chatId, type, 0, {})
}

// ════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body: TelegramMessage = await req.json()
    const botToken = getBotToken()
    if (!botToken) return NextResponse.json({ ok: true })

    // ─── BUTTON TAPS (inline keyboards) ──────────────────────────
    const cb = body.callback_query
    if (cb?.data && cb.message?.chat?.id) {
      const chatId = String(cb.message.chat.id)
      const userId = await getUserIdForChatId(chatId)
      await answerCallbackQuery(botToken, cb.id)
      if (!userId) return NextResponse.json({ ok: true })

      const [tag, type, stepStr, ...rest] = cb.data.split("·")
      if (tag !== "c") return NextResponse.json({ ok: true })
      const stepIdx = parseInt(stepStr)
      const def = WIZARDS[type]
      const step = def?.steps[stepIdx]
      if (!def || !step) return NextResponse.json({ ok: true })

      let value = rest.join("·")
      if (value === "__skip__") value = ""

      const collected = { ...(await getWizard(chatId))?.collected, [step.key]: value }
      // Show the choice on the tapped message
      const chosenLabel = value === "" ? "skipped" : (step.options?.flat().find((o) => o.value === value)?.label ?? value)
      await editMessageText(botToken, chatId, cb.message.message_id, `${renderPrompt(def, stepIdx, collected)}\n\n👉 <b>You picked: ${escapeHtml(chosenLabel)}</b>`)
      await advance(botToken, chatId, userId, req, type, stepIdx, collected)
      return NextResponse.json({ ok: true })
    }

    // ─── MESSAGES ────────────────────────────────────────────────
    const msg = body.message
    if (!msg?.chat?.id) return NextResponse.json({ ok: true })
    const chatId = String(msg.chat.id)
    const rawText = (msg.text || "").trim()
    if (!rawText) return NextResponse.json({ ok: true })

    // /cancel aborts any running wizard
    if (rawText.toLowerCase() === "/cancel") {
      await saveWizard(chatId, null)
      await sendTelegramMessage(botToken, chatId, "❌ Cancelled. Type /help to see what else I can do.")
      return NextResponse.json({ ok: true })
    }

    // Wizard answers arrive as replies to prompts (marker hidden in prompt text)
    const repliedText = msg.reply_to_message?.text || ""
    const wizMatch = repliedText.includes(MARK)
      ? repliedText.split(MARK)[1]?.split("·")
      : null
    if (wizMatch && wizMatch[0] === "w") {
      const userId = await getUserIdForChatId(chatId)
      if (!userId) return NextResponse.json({ ok: true })
      const [, type, stepStr] = wizMatch
      const stepIdx = parseInt(stepStr)
      const def = WIZARDS[type]
      const step = def?.steps[stepIdx]
      if (!def || !step) return NextResponse.json({ ok: true })

      let value = rawText
      const isSkip = step.optional && /^(\/skip|skip)$/i.test(value)
      if (isSkip) value = ""

      if (!isSkip) {
        const err = step.validate ? step.validate(value) : null
        if (err) {
          await sendStep(botToken, chatId, type, stepIdx, (await getWizard(chatId))?.collected ?? {}, err)
          return NextResponse.json({ ok: true })
        }
        if (step.mode === "buttons" && step.options) {
          const flat = step.options.flat()
          const match = flat.find((o) => o.value.toLowerCase() === value.toLowerCase())
          value = match ? match.value : value
        }
      }

      const collected = { ...(await getWizard(chatId))?.collected, [step.key]: value }
      await advance(botToken, chatId, userId, req, type, stepIdx, collected)
      return NextResponse.json({ ok: true })
    }

    const userId = await getUserIdForChatId(chatId)
    const data = userId ? await getUserData(userId) : null

    // ─── PUBLIC COMMANDS ─────────────────────────────────────────

    if (rawText.startsWith("/start") || rawText.startsWith("/help") || rawText.startsWith("/commands")) {
      const reply = `<b>Vault Bot</b>

<b>🧭 Navigate</b>
/menu — jump to any page

<b>Guided creators</b> — I'll ask one thing at a time:
/addtask · /addexpense · /addincome · /addhabit
/addgoal · /addbucket · /addcontent · /addsip
/addstock · /addfund · /addchallenge · /setbudget · /sleeplog

<b>Quick views & actions</b>
/tasks — active tasks · /donetask n · /undotask n · /deltask n · /clearcompleted
/habits — today · /habitdone n · /habitundo n · /delhabit n
/challenges · /challengeday chal day · /delchallenge n
/finance · /expenses · /incomes · /delexpense n · /delincome n
/invest · /sips · /stocks · /funds · /delsip n · /delstock n · /delfund n
/goals · /goalprogress n value · /delgoal n
/content · /movecontent n status · /delcontent n
/bucket · /donebucket n · /undobucket n · /delbucket n
/skills · /skillprogress n % · /skilldone n · /delskill n
/sleep · /star · /today · /donetodo n · /deltodo n

/cancel — stop whatever we were doing`
      await sendTelegramMessage(botToken, chatId, reply)
      return NextResponse.json({ ok: true })
    }

    if (rawText.startsWith("/menu") || rawText.startsWith("/open") || rawText.startsWith("/pages")) {
      await sendTelegramMessage(botToken, chatId, "<b>🧭 Open a page in Vault</b>", "HTML", menuKeyboard(req))
      return NextResponse.json({ ok: true })
    }

    if (!userId || !data) {
      await sendTelegramMessage(botToken, chatId, "⚠️ Not connected. Open the Vault app → click Telegram icon in header → connect first.")
      return NextResponse.json({ ok: true })
    }

    // ─── GUIDED CREATORS ─────────────────────────────────────────

    const creatorMap: Record<string, string> = {
      "/addtask": "task",
      "/newtask": "task",
      "/addexpense": "expense",
      "/spend": "expense",
      "/addincome": "income",
      "/addhabit": "habit",
      "/addgoal": "goal",
      "/addbucket": "bucket",
      "/addcontent": "content",
      "/idea": "content",
      "/addsip": "sip",
      "/addstock": "stock",
      "/addfund": "fund",
      "/addchallenge": "challenge",
      "/challenge": "challenge",
      "/setbudget": "budget",
      "/budget": "budget",
      "/sleeplog": "sleeplog",
      "/slept": "sleeplog",
    }
    const firstWord = rawText.split(/\s+/)[0].toLowerCase()
    if (creatorMap[firstWord]) {
      await startWizard(botToken, chatId, userId, req, creatorMap[firstWord])
      return NextResponse.json({ ok: true })
    }

    // Register the command menu once per day-ish (cheap no-op if unchanged)
    if (firstWord === "/registermenu" || firstWord === "/syncmenu") {
      await setBotCommands(botToken)
      await sendTelegramMessage(botToken, chatId, "✅ Command menu refreshed.")
      return NextResponse.json({ ok: true })
    }

    const cmd = firstWord
    const args = rawText.split(/\s+/).slice(1).join(" ").trim()

    let reply = ""
    let keyboard: InlineKeyboard | undefined

    switch (cmd) {
      // ═══ TASKS ═══════════════════════════════════════════

      case "/tasks": {
        const active = (data.tasks ?? []).filter((t) => !t.completed)
        const done = (data.tasks ?? []).filter((t) => t.completed)
        reply = `<b>🎯 Tasks</b>\nActive: ${active.length} | Done: ${done.length}\n\n`
        active.slice(0, 15).forEach((t, i) => {
          const icon = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢"
          reply += `${i + 1}. ${icon} ${escapeHtml(t.title)}`
          if (t.dueDate) reply += ` — ${t.dueDate}`
          if (t.project) reply += ` [${escapeHtml(t.project)}]`
          reply += "\n"
        })
        if (active.length > 15) reply += `...and ${active.length - 15} more\n`
        keyboard = [[{ text: "Open Tasks ↗", url: `${appUrl(req)}/tasks` }]]
        break
      }

      case "/task": {
        const active = (data.tasks ?? []).filter((t) => !t.completed)
        const t = pick(active, args)
        if (!t) { reply = needNum(active.length, "/tasks"); break }
        reply = `<b>🎯 ${escapeHtml(t.title)}</b>\nPriority: ${t.priority}\n`
        if (t.dueDate) reply += `Due: ${t.dueDate}\n`
        if (t.project) reply += `Project: ${escapeHtml(t.project)}\n`
        break
      }

      case "/donetask": {
        const active = (data.tasks ?? []).filter((t) => !t.completed)
        const task = pick(active, args)
        if (!task) { reply = needNum(active.length, "/tasks"); break }
        const tasks = data.tasks ?? []
        tasks[tasks.findIndex((t) => t.id === task.id)].completed = true
        await saveUserData(userId, { ...data, tasks })
        reply = `<b>✅ Done:</b> ${escapeHtml(task.title)}`
        break
      }

      case "/undotask": {
        const done = (data.tasks ?? []).filter((t) => t.completed)
        const task = pick(done, args)
        if (!task) { reply = needNum(done.length, "no completed tasks"); break }
        const tasks = data.tasks ?? []
        tasks[tasks.findIndex((t) => t.id === task.id)].completed = false
        await saveUserData(userId, { ...data, tasks })
        reply = `<b>↩️ Reopened:</b> ${escapeHtml(task.title)}`
        break
      }

      case "/deltask": {
        const active = (data.tasks ?? []).filter((t) => !t.completed)
        const task = pick(active, args)
        if (!task) { reply = needNum(active.length, "/tasks"); break }
        await saveUserData(userId, { ...data, tasks: (data.tasks ?? []).filter((t) => t.id !== task.id) })
        reply = `<b>🗑 Deleted:</b> ${escapeHtml(task.title)}`
        break
      }

      case "/clearcompleted": {
        const tasks = data.tasks ?? []
        const remaining = tasks.filter((t) => !t.completed)
        const cleared = tasks.length - remaining.length
        await saveUserData(userId, { ...data, tasks: remaining })
        reply = `<b>🧹 Cleared ${cleared} completed task${cleared === 1 ? "" : "s"}</b>`
        break
      }

      // ═══ HABITS ═══════════════════════════════════════════

      case "/habits": {
        const today = todayKey()
        const habits = data.habits ?? []
        if (!habits.length) { reply = "<b>❤️ Habits</b>\n\nNo habits yet. Add one: /addhabit"; break }
        reply = "<b>❤️ Habits Today</b>\n"
        habits.slice(0, 15).forEach((h, i) => {
          const doneToday = h.records?.some((r) => r.date === today && r.completed)
          reply += `${i + 1}. ${doneToday ? "✅" : "⬜"} ${escapeHtml(h.name)}`
          if ((h.streak || 0) > 0) reply += ` 🔥 ${h.streak}d`
          reply += "\n"
        })
        keyboard = [[{ text: "Open Health ↗", url: `${appUrl(req)}/habits` }]]
        break
      }

      case "/habitdone":
      case "/habitundo": {
        const undo = cmd === "/habitundo"
        const habits = data.habits ?? []
        const habit = pick(habits, args)
        if (!habit) { reply = needNum(habits.length, "/habits"); break }
        const today = todayKey()
        const idx = habits.findIndex((h) => h.id === habit.id)
        if (!habits[idx].records) habits[idx].records = []
        const existing = habits[idx].records!.find((r) => r.date === today)
        if (existing) existing.completed = !undo
        else if (!undo) habits[idx].records!.push({ date: today, completed: true })
        await saveUserData(userId, { ...data, habits })
        reply = undo ? `<b>↩️ Undone:</b> ${escapeHtml(habit.name)}` : `<b>✅ Habit done:</b> ${escapeHtml(habit.name)} 🔥`
        break
      }

      case "/delhabit": {
        const habits = data.habits ?? []
        const habit = pick(habits, args)
        if (!habit) { reply = needNum(habits.length, "/habits"); break }
        await saveUserData(userId, { ...data, habits: habits.filter((h) => h.id !== habit.id) })
        reply = `<b>🗑 Deleted habit:</b> ${escapeHtml(habit.name)}`
        break
      }

      // ═══ CHALLENGES ═══════════════════════════════════════

      case "/challenges": {
        const challenges = (data.challenges ?? []).filter((c) => c.joined)
        if (!challenges.length) { reply = "<b>🏅 Challenges</b>\n\nNone joined yet. Start one: /addchallenge"; break }
        reply = "<b>🏅 Challenges</b>\n"
        challenges.forEach((c, i) => {
          reply += `${i + 1}. ${escapeHtml(c.title)} — ${c.days.filter((d) => d.completed).length}/${c.days.length} days\n`
        })
        break
      }

      case "/challengeday": {
        const nums = args.split(/\s+/).map(Number)
        const challenges = (data.challenges ?? []).filter((c) => c.joined)
        const chal = pick(challenges, String(nums[0]))
        if (!chal) { reply = needNum(challenges.length, "/challenges"); break }
        const day = nums[1]
        if (!day || day < 1 || day > chal.days.length) { reply = `Pick day 1–${chal.days.length}.`; break }
        const all = data.challenges ?? []
        const cIdx = all.findIndex((c) => c.id === chal.id)
        const dIdx = all[cIdx].days.findIndex((d) => d.day === day)
        all[cIdx].days[dIdx].completed = true
        await saveUserData(userId, { ...data, challenges: all })
        reply = `<b>✅ Day ${day} done:</b> ${escapeHtml(chal.title)} (${all[cIdx].days.filter((d) => d.completed).length}/${chal.days.length})`
        break
      }

      case "/delchallenge": {
        const challenges = data.challenges ?? []
        const chal = pick(challenges, args)
        if (!chal) { reply = needNum(challenges.length, "/challenges"); break }
        await saveUserData(userId, { ...data, challenges: challenges.filter((c) => c.id !== chal.id) })
        reply = `<b>🗑 Deleted challenge:</b> ${escapeHtml(chal.title)}`
        break
      }

      // ═══ FINANCE VIEWS ════════════════════════════════════

      case "/finance": {
        const income = (data.incomes ?? []).reduce((s, i) => s + i.amount, 0)
        const expense = (data.expenses ?? []).reduce((s, e) => s + e.amount, 0)
        const net = income - expense
        if (income === 0 && expense === 0) {
          reply = "<b>💰 Finance</b>\n\nNo data yet. Log something: /addexpense or /addincome"
        } else {
          const arrow = net >= 0 ? "⬆️" : "⬇️"
          reply = `<b>💰 Finance</b>\nIncome: ${inr(income)}\nExpenses: ${inr(expense)}\n${arrow} Net: ${inr(net)}`
        }
        keyboard = [[{ text: "Open Finance ↗", url: `${appUrl(req)}/finance` }]]
        break
      }

      case "/expenses": {
        const expenses = data.expenses ?? []
        if (!expenses.length) { reply = "<b>💸 Expenses</b>\n\nNone yet."; break }
        reply = "<b>💸 Recent Expenses</b>\n\n"
        expenses.slice(0, 15).forEach((e, i) => {
          reply += `${i + 1}. ${inr(e.amount)} — ${e.category}${e.description ? ` (${escapeHtml(e.description)})` : ""}\n`
        })
        break
      }

      case "/incomes": {
        const incomes = data.incomes ?? []
        if (!incomes.length) { reply = "<b>💵 Income</b>\n\nNone yet."; break }
        reply = "<b>💵 Recent Income</b>\n\n"
        incomes.slice(0, 15).forEach((x, i) => {
          reply += `${i + 1}. ${inr(x.amount)} — ${x.source}${x.description ? ` (${escapeHtml(x.description)})` : ""}\n`
        })
        break
      }

      case "/delexpense": {
        const expenses = data.expenses ?? []
        const e = pick(expenses, args)
        if (!e) { reply = needNum(expenses.length, "/expenses"); break }
        await saveUserData(userId, { ...data, expenses: expenses.filter((x) => x.id !== e.id) })
        reply = `<b>🗑 Expense deleted:</b> ${inr(e.amount)} — ${e.category}`
        break
      }

      case "/delincome": {
        const incomes = data.incomes ?? []
        const x = pick(incomes, args)
        if (!x) { reply = needNum(incomes.length, "/incomes"); break }
        await saveUserData(userId, { ...data, incomes: incomes.filter((i) => i.id !== x.id) })
        reply = `<b>🗑 Income deleted:</b> ${inr(x.amount)} — ${x.source}`
        break
      }

      // ═══ INVESTMENTS ══════════════════════════════════════

      case "/invest": {
        const sipTotal = (data.sips ?? []).reduce((s, i) => s + i.amount, 0)
        const stocks = data.stocks ?? []
        const funds = data.mutualFunds ?? []
        const stockInv = stocks.reduce((s, i) => s + i.buyPrice * i.quantity, 0)
        const stockCur = stocks.reduce((s, i) => s + (i.currentPrice ?? i.buyPrice) * i.quantity, 0)
        const mfInv = funds.reduce((s, i) => s + (i.investedAmount ?? i.nav * i.units), 0)
        const mfCur = funds.reduce((s, i) => s + (i.currentValue ?? i.nav * i.units), 0)
        const totalInv = stockInv + mfInv
        const totalCur = stockCur + mfCur
        if (totalInv === 0 && sipTotal === 0) {
          reply = "<b>💎 Investments</b>\n\nNo holdings yet."
        } else {
          const pct = totalInv > 0 ? (((totalCur - totalInv) / totalInv) * 100).toFixed(1) : "0.0"
          const emoji = Number(pct) >= 0 ? "📈" : "📉"
          reply = `<b>💎 Investments</b>\nSIPs: ${inr(sipTotal)}/mo\nInvested: ${inr(totalInv)}\nCurrent: ${inr(totalCur)}\n${emoji} ${Number(pct) >= 0 ? "+" : ""}${pct}%`
        }
        keyboard = [[{ text: "Open Investments ↗", url: `${appUrl(req)}/investments` }]]
        break
      }

      case "/sips": {
        const sips = data.sips ?? []
        if (!sips.length) { reply = "<b>🔁 SIPs</b>\n\nNone yet."; break }
        reply = `<b>🔁 SIPs</b>\n\n`
        sips.forEach((s, i) => { reply += `${i + 1}. ${escapeHtml(s.name)} — ${inr(s.amount)}/${s.frequency}\n` })
        break
      }

      case "/stocks": {
        const stocks = data.stocks ?? []
        if (!stocks.length) { reply = "<b>📊 Stocks</b>\n\nNone yet."; break }
        reply = `<b>📊 Stocks</b>\n\n`
        stocks.forEach((s, i) => {
          const inv = s.buyPrice * s.quantity
          const cur = (s.currentPrice ?? s.buyPrice) * s.quantity
          const pct = inv > 0 ? (((cur - inv) / inv) * 100).toFixed(1) : "0"
          reply += `${i + 1}. ${escapeHtml(s.name)} ×${s.quantity} @ ₹${s.buyPrice} → ${cur >= inv ? "🟢" : "🔴"} ${pct}%\n`
        })
        break
      }

      case "/funds": {
        const funds = data.mutualFunds ?? []
        if (!funds.length) { reply = "<b>🏦 Mutual Funds</b>\n\nNone yet."; break }
        reply = `<b>🏦 Mutual Funds</b>\n\n`
        funds.forEach((f, i) => { reply += `${i + 1}. ${escapeHtml(f.name)} — ${f.units} units @ ₹${f.nav}\n` })
        break
      }

      case "/delsip": {
        const sips = data.sips ?? []
        const s = pick(sips, args)
        if (!s) { reply = needNum(sips.length, "/sips"); break }
        await saveUserData(userId, { ...data, sips: sips.filter((x) => x.id !== s.id) })
        reply = `<b>🗑 SIP deleted:</b> ${escapeHtml(s.name)}`
        break
      }

      case "/delstock": {
        const stocks = data.stocks ?? []
        const s = pick(stocks, args)
        if (!s) { reply = needNum(stocks.length, "/stocks"); break }
        await saveUserData(userId, { ...data, stocks: stocks.filter((x) => x.id !== s.id) })
        reply = `<b>🗑 Stock deleted:</b> ${escapeHtml(s.name)}`
        break
      }

      case "/delfund": {
        const funds = data.mutualFunds ?? []
        const f = pick(funds, args)
        if (!f) { reply = needNum(funds.length, "/funds"); break }
        await saveUserData(userId, { ...data, mutualFunds: funds.filter((x) => x.id !== f.id) })
        reply = `<b>🗑 Fund deleted:</b> ${escapeHtml(f.name)}`
        break
      }

      // ═══ GOALS ════════════════════════════════════════════

      case "/goals": {
        const goals = data.futureGoals ?? []
        if (!goals.length) { reply = "<b>🔮 Future Goals</b>\n\nNo goals yet."; break }
        reply = "<b>🔮 Future Goals</b>\n\n"
        goals.slice(0, 10).forEach((g, i) => {
          const pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0
          reply += `${i + 1}. 🎯 ${escapeHtml(g.title)} — ${g.currentValue}/${g.targetValue} (${pct}%)${g.completed ? " ✅" : ""}\n`
        })
        keyboard = [[{ text: "Open Future Self ↗", url: `${appUrl(req)}/future` }]]
        break
      }

      case "/goalprogress": {
        const nums = args.split(/\s+/).map(Number)
        const goals = data.futureGoals ?? []
        const goal = pick(goals, String(nums[0]))
        if (!goal) { reply = needNum(goals.length, "/goals"); break }
        if (nums.length < 2 || isNaN(nums[1])) { reply = "Usage: /goalprogress 2 12"; break }
        const all = data.futureGoals ?? []
        const idx = all.findIndex((g) => g.id === goal.id)
        all[idx].currentValue = nums[1]
        if (all[idx].targetValue > 0 && nums[1] >= all[idx].targetValue) all[idx].completed = true
        await saveUserData(userId, { ...data, futureGoals: all })
        const pct = all[idx].targetValue > 0 ? Math.round((nums[1] / all[idx].targetValue) * 100) : 0
        reply = `<b>📊 Progress:</b> ${escapeHtml(goal.title)} — ${nums[1]}/${goal.targetValue} (${pct}%)${all[idx].completed ? " 🎉 complete!" : ""}`
        break
      }

      case "/delgoal": {
        const goals = data.futureGoals ?? []
        const g = pick(goals, args)
        if (!g) { reply = needNum(goals.length, "/goals"); break }
        await saveUserData(userId, { ...data, futureGoals: goals.filter((x) => x.id !== g.id) })
        reply = `<b>🗑 Goal deleted:</b> ${escapeHtml(g.title)}`
        break
      }

      // ═══ CONTENT ══════════════════════════════════════════

      case "/content": {
        const items = data.contentItems ?? []
        if (!items.length) { reply = "<b>📱 Content Hub</b>\n\nNo content yet."; break }
        const counts = ["ideas", "scripts", "filming", "editing", "published"].map((s) => `${items.filter((i) => i.status === s).length} ${s}`).join(" | ")
        reply = `<b>📱 Content Hub</b>\n${counts}\n\n`
        items.filter((i) => i.status !== "published").slice(0, 10).forEach((i, n) => {
          reply += `${n + 1}. ${i.status === "ideas" ? "💡" : i.status === "scripts" ? "📝" : i.status === "filming" ? "🎥" : "✂️"} ${escapeHtml(i.title)} (${i.status})\n`
        })
        keyboard = [[{ text: "Open Content Hub ↗", url: `${appUrl(req)}/content-hub` }]]
        break
      }

      case "/movecontent": {
        const parts = args.split(/\s+/)
        const items = data.contentItems ?? []
        const item = pick(items, parts[0])
        const status = (parts[1] || "").toLowerCase()
        if (!item) { reply = needNum(items.length, "/content"); break }
        if (!["ideas", "scripts", "filming", "editing", "published"].includes(status)) {
          reply = "Status must be one of: ideas, scripts, filming, editing, published"
          break
        }
        const all = data.contentItems ?? []
        all[all.findIndex((i) => i.id === item.id)].status = status as any
        await saveUserData(userId, { ...data, contentItems: all })
        reply = `<b>📦 Moved:</b> ${escapeHtml(item.title)} → ${status}`
        break
      }

      case "/delcontent": {
        const items = data.contentItems ?? []
        const item = pick(items, args)
        if (!item) { reply = needNum(items.length, "/content"); break }
        await saveUserData(userId, { ...data, contentItems: items.filter((i) => i.id !== item.id) })
        reply = `<b>🗑 Content deleted:</b> ${escapeHtml(item.title)}`
        break
      }

      // ═══ BUCKET LIST ══════════════════════════════════════

      case "/bucket": {
        const items = (data.bucketListItems ?? []).filter((i) => !i.completed)
        if (!items.length) { reply = "<b>🏆 Bucket List</b>\n\nAll done or empty! 🎉"; break }
        reply = `<b>🏆 Bucket List</b> (${items.length} pending)\n\n`
        items.slice(0, 10).forEach((i, n) => {
          reply += `${n + 1}. ⬜ ${escapeHtml(i.title)}${i.expectedDate ? ` — ${i.expectedDate}` : ""}\n`
        })
        keyboard = [[{ text: "Open Bucket List ↗", url: `${appUrl(req)}/skills/bucket-list` }]]
        break
      }

      case "/donebucket":
      case "/undobucket": {
        const done = cmd === "/donebucket"
        const pool = (data.bucketListItems ?? []).filter((i) => i.completed === !done)
        const item = pick(pool, args)
        if (!item) { reply = needNum(pool.length, done ? "/bucket" : "no completed bucket items"); break }
        const all = data.bucketListItems ?? []
        all[all.findIndex((i) => i.id === item.id)].completed = done
        await saveUserData(userId, { ...data, bucketListItems: all })
        reply = done ? `<b>🎉 Achieved:</b> ${escapeHtml(item.title)}` : `<b>↩️ Reopened:</b> ${escapeHtml(item.title)}`
        break
      }

      case "/delbucket": {
        const items = data.bucketListItems ?? []
        const item = pick(items, args)
        if (!item) { reply = needNum(items.length, "/bucket"); break }
        await saveUserData(userId, { ...data, bucketListItems: items.filter((i) => i.id !== item.id) })
        reply = `<b>🗑 Deleted:</b> ${escapeHtml(item.title)}`
        break
      }

      // ═══ SKILLS ═══════════════════════════════════════════

      case "/skills": {
        const skills = data.skills ?? []
        if (!skills.length) { reply = "<b>🎓 Skills</b>\n\nNo skills yet."; break }
        reply = "<b>🎓 Skills</b>\n"
        skills.slice(0, 15).forEach((s, i) => {
          reply += `${i + 1}. ${s.completed ? "✅" : "📖"} ${escapeHtml(s.name)} (${s.source}) — ${s.progress}%\n`
        })
        keyboard = [[{ text: "Open Skills ↗", url: `${appUrl(req)}/skills` }]]
        break
      }

      case "/skillprogress": {
        const nums = args.split(/\s+/).map(Number)
        const skills = data.skills ?? []
        const skill = pick(skills, String(nums[0]))
        if (!skill) { reply = needNum(skills.length, "/skills"); break }
        if (nums.length < 2 || isNaN(nums[1]) || nums[1] < 0 || nums[1] > 100) { reply = "Usage: /skillprogress 2 45"; break }
        const all = data.skills ?? []
        const idx = all.findIndex((s) => s.id === skill.id)
        all[idx].progress = nums[1]
        if (nums[1] >= 100) all[idx].completed = true
        await saveUserData(userId, { ...data, skills: all })
        reply = `<b>📊 Skill progress:</b> ${escapeHtml(skill.name)} — ${nums[1]}%${all[idx].completed ? " ✅" : ""}`
        break
      }

      case "/skilldone": {
        const skills = data.skills ?? []
        const skill = pick(skills, args)
        if (!skill) { reply = needNum(skills.length, "/skills"); break }
        const all = data.skills ?? []
        const idx = all.findIndex((s) => s.id === skill.id)
        all[idx].completed = true
        all[idx].progress = 100
        await saveUserData(userId, { ...data, skills: all })
        reply = `<b>🎉 Skill completed:</b> ${escapeHtml(skill.name)}`
        break
      }

      case "/delskill": {
        const skills = data.skills ?? []
        const skill = pick(skills, args)
        if (!skill) { reply = needNum(skills.length, "/skills"); break }
        await saveUserData(userId, { ...data, skills: skills.filter((s) => s.id !== skill.id) })
        reply = `<b>🗑 Skill deleted:</b> ${escapeHtml(skill.name)}`
        break
      }

      // ═══ SLEEP ════════════════════════════════════════════

      case "/sleep": {
        const entries = (data.sleepEntries ?? []).slice(-7)
        if (!entries.length) { reply = "<b>😴 Sleep</b>\n\nNo logs yet. Try /sleeplog"; break }
        reply = "<b>😴 Last Nights</b>\n"
        entries.forEach((e) => {
          reply += `${e.date}: ${e.bedtime}→${e.wakeTime} (${e.hours}h) ${"★".repeat(Math.min(5, e.quality))}\n`
        })
        break
      }

      // ═══ NORTH STAR ═══════════════════════════════════════

      case "/star": {
        const ns = data.northStar
        if (!ns || (!ns.vision && !ns.mission)) { reply = "<b>⭐ North Star</b>\n\nNot set yet."; break }
        reply = "<b>⭐ North Star</b>\n\n"
        if (ns.vision) reply += `<b>Vision:</b> ${escapeHtml(ns.vision)}\n`
        if (ns.mission) reply += `<b>Mission:</b> ${escapeHtml(ns.mission)}\n`
        if (ns.pillars?.length) {
          reply += "\n<b>Pillars:</b>\n"
          ns.pillars.forEach((p) => { reply += `${p.icon || "•"} ${escapeHtml(p.title)}\n` })
        }
        keyboard = [[{ text: "Open North Star ↗", url: `${appUrl(req)}/north-star` }]]
        break
      }

      // ═══ TODAY'S TODOS ════════════════════════════════════

      case "/today": {
        const today = todayKey()
        const todos = (data.advanceTodos ?? []).filter((t) => t.date === today)
        if (!todos.length) { reply = "<b>📅 Today</b>\n\nNo todos for today."; break }
        reply = `<b>📅 Today</b> (${todos.filter((t) => t.completed).length}/${todos.length})\n\n`
        todos.forEach((t, i) => { reply += `${i + 1}. ${t.completed ? "✅" : "⬜"} ${escapeHtml(t.title)}\n` })
        break
      }

      case "/addtodo": {
        if (!args) { reply = "Usage: /addtodo Call the bank"; break }
        const todos = data.advanceTodos ?? []
        todos.unshift({ id: genId(), title: args, completed: false, date: todayKey(), createdAt: Date.now() })
        await saveUserData(userId, { ...data, advanceTodos: todos })
        reply = `<b>✅ Todo added:</b> ${escapeHtml(args)}`
        break
      }

      case "/donetodo": {
        const today = todayKey()
        const pool = (data.advanceTodos ?? []).filter((t) => t.date === today && !t.completed)
        const todo = pick(pool, args)
        if (!todo) { reply = needNum(pool.length, "/today"); break }
        const all = data.advanceTodos ?? []
        all[all.findIndex((t) => t.id === todo.id)].completed = true
        await saveUserData(userId, { ...data, advanceTodos: all })
        reply = `<b>✅ Done:</b> ${escapeHtml(todo.title)}`
        break
      }

      case "/deltodo": {
        const today = todayKey()
        const pool = (data.advanceTodos ?? []).filter((t) => t.date === today)
        const todo = pick(pool, args)
        if (!todo) { reply = needNum(pool.length, "/today"); break }
        await saveUserData(userId, { ...data, advanceTodos: (data.advanceTodos ?? []).filter((t) => t.id !== todo.id) })
        reply = `<b>🗑 Todo deleted:</b> ${escapeHtml(todo.title)}`
        break
      }

      default:
        reply = `🤔 Unknown command.\n\nType /help to see everything, or /menu to open the app.`
    }

    if (reply) {
      await sendTelegramMessage(botToken, chatId, reply, "HTML", keyboard)
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
    await setBotCommands(botToken)
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const data = await res.json()
    return NextResponse.json({
      configured: true,
      webhook: data.result?.url || null,
      pending: data.result?.pending_update_count || 0,
      lastError: data.result?.last_error_message || null,
    })
  } catch {
    return NextResponse.json({ configured: false })
  }
}
