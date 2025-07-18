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
    <div className="rounded-lg border border-border nfl-card overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-muted/50">
            <TableHead className="w-[50px] sm:w-[60px] font-bold text-xs sm:text-sm">Rank</TableHead>
            <TableHead className="font-bold text-xs sm:text-sm min-w-[120px]">
              <Button
                variant="ghost"
                onClick={() => handleSort("player.lastName")}
                className="px-0 hover:bg-transparent font-bold text-xs sm:text-sm"
              >
                Player
                <ArrowUpDown className="ml-1 sm:ml-2 h-3 h-3 sm:h-4 sm:w-4" />
              </Button>
            </TableHead>
            <TableHead className="font-bold text-xs sm:text-sm">Team</TableHead>
            <TableHead className="font-bold text-xs sm:text-sm">OVR</TableHead>
            <TableHead className="font-bold text-xs sm:text-sm hidden sm:table-cell">Best OVR</TableHead>
            {columns.map((col) => (
              <TableHead key={col.key} className="font-bold text-xs sm:text-sm">
                <Button variant="ghost" onClick={() => handleSort(col.key)} className="px-0 hover:bg-transparent font-bold text-xs sm:text-sm">
                  {col.header}
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 h-3 sm:h-4 sm:w-4" />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 5} className="h-16 sm:h-24 text-center text-muted-foreground text-sm">
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
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-bold text-primary text-xs sm:text-sm">#{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {team && (
                        <Image
                          src={getTeamLogo(team.abbrName || team.teamAbbr) || "/placeholder.svg"}
                          alt={`${team.displayName} logo`}
                          width={20}
                          height={20}
                          className="rounded-full"
                          style={{ width: 'auto', height: 'auto' }}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm">{getPlayerFullName(player)}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {player.position}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {team ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-xs sm:text-sm">{team.abbrName || team.teamAbbr}</span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-secondary text-xs sm:text-sm">{player.playerBestOvr || player.overall} OVR</TableCell>
                  <TableCell className="font-bold text-secondary text-xs sm:text-sm hidden sm:table-cell">{player.playerBestOvr}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} className="font-semibold text-xs sm:text-sm">
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
