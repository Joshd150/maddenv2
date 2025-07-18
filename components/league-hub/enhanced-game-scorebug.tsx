"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { getTeamLogo } from "@/lib/teamLogos"
import { getMessageForWeek, GameResult } from "@/lib/madden-types"
import type { MaddenGame, Team } from "@/lib/madden-types"
import { cn } from "@/lib/utils"
import { Clock, Trophy, Target } from "lucide-react"

interface EnhancedGameScorebugProps {
  game: MaddenGame
  homeTeam: Team
  awayTeam: Team
  onGameClick: (game: MaddenGame) => void
}

export function EnhancedGameScorebug({ game, homeTeam, awayTeam, onGameClick }: EnhancedGameScorebugProps) {
  const gameStatus = game.gameStatus || game.status || GameResult.NOT_PLAYED
  const isGamePlayed = gameStatus !== GameResult.NOT_PLAYED

  const isHomeWinner = isGamePlayed && game.homeScore > game.awayScore
  const isAwayWinner = isGamePlayed && game.awayScore > game.homeScore
  const isTie = isGamePlayed && game.homeScore === game.awayScore && gameStatus === GameResult.TIE

  const getTeamRecord = (team: Team) => `${team.wins}-${team.losses}${team.ties > 0 ? `-${team.ties}` : ''}`

  return (
    <Card
      className="game-card cursor-pointer overflow-hidden"
      onClick={() => onGameClick(game)}
    >
      <CardContent className="p-0">
        {/* Header with week info */}
        <div className="nfl-gradient p-3 text-white text-center">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-semibold text-sm">
              {getMessageForWeek(game.weekIndex + 1)}
            </span>
          </div>
        </div>

        {/* Game content */}
        <div className="p-4 space-y-4">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={getTeamLogo(awayTeam.abbrName || awayTeam.teamAbbr) || "/placeholder.svg"}
                alt={`${awayTeam.displayName} logo`}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <div className="flex-1">
                <div className={cn(
                  "font-bold text-lg",
                  isAwayWinner && "text-green-400",
                  isTie && "text-yellow-400"
                )}>
                  {awayTeam.displayName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getTeamRecord(awayTeam)} • #{awayTeam.conferenceRank} Conf
                </div>
              </div>
            </div>
            {isGamePlayed && (
              <div className={cn(
                "text-2xl font-bold min-w-[3rem] text-center",
                isAwayWinner && "text-green-400",
                isTie && "text-yellow-400"
              )}>
                {game.awayScore}
              </div>
            )}
          </div>

          {/* VS or Final indicator */}
          <div className="flex items-center justify-center">
            <div className="w-full h-px bg-border"></div>
            <div className="px-4">
              {isGamePlayed ? (
                <Badge variant={isTie ? "secondary" : "default"} className="font-semibold">
                  {isTie ? "TIE" : "FINAL"}
                </Badge>
              ) : (
                <Badge variant="outline" className="font-semibold">
                  VS
                </Badge>
              )}
            </div>
            <div className="w-full h-px bg-border"></div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={getTeamLogo(homeTeam.abbrName || homeTeam.teamAbbr) || "/placeholder.svg"}
                alt={`${homeTeam.displayName} logo`}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <div className="flex-1">
                <div className={cn(
                  "font-bold text-lg",
                  isHomeWinner && "text-green-400",
                  isTie && "text-yellow-400"
                )}>
                  {homeTeam.displayName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getTeamRecord(homeTeam)} • #{homeTeam.conferenceRank} Conf
                </div>
              </div>
            </div>
            {isGamePlayed && (
              <div className={cn(
                "text-2xl font-bold min-w-[3rem] text-center",
                isHomeWinner && "text-green-400",
                isTie && "text-yellow-400"
              )}>
                {game.homeScore}
              </div>
            )}
          </div>

          {/* Game info footer */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>Schedule ID: {game.scheduleId}</span>
              </div>
              {isGamePlayed && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  <span>
                    {Math.abs(game.homeScore - game.awayScore)} pt margin
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}