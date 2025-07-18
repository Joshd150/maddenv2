import { db } from "./firebase-admin"
import {
  type Player,
  type Team,
  type Standing,
  type PlayerStatEntry,
  PlayerStatType,
  type MaddenGame,
  type LeagueSettings,
  type TeamStats,
} from "./madden-types"

// Helper function to convert Firestore data to serializable format
export function convertToSerializable(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  if (obj instanceof Date) {
    return obj.toISOString()
  }

  // Check for Firestore Timestamp (common in Firebase SDKs)
  if (obj.toDate && typeof obj.toDate === "function") {
    return obj.toDate().toISOString()
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertToSerializable(item))
  }

  const newObj: { [key: string]: any } = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = convertToSerializable(obj[key])
    }
  }
  return newObj
}

// Helper function to fetch a collection
async function fetchCollection<T>(collectionPath: string): Promise<T[]> {
  try {
    console.log(`Fetching collection: ${collectionPath}`)
    const snapshot = await db.collection(collectionPath).get()
    console.log(`Found ${snapshot.docs.length} documents in ${collectionPath}`)
    return snapshot.docs.map((doc) => convertToSerializable(doc.data()) as T)
  } catch (error) {
    console.error(`Error fetching collection ${collectionPath}:`, error)
    throw new Error(`Failed to fetch ${collectionPath}.`)
  }
}

// Helper function to fetch a document
async function fetchDocument<T>(docPath: string): Promise<T | undefined> {
  try {
    console.log(`Fetching document: ${docPath}`)
    const doc = await db.doc(docPath).get()
    return doc.exists ? (convertToSerializable(doc.data()) as T) : undefined
  } catch (error) {
    console.error(`Error fetching document ${docPath}:`, error)
    throw new Error(`Failed to fetch ${docPath}.`)
  }
}

// Madden League Data Fetchers - following Discord bot structure
const MaddenDBImpl = {
  async getLatestPlayers(leagueId: string): Promise<Player[]> {
    return fetchCollection<Player>(`league_data/${leagueId}/MADDEN_PLAYER`)
  },

  async getLatestTeams(leagueId: string): Promise<Team[]> {
    return fetchCollection<Team>(`league_data/${leagueId}/MADDEN_TEAM`)
  },

  async getLatestStandings(leagueId: string): Promise<Standing[]> {
    return fetchCollection<Standing>(`league_data/${leagueId}/MADDEN_STANDING`)
  },

  async getPlayerStats(leagueId: string, rosterId: number): Promise<PlayerStatEntry[]> {
    const allStats: PlayerStatEntry[] = []
    
    // Fetch all stat types for this player
    const statTypes = [
      PlayerStatType.PASSING,
      PlayerStatType.RUSHING,
      PlayerStatType.RECEIVING,
      PlayerStatType.DEFENSE,
      PlayerStatType.KICKING,
      PlayerStatType.PUNTING,
    ]

    for (const statType of statTypes) {
      try {
        const stats = await fetchCollection<PlayerStatEntry>(`league_data/${leagueId}/${statType}`)
        const playerStats = stats.filter(stat => stat.rosterId === rosterId)
        allStats.push(...playerStats)
      } catch (error) {
        console.warn(`No stats found for ${statType} for player ${rosterId}`)
      }
    }

    return allStats
  },

  async getStatsCollection(
    leagueId: string,
    statType: PlayerStatType,
    seasonIndex?: number,
    weekIndex?: number,
  ): Promise<PlayerStatEntry[]> {
    let stats = await fetchCollection<PlayerStatEntry>(`league_data/${leagueId}/${statType}`)
    
    // Filter by season and week if provided
    if (seasonIndex !== undefined) {
      stats = stats.filter(stat => stat.seasonIndex === seasonIndex)
    }
    if (weekIndex !== undefined) {
      stats = stats.filter(stat => stat.weekIndex === weekIndex)
    }
    
    return stats
  },

  async getPassingStats(leagueId: string, seasonIndex?: number, weekIndex?: number): Promise<PlayerStatEntry[]> {
    return this.getStatsCollection(leagueId, PlayerStatType.PASSING, seasonIndex, weekIndex)
  },

  async getRushingStats(leagueId: string, seasonIndex?: number, weekIndex?: number): Promise<PlayerStatEntry[]> {
    return this.getStatsCollection(leagueId, PlayerStatType.RUSHING, seasonIndex, weekIndex)
  },

  async getReceivingStats(leagueId: string, seasonIndex?: number, weekIndex?: number): Promise<PlayerStatEntry[]> {
    return this.getStatsCollection(leagueId, PlayerStatType.RECEIVING, seasonIndex, weekIndex)
  },

  async getDefensiveStats(leagueId: string, seasonIndex?: number, weekIndex?: number): Promise<PlayerStatEntry[]> {
    return this.getStatsCollection(leagueId, PlayerStatType.DEFENSE, seasonIndex, weekIndex)
  },

  async getKickingStats(leagueId: string, seasonIndex?: number, weekIndex?: number): Promise<PlayerStatEntry[]> {
    return this.getStatsCollection(leagueId, PlayerStatType.KICKING, seasonIndex, weekIndex)
  },

  async getPuntingStats(leagueId: string, seasonIndex?: number, weekIndex?: number): Promise<PlayerStatEntry[]> {
    return this.getStatsCollection(leagueId, PlayerStatType.PUNTING, seasonIndex, weekIndex)
  },

  async getWeekScheduleForSeason(leagueId: string, weekIndex: number, seasonIndex?: number): Promise<MaddenGame[]> {
    const allSchedules = await fetchCollection<MaddenGame>(`league_data/${leagueId}/MADDEN_SCHEDULE`)
    
    let filteredSchedules = allSchedules.filter(game => game.weekIndex === weekIndex - 1) // Convert to 0-based
    
    if (seasonIndex !== undefined) {
      filteredSchedules = filteredSchedules.filter(game => game.seasonIndex === seasonIndex)
    }
    
    return filteredSchedules
  },

  async getAllSchedules(leagueId: string): Promise<MaddenGame[]> {
    return fetchCollection<MaddenGame>(`league_data/${leagueId}/MADDEN_SCHEDULE`)
  },

  async getSchedules(leagueId: string): Promise<MaddenGame[]> {
    return this.getAllSchedules(leagueId)
  },

  async getTeamStats(leagueId: string): Promise<TeamStats[]> {
    return fetchCollection<TeamStats>(`league_data/${leagueId}/MADDEN_TEAM_STAT`)
  },

  async fetchLeagueSettings(guildId: string): Promise<LeagueSettings | undefined> {
    return fetchDocument<LeagueSettings>(`league_settings/${guildId}`)
  },

  async getTeamsAssignments(leagueId: string): Promise<any> {
    // This would need to be implemented based on your Discord bot's structure
    // For now, return empty object
    return {}
  },
}

export default MaddenDBImpl