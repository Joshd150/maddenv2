"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { getTeams, getAllSchedules } from "@/lib/maddenDb"
import type { MaddenGame, Team } from "@/lib/madden-types"
import { GameDetailDialog } from "@/components/league-hub/game-detail-dialog"
import { getMessageForWeek } from "@/lib/madden-types"
import { GameScorebug } from "@/components/league-hub/game-scorebug"

const LEAGUE_ID = process.env.NEXT_PUBLIC_LEAGUE_ID || "25101040" // Default for local testing

export default function SchedulePage() {
  const [allSchedules, setAllSchedules] = useState<MaddenGame[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string>("latest")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isGameDetailDialogOpen, setIsGameDetailDialogOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<MaddenGame | null>(null)

  useEffect(() => {
    const loadSchedule = async () => {
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

        const [fetchedAllSchedules, fetchedTeams] = await Promise.all([getAllSchedules(LEAGUE_ID), getTeams(LEAGUE_ID)])

        setTeams(fetchedTeams)
        setAllSchedules(fetchedAllSchedules)

        const maxWeekIndex = fetchedAllSchedules.reduce((max, game) => Math.max(max, game.weekIndex), -1)
        const initialWeekToDisplay = maxWeekIndex !== -1 ? String(maxWeekIndex + 1) : "latest"

        if (
          selectedWeek === "latest" ||
          !fetchedAllSchedules.some((game) => String(game.weekIndex + 1) === selectedWeek)
        ) {
          setSelectedWeek(initialWeekToDisplay)
        }
      } catch (err: any) {
        console.error("SchedulePage: Error fetching schedule or teams:", err)
        setError(`Failed to load schedule: ${err?.message || String(err)}.`)
      } finally {
        setLoading(false)
      }
    }
    loadSchedule()
  }, [refreshTrigger])

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.teamId, t])), [teams])

  const availableWeeks = useMemo(() => {
    const weeks = new Set<number>()
    allSchedules.forEach((game) => weeks.add(game.weekIndex + 1))
    return Array.from(weeks).sort((a, b) => a - b)
  }, [allSchedules])

  const filteredSchedule = useMemo(() => {
    if (selectedWeek === "latest") {
      const maxWeekIndex = allSchedules.reduce((max, game) => Math.max(max, game.weekIndex), -1)
      return allSchedules.filter((game) => game.weekIndex === maxWeekIndex).sort((a, b) => a.scheduleId - b.scheduleId)
    }
    const weekIndex = Number.parseInt(selectedWeek) - 1
    return allSchedules.filter((game) => game.weekIndex === weekIndex).sort((a, b) => a.scheduleId - b.scheduleId)
  }, [allSchedules, selectedWeek])

  const handleGameClick = (game: MaddenGame) => {
    setSelectedGame(game)
    setIsGameDetailDialogOpen(true)
  }

  const handleCloseGameDetailDialog = () => {
    setIsGameDetailDialogOpen(false)
    setSelectedGame(null)
  }

  const currentWeekDisplay = useMemo(() => {
    if (selectedWeek === "latest" && availableWeeks.length > 0) {
      const latestWeekNum = Math.max(...availableWeeks)
      return getMessageForWeek(latestWeekNum)
    }
    if (selectedWeek !== "latest" && !isNaN(Number.parseInt(selectedWeek))) {
      return getMessageForWeek(Number.parseInt(selectedWeek))
    }
    return "Loading Week..."
  }, [selectedWeek, availableWeeks])

  return (
    <div className="min-h-[90vh] bg-zinc-900/50 rounded-xl py-5 px-2 flex flex-col shadow-lg border border-primary/10">
      <Card className="border-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">League Schedule</CardTitle>
          <CardDescription>View the schedule and results for each week.</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-center px-4 mb-4 gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="week-select" className="text-sm font-medium text-gray-300 whitespace-nowrap">
            Select Week:
          </label>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select a week" />
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map((weekNum) => (
                <SelectItem key={weekNum} value={String(weekNum)}>
                  {getMessageForWeek(weekNum)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          disabled={loading}
          variant="outline"
          className="text-sm w-full sm:w-auto"
        >
          {loading ? "Refreshing..." : "Refresh"}
          {loading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lg text-primary animate-pulse py-16">
            Loading schedule...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : filteredSchedule.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-lg text-muted-foreground p-4 text-center">
            No schedule data available for {currentWeekDisplay}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {filteredSchedule.map((game) => {
              const homeTeam = teamMap.get(game.homeTeamId)
              const awayTeam = teamMap.get(game.awayTeamId)

              if (!homeTeam || !awayTeam) {
                console.warn(
                  `Missing team data for game ${game.scheduleId}. Home: ${game.homeTeamId}, Away: ${game.awayTeamId}`,
                )
                return null
              }

              return (
                <GameScorebug
                  key={game.scheduleId}
                  game={game}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  onGameClick={handleGameClick}
                />
              )
            })}
          </div>
        )}
      </div>

      {isGameDetailDialogOpen && selectedGame && (
        <GameDetailDialog
          game={selectedGame}
          teams={teams}
          onClose={handleCloseGameDetailDialog}
          leagueId={LEAGUE_ID}
        />
      )}
    </div>
  )
}
