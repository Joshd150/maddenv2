"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
import { PlayerComparisonBar } from "./player-comparison-bar"
import { PlayerSelectionDialog } from "./player-selection-dialog"
import { aggregatePlayerStats } from "@/lib/utils"
import { StatProgressBar } from "./stat-progress-bar"
import { cn } from "@/lib/utils" // Import cn for conditional classes

interface PlayerDetailDialogProps {
  player: Player
  teams: Team[]
  leagueId: string
  onClose: () => void
  initialComparePlayer?: Player | null
  onInitiateCompare: (player1: Player, player2: Player) => void
  onRemoveComparePlayer: () => void
}

// Helper to format DevTrait
const formatDevTrait = (trait: DevTrait) => {
  switch (trait) {
    case DevTrait.NORMAL:
      return "Normal"
    case DevTrait.STAR:
      return "Star"
    case DevTrait.SUPERSTAR:
      return "Superstar"
    case DevTrait.XFACTOR:
      return "X-Factor"
    default:
      return "Unknown"
  }
}

// Helper to format QBStyleTrait
const formatQBStyleTrait = (trait: QBStyleTrait) => {
  switch (trait) {
    case QBStyleTrait.BALANCED:
      return "Balanced"
    case QBStyleTrait.POCKET:
      return "Pocket"
    case QBStyleTrait.SCRAMBLING:
      return "Scrambling"
    default:
      return "Unknown"
  }
}

// Helper to format SensePressureTrait
const formatSensePressureTrait = (trait: SensePressureTrait) => {
  switch (trait) {
    case SensePressureTrait.IDEAL:
      return "Ideal"
    case SensePressureTrait.AVERAGE:
      return "Average"
    case SensePressureTrait.PARANOID:
      return "Paranoid"
    case SensePressureTrait.TRIGGER_HAPPY:
      return "Trigger Happy"
    case SensePressureTrait.OBLIVIOUS:
      return "Oblivious"
    default:
      return "Unknown"
  }
}

// Helper to format PenaltyTrait
const formatPenaltyTrait = (trait: PenaltyTrait) => {
  switch (trait) {
    case PenaltyTrait.DISCIPLINED:
      return "Disciplined"
    case PenaltyTrait.NORMAL:
      return "Normal"
    case PenaltyTrait.UNDISCIPLINED:
      return "Undisciplined"
    default:
      return "Unknown"
  }
}

// Helper to format YesNoTrait
const formatYesNoTrait = (trait: YesNoTrait) => {
  return trait === YesNoTrait.YES ? "Yes" : "No"
}

// Helper to format PlayBallTrait
const formatPlayBallTrait = (trait: PlayBallTrait) => {
  switch (trait) {
    case PlayBallTrait.AGGRESSIVE:
      return "Aggressive"
    case PlayBallTrait.BALANCED:
      return "Balanced"
    case PlayBallTrait.CONSERVATIVE:
      return "Conservative"
    default:
      return "Unknown"
  }
}

// Helper to format CoverBallTrait
const formatCoverBallTrait = (trait: CoverBallTrait) => {
  switch (trait) {
    case CoverBallTrait.ALWAYS:
      return "Always"
    case CoverBallTrait.ON_BIG_HITS:
      return "On Big Hits"
    case CoverBallTrait.ON_MEDIUM_HITS:
      return "On Medium Hits"
    case CoverBallTrait.FOR_ALL_HITS:
      return "For All Hits"
    case CoverBallTrait.NEVER:
      return "Never"
    default:
      return "Unknown"
  }
}

// Helper to format LBStyleTrait
const formatLBStyleTrait = (trait: LBStyleTrait) => {
  switch (trait) {
    case LBStyleTrait.BALANCED:
      return "Balanced"
    case LBStyleTrait.COVER_LB:
      return "Cover LB"
    case LBStyleTrait.PASS_RUSH:
      return "Pass Rush"
    default:
      return "Unknown"
  }
}

// Helper to format money
const formatMoney = (amount: number) => {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  return `$${(amount / 1_000).toFixed(0)}K`
}

// Helper to get season formatting
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

