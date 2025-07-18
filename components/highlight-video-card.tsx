"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, VolumeX } from "lucide-react"
import type { Highlight } from "@/lib/highlights-data"

export function HighlightVideoCard({ title, description, videoSrc, youtubeUrl }: Highlight) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  // This effect uses IntersectionObserver to play the video only when it's visible on screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const vid = videoRef.current
            if (vid) {
              const playPromise = vid.play()
              // Prevent “unhandled promise rejection“ when the browser can’t play the source.
              if (playPromise !== undefined) {
                playPromise.catch(() => {
                  /* ignore unsupported-source errors */
                })
              }
            }
          } else {
            videoRef.current?.pause()
          }
        })
      },
      { threshold: 0.5 }, // Start playing when 50% of the video is visible
    )

    const currentVideoRef = videoRef.current
    if (currentVideoRef) {
      observer.observe(currentVideoRef)
    }

    return () => {
      if (currentVideoRef) {
        observer.unobserve(currentVideoRef)
      }
    }
  }, [])

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent the link navigation when clicking the icon
    e.stopPropagation()
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  return (
    <Link href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="block group">
      <Card className="bg-muted/30 border-primary/20 overflow-hidden">
        <CardContent className="p-0 relative">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted={isMuted}
            loop
            playsInline // Essential for autoplay on iOS
            className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <button
            onClick={handleMuteToggle}
            className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
          </button>
          <div className="p-4">
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
