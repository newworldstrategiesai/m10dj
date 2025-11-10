"use client"

import { Menu, Bell, Search, LogOut } from "lucide-react"

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors dark:hover:bg-zinc-800">
          <Menu className="w-5 h-5 text-zinc-950 dark:text-zinc-50" />
        </button>

        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-100 rounded-lg px-4 py-2 w-64 dark:bg-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <input
            type="text"
            placeholder="Search leads, tasks..."
            className="bg-transparent outline-none text-sm text-zinc-950 placeholder-muted-foreground w-full dark:text-zinc-50"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-zinc-100 rounded-lg transition-colors dark:hover:bg-zinc-800">
          <Bell className="w-5 h-5 text-zinc-950 dark:text-zinc-50" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center dark:bg-zinc-50">
            <span className="text-sm font-bold text-zinc-50 dark:text-zinc-900">DJ</span>
          </div>
          <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors dark:hover:bg-zinc-800">
            <LogOut className="w-5 h-5 text-zinc-950 dark:text-zinc-50" />
          </button>
        </div>
      </div>
    </header>
  )
}