export function PlayerDetailDialog({
  player,
  teams,
  leagueId,
  onClose,
  initialComparePlayer,
  onInitiateCompare,
  onRemoveComparePlayer,
}: PlayerDetailDialogProps) {
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
  const [comparePlayerStats, setComparePlayerStats] = useState<Record<PlayerStatType, PlayerStatEntry[]>>({
    [PlayerStatType.PASSING]: [],
    [PlayerStatType.RUSHING]: [],
    [PlayerStatType.RECEIVING]: [],
    [PlayerStatType.DEFENSE]: [],
    [PlayerStatType.KICKING]: [],
    [PlayerStatType.PUNTING]: [],
  })
  const [loadingCompareStats, setLoadingCompareStats] = useState(false)
  const [errorCompareStats, setErrorCompareStats] = useState<string | null>(null)

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

  useEffect(() => {
    const loadCompareStatsForPlayer = async () => {
      if (!comparePlayer) {
        setComparePlayerStats({
          [PlayerStatType.PASSING]: [],
          [PlayerStatType.RUSHING]: [],
          [PlayerStatType.RECEIVING]: [],
          [PlayerStatType.DEFENSE]: [],
          [PlayerStatType.KICKING]: [],
          [PlayerStatType.PUNTING]: [],
        })
        return
      }

      setLoadingCompareStats(true)
      setErrorCompareStats(null)
      try {
        const fetchedStats = await getPlayerStats(leagueId, comparePlayer)
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
        setComparePlayerStats(groupedStats)
      } catch (err: any) {
        console.error("Failed to load compare player stats:", err)
        setErrorCompareStats(`Failed to load compare player stats: ${err.message || String(err)}`)
      } finally {
        setLoadingCompareStats(false)
      }
    }
    loadCompareStatsForPlayer()
  }, [comparePlayer, leagueId])

  const team = useMemo(() => teams.find((t) => t.teamId === player.teamId), [teams, player.teamId])
  const compareTeam = useMemo(
    () => teams.find((t) => t.teamId === comparePlayer?.teamId),
    [teams, comparePlayer?.teamId],
  )

  const aggregatedPlayerStats = useMemo(() => aggregatePlayerStats(playerStats), [playerStats])
  const aggregatedComparePlayerStats = useMemo(() => aggregatePlayerStats(comparePlayerStats), [comparePlayerStats])

  const handleSelectComparePlayer = (selected: Player) => {
    setComparePlayer(selected)
    onInitiateCompare(player, selected)
    setIsPlayerSelectionDialogOpen(false)
  }

  const handleRemoveCompare = () => {
    setComparePlayer(null)
    onRemoveComparePlayer()
  }

  const getOvrColorClass = (ovr: number) => {
    if (ovr >= 90) return "bg-green-500"
    if (ovr >= 80) return "bg-lime-500"
    if (ovr >= 70) return "bg-yellow-500"
    if (ovr >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  const renderStatSection = (title: string, stats: Record<string, any>, statKeys: string[]) => {
    const hasStats = statKeys.some((key) => stats[key] !== undefined && stats[key] !== null)
    if (!hasStats) return null

    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {statKeys.map((key) => {
            const value = stats[key]
            if (value === undefined || value === null) return null

            let displayValue = value
            if (typeof value === "number") {
              if (
                ["passerRating", "rushYdsPerAtt", "recYdsPerCatch", "puntYdsPerAtt", "puntNetYdsPerAtt"].includes(key)
              ) {
                displayValue = value.toFixed(1)
              } else {
                displayValue = value.toFixed(0)
              }
            }

            return (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                <span className="font-medium">{displayValue}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderPlayerInfo = (p: Player, t?: Team) => (
    <div className="flex items-center gap-4 mb-4">
      <Image
        src={t ? getTeamLogo(t.abbrName) : "/placeholder.svg"}
        alt={`${t?.displayName || "Free Agent"} logo`}
        width={64}
        height={64}
        className="rounded-full object-cover"
      />
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {p.firstName} {p.lastName}
          <span className={cn("px-2 py-1 rounded-md text-sm text-white", getOvrColorClass(p.overall))}>
            {p.overall} OVR
          </span>
        </h2>
        <p className="text-muted-foreground">
          {p.position} • {formatDevTrait(p.devTrait)}
        </p>
        <p className="text-muted-foreground">
          {p.age} yrs • {getSeasonFormatting(p.yearsPro)} • {Math.floor(p.height / 12)}'{p.height % 12}" • {p.weight}{" "}
          lbs
        </p>
      </div>
    </div>
  )

  const renderContractInfo = (p: Player) => (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Contract</h3>
      {p.isFreeAgent ? (
        <p className="text-muted-foreground">Free Agent</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Length:</span>
          <span className="font-medium">
            {p.contractYearsLeft}/{p.contractLength} yrs
          </span>
          <span className="text-muted-foreground">Salary:</span>
          <span className="font-medium">{formatMoney(p.contractSalary)}</span>
          <span className="text-muted-foreground">Cap Hit:</span>
          <span className="font-medium">{formatMoney(p.capHit)}</span>
          <span className="text-muted-foreground">Bonus:</span>
          <span className="font-medium">{formatMoney(p.contractBonus)}</span>
          <span className="text-muted-foreground">Net Savings:</span>
          <span className="font-medium">{formatMoney(p.capReleaseNetSavings)}</span>
          <span className="text-muted-foreground">Penalty:</span>
          <span className="font-medium">{formatMoney(p.capReleasePenalty)}</span>
        </div>
      )}
    </div>
  )

  const renderRatings = (p: Player) => (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Key Ratings</h3>
      <div className="grid grid-cols-1 gap-2">
        {Object.entries({
          Speed: p.speedRating,
          Acceleration: p.accelRating,
          Agility: p.agilityRating,
          Awareness: p.awareRating,
          Strength: p.strengthRating,
          ThrowPower: p.throwPowerRating,
          ThrowAcc: p.throwAccRating,
          Catching: p.catchRating,
          Tackle: p.tackleRating,
          ManCoverage: p.manCoverRating,
          ZoneCoverage: p.zoneCoverRating,
          KickPower: p.kickPowerRating,
          KickAcc: p.kickAccRating,
        }).map(([name, value]) => (
          <StatProgressBar key={name} label={name} value={value} maxValue={100} />
        ))}
      </div>
    </div>
  )

  const renderTraits = (p: Player) => (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Traits</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {p.qBStyleTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">QB Style:</span>
            <span className="font-medium">{formatQBStyleTrait(p.qBStyleTrait)}</span>
          </div>
        )}
        {p.sensePressureTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sense Pressure:</span>
            <span className="font-medium">{formatSensePressureTrait(p.sensePressureTrait)}</span>
          </div>
        )}
        {p.penaltyTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Penalty:</span>
            <span className="font-medium">{formatPenaltyTrait(p.penaltyTrait)}</span>
          </div>
        )}
        {p.throwAwayTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Throw Away:</span>
            <span className="font-medium">{formatYesNoTrait(p.throwAwayTrait)}</span>
          </div>
        )}
        {p.tightSpiralTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tight Spiral:</span>
            <span className="font-medium">{formatYesNoTrait(p.tightSpiralTrait)}</span>
          </div>
        )}
        {p.yACCatchTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">YAC Catch:</span>
            <span className="font-medium">{formatYesNoTrait(p.yACCatchTrait)}</span>
          </div>
        )}
        {p.posCatchTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Possession Catch:</span>
            <span className="font-medium">{formatYesNoTrait(p.posCatchTrait)}</span>
          </div>
        )}
        {p.hPCatchTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aggressive Catch:</span>
            <span className="font-medium">{formatYesNoTrait(p.hPCatchTrait)}</span>
          </div>
        )}
        {p.fightForYardsTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fight for Yards:</span>
            <span className="font-medium">{formatYesNoTrait(p.fightForYardsTrait)}</span>
          </div>
        )}
        {p.feetInBoundsTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Feet In Bounds:</span>
            <span className="font-medium">{formatYesNoTrait(p.feetInBoundsTrait)}</span>
          </div>
        )}
        {p.dropOpenPassTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Drop Open Pass:</span>
            <span className="font-medium">{formatYesNoTrait(p.dropOpenPassTrait)}</span>
          </div>
        )}
        {p.dLSwimTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">DL Swim:</span>
            <span className="font-medium">{formatYesNoTrait(p.dLSwimTrait)}</span>
          </div>
        )}
        {p.dLSpinTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">DL Spin:</span>
            <span className="font-medium">{formatYesNoTrait(p.dLSpinTrait)}</span>
          </div>
        )}
        {p.dLBullRushTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">DL Bull Rush:</span>
            <span className="font-medium">{formatYesNoTrait(p.dLBullRushTrait)}</span>
          </div>
        )}
        {p.stripBallTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strip Ball:</span>
            <span className="font-medium">{formatYesNoTrait(p.stripBallTrait)}</span>
          </div>
        )}
        {p.highMotorTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">High Motor:</span>
            <span className="font-medium">{formatYesNoTrait(p.highMotorTrait)}</span>
          </div>
        )}
        {p.bigHitTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Big Hitter:</span>
            <span className="font-medium">{formatYesNoTrait(p.bigHitTrait)}</span>
          </div>
        )}
        {p.lBStyleTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">LB Style:</span>
            <span className="font-medium">{formatLBStyleTrait(p.lBStyleTrait)}</span>
          </div>
        )}
        {p.playBallTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Play Ball:</span>
            <span className="font-medium">{formatPlayBallTrait(p.playBallTrait)}</span>
          </div>
        )}
        {p.coverBallTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cover Ball:</span>
            <span className="font-medium">{formatCoverBallTrait(p.coverBallTrait)}</span>
          </div>
        )}
        {p.predictTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Predictable:</span>
            <span className="font-medium">{formatYesNoTrait(p.predictTrait)}</span>
          </div>
        )}
        {p.clutchTrait !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clutch:</span>
            <span className="font-medium">{formatYesNoTrait(p.clutchTrait)}</span>
          </div>
        )}
      </div>
    </div>
  )

  const renderAbilities = (p: Player) => {
    const abilities = p.signatureSlotList?.filter((ability) => !ability.isEmpty && ability.signatureAbility)
    if (!abilities || abilities.length === 0) return null

    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Abilities</h3>
        <ul className="list-disc pl-5 text-sm">
          {abilities.map((ability, index) => (
            <li key={index} className="text-muted-foreground">
              <span className="font-medium">{ability.signatureAbility?.signatureTitle}</span>:{" "}
              {ability.signatureAbility?.signatureDescription}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Player Details</DialogTitle>
          <DialogDescription>View detailed information and career statistics for this player.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Player Info Column */}
            <div className="flex flex-col">
              {renderPlayerInfo(player, team)}
              <Separator className="my-4" />
              {renderContractInfo(player)}
              <Separator className="my-4" />
              {renderRatings(player)}
              <Separator className="my-4" />
              {renderTraits(player)}
              <Separator className="my-4" />
              {renderAbilities(player)}
            </div>

            {/* Stats and Comparison Column */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Career Stats</h3>
                {!comparePlayer ? (
                  <Button variant="outline" onClick={() => setIsPlayerSelectionDialogOpen(true)}>
                    Compare Player
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleRemoveCompare}>
                    Remove Comparison
                  </Button>
                )}
              </div>

              {comparePlayer && (
                <PlayerComparisonBar
                  player1={player}
                  player2={comparePlayer}
                  player1Stats={aggregatedPlayerStats}
                  player2Stats={aggregatedComparePlayerStats}
                  teams={teams}
                />
              )}

              {loadingStats ? (
                <div className="text-center text-muted-foreground">Loading stats...</div>
              ) : errorStats ? (
                <div className="text-red-400 text-center">{errorStats}</div>
              ) : (
                <>
                  {renderStatSection("Passing Stats", aggregatedPlayerStats, [
                    "passComp",
                    "passAtt",
                    "passYds",
                    "passTDs",
                    "passInts",
                    "passerRating",
                    "passSacks",
                  ])}
                  {renderStatSection("Rushing Stats", aggregatedPlayerStats, [
                    "rushAtt",
                    "rushYds",
                    "rushTDs",
                    "rushFum",
                    "rushYdsPerAtt",
                  ])}
                  {renderStatSection("Receiving Stats", aggregatedPlayerStats, [
                    "recCatches",
                    "recYds",
                    "recTDs",
                    "recDrops",
                  ])}
                  {renderStatSection("Defensive Stats", aggregatedPlayerStats, [
                    "defTotalTackles",
                    "defSacks",
                    "defInts",
                    "defFumRec",
                    "defForcedFum",
                    "defTDs",
                    "defDeflections",
                  ])}
                  {renderStatSection("Kicking Stats", aggregatedPlayerStats, [
                    "fGMade",
                    "fGAtt",
                    "xPMade",
                    "xPAtt",
                    "kickPts",
                    "fGLongest",
                  ])}
                  {renderStatSection("Punting Stats", aggregatedPlayerStats, [
                    "puntAtt",
                    "puntYds",
                    "puntYdsPerAtt",
                    "puntNetYdsPerAtt",
                    "puntsIn20",
                    "puntTBs",
                    "puntsBlocked",
                  ])}
                </>
              )}
            </div>
          </div>
        </ScrollArea>
        {isPlayerSelectionDialogOpen && (
          <PlayerSelectionDialog
            leagueId={leagueId}
            teams={teams}
            onSelectPlayer={handleSelectComparePlayer}
            onClose={() => setIsPlayerSelectionDialogOpen(false)}
            excludePlayerId={player.rosterId}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
