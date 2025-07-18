"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw, Trophy, Crown, Target, Zap } from "lucide-react"
import { getStandings, getTeams, getAllSchedules } from "@/lib/maddenDb"
import type { Standing, Team, MaddenGame } from "@/lib/madden-types"
import { TeamLogo } from "@/components/league-hub/team-logo"
import { cn } from "@/lib/utils"

const LEAGUE_ID = process.env.NEXT_PUBLIC_LEAGUE_ID || "25101040"

interface PlayoffTeam {
  team: Team
  standing: Standing
  seed: number
  conference: 'AFC' | 'NFC'
  division: string
}

interface BracketMatchup {
  id: string
  round: 'wildcard' | 'divisional' | 'conference' | 'superbowl'
  homeTeam?: PlayoffTeam
  awayTeam?: PlayoffTeam
  winner?: PlayoffTeam
  homeScore?: number
  awayScore?: number
  isPlayed: boolean
}

function PlayoffBracketCard({ 
  matchup, 
  onClick 
}: { 
  matchup: BracketMatchup
  onClick: (matchup: BracketMatchup) => void 
}) {
  const getRoundTitle = (round: string) => {
    switch (round) {
      case 'wildcard': return 'Wild Card'
      case 'divisional': return 'Divisional'
      case 'conference': return 'Conference Championship'
      case 'superbowl': return 'Super Bowl'
      default: return round
    }
  }

  const getTeamDisplay = (team?: PlayoffTeam, isWinner?: boolean) => {
    if (!team) {
      return (
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <div className="font-semibold text-muted-foreground">TBD</div>
            <div className="text-sm text-muted-foreground">To Be Determined</div>
          </div>
        </div>
      )
    }

    return (
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300",
        isWinner ? "bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20" : "bg-card border-border hover:border-primary/50"
      )}>
        <div className="relative">
          <TeamLogo teamAbbr={team.team.abbrName || team.team.teamAbbr} width={48} height={48} />
          {isWinner && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className={cn("font-bold text-lg", isWinner && "text-green-400")}>
            {team.team.displayName}
          </div>
          <div className="text-sm text-muted-foreground">
            #{team.seed} {team.conference} • {team.standing.wins}-{team.standing.losses}-{team.standing.ties}
          </div>
        </div>
        {matchup.isPlayed && (
          <div className={cn("text-2xl font-black", isWinner && "text-green-400")}>
            {team === matchup.homeTeam ? matchup.homeScore : matchup.awayScore}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card 
      className="playoff-bracket-card cursor-pointer overflow-hidden"
      onClick={() => onClick(matchup)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg font-bold">
          {getRoundTitle(matchup.round)}
        </CardTitle>
        {matchup.isPlayed && (
          <Badge variant="default" className="mx-auto nfl-gradient">
            FINAL
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {getTeamDisplay(matchup.awayTeam, matchup.winner === matchup.awayTeam)}
        <div className="flex items-center justify-center">
          <div className="w-full h-px bg-border"></div>
          <div className="px-4">
            <Badge variant="outline" className="font-semibold">
              {matchup.isPlayed ? "FINAL" : "VS"}
            </Badge>
          </div>
          <div className="w-full h-px bg-border"></div>
        </div>
        {getTeamDisplay(matchup.homeTeam, matchup.winner === matchup.homeTeam)}
      </CardContent>
    </Card>
  )
}

export default function PlayoffsPage() {
  const [standings, setStandings] = useState<Standing[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [playoffGames, setPlayoffGames] = useState<MaddenGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const loadPlayoffData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [fetchedStandings, fetchedTeams, fetchedSchedules] = await Promise.all([
          getStandings(LEAGUE_ID),
          getTeams(LEAGUE_ID),
          getAllSchedules(LEAGUE_ID)
        ])

        setStandings(fetchedStandings)
        setTeams(fetchedTeams)
        
        // Filter for playoff games (weeks 19-23)
        const playoffs = fetchedSchedules.filter(game => 
          game.weekIndex >= 18 && game.weekIndex <= 22
        )
        setPlayoffGames(playoffs)
      } catch (err: any) {
        console.error("PlayoffsPage: Error fetching playoff data:", err)
        setError(`Failed to load playoff data: ${err?.message || String(err)}.`)
      } finally {
        setLoading(false)
      }
    }
    loadPlayoffData()
  }, [refreshTrigger])

  const playoffTeams = useMemo(() => {
    const teamMap = new Map(teams.map(t => [t.teamId, t]))
    
    // Get top teams from each conference
    const afcTeams = standings
      .filter(s => s.conferenceName?.toLowerCase() === 'afc')
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 7)
      .map((standing, index) => ({
        team: teamMap.get(standing.teamId)!,
        standing,
        seed: index + 1,
        conference: 'AFC' as const,
        division: standing.divisonName || 'Unknown'
      }))
      .filter(pt => pt.team)

    const nfcTeams = standings
      .filter(s => s.conferenceName?.toLowerCase() === 'nfc')
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 7)
      .map((standing, index) => ({
        team: teamMap.get(standing.teamId)!,
        standing,
        seed: index + 1,
        conference: 'NFC' as const,
        division: standing.divisonName || 'Unknown'
      }))
      .filter(pt => pt.team)

    return { afc: afcTeams, nfc: nfcTeams }
  }, [standings, teams])

  const bracketMatchups = useMemo(() => {
    const { afc, nfc } = playoffTeams
    const matchups: BracketMatchup[] = []

    // Wild Card Round (Week 19)
    if (afc.length >= 7 && nfc.length >= 7) {
      // AFC Wild Card
      matchups.push(
        {
          id: 'afc-wc-1',
          round: 'wildcard',
          homeTeam: afc[1], // 2 seed
          awayTeam: afc[6], // 7 seed
          isPlayed: false
        },
        {
          id: 'afc-wc-2',
          round: 'wildcard',
          homeTeam: afc[2], // 3 seed
          awayTeam: afc[5], // 6 seed
          isPlayed: false
        },
        {
          id: 'afc-wc-3',
          round: 'wildcard',
          homeTeam: afc[3], // 4 seed
          awayTeam: afc[4], // 5 seed
          isPlayed: false
        }
      )

      // NFC Wild Card
      matchups.push(
        {
          id: 'nfc-wc-1',
          round: 'wildcard',
          homeTeam: nfc[1], // 2 seed
          awayTeam: nfc[6], // 7 seed
          isPlayed: false
        },
        {
          id: 'nfc-wc-2',
          round: 'wildcard',
          homeTeam: nfc[2], // 3 seed
          awayTeam: nfc[5], // 6 seed
          isPlayed: false
        },
        {
          id: 'nfc-wc-3',
          round: 'wildcard',
          homeTeam: nfc[3], // 4 seed
          awayTeam: nfc[4], // 5 seed
          isPlayed: false
        }
      )

      // Divisional Round (Week 20)
      matchups.push(
        {
          id: 'afc-div-1',
          round: 'divisional',
          homeTeam: afc[0], // 1 seed gets lowest remaining seed
          isPlayed: false
        },
        {
          id: 'afc-div-2',
          round: 'divisional',
          isPlayed: false
        },
        {
          id: 'nfc-div-1',
          round: 'divisional',
          homeTeam: nfc[0], // 1 seed gets lowest remaining seed
          isPlayed: false
        },
        {
          id: 'nfc-div-2',
          round: 'divisional',
          isPlayed: false
        }
      )

      // Conference Championships (Week 21)
      matchups.push(
        {
          id: 'afc-championship',
          round: 'conference',
          isPlayed: false
        },
        {
          id: 'nfc-championship',
          round: 'conference',
          isPlayed: false
        }
      )

      // Super Bowl (Week 23)
      matchups.push({
        id: 'superbowl',
        round: 'superbowl',
        isPlayed: false
      })
    }

    return matchups
  }, [playoffTeams])

  const handleMatchupClick = (matchup: BracketMatchup) => {
    console.log('Clicked matchup:', matchup)
    // TODO: Open detailed game view
  }

  return (
    <div className="min-h-[90vh] space-y-8">
      {/* Hero Header */}
      <div className="hero-gradient rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8" />
            <h1 className="text-4xl font-black">Playoff Bracket</h1>
          </div>
          <p className="text-xl opacity-90 mb-6">
            Automated playoff bracket with live updates and team advancement
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              <span className="font-semibold">{playoffTeams.afc.length + playoffTeams.nfc.length} Teams Qualified</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Auto-Updated Bracket</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-end">
        <Button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          disabled={loading}
          className="nfl-gradient"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Bracket
            </>
          )}
        </Button>
      </div>

      {/* Bracket Content */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            <div className="text-xl font-semibold text-primary">Loading playoff bracket...</div>
            <div className="text-muted-foreground">Analyzing standings and generating matchups</div>
          </div>
        ) : error ? (
          <Card className="nfl-card border-destructive">
            <div className="flex items-center justify-center text-destructive text-lg p-8 text-center">
              <AlertCircle className="h-8 w-8 mr-3" />
              <div>
                <div className="font-semibold mb-2">Error Loading Playoff Data</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          </Card>
        ) : playoffTeams.afc.length === 0 && playoffTeams.nfc.length === 0 ? (
          <Card className="nfl-card">
            <div className="flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
              <Trophy className="h-16 w-16 mb-4" />
              <div className="text-xl font-semibold mb-2">Playoffs Not Yet Determined</div>
              <div>Playoff teams will be automatically populated when the regular season concludes.</div>
            </div>
          </Card>
        ) : (
          <>
            {/* Wild Card Round */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Wild Card Round</h2>
                <Badge variant="outline" className="text-lg px-4 py-1">Week 19</Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {bracketMatchups
                  .filter(m => m.round === 'wildcard')
                  .map(matchup => (
                    <PlayoffBracketCard
                      key={matchup.id}
                      matchup={matchup}
                      onClick={handleMatchupClick}
                    />
                  ))}
              </div>
            </div>

            {/* Divisional Round */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Divisional Round</h2>
                <Badge variant="outline" className="text-lg px-4 py-1">Week 20</Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {bracketMatchups
                  .filter(m => m.round === 'divisional')
                  .map(matchup => (
                    <PlayoffBracketCard
                      key={matchup.id}
                      matchup={matchup}
                      onClick={handleMatchupClick}
                    />
                  ))}
              </div>
            </div>

            {/* Conference Championships */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Conference Championships</h2>
                <Badge variant="outline" className="text-lg px-4 py-1">Week 21</Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {bracketMatchups
                  .filter(m => m.round === 'conference')
                  .map(matchup => (
                    <PlayoffBracketCard
                      key={matchup.id}
                      matchup={matchup}
                      onClick={handleMatchupClick}
                    />
                  ))}
              </div>
            </div>

            {/* Super Bowl */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-2 text-gradient">Super Bowl</h2>
                <Badge variant="default" className="text-lg px-6 py-2 nfl-gradient">Week 23</Badge>
              </div>
              <div className="max-w-2xl mx-auto">
                {bracketMatchups
                  .filter(m => m.round === 'superbowl')
                  .map(matchup => (
                    <div key={matchup.id} className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-lg blur-xl"></div>
                      <PlayoffBracketCard
                        matchup={matchup}
                        onClick={handleMatchupClick}
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Playoff Teams Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="nfl-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">AFC Playoff Teams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {playoffTeams.afc.map((team) => (
                    <div key={team.team.teamId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Badge variant="outline" className="font-bold">#{team.seed}</Badge>
                      <TeamLogo teamAbbr={team.team.abbrName || team.team.teamAbbr} width={32} height={32} />
                      <div className="flex-1">
                        <div className="font-semibold">{team.team.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.standing.wins}-{team.standing.losses}-{team.standing.ties} • {team.division}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="nfl-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">NFC Playoff Teams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {playoffTeams.nfc.map((team) => (
                    <div key={team.team.teamId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Badge variant="outline" className="font-bold">#{team.seed}</Badge>
                      <TeamLogo teamAbbr={team.team.abbrName || team.team.teamAbbr} width={32} height={32} />
                      <div className="flex-1">
                        <div className="font-semibold">{team.team.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.standing.wins}-{team.standing.losses}-{team.standing.ties} • {team.division}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}