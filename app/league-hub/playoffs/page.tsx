// app/league-hub/playoffs/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlayoffsPage() {
  return (
    <Card className="bg-muted/30 border-primary/20">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Playoff Bracket</CardTitle>
        <CardDescription>Visualize the path to the championship.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>Playoff bracket coming soon...</p>
        </div>
      </CardContent>
    </Card>
  )
}
