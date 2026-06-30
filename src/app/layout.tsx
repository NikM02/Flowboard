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
  title: "FlowBoard — Modern Todo Dashboard",
  description: "A premium CRM-style todo dashboard built with Next.js",
  icons: {
    icon: [
      { url: "/T.png", type: "image/png", sizes: "1024x1024" },
      { url: "/T.png", type: "image/png", sizes: "192x192" },
      { url: "/T.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/T.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "icon", url: "/T.png", sizes: "32x32" },
      { rel: "icon", url: "/T.png", sizes: "16x16" },
    ],
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
