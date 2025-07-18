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
import { PlayerSelectionDialog } from "./player-selection-dialog"
import { aggregatePlayerStats } from "@/lib/utils"

interface PlayerCompareDialogProps {
  player1: Player
  player2: Player | null
  teams: Team[]
  leagueId: string
  onClose: () => void
  onSelectPlayer2: (player: Player) => void
  onRemovePlayer2: () => void
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

const loadStats = async (player: Player, setStats: Function, setLoading: Function, setError: Function) => {
  setLoading(true)
  setError(null)
  try {
    const fetchedStats = await getPlayerStats(player.leagueId, player)
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
    setStats(groupedStats)
  } catch (err: any) {
    console.error("Failed to load player stats:", err)
    setError(`Failed to load player stats: ${err.message || String(err)}`)
  } finally {
    setLoading(false)
  }
}

export function PlayerCompareDialog({
  player1,
  player2,
  teams,
  leagueId,
  onClose,
  onSelectPlayer2,
  onRemovePlayer2,
}: PlayerCompareDialogProps) {
  const [player1Stats, setPlayer1Stats] = useState<Record<PlayerStatType, PlayerStatEntry[]>>({
    [PlayerStatType.PASSING]: [],
    [PlayerStatType.RUSHING]: [],
    [PlayerStatType.RECEIVING]: [],
    [PlayerStatType.DEFENSE]: [],
    [PlayerStatType.KICKING]: [],
    [PlayerStatType.PUNTING]: [],
  })
  const [loadingPlayer1Stats, setLoadingPlayer1Stats] = useState(true)
  const [errorPlayer1Stats, setErrorPlayer1Stats] = useState<string | null>(null)

  const [player2Stats, setPlayer2Stats] = useState<Record<PlayerStatType, PlayerStatEntry[]>>({
    [PlayerStatType.PASSING]: [],
    [PlayerStatType.RUSHING]: [],
    [PlayerStatType.RECEIVING]: [],
    [PlayerStatType.DEFENSE]: [],
    [PlayerStatType.KICKING]: [],
    [PlayerStatType.PUNTING]: [],
  })
  const [loadingPlayer2Stats, setLoadingPlayer2Stats] = useState(false)
  const [errorPlayer2Stats, setErrorPlayer2Stats] = useState<string | null>(null)

  const [isPlayerSelectionDialogOpen, setIsPlayerSelectionDialogOpen] = useState(false)

  useEffect(() => {
    loadStats(player1, setPlayer1Stats, setLoadingPlayer1Stats, setErrorPlayer1Stats)
  }, [player1])

  useEffect(() => {
    if (player2) {
      loadStats(player2, setPlayer2Stats, setLoadingPlayer2Stats, setErrorPlayer2Stats)
    } else {
      setPlayer2Stats({
        [PlayerStatType.PASSING]: [],
        [PlayerStatType.RUSHING]: [],
        [PlayerStatType.RECEIVING]: [],
        [PlayerStatType.DEFENSE]: [],
        [PlayerStatType.KICKING]: [],
        [PlayerStatType.PUNTING]: [],
      })
    }
  }, [player2])

  const team1 = useMemo(() => teams.find((t) => t.teamId === player1.teamId), [teams, player1.teamId])
  const team2 = useMemo(() => teams.find((t) => t.teamId === player2?.teamId), [teams, player2?.teamId])

  const aggregatedPlayer1Stats = useMemo(() => aggregatePlayerStats(player1Stats), [player1Stats])
  const aggregatedPlayer2Stats = useMemo(() => aggregatePlayerStats(player2Stats), [player2Stats])

  const handleSelectPlayer2 = (selected: Player) => {
    onSelectPlayer2(selected)
    setIsPlayerSelectionDialogOpen(false)
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
        <h2 className="text-2xl font-bold">
          {p.firstName} {p.lastName}
        </h2>
        <p className="text-muted-foreground">
          {p.position} • {p.overall} OVR • {formatDevTrait(p.devTrait)}
        </p>
        <p className="text-muted-foreground">
          {p.age} yrs • {getSeasonFormatting(p.yearsPro)} • {Math.floor(p.height / 12)}'{p.height % 12}" • {p.weight}{" "}
          lbs
        </p>
      </div>
    </div>
  )

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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto p-6">
        {" "}
        {/* Adjusted max-width, added max-h and overflow */}
        <DialogHeader>
          <DialogTitle>Player Comparison</DialogTitle>
          <DialogDescription>Compare two players side-by-side.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Player 1 Column */}
          <div className="flex flex-col">
            {renderPlayerInfo(player1, team1)}
            <Separator className="my-4" />
            <ScrollArea className="h-[calc(70vh-100px)] pr-4">
              {" "}
              {/* Adjusted height for scroll area */}
              {loadingPlayer1Stats ? (
                <div className="text-center text-muted-foreground">Loading stats...</div>
              ) : errorPlayer1Stats ? (
                <div className="text-red-400 text-center">{errorPlayer1Stats}</div>
              ) : (
                <>
                  {renderStatSection("Passing Stats", aggregatedPlayer1Stats, [
                    "passComp",
                    "passAtt",
                    "passYds",
                    "passTDs",
                    "passInts",
                    "passerRating",
                    "passSacks",
                  ])}
                  {renderStatSection("Rushing Stats", aggregatedPlayer1Stats, [
                    "rushAtt",
                    "rushYds",
                    "rushTDs",
                    "rushFum",
                    "rushYdsPerAtt",
                  ])}
                  {renderStatSection("Receiving Stats", aggregatedPlayer1Stats, [
                    "recCatches",
                    "recYds",
                    "recTDs",
                    "recDrops",
                  ])}
                  {renderStatSection("Defensive Stats", aggregatedPlayer1Stats, [
                    "defTotalTackles",
                    "defSacks",
                    "defInts",
                    "defFumRec",
                    "defForcedFum",
                    "defTDs",
                    "defDeflections",
                  ])}
                  {renderStatSection("Kicking Stats", aggregatedPlayer1Stats, [
                    "fGMade",
                    "fGAtt",
                    "xPMade",
                    "xPAtt",
                    "kickPts",
                    "fGLongest",
                  ])}
                  {renderStatSection("Punting Stats", aggregatedPlayer1Stats, [
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
            </ScrollArea>
          </div>

          {/* Player 2 Column */}
          <div className="flex flex-col">
            {player2 ? (
              <>
                {renderPlayerInfo(player2, team2)}
                <Separator className="my-4" />
                <ScrollArea className="h-[calc(70vh-100px)] pr-4">
                  {" "}
                  {/* Adjusted height for scroll area */}
                  {loadingPlayer2Stats ? (
                    <div className="text-center text-muted-foreground">Loading stats...</div>
                  ) : errorPlayer2Stats ? (
                    <div className="text-red-400 text-center">{errorPlayer2Stats}</div>
                  ) : (
                    <>
                      {renderStatSection("Passing Stats", aggregatedPlayer2Stats, [
                        "passComp",
                        "passAtt",
                        "passYds",
                        "passTDs",
                        "passInts",
                        "passerRating",
                        "passSacks",
                      ])}
                      {renderStatSection("Rushing Stats", aggregatedPlayer2Stats, [
                        "rushAtt",
                        "rushYds",
                        "rushTDs",
                        "rushFum",
                        "rushYdsPerAtt",
                      ])}
                      {renderStatSection("Receiving Stats", aggregatedPlayer2Stats, [
                        "recCatches",
                        "recYds",
                        "recTDs",
                        "recDrops",
                      ])}
                      {renderStatSection("Defensive Stats", aggregatedPlayer2Stats, [
                        "defTotalTackles",
                        "defSacks",
                        "defInts",
                        "defFumRec",
                        "defForcedFum",
                        "defTDs",
                        "defDeflections",
                      ])}
                      {renderStatSection("Kicking Stats", aggregatedPlayer2Stats, [
                        "fGMade",
                        "fGAtt",
                        "xPMade",
                        "xPAtt",
                        "kickPts",
                        "fGLongest",
                      ])}
                      {renderStatSection("Punting Stats", aggregatedPlayer2Stats, [
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
                </ScrollArea>
                <Button onClick={onRemovePlayer2} variant="outline" className="mt-4 bg-transparent">
                  Remove Player
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="mb-4">Select a player to compare.</p>
                <Button onClick={() => setIsPlayerSelectionDialogOpen(true)}>Select Player</Button>
              </div>
            )}
          </div>
        </div>
        {isPlayerSelectionDialogOpen && (
          <PlayerSelectionDialog
            leagueId={leagueId}
            teams={teams}
            onSelectPlayer={handleSelectPlayer2}
            onClose={() => setIsPlayerSelectionDialogOpen(false)}
            excludePlayerId={player1.rosterId}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
