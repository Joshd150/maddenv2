"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, RefreshCw, UserPlus, UserMinus, ArrowRightLeft, TrendingUp, TrendingDown, Search } from "lucide-react"
import { getPlayers, getTeams } from "@/lib/maddenDb"
import type { Player, Team, DevTrait } from "@/lib/madden-types"
import { TeamLogo } from "@/components/league-hub/team-logo"
import { PlayerDetailDialog } from "@/components/league-hub/player-detail-dialog"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { getDevTraitLogoUrl } from "@/lib/teamLogos"

const LEAGUE_ID = process.env.NEXT_PUBLIC_LEAGUE_ID || "25101040"

interface RosterMove {
  id: string
  timestamp: Date
  player: Player
  fromTeam: Team | null
  toTeam: Team | null
  moveType: "signed" | "released" | "traded" | "claimed" | "promoted" | "demoted" | "injured_reserve" | "activated"
  details?: string
  contractDetails?: {
    length: number
    salary: number
    bonus: number
  }
  previousStats?: {
    overall: number
    devTrait: DevTrait
    position: string
  }
}

// Mock data - replace with actual API calls
const mockRosterMoves: RosterMove[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    player: {
      rosterId: 1,
      firstName: "Patrick",
      lastName: "Mahomes",
      position: "QB",
      overall: 99,
      devTrait: 3, // X-Factor
      teamId: 1,
      age: 28,
      yearsPro: 6,
      height: 75,
      weight: 230,
      contractSalary: 45000000,
      contractLength: 5,
      contractYearsLeft: 3
    } as Player,
    fromTeam: null,
    toTeam: { teamId: 1, displayName: "Kansas City Chiefs", abbrName: "KC" } as Team,
    moveType: "signed",
    details: "Signed to 5-year extension",
    contractDetails: {
      length: 5,
      salary: 45000000,
      bonus: 10000000
    }
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    player: {
      rosterId: 2,
      firstName: "Josh",
      lastName: "Gordon",
      position: "WR",
      overall: 78,
      devTrait: 1, // Star
      teamId: 0,
      age: 32,
      yearsPro: 10,
      height: 75,
      weight: 225,
      contractSalary: 0,
      contractLength: 0,
      contractYearsLeft: 0
    } as Player,
    fromTeam: { teamId: 2, displayName: "New England Patriots", abbrName: "NE" } as Team,
    toTeam: null,
    moveType: "released",
    details: "Released due to salary cap constraints"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    player: {
      rosterId: 3,
      firstName: "Derrick",
      lastName: "Henry",
      position: "HB",
      overall: 91,
      devTrait: 2, // Superstar
      teamId: 3,
      age: 30,
      yearsPro: 8,
      height: 75,
      weight: 247,
      contractSalary: 8000000,
      contractLength: 2,
      contractYearsLeft: 1
    } as Player,
    fromTeam: { teamId: 4, displayName: "Tennessee Titans", abbrName: "TEN" } as Team,
    toTeam: { teamId: 3, displayName: "Baltimore Ravens", abbrName: "BAL" } as Team,
    moveType: "traded",
    details: "Traded for 2025 3rd round pick"
  }
]

function getDevTraitName(trait: DevTrait): string {
  switch (trait) {
    case 0: return "Normal"
    case 1: return "Star"
    case 2: return "Superstar"
    case 3: return "X-Factor"
    default: return "Normal"
  }
}

function getMoveTypeIcon(moveType: string) {
  switch (moveType) {
    case "signed": return <UserPlus className="w-4 h-4 text-green-500" />
    case "released": return <UserMinus className="w-4 h-4 text-red-500" />
    case "traded": return <ArrowRightLeft className="w-4 h-4 text-blue-500" />
    case "claimed": return <TrendingUp className="w-4 h-4 text-purple-500" />
    case "promoted": return <TrendingUp className="w-4 h-4 text-green-500" />
    case "demoted": return <TrendingDown className="w-4 h-4 text-orange-500" />
    case "injured_reserve": return <UserMinus className="w-4 h-4 text-red-500" />
    case "activated": return <UserPlus className="w-4 h-4 text-green-500" />
    default: return <ArrowRightLeft className="w-4 h-4" />
  }
}

function getMoveTypeColor(moveType: string) {
  switch (moveType) {
    case "signed": return "bg-green-500"
    case "released": return "bg-red-500"
    case "traded": return "bg-blue-500"
    case "claimed": return "bg-purple-500"
    case "promoted": return "bg-green-500"
    case "demoted": return "bg-orange-500"
    case "injured_reserve": return "bg-red-500"
    case "activated": return "bg-green-500"
    default: return "bg-gray-500"
  }
}

function formatMoney(amount: number) {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  return `$${(amount / 1_000).toFixed(0)}K`
}

