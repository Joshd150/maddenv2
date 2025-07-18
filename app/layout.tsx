import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Void Fantasy League | Madden 26",
  description: "The premier franchise experience for Madden 26. Entering our 10th franchise season.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("min-h-screen bg-background font-sans antialiased", GeistSans.className)}>
        {/* Fixed background video layer */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover -z-20 opacity-10"
          style={{
            backgroundAttachment: "fixed",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Original gradient background as a fallback/overlay */}
        <div
          className="fixed inset-0 -z-10 bg-gradient-to-br from-zinc-950 via-purple-950 to-black"
          style={{
            backgroundAttachment: "fixed",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        />
        {children}
      </body>
    </html>
  )
}
