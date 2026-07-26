import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Nexus — Your Personal Dashboard",
  description: "A premium CRM-style todo dashboard built with Next.js",
  icons: {
    icon: [
      { url: "/N.ico", type: "image/x-icon" },
      { url: "/Nexus.png", type: "image/png", sizes: "192x192" },
      { url: "/Nexus.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/Nexus.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