function RosterMoveCard({ move }: { move: RosterMove }) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await getTeams(LEAGUE_ID)
        setAllTeams(teams)
      } catch (error) {
        console.error("Failed to load teams:", error)
      }
    }
    loadTeams()
  }, [])

  const getTeamDisplay = (team: Team | null) => {
    if (!team) return "Free Agent"
    return (
      <div className="flex items-center gap-2">
        <TeamLogo teamAbbr={team.abbrName} width={20} height={20} />
        <span>{team.displayName}</span>
      </div>
    )
  }

  return (
    <>
      <Card className="nfl-card hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {getMoveTypeIcon(move.moveType)}
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-white", getMoveTypeColor(move.moveType))}>
                    {move.moveType.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {move.timestamp.toLocaleDateString()} at {move.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Player Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={getDevTraitLogoUrl(getDevTraitName(move.player.devTrait))}
                    alt={`${getDevTraitName(move.player.devTrait)} Dev Trait`}
                    width={24}
                    height={24}
                  />
                  <div>
                    <div className="font-bold text-lg">
                      {move.player.firstName} {move.player.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {move.player.position} • {move.player.overall} OVR • {getDevTraitName(move.player.devTrait)}
                    </div>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div>Age: {move.player.age} years</div>
                  <div>Experience: {move.player.yearsPro} seasons</div>
                  <div>Height: {Math.floor(move.player.height / 12)}'{move.player.height % 12}"</div>
                  <div>Weight: {move.player.weight} lbs</div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedPlayer(move.player)}
              >
                View Player Card
              </Button>
            </div>

            {/* Move Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Transaction Details</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">From:</div>
                  {getTeamDisplay(move.fromTeam)}
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">To:</div>
                  {getTeamDisplay(move.toTeam)}
                </div>
                {move.details && (
                  <div>
                    <div className="text-sm font-medium mb-1">Details:</div>
                    <div className="text-sm text-muted-foreground">{move.details}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contract Information</h3>
              <div className="space-y-2">
                {move.contractDetails ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm">Length:</span>
                      <span className="text-sm font-medium">{move.contractDetails.length} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Salary:</span>
                      <span className="text-sm font-medium">{formatMoney(move.contractDetails.salary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Bonus:</span>
                      <span className="text-sm font-medium">{formatMoney(move.contractDetails.bonus)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm">Current Salary:</span>
                      <span className="text-sm font-medium">{formatMoney(move.player.contractSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Years Left:</span>
                      <span className="text-sm font-medium">{move.player.contractYearsLeft}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPlayer && (
        <PlayerDetailDialog
          player={selectedPlayer}
          teams={allTeams}
          leagueId={LEAGUE_ID}
          onClose={() => setSelectedPlayer(null)}
          onInitiateCompare={() => {}}
          onRemoveComparePlayer={() => {}}
        />
      )}
    </>
  )
}

export default function RosterMovesPage() {
  const [rosterMoves, setRosterMoves] = useState<RosterMove[]>(mockRosterMoves)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMoveType, setFilterMoveType] = useState("all")
  const [filterTeam, setFilterTeam] = useState("all")

  const filteredMoves = useMemo(() => {
    return rosterMoves.filter((move) => {
      const matchesSearch = 
        move.player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        move.player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        move.fromTeam?.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        move.toTeam?.displayName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesMoveType = filterMoveType === "all" || move.moveType === filterMoveType

      const matchesTeam = filterTeam === "all" || 
        move.fromTeam?.displayName === filterTeam ||
        move.toTeam?.displayName === filterTeam

      return matchesSearch && matchesMoveType && matchesTeam
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [rosterMoves, searchTerm, filterMoveType, filterTeam])

  useEffect(() => {
    const loadRosterMoves = async () => {
      setLoading(true)
      setError(null)
      try {
        // TODO: Implement actual API calls to fetch roster moves
        // const fetchedMoves = await getRosterMoves(LEAGUE_ID)
        // setRosterMoves(fetchedMoves)
      } catch (err: any) {
        console.error("RosterMovesPage: Error fetching roster moves:", err)
        setError(`Failed to load roster moves: ${err?.message || String(err)}.`)
      } finally {
        setLoading(false)
      }
    }
    loadRosterMoves()
  }, [refreshTrigger])

  const moveTypes = ["all", "signed", "released", "traded", "claimed", "promoted", "demoted", "injured_reserve", "activated"]
  const teams = Array.from(new Set([
    ...rosterMoves.map(m => m.fromTeam?.displayName).filter(Boolean),
    ...rosterMoves.map(m => m.toTeam?.displayName).filter(Boolean)
  ])).sort()

  return (
    <div className="min-h-[90vh] nfl-card rounded-xl py-6 px-4 flex flex-col">
      <Card className="border-none bg-transparent mb-6">
        <CardHeader>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Recent Roster Moves
          </CardTitle>
          <CardDescription className="text-lg">
            Track all recent roster adjustments, signings, releases, and transactions.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="nfl-card mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMoveType} onValueChange={setFilterMoveType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by move type" />
              </SelectTrigger>
              <SelectContent>
                {moveTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Move Types" : type.replace("_", " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              disabled={loading}
              variant="default"
              className="nfl-gradient"
            >
              {loading ? "Refreshing..." : "Refresh"}
              {loading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <div className="text-lg text-primary font-semibold">Loading roster moves...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-destructive text-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : filteredMoves.length === 0 ? (
          <Card className="nfl-card">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No roster moves found</p>
                <p className="text-sm text-muted-foreground">Recent roster adjustments will appear here</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-6">
              {filteredMoves.map((move) => (
                <RosterMoveCard key={move.id} move={move} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}