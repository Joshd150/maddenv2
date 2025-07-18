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
    if (standing.totalTies === 0 || standing.totalTies === undefined) {
      return `${standing.wins}-${standing.losses}`
    }
    return `${standing.wins}-${standing.losses}-${standing.ties}`
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead className="min-w-[150px]">Team</TableHead>
            <TableHead>W</TableHead>
            <TableHead>L</TableHead>
            <TableHead>T</TableHead>
            <TableHead>Win %</TableHead>
            <TableHead>Div</TableHead>
            <TableHead>Conf</TableHead>
            <TableHead>Streak</TableHead>
            <TableHead>Net Pts</TableHead>
            <TableHead>PF</TableHead>
            <TableHead>PA</TableHead>
            <TableHead>TO Diff</TableHead>
            <TableHead>Off Yds</TableHead>
            <TableHead>Def Yds</TableHead>
            <TableHead>PF Rank</TableHead>
            <TableHead>PA Rank</TableHead>
            <TableHead>Off Yds Rank</TableHead>
            <TableHead>Def Yds Rank</TableHead>
            <TableHead>Div Record</TableHead>
            <TableHead>Conf Record</TableHead>
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
              return (
                <TableRow key={standing.teamId}>
                  <TableCell className="font-medium">{standing.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        src={getTeamLogo(team.abbrName) || "/placeholder.svg"}
                        alt={`${team.displayName} logo`}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      {team.displayName}
                    </div>
                  </TableCell>
                  <TableCell>{standing.wins}</TableCell>
                  <TableCell>{standing.losses}</TableCell>
                  <TableCell>{standing.ties}</TableCell>
                  <TableCell>{standing.winPct?.toFixed(3) || "N/A"}</TableCell>
                  <TableCell>{standing.divisionRank}</TableCell>
                  <TableCell>{standing.conferenceRank}</TableCell>
                  <TableCell>{standing.streak || "N/A"}</TableCell>
                  <TableCell>{standing.netPts}</TableCell>
                  <TableCell>{standing.ptsFor}</TableCell>
                  <TableCell>{standing.ptsAgainst}</TableCell>
                  <TableCell>{standing.tODiff}</TableCell>
                  <TableCell>{standing.offTotalYds}</TableCell>
                  <TableCell>{standing.defTotalYds}</TableCell>
                  <TableCell>{standing.ptsForRank}</TableCell>
                  <TableCell>{standing.ptsAgainstRank}</TableCell>
                  <TableCell>{standing.offTotalYdsRank}</TableCell>
                  <TableCell>{standing.defTotalYdsRank}</TableCell>
                  <TableCell>{standing.divRecord || "N/A"}</TableCell>
                  <TableCell>{standing.confRecord || "N/A"}</TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={21} className="text-center">
                No standings data available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
