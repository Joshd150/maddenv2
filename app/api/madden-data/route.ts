import { type NextRequest, NextResponse } from "next/server"
import MaddenDBImpl from "@/lib/madden-firestore-db" // Ensure this path is correct

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const leagueId = searchParams.get("leagueId")
  const guildId = searchParams.get("guildId")
  const rosterId = searchParams.get("rosterId")
  const weekIndex = searchParams.get("weekIndex")
  const seasonIndex = searchParams.get("seasonIndex")

  console.log(
    `[API Route] Received request for type: ${type}, leagueId: ${leagueId}, rosterId: ${rosterId}, guildId: ${guildId}, weekIndex: ${weekIndex}, seasonIndex: ${seasonIndex}`,
  )

  if (!type) {
    console.error("[API Route] Missing 'type' parameter.")
    return NextResponse.json({ error: "Missing 'type' parameter" }, { status: 400 })
  }

  // Ensure leagueId is present for most data types
  if (type !== "leagueSettings" && !leagueId) {
    console.error(`[API Route] Missing 'leagueId' parameter for type: ${type}.`)
    return NextResponse.json({ error: "Missing 'leagueId' parameter" }, { status: 400 })
  }

  try {
    let data: any
    switch (type) {
      case "players":
        if (!leagueId) throw new Error("leagueId is required for players.")
        data = await MaddenDBImpl.getLatestPlayers(leagueId)
        console.log(`[API Route] Fetched ${data.length} players.`)
        return NextResponse.json(data)
      case "teams":
        if (!leagueId) throw new Error("leagueId is required for teams.")
        data = await MaddenDBImpl.getLatestTeams(leagueId)
        console.log(`[API Route] Fetched ${data.length} teams.`)
        return NextResponse.json(data)
      case "standings":
        if (!leagueId) throw new Error("leagueId is required for standings.")
        data = await MaddenDBImpl.getLatestStandings(leagueId)
        console.log(`[API Route] Fetched ${data.length} standings.`)
        return NextResponse.json(data)
      case "playerStats":
        if (!leagueId || !rosterId) throw new Error("leagueId and rosterId are required for playerStats.")
        data = await MaddenDBImpl.getPlayerStats(leagueId, Number.parseInt(rosterId))
        console.log(`[API Route] Fetched player stats for rosterId ${rosterId}.`)
        return NextResponse.json(data)
      case "leagueSettings":
        if (!guildId) throw new Error("guildId is required for leagueSettings.")
        data = await MaddenDBImpl.fetchLeagueSettings(guildId)
        console.log(`[API Route] Fetched league settings for guildId ${guildId}.`)
        return NextResponse.json(data)
      case "passingStats":
        if (!leagueId) throw new Error("leagueId is required for passingStats.")
        data = await MaddenDBImpl.getPassingStats(leagueId)
        console.log(`[API Route] Fetched ${data.length} passing stats.`)
        return NextResponse.json(data)
      case "rushingStats":
        if (!leagueId) throw new Error("leagueId is required for rushingStats.")
        data = await MaddenDBImpl.getRushingStats(leagueId)
        console.log(`[API Route] Fetched ${data.length} rushing stats.`)
        return NextResponse.json(data)
      case "receivingStats":
        if (!leagueId) throw new Error("leagueId is required for receivingStats.")
        data = await MaddenDBImpl.getReceivingStats(leagueId)
        console.log(`[API Route] Fetched ${data.length} receiving stats.`)
        return NextResponse.json(data)
      case "defensiveStats":
        if (!leagueId) throw new Error("leagueId is required for defensiveStats.")
        data = await MaddenDBImpl.getDefensiveStats(leagueId)
        console.log(`[API Route] Fetched ${data.length} defensive stats.`)
        return NextResponse.json(data)
      case "kickingStats":
        if (!leagueId) throw new Error("leagueId is required for kickingStats.")
        data = await MaddenDBImpl.getKickingStats(leagueId)
        console.log(`[API Route] Fetched ${data.length} kicking stats.`)
        return NextResponse.json(data)
      case "puntingStats":
        if (!leagueId) throw new Error("leagueId is required for puntingStats.")
        data = await MaddenDBImpl.getPuntingStats(leagueId)
        console.log(`[API Route] Fetched ${data.length} punting stats.`)
        return NextResponse.json(data)
      case "weekSchedule": // Added
        if (!leagueId || weekIndex === undefined || seasonIndex === undefined)
          throw new Error("leagueId, weekIndex, and seasonIndex are required for weekSchedule.")
        data = await MaddenDBImpl.getWeekScheduleForSeason(
          leagueId,
          Number.parseInt(weekIndex),
          Number.parseInt(seasonIndex),
        )
        console.log(`[API Route] Fetched ${data.length} schedule entries for week ${weekIndex}, season ${seasonIndex}.`)
        return NextResponse.json(data)
      case "teamStats": // Added
        if (!leagueId) throw new Error("leagueId is required for teamStats.")
        data = await MaddenDBImpl.getTeamStats(leagueId)
        console.log(`[API Route] Fetched ${data.length} team stats.`)
        return NextResponse.json(data)
      case "schedules": // Correctly handle fetching all schedules
        if (!leagueId) throw new Error("leagueId is required for schedules.")
        data = await MaddenDBImpl.getAllSchedules(leagueId)
        console.log(`[API Route] Fetched ${data.length} all schedules.`)
        return NextResponse.json(data)
      default:
        console.error(`[API Route] Unknown data type: ${type}.`)
        return NextResponse.json({ error: `Unknown data type: ${type}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error(`Error in /api/madden-data for type ${type}:`, error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
