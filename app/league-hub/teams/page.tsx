"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getLatestTeams, fetchLeagueSettings, getPlayers } from "@/lib/maddenDb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"
import type { Team, Player } from "@/lib/madden-types"
import { TeamPlayersDialog } from "@/components/league-hub/team-players-dialog"
import Image from "next/image"
import { getTeamLogo } from "@/lib/utils"

interface TeamDisplay extends Team {
  isFilled: boolean
  assignedUser?: string // Placeholder for user display name/ID
  coachNameDisplay?: string // Added to store the display name for the coach/owner
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamDisplay[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  const leagueId = process.env.NEXT_PUBLIC_LEAGUE_ID || "your_league_id_here"
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || "your_guild_id_here"

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    async function fetchTeamsAndSettings() {
      if (!leagueId || leagueId === "your_league_id_here") {
        setError("League ID is not configured. Please set NEXT_PUBLIC_LEAGUE_ID in your Vercel Environment Variables.")
        setLoading(false)
        return
      }
      if (!guildId || guildId === "your_guild_id_here") {
        setError(
          "Discord Guild ID is not configured. Please set NEXT_PUBLIC_DISCORD_GUILD_ID in your Vercel Environment Variables.",
        )
        setLoading(false)
        return
      }

      try {
        const [fetchedTeams, fetchedSettings, fetchedPlayers] = await Promise.all([
          getLatestTeams(leagueId),
          fetchLeagueSettings(guildId),
          getPlayers(leagueId),
        ])

        const teamAssignments = fetchedSettings?.commands?.teams?.assignments || {}

        const teamsWithStatus: TeamDisplay[] = fetchedTeams.map((team) => {
          const isFilled = !!teamAssignments[team.teamId]
          let coachNameDisplay: string | undefined

          if (team.userName === "CPU") {
            coachNameDisplay = "CPU"
          } else if (team.ownerName) {
            coachNameDisplay = team.ownerName
          } else if (team.userName) {
            coachNameDisplay = team.userName
          } else {
            coachNameDisplay = undefined // No owner/user name available
          }

          return {
            ...team,
            isFilled: isFilled,
            assignedUser: teamAssignments[team.teamId]?.discord_user?.id,
            coachNameDisplay: coachNameDisplay, // This will be used for display
            confName: team.confName || "Unknown Conference",
            divName: team.divName || "Unknown Division",
          }
        })

        const groupedTeams: Record<string, Record<string, TeamDisplay[]>> = {}
        teamsWithStatus.forEach((team) => {
          if (!groupedTeams[team.confName]) {
            groupedTeams[team.confName] = {}
          }
          if (!groupedTeams[team.confName][team.divName]) {
            groupedTeams[team.confName][team.divName] = []
          }
          groupedTeams[team.confName][team.divName].push(team)
        })

        const sortedTeams: TeamDisplay[] = []
        Object.keys(groupedTeams)
          .sort()
          .forEach((confName) => {
            Object.keys(groupedTeams[confName])
              .sort()
              .forEach((divName) => {
                groupedTeams[confName][divName].sort((a, b) => a.displayName.localeCompare(b.displayName))
                sortedTeams.push(...groupedTeams[confName][divName])
              })
          })

        if (mounted) {
          setTeams(sortedTeams)
          setAllPlayers(fetchedPlayers)
          setError(null)
        }
      } catch (err: any) {
        console.error("TeamsPage: Error fetching teams or settings:", err)
        setError(`Failed to load teams: ${err?.message || String(err)}.`)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    fetchTeamsAndSettings()
    return () => {
      mounted = false
    }
  }, [leagueId, guildId, refreshTrigger])

  const teamsByConferenceAndDivision = teams.reduce(
    (acc, team) => {
      if (!acc[team.confName]) {
        acc[team.confName] = {}
      }
      if (!acc[team.confName][team.divName]) {
        acc[team.confName][team.divName] = []
      }
      acc[team.confName][team.divName].push(team)
      return acc
    },
    {} as Record<string, Record<string, TeamDisplay[]>>,
  )

  const sortedConferenceNames = Object.keys(teamsByConferenceAndDivision).sort()

  const handleTeamCardClick = (teamId: number) => {
    setSelectedTeamId(teamId)
  }

  const handleCloseTeamPlayersDialog = () => {
    setSelectedTeamId(null)
  }

  return (
    <div className="min-h-[90vh] bg-zinc-900/50 rounded-xl py-5 px-2 flex flex-col shadow-lg border border-primary/10">
      <Card className="border-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">League Teams</CardTitle>
          <CardDescription>View all teams in the league and their current status.</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end px-4 mb-4">
        <Button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          disabled={loading}
          variant="outline"
          className="text-sm"
        >
          {loading ? "Refreshing..." : "Refresh"}
          {loading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lg text-primary animate-pulse py-16">
            Loading teams...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
            {sortedConferenceNames.map((confName) => (
              <div key={confName} className="col-span-full mb-8">
                <h2 className="text-3xl font-bold mb-6 text-primary-foreground text-center md:text-left">
                  {confName || "Unknown Conference"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Object.keys(teamsByConferenceAndDivision[confName])
                    .sort()
                    .map((divName) => (
                      <Card key={divName} className="bg-zinc-800/70 border-primary/20 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl font-semibold text-primary-foreground">
                            {divName || "Unknown Division"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <ul className="space-y-3">
                            {teamsByConferenceAndDivision[confName][divName].map((team) => (
                              <li
                                key={team.id}
                                className="flex items-center gap-3 cursor-pointer hover:bg-zinc-700/50 p-2 rounded-md transition-colors duration-200"
                                onClick={() => handleTeamCardClick(team.teamId)}
                              >
                                <Image
                                  src={getTeamLogo(team.abbrName) || "/placeholder.svg"}
                                  alt={`${team.displayName} logo`}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover"
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium text-lg text-primary-foreground">
                                    {team.displayName}
                                  </span>
                                  {team.coachNameDisplay && (
                                    <span className="text-sm text-muted-foreground">
                                      Coach: {team.coachNameDisplay}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                                    team.isFilled ? "bg-green-600 text-white" : "bg-yellow-600 text-white"
                                  }`}
                                >
                                  {team.isFilled ? "Filled" : "Open"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTeamId !== null && (
        <TeamPlayersDialog
          teamId={selectedTeamId}
          onClose={handleCloseTeamPlayersDialog}
          allTeams={teams}
          allPlayers={allPlayers}
          leagueId={leagueId}
        />
      )}
    </div>
  )
}
