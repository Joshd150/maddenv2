"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, RefreshCw, BarChart3, List } from "lucide-react"
import { getStandings, getTeams } from "@/lib/maddenDb"
import type { Standing, Team } from "@/lib/madden-types"
import { LiveStandingsTable } from "@/components/league-hub/live-standings-table"
import { StandingsGraph } from "@/components/league-hub/standings-graph"

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
    <div className="min-h-[90vh] vfl-card rounded-lg sm:rounded-xl py-4 sm:py-6 px-2 sm:px-4 flex flex-col">
      <Card className="border-none bg-transparent mb-6">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            League Standings
          </CardTitle>
          <CardDescription className="text-sm sm:text-base lg:text-lg">
            Current standings and rankings for all teams in the league.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end px-1 sm:px-2 mb-4 sm:mb-6">
        <Button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          disabled={loading}
          variant="default"
          className="text-xs sm:text-sm vfl-gradient touch-target"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-1 sm:mr-2 h-3 h-3 sm:h-4 sm:w-4 animate-spin" />
              <span className="hidden sm:inline">Refreshing...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 sm:mr-2 h-3 h-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </>
          )}
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
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2 vfl-card mb-6">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="graph" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Graph View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="table">
              <LiveStandingsTable standings={standings} teams={teams} />
            </TabsContent>
            
            <TabsContent value="graph">
              <StandingsGraph standings={standings} teams={teams} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
