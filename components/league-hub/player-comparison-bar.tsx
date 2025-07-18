import { cn } from "@/lib/utils"
interface PlayerComparisonBarProps {
  label: string
  value1: number
  value2: number
  maxValue: number
  isHigherBetter: boolean
  format?: (value: number) => string
}
export function PlayerComparisonBar({
  label,
  value1,
  value2,
  maxValue,
  isHigherBetter,
  format,
}: PlayerComparisonBarProps) {
  const percentage1 = (value1 / maxValue) * 100
  const percentage2 = (value2 / maxValue) * 100
  const getBarColor = (val: number, otherVal: number, isHigher: boolean) => {
    if (val === otherVal) return "bg-gray-500" // Neutral for tie
    if (isHigher) {
      return val > otherVal ? "bg-green-500" : "bg-white/30"
    } else {
      return val < otherVal ? "bg-green-500" : "bg-white/30"
    }
  }
  const color1 = getBarColor(value1, value2, isHigherBetter)
  const color2 = getBarColor(value2, value1, isHigherBetter)
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-300 text-center">{label}</span>
      <div className="flex items-center gap-2">
        {/* Player 1 Bar (fills from right) */}
        <div className="flex-1 flex justify-end">
          <div
            className={cn("h-4 rounded-l-full transition-all duration-300", color1)}
            style={{ width: `${percentage1}%` }}
          />
        </div>
        <span className="text-sm font-bold tabular-nums text-white w-10 text-center">
          {format ? format(value1) : value1.toFixed(0)}
        </span>
        <span className="text-sm font-bold tabular-nums text-white w-10 text-center">
          {format ? format(value2) : value2.toFixed(0)}
        </span>
        {/* Player 2 Bar (fills from left) */}
        <div className="flex-1 flex justify-start">
          <div
            className={cn("h-4 rounded-r-full transition-all duration-300", color2)}
            style={{ width: `${percentage2}%` }}
          />
        </div>
      </div>
    </div>
  )
}
