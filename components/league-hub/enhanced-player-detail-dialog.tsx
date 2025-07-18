"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getPlayerStats } from "@/lib/maddenDb"
import {
  type Player,
  type Team,
  type PlayerStatEntry,
  PlayerStatType,
  DevTrait,
  QBStyleTrait,
  SensePressureTrait,
  PenaltyTrait,
  YesNoTrait,
  PlayBallTrait,
  CoverBallTrait,
  LBStyleTrait,
} from "@/lib/madden-types"
import { getTeamLogo } from "@/lib/teamLogos"
import Image from "next/image"
import { PlayerSelectionDialog } from "./player-selection-dialog"
import { aggregatePlayerStats } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { 
  User, Award, TrendingUp, BarChart3, Target, Zap, 
  Shield, Activity, Clock, Star, Crown, Flame 
} from "lucide-react"

interface EnhancedPlayerDetailDialogProps {
  player: Player
  teams: Team[]
  leagueId: string
  onClose: () => void
  initialComparePlayer?: Player | null
  onInitiateCompare: (player1: Player, player2: Player) => void
  onRemoveComparePlayer: () => void
}

// Enhanced rating component with visual progress bars
function RatingBar({ 
  label, 
  value, 
  maxValue = 100, 
  showValue = true,
  color = "primary" 
}: {
  label: string
  value: number
  maxValue?: number
  showValue?: boolean
  color?: "primary" | "green" | "yellow" | "red"
}) {
  const percentage = (value / maxValue) * 100
  
  const getColorClass = () => {
    if (color !== "primary") return `bg-${color}-500`
    if (value >= 90) return "bg-green-500"
    if (value >= 80) return "bg-lime-500"
    if (value >= 70) return "bg-yellow-500"
    if (value >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        {showValue && <span className="text-sm font-bold">{value}</span>}
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <div 
          className={cn("absolute top-0 left-0 h-2 rounded-full transition-all duration-500", getColorClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Position-specific rating groups
function getPositionRatings(player: Player) {
  const baseRatings = [
    { label: "Speed", value: player.speedRating },
    { label: "Acceleration", value: player.accelRating },
    { label: "Agility", value: player.agilityRating },
    { label: "Awareness", value: player.awareRating },
    { label: "Strength", value: player.strengthRating },
    { label: "Injury", value: player.injuryRating },
  ]

  const positionSpecific: Record<string, Array<{ label: string; value: number }>> = {
    QB: [
      { label: "Throw Power", value: player.throwPowerRating },
      { label: "Throw Accuracy", value: player.throwAccRating },
      { label: "Deep Accuracy", value: player.throwAccDeepRating },
      { label: "Medium Accuracy", value: player.throwAccMidRating },
      { label: "Short Accuracy", value: player.throwAccShortRating },
      { label: "Play Action", value: player.playActionRating },
      { label: "Throw Under Pressure", value: player.throwUnderPressureRating },
      { label: "Break Sack", value: player.breakSackRating },
    ],
    HB: [
      { label: "Break Tackle", value: player.breakTackleRating },
      { label: "Carrying", value: player.carryRating },
      { label: "BC Vision", value: player.bCVRating },
      { label: "Truck", value: player.truckRating },
      { label: "Stiff Arm", value: player.stiffArmRating },
      { label: "Juke Move", value: player.jukeMoveRating },
      { label: "Spin Move", value: player.spinMoveRating },
      { label: "Change of Direction", value: player.changeOfDirectionRating },
    ],
    WR: [
      { label: "Catching", value: player.catchRating },
      { label: "Catch in Traffic", value: player.cITRating },
      { label: "Short Route", value: player.routeRunShortRating },
      { label: "Medium Route", value: player.routeRunMedRating },
      { label: "Deep Route", value: player.routeRunDeepRating },
      { label: "Spectacular Catch", value: player.specCatchRating },
      { label: "Release", value: player.releaseRating },
      { label: "Jumping", value: player.jumpRating },
    ],
    TE: [
      { label: "Catching", value: player.catchRating },
      { label: "Run Block", value: player.runBlockRating },
      { label: "Short Route", value: player.routeRunShortRating },
      { label: "Medium Route", value: player.routeRunMedRating },
      { label: "Deep Route", value: player.routeRunDeepRating },
      { label: "Catch in Traffic", value: player.cITRating },
      { label: "Impact Blocking", value: player.impactBlockRating },
      { label: "Pass Blocking", value: player.passBlockRating },
    ],
  }

  // Add offensive line ratings for all OL positions
  const oLineRatings = [
    { label: "Run Block", value: player.runBlockRating },
    { label: "Pass Block", value: player.passBlockRating },
    { label: "Run Block Power", value: player.runBlockPowerRating },
    { label: "Run Block Finesse", value: player.runBlockFinesseRating },
    { label: "Pass Block Power", value: player.passBlockPowerRating },
    { label: "Pass Block Finesse", value: player.passBlockFinesseRating },
    { label: "Impact Blocking", value: player.impactBlockRating },
    { label: "Lead Block", value: player.leadBlockRating },
  ]

  // Add defensive ratings for defensive positions
  const defensiveRatings = [
    { label: "Tackle", value: player.tackleRating },
    { label: "Hit Power", value: player.hitPowerRating },
    { label: "Power Moves", value: player.powerMovesRating },
    { label: "Finesse Moves", value: player.finesseMovesRating },
    { label: "Block Shedding", value: player.blockShedRating },
    { label: "Pursuit", value: player.pursuitRating },
    { label: "Play Recognition", value: player.playRecRating },
    { label: "Man Coverage", value: player.manCoverRating },
    { label: "Zone Coverage", value: player.zoneCoverRating },
    { label: "Press", value: player.pressRating },
  ]

  const oLinePositions = ['LT', 'LG', 'C', 'RG', 'RT']
  const defensivePositions = ['LE', 'RE', 'DT', 'LOLB', 'MLB', 'ROLB', 'CB', 'FS', 'SS']

  let specificRatings = positionSpecific[player.position] || []
  
  if (oLinePositions.includes(player.position)) {
    specificRatings = oLineRatings
  } else if (defensivePositions.includes(player.position)) {
    specificRatings = defensiveRatings
  }

  return { baseRatings, specificRatings }
}

// Helper functions for trait formatting
const formatDevTrait = (trait: DevTrait) => {
  switch (trait) {
    case DevTrait.NORMAL: return "Normal"
    case DevTrait.STAR: return "Star"
    case DevTrait.SUPERSTAR: return "Superstar"
    case DevTrait.XFACTOR: return "X-Factor"
    default: return "Unknown"
  }
}

const formatQBStyleTrait = (trait: QBStyleTrait) => {
  switch (trait) {
    case QBStyleTrait.BALANCED: return "Balanced"
    case QBStyleTrait.POCKET: return "Pocket"
    case QBStyleTrait.SCRAMBLING: return "Scrambling"
    default: return "Unknown"
  }
}

const formatSensePressureTrait = (trait: SensePressureTrait) => {
  switch (trait) {
    case SensePressureTrait.IDEAL: return "Ideal"
    case SensePressureTrait.AVERAGE: return "Average"
    case SensePressureTrait.PARANOID: return "Paranoid"
    case SensePressureTrait.TRIGGER_HAPPY: return "Trigger Happy"
    case SensePressureTrait.OBLIVIOUS: return "Oblivious"
    default: return "Unknown"
  }
}

const formatPenaltyTrait = (trait: PenaltyTrait) => {
  switch (trait) {
    case PenaltyTrait.DISCIPLINED: return "Disciplined"
    case PenaltyTrait.NORMAL: return "Normal"
    case PenaltyTrait.UNDISCIPLINED: return "Undisciplined"
    default: return "Unknown"
  }
}

const formatYesNoTrait = (trait: YesNoTrait) => {
  return trait === YesNoTrait.YES ? "Yes" : "No"
}

const formatPlayBallTrait = (trait: PlayBallTrait) => {
  switch (trait) {
    case PlayBallTrait.AGGRESSIVE: return "Aggressive"
    case PlayBallTrait.BALANCED: return "Balanced"
    case PlayBallTrait.CONSERVATIVE: return "Conservative"
    default: return "Unknown"
  }
}

const formatCoverBallTrait = (trait: CoverBallTrait) => {
  switch (trait) {
    case CoverBallTrait.ALWAYS: return "Always"
    case CoverBallTrait.ON_BIG_HITS: return "On Big Hits"
    case CoverBallTrait.ON_MEDIUM_HITS: return "On Medium Hits"
    case CoverBallTrait.FOR_ALL_HITS: return "For All Hits"
    case CoverBallTrait.NEVER: return "Never"
    default: return "Unknown"
  }
}

const formatLBStyleTrait = (trait: LBStyleTrait) => {
  switch (trait) {
    case LBStyleTrait.BALANCED: return "Balanced"
    case LBStyleTrait.COVER_LB: return "Cover LB"
    case LBStyleTrait.PASS_RUSH: return "Pass Rush"
    default: return "Unknown"
  }
}

const formatMoney = (amount: number) => {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  return `$${(amount / 1_000).toFixed(0)}K`
}

const getSeasonFormatting = (yearsPro: number) => {
  if (yearsPro === 0) {
    return "Rookie"
  }
  const rules = new Intl.PluralRules("en-US", { type: "ordinal" })
  const suffixes = new Map([
    ["one", "st"],
    ["two", "nd"],
    ["few", "rd"],
    ["other", "th"],
  ])
  const rule = rules.select(yearsPro + 1)
  const suffix = suffixes.get(rule)
  return `${yearsPro + 1}${suffix} Season`
}

export function EnhancedPlayerDetailDialog({
  player,
  teams,
  leagueId,
  onClose,
  initialComparePlayer,
  onInitiateCompare,
  onRemoveComparePlayer,
}: EnhancedPlayerDetailDialogProps) {
  const [playerStats, setPlayerStats] = useState<Record<PlayerStatType, PlayerStatEntry[]>>({
    [PlayerStatType.PASSING]: [],
    [PlayerStatType.RUSHING]: [],
    [PlayerStatType.RECEIVING]: [],
    [PlayerStatType.DEFENSE]: [],
    [PlayerStatType.KICKING]: [],
    [PlayerStatType.PUNTING]: [],
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [errorStats, setErrorStats] = useState<string | null>(null)
  const [isPlayerSelectionDialogOpen, setIsPlayerSelectionDialogOpen] = useState(false)
  const [comparePlayer, setComparePlayer] = useState<Player | null>(initialComparePlayer || null)

  useEffect(() => {
    const loadStatsForPlayer = async () => {
      setLoadingStats(true)
      setErrorStats(null)
      try {
        const fetchedStats = await getPlayerStats(leagueId, player)
        const groupedStats: Record<PlayerStatType, PlayerStatEntry[]> = {
          [PlayerStatType.PASSING]: [],
          [PlayerStatType.RUSHING]: [],
          [PlayerStatType.RECEIVING]: [],
          [PlayerStatType.DEFENSE]: [],
          [PlayerStatType.KICKING]: [],
          [PlayerStatType.PUNTING]: [],
        }

        fetchedStats.forEach((stat) => {
          if (stat.passAtt !== undefined) groupedStats[PlayerStatType.PASSING].push(stat)
          else if (stat.rushAtt !== undefined) groupedStats[PlayerStatType.RUSHING].push(stat)
          else if (stat.recCatches !== undefined) groupedStats[PlayerStatType.RECEIVING].push(stat)
          else if (stat.defTotalTackles !== undefined) groupedStats[PlayerStatType.DEFENSE].push(stat)
          else if (stat.fGMade !== undefined) groupedStats[PlayerStatType.KICKING].push(stat)
          else if (stat.puntAtt !== undefined) groupedStats[PlayerStatType.PUNTING].push(stat)
        })

        setPlayerStats(groupedStats)
      } catch (err: any) {
        console.error("Failed to load player stats:", err)
        setErrorStats(`Failed to load player stats: ${err.message || String(err)}`)
      } finally {
        setLoadingStats(false)
      }
    }
    loadStatsForPlayer()
  }, [player, leagueId])

  const team = useMemo(() => teams.find((t) => t.teamId === player.teamId), [teams, player.teamId])
  const aggregatedPlayerStats = useMemo(() => aggregatePlayerStats(playerStats), [playerStats])
  const { baseRatings, specificRatings } = getPositionRatings(player)

  const getOvrColorClass = (ovr: number) => {
    if (ovr >= 90) return "bg-green-500"
    if (ovr >= 80) return "bg-lime-500"
    if (ovr >= 70) return "bg-yellow-500"
    if (ovr >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  const getDevTraitIcon = (trait: DevTrait) => {
    switch (trait) {
      case DevTrait.XFACTOR: return <Crown className="w-5 h-5" />
      case DevTrait.SUPERSTAR: return <Star className="w-5 h-5" />
      case DevTrait.STAR: return <Flame className="w-5 h-5" />
      default: return <User className="w-5 h-5" />
    }
  }

  const renderStatSection = (title: string, stats: Record<string, any>, statKeys: string[], icon: React.ReactNode) => {
    const hasStats = statKeys.some((key) => stats[key] !== undefined && stats[key] !== null)
    if (!hasStats) return null

    return (
      <Card className="nfl-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {statKeys.map((key) => {
              const value = stats[key]
              if (value === undefined || value === null) return null

              let displayValue = value
              if (typeof value === "number") {
                if (["passerRating", "rushYdsPerAtt", "recYdsPerCatch", "puntYdsPerAtt", "puntNetYdsPerAtt"].includes(key)) {
                  displayValue = value.toFixed(1)
                } else {
                  displayValue = value.toFixed(0)
                }
              }

              return (
                <div key={key} className="flex justify-between items-center p-2 rounded bg-muted/30">
                  <span className="text-sm text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                  <span className="font-bold text-lg">{displayValue}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl max-h-[95vh] p-0 flex flex-col">
        {/* Enhanced Hero Header */}
        <div className="bg-white border-b border-border p-4 sm:p-6 text-foreground relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          <DialogHeader className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 mb-4 lg:mb-6">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                <div className="flex items-center gap-3">
                  {team && (
                    <Image
                      src={getTeamLogo(team.abbrName || team.teamAbbr) || "/placeholder.svg"}
                      alt={`${team.displayName} logo`}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  )}
                  <div className="w-16 h-16 vfl-gradient rounded-full flex items-center justify-center border-2 border-primary/30">
                    <span className="text-xl font-bold text-white">{player.position}</span>
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black mb-2 text-foreground">
                    {player.firstName} {player.lastName}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-sm sm:text-base lg:text-lg xl:text-xl text-foreground">
                    <span className="font-bold">{player.position}</span>
                    <span className={cn("px-2 sm:px-3 py-1 rounded-full text-sm sm:text-base lg:text-lg font-black text-white", getOvrColorClass(player.playerBestOvr || player.overall))}>
                      {player.playerBestOvr || player.overall} OVR
                    </span>
                    <Badge variant="secondary" className="text-xs sm:text-sm lg:text-base px-2 sm:px-3 py-1">
                      {formatDevTrait(player.devTrait)}
                    </Badge>
                  </div>
                  <DialogDescription className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2">
                    {player.age} years old • {getSeasonFormatting(player.yearsPro)} • {Math.floor(player.height / 12)}'{player.height % 12}" • {player.weight} lbs
                  </DialogDescription>
                </div>
              </div>
              <div className="text-left lg:text-right">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{team?.displayName || "Free Agent"}</div>
                <div className="text-base sm:text-lg text-muted-foreground">{team?.abbrName || "FA"}</div>
                <div className="mt-2">
                  <Button
                    onClick={() => setIsPlayerSelectionDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="vfl-gradient text-white hover:opacity-90"
                  >
                    Compare Player
                  </Button>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-3 sm:p-4 lg:p-6 flex-shrink-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-4 sm:mb-6 nfl-card">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="ratings" className="flex items-center gap-2">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Ratings</span>
                  <span className="sm:hidden">Rate</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Statistics</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="traits" className="flex items-center gap-2">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Traits</span>
                  <span className="lg:hidden">Trait</span>
                </TabsTrigger>
                <TabsTrigger value="contract" className="flex items-center gap-2">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Contract</span>
                  <span className="lg:hidden">$</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Key Ratings */}
                  <Card className="nfl-card lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                        Key Ratings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      {baseRatings.slice(0, 6).map((rating) => (
                        <RatingBar
                          key={rating.label}
                          label={rating.label}
                          value={rating.value}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="nfl-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Overall Rating</span>
                        <span className="font-bold text-base sm:text-lg">{player.overall}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Best Overall</span>
                        <span className="font-bold text-base sm:text-lg">{player.playerBestOvr}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Development</span>
                        <span className="font-bold">{formatDevTrait(player.devTrait)}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Experience</span>
                        <span className="font-bold">{getSeasonFormatting(player.yearsPro)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Abilities */}
                {player.signatureSlotList && player.signatureSlotList.some(ability => !ability.isEmpty) && (
                  <Card className="nfl-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5" />
                        Signature Abilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {player.signatureSlotList
                          .filter(ability => !ability.isEmpty && ability.signatureAbility)
                          .map((ability, index) => (
                            <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
                              <div className="font-bold text-lg mb-2">{ability.signatureAbility?.signatureTitle}</div>
                              <div className="text-sm text-muted-foreground">{ability.signatureAbility?.signatureDescription}</div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="ratings" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Base Physical Ratings */}
                  <Card className="nfl-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Physical Attributes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {baseRatings.map((rating) => (
                        <RatingBar
                          key={rating.label}
                          label={rating.label}
                          value={rating.value}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Position-Specific Ratings */}
                  <Card className="nfl-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {player.position} Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {specificRatings.slice(0, 8).map((rating) => (
                        <RatingBar
                          key={rating.label}
                          label={rating.label}
                          value={rating.value}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Ratings if available */}
                {specificRatings.length > 8 && (
                  <Card className="nfl-card lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Additional Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {specificRatings.slice(8).map((rating) => (
                          <RatingBar
                            key={rating.label}
                            label={rating.label}
                            value={rating.value}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                {loadingStats ? (
                  <div className="text-center text-muted-foreground py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    Loading career statistics...
                  </div>
                ) : errorStats ? (
                  <div className="text-red-400 text-center py-12">{errorStats}</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderStatSection("Passing Stats", aggregatedPlayerStats, [
                      "passComp", "passAtt", "passYds", "passTDs", "passInts", "passerRating", "passSacks"
                    ], <TrendingUp className="w-5 h-5" />)}
                    
                    {renderStatSection("Rushing Stats", aggregatedPlayerStats, [
                      "rushAtt", "rushYds", "rushTDs", "rushFum", "rushYdsPerAtt"
                    ], <Activity className="w-5 h-5" />)}
                    
                    {renderStatSection("Receiving Stats", aggregatedPlayerStats, [
                      "recCatches", "recYds", "recTDs", "recDrops"
                    ], <Target className="w-5 h-5" />)}
                    
                    {renderStatSection("Defensive Stats", aggregatedPlayerStats, [
                      "defTotalTackles", "defSacks", "defInts", "defFumRec", "defForcedFum", "defTDs", "defDeflections"
                    ], <Shield className="w-5 h-5" />)}
                    
                    {renderStatSection("Kicking Stats", aggregatedPlayerStats, [
                      "fGMade", "fGAtt", "xPMade", "xPAtt", "kickPts", "fGLongest"
                    ], <Award className="w-5 h-5" />)}
                    
                    {renderStatSection("Punting Stats", aggregatedPlayerStats, [
                      "puntAtt", "puntYds", "puntYdsPerAtt", "puntNetYdsPerAtt", "puntsIn20", "puntTBs", "puntsBlocked"
                    ], <Clock className="w-5 h-5" />)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="traits" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Playing Style Traits */}
                  <Card className="nfl-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Playing Style
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {player.qBStyleTrait !== undefined && (
                        <div className="flex justify-between items-center p-3 rounded bg-muted/30">
                          <span>QB Style:</span>
                          <Badge variant="outline">{formatQBStyleTrait(player.qBStyleTrait)}</Badge>
                        </div>
                      )}
                      {player.sensePressureTrait !== undefined && (
                        <div className="flex justify-between items-center p-3 rounded bg-muted/30">
                          <span>Sense Pressure:</span>
                          <Badge variant="outline">{formatSensePressureTrait(player.sensePressureTrait)}</Badge>
                        </div>
                      )}
                      {player.lBStyleTrait !== undefined && (
                        <div className="flex justify-between items-center p-3 rounded bg-muted/30">
                          <span>LB Style:</span>
                          <Badge variant="outline">{formatLBStyleTrait(player.lBStyleTrait)}</Badge>
                        </div>
                      )}
                      {player.playBallTrait !== undefined && (
                        <div className="flex justify-between items-center p-3 rounded bg-muted/30">
                          <span>Play Ball:</span>
                          <Badge variant="outline">{formatPlayBallTrait(player.playBallTrait)}</Badge>
                        </div>
                      )}
                      {player.coverBallTrait !== undefined && (
                        <div className="flex justify-between items-center p-3 rounded bg-muted/30">
                          <span>Cover Ball:</span>
                          <Badge variant="outline">{formatCoverBallTrait(player.coverBallTrait)}</Badge>
                        </div>
                      )}
                      {player.penaltyTrait !== undefined && (
                        <div className="flex justify-between items-center p-3 rounded bg-muted/30">
                          <span>Penalty:</span>
                          <Badge variant="outline">{formatPenaltyTrait(player.penaltyTrait)}</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Special Abilities */}
                  <Card className="nfl-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Special Abilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Throw Away", value: player.throwAwayTrait },
                        { label: "Tight Spiral", value: player.tightSpiralTrait },
                        { label: "YAC Catch", value: player.yACCatchTrait },
                        { label: "Possession Catch", value: player.posCatchTrait },
                        { label: "Aggressive Catch", value: player.hPCatchTrait },
                        { label: "Fight for Yards", value: player.fightForYardsTrait },
                        { label: "Feet in Bounds", value: player.feetInBoundsTrait },
                        { label: "Drop Open Pass", value: player.dropOpenPassTrait },
                        { label: "DL Swim", value: player.dLSwimTrait },
                        { label: "DL Spin", value: player.dLSpinTrait },
                        { label: "DL Bull Rush", value: player.dLBullRushTrait },
                        { label: "Strip Ball", value: player.stripBallTrait },
                        { label: "High Motor", value: player.highMotorTrait },
                        { label: "Big Hitter", value: player.bigHitTrait },
                        { label: "Clutch", value: player.clutchTrait },
                      ]
                        .filter(trait => trait.value !== undefined)
                        .map((trait) => (
                          <div key={trait.label} className="flex justify-between items-center p-2 rounded bg-muted/30">
                            <span className="text-sm">{trait.label}:</span>
                            <Badge 
                              variant={trait.value === YesNoTrait.YES ? "default" : "secondary"}
                              className={trait.value === YesNoTrait.YES ? "bg-green-500" : ""}
                            >
                              {formatYesNoTrait(trait.value!)}
                            </Badge>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="contract" className="space-y-6">
                <Card className="nfl-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Contract Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {player.isFreeAgent ? (
                      <div className="text-center py-12">
                        <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-2xl font-bold mb-2">Free Agent</h3>
                        <p className="text-muted-foreground">This player is currently a free agent</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                            <span className="font-medium">Contract Length:</span>
                            <span className="font-bold text-lg">{player.contractYearsLeft}/{player.contractLength} years</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                            <span className="font-medium">Annual Salary:</span>
                            <span className="font-bold text-lg text-green-400">{formatMoney(player.contractSalary)}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                            <span className="font-medium">Cap Hit:</span>
                            <span className="font-bold text-lg">{formatMoney(player.capHit)}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                            <span className="font-medium">Signing Bonus:</span>
                            <span className="font-bold text-lg">{formatMoney(player.contractBonus)}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                            <span className="font-medium">Release Savings:</span>
                            <span className="font-bold text-lg text-green-400">{formatMoney(player.capReleaseNetSavings)}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                            <span className="font-medium">Release Penalty:</span>
                            <span className="font-bold text-lg text-red-400">{formatMoney(player.capReleasePenalty)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {isPlayerSelectionDialogOpen && (
          <PlayerSelectionDialog
            initialPlayer={player}
            onSelectPlayer={(selected) => {
              onInitiateCompare(player, selected)
              setIsPlayerSelectionDialogOpen(false)
            }}
            onClose={() => setIsPlayerSelectionDialogOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}