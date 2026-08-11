import { cookies } from "next/headers"
import type { EmailSettings, CalendarTokens } from "@/lib/integrations"

const EMAIL_KEY = "nexus_email"
const CALENDAR_KEY = "nexus_calendar"
const MAX_AGE = 365 * 24 * 60 * 60

async function readCookie<T>(key: string): Promise<T | null> {
  try {
    const store = await cookies()
    const raw = store.get(key)?.value
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function writeCookie(key: string, value: unknown): Promise<void> {
  const store = await cookies()
  store.set(key, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  })
}

async function deleteCookie(key: string): Promise<void> {
  const store = await cookies()
  store.set(key, "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}

export const getEmailCookie = () => readCookie<EmailSettings>(EMAIL_KEY)
export const setEmailCookie = (settings: EmailSettings) => writeCookie(EMAIL_KEY, settings)
export const clearEmailCookie = () => deleteCookie(EMAIL_KEY)

export const getCalendarCookie = () => readCookie<CalendarTokens>(CALENDAR_KEY)
export const setCalendarCookie = (tokens: CalendarTokens) => writeCookie(CALENDAR_KEY, tokens)
export const clearCalendarCookie = () => deleteCookie(CALENDAR_KEY)
