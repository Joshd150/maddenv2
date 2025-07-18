// lib/maddenDb.ts
// This file contains client-side data fetching functions that interact with your Next.js API routes.

import type { Player, Team, Standing, PlayerStatEntry, LeagueSettings, MaddenGame } from "./madden-types"

const API_BASE_URL = "/api/madden-data"

async function fetchData<T>(type: string, params: Record<string, any> = {}): Promise<T[]> {
  const url = new URL(`${API_BASE_URL}`)
  url.searchParams.append("type", type)
  for (const key in params) {
    if (params[key] !== undefined) {
      url.searchParams.append(key, String(params[key]))
    }
  }

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: "Unknown error" }))
      throw new Error(`HTTP error! status: ${response.status}, body: ${JSON.stringify(errorBody)}`)
    }
    return response.json()
  } catch (error) {
    console.error(`Failed to fetch ${type} data:`, error)
    throw new Error(
      `Could not load league data for ${type}. Ensure your /api/madden-data route is accessible. Error: ${error}`,
    )
  }
}

export async function getPlayers(leagueId: string): Promise<Player[]> {
  return fetchData<Player>("players", { leagueId })
}

export async function getTeams(leagueId: string): Promise<Team[]> {
  return fetchData<Team>("teams", { leagueId })
}

export async function getLatestTeams(leagueId: string): Promise<Team[]> {
  return fetchData<Team>("teams", { leagueId })
}

export async function getLatestStandings(leagueId: string): Promise<Standing[]> {
  return fetchData<Standing>("standings", { leagueId })
}

export async function getPlayerStats(leagueId: string, player: Player): Promise<PlayerStatEntry[]> {
  return fetchData<PlayerStatEntry>("playerStats", { leagueId, rosterId: player.rosterId })
}

export async function getPassingStats(leagueId: string): Promise<PlayerStatEntry[]> {
  return fetchData<PlayerStatEntry>("passingStats", { leagueId })
}

export async function getRushingStats(leagueId: string): Promise<PlayerStatEntry[]> {
  return fetchData<PlayerStatEntry>("rushingStats", { leagueId })
}

export async function getReceivingStats(leagueId: string): Promise<PlayerStatEntry[]> {
  return fetchData<PlayerStatEntry>("receivingStats", { leagueId })
}

export async function getDefensiveStats(leagueId: string): Promise<PlayerStatEntry[]> {
  return fetchData<PlayerStatEntry>("defensiveStats", { leagueId })
}

export async function getKickingStats(leagueId: string): Promise<PlayerStatEntry[]> {
  return fetchData<PlayerStatEntry>("kickingStats", { leagueId })
}

export async function getPuntingStats(leagueId: string): Promise<PlayerStatEntry[]> {
  return fetchData<PlayerStatEntry>("puntingStats", { leagueId })
}

export async function fetchLeagueSettings(guildId: string): Promise<LeagueSettings | undefined> {
  const settings = await fetchData<LeagueSettings>("leagueSettings", { guildId })
  return settings[0] // Assuming it returns an array with one setting object
}

export async function getLatestSchedule(
  leagueId: string,
  weekIndex: number,
  seasonIndex: number,
): Promise<MaddenGame[]> {
  return fetchData<MaddenGame>("weekSchedule", { leagueId, weekIndex, seasonIndex })
}

export async function getAllSchedules(leagueId: string): Promise<MaddenGame[]> {
  return fetchData<MaddenGame>("schedules", { leagueId })
}

export async function getStandings(leagueId: string): Promise<Standing[]> {
  return fetchData<Standing>("standings", { leagueId })
}
