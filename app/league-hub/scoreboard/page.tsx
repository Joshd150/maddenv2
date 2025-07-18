import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ScoreboardPage() {
  return (
    <Card className="bg-muted/30 border-primary/20">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Live Scoreboard</CardTitle>
        <CardDescription>Real-time updates from games in progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>Live scoreboard coming soon...</p>
        </div>
      </CardContent>
    </Card>
  )
}
