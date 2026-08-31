import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendWebPushToUser, extractPushSubscriptions } from "@/lib/push"

const WINDOW_MS = 3 * 60 * 1000 // fire reminders within ±3 minutes of their time

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = req.headers.get("authorization") ?? ""
  if (auth === `Bearer ${secret}`) return true
  const url = new URL(req.url)
  return url.searchParams.get("secret") === secret
}

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return handle()
}

// GET is handy for manual testing in dev (e.g. curl with ?secret=).
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return handle()
}

async function handle() {
  const supabase = createServiceClient()
  const now = Date.now()
  const sent: string[] = []
  const errors: string[] = []

  try {
    const { data: rows, error: rowsErr } = await supabase
      .from("user_data")
      .select("user_id, data")

    if (rowsErr || !rows) {
      return NextResponse.json({ ok: true, note: "no users" })
    }

    for (const row of rows) {
      const data = (row.data ?? {}) as Record<string, any>
      const log = new Set((data.reminderLog as string[] | undefined) ?? [])
      const fire: { key: string; title: string; description?: string; link?: string }[] = []

      const tryAdd = (key: string, title: string, description?: string, link?: string) => {
        if (log.has(key)) return
        fire.push({ key, title, description, link })
      }

      // Tasks with an explicit reminder time
      for (const t of data.tasks ?? []) {
        if (t.completed || !t.reminder) continue
        const tms = new Date(t.reminder).getTime()
        if (isNaN(tms) || Math.abs(tms - now) > WINDOW_MS) continue
        tryAdd(`task|${t.id}|${t.reminder}`, `\u23f0 Reminder: ${String(t.title)}`, t.description || (t.dueDate ? `Due ${t.dueDate}` : "Task reminder"))
      }

      // Content pieces with a reminder
      for (const c of data.contentItems ?? []) {
        if (c.archivedAt || !c.reminder) continue
        const cms = new Date(c.reminder).getTime()
        if (isNaN(cms) || Math.abs(cms - now) > WINDOW_MS) continue
        tryAdd(`content|${c.id}|${c.reminder}`, `\ud83c\udfac Content: ${String(c.title)}`, `Status: ${String(c.status ?? "ideas")}`)
      }

      // Future goals with a reminder
      for (const g of data.futureGoals ?? []) {
        if (g.completed || !g.reminder) continue
        const gms = new Date(g.reminder).getTime()
        if (isNaN(gms) || Math.abs(gms - now) > WINDOW_MS) continue
        tryAdd(`goal|${g.id}|${g.reminder}`, `\ud83c\udfaf Goal check-in: ${String(g.title)}`, `Progress ${g.currentValue ?? 0}/${g.targetValue ?? 0}`)
      }

      // Bucket list wishes with a reminder
      for (const b of data.bucketListItems ?? []) {
        if (b.completed || !b.reminder) continue
        const bms = new Date(b.reminder).getTime()
        if (isNaN(bms) || Math.abs(bms - now) > WINDOW_MS) continue
        tryAdd(`bucket|${b.id}|${b.reminder}`, `\u2728 ${String(b.title)}`, b.expectedDate ? `Target date ${b.expectedDate}` : "Keep chasing it")
      }

      // Advance todos with a reminder
      for (const a of data.advanceTodos ?? []) {
        if (a.completed || !a.reminder) continue
        const ams = new Date(a.reminder).getTime()
        if (isNaN(ams) || Math.abs(ams - now) > WINDOW_MS) continue
        tryAdd(`todo|${a.id}|${a.reminder}`, `\ud83d\udccb Todo: ${String(a.title)}`, `Scheduled for ${String(a.date ?? "")}`)
      }

      // Daily habit reminders (fires once per habit per day at the set time)
      const nowHH = `${String(new Date(now).getHours()).padStart(2, "0")}:${String(new Date(now).getMinutes()).padStart(2, "0")}`
      const today = new Date(now).toISOString().slice(0, 10)
      for (const h of data.habits ?? []) {
        if (!h.reminderTime || h.reminderTime !== nowHH) continue
        const key = `habit|${h.id}|${today}`
        if (log.has(key)) continue
        fire.push({ key, title: `\u2764\ufe0f Time for: ${String(h.name)}`, description: "Daily habit reminder" })
      }

      // Alarms ring daily at their time while enabled, once per day.
      for (const al of data.alarms ?? []) {
        if (!al.enabled || !al.time || al.time !== nowHH) continue
        const key = `alarm|${al.id}|${today}`
        if (log.has(key)) continue
        fire.push({ key, title: al.label ? `${String(al.label)}` : "\u23f0 Alarm", description: `\u23f0 ${al.time}` })
      }

      const hrefFor = (key: string): string | undefined => {
        const kind = key.split("|")[0]
        switch (kind) {
          case "task": return "/tasks"
          case "habit": return "/habits"
          case "content": return "/content-hub"
          case "goal": return "/future"
          case "bucket": return "/skills/bucket-list"
          case "todo": return "/future"
          case "alarm": return "/dashboard"
          default: return undefined
        }
      }

      const pushLoader = async () => extractPushSubscriptions(data)

      for (const item of fire) {
        const key = item.key
        if (log.has(key)) continue

        const pushOk =
          (await sendWebPushToUser(row.user_id, {
            title: item.title.replace(/^\S+\s/, ""),
            body: item.description,
            href: hrefFor(key),
            tag: `cron-${key}`,
            rmd: true,
            kind: key.split("|")[0],
            id: key.split("|")[1],
            uid: row.user_id,
          }, pushLoader)) > 0

        if (pushOk) {
          log.add(key)
          sent.push(key)
        } else {
          errors.push(key)
        }
      }

      // Persist the log so reminders don't double-fire on the next tick.
      if (fire.length > 0) {
        await supabase.from("user_data").upsert(
          {
            user_id: row.user_id,
            data: { ...data, reminderLog: [...log].slice(-400) } as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
      }
    }
  } catch (e) {
    console.error("reminder-cron error", e)
  }

  return NextResponse.json({ ok: true, sent, errors })
}