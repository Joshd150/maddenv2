"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Table, TableCell, TableRow } from "@/components/ui/table"
import { getPlayers, getTeams } from "@/lib/maddenDb" // Import from client-side maddenDb
import { TeamLogo } from "@/components/league-hub/team-logo"
import { DevTrait, type Player } from "@/lib/madden-types"
import { AlertCircle } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { POSITIONS } from "@/lib/positions" // Corrected import path

interface PlayerSelectionDialogProps {
  initialPlayer: Player | null // The first player selected for comparison
  onSelectPlayer: (player: Player) => void
  onClose: () => void
}

function getDevTraitName(trait: DevTrait) {
  switch (trait) {
    case DevTrait.NORMAL:
      return "NORMAL"
    case DevTrait.STAR:
      return "STAR"
    case DevTrait.SUPERSTAR:
      return "SUPERSTAR"
    case DevTrait.XFACTOR:
      return "XFACTOR"
    default:
      return "NORMAL"
  }
}

export function PlayerSelectionDialog({ initialPlayer, onSelectPlayer, onClose }: PlayerSelectionDialogProps) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [teamsMap, setTeamsMap] = useState<Record<number, { abbrName: string; displayName: string }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterPosition, setFilterPosition] = useState(initialPlayer?.position || "") // Default to initial player's position

  const leagueId = process.env.NEXT_PUBLIC_LEAGUE_ID!

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    setError(null)
    console.log("PlayerSelectionDialog: Fetching all players and teams...")

    async function fetchAllPlayersAndTeams() {
      if (!leagueId) {
        setError("League ID is not configured. Please set NEXT_PUBLIC_LEAGUE_ID in your .env.local file.")
        setIsLoading(false)
        console.error("PlayerSelectionDialog: League ID missing.")
        return
      }

      try {
        const [fetchedPlayers, fetchedTeams] = await Promise.all([getPlayers(leagueId), getTeams(leagueId)])

        const newTeamsMap: Record<number, { abbrName: string; displayName: string }> = {}
        fetchedTeams.forEach((team) => {
          newTeamsMap[team.teamId] = { abbrName: team.abbrName, displayName: team.displayName }
        })

        if (mounted) {
          setAllPlayers(fetchedPlayers)
          setTeamsMap(newTeamsMap)
          setError(null)
          console.log(
            `PlayerSelectionDialog: Fetched ${fetchedPlayers.length} players and ${fetchedTeams.length} teams.`,
          )
        }
      } catch (err: any) {
        console.error("PlayerSelectionDialog: Error fetching players for selection:", err)
        if (mounted) {
          setError(`Failed to load players: ${err?.message || String(err)}.`)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchAllPlayersAndTeams()
    return () => {
      mounted = false
    }
  }, [leagueId])

  const filteredPlayers = useMemo(() => {
    let players = allPlayers.filter((p) => p.rosterId !== initialPlayer?.rosterId) // Exclude the initial player

    if (filterPosition && filterPosition !== "all") {
      // Check for "all" value
      players = players.filter((p) => p.position === filterPosition)
    }

    if (search) {
      players = players.filter((p) => p.fullName.toLowerCase().includes(search.toLowerCase()))
    }

    // Sort by OVR descending
    players.sort((a, b) => (b.playerBestOvr || 0) - (a.playerBestOvr || 0))

    return players
  }, [allPlayers, search, filterPosition, initialPlayer])

  return (
    <Dialog open={!!initialPlayer} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-lg lg:max-w-xl bg-zinc-900 border-primary/20 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Select Player for Comparison</DialogTitle>
          <DialogDescription className="text-center">
            Comparing {initialPlayer?.fullName} ({initialPlayer?.position})
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mb-4">
          <Input
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm focus:ring-2 focus:ring-primary"
            type="search"
            placeholder="Search player by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={filterPosition} onValueChange={setFilterPosition}>
            <SelectTrigger className="w-full bg-zinc-800 border-primary/20">
              <SelectValue placeholder="Filter by position" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-primary/20">
              <SelectItem value="all">All Positions</SelectItem> {/* Updated to a non-empty string */}
              {POSITIONS.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-lg text-primary animate-pulse">
              Loading players...
            </div>
          ) : error ? (
            <div className="text-red-500 bg-red-950/50 border border-red-500/50 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No players found matching your criteria.
            </div>
          ) : (
            <Table className="min-w-full text-left text-zinc-200">
              <thead>
                <tr>
                  <th className="px-4 py-3">OVR</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">POS</th>
                  <th className="px-4 py-3">Team</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <TableRow
                    key={player.rosterId}
                    className="border-t border-zinc-700 hover:bg-zinc-700/50 transition cursor-pointer"
                    onClick={() => onSelectPlayer(player)}
                  >
                    <TableCell className="px-4 py-3 font-bold text-green-400">{player.playerBestOvr}</TableCell>
                    <TableCell className="px-4 py-3">{player.fullName}</TableCell>
                    <TableCell className="px-4 py-3">{player.position}</TableCell>
                    <TableCell className="px-4 py-3">
                      {player.teamId && teamsMap[player.teamId] ? (
                        <div className="flex items-center gap-2">
                          <TeamLogo teamAbbr={teamsMap[player.teamId].abbrName} width={20} height={20} />
                          <span className="hidden sm:inline">{teamsMap[player.teamId].abbrName}</span>
                        </div>
                      ) : (
                        "FA"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
