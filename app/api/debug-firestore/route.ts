import { NextResponse } from "next/server"
import { db } from "@/lib/firebase" // Import your Firestore DB instance
import { convertToSerializable } from "@/lib/madden-firestore-db" // Re-using the existing helper
import type { FirebaseFirestore } from "firebase-admin/firestore" // Declare the variable before using it

// Define a maximum depth to prevent excessively large responses or infinite recursion
const MAX_DEPTH = 3 // Adjust as needed, e.g., 3-5 levels deep

// New types for the API response structure
interface FirestoreDocumentNode {
  id: string
  data: Record<string, any>
  subcollections?: FirestoreCollectionNode[]
}

interface FirestoreCollectionNode {
  collectionName: string
  documents: FirestoreDocumentNode[]
}

// Recursive function to fetch collection data including subcollections
async function fetchCollectionRecursive(
  collectionRef: FirebaseFirestore.CollectionReference,
  currentDepth: number,
): Promise<FirestoreCollectionNode> {
  console.log(`  Depth ${currentDepth}: Fetching documents from collection: ${collectionRef.path}`)
  const documents: FirestoreDocumentNode[] = []

  // Fetch up to 5 documents from this collection to avoid overwhelming the response
  // For a full dump, you'd remove .limit(5)
  const querySnapshot = await collectionRef.limit(5).get()
  console.log(`  Depth ${currentDepth}: Found ${querySnapshot.docs.length} documents in ${collectionRef.id}.`)

  for (const docSnap of querySnapshot.docs) {
    console.log(`    Depth ${currentDepth}: Processing document: ${docSnap.ref.path}`)
    const docData = docSnap.data()
    const subcollections: FirestoreCollectionNode[] = []

    // Recursively fetch subcollections if within MAX_DEPTH
    if (currentDepth < MAX_DEPTH) {
      const subColRefs = await docSnap.ref.listCollections()
      if (subColRefs.length > 0) {
        console.log(`      Depth ${currentDepth}: Found ${subColRefs.length} subcollections under ${docSnap.id}.`)
      }
      for (const subColRef of subColRefs) {
        subcollections.push(await fetchCollectionRecursive(subColRef, currentDepth + 1))
      }
    }

    documents.push(
      convertToSerializable({
        id: docSnap.id,
        ...docData,
        ...(subcollections.length > 0 && { subcollections }), // Only add if subcollections exist
      }) as FirestoreDocumentNode,
    )
  }

  return {
    collectionName: collectionRef.id,
    documents,
  }
}

export async function GET() {
  console.log("--- Firestore Debug API Request ---")
  console.log("Attempting to connect to Firestore.")
  console.log("FIRESTORE_EMULATOR_HOST:", process.env.FIRESTORE_EMULATOR_HOST || "Not set (production mode)")
  try {
    const topLevelCollections = await db.listCollections()
    console.log(`Found ${topLevelCollections.length} top-level collections.`)
    const data: FirestoreCollectionNode[] = []

    for (const collectionRef of topLevelCollections) {
      data.push(await fetchCollectionRecursive(collectionRef, 0))
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("--- Firestore Debug API Error ---")
    console.error("Error fetching Firestore debug data:", error)
    console.error("Error message:", error.message)
    console.error("Firestore Emulator Host:", process.env.FIRESTORE_EMULATOR_HOST)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Firestore data. Check server logs for details.",
        errorMessage: error.message,
        firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
      },
      { status: 500 },
    )
  }
}
