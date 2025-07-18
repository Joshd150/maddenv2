"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { getTeamLogo } from "@/lib/teamLogos"
import { getMessageForWeek, GameResult } from "@/lib/madden-types"
import type { MaddenGame, Team } from "@/lib/madden-types"
import { cn } from "@/lib/utils"

interface GameScorebugProps {
  game: MaddenGame
  homeTeam: Team
  awayTeam: Team
  onGameClick: (game: MaddenGame) => void
}

export function GameScorebug({ game, homeTeam, awayTeam, onGameClick }: GameScorebugProps) {
  const isGamePlayed = game.gameStatus !== GameResult.NOT_PLAYED

  const isHomeWinner = isGamePlayed && game.homeScore > game.awayScore
  const isAwayWinner = isGamePlayed && game.awayScore > game.homeScore
  const isTie = isGamePlayed && game.homeScore === game.awayScore && game.gameStatus === GameResult.TIE

  return (
    <Card
      className="bg-zinc-800/70 border-primary/20 cursor-pointer hover:bg-zinc-700/50 transition-colors duration-200"
      onClick={() => onGameClick(game)}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="text-center text-sm text-muted-foreground font-semibold">
          {getMessageForWeek(game.weekIndex + 1)}
        </div>
        <div className="flex items-center justify-between text-lg font-semibold">
          <div className="flex items-center gap-2">
            <Image
              src={getTeamLogo(awayTeam.abbrName) || "/placeholder.svg"}
              alt={`${awayTeam.displayName} logo`}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
            <span className={cn({ "text-green-400": isAwayWinner, "text-muted-foreground": isTie })}>
              {awayTeam.displayName}
            </span>
          </div>
          {isGamePlayed && (
            <span className={cn("text-primary-foreground", { "text-green-400": isAwayWinner })}>{game.awayScore}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-lg font-semibold">
          <div className="flex items-center gap-2">
            <Image
              src={getTeamLogo(homeTeam.abbrName) || "/placeholder.svg"}
              alt={`${homeTeam.displayName} logo`}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
            <span className={cn({ "text-green-400": isHomeWinner, "text-muted-foreground": isTie })}>
              {homeTeam.displayName}
            </span>
          </div>
          {isGamePlayed && (
            <span className={cn("text-primary-foreground", { "text-green-400": isHomeWinner })}>{game.homeScore}</span>
          )}
        </div>
        <div className="text-center text-sm text-muted-foreground">
          {isGamePlayed ? (isTie ? "Tie" : "Final") : "Upcoming"}
        </div>
      </CardContent>
    </Card>
  )
}
