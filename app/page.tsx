"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Menu, X, Trophy } from "lucide-react"
// Social icons temporarily commented out due to build issues
import type { RssItem } from "@/lib/types"
import { highlightsData } from "@/lib/highlights-data"
import { HighlightVideoCard } from "@/components/highlight-video-card"
import { SocialMediaNav } from "@/components/social-media-nav"

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
          <Twitter className="h-5 w-5" /> {title}
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
      {/* Video Background - Only on Home Page */}
      <video 
        className="video-background"
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="/videos/void-background.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
      
      <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center sticky top-0 z-50 vfl-card/80 backdrop-blur-lg border-b border-primary/20">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <div className="w-6 h-6 vfl-gradient rounded-full flex items-center justify-center">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm sm:text-base">VFL</span>
        </Link>
        <nav className="ml-auto hidden lg:flex gap-3 sm:gap-4 lg:gap-6 items-center">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs sm:text-sm font-medium hover:underline underline-offset-4"
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden lg:flex items-center gap-2 sm:gap-3">
          <SocialMediaNav size="sm" />
          <div className="pl-2 sm:pl-3 ml-1 border-l border-primary/20">
            <Button asChild size="sm">
              <Link href="https://discord.com" prefetch={false} className="vfl-gradient">
                <Menu className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Join</span>
              </Link>
            </Button>
          </div>
        </div>
        <button className="ml-auto lg:hidden touch-target" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="sr-only">Open menu</span>
        </button>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex flex-col items-center justify-center h-full gap-6 sm:gap-8 text-base sm:text-lg font-medium p-4">
            <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="sr-only">Close menu</span>
            </button>
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xl sm:text-2xl font-bold hover:text-primary transition-colors touch-target"
                prefetch={false}
                onClick={() => setIsMenuOpen(false)} // Close menu on click
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-4 sm:gap-6">
              <SocialMediaNav size="lg" showLabels={false} />
            </div>
            <Button asChild size="lg" className="touch-target vfl-gradient">
              <Link href="https://discord.com" prefetch={false}>
                <Menu className="mr-2 h-4 w-4" /> Join Discord
              </Link>
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1">
        <section className="relative w-full pt-12 sm:pt-16 md:pt-24 lg:pt-32 xl:pt-40 text-center">
          <div className="container px-3 sm:px-4 md:px-6 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 vfl-gradient rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-fadeIn shadow-2xl ring-4 ring-purple-500/30">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white drop-shadow-2xl px-2 mb-3">
              The Void Opens for Madden 26
            </h1>
            <p className="mx-auto max-w-[500px] lg:max-w-[600px] text-sm sm:text-base md:text-lg lg:text-xl text-white/90 drop-shadow-lg mt-3 sm:mt-4 px-4 leading-relaxed">
              Entering our 10th franchise season, the VFL is the ultimate franchise experience. Forge your legacy, prove
              your skill, and etch your name in the annals of Madden history.
            </p>
            <div className="mt-4 sm:mt-6">
              <Button asChild size="default" className="vfl-gradient hover:opacity-90 text-xs sm:text-sm lg:text-base px-4 sm:px-6 py-2 sm:py-3 touch-target">
                <Link href="https://discord.com" prefetch={false}>
                  <Menu className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Join the VFL Waitlist</span>
                  <span className="sm:hidden">Join VFL</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="highlights" className="w-full py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container px-3 sm:px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter">Gameday Highlights</h2>
              <p className="max-w-[600px] lg:max-w-[700px] text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground px-4">
                Top plays from across the VFL. Will you be featured next?
              </p>
            </div>
            <Carousel plugins={[autoplayPlugin.current]} className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl mx-auto">
              <CarouselContent>
                {highlightsData.map((highlight) => (
                  <CarouselItem key={highlight.id}>
                    <HighlightVideoCard {...highlight} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 lg:left-[-50px] touch-target" />
              <CarouselNext className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 lg:right-[-50px] touch-target" />
            </Carousel>
          </div>
        </section>

        <section id="intel" className="w-full py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container px-3 sm:px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tighter">VFL Intel Hub</h2>
              <p className="max-w-[600px] lg:max-w-[700px] text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground px-4">
                Live updates from around the league.
              </p>
            </div>
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
              <RssFeedCard title="Madden NFL on X" feedUrl={MADDEN_RSS_URL} />
              <RssFeedCard title="NFL on X" feedUrl={NFL_RSS_URL} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-primary/20 py-6 sm:py-8 nfl-card">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} Void Fantasy League. All Rights Reserved.
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <SocialMediaNav size="sm" />
            <Link
              href="https://discord.com"
              aria-label="Discord"
              className="text-muted-foreground hover:text-primary transition-colors touch-target"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}