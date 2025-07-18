"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPassingStats,
  getRushingStats,
  getReceivingStats,
  getDefensiveStats,
  getKickingStats,
  getPuntingStats,
  getPlayers,
  getTeams,
} from "@/lib/maddenDb"
import { type PlayerStatEntry, PlayerStatType, type Player, type Team } from "@/lib/madden-types"
import { PlayerStatsTable } from "@/components/league-hub/player-stats-table"
import { getTeamLogo } from "@/lib/teamLogos"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { aggregatePlayerStats } from "@/lib/utils" // Import the aggregation utility
import { PlayerDetailDialog } from "@/components/league-hub/player-detail-dialog" // Import PlayerDetailDialog

// Use NEXT_PUBLIC_LEAGUE_ID consistently
const LEAGUE_ID = process.env.NEXT_PUBLIC_LEAGUE_ID || "25101040" // Default for local testing

// Define a new type for aggregated player stats for the table
interface AggregatedPlayerStatEntry {
  rosterId: number
  player: Player
  team: Team | undefined // Team can be undefined if player is a Free Agent
  [statKey: string]: any // For aggregated stat values
}

type StatCategory = {
  key: PlayerStatType
  title: string
  fetcher: (leagueId: string) => Promise<PlayerStatEntry[]>
  columns: { key: string; header: string }[]
  defaultSortKey: string // New: default sort key for this category
}

