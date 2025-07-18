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
import { EnhancedPlayerDetailDialog } from "./enhanced-player-detail-dialog"
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

  return (
    <EnhancedPlayerDetailDialog
      player={player}
      teams={teams}
      leagueId={leagueId}
      onClose={onClose}
      initialComparePlayer={comparePlayer}
      onInitiateCompare={onInitiateCompare}
      onRemoveComparePlayer={handleRemoveCompare}
    />
  )
}
