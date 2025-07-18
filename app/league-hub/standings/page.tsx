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
    <div className="min-h-[90vh] bg-zinc-900/50 rounded-xl py-5 px-2 flex flex-col shadow-lg border border-primary/10">
      <Card className="border-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">League Standings</CardTitle>
          <CardDescription>View the current standings for all teams in the league.</CardDescription>
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
            Loading standings...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : standings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-lg text-muted-foreground p-4 text-center">
            No standings data available.
          </div>
        ) : (
          <LiveStandingsTable standings={standings} teams={teams} />
        )}
      </div>
    </div>
  )
}
