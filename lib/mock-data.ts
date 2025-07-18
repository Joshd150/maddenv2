export interface NewsArticle {
  id: number
  title: string
  source: string
  timestamp: string
  imageUrl: string
  url: string
}

export interface Tweet {
  id: number
  author: string
  handle: string
  timestamp: string
  content: string
  avatarUrl: string
  url: string
}

export const mockNflNews: NewsArticle[] = [
  {
    id: 1,
    title: "Quarterback signs record-breaking extension",
    source: "NFL Network",
    timestamp: "2h ago",
    imageUrl: "/images/nfl-news-1.png",
    url: "#",
  },
  {
    id: 2,
    title: "Rookie class showing early promise in training camp",
    source: "ESPN",
    timestamp: "5h ago",
    imageUrl: "/images/nfl-news-2.png",
    url: "#",
  },
]

export const mockMaddenNews: NewsArticle[] = [
  {
    id: 1,
    title: "Madden 26 Franchise Deep Dive Released",
    source: "EA Sports",
    timestamp: "1d ago",
    imageUrl: "/images/madden-franchise-news.png",
    url: "#",
  },
  {
    id: 2,
    title: "First Look at the New In-Game UI",
    source: "IGN",
    timestamp: "2d ago",
    imageUrl: "/images/madden-ui-news.png",
    url: "#",
  },
]

export const mockTweets: Tweet[] = [
  {
    id: 1,
    author: "NFL",
    handle: "@NFL",
    timestamp: "1h",
    content: "Who has the toughest schedule in 2025? 🤔 #NFL",
    avatarUrl: "/images/nfl-logo.png",
    url: "#",
  },
  {
    id: 2,
    author: "NFL",
    handle: "@NFL",
    timestamp: "3h",
    content: "🚨 TRADE ALERT: A blockbuster deal just went down. More details to come.",
    avatarUrl: "/images/nfl-logo.png",
    url: "#",
  },
]
