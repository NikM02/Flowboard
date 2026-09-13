"use client"

import { Bell } from "lucide-react"
import { useNotificationStore } from "@/store/use-notification-store"
import { cn } from "@/lib/shadcn-utils"

export function NotificationCenter() {
  const { unreadCount, markAllRead } = useNotificationStore()

  const handleClick = () => {
    if (unreadCount > 0) markAllRead()
  }

  return (
    <button
      onClick={handleClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
      title="Notifications"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-bold text-white leading-none shadow-md dark:bg-white dark:text-neutral-900">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}
