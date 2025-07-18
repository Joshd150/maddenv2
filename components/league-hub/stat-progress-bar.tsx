import { Progress } from "@/components/ui/progress"
interface StatProgressBarProps {
  label: string
  value: number
  maxValue?: number
}
export function StatProgressBar({ label, value, maxValue = 100 }: StatProgressBarProps) {
  const percentage = (value / maxValue) * 100
  const getProgressColor = (val: number) => {
    if (val >= 90) return "bg-green-500"
    if (val >= 80) return "bg-lime-500"
    if (val >= 70) return "bg-yellow-500"
    if (val >= 60) return "bg-orange-500"
    return "bg-red-500"
  }
  return (
    <div className="flex items-center gap-4">
      <span className="w-24 text-sm text-gray-300">{label}</span>
      <div className="flex-1 flex items-center gap-2">
        <Progress value={percentage} className={`h-2 ${getProgressColor(value)}`} />
        <span className="text-sm font-medium text-white w-8 text-right">{value}</span>
      </div>
    </div>
  )
}
