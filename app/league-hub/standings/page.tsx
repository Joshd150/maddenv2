"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { getStandings, getTeams } from "@/lib/maddenDb"
import type { Standing, Team } from "@/lib/madden-types"
import { LiveStandingsTable } from "@/components/league-hub/live-standings-table"

const LEAGUE_ID = process.env.NEXT_PUBLIC_LEAGUE_ID || "25101040" // Default for local testing

export default function StandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const loadStandings = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!LEAGUE_ID || LEAGUE_ID === "your_league_id_here") {
          setError(
            "League ID is not configured. Please set NEXT_PUBLIC_LEAGUE_ID in your Vercel Environment Variables.",
          )
          setLoading(false)
          return
        }

        const [fetchedStandings, fetchedTeams] = await Promise.all([getStandings(LEAGUE_ID), getTeams(LEAGUE_ID)])

        // Sort standings by rank
        const sortedStandings = fetchedStandings.sort((a, b) => a.rank - b.rank)

        setStandings(sortedStandings)
        setTeams(fetchedTeams)
      } catch (err: any) {
        console.error("StandingsPage: Error fetching standings or teams:", err)
        setError(`Failed to load standings: ${err?.message || String(err)}.`)
      } finally {
        setLoading(false)
      }
    }
    loadStandings()
  }, [refreshTrigger])

  return (
    <div className="min-h-[90vh] nfl-card rounded-xl py-6 px-4 flex flex-col">
      <Card className="border-none bg-transparent mb-6">
        <CardHeader>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            League Standings
          </CardTitle>
          <CardDescription className="text-lg">
            Current standings and rankings for all teams in the league.
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

      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <div className="text-lg text-primary font-semibold">Loading standings...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-destructive text-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : standings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-lg text-muted-foreground p-8 text-center">
            No standings data available.
          </div>
        ) : (
          <LiveStandingsTable standings={standings} teams={teams} />
        )}
      </div>
    </div>
  )
}
