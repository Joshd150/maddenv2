"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Search, Settings, Award, Target } from "lucide-react"
import { getPlayers, getTeams } from "@/lib/maddenDb"
import type { Player, Team } from "@/lib/madden-types"
import { TeamLogo } from "@/components/league-hub/team-logo"
import { PlayerDetailDialog } from "@/components/league-hub/player-detail-dialog"
import { cn } from "@/lib/utils"

const LEAGUE_ID = process.env.NEXT_PUBLIC_LEAGUE_ID || "25101040"

interface RatingAdjustment {
  id: string
  timestamp: Date
  player: Player
  adjustments: {
    attribute: string
    oldValue: number
    newValue: number
    change: number
  }[]
  reason?: string
  adjustedBy: string
}

// Mock data - replace with actual API calls
const mockRatingAdjustments: RatingAdjustment[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    player: {
      rosterId: 1,
      firstName: "Patrick",
      lastName: "Mahomes",
      position: "QB",
      overall: 99,
      playerBestOvr: 99,
      teamId: 1,
      age: 28,
      yearsPro: 6,
      height: 75,
      weight: 230,
      speedRating: 83,
      throwPowerRating: 97,
      throwAccRating: 92
    } as Player,
    adjustments: [
      { attribute: "Speed", oldValue: 81, newValue: 83, change: 2 },
      { attribute: "Throw Power", oldValue: 95, newValue: 97, change: 2 },
      { attribute: "Overall", oldValue: 97, newValue: 99, change: 2 }
    ],
    reason: "Performance-based upgrade after playoff performance",
    adjustedBy: "Commissioner"
  },
  {
    id: "2", 
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    player: {
      rosterId: 2,
      firstName: "Josh",
      lastName: "Allen",
      position: "QB", 
      overall: 95,
      playerBestOvr: 95,
      teamId: 2,
      age: 27,
      yearsPro: 5,
      height: 77,
      weight: 237,
      speedRating: 85,
      throwPowerRating: 99,
      throwAccRating: 88
    } as Player,
    adjustments: [
      { attribute: "Throw Accuracy", oldValue: 86, newValue: 88, change: 2 }
    ],
    reason: "Accuracy improvement based on recent games",
    adjustedBy: "Admin"
  }
]

function RatingAdjustmentCard({ adjustment }: { adjustment: RatingAdjustment }) {
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

  const team = allTeams.find(t => t.teamId === adjustment.player.teamId)

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-500"
    if (change < 0) return "text-red-500"
    return "text-gray-500"
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return null
  }

  return (
    <>
      <Card className="border hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-bold text-primary">{adjustment.player.position}</span>
              </div>
              <div>
                <div className="font-bold text-lg">
                  {adjustment.player.firstName} {adjustment.player.lastName}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {team && <TeamLogo teamAbbr={team.abbrName || team.teamAbbr} width={16} height={16} />}
                  <span>{team?.displayName || "Free Agent"}</span>
                  <span>•</span>
                  <span>{adjustment.player.overall} OVR</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {adjustment.timestamp.toLocaleDateString()} at {adjustment.timestamp.toLocaleTimeString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Adjusted by {adjustment.adjustedBy}
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <h4 className="font-semibold text-sm">Rating Changes:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {adjustment.adjustments.map((adj, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    {getChangeIcon(adj.change)}
                    <span className="font-medium text-sm">{adj.attribute}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{adj.oldValue}</span>
                    <span className="text-sm">→</span>
                    <span className="font-bold">{adj.newValue}</span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getChangeColor(adj.change))}
                    >
                      {adj.change > 0 ? '+' : ''}{adj.change}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {adjustment.reason && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Reason:</h4>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                {adjustment.reason}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setSelectedPlayer(adjustment.player)}
          >
            View Player Details
          </Button>
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

export default function RatingAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<RatingAdjustment[]>(mockRatingAdjustments)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTimeframe, setFilterTimeframe] = useState("all")
  const [filterAdjuster, setFilterAdjuster] = useState("all")

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adjustment) => {
      const matchesSearch = 
        adjustment.player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adjustment.player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adjustment.adjustments.some(adj => adj.attribute.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesTimeframe = filterTimeframe === "all" || (() => {
        const now = new Date()
        const adjustmentTime = adjustment.timestamp
        switch (filterTimeframe) {
          case "5min":
            return (now.getTime() - adjustmentTime.getTime()) <= 5 * 60 * 1000
          case "1hour":
            return (now.getTime() - adjustmentTime.getTime()) <= 60 * 60 * 1000
          case "24hour":
            return (now.getTime() - adjustmentTime.getTime()) <= 24 * 60 * 60 * 1000
          default:
            return true
        }
      })()

      const matchesAdjuster = filterAdjuster === "all" || adjustment.adjustedBy === filterAdjuster

      return matchesSearch && matchesTimeframe && matchesAdjuster
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [adjustments, searchTerm, filterTimeframe, filterAdjuster])

  useEffect(() => {
    const loadAdjustments = async () => {
      setLoading(true)
      setError(null)
      try {
        // TODO: Implement actual API calls to fetch rating adjustments
        // const fetchedAdjustments = await getRatingAdjustments(LEAGUE_ID)
        // setAdjustments(fetchedAdjustments)
      } catch (err: any) {
        console.error("RatingAdjustmentsPage: Error fetching adjustments:", err)
        setError(`Failed to load rating adjustments: ${err?.message || String(err)}.`)
      } finally {
        setLoading(false)
      }
    }
    loadAdjustments()
  }, [refreshTrigger])

  const adjusters = Array.from(new Set(adjustments.map(a => a.adjustedBy))).sort()

  return (
    <div className="min-h-[90vh] bg-background rounded-xl py-6 px-4 flex flex-col">
      <Card className="border-none bg-transparent mb-6">
        <CardHeader>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Rating Adjustments
          </CardTitle>
          <CardDescription className="text-lg">
            Track all player rating changes and adjustments made to the league.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="border mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search players or attributes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="5min">Last 5 Minutes</SelectItem>
                <SelectItem value="1hour">Last Hour</SelectItem>
                <SelectItem value="24hour">Last 24 Hours</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAdjuster} onValueChange={setFilterAdjuster}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by adjuster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Adjusters</SelectItem>
                {adjusters.map((adjuster) => (
                  <SelectItem key={adjuster} value={adjuster}>
                    {adjuster}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              disabled={loading}
              variant="default"
              className="bg-primary hover:bg-primary/90"
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
            <div className="text-lg text-primary font-semibold">Loading rating adjustments...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-destructive text-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : filteredAdjustments.length === 0 ? (
          <Card className="border">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No rating adjustments found</p>
                <p className="text-sm text-muted-foreground">Recent player rating changes will appear here</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-6">
              {filteredAdjustments.map((adjustment) => (
                <RatingAdjustmentCard key={adjustment.id} adjustment={adjustment} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}