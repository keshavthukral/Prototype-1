/**
 * ObjectVisual — renders a game object with its emoji icon and label.
 * Used across memory rounds and attention challenges.
 */

import {
  Apple,
  Armchair,
  Banana,
  BookOpen,
  BriefcaseBusiness,
  Circle,
  Clock3,
  Coffee,
  Flower2,
  Glasses,
  GlassWater,
  KeyRound,
  Lamp,
  Phone,
  Umbrella,
} from 'lucide-react'
import type { GameChoice } from '@/features/games/types'

/**
 * Best-effort icon mapping.
 * Falls back to Apple if an icon is not available in lucide-react.
 */
const iconMap: Record<string, typeof Apple> = {
  apple: Apple,
  banana: Banana,
  cup: Coffee,
  book: BookOpen,
  key: KeyRound,
  umbrella: Umbrella,
  clock: Clock3,
  flower: Flower2,
  chair: Armchair,
  ball: Circle,
  spoon: Coffee,      // no dedicated spoon icon in lucide
  glasses: Glasses,
  bag: BriefcaseBusiness,
  bottle: GlassWater,
  telephone: Phone,
  lamp: Lamp,
  plate: Coffee,      // no dedicated plate icon in lucide
  hat: Armchair,      // no dedicated hat icon in lucide
  ring: Circle,       // closest available
  shoe: Circle,       // no dedicated shoe icon in lucide
}

interface ObjectVisualProps {
  item: GameChoice
  compact?: boolean
  showLabel?: boolean
}

export function ObjectVisual({
  item,
  compact = false,
  showLabel = true,
}: ObjectVisualProps) {
  const Icon = iconMap[item.id] ?? Apple
  const size = compact ? 'size-8' : 'size-12'

  return (
    <div className="flex flex-col items-center justify-center">
      <Icon className={size} aria-hidden="true" />
      {showLabel && (
        <span
          className={`mt-2 font-semibold text-foreground ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          {item.label}
        </span>
      )}
    </div>
  )
}
