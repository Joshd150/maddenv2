"use client" // This component needs to be a client component to use usePathname

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Trophy, List, CalendarDays, Award } from "lucide-react"
import { usePathname } from "next/navigation" // Import usePathname

export default function LeagueHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() // Get the current path

  const navItems = [
    { href: "/", label: "Home", icon: Award },
    { href: "/league-hub/standings", label: "Standings", icon: List },
    { href: "/league-hub/stats", label: "Stats", icon: Users },
    { href: "/league-hub/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/league-hub/playoffs", label: "Playoffs", icon: Trophy },
    { href: "/league-hub/teams", label: "Teams", icon: Users },
  ]

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden w-64 flex-col border-r bg-muted/40 p-4 md:flex">
        <div className="mb-8 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">League Hub</h2>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              // Dynamically set variant based on current path
              variant={pathname === href ? "secondary" : "ghost"}
              className="justify-start gap-2 text-left"
              asChild
            >
              <Link href={href}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  )
}
