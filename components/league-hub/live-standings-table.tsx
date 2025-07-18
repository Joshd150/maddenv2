"use client"

import { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Standing, Team } from "@/lib/madden-types"
import { getTeamLogo } from "@/lib/teamLogos"
import Image from "next/image"

interface LiveStandingsTableProps {
  standings: Standing[]
  teams: Team[]
}

export function LiveStandingsTable({ standings, teams }: LiveStandingsTableProps) {
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.teamId, t])), [teams])

  const formatRecord = (standing: Standing) => {
    const wins = standing.wins || standing.totalWins || 0
    const losses = standing.losses || standing.totalLosses || 0
    const ties = standing.ties || standing.totalTies || 0
    
    if (ties === 0) {
      return `${wins}-${losses}`
    }
    return `${wins}-${losses}-${ties}`
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto nfl-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[60px] font-bold">Rank</TableHead>
            <TableHead className="min-w-[180px] font-bold">Team</TableHead>
            <TableHead className="font-bold">W</TableHead>
            <TableHead className="font-bold">L</TableHead>
            <TableHead className="font-bold">T</TableHead>
            <TableHead className="font-bold">Win %</TableHead>
            <TableHead className="font-bold">Div</TableHead>
            <TableHead className="font-bold">Conf</TableHead>
            <TableHead className="font-bold">Streak</TableHead>
            <TableHead className="font-bold">Net Pts</TableHead>
            <TableHead className="font-bold">PF</TableHead>
            <TableHead className="font-bold">PA</TableHead>
            <TableHead className="font-bold">TO Diff</TableHead>
            <TableHead className="font-bold">Off Yds</TableHead>
            <TableHead className="font-bold">Def Yds</TableHead>
            <TableHead className="font-bold">PF Rank</TableHead>
            <TableHead className="font-bold">PA Rank</TableHead>
            <TableHead className="font-bold">Off Yds Rank</TableHead>
            <TableHead className="font-bold">Def Yds Rank</TableHead>
            <TableHead className="font-bold">Div Record</TableHead>
            <TableHead className="font-bold">Conf Record</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.length > 0 ? (
            standings.map((standing) => {
              const team = teamMap.get(standing.teamId)
              if (!team) {
                console.warn(`Missing team data for standing: ${standing.teamId}`)
                return null
              }
              const wins = standing.wins || standing.totalWins || 0
              const losses = standing.losses || standing.totalLosses || 0
              const ties = standing.ties || standing.totalTies || 0
              return (
                <TableRow key={standing.teamId} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-primary">{standing.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={getTeamLogo(team.abbrName || team.teamAbbr) || "/placeholder.svg"}
                        alt={`${team.displayName} logo`}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                      <span className="font-semibold">{team.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-400">{wins}</TableCell>
                  <TableCell className="font-semibold text-red-400">{losses}</TableCell>
                  <TableCell className="font-semibold text-yellow-400">{ties}</TableCell>
                  <TableCell className="font-semibold">{standing.winPct?.toFixed(3) || "N/A"}</TableCell>
                  <TableCell className="font-semibold">{standing.divisionRank}</TableCell>
                  <TableCell className="font-semibold">{standing.conferenceRank}</TableCell>
                  <TableCell className="font-semibold">{standing.streak || "N/A"}</TableCell>
                  <TableCell className="font-semibold">{standing.netPts}</TableCell>
                  <TableCell className="font-semibold">{standing.ptsFor}</TableCell>
                  <TableCell className="font-semibold">{standing.ptsAgainst}</TableCell>
                  <TableCell className={cn("font-semibold", standing.tODiff > 0 ? "text-green-400" : standing.tODiff < 0 ? "text-red-400" : "")}>
                    {standing.tODiff > 0 ? "+" : ""}{standing.tODiff}
                  </TableCell>
                  <TableCell className="font-semibold">{standing.offTotalYds}</TableCell>
                  <TableCell className="font-semibold">{standing.defTotalYds}</TableCell>
                  <TableCell className="text-muted-foreground">#{standing.ptsForRank}</TableCell>
                  <TableCell className="text-muted-foreground">#{standing.ptsAgainstRank}</TableCell>
                  <TableCell className="text-muted-foreground">#{standing.offTotalYdsRank}</TableCell>
                  <TableCell className="text-muted-foreground">#{standing.defTotalYdsRank}</TableCell>
                  <TableCell className="font-semibold">{standing.divRecord || "N/A"}</TableCell>
                  <TableCell className="font-semibold">{standing.confRecord || "N/A"}</TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={21} className="text-center py-8 text-muted-foreground">
                No standings data available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
