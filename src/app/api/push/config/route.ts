import { NextResponse } from "next/server"

// Exposes the (public, non-secret) VAPID public key to the browser so pushes
// can be subscribed without inlining it at build time.
export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? null })
}