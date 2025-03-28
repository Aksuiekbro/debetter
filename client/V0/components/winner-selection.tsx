import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function WinnerSelection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Winner Selection</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup defaultValue="team1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="team1" id="team1" />
            <Label htmlFor="team1">Team 1 (Government)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="team2" id="team2" />
            <Label htmlFor="team2">Team 2 (Opposition)</Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

