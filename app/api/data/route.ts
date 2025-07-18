import { NextResponse } from "next/server"
import MaddenDBImpl from "@/lib/madden-firestore-db" // Import the new Firestore DB

export async function GET() {
  const leagueId = process.env.LEAGUE_ID // Get league ID from server-side env

  if (!leagueId) {
    console.error("[/api/data] LEAGUE_ID environment variable is not set.")
    return NextResponse.json({ error: "League ID is not configured." }, { status: 500 })
  }

  try {
    // Fetch all necessary data from Firestore using MaddenDBImpl
    const [
      standings,
      teams,
      players,
      schedules,
      teamStats,
      defensiveStats,
      kickingStats,
      passingStats,
      puntingStats,
      receivingStats,
      rushingStats,
      teamAssignments,
    ] = await Promise.all([
      MaddenDBImpl.getLatestStandings(leagueId),
      MaddenDBImpl.getLatestTeams(leagueId),
      MaddenDBImpl.getLatestPlayers(leagueId),
      MaddenDBImpl.getSchedules(leagueId), // Fetch all schedules
      MaddenDBImpl.getTeamStats(leagueId), // Fetch all team stats
      MaddenDBImpl.getDefensiveStats(leagueId),
      MaddenDBImpl.getKickingStats(leagueId),
      MaddenDBImpl.getPassingStats(leagueId),
      MaddenDBImpl.getPuntingStats(leagueId),
      MaddenDBImpl.getReceivingStats(leagueId),
      MaddenDBImpl.getRushingStats(leagueId),
      MaddenDBImpl.getTeamsAssignments(leagueId),
    ])

    // Structure the data to match the expected format in league-data.json
    // This is a simplified representation for the client-side to consume
    const structuredData = {
      league_data: {
        [leagueId]: {
          MADDEN_STANDING: standings,
          MADDEN_TEAM: teams,
          MADDEN_PLAYER: players,
          MADDEN_SCHEDULE: schedules,
          MADDEN_TEAM_STAT: teamStats,
          MADDEN_DEFENSIVE_STAT: defensiveStats,
          MADDEN_KICKING_STAT: kickingStats,
          MADDEN_PASSING_STAT: passingStats,
          MADDEN_PUNTING_STAT: puntingStats,
          MADDEN_RECEIVING_STAT: receivingStats,
          MADDEN_RUSHING_STAT: rushingStats,
        },
      },
      league_settings: {
        some_setting_id: {
          commands: {
            teams: {
              assignments: teamAssignments,
            },
          },
        },
      },
      // Add other top-level keys if needed, e.g., blaze_tokens
      blaze_tokens: {}, // Placeholder
    }

    return NextResponse.json(structuredData)
  } catch (error) {
    console.error("Error fetching data from Firestore in /api/data:", error)
    return NextResponse.json({ error: "Failed to load league data from Firestore" }, { status: 500 })
  }
}
