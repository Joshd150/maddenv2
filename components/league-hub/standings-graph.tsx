import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TeamLogo } from "./team-logo"
import type { Standing, Team } from "@/lib/madden-types"
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react"

interface StandingsGraphProps {
  standings: Standing[]
  teams: Team[]
}

// NFL team colors mapping
const NFL_TEAM_COLORS: Record<string, string> = {
  // AFC East
  NE: "#002244", BUF: "#00338D", MIA: "#008E97", NYJ: "#125740",
  // AFC North  
  BAL: "#241773", CIN: "#FB4F14", CLE: "#311D00", PIT: "#FFB612",
  // AFC South
  HOU: "#03202F", IND: "#002C5F", JAX: "#006778", TEN: "#0C2340",
  // AFC West
  DEN: "#FB4F14", KC: "#E31837", LV: "#000000", LAC: "#0080C6",
  // NFC East
  DAL: "#003594", NYG: "#0B2265", PHI: "#004C54", WAS: "#5A1414",
  // NFC North
  CHI: "#0B162A", DET: "#0076B6", GB: "#203731", MIN: "#4F2683",
  // NFC South
  ATL: "#A71930", CAR: "#0085CA", NO: "#D3BC8D", TB: "#D50A0A",
  // NFC West
  ARI: "#97233F", LAR: "#003594", SF: "#AA0000", SEA: "#002244"
}

// Generate mock historical data for demonstration
function generateMockHistoricalData(standings: Standing[], teams: Team[]) {
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1)
  const teamMap = new Map(teams.map(t => [t.teamId, t]))
  
  return weeks.map(week => {
    const weekData: any = { week }
    
    // Get top 10 teams from current standings
    const topTeams = standings
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 10)
    
    topTeams.forEach(standing => {
      const team = teamMap.get(standing.teamId)
      if (team) {
        // Simulate rank progression with some variance
        const baseRank = standing.rank
        const variance = Math.random() * 4 - 2 // +/- 2 positions
        const weekRank = Math.max(1, Math.min(10, Math.round(baseRank + variance)))
        weekData[team.abbrName] = weekRank
      }
    })
    
    return weekData
  })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{`Week ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.dataKey}: #{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function StandingsGraph({ standings, teams }: StandingsGraphProps) {
  const [selectedConference, setSelectedConference] = useState<string>("all")
  const [selectedDivision, setSelectedDivision] = useState<string>("all")

  const historicalData = useMemo(() => 
    generateMockHistoricalData(standings, teams), 
    [standings, teams]
  )

  const filteredTeams = useMemo(() => {
    let filtered = standings.sort((a, b) => a.rank - b.rank).slice(0, 10)
    
    if (selectedConference !== "all") {
      filtered = filtered.filter(s => s.conferenceName?.toLowerCase() === selectedConference)
    }
    
    if (selectedDivision !== "all") {
      filtered = filtered.filter(s => s.divName?.toLowerCase().includes(selectedDivision))
    }
    
    return filtered
  }, [standings, selectedConference, selectedDivision])

  const teamMap = useMemo(() => 
    new Map(teams.map(t => [t.teamId, t])), 
    [teams]
  )

  const conferences = Array.from(new Set(standings.map(s => s.conferenceName?.toLowerCase()).filter(Boolean)))
  const divisions = Array.from(new Set(standings.map(s => s.divName?.toLowerCase()).filter(Boolean)))

  return (
    <Card className="vfl-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Standings Progression
        </CardTitle>
        <div className="flex flex-wrap gap-4">
          <Select value={selectedConference} onValueChange={setSelectedConference}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Conference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conferences</SelectItem>
              {conferences.map(conf => (
                <SelectItem key={conf} value={conf}>
                  {conf?.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map(div => (
                <SelectItem key={div} value={div}>
                  {div?.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[1, 10]}
                reversed
                stroke="hsl(var(--foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `#${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {filteredTeams.map(standing => {
                const team = teamMap.get(standing.teamId)
                if (!team) return null
                
                const teamColor = NFL_TEAM_COLORS[team.abbrName] || "#8B5CF6"
                
                return (
                  <Line
                    key={team.teamId}
                    type="monotone"
                    dataKey={team.abbrName}
                    stroke={teamColor}
                    strokeWidth={3}
                    dot={{ fill: teamColor, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: teamColor, strokeWidth: 2 }}
                    connectNulls={false}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Team Legend */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredTeams.map(standing => {
            const team = teamMap.get(standing.teamId)
            if (!team) return null
            
            const teamColor = NFL_TEAM_COLORS[team.abbrName] || "#8B5CF6"
            const rankChange = Math.random() > 0.5 ? 1 : -1 // Mock rank change
            
            return (
              <div key={team.teamId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: teamColor }}
                />
                <TeamLogo teamAbbr={team.abbrName} width={20} height={20} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{team.abbrName}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>#{standing.rank}</span>
                    {rankChange > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}