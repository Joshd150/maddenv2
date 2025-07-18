"use client" // This component needs to be a client component to use usePathname

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Trophy, List, CalendarDays, Award, ArrowRightLeft, UserCheck, Menu, X } from "lucide-react"
import { usePathname } from "next/navigation" // Import usePathname
import { cn } from "@/lib/utils"

export default function LeagueHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() // Get the current path
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Home", icon: Award },
    { href: "/league-hub/standings", label: "Standings", icon: List },
    { href: "/league-hub/stats", label: "Stats", icon: Users },
    { href: "/league-hub/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/league-hub/playoffs", label: "Playoffs", icon: Trophy },
    { href: "/league-hub/teams", label: "Teams", icon: Users },
    { href: "/league-hub/trades", label: "Trades", icon: ArrowRightLeft },
    { href: "/league-hub/roster-moves", label: "Roster Moves", icon: UserCheck },
  ]

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Navigation */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 flex-col border-r nfl-card p-4 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 md:flex",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="mb-8 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            League Hub
          </h2>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              // Dynamically set variant based on current path
              variant={pathname === href ? "default" : "ghost"}
              className={cn(
                "justify-start gap-2 text-left transition-all duration-200",
                pathname === href && "nfl-gradient font-semibold"
              )}
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
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-card border border-border shadow-lg md:hidden touch-target"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background to-muted/20 pt-16 md:pt-4">
        {children}
      </main>
    </div>
  )
}
