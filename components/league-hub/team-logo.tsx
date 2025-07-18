import Image from "next/image"

interface TeamLogoProps {
  teamAbbr: string
  width?: number
  height?: number
  className?: string
}

export function TeamLogo({ teamAbbr, width = 24, height = 24, className }: TeamLogoProps) {
  const logoPath = `/images/teams/${(teamAbbr || "fa").toLowerCase()}.png` // This line is key

  return (
    <Image
      src={logoPath || "/placeholder.svg"}
      alt={`${teamAbbr} Logo`}
      width={width}
      height={height}
      className={className}
      // Handle potential missing logos gracefully
      onError={(e) => {
        e.currentTarget.src = "/images/teams/fa.png" // Fallback if specific logo is not found
      }}
    />
  )
}
