import { Firestore } from "firebase-admin/firestore"
import { initializeFirebaseAdmin } from "./firebase-admin"
import {
  type Player,
  type Team,
  type Standing,
  type PlayerStatEntry,
  PlayerStatType,
  type MaddenGame,
  type LeagueSettings,
} from "./madden-types"

// Initialize Firebase Admin SDK
initializeFirebaseAdmin()
const db = Firestore.getFirestore()

// Helper function to fetch a collection
async function fetchCollection<T>(collectionPath: string): Promise<T[]> {
  try {
    const snapshot = await db.collection(collectionPath).get()
    return snapshot.docs.map((doc) => doc.data() as T)
  } catch (error) {
    console.error(`Error fetching collection ${collectionPath}:`, error)
    throw new Error(`Failed to fetch ${collectionPath}.`)
  }
}

// Helper function to fetch a document
async function fetchDocument<T>(docPath: string): Promise<T | undefined> {
  try {
    const doc = await db.doc(docPath).get()
    return doc.exists ? (doc.data() as T) : undefined
  } catch (error) {
    console.error(`Error fetching document ${docPath}:`, error)
    throw new Error(`Failed to fetch ${docPath}.`)
  }
}

// Madden League Data Fetchers
const MaddenDBImpl = {
  async getLatestPlayers(leagueId: string): Promise<Player[]> {
    return fetchCollection<Player>(`madden_leagues/${leagueId}/players`)
  },

  async getLatestTeams(leagueId: string): Promise<Team[]> {
    return fetchCollection<Team>(`madden_leagues/${leagueId}/teams`)
  },

  async getLatestStandings(leagueId: string): Promise<Standing[]> {
    return fetchCollection<Standing>(`madden_leagues/${leagueId}/standings`)
  },

  async getPlayerStats(leagueId: string, rosterId: number): Promise<PlayerStatEntry[]> {
    return fetchCollection<PlayerStatEntry>(`madden_leagues/${leagueId}/player_stats/${rosterId}/stats`)
  },

  async getStatsCollection(
    leagueId: string,
    statType: PlayerStatType,
    seasonIndex?: number,
    weekIndex?: number,
  ): Promise<PlayerStatEntry[]> {
    const collectionPath = `madden_leagues/${leagueId}/player_stats_by_type/${statType}/stats`
    // If you need to filter by season/week, you'd add queries here.
    // For now, this fetches all stats of a given type.
    return fetchCollection<PlayerStatEntry>(collectionPath)
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
    const seasonPath = seasonIndex !== undefined ? `seasons/${seasonIndex}` : "latest_season" // Assuming 'latest_season' is a document or collection
    return fetchCollection<MaddenGame>(`madden_leagues/${leagueId}/schedule/${seasonPath}/weeks/${weekIndex}/games`)
  },

  async getAllSchedules(leagueId: string): Promise<MaddenGame[]> {
    // This will fetch all games from all weeks in the latest season.
    // If you have multiple seasons, you might need a more complex query
    // or a top-level 'all_games' collection. For now, assuming latest season.
    const latestSeasonDoc = await db.collection(`madden_leagues/${leagueId}/schedule`).doc("latest_season").get()
    if (!latestSeasonDoc.exists) {
      console.warn(`No 'latest_season' document found for league ${leagueId} schedule.`)
      return []
    }
    const latestSeasonData = latestSeasonDoc.data()
    const currentSeasonIndex = latestSeasonData?.seasonIndex // Assuming seasonIndex is stored here

    if (currentSeasonIndex === undefined) {
      console.warn(`'seasonIndex' not found in 'latest_season' document for league ${leagueId}.`)
      return []
    }

    const games: MaddenGame[] = []
    const weeksCollectionRef = db.collection(`madden_leagues/${leagueId}/schedule/seasons/${currentSeasonIndex}/weeks`)
    const weeksSnapshot = await weeksCollectionRef.get()

    for (const weekDoc of weeksSnapshot.docs) {
      const weekGamesSnapshot = await weekDoc.ref.collection("games").get()
      weekGamesSnapshot.docs.forEach((gameDoc) => {
        games.push(gameDoc.data() as MaddenGame)
      })
    }
    return games
  },

  async getTeamStats(leagueId: string): Promise<any[]> {
    // Assuming team stats are stored in a collection like 'team_stats'
    return fetchCollection<any>(`madden_leagues/${leagueId}/team_stats`)
  },

  async fetchLeagueSettings(guildId: string): Promise<LeagueSettings | undefined> {
    return fetchDocument<LeagueSettings>(`league_settings/${guildId}`)
  },
}

export default MaddenDBImpl
