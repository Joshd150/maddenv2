// lib/firebase.ts
// This file should ONLY be imported by server-side code (e.g., API routes, Server Actions).
// It initializes the Firebase Admin SDK.
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

let db: Firestore

// Check if a Firebase app is already initialized
if (!getApps().length) {
  // App is not initialized, proceed with initialization
  const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST
  const isEmulator = FIRESTORE_EMULATOR_HOST !== undefined && FIRESTORE_EMULATOR_HOST !== ""

  let app
  if (isEmulator) {
    console.warn(
      "Firebase Admin SDK is running in emulator mode. Ensure FIRESTORE_EMULATOR_HOST is correctly set in your .env.local file (e.g., FIRESTORE_EMULATOR_HOST=localhost:8080).",
    )
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "demo-project", // Use provided or a dummy project ID
    })
    db = getFirestore(app)
    // Apply settings immediately after getting the Firestore instance
    db.settings({
      host: FIRESTORE_EMULATOR_HOST,
      ssl: false, // Emulators typically don't use SSL
    })
  } else {
    // Production or non-emulator environment: require full credentials
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_ID is not defined in environment variables.")
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("FIREBASE_CLIENT_EMAIL is not defined in environment variables.")
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error("FIREBASE_PRIVATE_KEY is not defined in environment variables.")
    }

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Handle private key newlines
      }),
    })
    db = getFirestore(app)
  }
} else {
  // App is already initialized, get the existing Firestore instance
  db = getFirestore(getApp())
}

export { db }
