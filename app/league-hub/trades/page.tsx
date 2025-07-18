"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, ArrowRightLeft, Users, Award, Target } from "lucide-react"
import { getPlayers, getTeams } from "@/lib/maddenDb"
import type { Player, Team } from "@/lib/madden-types"
import { TeamLogo } from "@/components/league-hub/team-logo"
import { PlayerDetailDialog } from "@/components/league-hub/player-detail-dialog"
import { cn } from "@/lib/utils"

const LEAGUE_ID = process.env.NEXT_PUBLIC_LEAGUE_ID || "25101040"

interface Trade {
  id: string
  timestamp: Date
  status: "pending" | "approved" | "rejected"
  fromTeam: Team
  toTeam: Team
  playersGiven: Player[]
  playersReceived: Player[]
  draftPicksGiven: DraftPick[]
  draftPicksReceived: DraftPick[]
  tradeValue: number // -100 to 100, negative favors receiving team
}

interface WaiverMove {
  id: string
  timestamp: Date
  player: Player
  fromTeam: Team | null
  toTeam: Team
  waiverPriority: number
  claimType: "add" | "drop" | "claim"
}

interface DraftPick {
  round: number
  pick: number
  year: number
  originalTeam: Team
}

// Mock data - replace with actual API calls
const mockTrades: Trade[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    status: "approved",
    fromTeam: { teamId: 1, displayName: "Kansas City Chiefs", abbrName: "KC" } as Team,
    toTeam: { teamId: 2, displayName: "Buffalo Bills", abbrName: "BUF" } as Team,
    playersGiven: [],
    playersReceived: [],
    draftPicksGiven: [{ round: 1, pick: 15, year: 2025, originalTeam: { displayName: "Kansas City Chiefs" } as Team }],
    draftPicksReceived: [{ round: 2, pick: 45, year: 2025, originalTeam: { displayName: "Buffalo Bills" } as Team }],
    tradeValue: -25
  }
]

const mockWaiverMoves: WaiverMove[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    player: {} as Player,
    fromTeam: null,
    toTeam: { teamId: 1, displayName: "Kansas City Chiefs", abbrName: "KC" } as Team,
    waiverPriority: 1,
    claimType: "claim"
  }
]

function TradeValueMeter({ value, className }: { value: number; className?: string }) {
  const getValueColor = (val: number) => {
    if (val < -50) return "text-red-500"
    if (val < -20) return "text-orange-500"
    if (val < 20) return "text-yellow-500"
    if (val < 50) return "text-lime-500"
    return "text-green-500"
  }

  const getValueText = (val: number) => {
    if (val < -50) return "Heavily Favors Receiving Team"
    if (val < -20) return "Favors Receiving Team"
    if (val < 20) return "Fair Trade"
    if (val < 50) return "Favors Giving Team"
    return "Heavily Favors Giving Team"
  }

  const progressValue = ((value + 100) / 200) * 100

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Trade Value Analysis</span>
        <span className={cn("text-sm font-bold", getValueColor(value))}>
          {getValueText(value)}
        </span>
      </div>
      <div className="relative">
        <Progress value={progressValue} className="h-3" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-3 bg-white border border-gray-400"></div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Favors Receiving</span>
        <span>Fair</span>
        <span>Favors Giving</span>
      </div>
    </div>
  )
}

