// This type represents a parsed item from the rss-parser library.
// We define it here to use it on the client-side.
export interface RssItem {
  title: string
  link: string
  isoDate: string
  contentSnippet?: string
  creator?: string
  imageUrl?: string // Added for images
  videoUrl?: string // Added for videos
}
