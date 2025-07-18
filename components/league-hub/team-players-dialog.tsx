"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { Player, Team } from "@/lib/madden-types"
import { getTeamLogo, getDevTraitLogoUrl } from "@/lib/teamLogos"
import Image from "next/image"
import { PlayerDetailDialog } from "./player-detail-dialog"

interface TeamPlayersDialogProps {
  teamId: number
  onClose: () => void
  allTeams: Team[]
  allPlayers: Player[]
  leagueId: string
}

function getDevTraitName(trait: number) {
  switch (trait) {
    case 0:
      return "Normal"
    case 1:
      return "Star"
    case 2:
      return "Superstar"
    case 3:
      return "X-Factor"
    default:
      return "Normal"
  }
}

export function TeamPlayersDialog({ teamId, onClose, allTeams, allPlayers, leagueId }: TeamPlayersDialogProps) {
  const [search, setSearch] = useState("")
  const [sortColumn, setSortColumn] = useState<string>("overall")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isPlayerDetailDialogOpen, setIsPlayerDetailDialogOpen] = useState(false)
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(null)

  const team = useMemo(() => allTeams.find((t) => t.teamId === teamId), [teamId, allTeams])

  const playersOnTeam = useMemo(() => {
    return allPlayers.filter((player) => player.teamId === teamId)
  }, [teamId, allPlayers])

  const sortedAndFilteredPlayers = useMemo(() => {
    let filtered = playersOnTeam.filter((player) => {
      const playerName = `${player.firstName} ${player.lastName}`.toLowerCase()
      return playerName.includes(search.toLowerCase())
    })

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = (a as any)[sortColumn]
        const bValue = (b as any)[sortColumn]

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }
        return 0
      })
    }
    return filtered
  }, [playersOnTeam, search, sortColumn, sortDirection])

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("desc")
    }
  }

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayerForDetail(player)
    setIsPlayerDetailDialogOpen(true)
  }

  const handleClosePlayerDetailDialog = () => {
    setIsPlayerDetailDialogOpen(false)
    setSelectedPlayerForDetail(null)
  }

  if (!team) {
    return null
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col bg-zinc-900 border-primary/20 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
              <Image
                src={getTeamLogo(team.abbrName) || "/placeholder.svg"}
                alt={`${team.displayName} logo`}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
              {team.displayName} Roster
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View all players for the {team.displayName}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-shrink-0 mb-4">
            <Input
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("overall")}>
                      <div className="flex items-center gap-1">
                        OVR{" "}
                        {sortColumn === "overall" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>POS</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("devTrait")}>
                      <div className="flex items-center gap-1">
                        Dev Trait{" "}
                        {sortColumn === "devTrait" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredPlayers.length > 0 ? (
                    sortedAndFilteredPlayers.map((player) => (
                      <TableRow key={player.rosterId}>
                        <TableCell className="font-bold">{player.overall}</TableCell>
                        <TableCell>
                          <Button variant="link" onClick={() => handlePlayerClick(player)}>
                            {player.firstName} {player.lastName}
                          </Button>
                        </TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Image
                            src={getDevTraitLogoUrl(getDevTraitName(player.devTrait)) || "/placeholder.svg"}
                            alt={`${getDevTraitName(player.devTrait)} Dev Trait`}
                            width={20}
                            height={20}
                            className="inline-block"
                          />
                          {getDevTraitName(player.devTrait)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No players found for this team.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedPlayerForDetail && (
        <PlayerDetailDialog
          player={selectedPlayerForDetail}
          teams={allTeams}
          leagueId={leagueId}
          onClose={handleClosePlayerDetailDialog}
        />
      )}
    </>
  )
}
