"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/league-hub/team-logo"
import { Button } from "@/components/ui/button"
import { Trophy, Target, Shield, Zap, Clock, Users } from "lucide-react"
import type { MaddenGame, Team, PlayerStatEntry, TeamStats } from "@/lib/madden-types"
import { getPlayerStats, getTeamStats } from "@/lib/maddenDb"
import { cn } from "@/lib/utils"

interface EnhancedGameDetailDialogProps {
  game: MaddenGame
  teams: Team[]
  onClose: () => void
  leagueId: string
}

interface GamePlayerStats {
  passing: PlayerStatEntry[]
  rushing: PlayerStatEntry[]
  receiving: PlayerStatEntry[]
  defense: PlayerStatEntry[]
  kicking: PlayerStatEntry[]
}

interface TeamGameStats {
  homeStats?: TeamStats
  awayStats?: TeamStats
}

export function EnhancedGameDetailDialog({
  game,
  teams,
  onClose,
  leagueId,
}: EnhancedGameDetailDialogProps) {
  const [playerStats, setPlayerStats] = useState<GamePlayerStats>({
    passing: [],
    rushing: [],
    receiving: [],
    defense: [],
    kicking: []
  })
  const [teamStats, setTeamStats] = useState<TeamGameStats>({})
  const [loading, setLoading] = useState(true)

  const homeTeam = teams.find(t => t.teamId === game.homeTeamId)
  const awayTeam = teams.find(t => t.teamId === game.awayTeamId)

  useEffect(() => {
    const loadGameData = async () => {
      setLoading(true)
      try {
        // Load team stats for this specific game
        const allTeamStats = await getTeamStats(leagueId)
        const gameTeamStats = allTeamStats.filter(stat => 
          stat.scheduleId === game.scheduleId && 
          stat.weekIndex === game.weekIndex &&
          stat.seasonIndex === game.seasonIndex
        )
        
        setTeamStats({
          homeStats: gameTeamStats.find(stat => stat.teamId === game.homeTeamId),
          awayStats: gameTeamStats.find(stat => stat.teamId === game.awayTeamId)
        })

        // For now, we'll show placeholder data since we need to implement game-specific player stats
        setPlayerStats({
          passing: [],
          rushing: [],
          receiving: [],
          defense: [],
          kicking: []
        })
      } catch (error) {
        console.error("Failed to load game data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadGameData()
  }, [game, leagueId])

  if (!homeTeam || !awayTeam) {
    return null
  }

  const isGamePlayed = game.homeScore > 0 || game.awayScore > 0
  const homeWon = game.homeScore > game.awayScore
  const awayWon = game.awayScore > game.homeScore
  const isTie = game.homeScore === game.awayScore && isGamePlayed

  const StatComparison = ({ 
    label, 
    homeValue, 
    awayValue, 
    format = (val: number) => val.toString(),
    higherIsBetter = true 
  }: {
    label: string
    homeValue: number
    awayValue: number
    format?: (val: number) => string
    higherIsBetter?: boolean
  }) => {
    const total = homeValue + awayValue
    const homePercent = total > 0 ? (homeValue / total) * 100 : 50
    const awayPercent = total > 0 ? (awayValue / total) * 100 : 50
    
    const homeIsBetter = higherIsBetter ? homeValue > awayValue : homeValue < awayValue
    const awayIsBetter = higherIsBetter ? awayValue > homeValue : awayValue < homeValue

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 text-right">
            <span className={cn("font-bold", awayIsBetter && "text-green-400")}>
              {format(awayValue)}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${awayPercent}%` }}
              />
            </div>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-500 ml-auto"
                style={{ width: `${homePercent}%` }}
              />
            </div>
          </div>
          <div className="flex-1 text-left">
            <span className={cn("font-bold", homeIsBetter && "text-green-400")}>
              {format(homeValue)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="nfl-gradient p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center">
              Game Breakdown
            </DialogTitle>
            <div className="flex items-center justify-center gap-8 mt-4">
              <div className="flex items-center gap-3">
                <TeamLogo teamAbbr={awayTeam.abbrName || awayTeam.teamAbbr} width={48} height={48} />
                <div className="text-center">
                  <div className="text-lg font-semibold">{awayTeam.displayName}</div>
                  <div className={cn("text-3xl font-bold", awayWon && "text-yellow-300")}>
                    {game.awayScore}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-white/80">VS</div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">{homeTeam.displayName}</div>
                  <div className={cn("text-3xl font-bold", homeWon && "text-yellow-300")}>
                    {game.homeScore}
                  </div>
                </div>
                <TeamLogo teamAbbr={homeTeam.abbrName || homeTeam.teamAbbr} width={48} height={48} />
              </div>
            </div>
            <div className="text-center mt-2">
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {isGamePlayed ? (isTie ? "Final - Tie" : "Final") : "Upcoming"}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="team-stats" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Team Stats
              </TabsTrigger>
              <TabsTrigger value="player-stats" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Player Stats
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="nfl-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TeamLogo teamAbbr={awayTeam.abbrName || awayTeam.teamAbbr} width={24} height={24} />
                      {awayTeam.displayName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Record</span>
                        <span className="font-semibold">{awayTeam.wins}-{awayTeam.losses}-{awayTeam.ties}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Division Rank</span>
                        <span className="font-semibold">#{awayTeam.divisionRank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conference Rank</span>
                        <span className="font-semibold">#{awayTeam.conferenceRank}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="nfl-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TeamLogo teamAbbr={homeTeam.abbrName || homeTeam.teamAbbr} width={24} height={24} />
                      {homeTeam.displayName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Record</span>
                        <span className="font-semibold">{homeTeam.wins}-{homeTeam.losses}-{homeTeam.ties}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Division Rank</span>
                        <span className="font-semibold">#{homeTeam.divisionRank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conference Rank</span>
                        <span className="font-semibold">#{homeTeam.conferenceRank}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isGamePlayed && (
                <Card className="nfl-card">
                  <CardHeader>
                    <CardTitle>Game Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-lg">
                        {homeWon && `${homeTeam.displayName} defeats ${awayTeam.displayName}`}
                        {awayWon && `${awayTeam.displayName} defeats ${homeTeam.displayName}`}
                        {isTie && `${homeTeam.displayName} and ${awayTeam.displayName} tie`}
                      </div>
                      <div className="text-4xl font-bold text-primary">
                        {game.awayScore} - {game.homeScore}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="team-stats" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="nfl-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Team Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {teamStats.awayStats && teamStats.homeStats ? (
                      <>
                        <StatComparison
                          label="Total Yards"
                          awayValue={teamStats.awayStats.offTotalYds || 0}
                          homeValue={teamStats.homeStats.offTotalYds || 0}
                        />
                        <StatComparison
                          label="Passing Yards"
                          awayValue={teamStats.awayStats.offPassYds || 0}
                          homeValue={teamStats.homeStats.offPassYds || 0}
                        />
                        <StatComparison
                          label="Rushing Yards"
                          awayValue={teamStats.awayStats.offRushYds || 0}
                          homeValue={teamStats.homeStats.offRushYds || 0}
                        />
                        <StatComparison
                          label="Turnovers"
                          awayValue={teamStats.awayStats.tOGiveaways || 0}
                          homeValue={teamStats.homeStats.tOGiveaways || 0}
                          higherIsBetter={false}
                        />
                        <StatComparison
                          label="Penalties"
                          awayValue={teamStats.awayStats.penalties || 0}
                          homeValue={teamStats.homeStats.penalties || 0}
                          higherIsBetter={false}
                        />
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        {loading ? "Loading team stats..." : "Team stats not available for this game"}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="nfl-card">
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center text-muted-foreground">
                        Advanced team metrics coming soon...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="player-stats" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="nfl-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TeamLogo teamAbbr={awayTeam.abbrName || awayTeam.teamAbbr} width={24} height={24} />
                      {awayTeam.displayName} Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      Player stats for this game coming soon...
                    </div>
                  </CardContent>
                </Card>

                <Card className="nfl-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TeamLogo teamAbbr={homeTeam.abbrName || homeTeam.teamAbbr} width={24} height={24} />
                      {homeTeam.displayName} Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      Player stats for this game coming soon...
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <Card className="nfl-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Game Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isGamePlayed ? (
                      <div className="text-center">
                        <div className="text-lg font-semibold mb-4">
                          {homeWon && `${homeTeam.displayName} Victory`}
                          {awayWon && `${awayTeam.displayName} Victory`}
                          {isTie && "Game Ended in Tie"}
                        </div>
                        <div className="text-muted-foreground">
                          Detailed game analysis and key plays coming soon...
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Game preview and predictions coming soon...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}