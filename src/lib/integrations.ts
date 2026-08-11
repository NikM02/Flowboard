import { createServiceClient } from "@/lib/supabase/service"

export type EmailSettings = {
  smtpUser: string
  appPassword: string
  recipient: string
  notifyNew: boolean
  notifyUpdates: boolean
  notifyDue: boolean
}

export type CalendarTokens = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  email: string
}

export type Integrations = {
  email?: EmailSettings
  calendar?: CalendarTokens
}

async function getIntegrations(userId: string): Promise<Integrations> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single()
  const blob = (data?.data as Record<string, unknown> | undefined) ?? {}
  return (blob.integrations as Integrations) ?? {}
}

async function saveIntegrations(userId: string, integrations: Integrations): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single()
  const blob = (data?.data as Record<string, unknown> | undefined) ?? {}
  const { error } = await supabase
    .from("user_data")
    .upsert(
      { user_id: userId, data: { ...blob, integrations } },
      { onConflict: "user_id" }
    )
  return !error
}

export async function setEmailSettings(userId: string, settings: EmailSettings): Promise<boolean> {
  const integrations = await getIntegrations(userId)
  return saveIntegrations(userId, { ...integrations, email: settings })
}

export async function getEmailSettings(userId: string): Promise<EmailSettings | undefined> {
  const integrations = await getIntegrations(userId)
  return integrations.email
}

export async function clearEmailSettings(userId: string): Promise<boolean> {
  const integrations = await getIntegrations(userId)
  delete integrations.email
  return saveIntegrations(userId, integrations)
}

export async function setCalendarTokens(userId: string, tokens: CalendarTokens): Promise<boolean> {
  const integrations = await getIntegrations(userId)
  return saveIntegrations(userId, { ...integrations, calendar: tokens })
}

export async function clearCalendarTokens(userId: string): Promise<boolean> {
  const integrations = await getIntegrations(userId)
  delete integrations.calendar
  return saveIntegrations(userId, integrations)
}

export async function getCalendarTokens(userId: string): Promise<CalendarTokens | undefined> {
  const integrations = await getIntegrations(userId)
  return integrations.calendar
}
