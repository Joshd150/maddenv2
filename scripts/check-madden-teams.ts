import { db } from "../lib/firebase-admin"

// Ensure these are set to match your .env.local for emulator connection
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "vfl-website-local"

// Use the LEAGUE_ID as defined in your .env.local or `app/league-hub/stats/page.tsx`
const LEAGUE_ID = process.env.NEXT_PUBLIC_LEAGUE_ID || "vfl"

async function checkMaddenTeams() {
  console.log(`Checking Firestore for MADDEN_TEAM data in league: ${LEAGUE_ID}`)
  console.log(`Connecting to Firestore emulator at: ${process.env.FIRESTORE_EMULATOR_HOST}`)

  try {
    const teamsRef = db.collection("league_data").doc(LEAGUE_ID).collection("MADDEN_TEAM")
    const querySnapshot = await teamsRef.get()

    if (querySnapshot.empty) {
      console.log(`No documents found in league_data/${LEAGUE_ID}/MADDEN_TEAM.`)
      console.log("Please ensure you have seeded your Firestore emulator with team data.")
    } else {
      console.log(`Found ${querySnapshot.docs.length} documents in league_data/${LEAGUE_ID}/MADDEN_TEAM.`)
      querySnapshot.docs.forEach((doc) => {
        console.log(`  - Doc ID: ${doc.id}, Data sample:`, JSON.stringify(doc.data()).substring(0, 100) + "...")
      })
      console.log("Data verification successful!")
    }
  } catch (error) {
    console.error("Error accessing Firestore:", error)
    console.error("Please ensure the Firebase Firestore emulator is running.")
  } finally {
    // Exit the process to prevent hanging if db connection remains open
    // For a simple script, this is fine. For a long-running app, manage connections differently.
    process.exit(0)
  }
}

checkMaddenTeams()
