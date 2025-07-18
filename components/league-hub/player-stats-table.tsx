"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { getTeamLogo } from "@/lib/teamLogos"
import Image from "next/image"
import type { Player, Team } from "@/lib/madden-types"
import { getPlayerFullName } from "@/lib/utils"

interface PlayerStatsTableProps {
  stats: any[] // AggregatedPlayerStatEntry[]
  players: Player[] // All players for lookup
  teams: Team[] // All teams for lookup
  columns: { key: string; header: string }[]
  onPlayerClick: (player: Player) => void
  leagueId: string // Pass leagueId for PlayerDetailDialog
}

export function PlayerStatsTable({ stats, players, teams, columns, onPlayerClick, leagueId }: PlayerStatsTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc") // Default to descending for stats

  const sortedStats = useMemo(() => {
    if (!sortKey) {
      return stats // Return as is if no sort key is set (default sorting from parent)
    }
    return [...stats].sort((a, b) => {
      const aValue = a[sortKey] ?? 0
      const bValue = b[sortKey] ?? 0

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
      // Fallback for non-numeric or undefined values
      return 0
    })
  }, [stats, sortKey, sortDirection])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("desc") // Default to descending for new sort key
    }
  }

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.teamId, t])), [teams])

  return (
    <div className="rounded-md border bg-zinc-900 border-primary/20">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800 hover:bg-zinc-800">
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("player.lastName")}
                className="px-0 hover:bg-transparent"
              >
                Player
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Pos</TableHead>
            <TableHead>OVR</TableHead>
            {columns.map((col) => (
              <TableHead key={col.key}>
                <Button variant="ghost" onClick={() => handleSort(col.key)} className="px-0 hover:bg-transparent">
                  {col.header}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 5} className="h-24 text-center text-gray-400">
                No players found with these stats.
              </TableCell>
            </TableRow>
          ) : (
            sortedStats.map((item, index) => {
              const player = item.player
              const team = item.team || teamMap.get(player.teamId) // Use item.team if available, else lookup
              return (
                <TableRow
                  key={item.rosterId}
                  onClick={() => onPlayerClick(player)}
                  className="cursor-pointer hover:bg-zinc-800/50"
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{getPlayerFullName(player)}</TableCell>
                  <TableCell>
                    {team ? (
                      <div className="flex items-center gap-2">
                        <Image
                          src={getTeamLogo(team.abbrName) || "/placeholder.svg"}
                          alt={`${team.displayName} logo`}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                        {team.abbrName}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>{player.playerBestOvr}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {typeof item[col.key] === "number" ? item[col.key].toFixed(1).replace(/\.0$/, "") : "0"}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