function TradeCard({ trade }: { trade: Trade }) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500"
      case "rejected": return "bg-red-500"
      case "pending": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <>
      <Card className="nfl-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Trade Details
            </CardTitle>
            <Badge className={cn("text-white", getStatusColor(trade.status))}>
              {trade.status.toUpperCase()}
            </Badge>
          </div>
          <CardDescription>
            {trade.timestamp.toLocaleDateString()} at {trade.timestamp.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TeamLogo teamAbbr={trade.fromTeam.abbrName} width={24} height={24} />
                <span className="font-semibold">{trade.fromTeam.displayName} Gives:</span>
              </div>
              <div className="space-y-2">
                {trade.playersGiven.map((player) => (
                  <Button
                    key={player.rosterId}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    {player.firstName} {player.lastName} - {player.position} ({player.overall} OVR)
                  </Button>
                ))}
                {trade.draftPicksGiven.map((pick, index) => (
                  <div key={index} className="p-2 border rounded-md">
                    <span className="font-medium">
                      {pick.year} Round {pick.round}, Pick {pick.pick}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TeamLogo teamAbbr={trade.toTeam.abbrName} width={24} height={24} />
                <span className="font-semibold">{trade.toTeam.displayName} Receives:</span>
              </div>
              <div className="space-y-2">
                {trade.playersReceived.map((player) => (
                  <Button
                    key={player.rosterId}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    {player.firstName} {player.lastName} - {player.position} ({player.overall} OVR)
                  </Button>
                ))}
                {trade.draftPicksReceived.map((pick, index) => (
                  <div key={index} className="p-2 border rounded-md">
                    <span className="font-medium">
                      {pick.year} Round {pick.round}, Pick {pick.pick}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />
          <TradeValueMeter value={trade.tradeValue} />
        </CardContent>
      </Card>

      {selectedPlayer && (
        <PlayerDetailDialog
          player={selectedPlayer}
          teams={[trade.fromTeam, trade.toTeam]}
          leagueId={LEAGUE_ID}
          onClose={() => setSelectedPlayer(null)}
          onInitiateCompare={() => {}}
          onRemoveComparePlayer={() => {}}
        />
      )}
    </>
  )
}

function WaiverMoveCard({ move }: { move: WaiverMove }) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const getClaimTypeIcon = (type: string) => {
    switch (type) {
      case "add": return <TrendingUp className="w-4 h-4 text-green-500" />
      case "drop": return <TrendingDown className="w-4 h-4 text-red-500" />
      case "claim": return <Target className="w-4 h-4 text-blue-500" />
      default: return <Users className="w-4 h-4" />
    }
  }

  return (
    <>
      <Card className="nfl-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getClaimTypeIcon(move.claimType)}
              <div>
                <div className="font-semibold">
                  {move.claimType.toUpperCase()}: {move.player.firstName} {move.player.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {move.fromTeam ? `${move.fromTeam.displayName} → ` : "Free Agent → "}
                  {move.toTeam.displayName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Priority #{move.waiverPriority}</div>
              <div className="text-xs text-muted-foreground">
                {move.timestamp.toLocaleDateString()}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => setSelectedPlayer(move.player)}
          >
            View Player Details
          </Button>
        </CardContent>
      </Card>

      {selectedPlayer && (
        <PlayerDetailDialog
          player={selectedPlayer}
          teams={[move.fromTeam, move.toTeam].filter(Boolean) as Team[]}
          leagueId={LEAGUE_ID}
          onClose={() => setSelectedPlayer(null)}
          onInitiateCompare={() => {}}
          onRemoveComparePlayer={() => {}}
        />
      )}
    </>
  )
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>(mockTrades)
  const [waiverMoves, setWaiverMoves] = useState<WaiverMove[]>(mockWaiverMoves)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const loadTradesData = async () => {
      setLoading(true)
      setError(null)
      try {
        // TODO: Implement actual API calls to fetch trades and waiver moves
        // const [fetchedTrades, fetchedWaiverMoves] = await Promise.all([
        //   getTrades(LEAGUE_ID),
        //   getWaiverMoves(LEAGUE_ID)
        // ])
        // setTrades(fetchedTrades)
        // setWaiverMoves(fetchedWaiverMoves)
      } catch (err: any) {
        console.error("TradesPage: Error fetching trades data:", err)
        setError(`Failed to load trades data: ${err?.message || String(err)}.`)
      } finally {
        setLoading(false)
      }
    }
    loadTradesData()
  }, [refreshTrigger])

  return (
    <div className="min-h-[90vh] nfl-card rounded-xl py-6 px-4 flex flex-col">
      <Card className="border-none bg-transparent mb-6">
        <CardHeader>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Trades & Transactions
          </CardTitle>
          <CardDescription className="text-lg">
            View recent trades, waiver moves, and transaction analysis.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end px-2 mb-6">
        <Button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          disabled={loading}
          variant="default"
          className="text-sm nfl-gradient"
        >
          {loading ? "Refreshing..." : "Refresh"}
          {loading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <div className="text-lg text-primary font-semibold">Loading trades data...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-destructive text-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : (
          <Tabs defaultValue="trades" className="w-full">
            <TabsList className="grid w-full grid-cols-2 nfl-card mb-6">
              <TabsTrigger value="trades" className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Trades
              </TabsTrigger>
              <TabsTrigger value="waivers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Waiver Moves
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trades" className="space-y-6">
              <div className="grid gap-6">
                {trades.length === 0 ? (
                  <Card className="nfl-card">
                    <CardContent className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg text-muted-foreground">No trades found</p>
                        <p className="text-sm text-muted-foreground">Recent trades will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  trades.map((trade) => (
                    <TradeCard key={trade.id} trade={trade} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="waivers" className="space-y-6">
              <div className="grid gap-4">
                {waiverMoves.length === 0 ? (
                  <Card className="nfl-card">
                    <CardContent className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg text-muted-foreground">No waiver moves found</p>
                        <p className="text-sm text-muted-foreground">Recent waiver claims will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  waiverMoves.map((move) => (
                    <WaiverMoveCard key={move.id} move={move} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}