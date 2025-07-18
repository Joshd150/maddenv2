import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Player, type PlayerStatEntry, type PlayerStats, PlayerStatType } from "./madden-types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to convert non-serializable data (like Date or Firestore Timestamp) to serializable format
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

// Helper to get player's full name, robustly handling missing fullName
export function getPlayerFullName(player: Player): string {
  if (player.fullName && player.fullName.trim() !== "") {
    return player.fullName
  }
  const firstName = player.firstName || ""
  const lastName = player.lastName || ""
  return `${firstName} ${lastName}`.trim() || "Unknown Player"
}

// Helper to get team logo path
export function getTeamLogo(teamAbbr: string): string {
  const logoPath = `/images/teams/${(teamAbbr || "fa").toLowerCase()}.png`
  return logoPath
}

// Helper function to format rating keys specifically for display/sorting
export function formatStatKeyForDisplay(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .trim() // Trim leading/trailing spaces
    .split(" ") // Split by space
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(" ") // Join back with spaces
}

// Aggregates all stats for a player across all seasons/weeks
export function aggregatePlayerStats(playerStats: PlayerStats): Record<string, number> {
  const aggregated: Record<string, number> = {}

  Object.values(PlayerStatType).forEach((statType) => {
    const entries = playerStats[statType]
    if (entries) {
      entries.forEach((entry) => {
        for (const key in entry) {
          // Exclude non-stat keys and non-numeric values
          if (
            Object.prototype.hasOwnProperty.call(entry, key) &&
            typeof entry[key as keyof PlayerStatEntry] === "number" &&
            !["rosterId", "teamId", "scheduleId", "seasonIndex", "weekIndex", "statId", "id", "leagueId"].includes(key)
          ) {
            const value = entry[key as keyof PlayerStatEntry] as number
            aggregated[key] = (aggregated[key] || 0) + value
          }
        }
      })
    }
  })

  // Handle specific calculations for percentages/averages if needed
  if (aggregated.passComp !== undefined && aggregated.passAtt !== undefined && aggregated.passAtt > 0) {
    aggregated.passPercent = (aggregated.passComp / aggregated.passAtt) * 100
  }
  if (aggregated.rushYds !== undefined && aggregated.rushAtt !== undefined && aggregated.rushAtt > 0) {
    aggregated.rushYdsPerAtt = aggregated.rushYds / aggregated.rushAtt
  }
  if (aggregated.recYds !== undefined && aggregated.recCatches !== undefined && aggregated.recCatches > 0) {
    aggregated.recYdsPerCatch = aggregated.recYds / aggregated.recCatches
  }
  if (aggregated.puntYds !== undefined && aggregated.puntAtt !== undefined && aggregated.puntAtt > 0) {
    aggregated.puntYdsPerAtt = aggregated.puntYds / aggregated.puntAtt
  }
  if (aggregated.puntNetYds !== undefined && aggregated.puntAtt !== undefined && aggregated.puntAtt > 0) {
    aggregated.puntNetYdsPerAtt = aggregated.puntNetYds / aggregated.puntAtt
  }

  return aggregated
}

// Formats aggregated stats into displayable strings
export function formatAggregatedStats(stats: Record<string, number>): string[] {
  const formattedLines: string[] = []

  const statOrder = [
    "passYds",
    "passTDs",
    "passInts",
    "passComp",
    "passAtt",
    "passPercent",
    "passSacks",
    "rushYds",
    "rushTDs",
    "rushAtt",
    "rushFum",
    "rushYdsPerAtt",
    "recYds",
    "recTDs",
    "recCatches",
    "recDrops",
    "recYdsPerCatch",
    "defTotalTackles",
    "defSacks",
    "defInts",
    "defFumRec",
    "defForcedFum",
    "defTDs",
    "defDeflections",
    "kickPts",
    "fGMade",
    "fGAtt",
    "xPMade",
    "xPAtt",
    "fGLongest",
    "fG50PlusMade",
    "fG50PlusAtt",
    "puntYds",
    "puntAtt",
    "puntsIn20",
    "puntNetYds",
    "puntYdsPerAtt",
    "puntNetYdsPerAtt",
    "puntTBs",
    "puntsBlocked",
  ]

  statOrder.forEach((key) => {
    if (stats[key] !== undefined) {
      const label = formatStatKeyForDisplay(key)
      const value = stats[key]

      // Special formatting for percentages and averages
      if (key === "passPercent") {
        formattedLines.push(`${label}: ${value.toFixed(1)}%`)
      } else if (key.includes("YdsPerAtt") || key.includes("YdsPerCatch")) {
        formattedLines.push(`${label}: ${value.toFixed(1)}`)
      } else {
        formattedLines.push(`${label}: ${value.toFixed(0)}`)
      }
    }
  })

  return formattedLines
}
