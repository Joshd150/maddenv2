"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// New types for the client-side data structure
interface FirestoreDocumentNode {
  id: string
  data: Record<string, any>
  subcollections?: FirestoreCollectionNode[]
}

interface FirestoreCollectionNode {
  collectionName: string
  documents: FirestoreDocumentNode[]
}

// Recursive component to display collection nodes
function CollectionNodeViewer({ collection }: { collection: FirestoreCollectionNode }) {
  return (
    <Card className="bg-zinc-800/70 border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Collection: {collection.collectionName}</CardTitle>
      </CardHeader>
      <CardContent>
        {collection.documents.length > 0 ? (
          <div className="space-y-4">
            {collection.documents.map((doc, idx) => (
              <div key={doc.id || idx} className="border-b border-zinc-700 pb-2 last:border-b-0">
                <p className="font-medium text-sm text-primary">Document ID: {doc.id}</p>
                <pre className="text-xs bg-zinc-900 p-2 rounded-md overflow-x-auto">
                  {JSON.stringify(doc.data, null, 2)}
                </pre>
                {doc.subcollections && doc.subcollections.length > 0 && (
                  <div className="ml-4 mt-4 space-y-4">
                    <h4 className="text-lg font-semibold text-muted-foreground">Subcollections:</h4>
                    {doc.subcollections.map((subCol) => (
                      <CollectionNodeViewer key={subCol.collectionName} collection={subCol} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Note: The API route limits documents to 5 per collection/subcollection */}
            {collection.documents.length === 5 && (
              <p className="text-sm text-muted-foreground mt-2">(Showing first 5 documents. There might be more.)</p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No documents found in this collection.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function FirestoreDebugPage() {
  const [data, setData] = useState<FirestoreCollectionNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/debug-firestore")
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(
            result.error ||
              `An unknown error occurred. Message: ${result.errorMessage}. Emulator Host: ${result.firestoreEmulatorHost}`,
          )
        }
      } catch (err: any) {
        console.error("Client-side fetch error:", err)
        setError(`Network error or API route not found: ${err.message || String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [refreshTrigger])

  return (
    <div className="container mx-auto p-4 min-h-[90vh] bg-zinc-900/50 rounded-xl py-5 px-2 flex flex-col shadow-lg border border-primary/10">
      <Card className="border-none bg-transparent">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Firestore Debugger</CardTitle>
          <CardDescription>
            Inspect collections, documents, and subcollections from your Firestore instance.
            <br />
            <span className="text-red-400 font-semibold">
              WARNING: This page exposes database structure. Remove or secure in production.
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-end px-4 mb-4">
        <Button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          disabled={loading}
          variant="outline"
          className="text-sm"
        >
          {loading ? "Refreshing..." : "Refresh"}
          {loading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col p-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lg text-primary animate-pulse py-16">
            Loading Firestore data...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-lg p-4 text-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No collections found in Firestore.
          </div>
        ) : (
          <ScrollArea className="h-[calc(90vh-200px)]">
            <div className="grid gap-6">
              {data.map((collection) => (
                <CollectionNodeViewer key={collection.collectionName} collection={collection} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
