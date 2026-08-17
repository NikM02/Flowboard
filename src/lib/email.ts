import nodemailer from "nodemailer"
import type { EmailSettings } from "@/lib/integrations"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function wrap(subject: string, bodyHtml: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f6f8fa;padding:24px;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#525252,#a3a3a3);padding:16px 24px;">
          <span style="color:#ffffff;font-weight:800;font-size:16px;">Nexus</span>
        </div>
        <div style="padding:20px 24px;">
          <h2 style="margin:0 0 12px;color:#0a0a0a;font-size:18px;">${escapeHtml(subject)}</h2>
          <div style="color:#333;font-size:14px;line-height:1.6;">${bodyHtml}</div>
          <p style="margin:20px 0 0;color:#9ca3af;font-size:11px;border-top:1px solid #f0f0f0;padding-top:12px;">
            Sent by Nexus — your personal command center.
          </p>
        </div>
      </div>
    </div>
  `
}

export async function sendEmail(
  settings: EmailSettings,
  subject: string,
  bodyHtml: string
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: settings.smtpUser,
        pass: settings.appPassword,
      },
    })

    await transporter.sendMail({
      from: `"Nexus" <${settings.smtpUser}>`,
      to: settings.recipient || settings.smtpUser,
      subject,
      html: wrap(subject, bodyHtml),
    })

    return true
  } catch {
    return false
  }
}

export { escapeHtml }
