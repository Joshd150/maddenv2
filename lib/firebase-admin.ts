import admin from "firebase-admin"

/**
 * Initialise (or re-use) a Firebase-Admin app and expose Firestore (`db`).
 *   • In local development, if `FIRESTORE_EMULATOR_HOST` is set we connect to
 *     the emulator and *do not* require any service-account JSON file.
 *   • In production we build a credential from the three env-vars that Vercel
 *     (or any host) can supply.
 *
 * The code is written to be HMR-safe – on the server in Next 15 the file can
 * be evaluated multiple times, so we guard with `admin.apps.length`.
 */

function createAdminApp(): admin.app.App {
  // --- LOCAL EMULATOR ---
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`Connecting to Firestore emulator at: ${process.env.FIRESTORE_EMULATOR_HOST}`)
    const projectId = process.env.FIREBASE_PROJECT_ID || "dev"
    return admin.initializeApp({ projectId })
  }

  // --- PRODUCTION ---
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Missing Firebase Admin env vars. " + "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    )
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // privateKey in env usually has literal \n – restore real newlines.
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    projectId: FIREBASE_PROJECT_ID,
  })
}

export const adminApp = admin.apps.length ? admin.app() : createAdminApp()
export const db = admin.firestore(adminApp)

// When using the emulator tell Firestore where it is.
if (process.env.FIRESTORE_EMULATOR_HOST) {
  db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false })
  console.log(`Firestore configured for emulator at: ${process.env.FIRESTORE_EMULATOR_HOST}`)
}