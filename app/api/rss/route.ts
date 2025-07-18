import { NextResponse, type NextRequest } from "next/server"
import { XMLParser } from "fast-xml-parser"

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName, jPath, is) => {
    if (tagName === "item" || tagName === "entry") return true
    return is
  },
})

// Helper converts various date formats to ISO strings
function normalizeDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString()
  const d = new Date(dateStr)
  return isNaN(d.valueOf()) ? new Date().toISOString() : d.toISOString()
}

export async function GET(request: NextRequest) {
  const feedUrl = request.nextUrl.searchParams.get("feedUrl")

  if (!feedUrl) {
    return NextResponse.json({ error: "feedUrl query parameter is required" }, { status: 400 })
  }

  try {
    const res = await fetch(feedUrl, { next: { revalidate: 0 } })
    if (!res.ok) {
      throw new Error(`Upstream returned ${res.status}`)
    }
    const xml = await res.text()

    const json = parser.parse(xml)

    const items = json?.rss?.channel?.item ?? json?.feed?.entry ?? []

    const mapped = items.slice(0, 4).map((item: any, idx: number) => {
      let imageUrl: string | undefined
      let videoUrl: string | undefined

      // Try to extract image URL
      if (item["media:content"] && item["media:content"]["@_medium"] === "image") {
        imageUrl = item["media:content"]["@_url"]
      } else if (item.enclosure && item.enclosure["@_type"]?.startsWith("image/")) {
        imageUrl = item.enclosure["@_url"]
      } else if (item["itunes:image"] && item["itunes:image"]["@_href"]) {
        imageUrl = item["itunes:image"]["@_href"]
      } else if (item.image && item.image.url) {
        imageUrl = item.image.url
      }

      // Try to extract video URL
      if (item["media:content"] && item["media:content"]["@_medium"] === "video") {
        videoUrl = item["media:content"]["@_url"]
      } else if (item.enclosure && item.enclosure["@_type"]?.startsWith("video/")) {
        videoUrl = item.enclosure["@_url"]
      }

      return {
        id: idx,
        title: item.title?.["#text"] ?? item.title,
        link: item.link?.href ?? item.link,
        isoDate: normalizeDate(item.pubDate ?? item.updated),
        imageUrl,
        videoUrl,
      }
    })

    return NextResponse.json(mapped)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error"
    console.error("RSS route error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
