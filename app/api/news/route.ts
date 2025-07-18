import { NextResponse } from "next/server"

// This is a placeholder URL. You will need to replace this
// with the actual URL from your news API provider.
const NEWS_API_URL = "https://api.news-provider.com/v2/everything?q=nfl"

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "API key is missing" }, { status: 500 })
  }

  try {
    // This fetch request runs on the server, so your API key is safe.
    const response = await fetch(`${NEWS_API_URL}&apiKey=${apiKey}`, {
      // This tells Next.js to not cache the result and fetch fresh data every time.
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`)
    }

    const data = await response.json()

    // The data is sent back to the client-side page.
    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
