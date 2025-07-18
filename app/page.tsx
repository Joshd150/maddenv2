"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Menu, X } from "lucide-react"
import { DiscordIcon, YouTubeIcon, TwitterIcon, TikTokIcon, InstagramIcon } from "@/components/icons/social-icons"
import type { RssItem } from "@/lib/types"
import { highlightsData } from "@/lib/highlights-data"
import { HighlightVideoCard } from "@/components/highlight-video-card"

const MADDEN_RSS_URL = "https://rss.app/feeds/mvkeMDgV7nuurHWH.xml"
const NFL_RSS_URL = "https://rss.app/feeds/5xIPyiPZ71AlfDvW.xml"

// Define navigation items for consistency
const mainNavItems = [
  { href: "/league-hub/standings", label: "Standings" },
  { href: "/league-hub/stats", label: "Stats" },
  { href: "/league-hub/schedule", label: "Schedule" },
  { href: "/league-hub/scoreboard", label: "Scoreboard" },
  { href: "/league-hub/playoffs", label: "Playoffs" },
  { href: "/league-hub/teams", label: "Teams" },
  { href: "/league-hub/trades", label: "Trades" },
  { href: "/league-hub/roster-moves", label: "Roster Moves" },
]

function RssFeedCard({ title, feedUrl }: { title: string; feedUrl: string }) {
  const [items, setItems] = useState<RssItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeed() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/rss?feedUrl=${encodeURIComponent(feedUrl)}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch feed")
        }
        const data: RssItem[] = await response.json()
        setItems(data.slice(0, 4)) // Display latest 4 items
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFeed()
  }, [feedUrl])

  return (
    <Card className="bg-muted/30 border-primary/20 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TwitterIcon className="h-5 w-5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 flex-1">
        {isLoading && <p className="text-muted-foreground">Loading feed...</p>}
        {error && <p className="text-red-500 text-sm">Error: {error}</p>}
        {!isLoading &&
          !error &&
          items.map((item) => (
            <Link
              href={item.link}
              key={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 group"
            >
              {item.imageUrl && (
                <Image
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.title}
                  width={80}
                  height={80}
                  className="rounded-md object-cover aspect-square"
                />
              )}
              <div>
                <p className="text-sm font-semibold group-hover:text-primary/80 transition-colors">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(item.isoDate).toLocaleDateString()}</p>
                {item.videoUrl && (
                  <p className="text-xs text-blue-400 mt-1">
                    (Video available:{" "}
                    <Link href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      Watch here
                    </Link>
                    )
                  </p>
                )}
              </div>
            </Link>
          ))}
      </CardContent>
    </Card>
  )
}

export default function VflLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const autoplayPlugin = useRef(Autoplay({ delay: 8000, stopOnInteraction: true, stopOnMouseEnter: true }))

  return (
    <div className="flex flex-col min-h-[100dvh] text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center sticky top-0 z-50 nfl-card/80 backdrop-blur-lg border-b border-primary/20">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <Image
            src="/vfl-logo.jpeg"
            alt="VFL Logo"
            width={40}
            height={40}
            className="rounded-full border-2 border-primary/50"
          />
          <span className="font-bold text-lg hidden sm:inline-block">VFL</span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium hover:underline underline-offset-4"
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-3">
          <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
            <InstagramIcon className="h-5 w-5" />
          </Link>
          <Link href="#" aria-label="TikTok" className="text-muted-foreground hover:text-primary transition-colors">
            <TikTokIcon className="h-5 w-5" />
          </Link>
          <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
            <TwitterIcon className="h-5 w-5" />
          </Link>
          <Link href="#" aria-label="YouTube" className="text-muted-foreground hover:text-primary transition-colors">
            <YouTubeIcon className="h-5 w-5" />
          </Link>
          <div className="pl-3 ml-1 border-l border-primary/20">
            <Button asChild size="sm">
              <Link href="https://discord.com" prefetch={false}>
                <DiscordIcon className="mr-2 h-5 w-5" /> Join
              </Link>
            </Button>
          </div>
        </div>
        <button className="ml-auto md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </button>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex flex-col items-center justify-center h-full gap-8 text-lg font-medium">
            <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </button>
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-2xl font-bold hover:text-primary transition-colors"
                prefetch={false}
                onClick={() => setIsMenuOpen(false)} // Close menu on click
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-6">
              <Link
                href="#"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <InstagramIcon className="h-7 w-7" />
              </Link>
              <Link href="#" aria-label="TikTok" className="text-muted-foreground hover:text-primary transition-colors">
                <TikTokIcon className="h-7 w-7" />
              </Link>
              <Link
                href="#"
                aria-label="Twitter"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <TwitterIcon className="h-7 w-7" />
              </Link>
              <Link
                href="#"
                aria-label="YouTube"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <YouTubeIcon className="h-7 w-7" />
              </Link>
            </div>
            <Button asChild size="lg">
              <Link href="https://discord.com" prefetch={false}>
                <DiscordIcon className="mr-2 h-5 w-5" /> Join Discord
              </Link>
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1">
        <section className="relative w-full pt-20 md:pt-32 lg:pt-40 text-center">
          <div className="container px-4 md:px-6 flex flex-col items-center">
            <div
              className="relative w-48 h-48 md:w-64 md:h-64 mb-8 animate-fadeIn"
              style={{
                filter: "drop-shadow(0 0 30px hsl(var(--primary))) drop-shadow(0 0 60px hsl(var(--secondary)))",
              }}
            >
              <Image src="/vfl-logo.jpeg" layout="fill" objectFit="contain" alt="VFL Logo" className="rounded-full" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground/80">
              The Void Opens for Madden 26
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-6">
              Entering our 10th franchise season, the VFL is the ultimate franchise experience. Forge your legacy, prove
              your skill, and etch your name in the annals of Madden history.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                <Link href="https://discord.com" prefetch={false}>
                  <DiscordIcon className="mr-2 h-6 w-6" /> Join the VFL Waitlist
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="highlights" className="w-full py-24 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Gameday Highlights</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Top plays from across the VFL. Will you be featured next?
              </p>
            </div>
            <Carousel plugins={[autoplayPlugin.current]} className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {highlightsData.map((highlight) => (
                  <CarouselItem key={highlight.id}>
                    <HighlightVideoCard {...highlight} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 md:left-[-50px]" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 md:right-[-50px]" />
            </Carousel>
          </div>
        </section>

        <section id="intel" className="w-full py-24 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">VFL Intel Hub</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Live updates from around the league.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <RssFeedCard title="Madden NFL on X" feedUrl={MADDEN_RSS_URL} />
              <RssFeedCard title="NFL on X" feedUrl={NFL_RSS_URL} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-primary/20 py-8 nfl-card">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Void Fantasy League. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
              <TwitterIcon className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="YouTube" className="text-muted-foreground hover:text-primary transition-colors">
              <YouTubeIcon className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              aria-label="Instagram"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <InstagramIcon className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="TikTok" className="text-muted-foreground hover:text-primary transition-colors">
              <TikTokIcon className="h-5 w-5" />
            </Link>
            <Link
              href="https://discord.com"
              aria-label="Discord"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <DiscordIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