const statCategories: StatCategory[] = [
  {
    key: PlayerStatType.PASSING,
    title: "Passing",
    fetcher: getPassingStats,
    columns: [
      { key: "passComp", header: "Comp" },
      { key: "passAtt", header: "Att" },
      { key: "passYds", header: "Yds" },
      { key: "passTDs", header: "TD" },
      { key: "passInts", header: "INT" },
      { key: "passerRating", header: "RTG" },
    ],
    defaultSortKey: "passYds",
  },
  {
    key: PlayerStatType.RUSHING,
    title: "Rushing",
    fetcher: getRushingStats,
    columns: [
      { key: "rushAtt", header: "Att" },
      { key: "rushYds", header: "Yds" },
      { key: "rushTDs", header: "TD" },
      { key: "rushFum", header: "Fum" },
      { key: "rushYdsPerAtt", header: "Avg" },
    ],
    defaultSortKey: "rushYds",
  },
  {
    key: PlayerStatType.RECEIVING,
    title: "Receiving",
    fetcher: getReceivingStats,
    columns: [
      { key: "recCatches", header: "Rec" },
      { key: "recYds", header: "Yds" },
      { key: "recTDs", header: "TD" },
      { key: "recDrops", header: "Drops" },
    ],
    defaultSortKey: "recYds",
  },
  {
    key: PlayerStatType.DEFENSE,
    title: "Defensive",
    fetcher: getDefensiveStats,
    columns: [
      { key: "defTotalTackles", header: "Tkl" },
      { key: "defSacks", header: "Sck" },
      { key: "defInts", header: "Int" },
      { key: "defFumRec", header: "FR" },
      { key: "defForcedFum", header: "FF" },
      { key: "defTDs", header: "TD" },
      { key: "defDeflections", header: "PD" },
    ],
    defaultSortKey: "defTotalTackles",
  },
  {
    key: PlayerStatType.KICKING,
    title: "Kicking",
    fetcher: getKickingStats,
    columns: [
      { key: "fGMade", header: "FGM" },
      { key: "fGAtt", header: "FGA" },
      { key: "xPMade", header: "XPM" },
      { key: "xPAtt", header: "XPA" },
      { key: "kickPts", header: "Pts" },
    ],
    defaultSortKey: "kickPts",
  },
  {
    key: PlayerStatType.PUNTING,
    title: "Punting",
    fetcher: getPuntingStats,
    columns: [
      { key: "puntAtt", header: "Att" },
      { key: "puntYds", header: "Yds" },
      { key: "puntYdsPerAtt", header: "Avg" },
      { key: "puntNetYdsPerAtt", header: "Net Avg" },
      { key: "puntsIn20", header: "In 20" },
      { key: "puntTBs", header: "TB" },
    ],
    defaultSortKey: "puntYds",
  },
]

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<PlayerStatType>(PlayerStatType.PASSING)
  const [rawStatsData, setRawStatsData] = useState<Record<PlayerStatType, PlayerStatEntry[]>>({
    [PlayerStatType.PASSING]: [],
    [PlayerStatType.RUSHING]: [],
    [PlayerStatType.RECEIVING]: [],
    [PlayerStatType.DEFENSE]: [],
    [PlayerStatType.KICKING]: [],
    [PlayerStatType.PUNTING]: [],
  })
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPosition, setSelectedPosition] = useState("All Positions")
  const [selectedTeam, setSelectedTeam] = useState("All Teams")

  // State for PlayerDetailDialog and comparison
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(null)
  const [comparePlayerForDetail, setComparePlayerForDetail] = useState<Player | null>(null)

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [players, teams] = await Promise.all([getPlayers(LEAGUE_ID), getTeams(LEAGUE_ID)])
        setAllPlayers(players)
        setAllTeams(teams)

        const fetchedRawStats: Record<PlayerStatType, PlayerStatEntry[]> = {
          [PlayerStatType.PASSING]: await getPassingStats(LEAGUE_ID),
          [PlayerStatType.RUSHING]: await getRushingStats(LEAGUE_ID),
          [PlayerStatType.RECEIVING]: await getReceivingStats(LEAGUE_ID),
          [PlayerStatType.DEFENSE]: await getDefensiveStats(LEAGUE_ID),
          [PlayerStatType.KICKING]: await getKickingStats(LEAGUE_ID),
          [PlayerStatType.PUNTING]: await getPuntingStats(LEAGUE_ID),
        }
        setRawStatsData(fetchedRawStats)
      } catch (err) {
        console.error("Failed to load initial data:", err)
        setError(`Failed to load initial data: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  const playerMap = useMemo(() => new Map(allPlayers.map((p) => [p.rosterId, p])), [allPlayers])
  const teamMap = useMemo(() => new Map(allTeams.map((t) => [t.teamId, t])), [allTeams])

  const aggregatedStatsData = useMemo(() => {
    const aggregated: Record<PlayerStatType, AggregatedPlayerStatEntry[]> = {
      [PlayerStatType.PASSING]: [],
      [PlayerStatType.RUSHING]: [],
      [PlayerStatType.RECEIVING]: [],
      [PlayerStatType.DEFENSE]: [],
      [PlayerStatType.KICKING]: [],
      [PlayerStatType.PUNTING]: [],
    }

    for (const statType of Object.values(PlayerStatType)) {
      const rawEntries = rawStatsData[statType]
      if (!rawEntries || rawEntries.length === 0) continue

      const playerStatsMap: Record<number, PlayerStatEntry[]> = {}
      rawEntries.forEach((entry) => {
        const rosterId = entry.rosterId // Declare the variable here
        if (!playerStatsMap[rosterId]) {
          playerStatsMap[rosterId] = []
        }
        playerStatsMap[rosterId].push(entry)
      })

      for (const rosterId in playerStatsMap) {
        const player = playerMap.get(Number(rosterId))
        if (!player) continue

        const playerRawStatsForType = playerStatsMap[rosterId]
        const playerStatsObject = { [statType]: playerRawStatsForType } // Create PlayerStats object for aggregation
        const aggregatedPlayerStats = aggregatePlayerStats(playerStatsObject)

        const team = teamMap.get(player.teamId)

        aggregated[statType].push({
          rosterId: player.rosterId,
          player: player,
          team: team,
          ...aggregatedPlayerStats, // Spread the aggregated stats directly
        })
      }
    }
    return aggregated
  }, [rawStatsData, playerMap, teamMap])

  const filteredAggregatedPlayers = useMemo(() => {
    const currentCategoryKey = activeTab
    let playersWithStats = aggregatedStatsData[currentCategoryKey] || []

    if (searchTerm) {
      playersWithStats = playersWithStats.filter(
        (item) =>
          item.player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.player.lastName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedPosition !== "All Positions") {
      playersWithStats = playersWithStats.filter((item) => item.player.position === selectedPosition)
    }

    if (selectedTeam !== "All Teams") {
      const team = allTeams.find((t) => t.displayName === selectedTeam) // Use displayName for comparison
      if (team) {
        playersWithStats = playersWithStats.filter((item) => item.player.teamId === team.teamId)
      }
    }

    // Sort by the default sort key for the active tab, descending by default
    const currentCategory = statCategories.find((cat) => cat.key === activeTab)
    if (currentCategory && currentCategory.defaultSortKey) {
      const defaultSortKey = currentCategory.defaultSortKey
      playersWithStats.sort((a, b) => {
        const aValue = a[defaultSortKey] || 0
        const bValue = b[defaultSortKey] || 0
        return (bValue as number) - (aValue as number) // Sort descending
      })
    }

    return playersWithStats
  }, [aggregatedStatsData, searchTerm, selectedPosition, selectedTeam, activeTab, allTeams])

  const handlePlayerClickForDetail = (player: Player) => {
    setSelectedPlayerForDetail(player)
    setComparePlayerForDetail(null) // Clear any previous comparison when opening a new player
  }

  const handleInitiateCompare = (player1: Player, player2: Player) => {
    setSelectedPlayerForDetail(player1)
    setComparePlayerForDetail(player2)
  }

  const handleRemoveComparePlayer = () => {
    setComparePlayerForDetail(null)
  }

  const handleCloseDetailDialog = () => {
    setSelectedPlayerForDetail(null)
    setComparePlayerForDetail(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(10vh-64px)]">
        <p>Loading stats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(10vh-64px)] text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 min-h-[90vh]">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Player Statistics
        </h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive player performance data and league leaders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {" "}
        {/* Changed to lg:grid-cols-4 */}
        <Card className="lg:col-span-1 nfl-card">
          {" "}
          {/* Filter card takes 1 column */}
          <CardHeader>
            <CardTitle className="text-xl font-bold">Filter Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                Search Player
              </label>
              <Input
                id="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-foreground mb-2">
                Position
              </label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="w-full nfl-card">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent className="nfl-card">
                  <SelectItem value="All Positions">All Positions</SelectItem>
                  {Array.from(new Set(allPlayers.map((p) => p.position)))
                    .sort()
                    .map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="team" className="block text-sm font-medium text-foreground mb-2">
                Team
              </label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-full nfl-card">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent className="nfl-card">
                  <SelectItem value="All Teams">All Teams</SelectItem>
                  {allTeams
                    .sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? "")) // Sort by displayName
                    .map((team) => (
                      <SelectItem key={team.teamId} value={team.displayName}>
                        {" "}
                        {/* Use displayName */}
                        <div className="flex items-center gap-2">
                          <Image
                            src={getTeamLogo(team.teamAbbr) || "/placeholder.svg"}
                            alt={`${team.displayName} logo`}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                          {team.displayName} {/* Display displayName */}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 nfl-card">
          {" "}
          {/* Stats table takes 3 columns */}
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              {statCategories.find((cat) => cat.key === activeTab)?.title} Leaders
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {" "}
            {/* Added max-height and overflow */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PlayerStatType)}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 nfl-card">
                {statCategories.map((category) => (
                  <TabsTrigger key={category.key} value={category.key} className="font-semibold">
                    {category.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab} className="mt-6">
                <PlayerStatsTable
                  stats={filteredAggregatedPlayers} // Pass aggregated and filtered data
                  players={allPlayers} // Still pass allPlayers for detail dialog
                  teams={allTeams} // Still pass allTeams for detail dialog
                  columns={statCategories.find((cat) => cat.key === activeTab)?.columns || []}
                  onPlayerClick={handlePlayerClickForDetail} // Use new prop
                  leagueId={LEAGUE_ID}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {selectedPlayerForDetail && (
        <PlayerDetailDialog
          player={selectedPlayerForDetail}
          teams={allTeams}
          leagueId={LEAGUE_ID}
          onClose={handleCloseDetailDialog}
          initialComparePlayer={comparePlayerForDetail}
          onInitiateCompare={handleInitiateCompare}
          onRemoveComparePlayer={handleRemoveComparePlayer}
        />
      )}
    </div>
  )
}
