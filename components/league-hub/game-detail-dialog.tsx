"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TeamLogo } from "@/components/league-hub/team-logo"
import type { MaddenGame, TeamStats } from "@/lib/madden-types"

interface GameDetailDialogProps {
  game: MaddenGame | null
  homeTeamName: string
  awayTeamName: string
  homeTeamAbbr: string
  awayTeamAbbr: string
  homeTeamStats: TeamStats | null
  awayTeamStats: TeamStats | null
  onClose: () => void
}

// Helper to format stat keys for display
function formatStatKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/off/g, "Offensive") // Replace 'off' with 'Offensive'
    .replace(/def/g, "Defensive") // Replace 'def' with 'Defensive'
    .replace(/Yds/g, "Yards") // Replace 'Yds' with 'Yards'
    .replace(/TDs/g, "Touchdowns") // Replace 'TDs' with 'Touchdowns'
    .replace(/Ints/g, "Interceptions") // Replace 'Ints' with 'Interceptions'
    .replace(/Fum/g, "Fumbles") // Replace 'Fum' with 'Fumbles'
    .replace(/Rec/g, "Recoveries") // Replace 'Rec' with 'Recoveries'
    .replace(/Att/g, "Attempts") // Replace 'Att' with 'Attempts'
    .replace(/Pts/g, "Points") // Replace 'Pts' with 'Points'
    .replace(/Sacks/g, "Sacks Allowed") // Specific for offensive sacks
    .replace(/Lost/g, "Lost") // For fumbles/ints lost
    .replace(/Giveaways/g, "Giveaways") // For turnovers
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function GameDetailDialog({
  game,
  homeTeamName,
  awayTeamName,
  homeTeamAbbr,
  awayTeamAbbr,
  homeTeamStats,
  awayTeamStats,
  onClose,
}: GameDetailDialogProps) {
  if (!game) {
    return null
  }

  const commonStatKeys = [
    "offTotalYds",
    "offPassYds",
    "offRushYds",
    "offSacks", // Sacks allowed by offense
    "offIntsLost", // Interceptions thrown by offense
    "offFumLost", // Fumbles lost by offense
    "tOGiveaways", // Total offensive turnovers
    "penalties",
    "penaltyYds",
  ]

  return (
    <Dialog open={!!game} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-xl bg-zinc-900 border-primary/20 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Game Breakdown</DialogTitle>
          <DialogDescription className="text-center text-lg font-semibold">
            <div className="flex items-center justify-center gap-3">
              <TeamLogo teamAbbr={awayTeamAbbr} width={32} height={32} />
              {awayTeamName} vs {homeTeamName}
              <TeamLogo teamAbbr={homeTeamAbbr} width={32} height={32} />
            </div>
            <div className="text-xl font-bold text-primary mt-2">
              {game.awayScore} - {game.homeScore}
            </div>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Away Team Stats */}
            <div className="bg-zinc-800/50 p-4 rounded-lg border border-primary/10">
              <h3 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
                <TeamLogo teamAbbr={awayTeamAbbr} width={28} height={28} />
                {awayTeamName} Stats
              </h3>
              {awayTeamStats ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {commonStatKeys.map((key) => {
                    const value = (awayTeamStats as any)[key]
                    if (value === undefined || value === null) return null
                    return (
                      <div key={key} className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">{formatStatKey(key)}:</span>
                        <span className="font-medium text-right">{String(value)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">No stats available for this team.</p>
              )}
            </div>

            {/* Home Team Stats */}
            <div className="bg-zinc-800/50 p-4 rounded-lg border border-primary/10">
              <h3 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
                <TeamLogo teamAbbr={homeTeamAbbr} width={28} height={28} />
                {homeTeamName} Stats
              </h3>
              {homeTeamStats ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {commonStatKeys.map((key) => {
                    const value = (homeTeamStats as any)[key]
                    if (value === undefined || value === null) return null
                    return (
                      <div key={key} className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">{formatStatKey(key)}:</span>
                        <span className="font-medium text-right">{String(value)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">No stats available for this team.</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
