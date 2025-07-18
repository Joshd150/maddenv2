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
        {/* NFL-style background */}
        <div
          className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
          style={{
            backgroundAttachment: "fixed",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        />
        {/* Subtle pattern overlay */}
        <div 
          className="fixed inset-0 -z-5 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "20px 20px" }}
        />
        {children}
      </body>
    </html>
  )
}
