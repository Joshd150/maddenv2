// lib/server-maddenDb.ts
// This module is intended for use only in Server Components.
import MaddenDBImpl from "./madden-firestore-db" // Import the new Firestore DB
import type {
  Standing,
  Team,
  MaddenGame,
  TeamStats,
  DefensiveStats,
  KickingStats,
  PassingStats,
  Player,
  PuntingStats,
  ReceivingStats,
  RushingStats,
  TeamAssignments,
} from "./madden-types"

// --- MAIN FETCH FUNCTIONS for Server Components ---
export async function getDefensiveStats(
  leagueId: string,
  seasonIndex?: number,
  weekIndex?: number,
): Promise<DefensiveStats[]> {
  return MaddenDBImpl.getDefensiveStats(leagueId, seasonIndex, weekIndex)
}

export async function getKickingStats(
  leagueId: string,
  seasonIndex?: number,
  weekIndex?: number,
): Promise<KickingStats[]> {
  return MaddenDBImpl.getKickingStats(leagueId, seasonIndex, weekIndex)
}

export async function getPassingStats(
  leagueId: string,
  seasonIndex?: number,
  weekIndex?: number,
): Promise<PassingStats[]> {
  return MaddenDBImpl.getPassingStats(leagueId, seasonIndex, weekIndex)
}

export async function getPlayers(leagueId: string): Promise<Player[]> {
  return MaddenDBImpl.getLatestPlayers(leagueId)
}

export async function getPuntingStats(
  leagueId: string,
  seasonIndex?: number,
  weekIndex?: number,
): Promise<PuntingStats[]> {
  return MaddenDBImpl.getPuntingStats(leagueId, seasonIndex, weekIndex)
}

export async function getReceivingStats(
  leagueId: string,
  seasonIndex?: number,
  weekIndex?: number,
): Promise<ReceivingStats[]> {
  return MaddenDBImpl.getReceivingStats(leagueId, seasonIndex, weekIndex)
}

export async function getRushingStats(
  leagueId: string,
  seasonIndex?: number,
  weekIndex?: number,
): Promise<RushingStats[]> {
  return MaddenDBImpl.getRushingStats(leagueId, seasonIndex, weekIndex)
}

export async function getSchedules(leagueId: string): Promise<MaddenGame[]> {
  return MaddenDBImpl.getSchedules(leagueId)
}

export async function getStandings(leagueId: string): Promise<Standing[]> {
  return MaddenDBImpl.getLatestStandings(leagueId)
}

export async function getTeams(leagueId: string): Promise<Team[]> {
  return MaddenDBImpl.getLatestTeams(leagueId)
}

export async function getTeamStats(leagueId: string): Promise<TeamStats[]> {
  return MaddenDBImpl.getTeamStats(leagueId)
}

// --- Specific helper functions for Server Components ---

export async function getAllTeams(leagueId: string): Promise<Team[]> {
  return MaddenDBImpl.getLatestTeams(leagueId)
}

export async function getWeekSchedule(
  leagueId: string,
  weekIndex: number,
  seasonIndex?: number,
): Promise<MaddenGame[]> {
  // MaddenDBImpl.getWeekScheduleForSeason expects 1-based week, but our data is 0-based.
  // Adjusting here to pass 1-based week to MaddenDBImpl.
  return MaddenDBImpl.getWeekScheduleForSeason(leagueId, weekIndex + 1, seasonIndex || 0)
}

// --- Get Discord team assignments for Server Components ---
export async function getTeamsAssignments(leagueId: string): Promise<TeamAssignments> {
  return MaddenDBImpl.getTeamsAssignments(leagueId)
}
